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

import com.rms.common.entities.ActivityLogsEntity;

@Repository
public interface ActivityLogsRepository extends JpaRepository<ActivityLogsEntity, Long> {
    Page<ActivityLogsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<ActivityLogsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<ActivityLogsEntity> findByCreatedAt(LocalDateTime date);

    // Custom Methods
    Page<ActivityLogsEntity> findAll(Pageable pageable);
}
