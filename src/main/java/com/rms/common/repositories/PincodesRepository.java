package com.rms.common.repositories;

import com.rms.common.entities.PincodesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PincodesRepository extends JpaRepository<PincodesEntity, Long> {
    List<PincodesEntity> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    Page<PincodesEntity> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    List<PincodesEntity> findByCreatedAt(LocalDateTime createdAt);
    List<PincodesEntity> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    Page<PincodesEntity> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    List<PincodesEntity> findByUpdatedAt(LocalDateTime updatedAt);
}
