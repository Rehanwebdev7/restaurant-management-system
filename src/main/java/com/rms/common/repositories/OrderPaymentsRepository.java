package com.rms.common.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.OrderPaymentsEntity;

@Repository
public interface OrderPaymentsRepository extends JpaRepository<OrderPaymentsEntity, Long> {
    Page<OrderPaymentsEntity> findByPaymentTimeBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderPaymentsEntity> findByPaymentTimeBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderPaymentsEntity> findByPaymentTime(LocalDateTime date);

    Page<OrderPaymentsEntity> findByRefundTimeBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderPaymentsEntity> findByRefundTimeBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderPaymentsEntity> findByRefundTime(LocalDateTime date);

    Page<OrderPaymentsEntity> findByReconciledAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderPaymentsEntity> findByReconciledAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderPaymentsEntity> findByReconciledAt(LocalDateTime date);

    Page<OrderPaymentsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderPaymentsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderPaymentsEntity> findByCreatedAt(LocalDateTime date);

    Page<OrderPaymentsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderPaymentsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderPaymentsEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<OrderPaymentsEntity> findAll(Pageable pageable);
	Page<OrderPaymentsEntity> findAll(Specification<OrderPaymentsEntity> spec, Pageable pageable);
    Optional<OrderPaymentsEntity> findByGatewayTransactionId(String gatewayTransactionId);
}
