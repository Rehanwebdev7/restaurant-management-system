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

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.UsersEntity;

@Repository
public interface CustomersRepository extends JpaRepository<CustomersEntity, Long> {
    Optional<CustomersEntity> findByMobileNumber(String mobile_number);

    Page<CustomersEntity> findByDateOfBirthBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);
    List<CustomersEntity> findByDateOfBirthBetween(LocalDate fromDate, LocalDate toDate);
    List<CustomersEntity> findByDateOfBirth(LocalDate date);

    Page<CustomersEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<CustomersEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<CustomersEntity> findByCreatedAt(LocalDateTime date);

    Page<CustomersEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<CustomersEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<CustomersEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<CustomersEntity> findAll(Pageable pageable);

	boolean existsByMobileNumberAndUserId(String mobileNumber, UsersEntity cashierUser);

	Page<CustomersEntity> findAll(Specification<CustomersEntity> spec, Pageable pageable);

	Optional<CustomersEntity> findByMobileNumberAndUserId(String mobile, UsersEntity restaurant);

	// Referral related methods
	Optional<CustomersEntity> findByReferalCode(String referalCode);

	boolean existsByReferalCode(String referalCode);

	Long countByReferredById(Long referredById);

	List<CustomersEntity> findByReferredById(Long referredById);

	@Modifying @Transactional
	@Query("UPDATE CustomersEntity c SET c.drivePhotoUrl = :url WHERE c.id = :id")
	void updateDrivePhotoUrl(@Param("id") Long id, @Param("url") String url);

	@Modifying
	@Transactional
	@Query("UPDATE CustomersEntity c SET c.referralSignupBonus = :signupBonus, c.referralRecurringBonus = :recurringBonus")
	void updateReferralBonusesForAll(@Param("signupBonus") BigDecimal signupBonus,
	                                 @Param("recurringBonus") BigDecimal recurringBonus);
}
