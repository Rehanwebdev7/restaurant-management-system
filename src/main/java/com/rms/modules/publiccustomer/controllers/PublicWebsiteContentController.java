package com.rms.modules.publiccustomer.controllers;

import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.repositories.BusinessSettingRepository;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("api/public/website-content")
public class PublicWebsiteContentController {

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    /**
     * Get all CMS website content for a restaurant (public, no auth required).
     * Accepts either restaurantId or domain as query param.
     */
    @GetMapping("/get")
    public ResponseEntity<Object> getWebsiteContent(
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) String domain) {
        try {
            if (restaurantId == null && (domain == null || domain.isBlank())) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "Either restaurantId or domain parameter is required");
            }

            Optional<BusinessSettingEntity> settingOpt;
            if (restaurantId != null) {
                settingOpt = businessSettingRepository.findByRestaurantId_Id(restaurantId);
            } else {
                settingOpt = businessSettingRepository.findByDomainUrl(domain);
            }

            if (settingOpt.isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND,
                        "Website content not found");
            }

            BusinessSettingEntity setting = settingOpt.get();
            Map<String, Object> content = buildWebsiteContent(setting);

            return ApiResponse.responseBuilder(content, "SUCCESS", HttpStatus.OK,
                    "Website content fetched successfully");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error");
        }
    }

    private Map<String, Object> buildWebsiteContent(BusinessSettingEntity setting) {
        Map<String, Object> content = new HashMap<>();

        // Branding
        content.put("logoUrl", setting.getLogoUrl());
        content.put("faviconUrl", setting.getFaviconUrl());
        content.put("businessName", setting.getBusinessName());
        content.put("organisationName", setting.getOrganisationName());

        // Theme
        Map<String, Object> theme = new HashMap<>();
        theme.put("primaryColor", setting.getPrimaryColor());
        theme.put("secondaryColor", setting.getSecondaryColor());
        theme.put("tertiaryColor", setting.getTertiaryColor());
        theme.put("fontColor", setting.getFontColor());
        theme.put("backgroundColor", setting.getBackgroundColor());
        theme.put("fontName", setting.getFontName());
        theme.put("themeMode", setting.getThemeMode());
        content.put("theme", theme);

        // Contact
        Map<String, Object> contact = new HashMap<>();
        contact.put("email", setting.getEmail());
        contact.put("phone", setting.getPhone());
        contact.put("whatsappNumber", setting.getWhatsappNumber());
        contact.put("address", setting.getAddress());
        contact.put("googleMapEmbed", setting.getGoogleMapEmbed());
        content.put("contact", contact);

        // Social media
        content.put("socialMediaLinks", setting.getSocialMediaLinks());

        // Legal pages
        Map<String, Object> pages = new HashMap<>();
        pages.put("aboutUs", setting.getAboutUs());
        pages.put("privacyPolicy", setting.getPrivacyPolicy());
        pages.put("termsConditions", setting.getTermsConditions());
        pages.put("refundPolicy", setting.getRefundPolicy());
        pages.put("cancellationPolicy", setting.getCancellationPolicy());
        pages.put("ourMission", setting.getOurMission());
        pages.put("ourVision", setting.getOurVision());
        content.put("pages", pages);

        // CMS JSON configs
        content.put("navConfig", setting.getNavConfig());
        content.put("heroSlidesConfig", setting.getHeroSlidesConfig());
        content.put("footerConfig", setting.getFooterConfig());
        content.put("testimonialsConfig", setting.getTestimonialsConfig());
        content.put("featuresConfig", setting.getFeaturesConfig());
        content.put("statsConfig", setting.getStatsConfig());
        content.put("pageContentConfig", setting.getPageContentConfig());

        // Marquee
        Map<String, Object> marquee = new HashMap<>();
        marquee.put("text", setting.getMarqueeText());
        marquee.put("isLive", setting.getMarqueeIsLive());
        marquee.put("bgColor", setting.getMarqueeBgColor());
        marquee.put("textColor", setting.getMarqueeTextColor());
        marquee.put("speed", setting.getMarqueeSpeed());
        content.put("marquee", marquee);

        return content;
    }
}
