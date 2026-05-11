package com.rms.common.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.net.http.HttpClient;

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

@Repository
public interface UsersProfileRepository extends JpaRepository<UsersProfileEntity, Long> {
//    Optional<UsersProfileEntity> findByRestaurantId(Long restaurant_id);

    Page<UsersProfileEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<UsersProfileEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<UsersProfileEntity> findByCreatedAt(LocalDateTime date);

    Page<UsersProfileEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<UsersProfileEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<UsersProfileEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<UsersProfileEntity> findAll(Pageable pageable);
    
    Optional<UsersProfileEntity> findByRestaurantId(UsersEntity restaurantId);
	UsersProfileEntity findByRestaurantId_id(long longValue);
	List<UsersProfileEntity> findByWebsiteIgnoreCase(String domain);

	// Match domain with or without protocol prefix (e.g. "example.com" matches "https://example.com")
	@Query("SELECT p FROM UsersProfileEntity p WHERE LOWER(p.website) LIKE CONCAT('%', LOWER(:domain))")
	List<UsersProfileEntity> findByWebsiteContainingDomain(@Param("domain") String domain);
	Optional<UsersProfileEntity> findByRestaurantId(Optional<UsersEntity> user);
	UsersProfileEntity findFirstByRestaurantId_id(Long id);
	List<UsersProfileEntity> findAllByRestaurantId_Id(Long branchId);
	List<UsersProfileEntity> findAllByRestaurantId(UsersEntity branchUser);

	@Modifying @Transactional
	@Query("UPDATE UsersProfileEntity p SET p.driveLogoUrl = :url WHERE p.id = :id")
	void updateDriveLogoUrl(@Param("id") Long id, @Param("url") String url);

	@Modifying @Transactional
	@Query("UPDATE UsersProfileEntity p SET p.driveFeviconUrl = :url WHERE p.id = :id")
	void updateDriveFeviconUrl(@Param("id") Long id, @Param("url") String url);

	@Modifying @Transactional
	@Query("UPDATE UsersProfileEntity p SET p.driveGstUrl = :url WHERE p.id = :id")
	void updateDriveGstUrl(@Param("id") Long id, @Param("url") String url);

	@Modifying @Transactional
	@Query("UPDATE UsersProfileEntity p SET p.driveLicenceUrl = :url WHERE p.id = :id")
	void updateDriveLicenceUrl(@Param("id") Long id, @Param("url") String url);

	@Modifying @Transactional
	@Query("UPDATE UsersProfileEntity p SET p.driveOtherDocUrl = :url WHERE p.id = :id")
	void updateDriveOtherDocUrl(@Param("id") Long id, @Param("url") String url);

}
