package com.rms.common.repositories;

import com.rms.common.entities.OrderReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderReviewRepository extends JpaRepository<OrderReviewEntity, Long> {

    // Check if customer already reviewed this order
    boolean existsByOrder_IdAndCustomer_Id(Long orderId, Long customerId);

    // Find review by order id
    Optional<OrderReviewEntity> findByOrder_Id(Long orderId);

    // Find review by order id and customer id
    Optional<OrderReviewEntity> findByOrder_IdAndCustomer_Id(Long orderId, Long customerId);

    // Get all reviews for a restaurant (visible only) - paginated
    Page<OrderReviewEntity> findByRestaurant_IdAndIsVisibleTrueOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);

    // Get all reviews for a branch (visible only) - paginated
    Page<OrderReviewEntity> findByBranch_IdAndIsVisibleTrueOrderByCreatedAtDesc(Long branchId, Pageable pageable);

    // Get all reviews by a customer - paginated
    Page<OrderReviewEntity> findByCustomer_IdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    // Get all reviews for a restaurant (admin view - includes hidden) - paginated
    Page<OrderReviewEntity> findByRestaurant_IdOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);

    // Get all reviews for a branch (admin view) - paginated
    Page<OrderReviewEntity> findByBranch_IdOrderByCreatedAtDesc(Long branchId, Pageable pageable);

    // Count reviews for a restaurant
    long countByRestaurant_IdAndIsVisibleTrue(Long restaurantId);

    // Count reviews for a branch
    long countByBranch_IdAndIsVisibleTrue(Long branchId);

    // Average rating for a restaurant
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM OrderReviewEntity r WHERE r.restaurant.id = :restaurantId AND r.isVisible = true")
    Double getAverageRatingByRestaurant(@Param("restaurantId") Long restaurantId);

    // Average rating for a branch
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM OrderReviewEntity r WHERE r.branch.id = :branchId AND r.isVisible = true")
    Double getAverageRatingByBranch(@Param("branchId") Long branchId);

    // Rating distribution (count per star) for a restaurant
    @Query("SELECT r.rating, COUNT(r) FROM OrderReviewEntity r WHERE r.restaurant.id = :restaurantId AND r.isVisible = true GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistributionByRestaurant(@Param("restaurantId") Long restaurantId);

    // Rating distribution for a branch
    @Query("SELECT r.rating, COUNT(r) FROM OrderReviewEntity r WHERE r.branch.id = :branchId AND r.isVisible = true GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistributionByBranch(@Param("branchId") Long branchId);

    // Average food rating for restaurant
    @Query("SELECT COALESCE(AVG(r.foodRating), 0) FROM OrderReviewEntity r WHERE r.restaurant.id = :restaurantId AND r.isVisible = true AND r.foodRating IS NOT NULL")
    Double getAverageFoodRatingByRestaurant(@Param("restaurantId") Long restaurantId);

    // Average service rating for restaurant
    @Query("SELECT COALESCE(AVG(r.serviceRating), 0) FROM OrderReviewEntity r WHERE r.restaurant.id = :restaurantId AND r.isVisible = true AND r.serviceRating IS NOT NULL")
    Double getAverageServiceRatingByRestaurant(@Param("restaurantId") Long restaurantId);

    // Average delivery rating for restaurant
    @Query("SELECT COALESCE(AVG(r.deliveryRating), 0) FROM OrderReviewEntity r WHERE r.restaurant.id = :restaurantId AND r.isVisible = true AND r.deliveryRating IS NOT NULL")
    Double getAverageDeliveryRatingByRestaurant(@Param("restaurantId") Long restaurantId);

    // Get top/recent reviews for homepage display
    List<OrderReviewEntity> findTop10ByRestaurant_IdAndIsVisibleTrueAndRatingGreaterThanEqualOrderByCreatedAtDesc(Long restaurantId, Integer minRating);
}
