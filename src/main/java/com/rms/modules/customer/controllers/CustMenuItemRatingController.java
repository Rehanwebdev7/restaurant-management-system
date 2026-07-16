package com.rms.modules.customer.controllers;

import com.rms.common.entities.MenuItemRatingEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustMenuItemRatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Customer-facing menu-item ratings + reviews (Batch 5).
 *
 * Endpoints:
 *   POST /api/customer/menu_item_ratings/submit          → auth, upserts a rating
 *   GET  /api/customer/menu_item_ratings/summary/{id}    → public, avg + count
 *   GET  /api/customer/menu_item_ratings/for-item/{id}   → public, full list
 */
@RestController
@RequestMapping("api/customer/menu_item_ratings")
public class CustMenuItemRatingController {

    @Autowired
    private CustMenuItemRatingService ratingService;

    @PostMapping("/submit")
    public ResponseEntity<Object> submitRating(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> payload) {
        try {
            Long itemId = payload.get("menuItemId") != null
                    ? Long.parseLong(payload.get("menuItemId").toString())
                    : null;
            Integer rating = payload.get("rating") != null
                    ? Integer.parseInt(payload.get("rating").toString())
                    : null;
            if (itemId == null || rating == null) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "menuItemId and rating are required");
            }
            Map<String, Object> summary = ratingService.submitRating(token, itemId, rating);
            return ApiResponse.responseBuilder(summary, "SUCCESS", HttpStatus.OK, "Rating submitted");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @GetMapping("/summary/{itemId}")
    public ResponseEntity<Object> getSummary(@PathVariable Long itemId) {
        try {
            Map<String, Object> summary = ratingService.getRatingSummary(itemId);
            return ApiResponse.responseBuilder(summary, "SUCCESS", HttpStatus.OK, "Summary fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @GetMapping("/for-item/{itemId}")
    public ResponseEntity<Object> getRatingsForItem(@PathVariable Long itemId) {
        try {
            List<MenuItemRatingEntity> ratings = ratingService.getRatingsForItem(itemId);
            return ApiResponse.responseBuilder(ratings, "SUCCESS", HttpStatus.OK, "Ratings fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
