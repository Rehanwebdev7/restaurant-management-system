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

import com.rms.common.entities.SmsFormatesEntity;

@Repository
public interface SmsFormatesRepository extends JpaRepository<SmsFormatesEntity, Integer> {
    // Custom Methods
    Page<SmsFormatesEntity> findAll(Pageable pageable);

	SmsFormatesEntity findByService(String smsService);
}
