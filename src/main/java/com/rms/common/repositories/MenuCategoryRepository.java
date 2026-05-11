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
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.MenuCategoryEntity;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategoryEntity, Long>, JpaSpecificationExecutor<MenuCategoryEntity> {
    Page<MenuCategoryEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<MenuCategoryEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<MenuCategoryEntity> findByCreatedAt(LocalDateTime date);

    Page<MenuCategoryEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<MenuCategoryEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<MenuCategoryEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<MenuCategoryEntity> findAll(Pageable pageable);
	Page<MenuCategoryEntity> findAll(Specification<MenuCategoryEntity> spec, Pageable pageable);
	List<MenuCategoryEntity> findByBranchId_IdAndIsActiveTrueAndIsDeletedFalse(Long id);

	@Modifying @Transactional
	@Query("UPDATE MenuCategoryEntity m SET m.driveIconUrl = :url WHERE m.id = :id")
	void updateDriveIconUrl(@Param("id") Long id, @Param("url") String url);
}
