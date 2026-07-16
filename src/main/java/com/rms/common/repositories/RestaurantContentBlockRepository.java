package com.rms.common.repositories;

import com.rms.common.entities.RestaurantContentBlockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantContentBlockRepository
        extends JpaRepository<RestaurantContentBlockEntity, Long> {

    /** All active content for a tenant + page, ordered by sort. */
    List<RestaurantContentBlockEntity>
        findByRestaurantId_IdAndPageAndIsActiveTrueOrderBySortOrderAsc(Long restaurantId, String page);

    /** All active content for a tenant + page + section, ordered by sort. */
    List<RestaurantContentBlockEntity>
        findByRestaurantId_IdAndPageAndSectionTypeAndIsActiveTrueOrderBySortOrderAsc(
                Long restaurantId, String page, String sectionType);

    /** Admin CRUD: all rows for a tenant (including inactive). */
    List<RestaurantContentBlockEntity>
        findByRestaurantId_IdOrderByPageAscSectionTypeAscSortOrderAsc(Long restaurantId);
}
