package com.rms.modules.customer.controllers;

import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("api/customer/notifications")
public class CustNotificationController {

    @Autowired
    private CustNotificationService custNotificationService;

    @GetMapping("")
    public ResponseEntity<Object> getNotifications(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "pageNumber", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "20") Integer pageSize) {
        try {
            Map<String, Object> result = custNotificationService.getNotifications(token, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Notifications fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Object> getUnreadCount(@RequestHeader("access_token") String token) {
        try {
            long count = custNotificationService.getUnreadCount(token);
            return ApiResponse.responseBuilder(count, "SUCCESS", HttpStatus.OK, "Unread count fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PutMapping("/read/{id}")
    public ResponseEntity<Object> markAsRead(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            String result = custNotificationService.markAsRead(token, id);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Notification marked as read");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<Object> markAllAsRead(@RequestHeader("access_token") String token) {
        try {
            String result = custNotificationService.markAllAsRead(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "All notifications marked as read");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
