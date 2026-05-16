package com.rms.common.repositories;

import com.rms.common.entities.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    Page<NotificationEntity> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    long countByCustomerIdAndIsReadFalse(Long customerId);

    List<NotificationEntity> findByCustomerIdAndIsReadFalseOrderByCreatedAtDesc(Long customerId);

    // Kitchen/Branch/Restaurant user notifications
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    List<NotificationEntity> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
}
