package com.rms.modules.kitchen.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.modules.kitchen.services.KitNotificationsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/kitchen/notifications")
public class KitNotificationsController {

    @Autowired
    private KitNotificationsService kitNotificationsService;

    @GetMapping
    public ResponseEntity<Object> getNotifications(@RequestHeader("access_token") String token) {
        try {
            return ApiResponse.responseBuilder(
                    kitNotificationsService.getNotifications(token),
                    "SUCCESS", HttpStatus.OK, "Notifications fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Object> markAsRead(@RequestHeader("access_token") String token,
                                             @PathVariable Long id) {
        try {
            kitNotificationsService.markAsRead(token, id);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Marked as read");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<Object> markAllAsRead(@RequestHeader("access_token") String token) {
        try {
            kitNotificationsService.markAllAsRead(token);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "All marked as read");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Object> clearAll(@RequestHeader("access_token") String token) {
        try {
            kitNotificationsService.clearAll(token);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Notifications cleared");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
