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
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.SlidersEntity;

@Repository
public interface SlidersRepository extends JpaRepository<SlidersEntity, Long> {
    // Custom Methods
    Page<SlidersEntity> findAll(Pageable pageable);

	List<SlidersEntity> findByRestaurantId_IdAndPlatformIgnoreCase(Long restaurantId, String platform);

	Page<SlidersEntity> findByRestaurantId_Id(Long restaurantId, Pageable pageable);

	@Modifying @Transactional
	@Query("UPDATE SlidersEntity s SET s.driveImageUrl = :url WHERE s.id = :id")
	void updateDriveImageUrl(@Param("id") Long id, @Param("url") String url);
}
