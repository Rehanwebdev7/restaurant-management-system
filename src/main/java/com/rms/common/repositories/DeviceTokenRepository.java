package com.rms.common.repositories;

import com.rms.common.entities.DeviceTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceTokenEntity, Long> {

    List<DeviceTokenEntity> findByUserstId_Id(Long userId);

    Optional<DeviceTokenEntity> findFirstByUserstId_Id(Long userId);

    Optional<DeviceTokenEntity> findFirstByCustomersId_Id(Long customerId);

    List<DeviceTokenEntity> findByCustomersId_Id(Long customerId);

    @Query("SELECT d FROM DeviceTokenEntity d WHERE d.userstId.branchId.id = :branchId AND LOWER(d.userstId.role) = LOWER(:role)")
    List<DeviceTokenEntity> findByBranchAndRole(@Param("branchId") Long branchId, @Param("role") String role);
}
