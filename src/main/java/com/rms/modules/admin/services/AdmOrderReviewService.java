package com.rms.modules.admin.services;

import com.rms.common.entities.OrderReviewEntity;
import com.rms.common.repositories.OrderReviewRepository;
import com.rms.common.util.AES256Util;
import com.rms.configuration.Authorization;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdmOrderReviewService {

    @Autowired
    private OrderReviewRepository orderReviewRepository;

    private Long getRestaurantIdFromToken(String token) throws Exception {
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        return tokenData.getLong("id");
    }

    /**
     * Get all reviews for the restaurant (admin view - includes hidden reviews)
     */
    public Map<String, Object> getAllReviews(String token, Integer pageNumber, Integer pageSize) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OrderReviewEntity> page = orderReviewRepository.findByRestaurant_IdOrderByCreatedAtDesc(restaurantId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber());
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    /**
     * Get rating summary for the restaurant
     */
    public Map<String, Object> getRatingSummary(String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        Double avgRating = orderReviewRepository.getAverageRatingByRestaurant(restaurantId);
        Double avgFoodRating = orderReviewRepository.getAverageFoodRatingByRestaurant(restaurantId);
        Double avgServiceRating = orderReviewRepository.getAverageServiceRatingByRestaurant(restaurantId);
        Double avgDeliveryRating = orderReviewRepository.getAverageDeliveryRatingByRestaurant(restaurantId);
        long totalReviews = orderReviewRepository.countByRestaurant_IdAndIsVisibleTrue(restaurantId);
        List<Object[]> distribution = orderReviewRepository.getRatingDistributionByRestaurant(restaurantId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
        response.put("averageFoodRating", Math.round(avgFoodRating * 10.0) / 10.0);
        response.put("averageServiceRating", Math.round(avgServiceRating * 10.0) / 10.0);
        response.put("averageDeliveryRating", Math.round(avgDeliveryRating * 10.0) / 10.0);
        response.put("totalReviews", totalReviews);

        Map<Integer, Long> dist = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) dist.put(i, 0L);
        for (Object[] row : distribution) {
            dist.put((Integer) row[0], (Long) row[1]);
        }
        response.put("ratingDistribution", dist);

        return response;
    }

    /**
     * Reply to a review
     */
    public OrderReviewEntity replyToReview(String token, Long reviewId, String reply) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);

        OrderReviewEntity review = orderReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setAdminReply(reply);
        review.setAdminReplyAt(LocalDateTime.now());
        return orderReviewRepository.save(review);
    }

    /**
     * Toggle review visibility (hide/show)
     */
    public OrderReviewEntity toggleVisibility(String token, Long reviewId) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);

        OrderReviewEntity review = orderReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setIsVisible(!review.getIsVisible());
        return orderReviewRepository.save(review);
    }

    /**
     * Delete a review (admin only)
     */
    public String deleteReview(String token, Long reviewId) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);

        OrderReviewEntity review = orderReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        orderReviewRepository.delete(review);
        return "Review deleted successfully";
    }
}
