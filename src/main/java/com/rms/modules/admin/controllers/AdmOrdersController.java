package com.rms.modules.admin.controllers;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.modules.restaurant.services.RestOrdersService;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController
@RequestMapping("api/admin/orders")
public class AdmOrdersController {

    @Autowired
    @Qualifier("restOrdersService")
    private OrdersServiceIMP ordersServiceIMP;

    @Autowired
    private RestOrdersService restOrdersService;

    @GetMapping("/filter")
    public ResponseEntity<Object> getOrdersWithFilters(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "fromDate", required = false) String fromDateStr,
            @RequestParam(value = "toDate", required = false) String toDateStr,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "searchValue", required = false) String searchValue,
            @RequestParam(value = "restaurantId", required = false) Long restaurantId,
            @RequestParam(value = "branchId", required = false) Long branchId,
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
            Map<String, Object> result = restOrdersService.getOrdersWithFiltersAdmin(
                    fromDate, toDate, isActive, status, searchValue, pageNumber, pageSize, token,
                    restaurantId, branchId);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders retrieved successfully");
        } catch (DateTimeParseException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use yyyy-MM-dd");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to fetch orders. Please try again later");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteOrder(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            String result = ordersServiceIMP.deleteOrders(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Order deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/orderUpdate")
    public ResponseEntity<Object> updateOrder(
            @RequestHeader("access_token") String token,
            @RequestBody OrdersEntity ordersEntity) {
        try {
            String result = ordersServiceIMP.updateOrders(ordersEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Order updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
