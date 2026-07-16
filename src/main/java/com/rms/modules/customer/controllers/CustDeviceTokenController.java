package com.rms.modules.customer.controllers;

import com.rms.common.entities.DeviceTokenEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustDeviceTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Customer-scoped FCM device-token endpoints (Batch 5).
 *
 * Endpoints:
 *   POST   /api/customer/device_token/register     → save FCM token for the customer
 *   DELETE /api/customer/device_token/{id}         → remove one token (logout / uninstall)
 *   GET    /api/customer/device_token/mine         → list all tokens registered by this customer
 */
@RestController
@RequestMapping("api/customer/device_token")
public class CustDeviceTokenController {

    @Autowired
    private CustDeviceTokenService deviceTokenService;

    @PostMapping("/register")
    public ResponseEntity<Object> register(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> payload) {
        try {
            String fcmToken = payload.get("fcmToken") != null ? payload.get("fcmToken").toString() : null;
            String platform = payload.get("platform") != null ? payload.get("platform").toString() : "web";
            if (fcmToken == null || fcmToken.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "fcmToken is required");
            }
            DeviceTokenEntity saved = deviceTokenService.register(token, fcmToken, platform);
            return ApiResponse.responseBuilder(saved, "SUCCESS", HttpStatus.OK, "Device token registered");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> unregister(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            String result = deviceTokenService.unregister(token, id);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, result);
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<Object> listMine(@RequestHeader("access_token") String token) {
        try {
            List<DeviceTokenEntity> tokens = deviceTokenService.listMine(token);
            return ApiResponse.responseBuilder(tokens, "SUCCESS", HttpStatus.OK, "Device tokens fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
