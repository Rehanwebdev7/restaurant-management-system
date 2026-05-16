package com.rms.config;

import com.rms.common.entities.*;
import com.rms.common.repositories.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private CustomersRepository customersRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private OrderItemsRepository orderItemsRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private MenuItemsRepository menuItemsRepository;

    @Override
    public void run(String... args) {
        System.out.println("🚀 [DATA INITIALIZER] Starting...");

        // Check if "Free" plan already exists — if not, create it
        subscriptionPlanRepository
            .findFirstByPlanNameIgnoreCaseAndIsDeletedFalse("Free")
            .ifPresentOrElse(
                plan -> System.out.println("✅ Free plan already exists: " + plan.getPlanId()),
                () -> {
                    SubscriptionPlanEntity freePlan = new SubscriptionPlanEntity();
                    freePlan.setPlanName("Free");
                    freePlan.setDescription("Default free trial plan - 30 days");
                    freePlan.setPrice(BigDecimal.ZERO);
                    freePlan.setDurationDays(30);
                    freePlan.setMaxBranch(1);
                    freePlan.setMaxKitchen(1);
                    freePlan.setMaxDeliveryBoy(1);
                    freePlan.setFeatures("1 Branch, 1 Kitchen, 1 Delivery Boy");
                    freePlan.setSortOrder(0);

                    subscriptionPlanRepository.save(freePlan);
                    System.out.println("✅ Free plan created successfully!");
                }
            );

        // Initialize kitchen orders for testing
        initializeKitchenOrders();

        System.out.println("✅ [DATA INITIALIZER] Done");
    }

    private void initializeKitchenOrders() {
        try {
            // Create or get customer with phone 9000000004
            CustomersEntity customer = customersRepository.findByMobileNumber("9000000004")
                .orElseGet(() -> {
                    CustomersEntity newCustomer = new CustomersEntity();
                    newCustomer.setName("Rajesh Kumar");
                    newCustomer.setEmail("rajesh.demo@example.com");
                    newCustomer.setMobileNumber("9000000004");
                    newCustomer.setIsActive(true);
                    newCustomer.setIsFirstOrder(true);
                    newCustomer.setCreatedAt(LocalDateTime.now());
                    newCustomer.setUpdatedAt(LocalDateTime.now());
                    return customersRepository.save(newCustomer);
                });

            // Get Chef Mohan (kitchen user with mobile 9800000004)
            UsersEntity kitchenUser = usersRepository.findByMobileAndRole("9800000004", "kitchen").orElse(null);

            if (kitchenUser == null) {
                System.out.println("⚠️  Kitchen user (9800000004) not found. Skipping kitchen orders initialization.");
                return;
            }

            // Get restaurant and branch
            UsersEntity restaurant = usersRepository.findByMobile("9800000001").orElse(null);
            UsersEntity branch = usersRepository.findByMobileAndRole("9800000002", "branch").orElse(null);

            if (restaurant == null || branch == null) {
                System.out.println("⚠️  Restaurant or Branch not found. Skipping kitchen orders initialization.");
                return;
            }

            // Get first 3 menu items
            var menuItems = menuItemsRepository.findAll();
            if (menuItems.size() < 3) {
                System.out.println("⚠️  Not enough menu items found. Skipping kitchen orders initialization.");
                return;
            }

            // Create 3 orders: PENDING, PREPARING, READY
            createKitchenOrder(customer, kitchenUser, restaurant, branch, menuItems.get(0), "PENDING", null);
            createKitchenOrder(customer, kitchenUser, restaurant, branch, menuItems.get(1), "PREPARING", LocalDateTime.now().minusMinutes(10));
            createKitchenOrder(customer, kitchenUser, restaurant, branch, menuItems.get(2), "READY", LocalDateTime.now().minusMinutes(25));

            System.out.println("✅ Kitchen orders initialized successfully!");
        } catch (Exception e) {
            System.out.println("⚠️  Error initializing kitchen orders: " + e.getMessage());
        }
    }

    private void createKitchenOrder(CustomersEntity customer, UsersEntity kitchenUser, UsersEntity restaurant,
                                    UsersEntity branch, MenuItemsEntity menuItem, String status, LocalDateTime kitchenAcceptTime) {
        // Check if order already exists
        String orderNumber = "KIT-" + System.currentTimeMillis() + "-" + status;
        if (ordersRepository.findByOrderNumber(orderNumber).isPresent()) {
            return;
        }

        OrdersEntity order = new OrdersEntity();
        order.setOrderNumber(orderNumber);
        order.setOrderType("DINE_IN");
        order.setRestaurantId(restaurant);
        order.setBranchId(branch);
        order.setKitchenId(kitchenUser);
        order.setCustomerId(customer);
        order.setStatus(status);
        order.setPaymentStatus("PENDING");
        order.setPaymentMethod("CASH");
        order.setSubtotal(new BigDecimal("500.00"));
        order.setTaxAmount(new BigDecimal("50.00"));
        order.setDiscountAmount(new BigDecimal("0.00"));
        order.setDeliveryFee(new BigDecimal("0.00"));
        order.setTotalAmount(new BigDecimal("550.00"));
        order.setCustomerName(customer.getName());
        order.setCustomerPhone(customer.getMobileNumber());
        order.setCustomerEmail(customer.getEmail());
        order.setSpecialInstructions("Test order for kitchen display");
        order.setEstimatedTime(20);
        order.setKitchenAcceptAt(kitchenAcceptTime);
        if ("READY".equals(status)) {
            order.setKitchenReadyAt(LocalDateTime.now().minusMinutes(5));
        }
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        OrdersEntity savedOrder = ordersRepository.save(order);

        // Create order item
        OrderItemsEntity orderItem = new OrderItemsEntity();
        orderItem.setOrderId(savedOrder);
        orderItem.setMenuItemId(menuItem);
        orderItem.setKitchenId(kitchenUser);
        orderItem.setMenuItemName(menuItem.getName() + " - " + status);
        orderItem.setPrice(new BigDecimal("250.00"));
        orderItem.setQuantity(2);
        orderItem.setAddonsTotal(new BigDecimal("0.00"));
        orderItem.setItemTotal(new BigDecimal("500.00"));
        orderItem.setStatus(status);
        orderItem.setCreatedAt(LocalDateTime.now());
        orderItem.setUpdatedAt(LocalDateTime.now());

        orderItemsRepository.save(orderItem);
    }
}
