package com.rms.common.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.TableReleaseScheduleEntity;

@Repository
public interface TableReleaseScheduleRepository
        extends JpaRepository<TableReleaseScheduleEntity, Long> {

    Optional<TableReleaseScheduleEntity>
            findFirstByDiningTableIdAndProcessedFalseOrderByReleaseAtDesc(Long diningTableId);

    List<TableReleaseScheduleEntity>
            findByProcessedFalseAndReleaseAtLessThanEqual(LocalDateTime now);
}
