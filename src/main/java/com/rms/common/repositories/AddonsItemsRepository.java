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

import com.rms.common.entities.AddonsEntity;
import com.rms.common.entities.AddonsItemsEntity;

@Repository
public interface AddonsItemsRepository extends JpaRepository<AddonsItemsEntity, Long> {
    Page<AddonsItemsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<AddonsItemsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<AddonsItemsEntity> findByCreatedAt(LocalDateTime date);

    Page<AddonsItemsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<AddonsItemsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<AddonsItemsEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<AddonsItemsEntity> findAll(Pageable pageable);
    void deleteByAddonsId(AddonsEntity addonsId);
	List<AddonsItemsEntity> findAllByAddonsId_Id(Long addonsId);
	List<AddonsItemsEntity> findByAddonsId_IdAndIsActiveTrue(Long addonId);

}
