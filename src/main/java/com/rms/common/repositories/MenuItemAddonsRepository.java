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

import com.rms.common.entities.MenuItemAddonsEntity;

@Repository
public interface MenuItemAddonsRepository extends JpaRepository<MenuItemAddonsEntity, Long> {
    Page<MenuItemAddonsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<MenuItemAddonsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<MenuItemAddonsEntity> findByCreatedAt(LocalDateTime date);

    // Custom Methods
    Page<MenuItemAddonsEntity> findAll(Pageable pageable);
}
