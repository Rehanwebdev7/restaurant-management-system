package com.rms.modules.customer.controllers;

import com.rms.common.entities.OrderReviewEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustOrderReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/customer/reviews")
public class CustOrderReviewController {

    @Autowired
    private CustOrderReviewService custOrderReviewService;

    // ======================== PROTECTED ENDPOINTS (Customer Auth Required) ========================

    /**
     * POST /api/customer/reviews
     * Submit a new review for a delivered order
     * Body: { orderId, rating, reviewText, photoUrl, foodRating, serviceRating, deliveryRating }
     */
    @PostMapping("")
    public ResponseEntity<Object> submitReview(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> body) {
        try {
            OrderReviewEntity review = custOrderReviewService.submitReview(token, body);
            return ApiResponse.responseBuilder(review, "SUCCESS", HttpStatus.CREATED, "Review submitted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Unable to submit review");
        }
    }

    /**
     * PUT /api/customer/reviews/{reviewId}
     * Update own review (within 7 days)
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<Object> updateReview(
            @RequestHeader("access_token") String token,
            @PathVariable Long reviewId,
            @RequestBody Map<String, Object> body) {
        try {
            OrderReviewEntity review = custOrderReviewService.updateReview(token, reviewId, body);
            return ApiResponse.responseBuilder(review, "SUCCESS", HttpStatus.OK, "Review updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Unable to update review");
        }
    }

    /**
     * DELETE /api/customer/reviews/{reviewId}
     * Delete own review
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Object> deleteReview(
            @RequestHeader("access_token") String token,
            @PathVariable Long reviewId) {
        try {
            String result = custOrderReviewService.deleteReview(token, reviewId);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Review deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Unable to delete review");
        }
    }

    /**
     * GET /api/customer/reviews/my
     * Get logged-in customer's own reviews (paginated)
     */
    @GetMapping("/my")
    public ResponseEntity<Object> getMyReviews(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "pageNumber", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = custOrderReviewService.getMyReviews(token, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "My reviews fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * GET /api/customer/reviews/check/{orderId}
     * Check if customer has reviewed a specific order
     */
    @GetMapping("/check/{orderId}")
    public ResponseEntity<Object> checkReviewStatus(
            @RequestHeader("access_token") String token,
            @PathVariable Long orderId) {
        try {
            Map<String, Object> result = custOrderReviewService.checkReviewStatus(token, orderId);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Review status fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ======================== PUBLIC ENDPOINTS (No Auth Required) ========================

    /**
     * GET /api/customer/reviews/restaurant/{restaurantId}
     * Get all public reviews for a restaurant (paginated)
     */
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<Object> getRestaurantReviews(
            @PathVariable Long restaurantId,
            @RequestParam(value = "pageNumber", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = custOrderReviewService.getRestaurantReviews(restaurantId, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Restaurant reviews fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * GET /api/customer/reviews/branch/{branchId}
     * Get all public reviews for a branch (paginated)
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<Object> getBranchReviews(
            @PathVariable Long branchId,
            @RequestParam(value = "pageNumber", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = custOrderReviewService.getBranchReviews(branchId, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Branch reviews fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * GET /api/customer/reviews/summary/{restaurantId}
     * Get rating summary (average ratings + distribution) for a restaurant
     */
    @GetMapping("/summary/{restaurantId}")
    public ResponseEntity<Object> getRestaurantRatingSummary(@PathVariable Long restaurantId) {
        try {
            Map<String, Object> result = custOrderReviewService.getRestaurantRatingSummary(restaurantId);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Rating summary fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * GET /api/customer/reviews/top/{restaurantId}
     * Get top reviews for homepage display (4+ stars, latest 10)
     */
    @GetMapping("/top/{restaurantId}")
    public ResponseEntity<Object> getTopReviews(@PathVariable Long restaurantId) {
        try {
            List<OrderReviewEntity> reviews = custOrderReviewService.getTopReviews(restaurantId);
            return ApiResponse.responseBuilder(reviews, "SUCCESS", HttpStatus.OK, "Top reviews fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
