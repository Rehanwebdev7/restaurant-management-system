package com.rms.modules.customer.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustReferralService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/customer/referral")
public class CustReferralController {

    @Autowired
    private CustReferralService referralService;

    /**
     * Get customer's referral code (generate if not exists)
     */
    @GetMapping("/my-code")
    public ResponseEntity<Object> getMyReferralCode(@RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = referralService.getMyReferralCode(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral code retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Validate a referral code
     */
    @GetMapping("/validate/{code}")
    public ResponseEntity<Object> validateReferralCode(
            @PathVariable String code,
            @RequestHeader(value = "access_token", required = false) String token) {
        try {
            Map<String, Object> result = referralService.validateReferralCode(code, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral code validation complete");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Apply a referral code for the logged-in customer
     */
    @PostMapping("/apply")
    public ResponseEntity<Object> applyReferralCode(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, String> payload) {
        try {
            String code = payload.get("code");
            if (code == null || code.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "Referral code is required");
            }
            String result = referralService.applyReferralCode(code, token);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, result);
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Get referral statistics for the logged-in customer
     */
    @GetMapping("/stats")
    public ResponseEntity<Object> getReferralStats(@RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = referralService.getReferralStats(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral stats retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Get list of referred users for the logged-in customer
     */
    @GetMapping("/referrals")
    public ResponseEntity<Object> getReferralUsers(@RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = referralService.getReferralUsers(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral users retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Get saved referral contacts for logged-in customer
     */
    @GetMapping("/contacts")
    public ResponseEntity<Object> getReferralContacts(@RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = referralService.getReferralContacts(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral contacts retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Save referral contacts for logged-in customer
     */
    @PostMapping("/contacts")
    public ResponseEntity<Object> saveReferralContacts(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> payload) {
        try {
            Object listObj = payload != null ? payload.get("contacts") : null;
            List<Map<String, String>> contacts = listObj instanceof List ? (List<Map<String, String>>) listObj : List.of();
            Map<String, Object> result = referralService.upsertReferralContacts(token, contacts);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral contacts saved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
