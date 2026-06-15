package com.rms.modules.publiccustomer.controllers;

import com.rms.common.entities.RestaurantGalleryEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.restaurant.services.RestRestaurantGalleryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/public/customer/gallery")
public class PublicCustomerGalleryController {

    @Autowired
    private RestRestaurantGalleryService restaurantGalleryService;

    @GetMapping("/get_gallery")
    public ResponseEntity<Object> getGallery(
            @RequestParam Long restaurantId,
            @RequestParam(required = false) String platform) {
        try {
            List<RestaurantGalleryEntity> result = restaurantGalleryService.getGalleryByRestaurantAndPlatform(restaurantId, platform);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Gallery images fetched successfully");
        } catch (IllegalArgumentException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
