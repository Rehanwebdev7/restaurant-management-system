package com.rms.modules.customer.controllers;

import com.rms.common.api_test_apis.service.CCAvenueService;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.entities.TableBookingEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.repositories.TableBookingRepository;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustCCAvenuePaymentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

@RestController
public class CustCCAvenueController {

    @Autowired
    private CustCCAvenuePaymentService ccavenuePaymentService;

    @Autowired
    private PaymentGatewayRepository paymentGatewayRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private TableBookingRepository tableBookingRepository;

    @Autowired
    private CCAvenueService legacyCCAvenueService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Generate CCAvenue payment request
     * Endpoint: POST /api/customer/ccavenue/payment-request
     */
    @PostMapping("/api/customer/ccavenue/payment-request")
    public ResponseEntity<Object> generatePaymentRequest(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> requestBody) {

        try {
            System.out.println("\n📥 API HIT → /api/customer/ccavenue/payment-request");

            // Extract orderId from request body
            if (requestBody == null || !requestBody.containsKey("orderId")) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "Order ID is required");
            }

            Long orderId = Long.parseLong(requestBody.get("orderId").toString());
            boolean nativeApp = "app".equalsIgnoreCase(String.valueOf(requestBody.getOrDefault("channel", "web")));
            System.out.println("Order ID: " + orderId);

