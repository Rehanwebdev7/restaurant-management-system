package com.rms.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.repositories.BusinessSettingRepository;
import com.rms.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/global/theme")
public class GlobalThemeController {

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    @GetMapping("/getByRestId")
    public ResponseEntity<Object> getByRestId(@RequestParam Long restId) {
        try {
            var businessSetting = businessSettingRepository.findByRestaurantId_Id(restId);

            if (businessSetting.isPresent()) {
                Map<String, Object> themeData = mapBusinessSettingToTheme(businessSetting.get());
                return ApiResponse.responseBuilder(themeData, "SUCCESS", HttpStatus.OK, "Theme fetched");
            } else {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, "Theme not found for this restaurant");
            }
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching theme: " + e.getMessage());
        }
    }

    @GetMapping("/getByDomain")
    public ResponseEntity<Object> getByDomain(@RequestParam String domainName) {
        try {
            var businessSetting = businessSettingRepository.findByDomainUrl(domainName);

            if (businessSetting.isPresent()) {
                Map<String, Object> themeData = mapBusinessSettingToTheme(businessSetting.get());
                return ApiResponse.responseBuilder(themeData, "SUCCESS", HttpStatus.OK, "Theme fetched");
            } else {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, "Theme not found for this domain");
            }
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching theme: " + e.getMessage());
        }
    }

    private Map<String, Object> mapBusinessSettingToTheme(BusinessSettingEntity setting) {
        Map<String, Object> theme = new HashMap<>();

        theme.put("id", setting.getId());
        theme.put("logoUrl", setting.getLogoUrl());
        theme.put("feviconUrl", setting.getFaviconUrl());
        theme.put("primary", setting.getPrimaryColor());
        theme.put("secondary", setting.getSecondaryColor());
        theme.put("tertiary", setting.getTertiaryColor());
        theme.put("fontColor", setting.getFontColor());
        theme.put("fontName", setting.getFontName());
        theme.put("address", setting.getAddress());
        theme.put("phone", setting.getPhone());
        theme.put("email", setting.getEmail());
        theme.put("whatsappNumber", setting.getWhatsappNumber());
        theme.put("aboutUs", setting.getAboutUs());
        theme.put("ourMission", setting.getOurMission());
        theme.put("ourVision", setting.getOurVision());
        theme.put("restaurantName", setting.getRestaurantId() != null ? setting.getRestaurantId().getName() : null);

        // Parse socialMediaLinks JSON string → return as socialMediaDetails object
        try {
            String socialJson = setting.getSocialMediaLinks();
            if (socialJson != null && !socialJson.isBlank()) {
                Map<?, ?> socialMap = new ObjectMapper().readValue(socialJson, Map.class);
                theme.put("socialMediaDetails", socialMap);
            } else {
                theme.put("socialMediaDetails", null);
            }
        } catch (Exception ignored) {
            theme.put("socialMediaDetails", null);
        }

        if (setting.getRestaurantId() != null) {
            Map<String, Object> restaurantInfo = new HashMap<>();
            restaurantInfo.put("id", setting.getRestaurantId().getId());
            restaurantInfo.put("email", setting.getRestaurantId().getEmail());
            theme.put("restaurantId", restaurantInfo);
        }

        return theme;
    }
}
