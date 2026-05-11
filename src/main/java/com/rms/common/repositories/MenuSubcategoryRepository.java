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
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.MenuSubcategoryEntity;

@Repository
public interface MenuSubcategoryRepository extends JpaRepository<MenuSubcategoryEntity, Long> {
    Page<MenuSubcategoryEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<MenuSubcategoryEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<MenuSubcategoryEntity> findByCreatedAt(LocalDateTime date);

    Page<MenuSubcategoryEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<MenuSubcategoryEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<MenuSubcategoryEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<MenuSubcategoryEntity> findAll(Pageable pageable);
	Page<MenuSubcategoryEntity> findAll(Specification<MenuSubcategoryEntity> spec, Pageable pageable);
	List<MenuSubcategoryEntity> findByMenuCategoryId_IdAndBranchId_IdAndIsDeletedFalse(Long categoryId, Long id);
	List<MenuSubcategoryEntity> findByMenuCategoryId_IdAndIsDeletedFalse(Long categoryId);
	List<MenuSubcategoryEntity> findByMenuCategoryId_Id(Long categoryId);

	@Modifying @Transactional
	@Query("UPDATE MenuSubcategoryEntity m SET m.driveIconUrl = :url WHERE m.id = :id")
	void updateDriveIconUrl(@Param("id") Long id, @Param("url") String url);
}
