package com.rms.modules.customer.services;

import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.entities.TableBookingEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.repositories.TableBookingRepository;
import com.rms.common.util.CCAvenueCrypto;
import com.rms.common.Constant;
import com.rms.common.util.CacheData;
import com.rms.common.util.DiningTableReleaseScheduler;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CustCCAvenuePaymentService {

    @Autowired
    private OrdersRepository ordersRepository;
   
    @Autowired
    private PaymentGatewayRepository paymentGatewayRepository;

    @Autowired
    private TableBookingRepository tableBookingRepository;

    @Autowired
    private CacheData cacheData;

    @Autowired
    private Constant constant;

    @Autowired
    private DiningTableReleaseScheduler diningTableReleaseScheduler;

    @Autowired
    private TokenUtil tokenUtil;

    /**
     * Generate CCAvenue payment request
     * @param orderId - Order ID
     * @param token - Access token
     * @return Map containing encrypted request and access code
     */
    public Map<String, Object> generatePaymentRequest(Long orderId, String token, boolean nativeApp) throws Exception {

        System.out.println("\n=================================================");
        System.out.println("💳   CCAVENUE PAYMENT REQUEST GENERATION        ");
        System.out.println("=================================================");

        // 🔐 AUTHENTICATION
        Authorization.authorizeCustomer(token);
        System.out.println("🔐 Authentication : SUCCESS");

        // 🔍 FETCH ORDER
        OrdersEntity order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        System.out.println("📦 Order Number   : " + order.getOrderNumber());
        System.out.println("💰 Total Amount   : ₹" + order.getTotalAmount());

        // 🔍 VALIDATE ORDER — allow DINING orders to pay online even if originally COD
        if (!"PG".equalsIgnoreCase(order.getPaymentMethod()) && !"DINING".equalsIgnoreCase(order.getOrderType())) {
            throw new RuntimeException("This order is not for online payment");
        }
        // Update payment method to PG for DINING orders paying online
        if ("DINING".equalsIgnoreCase(order.getOrderType()) && !"PG".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentMethod("PG");
            ordersRepository.save(order);
        }

        if (!"PENDING".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new RuntimeException("Payment already processed for this order");
        }

        // 🔍 FETCH PAYMENT GATEWAY
        Long restaurantId = order.getRestaurantId().getId();
        PaymentGatewayEntity paymentGateway = paymentGatewayRepository
                .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(
                        restaurantId, "ccavenue", true, "ON")
                .orElseThrow(() -> new RuntimeException("CCAvenue payment gateway not configured for this restaurant"));

        System.out.println("🏪 Restaurant ID  : " + restaurantId);
        System.out.println("🔧 Gateway Status : " + paymentGateway.getOnOf());

        // 🔑 EXTRACT CREDENTIALS
        if (paymentGateway.getCredentials() == null) {
            throw new RuntimeException("CCAvenue credentials not configured in database");
        }

        System.out.println("📋 Credentials JSON: " + paymentGateway.getCredentials().toString());

        // Safely extract credentials with null checks
        String merchantId = paymentGateway.getCredentials().has("merchant_id")
            ? paymentGateway.getCredentials().get("merchant_id").asText()
            : (paymentGateway.getCredentials().has("merchantId")
                ? paymentGateway.getCredentials().get("merchantId").asText() : null);
        String accessCode = paymentGateway.getCredentials().has("access_code")
            ? paymentGateway.getCredentials().get("access_code").asText()
            : (paymentGateway.getCredentials().has("accessCode")
                ? paymentGateway.getCredentials().get("accessCode").asText() : null);
        String workingKey = paymentGateway.getCredentials().has("working_key")
            ? paymentGateway.getCredentials().get("working_key").asText()
            : (paymentGateway.getCredentials().has("workingKey")
                ? paymentGateway.getCredentials().get("workingKey").asText() : null);
        String redirectUrl = paymentGateway.getCredentials().has("redirect_url")
            ? paymentGateway.getCredentials().get("redirect_url").asText()
            : (paymentGateway.getCredentials().has("redirectUrl")
                ? paymentGateway.getCredentials().get("redirectUrl").asText() : null);
        String cancelUrl = paymentGateway.getCredentials().has("cancel_url")
            ? paymentGateway.getCredentials().get("cancel_url").asText()
            : (paymentGateway.getCredentials().has("cancelUrl")
                ? paymentGateway.getCredentials().get("cancelUrl").asText() : null);

        if (nativeApp) {
            String callbackBaseUrl = extractBaseUrl(firstNonEmpty(redirectUrl, cancelUrl));
            redirectUrl = callbackBaseUrl + "/api/customer/ccavenue/callback/app";
            cancelUrl = callbackBaseUrl + "/api/customer/ccavenue/callback/app";
        }

        // Validate required fields
        if (merchantId == null || merchantId.isEmpty()) {
            throw new RuntimeException("CCAvenue merchant_id not configured in credentials");
        }
        if (accessCode == null || accessCode.isEmpty()) {
            throw new RuntimeException("CCAvenue access_code not configured in credentials");
        }
        if (workingKey == null || workingKey.isEmpty()) {
            throw new RuntimeException("CCAvenue working_key not configured in credentials");
        }
        if (redirectUrl == null || redirectUrl.isEmpty()) {
            throw new RuntimeException("CCAvenue redirect_url not configured in credentials");
        }
        if (cancelUrl == null || cancelUrl.isEmpty()) {
            throw new RuntimeException("CCAvenue cancel_url not configured in credentials");
        }

        System.out.println("🔑 Merchant ID    : " + merchantId);
        System.out.println("🔐 Access Code    : " + accessCode);

        // 🧾 BUILD MERCHANT DATA
        StringBuilder merchantData = new StringBuilder();
        merchantData.append("tid=").append(System.currentTimeMillis()).append("&");
        merchantData.append("merchant_id=").append(merchantId).append("&");
        merchantData.append("order_id=").append(order.getOrderNumber()).append("&");
        merchantData.append("amount=").append(String.format("%.2f", order.getTotalAmount())).append("&");
        merchantData.append("currency=INR&");
        merchantData.append("redirect_url=").append(redirectUrl).append("&");
        merchantData.append("cancel_url=").append(cancelUrl).append("&");
        merchantData.append("language=en&");

        // Add customer details (with dummy values as fallback)
        String billingName = order.getCustomerName() != null && !order.getCustomerName().isEmpty()
            ? order.getCustomerName() : "Customer";
        String billingTel = order.getCustomerPhone() != null && !order.getCustomerPhone().isEmpty()
            ? order.getCustomerPhone() : "9999999999";
        String billingEmail = order.getCustomerEmail() != null && !order.getCustomerEmail().isEmpty()
            ? order.getCustomerEmail() : "customer@example.com";

        merchantData.append("billing_name=").append(billingName).append("&");
        merchantData.append("billing_tel=").append(billingTel).append("&");
        merchantData.append("billing_email=").append(billingEmail).append("&");

        // Add billing address details (with dummy values as fallback)
        String billingAddress = "NA";
        String billingCity = "Mumbai";
        String billingState = "Maharashtra";
        String billingZip = "400001";

        if (order.getCustomerDeliveryAddressesId() != null) {
            if (order.getCustomerDeliveryAddressesId().getAddressLine1() != null
                && !order.getCustomerDeliveryAddressesId().getAddressLine1().isEmpty()) {
                billingAddress = order.getCustomerDeliveryAddressesId().getAddressLine1();
            }

            // Get city, state, zipcode from pincodeId relationship
            if (order.getCustomerDeliveryAddressesId().getPincodeId() != null) {
                if (order.getCustomerDeliveryAddressesId().getPincodeId().getCityId() != null
                    && order.getCustomerDeliveryAddressesId().getPincodeId().getCityId().getName() != null
                    && !order.getCustomerDeliveryAddressesId().getPincodeId().getCityId().getName().isEmpty()) {
                    billingCity = order.getCustomerDeliveryAddressesId().getPincodeId().getCityId().getName();
                }
                if (order.getCustomerDeliveryAddressesId().getPincodeId().getStateId() != null
                    && order.getCustomerDeliveryAddressesId().getPincodeId().getStateId().getName() != null
                    && !order.getCustomerDeliveryAddressesId().getPincodeId().getStateId().getName().isEmpty()) {
                    billingState = order.getCustomerDeliveryAddressesId().getPincodeId().getStateId().getName();
                }
                if (order.getCustomerDeliveryAddressesId().getPincodeId().getPincode() != null
                    && !order.getCustomerDeliveryAddressesId().getPincodeId().getPincode().isEmpty()) {
                    billingZip = order.getCustomerDeliveryAddressesId().getPincodeId().getPincode();
                }
            }
        }

        merchantData.append("billing_address=").append(billingAddress).append("&");
        merchantData.append("billing_city=").append(billingCity).append("&");
        merchantData.append("billing_state=").append(billingState).append("&");
        merchantData.append("billing_zip=").append(billingZip).append("&");
        merchantData.append("billing_country=India&");

        // Merchant params for reference
        merchantData.append("merchant_param1=").append(orderId).append("&");
        merchantData.append("merchant_param2=").append(order.getOrderType()).append("&");
        merchantData.append("merchant_param3=").append(order.getBranchId().getId()).append("&");

        System.out.println("\n📋 Merchant Data  : " + merchantData.toString());

        // 🔐 ENCRYPT MERCHANT DATA
        String encryptedData = CCAvenueCrypto.encrypt(merchantData.toString(), workingKey);

        System.out.println("🔒 Encrypted Data : " + encryptedData.substring(0, Math.min(50, encryptedData.length())) + "...");

        // 📤 PREPARE RESPONSE
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("encRequest", encryptedData);
        response.put("access_code", accessCode);
        response.put("merchant_id", merchantId);
        response.put("redirect_url", redirectUrl);
        response.put("cancel_url", cancelUrl);
        response.put("rsa_key_url", "/api/customer/ccavenue/mobile/get-rsa-key");
        response.put("ccavenue_url", resolveCCAvenueInitiateUrl(paymentGateway));
        response.put("order_id", order.getOrderNumber());
        response.put("amount", order.getTotalAmount());

        // Update order with payment gateway reference
        order.setPaymentGatewayId(paymentGateway);
        ordersRepository.save(order);

        System.out.println("✅ Payment request generated successfully");
        System.out.println("=================================================\n");

        return response;
    }

    public Map<String, Object> generateReservationPaymentRequest(Long bookingId, String token, boolean nativeApp) throws Exception {
        Authorization.authorizeCustomer(token);
        tokenUtil.decryptAndStoreToken(token);
        Long customerId = tokenUtil.getCurrentUserId().longValue();
        tokenUtil.clearTokenData();

        TableBookingEntity booking = tableBookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Reservation not found with ID: " + bookingId));

        if (booking.getCustomerId() == null || booking.getCustomerId().getId() == null
                || !booking.getCustomerId().getId().equals(customerId)) {
            throw new RuntimeException("You are not allowed to pay for this reservation");
        }
        if (booking.getTableId() == null || booking.getTableId().getRestaurantId() == null
                || booking.getTableId().getRestaurantId().getId() == null) {
            throw new RuntimeException("Reservation restaurant not found");
        }
        if (booking.getAmount() == null || booking.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Advance booking amount is not configured");
        }

        String bookingStatus = booking.getStatus() != null ? booking.getStatus().toUpperCase() : "";
        if ("CANCELLED".equals(bookingStatus) || "NO_SHOW".equals(bookingStatus) || "COMPLETED".equals(bookingStatus)) {
            throw new RuntimeException("This reservation is no longer active");
        }

        String paymentStatus = booking.getPaymentStatus() != null ? booking.getPaymentStatus().toUpperCase() : "";
        if ("SUCCESS".equals(paymentStatus) || "PAID".equals(paymentStatus) || "COMPLETED".equals(paymentStatus)) {
            throw new RuntimeException("Advance payment already completed for this reservation");
        }

        Long restaurantId = booking.getTableId().getRestaurantId().getId();
        PaymentGatewayEntity paymentGateway = findCCAvenueGatewayForRestaurant(restaurantId);

        String merchantId = extractCredential(paymentGateway, "merchant_id", "merchantId");
        String accessCode = extractCredential(paymentGateway, "access_code", "accessCode");
        String workingKey = extractCredential(paymentGateway, "working_key", "workingKey");
        String redirectUrl = extractCredential(paymentGateway, "redirect_url", "redirectUrl");
        String cancelUrl = extractCredential(paymentGateway, "cancel_url", "cancelUrl");

        if (nativeApp) {
            String callbackBaseUrl = extractBaseUrl(firstNonEmpty(redirectUrl, cancelUrl));
            redirectUrl = callbackBaseUrl + "/api/customer/ccavenue/reservation-callback/app";
            cancelUrl = callbackBaseUrl + "/api/customer/ccavenue/reservation-callback/app";
        } else {
            String callbackBaseUrl = extractBaseUrl(firstNonEmpty(redirectUrl, cancelUrl));
            redirectUrl = callbackBaseUrl + "/api/customer/ccavenue/reservation-callback";
            cancelUrl = callbackBaseUrl + "/api/customer/ccavenue/reservation-callback";
        }

        if (merchantId == null || merchantId.isEmpty()) {
            throw new RuntimeException("CCAvenue merchant_id not configured in credentials");
        }
        if (accessCode == null || accessCode.isEmpty()) {
            throw new RuntimeException("CCAvenue access_code not configured in credentials");
        }
        if (workingKey == null || workingKey.isEmpty()) {
            throw new RuntimeException("CCAvenue working_key not configured in credentials");
        }

        String orderId = "TBLBOOK_" + booking.getId();
        String billingName = booking.getCustomerId() != null && booking.getCustomerId().getName() != null
                ? booking.getCustomerId().getName() : "Customer";
        String billingTel = booking.getCustomerId() != null && booking.getCustomerId().getMobileNumber() != null
                ? booking.getCustomerId().getMobileNumber() : "9999999999";
        String billingEmail = booking.getCustomerId() != null && booking.getCustomerId().getEmail() != null
                ? booking.getCustomerId().getEmail() : "customer@example.com";

        StringBuilder merchantData = new StringBuilder();
        merchantData.append("tid=").append(System.currentTimeMillis()).append("&");
        merchantData.append("merchant_id=").append(merchantId).append("&");
        merchantData.append("order_id=").append(orderId).append("&");
        merchantData.append("amount=").append(String.format("%.2f", booking.getAmount())).append("&");
        merchantData.append("currency=INR&");
        merchantData.append("redirect_url=").append(redirectUrl).append("&");
        merchantData.append("cancel_url=").append(cancelUrl).append("&");
        merchantData.append("language=en&");
        merchantData.append("billing_name=").append(billingName).append("&");
        merchantData.append("billing_tel=").append(billingTel).append("&");
        merchantData.append("billing_email=").append(billingEmail).append("&");
        merchantData.append("billing_address=NA&");
        merchantData.append("billing_city=Delhi&");
        merchantData.append("billing_state=Delhi&");
        merchantData.append("billing_zip=110001&");
        merchantData.append("billing_country=India&");
        merchantData.append("merchant_param1=").append(booking.getId()).append("&");
        merchantData.append("merchant_param2=TABLE_RESERVATION&");
        merchantData.append("merchant_param3=").append(restaurantId);

        String encryptedData = CCAvenueCrypto.encrypt(merchantData.toString(), workingKey);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("encRequest", encryptedData);
        response.put("access_code", accessCode);
        response.put("merchant_id", merchantId);
        response.put("redirect_url", redirectUrl);
        response.put("cancel_url", cancelUrl);
        response.put("rsa_key_url", "/api/customer/ccavenue/mobile/get-rsa-key");
        response.put("ccavenue_url", resolveCCAvenueInitiateUrl(paymentGateway));
        response.put("order_id", orderId);
        response.put("amount", booking.getAmount());
        response.put("booking_id", booking.getId());

        if (booking.getPaymentStatus() == null || booking.getPaymentStatus().isBlank()) {
            booking.setPaymentStatus("PENDING");
            tableBookingRepository.save(booking);
        }

        return response;
    }

    /**
     * Handle CCAvenue payment response/callback
     * @param encResponse - Encrypted response from CCAvenue
     * @param token - Access token (optional for callback)
     * @return Payment response details
     */
    @Transactional
    public Map<String, Object> handlePaymentResponse(String encResponse, String workingKey) throws Exception {

        System.out.println("\n=================================================");
        System.out.println("🔄   CCAVENUE PAYMENT RESPONSE HANDLER          ");
        System.out.println("=================================================");

        // 🔓 DECRYPT RESPONSE
        String decryptedResponse = CCAvenueCrypto.decrypt(encResponse, workingKey);

        System.out.println("🔓 Decrypted Response: " + decryptedResponse);

        // 📋 PARSE RESPONSE
        Map<String, String> responseMap = parseResponse(decryptedResponse);

        String orderStatus = responseMap.get("order_status");
        String orderId = responseMap.get("order_id");
        String trackingId = responseMap.get("tracking_id");
        String bankRefNo = responseMap.get("bank_ref_no");
        String failureMessage = responseMap.get("failure_message");
        String paymentMode = responseMap.get("payment_mode");
        String statusMessage = responseMap.get("status_message");

        System.out.println("📦 Order ID       : " + orderId);
        System.out.println("📊 Order Status   : " + orderStatus);
        System.out.println("🔍 Tracking ID    : " + trackingId);
        System.out.println("🏦 Bank Ref No    : " + bankRefNo);

        // 🔍 FETCH ORDER
        OrdersEntity order = ordersRepository.findByOrderNumber(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // 💳 UPDATE ORDER BASED ON STATUS
        Map<String, Object> result = new LinkedHashMap<>();

        if ("Success".equalsIgnoreCase(orderStatus)) {

            order.setPaymentStatus("SUCCESS");
            order.setStatus("CONFIRMED");
            order.setBankRefNum(bankRefNo);
            order.setApiRefNum(trackingId);

            System.out.println("✅ Payment SUCCESS - Order confirmed");

            // ================= KITCHEN NOTIFICATION (Only on payment success for PG orders) =================
            Map<String, Object> notifData = new LinkedHashMap<>();
            notifData.put("type", "NEW_ORDER");
            notifData.put("orderId", order.getOrderNumber());
            notifData.put("orderType", order.getOrderType());
            notifData.put("amount", order.getTotalAmount());
            notifData.put("paymentMethod", order.getPaymentMethod());
            notifData.put("branchId", order.getBranchId().getId());
            notifData.put("restaurantId", order.getRestaurantId().getId());

            constant.sendNotificationByBranchAndRole(order.getBranchId().getId(), "KITCHEN",
                    "🍽️ New Order Received!",
                    "Order #" + order.getOrderNumber() + " has arrived. Please start preparing.",
                    notifData);

            // ================= ADD ORDER TO KITCHEN CACHE =================
            Map<String, Object> cachePayload = new LinkedHashMap<>();
            cachePayload.put("orderId", order.getId());
            cachePayload.put("branchId", order.getBranchId().getId());
            cachePayload.put("orderType", order.getOrderType());
            cachePayload.put("amount", order.getTotalAmount());
            cachePayload.put("status", "PENDING");
            cachePayload.put("createdAt", order.getCreatedAt());
            cacheData.addKitchenPendingOrder(cachePayload);

            System.out.println("✅ Kitchen notified and cache updated for Order: " + order.getOrderNumber());

            // ================= SCHEDULE TABLE AUTO-RELEASE (DINE_IN) =================
            String ot = order.getOrderType();
            if ("DINE_IN".equalsIgnoreCase(ot) || "DINING".equalsIgnoreCase(ot)) {
                TableBookingEntity tableBooking = order.getTableBookingId();
                if (tableBooking != null && tableBooking.getTableId() != null) {
                    DiningTablesEntity diningTable = tableBooking.getTableId();
                    diningTableReleaseScheduler.scheduleRelease(diningTable.getId());
                }
            }

            result.put("status", "SUCCESS");
            result.put("message", "Payment successful! Your order has been confirmed.");

        } else if ("Failure".equalsIgnoreCase(orderStatus)) {

            order.setPaymentStatus("FAILED");
            order.setStatus("PAYMENT_FAILED");
            order.setBankRefNum(bankRefNo);
            order.setApiRefNum(trackingId);

            System.out.println("❌ Payment FAILED");

            cacheData.removeKitchenOrderByOrderId(order.getId());

            result.put("status", "FAILURE");
            result.put("message", "Payment failed: " + (failureMessage != null ? failureMessage : "Unknown error"));

        } else if ("Aborted".equalsIgnoreCase(orderStatus)
                || "Cancelled".equalsIgnoreCase(orderStatus)) {

            order.setPaymentStatus("CANCELLED");
            order.setStatus("CANCELLED");

            System.out.println("⚠️ Payment ABORTED/CANCELLED");

            cacheData.removeKitchenOrderByOrderId(order.getId());

            result.put("status", "ABORTED");
            result.put("message", "Payment was cancelled. Order has been rejected.");

        } else {

            order.setPaymentStatus("INVALID");
            order.setStatus("PAYMENT_INVALID");

            System.out.println("🚫 INVALID PAYMENT STATUS");

            cacheData.removeKitchenOrderByOrderId(order.getId());

            result.put("status", "INVALID");
            result.put("message", "Invalid payment response");
        }

        order.setUpdatedAt(LocalDateTime.now());
        ordersRepository.save(order);

        result.put("order_id", orderId);
        result.put("order_number", order.getOrderNumber());
        result.put("tracking_id", trackingId);
        result.put("bank_ref_no", bankRefNo);
        result.put("payment_mode", paymentMode);
        result.put("status_message", statusMessage);
        result.put("amount", order.getTotalAmount());

        System.out.println("✅ Order status updated successfully");
        System.out.println("=================================================\n");

        return result;
    }

    @Transactional
    public Map<String, Object> handleReservationPaymentResponse(String encResponse, String workingKey) throws Exception {
        String decryptedResponse = CCAvenueCrypto.decrypt(encResponse, workingKey);
        Map<String, String> responseMap = parseResponse(decryptedResponse);

        String orderStatus = responseMap.get("order_status");
        String orderId = responseMap.get("order_id");
        String trackingId = responseMap.get("tracking_id");
        String bankRefNo = responseMap.get("bank_ref_no");
        String failureMessage = responseMap.get("failure_message");
        String paymentMode = responseMap.get("payment_mode");
        String statusMessage = responseMap.get("status_message");

        Long bookingId = resolveBookingId(orderId, responseMap.get("merchant_param1"));
        TableBookingEntity booking = tableBookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + bookingId));

        Map<String, Object> result = new LinkedHashMap<>();
        if ("Success".equalsIgnoreCase(orderStatus)) {
            booking.setPaymentStatus("SUCCESS");
            if (booking.getStatus() == null || booking.getStatus().isBlank() || "PENDING".equalsIgnoreCase(booking.getStatus())) {
                booking.setStatus("RESERVED");
            }
            result.put("status", "SUCCESS");
            result.put("message", "Reservation confirmed successfully.");
        } else if ("Failure".equalsIgnoreCase(orderStatus)) {
            booking.setPaymentStatus("FAILED");
            booking.setStatus("CANCELLED");
            releaseReservationTable(booking);
            result.put("status", "FAILURE");
            result.put("message", "Reservation payment failed: " + (failureMessage != null ? failureMessage : "Unknown error"));
        } else if ("Aborted".equalsIgnoreCase(orderStatus)) {
            booking.setPaymentStatus("CANCELLED");
            booking.setStatus("CANCELLED");
            releaseReservationTable(booking);
            result.put("status", "ABORTED");
            result.put("message", "Reservation payment was cancelled.");
        } else {
            booking.setPaymentStatus("INVALID");
            booking.setStatus("CANCELLED");
            releaseReservationTable(booking);
            result.put("status", "INVALID");
            result.put("message", "Invalid reservation payment response");
        }

        tableBookingRepository.save(booking);

        result.put("booking_id", booking.getId());
        result.put("tracking_id", trackingId);
        result.put("bank_ref_no", bankRefNo);
        result.put("payment_mode", paymentMode);
        result.put("status_message", statusMessage);
        result.put("amount", booking.getAmount());
        result.put("table_number", booking.getTableId() != null ? booking.getTableId().getTableNumber() : null);
        result.put("booking_status", booking.getStatus());
        return result;
    }

    /**
     * Parse CCAvenue response string
     * @param response - Decrypted response string
     * @return Map of key-value pairs
     */
    private Map<String, String> parseResponse(String response) {
        Map<String, String> map = new HashMap<>();

        String[] pairs = response.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2) {
                map.put(keyValue[0], keyValue[1]);
            }
        }

        return map;
    }

    private PaymentGatewayEntity findCCAvenueGatewayForRestaurant(Long restaurantId) {
        return paymentGatewayRepository
                .findByRestaurantId_IdAndVendornameAndStatusAndOnOf(restaurantId, "ccavenue", true, "ON")
                .orElseThrow(() -> new RuntimeException("CCAvenue payment gateway not configured for this restaurant"));
    }

    // CCAvenue exposes a dedicated test endpoint. Read the restaurant's configured
    // mode from credentials; default to LIVE so existing prod rows keep working.
    private String resolveCCAvenueInitiateUrl(PaymentGatewayEntity paymentGateway) {
        String mode = extractCredential(paymentGateway, "mode", "MODE");
        boolean isTest = mode != null && mode.trim().equalsIgnoreCase("TEST");
        return isTest
                ? "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
                : "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
    }

    private String extractCredential(PaymentGatewayEntity paymentGateway, String primary, String secondary) {
        if (paymentGateway == null || paymentGateway.getCredentials() == null) {
            return null;
        }
        if (paymentGateway.getCredentials().has(primary)) {
            return paymentGateway.getCredentials().get(primary).asText();
        }
        if (paymentGateway.getCredentials().has(secondary)) {
            return paymentGateway.getCredentials().get(secondary).asText();
        }
        return null;
    }

    private Long resolveBookingId(String orderId, String merchantParam1) {
        if (merchantParam1 != null && !merchantParam1.isBlank()) {
            return Long.parseLong(merchantParam1);
        }
        if (orderId != null && orderId.startsWith("TBLBOOK_")) {
            return Long.parseLong(orderId.substring("TBLBOOK_".length()));
        }
        throw new RuntimeException("Booking reference missing in payment response");
    }

    private void releaseReservationTable(TableBookingEntity booking) {
        if (booking == null || booking.getTableId() == null) {
            return;
        }
        DiningTablesEntity table = booking.getTableId();
        if (table.getStatus() != null && table.getStatus() == 3) {
            table.setStatus(1);
            table.setUpdatedAt(LocalDateTime.now());
            diningTableReleaseScheduler.setStatus(table.getId(), 1);
        }
    }

    private String extractBaseUrl(String url) {
        if (url == null || url.isEmpty()) {
            throw new RuntimeException("CCAvenue callback base URL could not be determined");
        }
        URI uri = URI.create(url);
        StringBuilder base = new StringBuilder();
        base.append(uri.getScheme()).append("://").append(uri.getHost());
        if (uri.getPort() != -1) {
            base.append(":").append(uri.getPort());
        }
        return base.toString();
    }

    private String firstNonEmpty(String first, String second) {
        if (first != null && !first.isEmpty()) {
            return first;
        }
        return second;
    }
}
