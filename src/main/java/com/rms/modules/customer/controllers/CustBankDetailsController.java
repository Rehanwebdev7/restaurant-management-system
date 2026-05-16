package com.rms.modules.customer.controllers;

import com.rms.common.entities.BankDetailsEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustBankDetailsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("api/customer/bank_details")
public class CustBankDetailsController {

    @Autowired
    private CustBankDetailsService custBankDetailsService;

    @PostMapping("/add")
    public ResponseEntity<Object> addBankDetails(
            @RequestHeader("access_token") String token,
            @RequestBody BankDetailsEntity bankDetailsEntity) {
        try {
            String result = custBankDetailsService.addBankDetails(bankDetailsEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
                    "Bank details added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error");
        }
    }

    @GetMapping("/myBankDetails")
    public ResponseEntity<Object> getMyBankDetails(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(defaultValue = "10", required = false) Integer pageSize,
            @RequestParam(required = false) String status) {
        try {
            Map<String, Object> result = custBankDetailsService.getMyBankDetails(pageNumber, pageSize, status, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
                    "Bank details retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error");
        }
    }
}
