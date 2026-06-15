package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.RestaurantGalleryEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.restaurant.services.RestRestaurantGalleryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("api/restaurant/gallery")
public class RestRestaurantGalleryController {

    @Autowired
    private RestRestaurantGalleryService restaurantGalleryService;

    @PostMapping("/add_gallery")
    public ResponseEntity<Object> addGallery(
            @RequestHeader("access_token") String token,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestParam String title,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Integer displayOrder,
            @RequestParam(required = false) Boolean isActive) {
        try {
            String result = restaurantGalleryService.addGalleryWithImage(
                    image, title, category, platform, description, displayOrder, isActive, token
            );
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Gallery image added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (IllegalArgumentException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/update_gallery")
    public ResponseEntity<Object> updateGallery(
            @RequestHeader("access_token") String token,
            @RequestParam Long galleryId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Integer displayOrder,
            @RequestParam(required = false) Boolean isActive,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            String result = restaurantGalleryService.updateGallery(
                    image, galleryId, title, category, platform, description, displayOrder, isActive, token
            );
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Gallery image updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (IllegalArgumentException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/getAll")
    public ResponseEntity<Object> getAll(
            @RequestParam(defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(defaultValue = "10", required = false) Integer pageSize,
            @RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = restaurantGalleryService.getAllGallery(pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Gallery images fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            RestaurantGalleryEntity result = restaurantGalleryService.getOneGallery(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Gallery image fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            String result = restaurantGalleryService.deleteGallery(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Gallery image deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
