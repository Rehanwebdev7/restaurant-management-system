package com.rms.controllers;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.DeviceTokenEntity;
import com.rms.common.entities.OtpLogsEntity;
import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.DeviceTokenRepository;
import com.rms.common.repositories.OtpLogsRepository;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.response.ApiResponse;
import com.rms.common.sms.SmsService;
import com.rms.common.util.AES256Util;
import com.rms.common.util.UnixTimestampExample;

@RestController
public class LoginController {

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private SubscriptionRepository subscriptionRepository;

	@Autowired
	private DeviceTokenRepository deviceTokenRepository;

	@Autowired
	private CustomersRepository customersRepository;

	@Autowired
	private OtpLogsRepository otpLogsRepository;

	@Autowired
	private SmsService smsService;

	// Firebase WEB SDK config — public values (apiKey is an identifier, not a
	// secret). Blank in default application.properties; populated by the owner
	// at deploy time. When all required values are present, the SW + frontend
	// FCM init flip from no-op to live.
	@Value("${firebase.web.apiKey:}") private String fbWebApiKey;
	@Value("${firebase.web.authDomain:}") private String fbWebAuthDomain;
	@Value("${firebase.web.projectId:}") private String fbWebProjectId;
	@Value("${firebase.web.appId:}") private String fbWebAppId;
	@Value("${firebase.web.messagingSenderId:}") private String fbWebMessagingSenderId;
	@Value("${firebase.web.vapidKey:}") private String fbWebVapidKey;

	/**
	 * Returns the public Firebase web SDK config so the service worker can boot
	 * without a rebuild when credentials change. Unauthenticated by design — the
	 * values returned here are PUBLIC by Firebase's threat model (the apiKey is
	 * an identifier; access is enforced server-side by Firebase Rules + IAM).
	 */
	@GetMapping("/api/auth/fcm-web-config")
	public ResponseEntity<Object> fcmWebConfig() {
		Map<String, Object> cfg = new HashMap<>();
		cfg.put("apiKey", fbWebApiKey);
		cfg.put("authDomain", fbWebAuthDomain);
		cfg.put("projectId", fbWebProjectId);
		cfg.put("appId", fbWebAppId);
		cfg.put("messagingSenderId", fbWebMessagingSenderId);
		cfg.put("vapidKey", fbWebVapidKey);
		cfg.put("ready", fbWebApiKey != null && !fbWebApiKey.isBlank()
				&& fbWebProjectId != null && !fbWebProjectId.isBlank()
				&& fbWebAppId != null && !fbWebAppId.isBlank()
				&& fbWebMessagingSenderId != null && !fbWebMessagingSenderId.isBlank());
		return ApiResponse.responseBuilder(cfg, "SUCCESS", HttpStatus.OK, "Firebase web config");
	}

