package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.OutstandingEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.OutstandingRepository;
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
import java.util.Map;

@RestController
@RequestMapping("api/restaurant/outstanding")
public class RestOutstandingController {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private OutstandingRepository outstandingRepository;

    @Autowired
    private TokenUtil tokenUtil;

    @PostMapping("/deduct")
    public ResponseEntity<Object> deductOutstanding(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> data) {
        try {
            Authorization.authorizeRestaurant(token);
            tokenUtil.decryptAndStoreToken(token);
            Integer restaurantId = tokenUtil.getCurrentUserId();

            // Validate request
            if (!data.containsKey("userId") || !data.containsKey("amount")) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "userId and amount are required");
            }

            Long userId = Long.parseLong(data.get("userId").toString());
            BigDecimal amount = new BigDecimal(data.get("amount").toString());

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "Amount must be greater than 0");
            }

            // Get the user
            UsersEntity user = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify user belongs to this restaurant
            if (user.getParentId() == null || !user.getParentId().getId().equals(restaurantId.longValue())) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.FORBIDDEN, "Unauthorized to clear this user's outstanding");
            }

            // Check current outstanding balance
            BigDecimal currentOutstanding = user.getOutstandingBalance() != null ? user.getOutstandingBalance() : BigDecimal.ZERO;
            if (amount.compareTo(currentOutstanding) > 0) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "Amount (" + amount + ") exceeds outstanding balance (" + currentOutstanding + ")");
            }

            // Deduct outstanding balance from user
            usersRepository.deductOutstandingBalance(userId.intValue(), amount);

            // Create outstanding record for history
            OutstandingEntity outstanding = new OutstandingEntity();
            outstanding.setUserId(user);
            outstanding.setAmount(amount);
            outstanding.setDate(LocalDate.now());
            outstanding.setMode(2); // 2 = payment mode
            outstanding.setRemark(data.containsKey("remark") && data.get("remark") != null ? data.get("remark").toString() : "Outstanding cleared");

            // Get updated user to set opening/closing balance
            UsersEntity updatedUser = usersRepository.findById(userId).orElse(user);
            outstanding.setOpeningBal(currentOutstanding);
            outstanding.setClosingBal(updatedUser.getOutstandingBalance() != null ? updatedUser.getOutstandingBalance() : BigDecimal.ZERO);

            outstandingRepository.save(outstanding);

            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Outstanding cleared successfully");

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
