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

import com.rms.common.entities.RestaurantHoursEntity;

@Repository
public interface RestaurantHoursRepository extends JpaRepository<RestaurantHoursEntity, Long> {
	Page<RestaurantHoursEntity> findBySpecialDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);

	List<RestaurantHoursEntity> findBySpecialDateBetween(LocalDate fromDate, LocalDate toDate);

	List<RestaurantHoursEntity> findBySpecialDate(LocalDate date);

	Page<RestaurantHoursEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<RestaurantHoursEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<RestaurantHoursEntity> findByCreatedAt(LocalDateTime date);

	Page<RestaurantHoursEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<RestaurantHoursEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<RestaurantHoursEntity> findByUpdatedAt(LocalDateTime date);

	// Custom Methods
	Page<RestaurantHoursEntity> findAll(Pageable pageable);

	Optional<RestaurantHoursEntity> findBySpecialDateAndRestaurantId_IdAndBranchId_Id(LocalDate specialDate,
			Long restaurantId, Long branchId);

	Optional<RestaurantHoursEntity> findByDayOfWeekIgnoreCaseAndRestaurantId_IdAndBranchId_Id(String dayOfWeek,
			Long restaurantId, Long branchId);

	List<RestaurantHoursEntity> findAllByBranchId_Id(Long branchId);

	Page<RestaurantHoursEntity> findAllByBranchId_Id(Long branchId, Pageable pageable);
}
