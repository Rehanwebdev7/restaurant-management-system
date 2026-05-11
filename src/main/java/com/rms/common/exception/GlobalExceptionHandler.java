package com.rms.common.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.rms.common.response.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 🔥 1. Unique Constraint / Duplicate Entry Errors
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrity(DataIntegrityViolationException ex) {

        String message = ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();

        if (message != null && message.contains("Duplicate entry")) {

            // Column specific message
            if (message.contains("domain_name")) {
                message = "This domain name is already registered. Please use a different one.";
            } else {
                message = "Duplicate value detected. Please provide a unique value.";
            }

        } else {
            message = "Invalid input data. Please verify your values.";
        }

        return ApiResponse.responseBuilder(
                null,
                "FAILURE",
                HttpStatus.BAD_REQUEST,
                message
        );
    }

    // 🔥 2. Validation Errors (Missing fields, wrong format)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult().getFieldError().getDefaultMessage();

        return ApiResponse.responseBuilder(
                null,
                "FAILURE",
                HttpStatus.BAD_REQUEST,
                message
        );
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Object> handleRuntime(SecurityException ex) {

        return ApiResponse.responseBuilder(
                null,
                "FAILURE",
                HttpStatus.UNAUTHORIZED,
                ex.getMessage()
        );
    }
    
    // 🔥 3. Custom Business Logic / Runtime Errors
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntime(RuntimeException ex) {

        return ApiResponse.responseBuilder(
                null,
                "FAILURE",
                HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage()
        );
    }

    // 🔥 4. Catch-All (Unhandled exceptions)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleException(Exception ex) {

        return ApiResponse.responseBuilder(
                null,
                "FAILURE",
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong. Please try again later."
        );
    }
}
