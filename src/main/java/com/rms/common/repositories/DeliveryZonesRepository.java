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
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;

import org.springframework.data.repository.query.Param;

@Repository
public interface DeliveryZonesRepository extends JpaRepository<DeliveryZonesEntity, Long> {
	Page<DeliveryZonesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<DeliveryZonesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<DeliveryZonesEntity> findByCreatedAt(LocalDateTime date);

	// Custom Methods
	Page<DeliveryZonesEntity> findAll(Pageable pageable);

	Optional<DeliveryZonesEntity> findByBranchId(UsersEntity branchId);

	@Query("SELECT d FROM DeliveryZonesEntity d " + "WHERE d.branchId = :branchId "
			+ "AND d.radiusKmFrom = :radiusKmFrom " + "AND d.radiusKmTo = :radiusKmTo")
	DeliveryZonesEntity findExactRange(@Param("branchId") UsersEntity branchId,
			@Param("radiusKmFrom") Double radiusKmFrom, @Param("radiusKmTo") Double radiusKmTo);

	@Query("SELECT d FROM DeliveryZonesEntity d " + "WHERE d.branchId = :branchId "
			+ "AND d.radiusKmFrom <= :radiusKmTo " + "AND d.radiusKmTo >= :radiusKmFrom")
	DeliveryZonesEntity findOverlapDeliveryZone(@Param("branchId") UsersEntity branchId,
			@Param("radiusKmFrom") Double radiusKmFrom, @Param("radiusKmTo") Double radiusKmTo);

	List<DeliveryZonesEntity> findByBranchId_id(Long branchId);

	Optional<DeliveryZonesEntity> findByBranchId_Id(Long branchId);

	List<DeliveryZonesEntity> findAllByBranchId_Id(Long branchId);

	Page<DeliveryZonesEntity> findAll(Specification<DeliveryZonesEntity> spec, Pageable pageable);

}
