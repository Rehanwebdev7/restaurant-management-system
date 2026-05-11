package com.rms.configuration;

import org.json.JSONObject;

import com.rms.common.util.AES256Util;
import com.rms.common.util.UnixTimestampExample;

//import com.golddekho.common.util.AES256Util;
//import com.golddekho.common.util.UnixTimestampExample;



public class Authorization {
	public static void authorizeAdmin(String token) throws Exception {
		validateUserType(token, "supadmin");
	}

	public static void authorizeSupadmin(String token) throws Exception {
		validateUserType(token, "supadmin");
	}
	
	public static void authorizeCaptain(String token) throws Exception {
		validateUserType(token, "captain");
	}
	
	public static void authorizeKitchen(String token) throws Exception {
		validateUserType(token, "kitchen");
	}
	public static void authorizeCashier(String token) throws Exception {
		validateUserTypeMultiple(token, new String[]{"cashier", "captain"});
	}
	
	public static void authorizeDelivery(String token) throws Exception {
		validateUserType(token, "delivery");
	}
	public static void authorizeRestaurant(String token) throws Exception {
		validateUserType(token, "restaurant");
	}
	public static void authorizeCustomer(String token) throws Exception {
		validateUserType(token, "customer");
	}
	public static void authorizeCustomerOrCaptain(String token) throws Exception {
		validateUserTypeMultiple(token, new String[]{"customer", "captain"});
	}
	public static void authorizeEmployee(String token) throws Exception {
		validateUserType(token, "employee");
	}
	public static void authorizeRetailer(String token) throws Exception {
		validateUserType(token, "retailer");
	}
	public static void authorizeSupport(String token) throws Exception {
		validateUserType(token, "support");
	}
	public static void authorizeTechnician(String token) throws Exception {
		validateUserType(token, "technician");
	}
	public static void authorizeFinance(String token) throws Exception {
		validateUserType(token, "finance");
	}

	public static void authorizeVendor(String token) throws Exception {
		validateUserType(token, "vendor");
	}
	public static void authorizeBranch(String token) throws Exception {
		validateUserType(token, "branch");
	}
	public static void authorizeB2b(String token) throws Exception {
		validateUserType(token, "b2b");
	}
//	authorizeB2b
//	public static void loginSession(String token) throws Exception {
//		// Step 1: Decrypt the token
//		System.out.println("Received token for decryption: " + token);
//		String decryptedToken = AES256Util.decrypt(token);
//		System.out.println("Decrypted Token: " + decryptedToken);
//
//		// Step 2: Parse the decrypted token to extract userType
//		JSONObject jsonResponse = new JSONObject(decryptedToken);
//		String userType = jsonResponse.optString("userType", null);
//		Long otpExpiryTimestamp = jsonResponse.getLong("timestamp");
//		System.out.println("Extracted userType from token: " + userType);
//		long currentTimestamp = UnixTimestampExample.getCurrentTimestamp();
//
//		System.out.println("Current Timestamp: " + currentTimestamp);
//		System.out.println("OTP Expiry Timestamp: " + otpExpiryTimestamp);
//		
//		// Step 4: Check expiration
//		if (currentTimestamp > otpExpiryTimestamp) {
//			System.out.println("Login has expired.");
//			throw new SecurityException("Login Session Has Expired");
//		}
//	}
	public static void authorizeAdminOrRestaurant(String token) throws Exception {
		validateUserTypeMultiple(token, new String[]{"supadmin", "restaurant"});
	}

	/** Allow admin/restaurant staff (supadmin, restaurant, branch, cashier). Used for tables/customer management. */
	public static void authorizeManagement(String token) throws Exception {
		validateUserTypeMultiple(token, new String[]{"supadmin", "restaurant", "branch", "cashier"});
	}

	private static void validateUserTypeMultiple(String token, String[] expectedTypes) throws Exception {
		String decryptedToken = AES256Util.decrypt(token);
		JSONObject jsonResponse = new JSONObject(decryptedToken);
		String userType = normalizeUserType(jsonResponse.optString("userType", null));
		Long otpExpiryTimestamp = jsonResponse.getLong("timestamp");
		long currentTimestamp = UnixTimestampExample.getCurrentTimestamp();

		boolean matched = false;
		for (String expected : expectedTypes) {
			if (normalizeUserType(expected).equalsIgnoreCase(userType)) {
				matched = true;
				break;
			}
		}
		if (!matched) {
			throw new SecurityException("Unauthorized Person");
		}
		if (currentTimestamp > otpExpiryTimestamp + 999999999) {
			throw new SecurityException("expired");
		}
	}

	private static void validateUserType(String token, String expectedUserType) throws Exception {
		// Step 1: Decrypt the token
		System.out.println("Received token for decryption: " + token);
		String decryptedToken = AES256Util.decrypt(token);
		System.out.println("Decrypted Token: " + decryptedToken);

		// Step 2: Parse the decrypted token to extract userType
		JSONObject jsonResponse = new JSONObject(decryptedToken);
		String userType = normalizeUserType(jsonResponse.optString("userType", null));
		Long otpExpiryTimestamp = jsonResponse.getLong("timestamp");
		System.out.println("Extracted userType from token: " + userType);
		long currentTimestamp = UnixTimestampExample.getCurrentTimestamp();

		System.out.println("Current Timestamp: " + currentTimestamp);
		System.out.println("OTP Expiry Timestamp: " + otpExpiryTimestamp);

		// Step 3: Validate userType
		if (userType == null || !userType.equalsIgnoreCase(normalizeUserType(expectedUserType))) {
			System.out.println("Unauthorized access attempt by userType: " + userType);
			throw new SecurityException("Unauthorized Person");
		}
		// Step 4: Check expiration
		if (currentTimestamp > otpExpiryTimestamp + 999999999) {
			System.out.println("Login has expired.");
			throw new SecurityException("expired");
		}
	}

	private static String normalizeUserType(String userType) {
		return userType == null ? null : userType.trim().toLowerCase();
	}

	
}
