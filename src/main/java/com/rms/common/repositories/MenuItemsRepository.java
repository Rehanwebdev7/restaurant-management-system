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

import com.rms.common.entities.MenuItemsEntity;

@Repository
public interface MenuItemsRepository extends JpaRepository<MenuItemsEntity, Long> {
    Page<MenuItemsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<MenuItemsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<MenuItemsEntity> findByCreatedAt(LocalDateTime date);

    // Custom Methods
    Page<MenuItemsEntity> findAll(Pageable pageable);
	Page<MenuItemsEntity> findAll(Specification<MenuItemsEntity> spec, Pageable pageable);
	Optional<MenuItemsEntity> findById(Integer menuId);
	List<MenuItemsEntity> findByBranchId_IdAndIsDeletedFalse(Long id);
	List<MenuItemsEntity> findByMenuCategoryId_IdAndIsDeletedFalse(Long categoryId);
	List<MenuItemsEntity> findByMenuSubcategoryId_Id(Long subcategoryId);
	List<MenuItemsEntity> findByMenuCategoryId_Id(Long categoryId);
	long countByMenuCategoryId_IdAndIsDeletedFalse(Long categoryId);
	long countByMenuSubcategoryId_IdAndIsDeletedFalse(Long subcategoryId);

	@Modifying @Transactional
	@Query("UPDATE MenuItemsEntity m SET m.driveImageUrl = :url WHERE m.id = :id")
	void updateDriveImageUrl(@Param("id") Long id, @Param("url") String url);

	@Query("""
		    SELECT COUNT(m)
		    FROM MenuItemsEntity m
		    WHERE m.branchId.parentId.id = :restaurantId
		      AND m.isActive = true
		      AND m.isDeleted = false
		""")
	Long countActiveMenuItems(@Param("restaurantId") Long restaurantId);
}
