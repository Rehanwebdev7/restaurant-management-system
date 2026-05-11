package com.rms.common;

import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class Constant {

    public void sendNotificationByBranchAndRole(Long branchId, String role, String title, String body, Map<String, Object> payload) {}

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
