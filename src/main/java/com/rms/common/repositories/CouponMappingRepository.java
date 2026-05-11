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

import com.rms.common.entities.CouponMappingEntity;

import java.util.List;

@Repository
public interface CouponMappingRepository extends JpaRepository<CouponMappingEntity, Integer> {
    // Custom Methods
    Page<CouponMappingEntity> findAll(Pageable pageable);

    // Find all coupon mappings by coupon ID (for item-wise coupon apply)
    List<CouponMappingEntity> findByCouponId_Id(Integer couponId);

	void deleteByCouponId_Id(Integer id);
}
