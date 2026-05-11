package com.rms.modules.superadmin.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.modules.superadmin.services.SuperadminService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/admin/users")
public class SuperadminUserDirectoryController {

    @Autowired
    private SuperadminService superadminService;

    @GetMapping
    public ResponseEntity<Object> getAll(@RequestHeader("access_token") String token,
            @RequestParam(required = false) String role_id,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "15") Integer limit) {
        try {
            // Frontend sends 1-based page, convert to 0-based for Spring
            Integer pageNumber = Math.max(0, page - 1);
            Map<String, Object> result = superadminService.getAllUsers(role_id, search, pageNumber, limit, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Users fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/tree")
    public ResponseEntity<Object> getTree(@RequestHeader("access_token") String token,
            @RequestParam(required = false) String search) {
        try {
            List<Map<String, Object>> result = superadminService.getUserTree(search, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "User tree fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/tree/{adminId}")
    public ResponseEntity<Object> getTreeChildren(@RequestHeader("access_token") String token, @PathVariable Long adminId) {
        try {
            List<Map<String, Object>> result = superadminService.getTreeChildren(adminId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Children fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<Object> getDetail(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            Map<String, Object> result = superadminService.getRestaurantDetail(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Restaurant detail fetched");
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
    public ResponseEntity<Object> updateUser(@RequestHeader("access_token") String token,
            @PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            String result = superadminService.updateUser(id, data, token);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, result);
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
    public ResponseEntity<Object> impersonate(@RequestHeader("access_token") String token,
            @PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
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
