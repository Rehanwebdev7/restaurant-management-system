package com.rms.common.util;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.PaymentGatewayEntity;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
public class PaymentGatewayUtil {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getBaseUrl(PaymentGatewayEntity gateway) {
        String mode = gateway.getCredentials().has("mode")
            ? gateway.getCredentials().get("mode").asText()
            : "sandbox";
        return "sandbox".equalsIgnoreCase(mode)
            ? "https://api-m.sandbox.paypal.com"
            : "https://api-m.paypal.com";
    }

    private boolean isMockMode(PaymentGatewayEntity gateway) {
        return gateway.getCredentials().has("mock_mode") &&
               gateway.getCredentials().get("mock_mode").asBoolean();
    }

    public String getPayPalAccessToken(PaymentGatewayEntity gateway) throws Exception {
        String clientId = gateway.getCredentials().get("client_id").asText();
        String clientSecret = gateway.getCredentials().get("client_secret").asText();
        String baseUrl = getBaseUrl(gateway);

        String credentials = clientId + ":" + clientSecret;
        String encoded = Base64.getEncoder()
            .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            baseUrl + "/v1/oauth2/token",
            request,
            JsonNode.class
        );

        return response.getBody().get("access_token").asText();
    }

    public Map<String, Object> createPayPalOrder(Long orderId, BigDecimal totalAmount, PaymentGatewayEntity gateway) throws Exception {
        // Mock mode for testing
        if (isMockMode(gateway)) {
            String mockOrderId = "MOCK_" + System.currentTimeMillis();
            Map<String, Object> result = new HashMap<>();
            result.put("paypalOrderId", mockOrderId);
            result.put("status", "CREATED");
            System.out.println("✅ MOCK MODE: PayPal Order Created - " + mockOrderId);
            return result;
        }

        String accessToken = getPayPalAccessToken(gateway);
        String baseUrl = getBaseUrl(gateway);
        String currency = gateway.getCredentials().has("currency")
            ? gateway.getCredentials().get("currency").asText()
            : "USD";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String amountValue = String.format("%.2f", totalAmount != null ? totalAmount : BigDecimal.ZERO);

        Map<String, Object> amount = new HashMap<>();
        amount.put("currency_code", currency);
        amount.put("value", amountValue);

        Map<String, Object> purchaseUnit = new HashMap<>();
        purchaseUnit.put("reference_id", "RMS_ORDER_" + orderId);
        purchaseUnit.put("custom_id", String.valueOf(orderId));
        purchaseUnit.put("amount", amount);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("intent", "CAPTURE");
        requestBody.put("purchase_units", new Object[]{purchaseUnit});

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            baseUrl + "/v2/checkout/orders",
            request,
            JsonNode.class
        );

        String paypalOrderId = response.getBody().get("id").asText();
        String status = response.getBody().get("status").asText();

        Map<String, Object> result = new HashMap<>();
        result.put("paypalOrderId", paypalOrderId);
        result.put("status", status);
        return result;
    }

    // ─── Stripe Methods ───────────────────────────────────────────────────────

    private boolean isMockStripeMode(PaymentGatewayEntity gateway) {
        return gateway.getCredentials().has("mock_mode") &&
               gateway.getCredentials().get("mock_mode").asBoolean();
    }

    public Map<String, Object> createStripePaymentIntent(Long orderId, BigDecimal totalAmount, PaymentGatewayEntity gateway) throws Exception {
        if (isMockStripeMode(gateway)) {
            String mockPiId = "pi_MOCK_" + System.currentTimeMillis();
            Map<String, Object> result = new HashMap<>();
            result.put("paymentIntentId", mockPiId);
            result.put("clientSecret", mockPiId + "_secret_MOCK");
            result.put("status", "requires_payment_method");
            result.put("mockMode", true);
            System.out.println("✅ MOCK MODE: Stripe PaymentIntent Created - " + mockPiId);
            return result;
        }

        String secretKey = gateway.getCredentials().get("secret_key").asText();
        Stripe.apiKey = secretKey;

        String currency = gateway.getCredentials().has("currency")
            ? gateway.getCredentials().get("currency").asText()
            : "usd";

        long amountInCents = (totalAmount != null ? totalAmount : BigDecimal.ZERO)
            .multiply(BigDecimal.valueOf(100)).longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
            .setAmount(amountInCents)
            .setCurrency(currency)
            .putMetadata("rms_order_id", String.valueOf(orderId))
            .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, Object> result = new HashMap<>();
        result.put("paymentIntentId", intent.getId());
        result.put("clientSecret", intent.getClientSecret());
        result.put("status", intent.getStatus());
        return result;
    }

    public Map<String, Object> retrieveStripePaymentIntent(String paymentIntentId, PaymentGatewayEntity gateway) throws Exception {
        if (isMockStripeMode(gateway)) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "succeeded");
            result.put("amount", "100.00");
            result.put("paymentIntentId", paymentIntentId);
            System.out.println("✅ MOCK MODE: Stripe PaymentIntent Retrieved - " + paymentIntentId);
            return result;
        }

        Stripe.apiKey = gateway.getCredentials().get("secret_key").asText();
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        BigDecimal amount = BigDecimal.valueOf(intent.getAmount()).divide(BigDecimal.valueOf(100));

        Map<String, Object> result = new HashMap<>();
        result.put("status", intent.getStatus());
        result.put("amount", amount.toPlainString());
        result.put("paymentIntentId", intent.getId());
        return result;
    }

    public Event constructStripeWebhookEvent(String payload, String sigHeader, String webhookSecret) throws Exception {
        return Webhook.constructEvent(payload, sigHeader, webhookSecret);
    }

    // ─── PayPal Methods ───────────────────────────────────────────────────────

    public Map<String, Object> capturePayPalOrder(String paypalOrderId, PaymentGatewayEntity gateway) throws Exception {
        // Mock mode for testing
        if (isMockMode(gateway)) {
            String mockCaptureId = "MOCK_CAPTURE_" + System.currentTimeMillis();
            Map<String, Object> result = new HashMap<>();
            result.put("status", "COMPLETED");
            result.put("captureId", mockCaptureId);
            result.put("amount", "100.00");
            result.put("paypalOrderId", paypalOrderId);
            System.out.println("✅ MOCK MODE: PayPal Order Captured - " + mockCaptureId);
            return result;
        }

        String accessToken = getPayPalAccessToken(gateway);
        String baseUrl = getBaseUrl(gateway);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>("{}", headers);

        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            baseUrl + "/v2/checkout/orders/" + paypalOrderId + "/capture",
            request,
            JsonNode.class
        );

        JsonNode body = response.getBody();
        String status = body.get("status").asText();
        JsonNode captures = body.path("purchase_units").get(0)
            .path("payments").path("captures");
        String captureId = captures.get(0).get("id").asText();
        String capturedAmount = captures.get(0).path("amount").path("value").asText();

        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("captureId", captureId);
        result.put("amount", capturedAmount);
        result.put("paypalOrderId", paypalOrderId);
        return result;
    }
}
