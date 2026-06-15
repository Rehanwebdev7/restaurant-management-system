package com.rms.common.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.RestaurantGalleryEntity;

@Repository
public interface RestaurantGalleryRepository extends JpaRepository<RestaurantGalleryEntity, Long> {

    Page<RestaurantGalleryEntity> findByRestaurantId_Id(Long restaurantId, Pageable pageable);

    List<RestaurantGalleryEntity> findByRestaurantId_IdAndPlatformIgnoreCaseAndIsActiveTrueOrderByDisplayOrderAscIdAsc(
            Long restaurantId, String platform);

    List<RestaurantGalleryEntity> findByRestaurantId_IdAndIsActiveTrueOrderByDisplayOrderAscIdAsc(Long restaurantId);

    @Modifying
    @Transactional
    @Query("UPDATE RestaurantGalleryEntity g SET g.driveImageUrl = :url WHERE g.id = :id")
    void updateDriveImageUrl(@Param("id") Long id, @Param("url") String url);
}
