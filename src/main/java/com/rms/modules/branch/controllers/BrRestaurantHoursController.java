package com.rms.modules.branch.controllers;

import com.rms.common.entities.RestaurantHoursEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.branch.services.BrRestaurantHoursService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/branch/restaurant_hours")
public class BrRestaurantHoursController {

    @Autowired
    private BrRestaurantHoursService brRestaurantHoursService;

    @GetMapping("/filter")
    public ResponseEntity<Object> getFilter(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = brRestaurantHoursService.getFilter(token, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Restaurant hours fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Unable to fetch restaurant hours");
        }
    }

    @PutMapping("/bulkAdd")
    public ResponseEntity<Object> bulkAdd(
            @RequestHeader("access_token") String token,
            @RequestBody List<RestaurantHoursEntity> hoursList) {
        try {
            String result = brRestaurantHoursService.bulkAdd(token, hoursList);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Restaurant hours saved successfully");
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
