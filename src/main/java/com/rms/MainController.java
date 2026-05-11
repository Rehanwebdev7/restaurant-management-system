package com.rms;

import com.rms.common.response.ApiResponse;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class MainController implements ErrorController {
    
    // 1. Root endpoint
    @GetMapping("/")
    public ResponseEntity<Object> rootEndpoint() {
        return ApiResponse.responseBuilder(
            null,
            "SUCCESS",
            HttpStatus.OK,
            "RMS API Server is running"
        );
    }
    
    // 2. Health check endpoint (optional but recommended)
    @GetMapping("/health")
    public ResponseEntity<Object> healthCheck() {
        return ApiResponse.responseBuilder(
            null,
            "SUCCESS",
            HttpStatus.OK,
            "Server is healthy"
        );
    }
    
    // 3. Handle all 404 errors
    @RequestMapping("/error")
    public ResponseEntity<Object> handleError(HttpServletRequest request) {
        return ApiResponse.responseBuilder(
            null,
            "NOT_FOUND",
            HttpStatus.NOT_FOUND,
            "API endpoint not found"
        );
    }
}