package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.SubscriptionPlanEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.SubscriptionPlanRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.response.ApiResponse;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/admin/subscriptions")
public class SuperadminSubscriptionsController {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private UsersRepository usersRepository;

    // Get all restaurants for dropdown
    @GetMapping("/restaurants")
    public ResponseEntity<Object> getRestaurants(
            @RequestHeader("access_token") String token,
            @RequestParam(required = false, defaultValue = "") String search) {
        try {
            Authorization.authorizeSupadmin(token);

            List<UsersEntity> restaurants;
            if (search != null && !search.isEmpty()) {
                restaurants = usersRepository.findByRoleAndNameContainingIgnoreCaseAndIsDeletedFalse("restaurant", search);
            } else {
                restaurants = usersRepository.findByRoleAndIsDeletedFalse("restaurant");
            }

            // Map to simple format for dropdown
            List<Map<String, Object>> result = restaurants.stream().map(r -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", r.getId());
                map.put("name", r.getName());
                map.put("email", r.getEmail());
                map.put("mobile", r.getMobile());
                return map;
            }).collect(java.util.stream.Collectors.toList());

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Restaurants retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + e.getMessage());
        }
    }

    // Get all subscriptions with pagination and filters
    @GetMapping("")
    public ResponseEntity<Object> getAll(
            @RequestHeader("access_token") String token,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "") String status,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Authorization.authorizeSupadmin(token);

            Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "subscriptionId"));
            Page<SubscriptionEntity> page = subscriptionRepository.searchSubscriptions(search, status, pageable);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", page.getContent());
            response.put("totalElements", page.getTotalElements());
            response.put("totalPages", page.getTotalPages());
            response.put("currentPage", page.getNumber());
            response.put("pageSize", page.getSize());

            return ApiResponse.responseBuilder(response, "SUCCESS", HttpStatus.OK, "Subscriptions retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + e.getMessage());
        }
    }

    // Get subscription by ID
    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            Authorization.authorizeSupadmin(token);

            SubscriptionEntity subscription = subscriptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            return ApiResponse.responseBuilder(subscription, "SUCCESS", HttpStatus.OK, "Subscription retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    // Assign subscription to user (POST to root path)
    @PostMapping("")
    public ResponseEntity<Object> assign(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> data) {
        try {
            Authorization.authorizeSupadmin(token);

            // Validate required fields
            if (!data.containsKey("user_id") || !data.containsKey("plan_id")) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "User ID and Plan ID are required");
            }

            Long userId = Long.parseLong(data.get("user_id").toString());
            Long planId = Long.parseLong(data.get("plan_id").toString());

            // Get user and plan
            UsersEntity user = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            SubscriptionPlanEntity plan = subscriptionPlanRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Plan not found"));

            // Create subscription
            SubscriptionEntity subscription = new SubscriptionEntity();
            subscription.setUser(user);
            subscription.setPlan(plan);

            // Set start date
            LocalDate startDate = LocalDate.now();
            if (data.containsKey("start_date") && data.get("start_date") != null && !data.get("start_date").toString().isEmpty()) {
                startDate = LocalDate.parse(data.get("start_date").toString());
            }
            subscription.setStartDate(startDate);

            // Calculate end date based on plan duration
            subscription.setEndDate(startDate.plusDays(plan.getDurationDays()));

            // Set amount
            BigDecimal amountPaid = plan.getPrice();
            BigDecimal discountAmount = BigDecimal.ZERO;

            // Apply coupon if provided
            if (data.containsKey("coupon_code") && data.get("coupon_code") != null && !data.get("coupon_code").toString().isEmpty()) {
                subscription.setCouponCode(data.get("coupon_code").toString());
                // TODO: Apply coupon discount logic here
            }

            subscription.setAmountPaid(amountPaid.subtract(discountAmount));
            subscription.setDiscountAmount(discountAmount);

            // Set optional fields
            if (data.containsKey("payment_reference")) {
                subscription.setPaymentReference(data.get("payment_reference").toString());
            }
            if (data.containsKey("notes")) {
                subscription.setNotes(data.get("notes").toString());
            }

            subscription.setStatus("active");

            subscriptionRepository.save(subscription);

            return ApiResponse.responseBuilder(subscription, "SUCCESS", HttpStatus.CREATED, "Subscription assigned successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + e.getMessage());
        }
    }

    // Update subscription
    @PutMapping("/{id}")
    public ResponseEntity<Object> update(
            @RequestHeader("access_token") String token,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        try {
            Authorization.authorizeSupadmin(token);

            SubscriptionEntity subscription = subscriptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            // Update fields
            if (data.containsKey("status")) {
                subscription.setStatus(data.get("status").toString());
            }
            if (data.containsKey("end_date") && data.get("end_date") != null) {
                subscription.setEndDate(LocalDate.parse(data.get("end_date").toString()));
            }
            if (data.containsKey("notes")) {
                subscription.setNotes(data.get("notes").toString());
            }

            subscriptionRepository.save(subscription);

            return ApiResponse.responseBuilder(subscription, "SUCCESS", HttpStatus.OK, "Subscription updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    // Cancel subscription (DELETE method)
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> cancel(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            Authorization.authorizeSupadmin(token);

            SubscriptionEntity subscription = subscriptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            subscription.setStatus("cancelled");
            subscriptionRepository.save(subscription);

            return ApiResponse.responseBuilder(subscription, "SUCCESS", HttpStatus.OK, "Subscription cancelled successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    // Grant grace period
    @PostMapping("/{id}/grant-grace")
    public ResponseEntity<Object> grantGrace(
            @RequestHeader("access_token") String token,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        try {
            Authorization.authorizeSupadmin(token);

            SubscriptionEntity subscription = subscriptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            int graceDays = 2; // default
            if (data.containsKey("grace_days")) {
                graceDays = Integer.parseInt(data.get("grace_days").toString());
            } else if (data.containsKey("graceDays")) {
                graceDays = Integer.parseInt(data.get("graceDays").toString());
            }

            // Set grace end date from current end date or today
            LocalDate baseDate = subscription.getEndDate() != null ? subscription.getEndDate() : LocalDate.now();
            subscription.setGraceEndDate(baseDate.plusDays(graceDays));
            subscription.setStatus("grace");

            subscriptionRepository.save(subscription);

            return ApiResponse.responseBuilder(subscription, "SUCCESS", HttpStatus.OK, "Grace period granted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
