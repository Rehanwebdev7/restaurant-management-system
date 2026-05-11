package com.rms.modules.admin.services;

import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.entities.MarqueeMessageEntity;
import com.rms.common.entities.TeamMemberEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.UsersProfileEntity;
import com.rms.common.repositories.BusinessSettingRepository;
import com.rms.common.repositories.MarqueeMessageRepository;
import com.rms.common.repositories.TeamMemberRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersProfileRepository;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.FileUploadService;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdmBusinessSettingService {

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private MarqueeMessageRepository marqueeMessageRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private UsersProfileRepository usersProfileRepository;

    @Autowired
    private GoogleDriveUtil googleDriveUtil;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private TokenUtil tokenUtil;

    /**
     * Get business settings for the authenticated user's restaurant
     */
    public BusinessSettingEntity getBusinessSetting(String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();

        Optional<BusinessSettingEntity> setting = businessSettingRepository.findByRestaurantId_Id(Long.valueOf(userId));
        return setting.orElse(new BusinessSettingEntity());
    }

    /**
     * Save or update business settings (upsert)
     */
    public BusinessSettingEntity saveBusinessSetting(Map<String, Object> body, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();

        Optional<UsersEntity> userOpt = usersRepository.findById(Long.valueOf(userId));
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        UsersEntity user = userOpt.get();
        Optional<BusinessSettingEntity> existingOpt = businessSettingRepository.findByRestaurantId_Id(Long.valueOf(userId));

        BusinessSettingEntity entity;
        if (existingOpt.isPresent()) {
            entity = existingOpt.get();
        } else {
            entity = new BusinessSettingEntity();
            entity.setRestaurantId(user);
        }

        // Map fields from request body
        if (body.containsKey("domainUrl")) entity.setDomainUrl((String) body.get("domainUrl"));
        if (body.containsKey("themeMode")) entity.setThemeMode((String) body.get("themeMode"));
        if (body.containsKey("primaryColor")) entity.setPrimaryColor((String) body.get("primaryColor"));
        if (body.containsKey("secondaryColor")) entity.setSecondaryColor((String) body.get("secondaryColor"));
        if (body.containsKey("tertiaryColor")) entity.setTertiaryColor((String) body.get("tertiaryColor"));
        if (body.containsKey("fontColor")) entity.setFontColor((String) body.get("fontColor"));
        if (body.containsKey("fontName")) entity.setFontName((String) body.get("fontName"));
        if (body.containsKey("logoUrl")) entity.setLogoUrl((String) body.get("logoUrl"));
        if (body.containsKey("faviconUrl")) entity.setFaviconUrl((String) body.get("faviconUrl"));
        if (body.containsKey("organisationName")) entity.setOrganisationName((String) body.get("organisationName"));
        if (body.containsKey("businessName")) entity.setBusinessName((String) body.get("businessName"));
        if (body.containsKey("authorisedPersonName")) entity.setAuthorisedPersonName((String) body.get("authorisedPersonName"));
        if (body.containsKey("entityType")) entity.setEntityType((String) body.get("entityType"));
        if (body.containsKey("gstNumber")) entity.setGstNumber((String) body.get("gstNumber"));
        if (body.containsKey("gstCertificateUrl")) entity.setGstCertificateUrl((String) body.get("gstCertificateUrl"));
        if (body.containsKey("fssaiNumber")) entity.setFssaiNumber((String) body.get("fssaiNumber"));
        if (body.containsKey("panCompany")) entity.setPanCompany((String) body.get("panCompany"));
        if (body.containsKey("panSignatory")) entity.setPanSignatory((String) body.get("panSignatory"));
        if (body.containsKey("aadhaarNumber")) entity.setAadhaarNumber((String) body.get("aadhaarNumber"));
        if (body.containsKey("email")) entity.setEmail((String) body.get("email"));
        if (body.containsKey("phone")) entity.setPhone((String) body.get("phone"));
        if (body.containsKey("whatsappNumber")) entity.setWhatsappNumber((String) body.get("whatsappNumber"));
        if (body.containsKey("ambulanceNumber")) entity.setAmbulanceNumber((String) body.get("ambulanceNumber"));
        if (body.containsKey("googleMapEmbed")) entity.setGoogleMapEmbed((String) body.get("googleMapEmbed"));
        if (body.containsKey("address")) entity.setAddress((String) body.get("address"));
        if (body.containsKey("aboutUs")) entity.setAboutUs((String) body.get("aboutUs"));
        if (body.containsKey("privacyPolicy")) entity.setPrivacyPolicy((String) body.get("privacyPolicy"));
        if (body.containsKey("termsConditions")) entity.setTermsConditions((String) body.get("termsConditions"));
        if (body.containsKey("refundPolicy")) entity.setRefundPolicy((String) body.get("refundPolicy"));
        if (body.containsKey("cancellationPolicy")) entity.setCancellationPolicy((String) body.get("cancellationPolicy"));
        if (body.containsKey("ourMission")) entity.setOurMission((String) body.get("ourMission"));
        if (body.containsKey("ourVision")) entity.setOurVision((String) body.get("ourVision"));
        if (body.containsKey("referralEnabled")) entity.setReferralEnabled((Boolean) body.get("referralEnabled"));
        if (body.containsKey("referralAmount") && body.get("referralAmount") != null) {
            String refAmt = body.get("referralAmount").toString().trim();
            if (!refAmt.isEmpty()) {
                entity.setReferralAmount(new BigDecimal(refAmt));
            }
        }

        // Marquee fields
        if (body.containsKey("marqueeText")) entity.setMarqueeText((String) body.get("marqueeText"));
        if (body.containsKey("marqueeIsLive")) entity.setMarqueeIsLive((Boolean) body.get("marqueeIsLive"));
        if (body.containsKey("marqueeBgColor")) entity.setMarqueeBgColor((String) body.get("marqueeBgColor"));
        if (body.containsKey("marqueeTextColor")) entity.setMarqueeTextColor((String) body.get("marqueeTextColor"));
        if (body.containsKey("marqueeSpeed") && body.get("marqueeSpeed") != null) {
            entity.setMarqueeSpeed(((Number) body.get("marqueeSpeed")).intValue());
        }

        // Google Rating Link
        if (body.containsKey("googleRatingUrl")) entity.setGoogleRatingUrl((String) body.get("googleRatingUrl"));

        // Menu Filter Visibility
        if (body.containsKey("filterRecommended")) entity.setFilterRecommended((Boolean) body.get("filterRecommended"));
        if (body.containsKey("filterPopular")) entity.setFilterPopular((Boolean) body.get("filterPopular"));
        if (body.containsKey("filterDiscount")) entity.setFilterDiscount((Boolean) body.get("filterDiscount"));
        if (body.containsKey("filterFastServing")) entity.setFilterFastServing((Boolean) body.get("filterFastServing"));
        if (body.containsKey("filterPrice")) entity.setFilterPrice((Boolean) body.get("filterPrice"));
        if (body.containsKey("filterRating")) entity.setFilterRating((Boolean) body.get("filterRating"));
        if (body.containsKey("filterVegNonveg")) entity.setFilterVegNonveg((Boolean) body.get("filterVegNonveg"));

        // Social media links stored as JSON string
        if (body.containsKey("socialMediaLinks")) {
            Object socialMedia = body.get("socialMediaLinks");
            if (socialMedia instanceof Map) {
                entity.setSocialMediaLinks(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(socialMedia));
            } else if (socialMedia instanceof String) {
                entity.setSocialMediaLinks((String) socialMedia);
            }
        }

        BusinessSettingEntity saved = businessSettingRepository.save(entity);

        // Sync theme fields to UsersProfileEntity so the theme API reflects changes
        syncThemeToProfile(user, body);

        return saved;
    }

    /**
     * Sync primary color, logo, favicon, and website to UsersProfileEntity
     * so the theme API (/api/global/theme/getByDomain) returns updated values
     */
    private void syncThemeToProfile(UsersEntity user, Map<String, Object> body) {
        try {
            UsersProfileEntity profile = usersProfileRepository.findByRestaurantId_id(user.getId());
            if (profile == null) return;

            boolean changed = false;
            if (body.containsKey("primaryColor") && body.get("primaryColor") != null) {
                profile.setPrimarys((String) body.get("primaryColor"));
                changed = true;
            }
            if (body.containsKey("secondaryColor") && body.get("secondaryColor") != null) {
                profile.setSecondary((String) body.get("secondaryColor"));
                changed = true;
            }
            if (body.containsKey("tertiaryColor") && body.get("tertiaryColor") != null) {
                profile.setTertiary((String) body.get("tertiaryColor"));
                changed = true;
            }
            if (body.containsKey("fontColor") && body.get("fontColor") != null) {
                profile.setFontColour((String) body.get("fontColor"));
                changed = true;
            }
            if (body.containsKey("fontName") && body.get("fontName") != null) {
                profile.setFontName((String) body.get("fontName"));
                changed = true;
            }
            if (body.containsKey("logoUrl") && body.get("logoUrl") != null) {
                profile.setLogoUrl((String) body.get("logoUrl"));
                changed = true;
            }
            if (body.containsKey("faviconUrl") && body.get("faviconUrl") != null) {
                profile.setFeviconUrl((String) body.get("faviconUrl"));
                changed = true;
            }
            if (body.containsKey("domainUrl") && body.get("domainUrl") != null) {
                profile.setWebsite((String) body.get("domainUrl"));
                changed = true;
            }
            if (body.containsKey("businessName") && body.get("businessName") != null) {
                profile.setRestaurantName((String) body.get("businessName"));
                changed = true;
            }
            if (changed) {
                usersProfileRepository.save(profile);
                System.out.println("Theme synced to UsersProfile for user: " + user.getId());
            }
        } catch (Exception e) {
            System.err.println("Failed to sync theme to profile: " + e.getMessage());
        }
    }

    /**
     * Upload a branding image (logo or favicon) to Google Drive and return the URL.
     */
    public String uploadBrandingImage(MultipartFile file, String type, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();
        String folder = "branding_" + userId;
        String fileName = type + "_" + userId;
        // old: return googleDriveUtil.uploadFile(file, fileName, folder);
        java.util.Optional<BusinessSettingEntity> optEntity = businessSettingRepository.findByRestaurantId_Id(Long.valueOf(userId));
        final Long _entityId = optEntity.map(BusinessSettingEntity::getId).orElse(null);
        return fileUploadService.uploadFile(file, fileName, folder,
            driveUrl -> {
                if (_entityId != null) {
                    if ("logo".equalsIgnoreCase(type)) {
                        businessSettingRepository.updateDriveLogoUrl(_entityId, driveUrl);
                    } else if ("favicon".equalsIgnoreCase(type)) {
                        businessSettingRepository.updateDriveFaviconUrl(_entityId, driveUrl);
                    }
                }
            });
    }

    /**
     * Get public branding info (logo, name) by restaurant ID — no auth required.
     */
    public Map<String, Object> getPublicBranding(Long restaurantId) {
        Map<String, Object> result = new java.util.HashMap<>();
        Optional<BusinessSettingEntity> opt = businessSettingRepository.findByRestaurantId_Id(restaurantId);
        if (opt.isPresent()) {
            BusinessSettingEntity s = opt.get();
            result.put("logoUrl", s.getLogoUrl());
            result.put("faviconUrl", s.getFaviconUrl());
            result.put("businessName", s.getBusinessName() != null ? s.getBusinessName() : s.getOrganisationName());
            result.put("primaryColor", s.getPrimaryColor());
            result.put("googleRatingUrl", s.getGoogleRatingUrl());
            result.put("gstNumber", s.getGstNumber());
            result.put("fssaiNumber", s.getFssaiNumber());
            result.put("address", s.getAddress());

            // Menu filter visibility (null = enabled by default)
            Map<String, Boolean> menuFilters = new java.util.LinkedHashMap<>();
            menuFilters.put("recommended", s.getFilterRecommended() != null ? s.getFilterRecommended() : true);
            menuFilters.put("popular", s.getFilterPopular() != null ? s.getFilterPopular() : true);
            menuFilters.put("discount", s.getFilterDiscount() != null ? s.getFilterDiscount() : true);
            menuFilters.put("fastServing", s.getFilterFastServing() != null ? s.getFilterFastServing() : true);
            menuFilters.put("price", s.getFilterPrice() != null ? s.getFilterPrice() : true);
            menuFilters.put("rating", s.getFilterRating() != null ? s.getFilterRating() : true);
            menuFilters.put("vegNonveg", s.getFilterVegNonveg() != null ? s.getFilterVegNonveg() : true);
            result.put("menuFilters", menuFilters);
        }
        return result;
    }

    /**
     * Get live marquee messages by restaurant ID (public, no auth).
     * Returns only messages that are active and within their schedule window.
     */
    public List<MarqueeMessageEntity> getLiveMarqueeMessages(Long restaurantId) {
        return marqueeMessageRepository.findLiveMessages(restaurantId, LocalDateTime.now());
    }

    // ========== Marquee Messages (Admin CRUD) ==========

    public List<MarqueeMessageEntity> getMarqueeMessages(String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();
        return marqueeMessageRepository.findByRestaurantId_IdOrderByDisplayOrderAsc(Long.valueOf(userId));
    }

    public MarqueeMessageEntity addMarqueeMessage(Map<String, Object> body, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();

        Optional<UsersEntity> userOpt = usersRepository.findById(Long.valueOf(userId));
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        MarqueeMessageEntity entity = new MarqueeMessageEntity();
        entity.setRestaurantId(userOpt.get());
        mapMarqueeFields(entity, body);
        return marqueeMessageRepository.save(entity);
    }

    public MarqueeMessageEntity updateMarqueeMessage(Map<String, Object> body, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);

        Object idObj = body.get("id");
        if (idObj == null) throw new RuntimeException("Marquee message ID is required");
        Long msgId = ((Number) idObj).longValue();

        Optional<MarqueeMessageEntity> opt = marqueeMessageRepository.findById(msgId);
        if (opt.isEmpty()) throw new RuntimeException("Marquee message not found");

        MarqueeMessageEntity entity = opt.get();
        mapMarqueeFields(entity, body);
        return marqueeMessageRepository.save(entity);
    }

    public void deleteMarqueeMessage(Long id, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        Optional<MarqueeMessageEntity> opt = marqueeMessageRepository.findById(id);
        if (opt.isEmpty()) throw new RuntimeException("Marquee message not found");
        marqueeMessageRepository.deleteById(id);
    }

    private void mapMarqueeFields(MarqueeMessageEntity entity, Map<String, Object> body) {
        if (body.containsKey("message")) entity.setMessage((String) body.get("message"));
        if (body.containsKey("bgColor")) entity.setBgColor((String) body.get("bgColor"));
        if (body.containsKey("textColor")) entity.setTextColor((String) body.get("textColor"));
        if (body.containsKey("speed") && body.get("speed") != null) {
            entity.setSpeed(((Number) body.get("speed")).intValue());
        }
        if (body.containsKey("fontWeight")) entity.setFontWeight((String) body.get("fontWeight"));
        if (body.containsKey("isActive")) entity.setIsActive((Boolean) body.get("isActive"));
        if (body.containsKey("displayOrder") && body.get("displayOrder") != null) {
            entity.setDisplayOrder(((Number) body.get("displayOrder")).intValue());
        }
        if (body.containsKey("scheduleStart")) {
            String val = (String) body.get("scheduleStart");
            entity.setScheduleStart(val != null && !val.isEmpty() ? LocalDateTime.parse(val) : null);
        }
        if (body.containsKey("scheduleEnd")) {
            String val = (String) body.get("scheduleEnd");
            entity.setScheduleEnd(val != null && !val.isEmpty() ? LocalDateTime.parse(val) : null);
        }
    }

    // ========== Team Members ==========

    public List<TeamMemberEntity> getTeamMembers(String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();
        return teamMemberRepository.findByRestaurantId_IdOrderByDisplayOrderAsc(Long.valueOf(userId));
    }

    public TeamMemberEntity addTeamMember(Map<String, Object> body, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer userId = tokenUtil.getCurrentUserId();

        Optional<UsersEntity> userOpt = usersRepository.findById(Long.valueOf(userId));
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        TeamMemberEntity member = new TeamMemberEntity();
        member.setRestaurantId(userOpt.get());
        member.setName((String) body.get("name"));
        member.setDesignation((String) body.get("designation"));
        member.setPhotoUrl((String) body.get("photoUrl"));
        if (body.containsKey("displayOrder") && body.get("displayOrder") != null) {
            member.setDisplayOrder(((Number) body.get("displayOrder")).intValue());
        }

        return teamMemberRepository.save(member);
    }

    public TeamMemberEntity updateTeamMember(Map<String, Object> body, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);

        Object idObj = body.get("id");
        if (idObj == null) {
            throw new RuntimeException("Team member ID is required");
        }
        Long memberId = ((Number) idObj).longValue();

        Optional<TeamMemberEntity> memberOpt = teamMemberRepository.findById(memberId);
        if (memberOpt.isEmpty()) {
            throw new RuntimeException("Team member not found");
        }

        TeamMemberEntity member = memberOpt.get();
        if (body.containsKey("name")) member.setName((String) body.get("name"));
        if (body.containsKey("designation")) member.setDesignation((String) body.get("designation"));
        if (body.containsKey("photoUrl")) member.setPhotoUrl((String) body.get("photoUrl"));
        if (body.containsKey("displayOrder") && body.get("displayOrder") != null) {
            member.setDisplayOrder(((Number) body.get("displayOrder")).intValue());
        }

        return teamMemberRepository.save(member);
    }

    public void deleteTeamMember(Long id, String token) throws Exception {
        Authorization.authorizeAdminOrRestaurant(token);

        Optional<TeamMemberEntity> memberOpt = teamMemberRepository.findById(id);
        if (memberOpt.isEmpty()) {
            throw new RuntimeException("Team member not found");
        }

        teamMemberRepository.deleteById(id);
    }
}
