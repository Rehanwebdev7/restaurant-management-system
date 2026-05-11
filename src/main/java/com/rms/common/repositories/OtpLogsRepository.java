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

import com.rms.common.entities.OtpLogsEntity;

@Repository
public interface OtpLogsRepository extends JpaRepository<OtpLogsEntity, Long> {
    Page<OtpLogsEntity> findByExpiresAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OtpLogsEntity> findByExpiresAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OtpLogsEntity> findByExpiresAt(LocalDateTime date);

    Page<OtpLogsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OtpLogsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OtpLogsEntity> findByCreatedAt(LocalDateTime date);

    Page<OtpLogsEntity> findByVerifiedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OtpLogsEntity> findByVerifiedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OtpLogsEntity> findByVerifiedAt(LocalDateTime date);

    Page<OtpLogsEntity> findByUsedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OtpLogsEntity> findByUsedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OtpLogsEntity> findByUsedAt(LocalDateTime date);

    Page<OtpLogsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OtpLogsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OtpLogsEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<OtpLogsEntity> findAll(Pageable pageable);
}
