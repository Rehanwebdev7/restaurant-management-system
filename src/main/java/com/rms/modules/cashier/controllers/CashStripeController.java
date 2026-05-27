package com.rms.modules.cashier.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rms.common.response.ApiResponse;
import com.rms.modules.cashier.services.CashStripeService;
import com.rms.common.repositories.OrderPaymentsRepository;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.util.PaymentGatewayUtil;
import com.rms.common.entities.PaymentGatewayEntity;
import com.stripe.model.Event;

import java.util.Map;
import java.util.Optional;

@RestController
public class CashStripeController {

    @Autowired
    private CashStripeService stripeService;

    @Autowired
    private OrderPaymentsRepository orderPaymentsRepository;

    @Autowired
    private PaymentGatewayRepository paymentGatewayRepository;

    @Autowired
    private PaymentGatewayUtil paymentGatewayUtil;

    @PostMapping("/api/cashier/stripe/create-payment-intent")
    public ResponseEntity<Object> createPaymentIntent(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> requestBody) {
        try {
            Long orderId = Long.parseLong(requestBody.get("orderId").toString());
            Map<String, Object> result = stripeService.createPaymentIntent(orderId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "PaymentIntent created");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PostMapping("/api/cashier/stripe/confirm-payment")
    public ResponseEntity<Object> confirmPayment(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> requestBody) {
        try {
            String paymentIntentId = requestBody.get("paymentIntentId").toString();
            Long orderId = Long.parseLong(requestBody.get("orderId").toString());
            Map<String, Object> result = stripeService.confirmPayment(paymentIntentId, orderId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Payment confirmed");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PostMapping("/api/stripe/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        try {
            Optional<PaymentGatewayEntity> gatewayOpt = paymentGatewayRepository
                .findFirstByVendornameAndStatusAndOnOf("stripe", true, "ON");

            if (gatewayOpt.isPresent() && sigHeader != null) {
                PaymentGatewayEntity gateway = gatewayOpt.get();
                if (gateway.getCredentials().has("webhook_secret")) {
                    String webhookSecret = gateway.getCredentials().get("webhook_secret").asText();
                    Event event = paymentGatewayUtil.constructStripeWebhookEvent(payload, sigHeader, webhookSecret);

                    if ("payment_intent.succeeded".equals(event.getType())) {
                        com.stripe.model.StripeObject stripeObj = event.getDataObjectDeserializer()
                            .getObject().orElse(null);
                        if (stripeObj instanceof com.stripe.model.PaymentIntent pi) {
                            orderPaymentsRepository.findByGatewayTransactionId(pi.getId())
                                .ifPresent(p -> {
                                    p.setPaymentStatus("COMPLETED");
                                    p.setUpdatedAt(java.time.LocalDateTime.now());
                                    orderPaymentsRepository.save(p);
                                });
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ResponseEntity.ok("OK");
    }
}
