package com.rms.common.repositories;

import com.rms.common.entities.MarqueeMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MarqueeMessageRepository extends JpaRepository<MarqueeMessageEntity, Long> {

    List<MarqueeMessageEntity> findByRestaurantId_IdOrderByDisplayOrderAsc(Long restaurantId);

    @Query("SELECT m FROM MarqueeMessageEntity m WHERE m.restaurantId.id = :restaurantId AND m.isActive = true AND (m.scheduleStart IS NULL OR m.scheduleStart <= :now) AND (m.scheduleEnd IS NULL OR m.scheduleEnd >= :now)")
    List<MarqueeMessageEntity> findLiveMessages(@Param("restaurantId") Long restaurantId, @Param("now") LocalDateTime now);
}
