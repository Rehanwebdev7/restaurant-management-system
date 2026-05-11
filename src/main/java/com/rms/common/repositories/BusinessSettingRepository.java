package com.rms.common.repositories;

import com.rms.common.entities.BusinessSettingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface BusinessSettingRepository extends JpaRepository<BusinessSettingEntity, Long> {
    Optional<BusinessSettingEntity> findByRestaurantId_Id(Long restaurantId);

    Optional<BusinessSettingEntity> findByDomainUrl(String domainUrl);

    @Modifying @Transactional
    @Query("UPDATE BusinessSettingEntity b SET b.driveLogoUrl = :url WHERE b.id = :id")
    void updateDriveLogoUrl(@Param("id") Long id, @Param("url") String url);

    @Modifying @Transactional
    @Query("UPDATE BusinessSettingEntity b SET b.driveFaviconUrl = :url WHERE b.id = :id")
    void updateDriveFaviconUrl(@Param("id") Long id, @Param("url") String url);

    @Modifying @Transactional
    @Query("UPDATE BusinessSettingEntity b SET b.driveGstCertificateUrl = :url WHERE b.id = :id")
    void updateDriveGstCertificateUrl(@Param("id") Long id, @Param("url") String url);
}
