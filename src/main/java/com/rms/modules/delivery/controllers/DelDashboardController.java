package com.rms.modules.delivery.controllers;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.OrdersRepository;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregated dashboard stats for a delivery partner.
 * GET /api/delivery/dashboard/summary?fromDate&toDate
 */
@RestController
@RequestMapping("api/delivery/dashboard")
public class DelDashboardController {

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    @GetMapping("/summary")
    public ResponseEntity<Object> getDashboardSummary(@RequestHeader("access_token") String token,
            @RequestParam(value = "fromDate", required = false) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) LocalDate toDate) {

        try {
            Authorization.authorizeDelivery(token);
            tokenUtil.decryptAndStoreToken(token);
            Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

            LocalDate effectiveTo = toDate != null ? toDate : LocalDate.now();
            LocalDate effectiveFrom = fromDate != null ? fromDate : effectiveTo.minusDays(30);

            LocalDateTime fromDt = effectiveFrom.atStartOfDay();
            LocalDateTime toDt = effectiveTo.atTime(LocalTime.MAX);

            UsersEntity delivery = usersRepository.findById(deliveryUserId)
                    .orElseThrow(() -> new RuntimeException("Delivery user not found"));

            List<OrdersEntity> orders = ordersRepository.findByDeliveryIdAndCreatedAtBetween(delivery, fromDt, toDt);

            long totalAssigned = orders.size();
            long delivered = 0;
            long active = 0;
            long cancelled = 0;
            BigDecimal totalEarnings = BigDecimal.ZERO;
            BigDecimal codCollected = BigDecimal.ZERO;

            for (OrdersEntity o : orders) {
                String status = o.getStatus() != null ? o.getStatus().toUpperCase() : "";
                String delStatus = o.getDeliveryStatus() != null ? o.getDeliveryStatus().toUpperCase() : "";
                boolean isDelivered = "DELIVERED".equals(status) || "DELIVERED".equals(delStatus)
                        || "COMPLETED".equals(status);
                boolean isCancelled = "CANCELLED".equals(status) || "CANCELLED".equals(delStatus);

                if (isDelivered) {
                    delivered++;
                    if (o.getDeliveryFee() != null) {
                        totalEarnings = totalEarnings.add(o.getDeliveryFee());
                    }
                    if ("CASH".equalsIgnoreCase(o.getPaymentMethod()) && o.getTotalAmount() != null) {
                        codCollected = codCollected.add(o.getTotalAmount());
                    }
                } else if (isCancelled) {
                    cancelled++;
                } else {
                    active++;
                }
            }

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("totalAssigned", totalAssigned);
            summary.put("delivered", delivered);
            summary.put("active", active);
            summary.put("cancelled", cancelled);
            summary.put("totalEarnings", totalEarnings);
            summary.put("codCollected", codCollected);

            Map<String, Object> period = new LinkedHashMap<>();
            period.put("fromDate", effectiveFrom);
            period.put("toDate", effectiveTo);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("summary", summary);
            data.put("period", period);

            return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.OK,
                    "Delivery dashboard data fetched successfully");

        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error");
        } finally {
            tokenUtil.clearTokenData();
        }
    }
}
