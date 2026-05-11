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

import com.rms.common.entities.TableBookingEntity;

@Repository
public interface TableBookingRepository extends JpaRepository<TableBookingEntity, Long> {
    Page<TableBookingEntity> findByBookingDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);
    List<TableBookingEntity> findByBookingDateBetween(LocalDate fromDate, LocalDate toDate);
    List<TableBookingEntity> findByBookingDate(LocalDate date);
    List<TableBookingEntity> findByStatusIn(List<String> statuses);
    List<TableBookingEntity> findByTableId_IdAndBookingDate(Long tableId, LocalDate bookingDate);

    List<TableBookingEntity> findByTableId_IdAndStatusInOrderByIdDesc(Long tableId, List<String> statuses);

    // Custom Methods
    Page<TableBookingEntity> findAll(Pageable pageable);
}