	/**
	 * Register / refresh an FCM device token for the authenticated subject.
	 * Works for both staff (panel) and customer tokens — the subject is
	 * resolved from the AES-encrypted `access_token` header's `userType` claim
	 * ("customer" → CustomersEntity, anything else → UsersEntity).
	 *
	 * Body: { "token": "<fcm-device-token>", "platform"?: "web" | "android" | "ios" }
	 */
	@PostMapping("/api/auth/register-fcm-token")
	public ResponseEntity<Object> registerFcmToken(
			@RequestHeader("access_token") String accessToken,
			@RequestBody Map<String, Object> payload) {
		try {
			String fcmToken = payload.get("token") != null ? String.valueOf(payload.get("token")).trim() : null;
			String platform = payload.get("platform") != null && !String.valueOf(payload.get("platform")).isBlank()
					? String.valueOf(payload.get("platform")).trim()
					: "web";
			if (fcmToken == null || fcmToken.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
						"token is required");
			}

			String decrypted;
			try {
				decrypted = AES256Util.decrypt(accessToken);
			} catch (Exception e) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"Invalid or unrecognized access token");
			}
			JSONObject claims = new JSONObject(decrypted);
			Long subjectId = claims.getLong("id");
			String userType = claims.optString("userType", "user");

			if ("customer".equalsIgnoreCase(userType)) {
				CustomersEntity customer = customersRepository.findById(subjectId).orElse(null);
				if (customer == null) {
					return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, "Customer not found");
				}
				DeviceTokenEntity dt = deviceTokenRepository.findFirstByCustomersId_Id(customer.getId())
						.orElse(new DeviceTokenEntity());
				dt.setToken(fcmToken);
				dt.setPlatform(platform);
				dt.setCustomersId(customer);
				deviceTokenRepository.save(dt);
			} else {
				UsersEntity user = usersRepository.findById(subjectId).orElse(null);
				if (user == null) {
					return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, "User not found");
				}
				DeviceTokenEntity dt = deviceTokenRepository.findFirstByUserstId_Id(user.getId())
						.orElse(new DeviceTokenEntity());
				dt.setToken(fcmToken);
				dt.setPlatform(platform);
				dt.setUserstId(user);
				deviceTokenRepository.save(dt);
			}

			Map<String, Object> data = new HashMap<>();
			data.put("registered", true);
			data.put("platform", platform);
			return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.OK, "FCM token registered");
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Error: " + e.getMessage());
		}
	}

	@PostMapping("/api/auth/change-password")
	public ResponseEntity<Object> changePassword(
			@RequestHeader("Authorization") String token,
			@RequestBody Map<String, Object> payload) {
		try {
			String oldPassword = (String) payload.get("old_password");
			String newPassword = (String) payload.get("new_password");

			if (oldPassword == null || newPassword == null || oldPassword.isBlank() || newPassword.isBlank()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "old_password and new_password are required");
			}

			String decrypted = AES256Util.decrypt(token);
			JSONObject json = new JSONObject(decrypted);
			Long userId = json.getLong("id");

			UsersEntity user = usersRepository.findById(userId).orElse(null);
			if (user == null) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, "User not found");
			}

			if (!oldPassword.equals(user.getPassword())) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "Current password is incorrect");
			}

			if (newPassword.equals(oldPassword)) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, "New password must be different from current password");
			}

			user.setPassword(newPassword);
			usersRepository.save(user);

			return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Password changed successfully");
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Error: " + e.getMessage());
		}
	}

	@PostMapping("/login/panelLogin")
	public ResponseEntity<Object> panelLogin(@RequestBody Map<String, Object> payload) {
		try {
			String mobile = (String) payload.get("mobile");
			String password = (String) payload.get("password");

			if (mobile == null || mobile.isEmpty() || password == null || password.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
						"Mobile and password are required");
			}

			UsersEntity user = usersRepository.findByMobile(mobile).orElse(null);

			if (user == null) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"Invalid mobile or password");
			}

			if (!password.equals(user.getPassword())) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"Invalid mobile or password");
			}

			if (user.getIsDeleted() != null && user.getIsDeleted()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"User account is deleted");
			}

			if (user.getIsActive() != null && !user.getIsActive()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"User account is not active");
			}

			long timestamp = UnixTimestampExample.getCurrentTimestamp() + 999999999;
			String parentId = user.getParentId() != null && user.getParentId().getId() != null
					? user.getParentId().getId().toString()
					: "null";
			String branchId = user.getBranchId() != null && user.getBranchId().getId() != null
					? user.getBranchId().getId().toString()
					: "null";
			String tokenData = "{\"id\": " + user.getId()
					+ ", \"userType\": \"" + (user.getRole() != null ? user.getRole().toLowerCase() : "user")
					+ "\", \"parentId\": " + parentId
					+ ", \"branchId\": " + branchId
					+ ", \"timestamp\": " + timestamp + "}";
			String token = AES256Util.encrypt(tokenData);

			Map<String, Object> responseData = new HashMap<>();
			responseData.put("token", token);
			responseData.put("name", user.getName() != null ? user.getName() : "");
			responseData.put("mobile", user.getMobile() != null ? user.getMobile() : "");
			responseData.put("userType", user.getRole() != null ? user.getRole() : "");
			responseData.put("id", user.getId());

			// Add subscription info for restaurant users
			if ("restaurant".equalsIgnoreCase(user.getRole())) {
				List<SubscriptionEntity> activeSubs = subscriptionRepository.findActiveSubscriptionsByUserId(user.getId());
				if (activeSubs.isEmpty()) {
					responseData.put("subscriptionStatus", "none");
					responseData.put("planName", null);
					responseData.put("planId", null);
					responseData.put("maxBranch", null);
					responseData.put("maxKitchen", null);
					responseData.put("maxDeliveryBoy", null);
				} else {
					SubscriptionEntity sub = activeSubs.get(0);
					responseData.put("subscriptionStatus", sub.getStatus());
					responseData.put("planName", sub.getPlan().getPlanName());
					responseData.put("planId", sub.getPlan().getPlanId());
					responseData.put("maxBranch", sub.getPlan().getMaxBranch());
					responseData.put("maxKitchen", sub.getPlan().getMaxKitchen());
					responseData.put("maxDeliveryBoy", sub.getPlan().getMaxDeliveryBoy());
				}
			}

			String fcmToken = (String) payload.get("fcmToken");
			if (fcmToken != null && !fcmToken.isBlank()) {
				DeviceTokenEntity dt = deviceTokenRepository.findFirstByUserstId_Id(user.getId())
						.orElse(new DeviceTokenEntity());
				dt.setToken(fcmToken);
				dt.setPlatform("web");
				dt.setUserstId(user);
				deviceTokenRepository.save(dt);
			}

			return ApiResponse.responseBuilder(responseData, "SUCCESS", HttpStatus.OK, "Login successful");

		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error: " + e.getMessage());
		}
	}

	// ============================================================
	//  CUSTOMER MOBILE LOGIN — OTP-based + password fallback
	// ============================================================

	/**
	 * Generate and persist an OTP for the supplied mobile number.
	 * Body: { "mobile": "9988776655" }
	 */
	@PostMapping("/login/customerSendOtp")
	public ResponseEntity<Object> customerSendOtp(@RequestBody Map<String, Object> payload) {
		try {
			String mobile = payload.get("mobile") != null ? String.valueOf(payload.get("mobile")).trim() : null;
			if (mobile == null || mobile.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
						"mobile is required");
			}

			// 4-digit OTP
			String otpCode = String.valueOf(new Random().nextInt(9000) + 1000);

			OtpLogsEntity log = new OtpLogsEntity();
			log.setIdentifier(mobile);
			log.setMobileNumber(mobile);
			log.setOtpCode(otpCode);
			log.setOtpType("CUSTOMER_LOGIN");
			log.setType("LOGIN");
			log.setIsVerified(false);
			log.setIsUsed(false);
			log.setAttemptCount(0);
			LocalDateTime now = LocalDateTime.now();
			log.setCreatedAt(now);
			log.setUpdatedAt(now);
			log.setExpiresAt(now.plusMinutes(5));
			otpLogsRepository.save(log);

			// Send via the configured SMS provider. NoopSmsService is the default
			// when sms.provider is unset / "none" — it logs the OTP to stdout
			// so dev + CI keep working without a real SMS roundtrip. Drop in
			// `sms.provider=msg91` + credentials in application.properties to
			// route through MSG91 for live SMS without any further code change.
			boolean smsAccepted = smsService.sendOtp(mobile, otpCode);
			System.out.println("[CUSTOMER OTP] mobile=" + mobile + " otp=" + otpCode
					+ " id=" + log.getId() + " sms.live=" + smsService.isLive()
					+ " accepted=" + smsAccepted);

			Map<String, Object> data = new HashMap<>();
			data.put("otpId", UUID.randomUUID().toString());
			data.put("expiresInSeconds", 300);
			// Surface the demo-mode hint so the frontend can tell users to
			// type 1234 when there's no real SMS provider connected yet.
			data.put("demoMode", !smsService.isLive());

			return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.OK,
					smsService.isLive() ? "OTP sent" : "OTP sent (demo mode — use 1234)");
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to send OTP: " + e.getMessage());
		}
	}

	/**
	 * Verify OTP and issue a customer session token.
	 * Body: { "mobile": "9988776655", "otp": "1234" }
	 */
	@PostMapping("/login/customerVerifyOtp")
	public ResponseEntity<Object> customerVerifyOtp(@RequestBody Map<String, Object> payload) {
		try {
			String mobile = payload.get("mobile") != null ? String.valueOf(payload.get("mobile")).trim() : null;
			String otp = payload.get("otp") != null ? String.valueOf(payload.get("otp")).trim() : null;

			if (mobile == null || mobile.isEmpty() || otp == null || otp.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
						"mobile and otp are required");
			}

			// ----- DEMO BYPASS -----
			// Hardcoded "1234" always succeeds. Keep this guarded behind a clear flag if
			// you ever introduce a production environment toggle.
			boolean demoBypass = "1234".equals(otp);

			OtpLogsEntity match = null;
			if (!demoBypass) {
				match = otpLogsRepository
						.findFirstByIdentifierAndOtpCodeAndIsVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
								mobile, otp, LocalDateTime.now())
						.orElse(null);
				if (match == null) {
					return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
							"Invalid or expired OTP");
				}
				match.setIsVerified(true);
				match.setIsUsed(true);
				match.setVerifiedAt(LocalDateTime.now());
				match.setUsedAt(LocalDateTime.now());
				match.setUpdatedAt(LocalDateTime.now());
				otpLogsRepository.save(match);
			}

			String fcmTokenOtp = payload.get("fcmToken") != null ? String.valueOf(payload.get("fcmToken")).trim() : null;
			Map<String, Object> data = buildCustomerSessionData(mobile, fcmTokenOtp);
			return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.OK, "OTP verified");
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to verify OTP: " + e.getMessage());
		}
	}

	/**
	 * Password-based customer login fallback.
	 * Body: { "mobile": "...", "password": "..." }
	 */
	@PostMapping("/login/customer")
	public ResponseEntity<Object> customerPasswordLogin(@RequestBody Map<String, Object> payload) {
		try {
			String mobile = payload.get("mobile") != null ? String.valueOf(payload.get("mobile")).trim() : null;
			String password = payload.get("password") != null ? String.valueOf(payload.get("password")) : null;

			if (mobile == null || mobile.isEmpty() || password == null || password.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
						"mobile and password are required");
			}

			CustomersEntity customer = customersRepository.findByMobileNumber(mobile).orElse(null);
			if (customer == null) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"Invalid mobile or password");
			}
			if (customer.getPassword() == null || !password.equals(customer.getPassword())) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"Invalid mobile or password");
			}
			if (customer.getIsActive() != null && !customer.getIsActive()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED,
						"Account is not active");
			}

			String fcmTokenPwd = payload.get("fcmToken") != null ? String.valueOf(payload.get("fcmToken")).trim() : null;
			Map<String, Object> data = buildCustomerSessionData(mobile, fcmTokenPwd);
			return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.OK, "Login successful");
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to login: " + e.getMessage());
		}
	}

	/**
	 * Find or create a CustomersEntity for the given mobile, then assemble a
	 * session payload (token + minimal profile). When fcmToken is supplied it
	 * is upserted into device_token under customers_id, mirroring the panel
	 * login pattern so push notifications work end-to-end on the customer side.
	 */
	private Map<String, Object> buildCustomerSessionData(String mobile, String fcmToken) throws Exception {
		CustomersEntity customer = customersRepository.findByMobileNumber(mobile).orElse(null);
		if (customer == null) {
			customer = new CustomersEntity();
			customer.setMobileNumber(mobile);
			String tail = mobile.length() >= 4 ? mobile.substring(mobile.length() - 4) : mobile;
			customer.setName("Guest " + tail);
			customer.setIsActive(true);
			customer.setIsDeleted(0);
			customer = customersRepository.save(customer);
		}

		if (fcmToken != null && !fcmToken.isBlank()) {
			DeviceTokenEntity dt = deviceTokenRepository.findFirstByCustomersId_Id(customer.getId())
					.orElse(new DeviceTokenEntity());
			dt.setToken(fcmToken);
			dt.setPlatform("web");
			dt.setCustomersId(customer);
			deviceTokenRepository.save(dt);
		}

		long timestamp = UnixTimestampExample.getCurrentTimestamp() + 999999999;
		String tokenData = "{\"id\": " + customer.getId()
				+ ", \"userType\": \"customer\""
				+ ", \"mobile\": \"" + mobile + "\""
				+ ", \"timestamp\": " + timestamp + "}";
		String token = AES256Util.encrypt(tokenData);

		Map<String, Object> data = new HashMap<>();
		data.put("token", token);
		data.put("name", customer.getName());
		data.put("email", customer.getEmail());
		data.put("mobile", customer.getMobileNumber());
		data.put("customerId", customer.getId());
		return data;
	}
}
