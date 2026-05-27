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

import com.rms.common.entities.PaymentGatewayEntity;

@Repository
public interface PaymentGatewayRepository extends JpaRepository<PaymentGatewayEntity, Integer> {
    // Custom Methods
    Page<PaymentGatewayEntity> findAll(Pageable pageable);

	List<PaymentGatewayEntity> findAllByRestaurantId_id(Long branchId);

	List<PaymentGatewayEntity> findByRestaurantId_IdAndStatusTrue(Long restaurantId);

	List<PaymentGatewayEntity> findByRestaurantIdIsNotNull();

	Optional<PaymentGatewayEntity> findByRestaurantId_IdAndVendornameAndStatusAndOnOf(
		Long restaurantId, String vendorname, Boolean status, String onOf);

	Optional<PaymentGatewayEntity> findFirstByVendornameAndStatusAndOnOf(
		String vendorname, Boolean status, String onOf);
}
