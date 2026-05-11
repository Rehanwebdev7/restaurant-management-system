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

import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.WalletTopupRequestEntity;

@Repository
public interface WalletTopupRequestRepository extends JpaRepository<WalletTopupRequestEntity, Integer> {
    Page<WalletTopupRequestEntity> findByApprovedDateBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<WalletTopupRequestEntity> findByApprovedDateBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<WalletTopupRequestEntity> findByApprovedDate(LocalDateTime date);

    Page<WalletTopupRequestEntity> findByDateBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<WalletTopupRequestEntity> findByDateBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<WalletTopupRequestEntity> findByDate(LocalDateTime date);

    Page<WalletTopupRequestEntity> findByTransDateBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<WalletTopupRequestEntity> findByTransDateBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<WalletTopupRequestEntity> findByTransDate(LocalDateTime date);

    // Custom Methods
    Page<WalletTopupRequestEntity> findAll(Pageable pageable);
	Page<WalletTopupRequestEntity> findAll(Specification<WalletTopupRequestEntity> spec, Pageable pageable);
	List<WalletTopupRequestEntity> findByUserIdAndDateBetween(UsersEntity user, LocalDateTime fromDateTime,
			LocalDateTime toDateTime);
	List<WalletTopupRequestEntity> findByUserId_BranchId_idAndDateBetween(Long id, LocalDateTime fromDateTime,
			LocalDateTime toDateTime);
	List<WalletTopupRequestEntity> findByUserId_BranchId_ParentId_idAndDateBetween(long longValue,
			LocalDateTime fromDateTime, LocalDateTime toDateTime);
	List<WalletTopupRequestEntity> findByApprovedById_idAndApprovedDateBetween(long longValue,
			LocalDateTime fromDateTime, LocalDateTime toDateTime);

	// Customer withdrawal methods
	Page<WalletTopupRequestEntity> findByCustomerId_IdAndRequestType(Long customerId, String requestType, Pageable pageable);
	Page<WalletTopupRequestEntity> findByCustomerId_Id(Long customerId, Pageable pageable);

	// Restaurant withdrawal management methods
	Page<WalletTopupRequestEntity> findByRequestTypeAndCustomerId_UserId_Id(String requestType, Long restaurantId, Pageable pageable);
	Page<WalletTopupRequestEntity> findByRequestTypeAndCustomerId_UserId_IdAndStatus(String requestType, Long restaurantId, String status, Pageable pageable);
}
