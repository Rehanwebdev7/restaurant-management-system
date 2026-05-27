package com.rms.common;

import com.rms.common.apis.GoogleMapsService;
import com.rms.common.entities.DeviceTokenEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.DeviceTokenRepository;
import com.rms.common.repositories.UsersProfileRepository;
import com.rms.common.util.FCMUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class Constant {

    @Autowired
    private FCMUtil fcmUtil;

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    public void sendNotificationByBranchAndRole(Long branchId, String role, String title, String body, Map<String, Object> payload) {
        if (branchId == null || role == null) return;
        List<DeviceTokenEntity> tokens = deviceTokenRepository.findByBranchAndRole(branchId, role);
        for (DeviceTokenEntity dt : tokens) {
            fcmUtil.sendNotification(dt.getToken(), title, body);
        }
    }

    public void sendNotificationToUser(Long userId, String title, String body, Map<String, Object> payload) {
        if (userId == null) return;
        List<DeviceTokenEntity> tokens = deviceTokenRepository.findByUserstId_Id(userId);
        for (DeviceTokenEntity dt : tokens) {
            fcmUtil.sendNotification(dt.getToken(), title, body);
        }
    }

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
