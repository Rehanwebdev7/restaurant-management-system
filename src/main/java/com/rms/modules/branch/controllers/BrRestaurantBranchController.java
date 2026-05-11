package com.rms.modules.branch.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.common.services.BranchStatusService;
import com.rms.common.util.AES256Util;
import com.rms.configuration.Authorization;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/branch/restaurant_branch")
public class BrRestaurantBranchController {

    @Autowired
    private BranchStatusService branchStatusService;

    private Long getBranchIdFromToken(String token) throws Exception {
        String decrypted = AES256Util.decrypt(token);
        JSONObject json = new JSONObject(decrypted);
        return json.getLong("id");
    }

    @GetMapping("/branch-status")
    public ResponseEntity<Object> getBranchStatus(@RequestHeader("access_token") String token) {
        try {
            Authorization.authorizeBranch(token);
            Long branchId = getBranchIdFromToken(token);
            Object result = branchStatusService.getBranchStatus(branchId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Branch status fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/stop-orders")
    public ResponseEntity<Object> stopOrders(@RequestHeader("access_token") String token) {
        try {
            Authorization.authorizeBranch(token);
            Long branchId = getBranchIdFromToken(token);
            branchStatusService.stopOrders(branchId, token);
            Object result = branchStatusService.getBranchStatus(branchId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders stopped successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/resume-orders")
    public ResponseEntity<Object> resumeOrders(@RequestHeader("access_token") String token) {
        try {
            Authorization.authorizeBranch(token);
            Long branchId = getBranchIdFromToken(token);
            branchStatusService.scheduleRelease(branchId, token);
            Object result = branchStatusService.getBranchStatus(branchId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders resumed successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
