package com.rms.common.repositories;

import com.rms.common.entities.MenuItemRatingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRatingRepository extends JpaRepository<MenuItemRatingEntity, Long> {

    List<MenuItemRatingEntity> findByMenuItemIdOrderByCreatedAtDesc(Long menuItemId);

    Optional<MenuItemRatingEntity> findByMenuItemIdAndMobileNumber(Long menuItemId, String mobileNumber);

    @Query("SELECT AVG(r.rating) FROM MenuItemRatingEntity r WHERE r.menuItem.id = :itemId")
    Double findAverageRatingByMenuItemId(@Param("itemId") Long itemId);

    @Query("SELECT COUNT(r) FROM MenuItemRatingEntity r WHERE r.menuItem.id = :itemId")
    Long countByMenuItemId(@Param("itemId") Long itemId);
}
