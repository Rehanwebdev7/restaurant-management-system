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

import com.rms.common.entities.CitiesEntity;

@Repository
public interface CitiesRepository extends JpaRepository<CitiesEntity, Integer> {
    Page<CitiesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<CitiesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<CitiesEntity> findByCreatedAt(LocalDateTime date);

    Page<CitiesEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<CitiesEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<CitiesEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<CitiesEntity> findAll(Pageable pageable);
	List<CitiesEntity> findByStateId_Id(Integer stateId);
}
