package com.rms.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rms.common.entities.ApiConfigEntity;
import com.rms.common.repositories.ApiConfigRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class CacheData {

	@Autowired(required = false)
	private ApiConfigRepository apiConfigRepository;

	private final ObjectMapper objectMapper;

	public CacheData() {
		objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule());
		objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
	}

	private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
	private static final DateTimeFormatter KEY_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmm");

	private static final String PREFIX = "valid_mobile_";

	public static final String KITCHEN_PENDING_ORDERS_KEY = "KITCHEN:PENDING:ORDERS:ALL";

	public void cacheMobile(String mobile, long secondsToExpire) {
		System.out.println("✅ Cached mobile: " + mobile + " for " + secondsToExpire + " seconds.");
	}

	public boolean isMobileCached(String mobile) {
		System.out.println("📦 Cache Check for Mobile: " + mobile + " | isCached: false");
		return false;
	}

	public void removeMobile(String mobile) {
		System.out.println("🗑️ Removed mobile from cache: " + mobile);
	}

	private final static ConcurrentHashMap<String, Integer> loginAttempts = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Integer> otpAttempts = new ConcurrentHashMap<>();
	public final ConcurrentHashMap<String, Boolean> blockStatus = new ConcurrentHashMap<>();

	public int incrementLoginAttempts(String mobile) {
		return loginAttempts.merge(mobile, 1, Integer::sum);
	}

	public static void resetLoginAttempts(String mobile) {
		loginAttempts.remove(mobile);
	}

	public void incrementOtpAttempt(String mobile) {
		otpAttempts.put(mobile, otpAttempts.getOrDefault(mobile, 0) + 1);
	}

	public int getOtpAttempts(String mobile) {
		return otpAttempts.getOrDefault(mobile, 0);
	}

	public void resetOtpAttempts(String mobile) {
		otpAttempts.remove(mobile);
	}

	public void blockAdminForTime(String mobile, int blockTimeInSeconds) {
		blockStatus.put(mobile, true);
		System.out.println("⛔ User blocked for " + blockTimeInSeconds + " seconds: " + mobile);

		new Thread(() -> {
			try {
				Thread.sleep(blockTimeInSeconds * 1000L);
				removeBlockStatus(mobile);
				System.out.println("✅ User unblocked after " + blockTimeInSeconds + " seconds: " + mobile);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}).start();
	}

	public Boolean getBlockStatusFromCache(String mobile) {
		return blockStatus.getOrDefault(mobile, false);
	}

	public void removeBlockStatus(String mobile) {
		blockStatus.remove(mobile);
	}

	public boolean isUserBlocked(String mobile) {
		Boolean isBlocked = blockStatus.getOrDefault(mobile, false);
		System.out.println("Block status for user " + mobile + ": " + isBlocked);
		return isBlocked;
	}

	public int getOtpAttemptsFromCache(String mobile) {
		int attempts = otpAttempts.getOrDefault(mobile, 0);
		System.out.println("OTP attempts for user " + mobile + ": " + attempts);
		return attempts;
	}

	public JsonNode getVendorCredentials(String vendorName) {
		if (apiConfigRepository == null) {
			return null;
		}
		try {
			ApiConfigEntity apiConfig = apiConfigRepository.findByService("payment_gateway");
			if (apiConfig != null && apiConfig.getCredentials() != null) {
				System.out.println("Fetched credentials for vendor: " + vendorName);
				return apiConfig.getCredentials();
			}
		} catch (Exception e) {
			System.out.println("Error fetching vendor credentials: " + e.getMessage());
		}
		return null;
	}

	public void saveOrUpdateLocation(Integer deliveryId, Double lat, Double lng) {
		System.out.println("📍 Location cached for delivery " + deliveryId);
	}

	public Map<String, Object> getLocation(Integer deliveryId) {
		return null;
	}

	public Long incrementVendorPendingTxn(Integer vendorId) {
		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		System.out.println("VendorId: " + vendorId + " | Time (IST): " + now);
		return 1L;
	}

	public Long getVendorPendingTxnCount(Integer vendorId) {
		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		System.out.println("VendorId: " + vendorId + " | Current TXN Count: 0 | Time: " + now);
		return 0L;
	}

	public void addKitchenPendingOrder(Map<String, Object> orderData) {
		System.out.println("Order cached: " + orderData);
	}

	public List<Map<String, Object>> getAllKitchenPendingOrders() {
		return new ArrayList<>();
	}

	public void removeKitchenOrderByOrderId(Long orderId) {
		System.out.println("Order removed: " + orderId);
	}
}
