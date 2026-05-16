package com.rms.modules.customer.controllers;

import java.io.InputStream;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustOtaService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("api/customer/ota")
public class CustOtaController {

    @Autowired
    private CustOtaService otaService;

    // ==================== STEP 1: CHECK FOR UPDATE ====================
    @PostMapping("/check")
    public ResponseEntity<Object> checkForUpdate(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, String> request) {
        try {
            String deviceId = request.get("deviceId");
            String currentVersion = request.get("currentVersion");
            String platform = request.get("platform");

            if (deviceId == null || deviceId.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "deviceId is required");
            }
            if (currentVersion == null || currentVersion.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "currentVersion is required");
            }

            Map<String, Object> result = otaService.checkForUpdate(deviceId, currentVersion, platform, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Update check completed");

        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error: " + e.getMessage());
        }
    }

    // ==================== STEP 2: GET DOWNLOAD TOKEN ====================
    @PostMapping("/token")
    public ResponseEntity<Object> getDownloadToken(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String deviceId = request.get("deviceId");
            String nonce = request.get("nonce");
            String targetVersion = request.get("targetVersion");

            if (deviceId == null || deviceId.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "deviceId is required");
            }
            if (nonce == null || nonce.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "nonce is required");
            }
            if (targetVersion == null || targetVersion.trim().isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "targetVersion is required");
            }

            String clientIp = getClientIp(httpRequest);

            Map<String, Object> result = otaService.generateDownloadToken(deviceId, nonce, targetVersion, token, clientIp);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Download token generated");

        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            if ("RATE_LIMIT_EXCEEDED".equals(e.getMessage())) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.TOO_MANY_REQUESTS,
                        "Rate limit exceeded for this device. Try again later.");
            }
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error: " + e.getMessage());
        }
    }

    // ==================== STEP 3: DOWNLOAD BUNDLE ====================
    @GetMapping("/download/{version}")
    public ResponseEntity<?> downloadBundle(
            @PathVariable String version,
            @RequestParam String token,
            HttpServletRequest httpRequest) {
        try {
            String clientIp = getClientIp(httpRequest);

            InputStream fileStream = otaService.downloadBundle(version, token, clientIp);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"update-" + version + ".zip\"");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-store");

            return new ResponseEntity<>(new InputStreamResource(fileStream), headers, HttpStatus.OK);

        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.FORBIDDEN, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error: " + e.getMessage());
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        return request.getRemoteAddr();
    }
}
