package com.rms.common.sms;

/**
 * Abstraction over the SMS provider. Spring Boot picks the impl bean at boot
 * based on `sms.provider` (msg91 / twilio / none). When credentials are
 * missing or `sms.provider=none`, the no-op impl is selected so dev + CI
 * never block on a real SMS roundtrip — and the existing OTP demo bypass
 * keeps working without code changes.
 *
 * The contract is intentionally minimal so we can swap providers without
 * touching callers (LoginController). Add richer methods (templated, OTP-
 * specific, transactional vs promotional) only when an actual caller needs
 * them.
 */
public interface SmsService {
    /**
     * Send a transactional text. Returns true if the gateway accepted the
     * request (HTTP 2xx), false otherwise. Callers should NOT block on this
     * result for OTP delivery — the OTP row is already persisted by the
     * controller before the SMS goes out.
     *
     * @param mobile  10-digit Indian mobile (no +91) — the impl prepends the
     *                country code if its gateway requires one.
     * @param message Plain text body, ≤ 160 chars for single-segment delivery.
     */
    boolean send(String mobile, String message);

    /**
     * Convenience for the most common case — a 4–6 digit OTP code. Provider
     * impls may use a templated path (MSG91 OTP API, Twilio Verify) instead
     * of a raw send.
     */
    default boolean sendOtp(String mobile, String otpCode) {
        return send(mobile, "Your verification code is " + otpCode + ". Valid for 5 minutes.");
    }

    /**
     * True when the service is wired to a real provider (credentials present
     * and reachable at boot). Callers can use this to decide whether to
     * surface the demo "use OTP 1234" hint in API responses.
     */
    boolean isLive();
}
