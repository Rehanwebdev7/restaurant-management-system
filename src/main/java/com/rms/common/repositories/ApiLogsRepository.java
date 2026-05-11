package com.rms.common.repositories;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.ApiLogsEntity;



@Repository
public interface ApiLogsRepository extends JpaRepository<ApiLogsEntity, Integer> {
    Page<ApiLogsEntity> findByDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);
    List<ApiLogsEntity> findByDateBetween(LocalDate fromDate, LocalDate toDate);
    List<ApiLogsEntity> findByDate(LocalDate date);

   
}
