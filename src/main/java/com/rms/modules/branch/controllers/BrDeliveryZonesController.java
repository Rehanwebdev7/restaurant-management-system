package com.rms.modules.branch.controllers;

import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.branch.services.BrDeliveryZonesService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/branch/delivery_zones")
public class BrDeliveryZonesController {

    @Autowired
    private BrDeliveryZonesService brDeliveryZonesService;

    @GetMapping("/filter")
    public ResponseEntity<Object> getFilter(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = brDeliveryZonesService.getFilter(token, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Delivery zones fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Unable to fetch delivery zones");
        }
    }

    @PostMapping("/bulkUpdate")
    public ResponseEntity<Object> bulkUpdate(
            @RequestHeader("access_token") String token,
            @RequestBody List<DeliveryZonesEntity> list) {
        try {
            String result = brDeliveryZonesService.bulkUpdate(list, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Delivery zones saved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
