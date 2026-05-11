package com.rms.modules.admin.controllers;

import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.serviceImplement.DiningTablesServiceIMP;
import com.rms.modules.restaurant.services.RestDiningTablesService;
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
@RequestMapping("api/admin/dining_tables")
public class AdmDiningTablesController {

    @Autowired
    @Qualifier("restDiningTablesService")
    private DiningTablesServiceIMP diningTablesServiceIMP;

    @Autowired
    private RestDiningTablesService restDiningTablesService;

    @GetMapping("/filter")
    public ResponseEntity<Object> getDiningTablesWithFilters(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "fromDate", required = false) String fromDateStr,
            @RequestParam(value = "toDate", required = false) String toDateStr,
            @RequestParam(value = "searchValue", required = false) String searchValue,
            @RequestParam(value = "capacity", required = false) Integer capacity,
            @RequestParam(value = "status", required = false) Integer status,
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
            Map<String, Object> result = restDiningTablesService.getDiningTablesWithFilters(
                    fromDate, toDate, searchValue, capacity, status, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Dining tables fetched successfully");
        } catch (DateTimeParseException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use yyyy-MM-dd");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to fetch dining tables");
        }
    }

    @PostMapping("/add")
    public ResponseEntity<Object> addDiningTable(
            @RequestHeader("access_token") String token,
            @RequestBody DiningTablesEntity diningTablesEntity) {
        try {
            String result = diningTablesServiceIMP.addDiningTables(diningTablesEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Dining table added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/update")
    public ResponseEntity<Object> updateDiningTable(
            @RequestHeader("access_token") String token,
            @RequestBody DiningTablesEntity diningTablesEntity) {
        try {
            String result = diningTablesServiceIMP.updateDiningTables(diningTablesEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Dining table updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteDiningTable(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            String result = diningTablesServiceIMP.deleteDiningTables(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Dining table deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
