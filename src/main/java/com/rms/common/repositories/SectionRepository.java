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

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.SectionEntity;

@Repository
public interface SectionRepository extends JpaRepository<SectionEntity, Long> {
    // Custom Methods
    Page<SectionEntity> findAll(Pageable pageable);

	SectionEntity findByName(String orderType);

	Page<SectionEntity> findAll(Specification<SectionEntity> spec, Pageable pageable);

	Optional<SectionEntity> findByBranchId_IdAndType(Long id, String string);
	List<SectionEntity> findByBranchId_Id(Long branchId);
}
