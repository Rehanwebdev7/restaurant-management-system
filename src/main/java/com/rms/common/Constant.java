package com.rms.common;

import com.rms.common.apis.GoogleMapsService;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.UsersProfileRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class Constant {

    public void sendNotificationByBranchAndRole(Long branchId, String role, String title, String body, Map<String, Object> payload) {}
    public void sendNotificationToUser(Long userId, String title, String body, Map<String, Object> payload) {}
    public static String generateOrderId(Long seed) { return "ORD-" + (seed == null ? System.currentTimeMillis() : seed + "-" + System.currentTimeMillis()); }
    public Map<String, Object> findSingleBranchDistanceUsingGoogleMaps(Long branchId, Double latitude, Double longitude) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("distance_km", 0.0);
        response.put("time_minutes", 0);
        response.put("time_text", "0 min");
        return response;
    }
    public List<Map<String, Object>> findNearestBranches(double latitude, double longitude, List<UsersEntity> branches,
                                                         UsersProfileRepository usersProfileRepository,
                                                         GoogleMapsService googleMapsService) {
        return new ArrayList<>();
    }

    public String getApiLimit() { return null; }
    public String getCronOnOff() { return null; }
    public String getLockSystem() { return null; }
    public String getMaintainanceMode() { return null; }
    public String getMinAmount() { return null; }
    public String getForceUpdate() { return null; }
    public String getLatestVersion() { return null; }
    public String getSystemIp() { return null; }
    public String getTransferToCron() { return null; }
    public String getPayout() { return null; }
    public String getPayoutApi() { return null; }
    public String getNetworkPayment() { return null; }
    public String getVerification() { return null; }
    public String getBeneficiary() { return null; }
    public String getDmt() { return null; }
    public String getDownloadIncentiveAmount() { return null; }
    public String getRedirectedUrl() { return null; }
    public String getApiLogs() { return null; }
    public void decryptAndStoreToken(String token) {}
    public Long getCurrentUserId() { return null; }
    public static String generateOTP() { return String.valueOf((int)(Math.random() * 900000) + 100000); }
    public static String smsServiceOtp = "SMS_OTP_SERVICE";
}
