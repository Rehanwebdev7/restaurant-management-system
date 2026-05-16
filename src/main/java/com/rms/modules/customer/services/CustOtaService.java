package com.rms.modules.customer.services;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.rms.common.entities.AppVersionEntity;
import com.rms.common.repositories.AppVersionRepository;
import com.rms.common.util.AES256Util;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.configuration.Authorization;

@Service
public class CustOtaService {

    @Autowired
    private AppVersionRepository appVersionRepository;

    @Autowired
    private GoogleDriveUtil googleDriveUtil;

    @Value("${ota.hmac.secret}")
    private String hmacSecret;

    private static final int NONCE_TTL_SECONDS = 300; // 5 minutes
    private static final int TOKEN_TTL_SECONDS = 60;  // 60 seconds
    private static final int RATE_LIMIT_MAX = 5;      // max 5 token requests per window
    private static final int RATE_LIMIT_WINDOW = 60;  // per 60 seconds
    private static final ConcurrentHashMap<String, ExpiringValue<String>> KV_STORE = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, ExpiringCounter> COUNTERS = new ConcurrentHashMap<>();

    // ==================== STEP 1: CHECK FOR UPDATE ====================
    public Map<String, Object> checkForUpdate(String deviceId, String currentVersion, String platform, String token) throws Exception {
        Authorization.authorizeCustomer(token);

        Map<String, Object> response = new LinkedHashMap<>();

        AppVersionEntity setting = resolveAppVersion(platform);
        if (setting == null || setting.getLatestVersion() == null) {
            response.put("updateAvailable", false);
            return response;
        }

        String latestVersion = setting.getLatestVersion();

        if (!isNewerVersion(currentVersion, latestVersion)) {
            response.put("updateAvailable", false);
            return response;
        }

        String nonce = UUID.randomUUID().toString().replace("-", "");
        String nonceKey = "ota:nonce:" + deviceId + ":" + nonce;
        putValue(nonceKey, latestVersion, NONCE_TTL_SECONDS);

        response.put("updateAvailable", true);
        response.put("latestVersion", latestVersion);
        response.put("releaseNotes", setting.getReleaseNotes());
        response.put("sha256Checksum", setting.getSha256Checksum());
        response.put("forceUpdate", setting.getIsForceUpdate());
        response.put("nonce", nonce);

        return response;
    }

    // ==================== STEP 2: GENERATE DOWNLOAD TOKEN ====================
    public Map<String, Object> generateDownloadToken(String deviceId, String nonce, String targetVersion, String token, String clientIp) throws Exception {
        Authorization.authorizeCustomer(token);

        // Extract userId from token for audit trail in the payload.
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject jsonToken = new JSONObject(decryptedToken);
        String userId = jsonToken.has("id") && !jsonToken.isNull("id") ? String.valueOf(jsonToken.get("id")) : "0";

        String nonceKey = "ota:nonce:" + deviceId + ":" + nonce;
        String storedVersion = getValue(nonceKey);
        if (storedVersion == null) {
            throw new SecurityException("Invalid or expired nonce");
        }
        if (!storedVersion.equals(targetVersion)) {
            throw new SecurityException("Version mismatch with nonce");
        }

        // One-time-use nonce.
        deleteValue(nonceKey);

        String rateLimitKey = "ota:ratelimit:" + deviceId;
        long count = incrementCounter(rateLimitKey, RATE_LIMIT_WINDOW);
        if (count > RATE_LIMIT_MAX) {
            throw new RuntimeException("RATE_LIMIT_EXCEEDED");
        }

        long expiryEpoch = System.currentTimeMillis() / 1000 + TOKEN_TTL_SECONDS;
        String payload = deviceId + "|" + targetVersion + "|" + userId + "|" + clientIp + "|" + expiryEpoch;
        String payloadBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signature = generateHmacSha256(payloadBase64, hmacSecret);
        String signedToken = payloadBase64 + "." + signature;

        String tokenHash = sha256(signedToken);
        String tokenKey = "ota:token:" + tokenHash;
        putValue(tokenKey, "unused", TOKEN_TTL_SECONDS);

        AppVersionEntity setting = appVersionRepository.findTopByOrderByIdDesc();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("downloadUrl", "/api/customer/ota/download/" + targetVersion + "?token=" + signedToken);
        response.put("expiresInSeconds", TOKEN_TTL_SECONDS);
        response.put("sha256Checksum", setting != null ? setting.getSha256Checksum() : null);

        return response;
    }

