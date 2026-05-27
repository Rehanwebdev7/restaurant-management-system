package com.rms.modules.customer.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustPayPalService;

import java.util.Map;

@RestController
public class CustPayPalController {

    @Autowired
    private CustPayPalService paypalService;

    @PostMapping("/api/customer/paypal/create-order")
    public ResponseEntity<Object> createOrder(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> requestBody) {
        try {
            Long orderId = Long.parseLong(requestBody.get("orderId").toString());
            Map<String, Object> result = paypalService.createOrder(orderId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "PayPal order created");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PostMapping("/api/customer/paypal/capture-order/{paypalOrderId}")
    public ResponseEntity<Object> captureOrder(
            @RequestHeader("access_token") String token,
            @PathVariable String paypalOrderId,
            @RequestBody Map<String, Object> requestBody) {
        try {
            Long orderId = Long.parseLong(requestBody.get("orderId").toString());
            Map<String, Object> result = paypalService.captureOrder(paypalOrderId, orderId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Payment captured successfully");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
