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
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.CouponEntity;
import com.rms.common.entities.UsersEntity;

@Repository
public interface UsersRepository extends JpaRepository<UsersEntity, Long>, JpaSpecificationExecutor<UsersEntity> {
	Optional<UsersEntity> findByEmail(String email);

	Page<UsersEntity> findByLastLoginBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<UsersEntity> findByLastLoginBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<UsersEntity> findByLastLogin(LocalDateTime date);

	Page<UsersEntity> findByLastLoginAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<UsersEntity> findByLastLoginAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<UsersEntity> findByLastLoginAt(LocalDateTime date);

	Page<UsersEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<UsersEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<UsersEntity> findByCreatedAt(LocalDateTime date);

	Page<UsersEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<UsersEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<UsersEntity> findByUpdatedAt(LocalDateTime date);

	// Custom Methods
	Page<UsersEntity> findAll(Pageable pageable);

	Optional<UsersEntity> findByMobile(String mobile);

	Optional<UsersEntity> findByRoleIgnoreCase(String string);

	Optional<UsersEntity> findByMobileAndRole(String mobile, String userType);

	boolean existsByMobile(String mobile);

	Optional<UsersEntity> findByIdAndRole(Long restaurantId, String string);

	List<UsersEntity> findByParentId_id(Long restaurantId);

	Optional<UsersEntity> findById(UsersEntity parentId);

//	Optional<UsersEntity> findByMobile(String mobile);
	// Wallet procedure query
	@Modifying(clearAutomatically = true)
	@Transactional
	@Query("""
			UPDATE UsersEntity u
			SET u.balance = COALESCE(u.balance, 0) + :creditAmount
			WHERE u.id = :userId
			""")
	void addBalance(@Param("userId") Integer userId, @Param("creditAmount") BigDecimal creditAmount);

	@Modifying(clearAutomatically = true)
	@Transactional
	@Query("""
			UPDATE UsersEntity u
			SET u.balance = COALESCE(u.balance, 0) - :deductAmount
			WHERE u.id = :userId
			""")
	void deductBalance(@Param("userId") Integer userId, @Param("deductAmount") BigDecimal deductAmount);

	// Outstanding query
	@Modifying(clearAutomatically = true)
	@Transactional
	@Query("""
			UPDATE UsersEntity u
			SET u.outstandingBalance = COALESCE(u.outstandingBalance, 0) + :amount
			WHERE u.id = :userId
			""")
	void addOutstandingBalance(@Param("userId") Integer userId, @Param("amount") BigDecimal amount);

	@Modifying(clearAutomatically = true)
	@Transactional
	@Query("""
			UPDATE UsersEntity u
			SET u.outstandingBalance = COALESCE(u.outstandingBalance, 0) - :amount
			WHERE u.id = :userId
			""")
	void deductOutstandingBalance(@Param("userId") Integer userId, @Param("amount") BigDecimal amount);

	List<UsersEntity> findByParentId_idAndRoleIgnoreCase(long longValue, String role);

	@Query("""
	        SELECT u.id
	        FROM UsersEntity u
	        WHERE u.branchId.id = :branchId
	          AND u.role = :role
	          AND u.isActive = true
	          AND u.isDeleted = false
	    """)
	    List<Long> findUserIdsByBranchAndRole(
	            @Param("branchId") Long branchId,
	            @Param("role") String role
	    );


	List<UsersEntity> findAllByRoleIgnoreCase(String userType);

	UsersEntity findFirstByMobile(String mobile);

	List<UsersEntity> findByBranchId_idAndRoleIgnoreCase(long longValue, String userType);

	Optional<UsersEntity> findById(Integer currentUserId);

	Optional<UsersEntity> findByIdAndParentId_Id(Long id, Integer currentUserId);

	// For subscription management - get restaurants
	List<UsersEntity> findByRoleAndIsDeletedFalse(String role);

	List<UsersEntity> findByRoleAndNameContainingIgnoreCaseAndIsDeletedFalse(String role, String name);

	long countByParentId_idAndRoleIgnoreCaseAndIsDeletedFalse(long parentId, String role);

	List<UsersEntity> findByRoleAndIsDeletedFalseAndIsActive(String role, boolean isActive);
}
