package com.rms.modules.admin.controllers;

import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.entities.MarqueeMessageEntity;
import com.rms.common.entities.TeamMemberEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.admin.services.AdmBusinessSettingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/admin/business_setting")
public class AdmBusinessSettingController {

    @Autowired
    private AdmBusinessSettingService businessSettingService;

    /**
     * Get business settings for the authenticated user
     */
    @GetMapping("/get")
    public ResponseEntity<Object> getBusinessSetting(@RequestHeader("access_token") String token) {
        try {
            BusinessSettingEntity result = businessSettingService.getBusinessSetting(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Business settings fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Save or update business settings (upsert)
     */
    @PostMapping("/save")
    public ResponseEntity<Object> saveBusinessSetting(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> body) {
        try {
            BusinessSettingEntity result = businessSettingService.saveBusinessSetting(body, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Business settings saved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Upload logo or favicon image — returns the hosted URL
     */
    @PostMapping("/upload-image")
    public ResponseEntity<Object> uploadImage(
            @RequestHeader("access_token") String token,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "logo") String type) {
        try {
            String url = businessSettingService.uploadBrandingImage(file, type, token);
            return ApiResponse.responseBuilder(java.util.Map.of("url", url), "SUCCESS", HttpStatus.OK, "Image uploaded successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    // ========== Marquee Messages ==========

    @GetMapping("/marquee-messages")
    public ResponseEntity<Object> getMarqueeMessages(@RequestHeader("access_token") String token) {
        try {
            List<MarqueeMessageEntity> result = businessSettingService.getMarqueeMessages(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Marquee messages fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/marquee-message/add")
    public ResponseEntity<Object> addMarqueeMessage(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> body) {
        try {
            MarqueeMessageEntity result = businessSettingService.addMarqueeMessage(body, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Marquee message added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/marquee-message/update")
    public ResponseEntity<Object> updateMarqueeMessage(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> body) {
        try {
            MarqueeMessageEntity result = businessSettingService.updateMarqueeMessage(body, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Marquee message updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @DeleteMapping("/marquee-message/delete/{id}")
    public ResponseEntity<Object> deleteMarqueeMessage(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            businessSettingService.deleteMarqueeMessage(id, token);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Marquee message deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    // ========== Team Members ==========

    /**
     * Get all team members
     */
    @GetMapping("/team-members")
    public ResponseEntity<Object> getTeamMembers(@RequestHeader("access_token") String token) {
        try {
            List<TeamMemberEntity> result = businessSettingService.getTeamMembers(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Team members fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Add a team member
     */
    @PostMapping("/team-member/add")
    public ResponseEntity<Object> addTeamMember(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> body) {
        try {
            TeamMemberEntity result = businessSettingService.addTeamMember(body, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Team member added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Update a team member
     */
    @PutMapping("/team-member/update")
    public ResponseEntity<Object> updateTeamMember(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> body) {
        try {
            TeamMemberEntity result = businessSettingService.updateTeamMember(body, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Team member updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Delete a team member
     */
    @DeleteMapping("/team-member/delete/{id}")
    public ResponseEntity<Object> deleteTeamMember(
            @RequestHeader("access_token") String token,
            @PathVariable Long id) {
        try {
            businessSettingService.deleteTeamMember(id, token);
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Team member deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
