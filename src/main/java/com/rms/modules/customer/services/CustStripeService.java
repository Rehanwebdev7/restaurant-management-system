package com.rms.modules.customer.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rms.common.entities.OrderPaymentsEntity;
import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.OrderPaymentsRepository;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.PaymentGatewayUtil;
import com.rms.configuration.Authorization;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CustStripeService {

    @Autowired
    private PaymentGatewayUtil paymentGatewayUtil;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private OrderPaymentsRepository orderPaymentsRepository;

    @Autowired
    private PaymentGatewayRepository paymentGatewayRepository;

    @Autowired
    private UsersRepository usersRepository;

    public Map<String, Object> createPaymentIntent(Long orderId, String token) throws Exception {
        Authorization.authorizeCustomer(token);

        Long restaurantId = ordersRepository.findRestaurantIdByOrderId(orderId);
        if (restaurantId == null) throw new RuntimeException("Order not found: " + orderId);

        BigDecimal totalAmount = ordersRepository.findTotalAmountById(orderId);
        if (totalAmount == null) totalAmount = BigDecimal.ZERO;

        PaymentGatewayEntity gateway = paymentGatewayRepository
            .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(restaurantId, "stripe", true, "ON")
            .orElseThrow(() -> new RuntimeException("Stripe not configured for this restaurant"));

        return paymentGatewayUtil.createStripePaymentIntent(orderId, totalAmount, gateway);
    }

    @Transactional
    public Map<String, Object> confirmPayment(String paymentIntentId, Long orderId, String token) throws Exception {
        Authorization.authorizeCustomer(token);

        Long restaurantId = ordersRepository.findRestaurantIdByOrderId(orderId);
        if (restaurantId == null) throw new RuntimeException("Order not found: " + orderId);

        Long branchId = ordersRepository.findBranchIdByOrderId(orderId);

        PaymentGatewayEntity gateway = paymentGatewayRepository
            .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(restaurantId, "stripe", true, "ON")
            .orElseThrow(() -> new RuntimeException("Stripe not configured"));

        Map<String, Object> result = paymentGatewayUtil.retrieveStripePaymentIntent(paymentIntentId, gateway);

        if ("succeeded".equals(result.get("status"))) {
            UsersEntity restaurant = usersRepository.getReferenceById(restaurantId);
            UsersEntity branch = branchId != null ? usersRepository.getReferenceById(branchId) : null;

            OrderPaymentsEntity payment = new OrderPaymentsEntity();
            payment.setOnlineOrderId(ordersRepository.getReferenceById(orderId));
            payment.setRestaurantId(restaurant);
            payment.setBranchId(branch);
            payment.setPaymentMethod("PG");
            payment.setPaymentGateway("stripe");
            payment.setGatewayTransactionId(paymentIntentId);
            payment.setAmount(new BigDecimal(result.get("amount").toString()));
            payment.setPaymentStatus("COMPLETED");
            payment.setPaymentTime(LocalDateTime.now());
            orderPaymentsRepository.save(payment);

            ordersRepository.updateOrderPaymentSnapshot(orderId, "COMPLETED", "COMPLETED", "PG", "Stripe",
                paymentIntentId, paymentIntentId);
        }

        return result;
    }
}
