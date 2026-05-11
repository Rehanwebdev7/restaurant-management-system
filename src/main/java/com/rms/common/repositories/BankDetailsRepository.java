package com.rms.common.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.BankDetailsEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.UsersEntity;

@Repository
public interface BankDetailsRepository extends JpaRepository<BankDetailsEntity, Long> {
    Page<BankDetailsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<BankDetailsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<BankDetailsEntity> findByCreatedAt(LocalDateTime date);

    Page<BankDetailsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<BankDetailsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<BankDetailsEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<BankDetailsEntity> findAll(Pageable pageable);
	List<BankDetailsEntity> findByUserId(UsersEntity deliveryUser);
	Page<BankDetailsEntity> findByUserId(UsersEntity user, Pageable pageable);
	Page<BankDetailsEntity> findByUserIdAndStatusIgnoreCase(UsersEntity user, String status, Pageable pageable);
	Page<BankDetailsEntity> findByCustomerId(CustomersEntity customer, Pageable pageable);
	Page<BankDetailsEntity> findByCustomerIdAndStatusIgnoreCase(CustomersEntity customer, String status, Pageable pageable);
	Page findByUserId_ParentId_id(Integer currentUserId, Pageable pageable);
	Page findByUserId_BranchId_id(Integer currentUserId, Pageable pageable);
}