    // ==================== STEP 3: DOWNLOAD BUNDLE ====================
    public InputStream downloadBundle(String version, String signedToken, String clientIp) throws Exception {
        String[] parts = signedToken.split("\\.");
        if (parts.length != 2) {
            throw new SecurityException("Invalid token format");
        }

        String payloadBase64 = parts[0];
        String receivedSignature = parts[1];

        String expectedSignature = generateHmacSha256(payloadBase64, hmacSecret);
        if (!expectedSignature.equals(receivedSignature)) {
            throw new SecurityException("Invalid token signature");
        }

        String payload = new String(Base64.getUrlDecoder().decode(payloadBase64), StandardCharsets.UTF_8);
        String[] fields = payload.split("\\|");
        if (fields.length != 5) {
            throw new SecurityException("Invalid token payload");
        }

        String tokenDeviceId = fields[0];
        String tokenVersion = fields[1];
        String tokenUserId = fields[2];
        String tokenIp = fields[3];
        long tokenExpiry = Long.parseLong(fields[4]);

        if (!tokenVersion.equals(version)) {
            throw new SecurityException("Version mismatch");
        }

        long now = System.currentTimeMillis() / 1000;
        if (now > tokenExpiry) {
            throw new SecurityException("Token expired");
        }

        if (!tokenIp.equals(clientIp)) {
            throw new SecurityException("IP address mismatch");
        }

        String tokenHash = sha256(signedToken);
        String tokenKey = "ota:token:" + tokenHash;
        String tokenStatus = getValue(tokenKey);
        if (tokenStatus == null) {
            throw new SecurityException("Token already used");
        }
        deleteValue(tokenKey);

        AppVersionEntity setting = appVersionRepository.findTopByOrderByIdDesc();
        if (setting == null || setting.getApplicationZip() == null || setting.getApplicationZip().isEmpty()) {
            throw new RuntimeException("Application ZIP not configured");
        }

        String fileId = GoogleDriveUtil.extractFileId(setting.getApplicationZip());
        if (fileId == null) {
            throw new RuntimeException("Could not resolve Drive file id from stored URL");
        }

        byte[] bytes = googleDriveUtil.downloadFile(fileId);
        if (bytes == null) {
            throw new RuntimeException("Application ZIP download failed");
        }

        // Audit values are embedded for anyone wiring external logging later.
        System.out.println("OTA download authorized: device=" + tokenDeviceId + ", version=" + version + ", user=" + tokenUserId);

        return new ByteArrayInputStream(bytes);
    }

    // ==================== HELPERS ====================

    private AppVersionEntity resolveAppVersion(String platform) {
        if (platform != null && !platform.isBlank()) {
            AppVersionEntity match = appVersionRepository.findFirstByPlatformIgnoreCase(platform).orElse(null);
            if (match != null) return match;
        }
        return appVersionRepository.findTopByOrderByIdDesc();
    }

    private boolean isNewerVersion(String current, String latest) {
        if (current == null || current.isEmpty()) return true;
        if (latest == null || latest.isEmpty()) return false;

        String[] currentParts = current.split("\\.");
        String[] latestParts = latest.split("\\.");

        int length = Math.max(currentParts.length, latestParts.length);
        for (int i = 0; i < length; i++) {
            int c = i < currentParts.length ? parseIntSafe(currentParts[i]) : 0;
            int l = i < latestParts.length ? parseIntSafe(latestParts[i]) : 0;
            if (l > c) return true;
            if (l < c) return false;
        }
        return false;
    }

    private int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String generateHmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
    }

    private String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void putValue(String key, String value, int ttlSeconds) {
        KV_STORE.put(key, new ExpiringValue<>(value, System.currentTimeMillis() + ttlSeconds * 1000L));
    }

    private String getValue(String key) {
        ExpiringValue<String> value = KV_STORE.get(key);
        if (value == null) {
            return null;
        }
        if (value.expiresAt() < System.currentTimeMillis()) {
            KV_STORE.remove(key);
            return null;
        }
        return value.value();
    }

    private void deleteValue(String key) {
        KV_STORE.remove(key);
    }

    private long incrementCounter(String key, int ttlSeconds) {
        long now = System.currentTimeMillis();
        COUNTERS.compute(key, (ignored, existing) -> {
            if (existing == null || existing.expiresAt() < now) {
                return new ExpiringCounter(1L, now + ttlSeconds * 1000L);
            }
            return new ExpiringCounter(existing.count() + 1L, existing.expiresAt());
        });
        return COUNTERS.get(key).count();
    }

    private record ExpiringValue<T>(T value, long expiresAt) {
    }

    private record ExpiringCounter(long count, long expiresAt) {
    }
}
