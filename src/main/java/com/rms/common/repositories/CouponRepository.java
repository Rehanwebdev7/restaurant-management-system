package com.rms.common.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.CouponEntity;

@Repository
public interface CouponRepository extends JpaRepository<CouponEntity, Integer> {
    Page<CouponEntity> findByValidityBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);
    List<CouponEntity> findByValidityBetween(LocalDate fromDate, LocalDate toDate);
    List<CouponEntity> findByValidity(LocalDate date);

    Page<CouponEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<CouponEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<CouponEntity> findByCreatedAt(LocalDateTime date);

    // Custom Methods
    Page<CouponEntity> findAll(Pageable pageable);
	boolean existsByCouponCodeAndIsDeleteFalse(String couponCode);
	boolean existsByCouponCodeAndIdNotAndIsDeleteFalse(String couponCode, Integer id);

    // Global coupons for a branch
    @Query("SELECT c FROM CouponEntity c WHERE c.branchId.id = :branchId AND c.global = true AND c.displayOnScreen = true AND c.isDelete = false AND c.validity >= :today")
    List<CouponEntity> findGlobalCoupons(@Param("branchId") Long branchId, @Param("today") LocalDate today);

    // Suggested coupons based on menu items
    @Query("SELECT DISTINCT c FROM CouponEntity c JOIN CouponMappingEntity cm ON cm.couponId = c WHERE cm.menuItemId.id IN :menuItemIds AND c.branchId.id = :branchId AND c.displayOnScreen = true AND c.isDelete = false AND c.validity >= :today")
    List<CouponEntity> findSuggestedCoupons(@Param("menuItemIds") List<Integer> menuItemIds, @Param("branchId") Long branchId, @Param("today") LocalDate today);

    // First order coupons for a branch
    @Query("SELECT c FROM CouponEntity c WHERE c.branchId.id = :branchId AND c.firstOrder = true AND c.displayOnScreen = true AND c.isDelete = false AND c.validity >= :today")
    List<CouponEntity> findFirstOrderCoupons(@Param("branchId") Long branchId, @Param("today") LocalDate today);

    // Check if branch already has a firstOrder coupon (for add)
    boolean existsByBranchId_IdAndFirstOrderTrueAndIsDeleteFalse(Long branchId);

    // Check if branch already has a firstOrder coupon excluding current coupon (for update)
    boolean existsByBranchId_IdAndFirstOrderTrueAndIsDeleteFalseAndIdNot(Long branchId, Integer id);

    // Find valid coupon by couponCode (not deleted, displayOnScreen, not expired)
    @Query("SELECT c FROM CouponEntity c WHERE c.couponCode = :couponCode AND c.isDelete = false AND c.displayOnScreen = true AND c.validity >= :today")
    Optional<CouponEntity> findValidCouponByCode(@Param("couponCode") String couponCode, @Param("today") LocalDate today);
	Page<CouponEntity> findAll(Specification<CouponEntity> spec, Pageable pageable);
	boolean existsByBranchId_IdAndFirstOrderTrueAndIsDeleteFalse(Integer currentUserId);
	boolean existsByBranchId_IdAndFirstOrderTrueAndIsDeleteFalseAndIdNot(Integer currentUserId, Integer id);

	@Modifying @Transactional
	@Query("UPDATE CouponEntity c SET c.driveLogo = :url WHERE c.id = :id")
	void updateDriveLogo(@Param("id") Integer id, @Param("url") String url);
}
