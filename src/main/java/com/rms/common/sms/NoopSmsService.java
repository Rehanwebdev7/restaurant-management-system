package com.rms.common.sms;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Default impl when sms.provider is unset / "none" / credentials missing.
 *
 * Logs the would-be SMS to stdout so dev + tests can read the OTP from the
 * Spring Boot log just like before. The existing customerVerifyOtp demo
 * bypass (`otp == "1234"`) continues to work unchanged.
 */
@Service
@ConditionalOnProperty(value = "sms.provider", havingValue = "none", matchIfMissing = true)
public class NoopSmsService implements SmsService {

    @Value("${sms.demo.show-in-logs:true}") private boolean showInLogs;

    @Override
    public boolean send(String mobile, String message) {
        if (showInLogs) {
            System.out.println("[SMS DEV] to=" + mobile + " body=" + message);
        }
        return true;
    }

    @Override
    public boolean isLive() {
        return false;
    }
}
