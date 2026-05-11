package com.rms.common.repositories;

import com.rms.common.entities.SubscriptionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, Long>, JpaSpecificationExecutor<SubscriptionEntity> {

    // Find by status
    List<SubscriptionEntity> findByStatus(String status);

    Page<SubscriptionEntity> findByStatus(String status, Pageable pageable);

    // Find by user
    List<SubscriptionEntity> findByUserId(Long userId);

    Optional<SubscriptionEntity> findByUserIdAndStatus(Long userId, String status);

    // Search by user name or plan name with status filter
    @Query("SELECT s FROM SubscriptionEntity s " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "LOWER(s.user.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.plan.planName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR s.status = :status)")
    Page<SubscriptionEntity> searchSubscriptions(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);

    // Count by status
    long countByStatus(String status);

    // Find active subscriptions for a user
    @Query("SELECT s FROM SubscriptionEntity s WHERE s.user.id = :userId AND s.status IN ('active', 'grace')")
    List<SubscriptionEntity> findActiveSubscriptionsByUserId(@Param("userId") Long userId);

    // Find pending subscriptions for a user (next plan queued)
    @Query("SELECT s FROM SubscriptionEntity s WHERE s.user.id = :userId AND s.status = 'pending'")
    List<SubscriptionEntity> findPendingSubscriptionsByUserId(@Param("userId") Long userId);

    // Find all active subscriptions that have expired (for scheduler)
    @Query("SELECT s FROM SubscriptionEntity s WHERE s.status = 'active' AND s.endDate < CURRENT_DATE")
    List<SubscriptionEntity> findExpiredActiveSubscriptions();

    // Find all pending subscriptions that should activate today
    @Query("SELECT s FROM SubscriptionEntity s WHERE s.status = 'pending' AND s.startDate <= CURRENT_DATE")
    List<SubscriptionEntity> findPendingSubscriptionsToActivate();
}
