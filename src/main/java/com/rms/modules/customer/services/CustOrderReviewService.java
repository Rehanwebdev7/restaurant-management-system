package com.rms.modules.customer.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.OrderReviewEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.OrderReviewRepository;
import com.rms.common.repositories.OrdersRepository;
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
import java.util.Optional;

@Service
public class CustOrderReviewService {

    @Autowired
    private OrderReviewRepository orderReviewRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private CustomersRepository customersRepository;

    private Long getCustomerIdFromToken(String token) throws Exception {
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        return tokenData.getLong("id");
    }

    /**
     * Submit a new review for a delivered order
     */
    public OrderReviewEntity submitReview(String token, Map<String, Object> body) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        // Extract fields from body
        Long orderId = Long.valueOf(body.get("orderId").toString());
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String reviewText = body.get("reviewText") != null ? body.get("reviewText").toString() : null;
        String photoUrl = body.get("photoUrl") != null ? body.get("photoUrl").toString() : null;
        Integer foodRating = body.get("foodRating") != null ? Integer.valueOf(body.get("foodRating").toString()) : null;
        Integer serviceRating = body.get("serviceRating") != null ? Integer.valueOf(body.get("serviceRating").toString()) : null;
        Integer deliveryRating = body.get("deliveryRating") != null ? Integer.valueOf(body.get("deliveryRating").toString()) : null;

        // Validate rating range
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        if (foodRating != null && (foodRating < 1 || foodRating > 5)) {
            throw new RuntimeException("Food rating must be between 1 and 5");
        }
        if (serviceRating != null && (serviceRating < 1 || serviceRating > 5)) {
            throw new RuntimeException("Service rating must be between 1 and 5");
        }
        if (deliveryRating != null && (deliveryRating < 1 || deliveryRating > 5)) {
            throw new RuntimeException("Delivery rating must be between 1 and 5");
        }

        // Check order exists and belongs to customer
        OrdersEntity order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getCustomerId() == null || !order.getCustomerId().getId().equals(customerId)) {
            throw new SecurityException("This order does not belong to you");
        }

        // Check order is delivered
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("You can only review delivered orders");
        }

        // Check if already reviewed
        if (orderReviewRepository.existsByOrder_IdAndCustomer_Id(orderId, customerId)) {
            throw new RuntimeException("You have already reviewed this order");
        }

        // Get customer details
        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Build review entity
        OrderReviewEntity review = new OrderReviewEntity();
        review.setOrder(order);
        review.setCustomer(customer);
        review.setRestaurant(order.getRestaurantId());
        review.setBranch(order.getBranchId());
        review.setRating(rating);
        review.setReviewText(reviewText);
        review.setPhotoUrl(photoUrl);
        review.setCustomerName(customer.getName());
        review.setFoodRating(foodRating);
        review.setServiceRating(serviceRating);
        review.setDeliveryRating(deliveryRating);
        review.setIsVisible(true);

        return orderReviewRepository.save(review);
    }

    /**
     * Update an existing review (only within 7 days)
     */
    public OrderReviewEntity updateReview(String token, Long reviewId, Map<String, Object> body) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        OrderReviewEntity review = orderReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("This review does not belong to you");
        }

        // Check if within 7 days
        if (review.getCreatedAt().plusDays(7).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reviews can only be edited within 7 days of submission");
        }

        // Update fields
        if (body.containsKey("rating")) {
            Integer rating = Integer.valueOf(body.get("rating").toString());
            if (rating < 1 || rating > 5) throw new RuntimeException("Rating must be between 1 and 5");
            review.setRating(rating);
        }
        if (body.containsKey("reviewText")) {
            review.setReviewText(body.get("reviewText") != null ? body.get("reviewText").toString() : null);
        }
        if (body.containsKey("photoUrl")) {
            review.setPhotoUrl(body.get("photoUrl") != null ? body.get("photoUrl").toString() : null);
        }
        if (body.containsKey("foodRating")) {
            Integer foodRating = body.get("foodRating") != null ? Integer.valueOf(body.get("foodRating").toString()) : null;
            if (foodRating != null && (foodRating < 1 || foodRating > 5)) throw new RuntimeException("Food rating must be between 1 and 5");
            review.setFoodRating(foodRating);
        }
        if (body.containsKey("serviceRating")) {
            Integer serviceRating = body.get("serviceRating") != null ? Integer.valueOf(body.get("serviceRating").toString()) : null;
            if (serviceRating != null && (serviceRating < 1 || serviceRating > 5)) throw new RuntimeException("Service rating must be between 1 and 5");
            review.setServiceRating(serviceRating);
        }
        if (body.containsKey("deliveryRating")) {
            Integer deliveryRating = body.get("deliveryRating") != null ? Integer.valueOf(body.get("deliveryRating").toString()) : null;
            if (deliveryRating != null && (deliveryRating < 1 || deliveryRating > 5)) throw new RuntimeException("Delivery rating must be between 1 and 5");
            review.setDeliveryRating(deliveryRating);
        }

        return orderReviewRepository.save(review);
    }

    /**
     * Delete own review
     */
    public String deleteReview(String token, Long reviewId) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        OrderReviewEntity review = orderReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("This review does not belong to you");
        }

        orderReviewRepository.delete(review);
        return "Review deleted successfully";
    }

    /**
     * Get my reviews (customer's own reviews)
     */
    public Map<String, Object> getMyReviews(String token, Integer pageNumber, Integer pageSize) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OrderReviewEntity> page = orderReviewRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber());
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    /**
     * Check if an order has been reviewed by the customer
     */
    public Map<String, Object> checkReviewStatus(String token, Long orderId) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        boolean reviewed = orderReviewRepository.existsByOrder_IdAndCustomer_Id(orderId, customerId);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("reviewed", reviewed);

        if (reviewed) {
            Optional<OrderReviewEntity> review = orderReviewRepository.findByOrder_IdAndCustomer_Id(orderId, customerId);
            review.ifPresent(r -> response.put("review", r));
        }

        return response;
    }

    /**
     * Get all public reviews for a restaurant (no auth needed - public endpoint)
     */
    public Map<String, Object> getRestaurantReviews(Long restaurantId, Integer pageNumber, Integer pageSize) {
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OrderReviewEntity> page = orderReviewRepository
                .findByRestaurant_IdAndIsVisibleTrueOrderByCreatedAtDesc(restaurantId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber());
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    /**
     * Get all public reviews for a branch (no auth needed - public endpoint)
     */
    public Map<String, Object> getBranchReviews(Long branchId, Integer pageNumber, Integer pageSize) {
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OrderReviewEntity> page = orderReviewRepository
                .findByBranch_IdAndIsVisibleTrueOrderByCreatedAtDesc(branchId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber());
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    /**
     * Get rating summary for a restaurant (public)
     */
    public Map<String, Object> getRestaurantRatingSummary(Long restaurantId) {
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

        // Build distribution map
        Map<Integer, Long> dist = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) dist.put(i, 0L);
        for (Object[] row : distribution) {
            dist.put((Integer) row[0], (Long) row[1]);
        }
        response.put("ratingDistribution", dist);

        return response;
    }

    /**
     * Get top reviews for homepage display (public)
     */
    public List<OrderReviewEntity> getTopReviews(Long restaurantId) {
        return orderReviewRepository
                .findTop10ByRestaurant_IdAndIsVisibleTrueAndRatingGreaterThanEqualOrderByCreatedAtDesc(restaurantId, 4);
    }
}
