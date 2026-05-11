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

import com.rms.common.entities.DiningTablesEntity;

@Repository
public interface DiningTablesRepository extends JpaRepository<DiningTablesEntity, Long> {
    Page<DiningTablesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<DiningTablesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<DiningTablesEntity> findByCreatedAt(LocalDateTime date);

    Page<DiningTablesEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<DiningTablesEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<DiningTablesEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<DiningTablesEntity> findAll(Specification<DiningTablesEntity> spec, Pageable pageable);
//	boolean existsByBranchIdAndTableNumber(Long id, Integer tableNumber);
	boolean existsByBranchId_IdAndTableNumber(Long id, String trim);
	boolean existsByBranchId_idAndTableNumberAndIdNot(Long id, String trim, Long id2);
	List<DiningTablesEntity> findByBranchId_IdAndIsDeletedFalse(Long branchId);
	Optional<DiningTablesEntity> findFirstByBranchId_IdAndTableNumberAndIsDeletedFalse(Long branchId, String tableNumber);
	// Admin tables-management: all non-deleted tables (optionally scoped by branch).
	List<DiningTablesEntity> findByIsDeletedFalse();
}
