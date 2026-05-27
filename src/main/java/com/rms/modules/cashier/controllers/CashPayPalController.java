package com.rms.modules.cashier.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rms.common.response.ApiResponse;
import com.rms.modules.cashier.services.CashPayPalService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.repositories.OrderPaymentsRepository;
import java.util.Map;

@RestController
public class CashPayPalController {

    @Autowired
    private CashPayPalService paypalService;

    @Autowired
    private OrderPaymentsRepository orderPaymentsRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/api/cashier/paypal/create-order")
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

    @PostMapping("/api/cashier/paypal/capture-order/{paypalOrderId}")
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

    @PostMapping("/api/paypal/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload) {
        try {
            JsonNode payloadNode = objectMapper.readTree(payload);
            String eventType = payloadNode.get("event_type").asText();

            if ("PAYMENT.CAPTURE.COMPLETED".equals(eventType)) {
                handleCaptureCompleted(payloadNode);
            } else if ("PAYMENT.CAPTURE.DENIED".equals(eventType)) {
                handleCaptureDenied(payloadNode);
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok("OK");
        }
    }

    private void handleCaptureCompleted(JsonNode payload) {
        try {
            JsonNode resource = payload.get("resource");
            String captureId = resource.get("id").asText();
            orderPaymentsRepository.findByGatewayTransactionId(captureId)
                .ifPresent(payment -> {
                    payment.setPaymentStatus("COMPLETED");
                    payment.setUpdatedAt(java.time.LocalDateTime.now());
                    orderPaymentsRepository.save(payment);
                });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleCaptureDenied(JsonNode payload) {
        try {
            JsonNode resource = payload.get("resource");
            String captureId = resource.get("id").asText();
            orderPaymentsRepository.findByGatewayTransactionId(captureId)
                .ifPresent(payment -> {
                    payment.setPaymentStatus("DENIED");
                    payment.setUpdatedAt(java.time.LocalDateTime.now());
                    orderPaymentsRepository.save(payment);
                });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
