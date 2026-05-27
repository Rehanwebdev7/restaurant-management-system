package com.rms.modules.cashier.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.rms.common.entities.OrderPaymentsEntity;
import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.OrderPaymentsRepository;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.PaymentGatewayUtil;
import com.rms.configuration.Authorization;

import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class CashPayPalService {

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

    public Map<String, Object> createOrder(Long orderId, String token) throws Exception {
        Authorization.authorizeCashier(token);

        Long restaurantId = ordersRepository.findRestaurantIdByOrderId(orderId);
        if (restaurantId == null) throw new RuntimeException("Order not found: " + orderId);

        BigDecimal totalAmount = ordersRepository.findTotalAmountById(orderId);
        if (totalAmount == null) totalAmount = BigDecimal.ZERO;

        PaymentGatewayEntity gateway = paymentGatewayRepository
            .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(restaurantId, "paypal", true, "ON")
            .orElseThrow(() -> new RuntimeException("PayPal not configured for this restaurant"));

        Map<String, Object> result = paymentGatewayUtil.createPayPalOrder(orderId, totalAmount, gateway);
        return result;
    }

    @Transactional
    public Map<String, Object> captureOrder(String paypalOrderId, Long orderId, String token) throws Exception {
        Authorization.authorizeCashier(token);

        Long restaurantId = ordersRepository.findRestaurantIdByOrderId(orderId);
        if (restaurantId == null) throw new RuntimeException("Order not found: " + orderId);

        Long branchId = ordersRepository.findBranchIdByOrderId(orderId);

        PaymentGatewayEntity gateway = paymentGatewayRepository
            .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(restaurantId, "paypal", true, "ON")
            .orElseThrow(() -> new RuntimeException("PayPal not configured"));

        Map<String, Object> result = paymentGatewayUtil.capturePayPalOrder(paypalOrderId, gateway);

        if ("COMPLETED".equals(result.get("status"))) {
            UsersEntity restaurant = usersRepository.getReferenceById(restaurantId);
            UsersEntity branch = branchId != null ? usersRepository.getReferenceById(branchId) : null;

            OrderPaymentsEntity payment = new OrderPaymentsEntity();
            payment.setOnlineOrderId(ordersRepository.getReferenceById(orderId));
            payment.setRestaurantId(restaurant);
            payment.setBranchId(branch);
            payment.setPaymentMethod("PG");
            payment.setPaymentGateway("paypal");
            payment.setGatewayTransactionId(result.get("captureId").toString());
            payment.setAmount(new BigDecimal(result.get("amount").toString()));
            payment.setPaymentStatus("COMPLETED");
            payment.setPaymentTime(LocalDateTime.now());
            orderPaymentsRepository.save(payment);

            ordersRepository.updateOrderPaymentSnapshot(orderId, "COMPLETED", "COMPLETED", "PG", "PayPal",
                result.get("captureId").toString(), paypalOrderId);
        }

        return result;
    }
}
