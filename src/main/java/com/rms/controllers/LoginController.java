package com.rms.controllers;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.response.ApiResponse;
import com.rms.common.util.AES256Util;
import com.rms.common.util.UnixTimestampExample;

@RestController
public class LoginController {

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private SubscriptionRepository subscriptionRepository;

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
			String tokenData = "{\"id\": " + user.getId()
					+ ", \"userType\": \"" + (user.getRole() != null ? user.getRole().toLowerCase() : "user")
					+ "\", \"timestamp\": " + timestamp + "}";
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

			return ApiResponse.responseBuilder(responseData, "SUCCESS", HttpStatus.OK, "Login successful");

		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error: " + e.getMessage());
		}
	}
}
