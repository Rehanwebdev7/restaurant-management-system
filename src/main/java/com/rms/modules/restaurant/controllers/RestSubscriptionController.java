package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.SubscriptionPlanEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionPlanRepository;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.response.ApiResponse;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/restaurant/subscription")
public class RestSubscriptionController {

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    // Get all active plans (for restaurant to browse and select)
    @GetMapping("/plans")
    public ResponseEntity<Object> getPlans(@RequestHeader("access_token") String token) {
        try {
            Authorization.authorizeRestaurant(token);

            List<SubscriptionPlanEntity> plans = subscriptionPlanRepository.findByIsDeletedFalseAndIsActiveTrue();

            List<Map<String, Object>> result = plans.stream().map(p -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("planId", p.getPlanId());
                map.put("planName", p.getPlanName());
                map.put("description", p.getDescription());
                map.put("price", p.getPrice());
                map.put("durationDays", p.getDurationDays());
                map.put("maxBranch", p.getMaxBranch());
                map.put("maxKitchen", p.getMaxKitchen());
                map.put("maxDeliveryBoy", p.getMaxDeliveryBoy());
                map.put("features", p.getFeatures());
                return map;
            }).collect(Collectors.toList());

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Plans fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Error: " + e.getMessage());
        }
    }

    // Get current restaurant's active subscription
    @GetMapping("/current")
    public ResponseEntity<Object> getCurrentSubscription(@RequestHeader("access_token") String token) {
        try {
            Authorization.authorizeRestaurant(token);
            tokenUtil.decryptAndStoreToken(token);
            Integer restaurantId = tokenUtil.getCurrentUserId();

            List<SubscriptionEntity> activeSubs = subscriptionRepository.findActiveSubscriptionsByUserId(restaurantId.longValue());

            if (activeSubs.isEmpty()) {
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("subscriptionStatus", "none");
                return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "No active subscription");
            }

            SubscriptionEntity sub = activeSubs.get(0);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("subscriptionId", sub.getSubscriptionId());
            result.put("subscriptionStatus", sub.getStatus());
            result.put("planId", sub.getPlan().getPlanId());
            result.put("planName", sub.getPlan().getPlanName());
            result.put("maxBranch", sub.getPlan().getMaxBranch());
            result.put("maxKitchen", sub.getPlan().getMaxKitchen());
            result.put("maxDeliveryBoy", sub.getPlan().getMaxDeliveryBoy());
            result.put("startDate", sub.getStartDate());
            result.put("endDate", sub.getEndDate());

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Subscription fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Error: " + e.getMessage());
        } finally {
            tokenUtil.clearTokenData();
        }
    }

    // Restaurant selects a plan — creates a pending subscription (applies after current ends)
    // If no current subscription, activates immediately
    @PostMapping("/select-plan")
    public ResponseEntity<Object> selectPlan(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> data) {
        try {
            Authorization.authorizeRestaurant(token);
            tokenUtil.decryptAndStoreToken(token);
            Integer restaurantId = tokenUtil.getCurrentUserId();

            if (!data.containsKey("plan_id")) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "plan_id is required");
            }

            Long planId = Long.parseLong(data.get("plan_id").toString());
            SubscriptionPlanEntity plan = subscriptionPlanRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Plan not found"));

            UsersEntity restaurant = usersRepository.findById(restaurantId.longValue())
                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));

            List<SubscriptionEntity> activeSubs = subscriptionRepository.findActiveSubscriptionsByUserId(restaurantId.longValue());

            SubscriptionEntity newSub = new SubscriptionEntity();
            newSub.setUser(restaurant);
            newSub.setPlan(plan);
            newSub.setAmountPaid(plan.getPrice() != null ? plan.getPrice() : BigDecimal.ZERO);
            newSub.setDiscountAmount(BigDecimal.ZERO);

            if (activeSubs.isEmpty()) {
                // No current plan — activate immediately
                LocalDate today = LocalDate.now();
                newSub.setStartDate(today);
                newSub.setEndDate(today.plusDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30));
                newSub.setStatus("active");

                // Re-enable restaurant if it was stopped
                if (Boolean.TRUE.equals(restaurant.getIsOrderStopped())) {
                    restaurant.setIsOrderStopped(false);
                    restaurant.setOrderStoppedAt(null);
                    usersRepository.save(restaurant);
                }
            } else {
                // Active plan exists — queue as pending (applies after current expires)
                SubscriptionEntity current = activeSubs.get(0);
                LocalDate nextStart = current.getEndDate();
                newSub.setStartDate(nextStart);
                newSub.setEndDate(nextStart.plusDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30));
                newSub.setStatus("pending");
            }

            subscriptionRepository.save(newSub);

            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.CREATED,
                    newSub.getStatus().equals("active") ? "Plan activated successfully!" : "Plan queued — will activate after current plan expires");

        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Error: " + e.getMessage());
        } finally {
            tokenUtil.clearTokenData();
        }
    }
}
