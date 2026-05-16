package com.rms.modules.customer.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustWithdrawalService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("api/customer/wallet")
public class CustWithdrawalController {

    @Autowired
    private CustWithdrawalService withdrawalService;

    /**
     * Create withdrawal request
     */
    @PostMapping("/withdrawal-request")
    public ResponseEntity<Object> createWithdrawalRequest(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> payload) {
        try {
            Long bankDetailId = payload.get("bankDetailId") != null
                ? Long.parseLong(payload.get("bankDetailId").toString())
                : null;
            BigDecimal amount = payload.get("amount") != null
                ? new BigDecimal(payload.get("amount").toString())
                : null;

            if (bankDetailId == null) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "Bank detail ID is required");
            }
            if (amount == null) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "Amount is required");
            }

            Map<String, Object> result = withdrawalService.createWithdrawalRequest(bankDetailId, amount, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Withdrawal request created successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Get withdrawal history
     */
    @GetMapping("/withdrawal-history")
    public ResponseEntity<Object> getWithdrawalHistory(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = withdrawalService.getWithdrawalHistory(pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Withdrawal history retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Get wallet balance
     */
    @GetMapping("/balance")
    public ResponseEntity<Object> getWalletBalance(@RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = withdrawalService.getWalletBalance(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Wallet balance retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
