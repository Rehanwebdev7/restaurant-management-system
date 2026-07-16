package com.rms.common.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.UsersProfileEntity;

/**
 * Post 2026-07-16 schema refactor:
 *   Removed queries whose target fields moved to `business_settings`:
 *     - updateDriveLogoUrl, updateDriveFeviconUrl, updateDriveGstUrl
 *     - findByWebsiteIgnoreCase, findByWebsiteContainingDomain
 *   Use {@link BusinessSettingRepository} for logo, favicon, GST certificate,
 *   and domain lookups.
 */
@Repository
public interface UsersProfileRepository extends JpaRepository<UsersProfileEntity, Long> {

    Page<UsersProfileEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<UsersProfileEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<UsersProfileEntity> findByCreatedAt(LocalDateTime date);

    Page<UsersProfileEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<UsersProfileEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<UsersProfileEntity> findByUpdatedAt(LocalDateTime date);

    Page<UsersProfileEntity> findAll(Pageable pageable);

    Optional<UsersProfileEntity> findByRestaurantId(UsersEntity restaurantId);
    UsersProfileEntity findByRestaurantId_id(long longValue);
    Optional<UsersProfileEntity> findByRestaurantId(Optional<UsersEntity> user);
    UsersProfileEntity findFirstByRestaurantId_id(Long id);
    List<UsersProfileEntity> findAllByRestaurantId_Id(Long branchId);
    List<UsersProfileEntity> findAllByRestaurantId(UsersEntity branchUser);

    @Modifying @Transactional
    @Query("UPDATE UsersProfileEntity p SET p.driveLicenceUrl = :url WHERE p.id = :id")
    void updateDriveLicenceUrl(@Param("id") Long id, @Param("url") String url);

    @Modifying @Transactional
    @Query("UPDATE UsersProfileEntity p SET p.driveOtherDocUrl = :url WHERE p.id = :id")
    void updateDriveOtherDocUrl(@Param("id") Long id, @Param("url") String url);
}
