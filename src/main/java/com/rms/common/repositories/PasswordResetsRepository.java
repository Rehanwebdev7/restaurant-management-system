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

import com.rms.common.entities.PasswordResetsEntity;

@Repository
public interface PasswordResetsRepository extends JpaRepository<PasswordResetsEntity, Long> {
    Page<PasswordResetsEntity> findByExpiresAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<PasswordResetsEntity> findByExpiresAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<PasswordResetsEntity> findByExpiresAt(LocalDateTime date);

    Page<PasswordResetsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<PasswordResetsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<PasswordResetsEntity> findByCreatedAt(LocalDateTime date);

    // Custom Methods
    Page<PasswordResetsEntity> findAll(Pageable pageable);
}
