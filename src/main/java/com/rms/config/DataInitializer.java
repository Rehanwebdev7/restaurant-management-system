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
    private BusinessSettingRepository businessSettingRepository;

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

    @Autowired
    private MenuCategoryRepository menuCategoryRepository;

    @Autowired
    private SlidersRepository slidersRepository;

    @Override
    public void run(String... args) {
        System.out.println("🚀 [DATA INITIALIZER] Starting...");

        // Ensure localhost domain maps to Spice Garden (9800000001), not arbitrary first record
        try {
            UsersEntity spiceGarden = usersRepository.findByMobile("9800000001").orElse(null);
            if (spiceGarden != null) {
                java.util.Optional<BusinessSettingEntity> currentMapping =
                        businessSettingRepository.findByDomainUrl("localhost");
                boolean alreadyCorrect = currentMapping.isPresent() &&
                        currentMapping.get().getRestaurantId() != null &&
                        currentMapping.get().getRestaurantId().getId().equals(spiceGarden.getId());

                if (!alreadyCorrect) {
                    // Remove old wrong mapping
                    currentMapping.ifPresent(old -> {
                        old.setDomainUrl(null);
                        businessSettingRepository.save(old);
                    });
                    // Map localhost to Spice Garden's settings
                    businessSettingRepository.findByRestaurantId_Id(spiceGarden.getId())
                            .ifPresentOrElse(
                                    setting -> {
                                        setting.setDomainUrl("localhost");
                                        businessSettingRepository.save(setting);
                                        System.out.println("✅ Mapped localhost → Spice Garden (primary=" + setting.getPrimaryColor() + ")");
                                    },
                                    () -> System.out.println("⚠️ Spice Garden business settings not found")
                            );
                } else {
                    System.out.println("✅ localhost already mapped to Spice Garden");
                }
            }
        } catch (Exception e) {
            System.out.println("⚠️ Error mapping localhost domain: " + e.getMessage());
        }

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

        // Seed proper Veg/NonVeg menu for Spice Garden branch
        initializeSpiceGardenMenu();

        // Seed banner sliders for Spice Garden
        initializeSpiceGardenSliders();

        // Seed About Us content for Spice Garden
        initializeSpiceGardenAboutUs();

        // Restore Spice Garden logo URL in DB (from Pexels back to uploaded file)
        restoreSpiceGardenLogo();

        // Mark some items as trending/recommended
        markSpiceGardenTrendingItems();

        // Add food images by item/category name
        initializeMenuImages();

        // Initialize kitchen orders for testing
        initializeKitchenOrders();

        // Initialize delivery orders for testing
        initializeDeliveryOrders();

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

            // Link customer to restaurant if not already linked
            if (customer.getUserId() == null) {
                customer.setUserId(restaurant);
                customersRepository.save(customer);
                System.out.println("✅ Linked test customer " + customer.getMobileNumber() + " to restaurant");
            }

            // Skip if today's test orders already exist
            Long todayCount = ordersRepository.countTodayOrdersByKitchen(kitchenUser.getId());
            if (todayCount != null && todayCount >= 3) {
                System.out.println("✅ Kitchen test orders already exist for today (" + todayCount + "). Skipping.");
                return;
            }

            // Get first 3 menu items
            var menuItems = menuItemsRepository.findAll();
            if (menuItems.size() < 3) {
                System.out.println("⚠️  Not enough menu items found. Skipping kitchen orders initialization.");
                return;
            }

            // Create 3 orders with correct status values
            createKitchenOrder(customer, kitchenUser, restaurant, branch, menuItems.get(0), "PENDING", null);
            createKitchenOrder(customer, kitchenUser, restaurant, branch, menuItems.get(1), "PREPARING_ORDER", LocalDateTime.now().minusMinutes(10));
            createKitchenOrder(customer, kitchenUser, restaurant, branch, menuItems.get(2), "READY_FOR_ORDER", LocalDateTime.now().minusMinutes(25));

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
        if ("READY_FOR_ORDER".equals(status) || "READY".equals(status)) {
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

    private void initializeDeliveryOrders() {
        try {
            // Get delivery user Vikram Singh (9800000005)
            UsersEntity deliveryUser = usersRepository.findByMobileAndRole("9800000005", "delivery").orElse(null);

            if (deliveryUser == null) {
                System.out.println("⚠️  Delivery user (9800000005) not found. Skipping delivery orders initialization.");
                return;
            }

            // Get restaurant and branch
            UsersEntity restaurant = usersRepository.findByMobile("9800000001").orElse(null);
            UsersEntity branch = usersRepository.findByMobileAndRole("9800000002", "branch").orElse(null);

            if (restaurant == null || branch == null) {
                System.out.println("⚠️  Restaurant or Branch not found. Skipping delivery orders initialization.");
                return;
            }

            // Skip if test delivery orders already exist
            if (ordersRepository.findByOrderNumber("DEL-TEST-READY").isPresent()) {
                System.out.println("✅ Delivery test orders already exist. Skipping.");
                return;
            }

            // Get first customer or create
            CustomersEntity customer = customersRepository.findByMobileNumber("9000000001")
                .orElseGet(() -> {
                    CustomersEntity newCustomer = new CustomersEntity();
                    newCustomer.setName("Neha Gupta");
                    newCustomer.setEmail("neha.delivery@example.com");
                    newCustomer.setMobileNumber("9000000001");
                    newCustomer.setIsActive(true);
                    newCustomer.setCreatedAt(LocalDateTime.now());
                    newCustomer.setUpdatedAt(LocalDateTime.now());
                    return customersRepository.save(newCustomer);
                });

            // Link customer to restaurant if not already linked
            if (customer.getUserId() == null) {
                customer.setUserId(restaurant);
                customersRepository.save(customer);
                System.out.println("✅ Linked test customer " + customer.getMobileNumber() + " to restaurant");
            }

            // Get first 2 menu items
            var menuItems = menuItemsRepository.findAll();
            if (menuItems.size() < 2) {
                System.out.println("⚠️  Not enough menu items found. Skipping delivery orders initialization.");
                return;
            }

            // Order 1: Ready for pickup (unassigned, visible to all delivery staff)
            createDeliveryOrder(customer, restaurant, branch, deliveryUser, menuItems.get(0),
                "DEL-TEST-READY", "READY_FOR_ORDER", "READY_FOR_ORDER", null,
                LocalDateTime.now().minusMinutes(5), null);

            // Order 2: In-progress (assigned to Vikram Singh)
            createDeliveryOrder(customer, restaurant, branch, deliveryUser, menuItems.get(1),
                "DEL-TEST-ONWAY", "OUT_FOR_DELIVERY", "OUT_FOR_DELIVERY", deliveryUser,
                LocalDateTime.now().minusMinutes(5), LocalDateTime.now().minusMinutes(15));

            System.out.println("✅ Delivery orders initialized successfully!");
        } catch (Exception e) {
            System.out.println("⚠️  Error initializing delivery orders: " + e.getMessage());
        }
    }

    private void createDeliveryOrder(CustomersEntity customer, UsersEntity restaurant, UsersEntity branch,
                                      UsersEntity defaultDeliveryUser, MenuItemsEntity menuItem, String orderNumber,
                                      String status, String deliveryStatus, UsersEntity assignedDeliveryUser,
                                      LocalDateTime kitchenReadyAt, LocalDateTime deliveryAcceptAt) {
        if (ordersRepository.findByOrderNumber(orderNumber).isPresent()) {
            return;
        }

        OrdersEntity order = new OrdersEntity();
        order.setOrderNumber(orderNumber);
        order.setOrderType("DELIVERY");
        order.setRestaurantId(restaurant);
        order.setBranchId(branch);
        order.setKitchenId(null);
        order.setDeliveryId(assignedDeliveryUser);
        order.setCustomerId(customer);
        order.setStatus(status);
        order.setDeliveryStatus(deliveryStatus);
        order.setPaymentStatus("PENDING");
        order.setPaymentMethod("CASH");
        order.setSubtotal(new BigDecimal("500.00"));
        order.setTaxAmount(new BigDecimal("50.00"));
        order.setDiscountAmount(new BigDecimal("0.00"));
        order.setDeliveryFee(new BigDecimal("40.00"));
        order.setTotalAmount(new BigDecimal("590.00"));
        order.setCustomerName(customer.getName());
        order.setCustomerPhone(customer.getMobileNumber());
        order.setCustomerEmail(customer.getEmail());
        order.setSpecialInstructions("Test delivery order");
        order.setEstimatedTime(30);
        order.setKitchenReadyAt(kitchenReadyAt);
        order.setDeliveryAcceptAt(deliveryAcceptAt);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        OrdersEntity savedOrder = ordersRepository.save(order);

        // Create order item
        OrderItemsEntity orderItem = new OrderItemsEntity();
        orderItem.setOrderId(savedOrder);
        orderItem.setMenuItemId(menuItem);
        orderItem.setKitchenId(null);
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

    private void initializeMenuImages() {
        try {
            java.util.Map<String, String> itemImages = new java.util.HashMap<>();
            // Starters
            itemImages.put("Paneer Tikka",        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop");
            itemImages.put("Veg Spring Rolls",    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop");
            itemImages.put("Samosa (2 pcs)",      "https://images.unsplash.com/photo-1601050760570-4f22af6c0d76?w=400&h=300&fit=crop");
            itemImages.put("Hara Bhara Kabab",    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop");
            itemImages.put("Chicken Tikka",       "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop");
            itemImages.put("Seekh Kebab",         "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop");
            itemImages.put("Chicken Wings",       "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop");
            // Main Course
            itemImages.put("Dal Makhani",         "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop");
            itemImages.put("Palak Paneer",        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop");
            itemImages.put("Paneer Butter Masala","https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop");
            itemImages.put("Aloo Matar",          "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop");
            itemImages.put("Shahi Paneer",        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop");
            itemImages.put("Butter Chicken",      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop");
            itemImages.put("Mutton Rogan Josh",   "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop");
            itemImages.put("Chicken Masala",      "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&h=300&fit=crop");
            itemImages.put("Mutton Keema",        "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop");
            // Biryani
            itemImages.put("Veg Biryani",         "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            itemImages.put("Paneer Biryani",      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            itemImages.put("Chicken Biryani",     "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            itemImages.put("Mutton Biryani",      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            itemImages.put("Egg Biryani",         "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            // Breads
            itemImages.put("Butter Naan",         "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop");
            itemImages.put("Tandoori Roti",       "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop");
            itemImages.put("Garlic Naan",         "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop");
            itemImages.put("Paratha",             "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop");
            // Desserts
            itemImages.put("Gulab Jamun (2 pcs)", "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop");
            itemImages.put("Kulfi Falooda",       "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop");
            itemImages.put("Rasmalai",            "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop");
            // Beverages
            itemImages.put("Mango Lassi",         "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&h=300&fit=crop");
            itemImages.put("Masala Chai",         "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop");
            itemImages.put("Cold Coffee",         "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop");
            itemImages.put("Fresh Lime Soda",     "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop");
            itemImages.put("Rose Milk",           "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=400&h=300&fit=crop");

            int updated = 0;
            for (MenuItemsEntity item : menuItemsRepository.findAll()) {
                if ((item.getImageUrl() == null || item.getImageUrl().isBlank()) && itemImages.containsKey(item.getName())) {
                    item.setImageUrl(itemImages.get(item.getName()));
                    menuItemsRepository.save(item);
                    updated++;
                }
            }
            System.out.println("✅ Menu item images updated: " + updated);

            java.util.Map<String, String> catImages = new java.util.HashMap<>();
            catImages.put("Starters",     "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop");
            catImages.put("Main Course",  "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop");
            catImages.put("Biryani",      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop");
            catImages.put("Breads",       "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop");
            catImages.put("Desserts",     "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop");
            catImages.put("Beverages",    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop");
            catImages.put("Recommended",  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop");

            int catUpdated = 0;
            for (MenuCategoryEntity cat : menuCategoryRepository.findAll()) {
                if ((cat.getIconUrl() == null || cat.getIconUrl().isBlank()) && catImages.containsKey(cat.getName())) {
                    cat.setIconUrl(catImages.get(cat.getName()));
                    menuCategoryRepository.save(cat);
                    catUpdated++;
                }
            }
            System.out.println("✅ Menu category images updated: " + catUpdated);
        } catch (Exception e) {
            System.out.println("⚠️ Could not update menu images: " + e.getMessage());
        }
    }

    private void initializeSpiceGardenMenu() {
        try {
            UsersEntity restaurant = usersRepository.findByMobile("9800000001").orElse(null);
            UsersEntity branch = usersRepository.findByMobileAndRole("9800000002", "branch").orElse(null);
            if (restaurant == null || branch == null) {
                System.out.println("⚠️ Spice Garden restaurant/branch not found. Skipping menu seed.");
                return;
            }

            // Idempotent — skip if already seeded
            boolean alreadyDone = menuCategoryRepository
                .findByBranchId_IdAndIsActiveTrueAndIsDeletedFalse(branch.getId())
                .stream().anyMatch(c -> "Veg Starters".equals(c.getName()));
            if (alreadyDone) {
                System.out.println("✅ Spice Garden menu already seeded");
                return;
            }

            // Soft-delete existing categories + their items for this branch
            java.util.List<MenuCategoryEntity> oldCats = menuCategoryRepository
                .findByBranchId_IdAndIsActiveTrueAndIsDeletedFalse(branch.getId());
            for (MenuCategoryEntity cat : oldCats) {
                java.util.List<MenuItemsEntity> oldItems = menuItemsRepository
                    .findByMenuCategoryId_IdAndIsDeletedFalse(cat.getId());
                oldItems.forEach(i -> { i.setIsDeleted(true); i.setIsActive(false); });
                menuItemsRepository.saveAll(oldItems);
                cat.setIsDeleted(true); cat.setIsActive(false); cat.setUpdatedAt(LocalDateTime.now());
            }
            menuCategoryRepository.saveAll(oldCats);

            String b = "https://images.unsplash.com/";

            // --- Create 7 categories ---
            MenuCategoryEntity vegStarters   = mkCat(restaurant, branch, "Veg Starters",        1, "5", b + "photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop");
            MenuCategoryEntity nonVegStarters = mkCat(restaurant, branch, "Non-Veg Starters",    2, "5", b + "photo-1599487488170-d11ec9c172f0?w=200&h=200&fit=crop");
            MenuCategoryEntity vegMain        = mkCat(restaurant, branch, "Veg Main Course",     3, "5", b + "photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop");
            MenuCategoryEntity nonVegMain     = mkCat(restaurant, branch, "Non-Veg Main Course", 4, "5", b + "photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop");
            MenuCategoryEntity biryani        = mkCat(restaurant, branch, "Biryani",             5, "5", b + "photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop");
            MenuCategoryEntity beverages      = mkCat(restaurant, branch, "Beverages",           6, "0", b + "photo-1544145945-f90425340c7e?w=200&h=200&fit=crop");
            MenuCategoryEntity desserts       = mkCat(restaurant, branch, "Desserts",            7, "0", b + "photo-1551024506-0bccd828d307?w=200&h=200&fit=crop");

            // --- Veg Starters ---
            mkItem(restaurant, branch, vegStarters, "Paneer Tikka",       280, true,  b + "photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegStarters, "Veg Spring Roll",    180, true,  b + "photo-1563245372-f21724e3856d?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegStarters, "Hara Bhara Kabab",   220, true,  b + "photo-1513042966880-9b1c57e02b72?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegStarters, "Samosa (2 pcs)",     120, true,  b + "photo-1601050760570-4f22af6c0d76?w=400&h=300&fit=crop");

            // --- Non-Veg Starters ---
            mkItem(restaurant, branch, nonVegStarters, "Chicken Tikka",   320, false, b + "photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegStarters, "Seekh Kebab",     350, false, b + "photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegStarters, "Fish Fry",        380, false, b + "photo-1580822184713-fc5400e7fe10?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegStarters, "Chicken Wings",   300, false, b + "photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop");

            // --- Veg Main Course ---
            mkItem(restaurant, branch, vegMain, "Dal Makhani",            250, true,  b + "photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegMain, "Palak Paneer",           280, true,  b + "photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegMain, "Paneer Butter Masala",   300, true,  b + "photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegMain, "Shahi Paneer",           320, true,  b + "photo-1588166524941-3bf61a9c41db?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, vegMain, "Aloo Matar",             200, true,  b + "photo-1547592180-85f173990554?w=400&h=300&fit=crop");

            // --- Non-Veg Main Course ---
            mkItem(restaurant, branch, nonVegMain, "Butter Chicken",      380, false, b + "photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegMain, "Mutton Rogan Josh",   450, false, b + "photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegMain, "Chicken Masala",      350, false, b + "photo-1548943487-a2e4e43b4853?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegMain, "Mutton Keema",        400, false, b + "photo-1574484284002-952d92456975?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, nonVegMain, "Egg Curry",           280, false, b + "photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop");

            // --- Biryani ---
            mkItem(restaurant, branch, biryani, "Veg Biryani",            280, true,  b + "photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, biryani, "Paneer Biryani",         320, true,  b + "photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, biryani, "Chicken Biryani",        350, false, b + "photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, biryani, "Mutton Biryani",         420, false, b + "photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, biryani, "Egg Biryani",            300, false, b + "photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop");

            // --- Beverages ---
            mkItem(restaurant, branch, beverages, "Mango Lassi",           80, true,  b + "photo-1540146037884-0b3c8c6a89e6?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, beverages, "Sweet Lassi",           70, true,  b + "photo-1488477181946-6428a0291777?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, beverages, "Masala Chai",           40, true,  b + "photo-1556742400-b5b7c512e389?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, beverages, "Cold Coffee",          120, true,  b + "photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, beverages, "Fresh Lime Soda",       60, true,  b + "photo-1513558161293-cdaf765ed2fd?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, beverages, "Mango Shake",          100, true,  b + "photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop");

            // --- Desserts ---
            mkItem(restaurant, branch, desserts, "Gulab Jamun (2 pcs)",    80, true,  b + "photo-1602853186960-c8e4bdfbdaf9?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, desserts, "Kulfi Falooda",         120, true,  b + "photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, desserts, "Rasmalai",              100, true,  b + "photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop");
            mkItem(restaurant, branch, desserts, "Ice Cream",              80, true,  b + "photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop");

            System.out.println("✅ Spice Garden menu seeded: 7 categories, 33 items");
        } catch (Exception e) {
            System.out.println("⚠️ Error seeding Spice Garden menu: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void initializeSpiceGardenSliders() {
        try {
            UsersEntity restaurant = usersRepository.findByMobile("9800000001").orElse(null);
            if (restaurant == null) return;

            // Skip if sliders already exist for this restaurant
            if (!slidersRepository.findByRestaurantId_IdAndPlatformIgnoreCase(restaurant.getId(), "web").isEmpty()) {
                System.out.println("✅ Spice Garden sliders already exist");
                return;
            }

            // 3 banner slides using Pexels (free, no API key needed)
            String[][] slides = {
                {
                    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "Welcome to Spice Garden",
                    "Authentic flavors, crafted with love"
                },
                {
                    "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "Explore Our Menu",
                    "Veg & Non-Veg delicacies for every taste"
                },
                {
                    "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "Fresh Biryani & More",
                    "Order now and enjoy a royal feast"
                }
            };

            for (String[] slide : slides) {
                SlidersEntity slider = new SlidersEntity();
                slider.setRestaurantId(restaurant);
                slider.setImageUrl(slide[0]);
                slider.setTitle(slide[1]);
                slider.setDescription(slide[2]);
                slider.setPlatform("web");
                slidersRepository.save(slider);
            }
            System.out.println("✅ Spice Garden sliders seeded: 3 banners");
        } catch (Exception e) {
            System.out.println("⚠️ Error seeding sliders: " + e.getMessage());
        }
    }

    private void initializeSpiceGardenAboutUs() {
        try {
            UsersEntity spiceGarden = usersRepository.findByMobile("9800000001").orElse(null);
            if (spiceGarden == null) return;

            java.util.Optional<BusinessSettingEntity> setting = businessSettingRepository.findByRestaurantId_Id(spiceGarden.getId());
            if (setting.isEmpty()) {
                System.out.println("✅ Spice Garden About Us already set");
                return;
            }

            BusinessSettingEntity bse = setting.get();
            String currentAboutUs = bse.getAboutUs();
            if (currentAboutUs != null && !currentAboutUs.trim().isEmpty()) {
                System.out.println("✅ Spice Garden About Us already set");
                return;
            }

            bse.setAboutUs("Welcome to Spice Garden — your destination for authentic Indian flavors in the heart of the city. We take pride in crafting every dish with fresh ingredients, traditional spices, and a whole lot of love. From sizzling starters to hearty biryanis, every bite tells a story.");
            bse.setOurMission("To serve genuine Indian cuisine that brings families and friends together — consistently fresh, flavorful, and memorable.");
            bse.setOurVision("To be the most loved Indian restaurant brand, known for quality food, warm hospitality, and a dining experience that feels like home.");
            businessSettingRepository.save(bse);
            System.out.println("✅ Spice Garden About Us seeded");
        } catch (Exception e) {
            System.out.println("⚠️ Error seeding About Us: " + e.getMessage());
        }
    }

    private void markSpiceGardenTrendingItems() {
        try {
            UsersEntity spiceGarden = usersRepository.findByMobile("9800000001").orElse(null);
            UsersEntity branch = usersRepository.findByMobileAndRole("9800000002", "branch").orElse(null);
            if (spiceGarden == null || branch == null) return;

            String[] trendingNames = {
                "Paneer Tikka",
                "Chicken Tikka",
                "Dal Makhani",
                "Butter Chicken",
                "Chicken Biryani",
                "Gulab Jamun (2 pcs)"
            };

            java.util.List<MenuItemsEntity> items = menuItemsRepository.findByBranchId_IdAndIsDeletedFalse(branch.getId());
            int updated = 0;
            for (MenuItemsEntity item : items) {
                for (String name : trendingNames) {
                    if (item.getName().equalsIgnoreCase(name) && !item.getIsRecommended()) {
                        item.setIsRecommended(true);
                        menuItemsRepository.save(item);
                        updated++;
                        break;
                    }
                }
            }
            if (updated > 0) {
                System.out.println("✅ Spice Garden trending items marked: " + updated);
            } else {
                System.out.println("✅ Spice Garden trending items already marked");
            }
        } catch (Exception e) {
            System.out.println("⚠️ Error marking trending items: " + e.getMessage());
        }
    }

    private MenuCategoryEntity mkCat(UsersEntity restaurant, UsersEntity branch,
                                      String name, int priority, String taxPct, String iconUrl) {
        MenuCategoryEntity cat = new MenuCategoryEntity();
        cat.setRestaurantId(restaurant);
        cat.setBranchId(branch);
        cat.setName(name);
        cat.setPriority(priority);
        cat.setTaxPercentage(new java.math.BigDecimal(taxPct));
        cat.setIconUrl(iconUrl);
        cat.setIsActive(true);
        cat.setIsDeleted(false);
        cat.setCreatedAt(LocalDateTime.now());
        cat.setUpdatedAt(LocalDateTime.now());
        return menuCategoryRepository.save(cat);
    }

    private void mkItem(UsersEntity restaurant, UsersEntity branch, MenuCategoryEntity category,
                        String name, int price, boolean isVeg, String imageUrl) {
        MenuItemsEntity item = new MenuItemsEntity();
        item.setRestaurantId(restaurant);
        item.setBranchId(branch);
        item.setMenuCategoryId(category);
        item.setName(name);
        item.setMrp(new java.math.BigDecimal(price));
        item.setPrice(new java.math.BigDecimal(price));
        item.setDietaryType(isVeg);
        // Ensure Unsplash URLs render correctly
        String fixedUrl = (imageUrl != null && imageUrl.contains("unsplash.com") && !imageUrl.contains("auto=format"))
                ? imageUrl + "&auto=format&q=80" : imageUrl;
        item.setImageUrl(fixedUrl);
        item.setIsActive(true);
        item.setIsDeleted(false);
        item.setIsRecommended(false);
        item.setAvailableOnline(true);
        item.setSystemRating(new java.math.BigDecimal("4.5"));
        item.setRatingCount(0);
        item.setCreatedAt(LocalDateTime.now());
        menuItemsRepository.save(item);
    }

    private void restoreSpiceGardenLogo() {
        try {
            UsersEntity spiceGarden = usersRepository.findByMobile("9800000001").orElse(null);
            if (spiceGarden == null) return;

            businessSettingRepository.findByRestaurantId_Id(spiceGarden.getId()).ifPresent(bse -> {
                String current = bse.getLogoUrl();
                if (current != null && current.contains("pexels.com")) {
                    bse.setLogoUrl("http://localhost:8090/rms/uploads/branding_42/logo_42.png");
                    businessSettingRepository.save(bse);
                    System.out.println("✅ Spice Garden logo restored to uploaded file");
                } else {
                    System.out.println("✅ Spice Garden logo already correct: " + current);
                }
            });
        } catch (Exception e) {
            System.out.println("⚠️ Error restoring logo: " + e.getMessage());
        }
    }
}
