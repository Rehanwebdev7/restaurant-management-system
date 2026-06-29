package com.rms.common.sms;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * MSG91 SMS provider impl. Activates when application.properties has:
 *
 *   sms.provider=msg91
 *   sms.msg91.auth-key=<from MSG91 dashboard>
 *   sms.msg91.sender-id=<6 char DLT-approved sender>
 *   sms.msg91.template-id=<DLT-approved template that contains {{otp}}>
 *
 * Two send paths:
 *   • sendOtp() — uses MSG91's OTP-template endpoint (preferred — counts as
 *     transactional, no DND issues, MSG91 owns the template approval).
 *   • send()    — generic Flow API for non-OTP messages.
 *
 * Both fall back to logging the SMS body on any HTTP error so the OTP flow
 * doesn't break for the user just because MSG91 is down.
 */
@Service
@ConditionalOnProperty(value = "sms.provider", havingValue = "msg91")
public class Msg91SmsService implements SmsService {

    @Value("${sms.msg91.auth-key:}") private String authKey;
    @Value("${sms.msg91.sender-id:}") private String senderId;
    @Value("${sms.msg91.template-id:}") private String templateId;
    @Value("${sms.msg91.country-code:91}") private String countryCode;
    @Value("${sms.msg91.base-url:https://control.msg91.com/api/v5}") private String baseUrl;

    private boolean live;
    private final RestTemplate http = new RestTemplate();

    @PostConstruct
    void announce() {
        live = authKey != null && !authKey.isBlank() && senderId != null && !senderId.isBlank();
        if (live) {
            System.out.println("[SMS MSG91] live  sender=" + senderId + " templateId=" + (templateId == null ? "(none)" : templateId));
        } else {
            System.out.println("[SMS MSG91] credentials missing — will log SMS bodies to stdout instead of sending");
        }
    }

    @Override
    public boolean isLive() {
        return live;
    }

    @Override
    public boolean sendOtp(String mobile, String otpCode) {
        if (!live) return logFallback(mobile, "OTP " + otpCode);
        if (templateId == null || templateId.isBlank()) {
            // No OTP template configured — fall through to generic send.
            return send(mobile, "Your verification code is " + otpCode + ". Valid for 5 minutes.");
        }
        try {
            String url = baseUrl + "/otp?template_id=" + templateId
                    + "&mobile=" + countryCode + mobile
                    + "&authkey=" + authKey
                    + "&otp=" + otpCode;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> r = http.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), String.class);
            boolean ok = r.getStatusCode().is2xxSuccessful();
            if (!ok) System.err.println("[SMS MSG91] OTP send failed status=" + r.getStatusCode() + " body=" + r.getBody());
            return ok;
        } catch (Exception e) {
            System.err.println("[SMS MSG91] OTP send threw: " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean send(String mobile, String message) {
        if (!live) return logFallback(mobile, message);
        try {
            String url = baseUrl + "/flow";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("authkey", authKey);

            Map<String, Object> recipient = new HashMap<>();
            recipient.put("mobiles", countryCode + mobile);
            recipient.put("body", message);

            Map<String, Object> body = new HashMap<>();
            body.put("sender", senderId);
            body.put("short_url", "0");
            body.put("recipients", new Object[] { recipient });

            ResponseEntity<String> r = http.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
            boolean ok = r.getStatusCode().is2xxSuccessful();
            if (!ok) System.err.println("[SMS MSG91] send failed status=" + r.getStatusCode() + " body=" + r.getBody());
            return ok;
        } catch (Exception e) {
            System.err.println("[SMS MSG91] send threw: " + e.getMessage());
            return false;
        }
    }

    private boolean logFallback(String mobile, String message) {
        System.out.println("[SMS MSG91 FALLBACK] to=" + mobile + " body=" + message);
        return true;
    }
}