            Map<String, Object> result = ccavenuePaymentService.generatePaymentRequest(orderId, token, nativeApp);

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
                    "Payment request generated successfully");

        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to generate payment request: " + e.getMessage());
        }
    }

    @PostMapping("/api/customer/ccavenue/reservation-payment-request")
    public ResponseEntity<Object> generateReservationPaymentRequest(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> requestBody) {

        try {
            if (requestBody == null || !requestBody.containsKey("bookingId")) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "Booking ID is required");
            }

            Long bookingId = Long.parseLong(requestBody.get("bookingId").toString());
            boolean nativeApp = "app".equalsIgnoreCase(String.valueOf(requestBody.getOrDefault("channel", "web")));

            Map<String, Object> result = ccavenuePaymentService
                    .generateReservationPaymentRequest(bookingId, token, nativeApp);

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
                    "Reservation payment request generated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to generate reservation payment request: " + e.getMessage());
        }
    }

    /**
     * Native Android RSA key endpoint used by the Capacitor bridge.
     * Keeps the app on the customer namespace instead of old test URLs.
     */
    @PostMapping("/api/customer/ccavenue/mobile/get-rsa-key")
    public ResponseEntity<String> getMobileRSAKey(
            @RequestParam("access_code") String accessCode,
            @RequestParam("order_id") String orderId) {

        try {
            String rsaKey = legacyCCAvenueService.getRSAKeyForMobile(accessCode, orderId);
            return ResponseEntity.ok(rsaKey);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("!ERROR! " + (e.getMessage() != null ? e.getMessage() : "Failed to get RSA key"));
        }
    }

    /**
     * Handle CCAvenue payment callback (POST from CCAvenue) and redirect to frontend
     * This endpoint receives POST data from CCAvenue and redirects to frontend with result
     * Endpoints:
     *   POST /api/customer/ccavenue/callback
     *   POST /customer/payment-response (same path as frontend for nginx proxy)
     */
    @PostMapping({"/api/customer/ccavenue/callback", "/api/customer/ccavenue/callback/app", "/customer/payment-response"})
    public RedirectView handleCCAvenueCallback(
            HttpServletRequest request,
            @RequestParam String encResp,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) String accessCode) {

        System.out.println("\n=================================================");
        System.out.println("📥 CCAVENUE CALLBACK RECEIVED");
        System.out.println("=================================================");
        System.out.println("🔢 Order Number: " + orderNo);
        System.out.println("🔐 Access Code: " + accessCode);
        System.out.println("📦 Encrypted Response length: " + (encResp != null ? encResp.length() : 0));

        String redirectUrl;
        boolean nativeApp = request.getRequestURI().endsWith("/app")
                || "app".equalsIgnoreCase(request.getParameter("source"));
        try {
            // Step 1: Find payment gateway from order
            PaymentGatewayEntity gateway = findPaymentGateway(orderNo);

            if (gateway == null) {
                throw new RuntimeException("Payment gateway not found for order: " + orderNo);
            }

            // Step 2: Extract working key and frontend URL from credentials
            String workingKey = extractWorkingKey(gateway);
            String frontendRedirectUrl = nativeApp ? "murgaroma://customer/payment-response" : extractFrontendUrl(gateway);
            System.out.println("✅ Working Key extracted successfully");
            System.out.println("✅ Frontend URL: " + frontendRedirectUrl);

            // Step 3: Process payment and update order
            Map<String, Object> result = ccavenuePaymentService.handlePaymentResponse(encResp, workingKey);

            // Step 4: Extract result data
            String status = result.get("status") != null ? result.get("status").toString() : "FAILURE";
            String orderNumber = result.get("order_number") != null ? result.get("order_number").toString() : "";
            String orderId = result.get("order_id") != null ? result.get("order_id").toString() : "";
            String trackingId = result.get("tracking_id") != null ? result.get("tracking_id").toString() : "";
            String bankRefNo = result.get("bank_ref_no") != null ? result.get("bank_ref_no").toString() : "";
            String amount = result.get("amount") != null ? result.get("amount").toString() : "";
            String message = result.get("message") != null ? result.get("message").toString() : "";
            String paymentMode = result.get("payment_mode") != null ? result.get("payment_mode").toString() : "";

            System.out.println("\n📋 Payment Result:");
            System.out.println("   - Status: " + status);
            System.out.println("   - Order Number: " + orderNumber);
            System.out.println("   - Tracking ID: " + trackingId);
            System.out.println("   - Bank Ref No: " + bankRefNo);
            System.out.println("   - Amount: " + amount);

            // Step 5: Build redirect URL with all payment details (use frontend_url from credentials)
            StringBuilder redirectBuilder = new StringBuilder();
            redirectBuilder.append(frontendRedirectUrl);
            redirectBuilder.append("?status=").append(URLEncoder.encode(status, StandardCharsets.UTF_8));
            redirectBuilder.append("&orderNumber=").append(URLEncoder.encode(orderNumber, StandardCharsets.UTF_8));
            redirectBuilder.append("&orderId=").append(URLEncoder.encode(orderId, StandardCharsets.UTF_8));
            redirectBuilder.append("&trackingId=").append(URLEncoder.encode(trackingId, StandardCharsets.UTF_8));
            redirectBuilder.append("&bankRefNo=").append(URLEncoder.encode(bankRefNo, StandardCharsets.UTF_8));
            redirectBuilder.append("&amount=").append(URLEncoder.encode(amount, StandardCharsets.UTF_8));
            redirectBuilder.append("&paymentMode=").append(URLEncoder.encode(paymentMode, StandardCharsets.UTF_8));
            redirectBuilder.append("&message=").append(URLEncoder.encode(message, StandardCharsets.UTF_8));

            redirectUrl = redirectBuilder.toString();
            System.out.println("\n✅ Payment processed successfully!");
            System.out.println("🔀 Redirecting to: " + redirectUrl);

        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Payment processing failed";

            System.out.println("\n❌ Payment processing failed: " + errorMessage);

            // Build error redirect URL (fallback to default frontendUrl)
            StringBuilder errorRedirect = new StringBuilder();
            errorRedirect.append(nativeApp ? "murgaroma://customer/payment-response" : frontendUrl + "/customer/payment-response");
            errorRedirect.append("?status=FAILURE");
            errorRedirect.append("&message=").append(URLEncoder.encode(errorMessage, StandardCharsets.UTF_8));
            if (orderNo != null) {
                errorRedirect.append("&orderNumber=").append(URLEncoder.encode(orderNo, StandardCharsets.UTF_8));
            }

            redirectUrl = errorRedirect.toString();
            System.out.println("🔀 Error redirect to: " + redirectUrl);
        }

        System.out.println("=================================================\n");

        RedirectView redirectView = new RedirectView();
        redirectView.setUrl(redirectUrl);
        return redirectView;
    }

    @PostMapping({"/api/customer/ccavenue/reservation-callback", "/api/customer/ccavenue/reservation-callback/app"})
    public RedirectView handleReservationCCAvenueCallback(
            HttpServletRequest request,
            @RequestParam String encResp,
            @RequestParam(required = false) String orderNo) {

        String redirectUrl;
        boolean nativeApp = request.getRequestURI().endsWith("/app")
                || "app".equalsIgnoreCase(request.getParameter("source"));
        try {
            PaymentGatewayEntity gateway = findReservationPaymentGateway(orderNo);
            if (gateway == null) {
                throw new RuntimeException("Payment gateway not found for reservation: " + orderNo);
            }

            String workingKey = extractWorkingKey(gateway);
            String frontendRedirectUrl = nativeApp ? "murgaroma://customer/payment-response" : extractFrontendUrl(gateway);

            Map<String, Object> result = ccavenuePaymentService.handleReservationPaymentResponse(encResp, workingKey);

            String status = result.get("status") != null ? result.get("status").toString() : "FAILURE";
            String bookingId = result.get("booking_id") != null ? result.get("booking_id").toString() : "";
            String trackingId = result.get("tracking_id") != null ? result.get("tracking_id").toString() : "";
            String bankRefNo = result.get("bank_ref_no") != null ? result.get("bank_ref_no").toString() : "";
            String amount = result.get("amount") != null ? result.get("amount").toString() : "";
            String message = result.get("message") != null ? result.get("message").toString() : "";
            String paymentMode = result.get("payment_mode") != null ? result.get("payment_mode").toString() : "";
            String tableNumber = result.get("table_number") != null ? result.get("table_number").toString() : "";

            StringBuilder redirectBuilder = new StringBuilder();
            redirectBuilder.append(frontendRedirectUrl);
            redirectBuilder.append("?context=reservation");
            redirectBuilder.append("&status=").append(URLEncoder.encode(status, StandardCharsets.UTF_8));
            redirectBuilder.append("&bookingId=").append(URLEncoder.encode(bookingId, StandardCharsets.UTF_8));
            redirectBuilder.append("&trackingId=").append(URLEncoder.encode(trackingId, StandardCharsets.UTF_8));
            redirectBuilder.append("&bankRefNo=").append(URLEncoder.encode(bankRefNo, StandardCharsets.UTF_8));
            redirectBuilder.append("&amount=").append(URLEncoder.encode(amount, StandardCharsets.UTF_8));
            redirectBuilder.append("&paymentMode=").append(URLEncoder.encode(paymentMode, StandardCharsets.UTF_8));
            redirectBuilder.append("&message=").append(URLEncoder.encode(message, StandardCharsets.UTF_8));
            if (tableNumber != null && !tableNumber.isBlank()) {
                redirectBuilder.append("&tableNumber=").append(URLEncoder.encode(tableNumber, StandardCharsets.UTF_8));
            }
            redirectUrl = redirectBuilder.toString();
        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Reservation payment processing failed";
            StringBuilder errorRedirect = new StringBuilder();
            errorRedirect.append(nativeApp ? "murgaroma://customer/payment-response" : frontendUrl + "/customer/payment-response");
            errorRedirect.append("?context=reservation&status=FAILURE");
            errorRedirect.append("&message=").append(URLEncoder.encode(errorMessage, StandardCharsets.UTF_8));
            if (orderNo != null) {
                errorRedirect.append("&orderNumber=").append(URLEncoder.encode(orderNo, StandardCharsets.UTF_8));
            }
            redirectUrl = errorRedirect.toString();
        }

        RedirectView redirectView = new RedirectView();
        redirectView.setUrl(redirectUrl);
        return redirectView;
    }

    /**
     * Find payment gateway from order
     */
    private PaymentGatewayEntity findPaymentGateway(String orderNo) {
        PaymentGatewayEntity gateway = null;

        if (orderNo != null && !orderNo.isEmpty()) {
            System.out.println("🔍 Finding payment gateway for order: " + orderNo);

            // Try findByOrderNumber first (for format like RMS_30_260223101602)
            if (orderNo.contains("_") || orderNo.startsWith("RMS")) {
                Optional<OrdersEntity> orderOptional = ordersRepository.findByOrderNumber(orderNo);
                if (orderOptional.isPresent()) {
                    OrdersEntity order = orderOptional.get();
                    System.out.println("✅ Order found by order_number: ID = " + order.getId());
                    gateway = order.getPaymentGatewayId();
                }
            }

            // If not found, try parsing as Long (order ID)
            if (gateway == null) {
                try {
                    Long orderId = Long.parseLong(orderNo);
                    Optional<OrdersEntity> orderOptional = ordersRepository.findById(orderId);
                    if (orderOptional.isPresent()) {
                        OrdersEntity order = orderOptional.get();
                        System.out.println("✅ Order found by ID: " + order.getId());
                        gateway = order.getPaymentGatewayId();
                    }
                } catch (NumberFormatException e) {
                    System.out.println("⚠️ orderNo is not numeric");
                }
            }
        }

        // Fallback: find active CCAvenue gateway with working_key configured
        if (gateway == null) {
            System.out.println("⚠️ No gateway from order, using fallback...");
            gateway = paymentGatewayRepository
                    .findByRestaurantIdIsNotNull()
                    .stream()
                    .filter(pg -> "ccavenue".equalsIgnoreCase(pg.getVendorname())
                            && Boolean.TRUE.equals(pg.getStatus())
                            && pg.getCredentials() != null
                            && (pg.getCredentials().has("working_key") || pg.getCredentials().has("workingKey")))
                    .findFirst()
                    .orElse(null);

            if (gateway != null) {
                System.out.println("✅ Found fallback CCAvenue gateway: ID = " + gateway.getId());
            } else {
                System.out.println("❌ No CCAvenue gateway found with working_key configured");
            }
        }

        return gateway;
    }

    private PaymentGatewayEntity findReservationPaymentGateway(String orderNo) {
        if (orderNo != null && orderNo.startsWith("TBLBOOK_")) {
            try {
                Long bookingId = Long.parseLong(orderNo.substring("TBLBOOK_".length()));
                Optional<TableBookingEntity> bookingOptional = tableBookingRepository.findById(bookingId);
                if (bookingOptional.isPresent()) {
                    TableBookingEntity booking = bookingOptional.get();
                    if (booking.getTableId() != null
                            && booking.getTableId().getRestaurantId() != null
                            && booking.getTableId().getRestaurantId().getId() != null) {
                        return paymentGatewayRepository
                                .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(
                                        booking.getTableId().getRestaurantId().getId(), "ccavenue", true, "ON")
                                .orElse(null);
                    }
                }
            } catch (NumberFormatException ignored) {
                // fall through to fallback
            }
        }

        return paymentGatewayRepository
                .findByRestaurantIdIsNotNull()
                .stream()
                .filter(pg -> "ccavenue".equalsIgnoreCase(pg.getVendorname())
                        && Boolean.TRUE.equals(pg.getStatus())
                        && pg.getCredentials() != null
                        && (pg.getCredentials().has("working_key") || pg.getCredentials().has("workingKey")))
                .findFirst()
                .orElse(null);
    }

    /**
     * Extract working key from payment gateway credentials
     */
    private String extractWorkingKey(PaymentGatewayEntity gateway) {
        if (gateway.getCredentials() == null) {
            throw new RuntimeException("Gateway credentials not configured");
        }

        String workingKey = null;
        if (gateway.getCredentials().has("working_key")) {
            workingKey = gateway.getCredentials().get("working_key").asText();
        } else if (gateway.getCredentials().has("workingKey")) {
            workingKey = gateway.getCredentials().get("workingKey").asText();
        }

        if (workingKey == null || workingKey.isEmpty()) {
            throw new RuntimeException("Working key not configured in credentials");
        }

        return workingKey;
    }

    /**
     * Extract frontend URL from payment gateway credentials
     */
    private String extractFrontendUrl(PaymentGatewayEntity gateway) {
        if (gateway.getCredentials() == null) {
            return frontendUrl + "/customer/payment-response"; // fallback
        }

        String url = null;
        if (gateway.getCredentials().has("frontend_url")) {
            url = gateway.getCredentials().get("frontend_url").asText();
        } else if (gateway.getCredentials().has("frontendUrl")) {
            url = gateway.getCredentials().get("frontendUrl").asText();
        }

        if (url == null || url.isEmpty()) {
            System.out.println("⚠️ frontend_url not found in credentials, using default");
            return frontendUrl + "/customer/payment-response"; // fallback
        }

        return url;
    }

    /**
     * Handle CCAvenue payment response/callback (JSON API)
     * Endpoint: POST /api/customer/ccavenue/payment-response
     */
    @PostMapping("/api/customer/ccavenue/payment-response")
    public ResponseEntity<Object> handlePaymentResponse(
            @RequestParam String encResp,
            @RequestParam(required = false) String orderNo) {

        try {
            System.out.println("\n📥 API HIT → /api/customer/ccavenue/payment-response");
            System.out.println("🔢 Order Number: " + orderNo);
            System.out.println("📦 Encrypted Response received from CCAvenue");

            // Fetch payment gateway from order
            PaymentGatewayEntity gateway = null;

            if (orderNo != null && !orderNo.isEmpty()) {
                System.out.println("🔍 Fetching order by ID: " + orderNo);

                // Try to parse orderNo as Long (order ID)
                try {
                    Long orderId = Long.parseLong(orderNo);
                    Optional<OrdersEntity> orderOptional = ordersRepository.findById(orderId);

                    if (orderOptional.isPresent()) {
                        OrdersEntity order = orderOptional.get();
                        System.out.println("✅ Order found: ID = " + order.getId());
                        System.out.println("   - Order Number: " + order.getOrderNumber());

                        // Get payment gateway from order
                        gateway = order.getPaymentGatewayId();

                        if (gateway != null) {
                            System.out.println("✅ Payment Gateway found from order:");
                            System.out.println("   - Gateway ID: " + gateway.getId());
                            System.out.println("   - Gateway Vendor: " + gateway.getVendorname());
                            System.out.println("   - Gateway Status: " + gateway.getStatus());
                        } else {
                            System.out.println("⚠️ Order has no payment gateway linked");
                        }
                    } else {
                        System.out.println("❌ Order not found with ID: " + orderId);
                    }
                } catch (NumberFormatException e) {
                    // orderNo is not a number, try findByOrderNumber
                    System.out.println("🔍 orderNo is not numeric, trying findByOrderNumber: " + orderNo);
                    Optional<OrdersEntity> orderOptional = ordersRepository.findByOrderNumber(orderNo);

                    if (orderOptional.isPresent()) {
                        OrdersEntity order = orderOptional.get();
                        System.out.println("✅ Order found: ID = " + order.getId());

                        gateway = order.getPaymentGatewayId();

                        if (gateway != null) {
                            System.out.println("✅ Payment Gateway found from order:");
                            System.out.println("   - Gateway ID: " + gateway.getId());
                            System.out.println("   - Gateway Vendor: " + gateway.getVendorname());
                            System.out.println("   - Gateway Status: " + gateway.getStatus());
                        } else {
                            System.out.println("⚠️ Order has no payment gateway linked");
                        }
                    } else {
                        System.out.println("❌ Order not found with order number: " + orderNo);
                    }
                }
            }

            // Fallback: If no gateway found from order, try to find first active CCAvenue gateway
            if (gateway == null) {
                System.out.println("⚠️ No gateway from order, trying fallback method...");
                gateway = paymentGatewayRepository
                        .findByRestaurantIdIsNotNull()
                        .stream()
                        .filter(pg -> "ccavenue".equalsIgnoreCase(pg.getVendorname())
                                && Boolean.TRUE.equals(pg.getStatus()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("CCAvenue gateway configuration not found"));
                System.out.println("✅ Found fallback gateway: ID = " + gateway.getId());
            }

            if (gateway.getCredentials() == null) {
                System.out.println("❌ Gateway credentials are NULL");
                throw new RuntimeException("CCAvenue credentials not configured");
            }

            System.out.println("📋 Gateway Credentials JSON: " + gateway.getCredentials().toString());
            System.out.println("📋 Credentials class: " + gateway.getCredentials().getClass().getName());

            // List all available fields
            StringBuilder availableFields = new StringBuilder("Available credential fields: [");
            gateway.getCredentials().fieldNames().forEachRemaining(field -> {
                availableFields.append(field).append(", ");
            });
            availableFields.append("]");
            System.out.println(availableFields.toString());

            // Try both field names: "working_key" and "workingKey"
            String workingKey = null;

            if (gateway.getCredentials().has("working_key")) {
                System.out.println("🔍 Checking 'working_key' field...");
                var workingKeyNode = gateway.getCredentials().get("working_key");
                System.out.println("   - Node type: " + (workingKeyNode != null ? workingKeyNode.getNodeType() : "NULL"));
                System.out.println("   - Is null: " + (workingKeyNode == null || workingKeyNode.isNull()));
                System.out.println("   - Is text: " + (workingKeyNode != null && workingKeyNode.isTextual()));

                if (workingKeyNode != null && !workingKeyNode.isNull()) {
                    workingKey = workingKeyNode.asText();
                    System.out.println("✅ Found working_key (snake_case): " + (workingKey != null ? workingKey.substring(0, Math.min(10, workingKey.length())) + "..." : "NULL"));
                }
            } else {
                System.out.println("❌ 'working_key' field does not exist");
            }

            if (workingKey == null && gateway.getCredentials().has("workingKey")) {
                System.out.println("🔍 Checking 'workingKey' field...");
                var workingKeyNode = gateway.getCredentials().get("workingKey");
                System.out.println("   - Node type: " + (workingKeyNode != null ? workingKeyNode.getNodeType() : "NULL"));

                if (workingKeyNode != null && !workingKeyNode.isNull()) {
                    workingKey = workingKeyNode.asText();
                    System.out.println("✅ Found workingKey (camelCase): " + (workingKey != null ? workingKey.substring(0, Math.min(10, workingKey.length())) + "..." : "NULL"));
                }
            } else if (workingKey == null) {
                System.out.println("❌ 'workingKey' field does not exist");
            }

            if (workingKey == null || workingKey.isEmpty()) {
                System.out.println("❌ Working key is NULL or empty after all checks");
                System.out.println("❌ Final working key value: " + workingKey);
                throw new RuntimeException("Working key not configured in credentials");
            }

            System.out.println("✅ Working Key found: " + workingKey.substring(0, Math.min(10, workingKey.length())) + "...");

            // Extract other credentials for logging
            String merchantId = gateway.getCredentials().has("merchant_id") ? gateway.getCredentials().get("merchant_id").asText() : "N/A";
            String accessCode = gateway.getCredentials().has("access_code") ? gateway.getCredentials().get("access_code").asText() : "N/A";

            System.out.println("📋 Payment Gateway Credentials:");
            System.out.println("   - Merchant ID: " + merchantId);
            System.out.println("   - Access Code: " + accessCode);
            System.out.println("   - Working Key: " + workingKey.substring(0, Math.min(10, workingKey.length())) + "...");

            Map<String, Object> result = ccavenuePaymentService.handlePaymentResponse(encResp, workingKey);

            String status = result.get("status").toString();
            String message = result.get("message").toString();

            if ("SUCCESS".equals(status)) {
                return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, message);
            } else if ("FAILURE".equals(status)) {
                return ApiResponse.responseBuilder(result, "FAILURE", HttpStatus.BAD_REQUEST, message);
            } else if ("ABORTED".equals(status)) {
                return ApiResponse.responseBuilder(result, "ABORTED", HttpStatus.OK, message);
            } else {
                return ApiResponse.responseBuilder(result, "INVALID", HttpStatus.BAD_REQUEST, message);
            }

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to process payment response");
        }
    }

    /**
     * Handle CCAvenue cancel callback
     * Endpoint: POST /api/customer/ccavenue/payment-cancel
     */
    @PostMapping("/api/customer/ccavenue/payment-cancel")
    public ResponseEntity<Object> handlePaymentCancel(
            @RequestParam String encResp) {

        try {
            System.out.println("\n📥 API HIT → /api/customer/ccavenue/payment-cancel");
            System.out.println("Payment cancelled by user");

            // Extract working key
            PaymentGatewayEntity gateway = paymentGatewayRepository
                    .findByRestaurantIdIsNotNull()
                    .stream()
                    .filter(pg -> "ccavenue".equalsIgnoreCase(pg.getVendorname())
                            && Boolean.TRUE.equals(pg.getStatus()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("CCAvenue gateway configuration not found"));

            if (gateway.getCredentials() == null) {
                throw new RuntimeException("CCAvenue credentials not configured");
            }

            // Try both field names: "working_key" and "workingKey"
            String workingKey = null;
            if (gateway.getCredentials().has("working_key") && gateway.getCredentials().get("working_key") != null) {
                workingKey = gateway.getCredentials().get("working_key").asText();
            } else if (gateway.getCredentials().has("workingKey") && gateway.getCredentials().get("workingKey") != null) {
                workingKey = gateway.getCredentials().get("workingKey").asText();
            }

            if (workingKey == null || workingKey.isEmpty()) {
                throw new RuntimeException("Working key not configured in credentials");
            }

            Map<String, Object> result = ccavenuePaymentService.handlePaymentResponse(encResp, workingKey);

            return ApiResponse.responseBuilder(result, "CANCELLED", HttpStatus.OK,
                    "Payment was cancelled");

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to process cancel request");
        }
    }
}
