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

import com.rms.common.entities.AddonsEntity;

@Repository
public interface AddonsRepository extends JpaRepository<AddonsEntity, Long> {
    Page<AddonsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<AddonsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<AddonsEntity> findByCreatedAt(LocalDateTime date);

    Page<AddonsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<AddonsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<AddonsEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<AddonsEntity> findAll(Pageable pageable);
	Page<AddonsEntity> findAll(Specification<AddonsEntity> spec, Pageable pageable);
//	List<AddonsEntity> findAllByAddonsId_Id(Long addonsId);
	 
}
