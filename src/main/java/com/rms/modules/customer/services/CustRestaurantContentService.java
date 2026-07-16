package com.rms.modules.customer.services;

import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.entities.RestaurantContentBlockEntity;
import com.rms.common.repositories.BusinessSettingRepository;
import com.rms.common.repositories.RestaurantContentBlockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Customer-facing content blocks (Batch — dummy → real).
 *
 * Serves polymorphic per-page content (testimonials, team, awards, facilities,
 * events, FAQs, departments, hours notes, reach info, help categories,
 * Instagram posts, stats) from a single `restaurant_content_blocks` table.
 *
 * Tenant resolution mirrors `CustBrandingController.resolveTenant()` — looks
 * up the requesting host in `business_settings.domain_url`, so different
 * domains served by the same backend serve different content sets.
 */
@Service
public class CustRestaurantContentService {

    @Autowired
    private RestaurantContentBlockRepository contentBlockRepository;

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    /**
     * Resolve the tenant that owns the requesting host and return its content
     * blocks for `page` (optionally filtered by `sectionType`). Returns an
     * empty list when the tenant is unresolvable — the frontend then falls
     * back to whatever seed content it has locally.
     */
    public List<RestaurantContentBlockEntity> getContentForHost(String host, String page, String sectionType) {
        Long restaurantId = resolveRestaurantIdFromHost(host);
        if (restaurantId == null) return Collections.emptyList();
        return getContentByRestaurantId(restaurantId, page, sectionType);
    }

    /**
     * Direct-by-id lookup, exposed for internal callers that already know the
     * tenant (e.g. admin panels or authenticated flows that carry the id in
     * the token). Public endpoint uses `getContentForHost` instead.
     */
    public List<RestaurantContentBlockEntity>
            getContentByRestaurantId(Long restaurantId, String page, String sectionType) {
        if (restaurantId == null || page == null || page.isBlank()) return Collections.emptyList();
        if (sectionType == null || sectionType.isBlank()) {
            return contentBlockRepository
                    .findByRestaurantId_IdAndPageAndIsActiveTrueOrderBySortOrderAsc(restaurantId, page);
        }
        return contentBlockRepository
                .findByRestaurantId_IdAndPageAndSectionTypeAndIsActiveTrueOrderBySortOrderAsc(
                        restaurantId, page, sectionType);
    }

    /**
     * Same domain-resolution logic as CustBrandingController.resolveTenant.
     * Kept inline (rather than cross-injecting the controller) so this service
     * has no dependency on the branding controller class — the shared piece
     * is just the repository lookup, which is trivial.
     */
    private Long resolveRestaurantIdFromHost(String host) {
        BusinessSettingEntity setting = null;
        if (host != null && !host.isBlank()) {
            Optional<BusinessSettingEntity> exact = businessSettingRepository.findByDomainUrl(host);
            if (exact.isPresent()) {
                setting = exact.get();
            } else {
                String stripped = host.startsWith("www.") ? host.substring(4) : host;
                if (!stripped.equals(host)) {
                    Optional<BusinessSettingEntity> noWww = businessSettingRepository.findByDomainUrl(stripped);
                    if (noWww.isPresent()) setting = noWww.get();
                }
            }
        }
        if (setting == null) {
            Optional<BusinessSettingEntity> localhostMapping = businessSettingRepository.findByDomainUrl("localhost");
            if (localhostMapping.isPresent()) setting = localhostMapping.get();
        }
        if (setting == null) {
            List<BusinessSettingEntity> all = businessSettingRepository.findAll();
            if (!all.isEmpty()) setting = all.get(0);
        }
        return (setting != null && setting.getRestaurantId() != null)
                ? setting.getRestaurantId().getId()
                : null;
    }
}
