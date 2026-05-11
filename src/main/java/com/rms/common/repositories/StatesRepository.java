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

import com.rms.common.entities.StatesEntity;

@Repository
public interface StatesRepository extends JpaRepository<StatesEntity, Integer> {
    Page<StatesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<StatesEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<StatesEntity> findByCreatedAt(LocalDateTime date);

    Page<StatesEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<StatesEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<StatesEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<StatesEntity> findAll(Pageable pageable);
}
