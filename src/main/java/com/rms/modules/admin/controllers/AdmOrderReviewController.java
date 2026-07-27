package com.rms.modules.admin.controllers;

import com.rms.common.entities.OrderReviewEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.admin.services.AdmOrderReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("api/admin/reviews")
public class AdmOrderReviewController {

    @Autowired
    private AdmOrderReviewService admOrderReviewService;

    /**
     * GET /api/admin/reviews
     * Get all reviews for the restaurant (includes hidden)
     */
    @GetMapping("")
    public ResponseEntity<Object> getAllReviews(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "pageNumber", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "20") Integer pageSize) {
        try {
            Map<String, Object> result = admOrderReviewService.getAllReviews(token, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Reviews fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * GET /api/admin/reviews/summary
     * Get rating summary for dashboard
     */
    @GetMapping("/summary")
    public ResponseEntity<Object> getRatingSummary(@RequestHeader("access_token") String token) {
        try {
            Map<String, Object> result = admOrderReviewService.getRatingSummary(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Rating summary fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * PUT /api/admin/reviews/reply/{reviewId}
     * Reply to a customer review
     */
    @PutMapping("/reply/{reviewId}")
    public ResponseEntity<Object> replyToReview(
            @RequestHeader("access_token") String token,
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> body) {
        try {
            String reply = body.get("reply");
            if (reply == null || reply.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "Reply text is required");
            }
            OrderReviewEntity review = admOrderReviewService.replyToReview(token, reviewId, reply.trim());
            return ApiResponse.responseBuilder(review, "SUCCESS", HttpStatus.OK, "Reply added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * PUT /api/admin/reviews/visibility/{reviewId}
     * Toggle review visibility (hide/show from public)
     */
    @PutMapping("/visibility/{reviewId}")
    public ResponseEntity<Object> toggleVisibility(
            @RequestHeader("access_token") String token,
            @PathVariable Long reviewId) {
        try {
            OrderReviewEntity review = admOrderReviewService.toggleVisibility(token, reviewId);
            String msg = review.getIsVisible() ? "Review is now visible" : "Review is now hidden";
            return ApiResponse.responseBuilder(review, "SUCCESS", HttpStatus.OK, msg);
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * DELETE /api/admin/reviews/{reviewId}
     * Delete a review permanently
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Object> deleteReview(
            @RequestHeader("access_token") String token,
            @PathVariable Long reviewId) {
        try {
            String result = admOrderReviewService.deleteReview(token, reviewId);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Review deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
