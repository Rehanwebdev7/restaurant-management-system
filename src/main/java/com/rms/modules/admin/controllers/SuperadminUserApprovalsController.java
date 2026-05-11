package com.rms.modules.superadmin.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.modules.superadmin.services.SuperadminService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("api/admin/user-approvals")
public class SuperadminUserApprovalsController {

    @Autowired
    private SuperadminService superadminService;

    @GetMapping
    public ResponseEntity<Object> getAll(@RequestHeader("access_token") String token,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = superadminService.getUserApprovals(search, approvalStatus, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "User approvals fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            var result = superadminService.getUserApprovalById(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "User fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@RequestHeader("access_token") String token,
            @PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            String result = superadminService.updateUserApproval(id, data, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, result);
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/{id}/impersonate")
    public ResponseEntity<Object> impersonate(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            Map<String, Object> result = superadminService.impersonateUser(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Impersonation token created");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
