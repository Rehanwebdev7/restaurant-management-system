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

import com.rms.common.entities.RestaurantBranchEntity;

@Repository
public interface RestaurantBranchRepository extends JpaRepository<RestaurantBranchEntity, Long> {
    Page<RestaurantBranchEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<RestaurantBranchEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<RestaurantBranchEntity> findByCreatedAt(LocalDateTime date);

    Page<RestaurantBranchEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<RestaurantBranchEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<RestaurantBranchEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<RestaurantBranchEntity> findAll(Specification<RestaurantBranchEntity> spec, Pageable pageable);
	boolean existsByPhone(String phone);
	Page<RestaurantBranchEntity> findByRestaurantId_Id(long longValue, Pageable pageable);
	long countByRestaurantId_IdAndIsDeletedFalse(long restaurantId);
	List<RestaurantBranchEntity> findByRestaurantId_IdAndIsDeletedFalse(long restaurantId);
}
