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

import com.rms.common.entities.OutstandingEntity;

@Repository
public interface OutstandingRepository extends JpaRepository<OutstandingEntity, Integer> {
    Page<OutstandingEntity> findByDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);
    List<OutstandingEntity> findByDateBetween(LocalDate fromDate, LocalDate toDate);
    List<OutstandingEntity> findByDate(LocalDate date);

    // Custom Methods
    Page<OutstandingEntity> findAll(Pageable pageable);
	Page<OutstandingEntity> findAll(Specification<OutstandingEntity> spec, Pageable pageable);
	List<OutstandingEntity> findByUserId_IdAndDateBetween(Long deliveryUserId, LocalDate from, LocalDate to);
	List<OutstandingEntity> findByUserId_Id(Long deliveryUserId);
	List<OutstandingEntity> findByDeductById_IdAndDateBetween(Long deliveryUserId, LocalDate from, LocalDate to);
	List<OutstandingEntity> findByDeductById_Id(Long deliveryUserId);
}
