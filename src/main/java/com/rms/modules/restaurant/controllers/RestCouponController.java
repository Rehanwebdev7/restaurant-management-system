package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.CouponEntity;
import com.rms.common.response.ApiResponse;
import com.rms.common.serviceImplement.CouponServiceIMP;
import com.rms.modules.restaurant.services.RestCouponService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/restaurant/coupon")
public class RestCouponController {

    @Autowired
    @Qualifier("restCouponService")
    private CouponServiceIMP couponServiceIMP;

    @Autowired
    private RestCouponService restCouponService;

    @GetMapping("/filter")
    public ResponseEntity<Object> getCouponsWithFilters(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "branchId", required = false) Integer branchId,
            @RequestParam(value = "fromDate", required = false) String fromDateStr,
            @RequestParam(value = "toDate", required = false) String toDateStr,
            @RequestParam(value = "active", required = false) Boolean isActive,
            @RequestParam(value = "searchValue", required = false) String searchValue,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            LocalDate fromDate = null;
            LocalDate toDate = null;

            if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                fromDate = LocalDate.parse(fromDateStr, formatter);
                toDate = LocalDate.parse(toDateStr, formatter);
            }

            Map<String, Object> result = restCouponService.getCouponsWithFilters(
                    token, branchId, fromDate, toDate, isActive, searchValue, pageNumber, pageSize);

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Coupons retrieved successfully");
        } catch (DateTimeParseException e) {
            return ApiResponse.responseBuilder(
                    null,
                    "FAILURE",
                    HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(
                    null,
                    "FAILURE",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to fetch coupons. Please try again later");
        }
    }

    @PostMapping(value = "/addCoupons", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> addCoupons(
            @RequestHeader("access_token") String token,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart("payload") String payloadJson) {
        try {
            String result = restCouponService.addCouponMenuItemMultipart(logo, payloadJson, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Coupon added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PutMapping(value = "/updateCoupon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> updateCouponMultipart(
            @RequestHeader("access_token") String token,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart("payload") String payloadJson) {
        try {
            String result = restCouponService.updateCouponMultipart(logo, payloadJson, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Coupon updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
        try {
            List<CouponEntity> result = couponServiceIMP.getAllRecordCoupon(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/add")
    public ResponseEntity<Object> addCoupon(@RequestHeader("access_token") String token, @RequestBody CouponEntity couponEntity) {
        try {
            String result = couponServiceIMP.addCoupon(couponEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Coupon added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Integer id) {
        try {
            CouponEntity result = couponServiceIMP.getOneCoupon(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Coupon retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/update")
    public ResponseEntity<Object> updateCoupon(@RequestHeader("access_token") String token, @RequestBody CouponEntity couponEntity) {
        try {
            String result = couponServiceIMP.updateCoupon(couponEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Coupon updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@RequestHeader("access_token") String token, @PathVariable Integer id) {
        try {
            String result = couponServiceIMP.deleteCoupon(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Coupon deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
