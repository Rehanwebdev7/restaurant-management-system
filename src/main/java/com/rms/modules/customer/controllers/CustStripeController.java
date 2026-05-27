package com.rms.modules.customer.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustStripeService;

import java.util.Map;

@RestController
public class CustStripeController {

    @Autowired
    private CustStripeService stripeService;

    @PostMapping("/api/customer/stripe/create-payment-intent")
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

    @PostMapping("/api/customer/stripe/confirm-payment")
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
}
