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

import com.rms.common.entities.WalletTransactionsEntity;

@Repository
public interface WalletTransactionsRepository extends JpaRepository<WalletTransactionsEntity, Integer> {
    Page<WalletTransactionsEntity> findByDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);
    List<WalletTransactionsEntity> findByDateBetween(LocalDate fromDate, LocalDate toDate);
    List<WalletTransactionsEntity> findByDate(LocalDate date);

    // Custom Methods
    Page<WalletTransactionsEntity> findAll(Pageable pageable);
	Page<WalletTransactionsEntity> findAll(Specification<WalletTransactionsEntity> spec, Pageable pageable);
	List<WalletTransactionsEntity> findByUserId_idAndDateBetween(Long deliveryUserId, LocalDate fromDate,
			LocalDate toDate);
	List<WalletTransactionsEntity> findByUserId_id(Long deliveryUserId);
	Page<WalletTransactionsEntity> findByUserId_id(Long userId, Pageable pageable);
	Page<WalletTransactionsEntity> findByUserId_idAndDateBetween(Long userId, LocalDate fromDate, LocalDate toDate, Pageable pageable);
	List<WalletTransactionsEntity> findByUserId_idAndDate(Long userId, LocalDate date);

	// Customer-based methods
	List<WalletTransactionsEntity> findByCustomerId_Id(Long customerId);
	Page<WalletTransactionsEntity> findByCustomerId_Id(Long customerId, Pageable pageable);

	// Sum amount for referral rewards
	@org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(w.amount), 0) FROM WalletTransactionsEntity w WHERE w.customerId.id = :customerId AND w.message LIKE %:messagePattern%")
	BigDecimal sumAmountByCustomerIdAndMessageContaining(@org.springframework.data.repository.query.Param("customerId") Long customerId, @org.springframework.data.repository.query.Param("messagePattern") String messagePattern);
}
