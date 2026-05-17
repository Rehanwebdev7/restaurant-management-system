package com.rms.common.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONTokener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.UsersEntity;

@Component
public final class TokenUtil {

//    @Autowired
//    private UsersRepository usersRepository;

	private static final ThreadLocal<JSONObject> currentTokenData = new ThreadLocal<>();
	private static final ThreadLocal<String> currentDecryptedToken = new ThreadLocal<>();

	// ========== TOKEN DECRYPT + STORE ==========
//    public JSONObject decryptAndStoreToken(String encryptedToken) throws Exception {
//
//        currentDecryptedToken = AES256Util.decrypt(encryptedToken);
//
//        Object decryptedData = new JSONTokener(currentDecryptedToken).nextValue();
//
//        currentTokenData =
//                (decryptedData instanceof JSONArray)
//                        ? ((JSONArray) decryptedData).getJSONObject(0)
//                        : (JSONObject) decryptedData;
//
//        return currentTokenData;
//    }

	private Object get(String key) {
		JSONObject data = currentTokenData.get();
		if (data == null) {
			throw new IllegalStateException("Token not decrypted yet.");
		}
		return data.has(key) ? data.get(key) : null;
	}

	public Integer getCurrentUserId() {
		return (Integer) get("id");
	}

	public Integer getPatentId() {
		return (Integer) get("parentId");
	}

	public String getCurrentUserMobile() {
		return get("mobile") + "";
	}

	public String getCurrentUserType() {
		return get("userType") + "";
	}

	public String getPassword() {
		return get("password") + "";
	}

	public Integer getBranchId() {
		return (Integer) get("branchId");
	}

	public Long getTimestamp() {
		return Long.valueOf(get("timestamp") + "");
	}

	public void clearTokenData() {
		currentTokenData.remove();
		currentDecryptedToken.remove();
	}

	public boolean isTokenDataAvailable() {
		return currentTokenData.get() != null;
	}

	public JSONObject decryptAndStoreToken(String encryptedToken) throws Exception {

		System.out.println("====== TOKEN DECRYPT START ======");
		System.out.println("Encrypted Token : " + encryptedToken);

		String decrypted = AES256Util.decrypt(encryptedToken);
		currentDecryptedToken.set(decrypted);

		System.out.println("Decrypted Token String : " + decrypted);

		Object decryptedData = new JSONTokener(decrypted).nextValue();

		JSONObject tokenData;
		if (decryptedData instanceof JSONArray) {
			System.out.println("Token JSON Type : JSONArray");
			tokenData = ((JSONArray) decryptedData).getJSONObject(0);
		} else {
			System.out.println("Token JSON Type : JSONObject");
			tokenData = (JSONObject) decryptedData;
		}
		currentTokenData.set(tokenData);

		System.out.println("Parsed Token Data : " + tokenData.toString());
		System.out.println("====== TOKEN DECRYPT END ======");

		return tokenData;
	}

	// ========== CREATE SESSION TOKEN (NO HIERARCHY) ==========
	public JSONObject createSessionTokenPayload(UsersEntity userEntity, Map<String, Object> additionalFields) {

		long nowTs = UnixTimestampExample.getCurrentTimestamp();

		JSONObject payload = new JSONObject();

		payload.put("id", safe(userEntity.getId()));
		payload.put("mobile", safe(userEntity.getMobile()));
		payload.put("password", safe(userEntity.getPassword()));
		payload.put("userType", safe(userEntity.getRole() != null ? userEntity.getRole().trim().toLowerCase() : null));
//		payload.put("parentId", safe(userEntity.getParentId().getId()));
//		payload.put("branchId", safe(userEntity.getBranchId().getId()));
		payload.put("parentId",
				userEntity.getParentId() != null ? safe(userEntity.getParentId().getId()) : JSONObject.NULL);

		payload.put("branchId",
				userEntity.getBranchId() != null ? safe(userEntity.getBranchId().getId()) : JSONObject.NULL);

		payload.put("timestamp", nowTs);

		// Extra dynamic fields add karo (OTP, flags, etc)
		if (additionalFields != null) {
			for (Map.Entry<String, Object> entry : additionalFields.entrySet()) {
				payload.put(entry.getKey(), entry.getValue());
			}
		}

		return payload;
	}

//    ******************************* customer ***************************
	public JSONObject createSessionTokenPayloadCustomer(CustomersEntity customersEntity,
			Map<String, Object> additionalFields) {

		long nowTs = UnixTimestampExample.getCurrentTimestamp();

		JSONObject payload = new JSONObject();

		payload.put("id", safe(customersEntity.getId()));
		payload.put("mobile", safe(customersEntity.getMobileNumber()));
		payload.put("password", safe(customersEntity.getPassword()));
		payload.put("userType", safe("customer"));
		payload.put("parentId", safe(customersEntity.getUserId().getId()));
//		payload.put("branchId", safe(userEntity.getBranchId().getId()));
		payload.put("timestamp", nowTs);

// Extra dynamic fields add karo (OTP, flags, etc)
		if (additionalFields != null) {
			for (Map.Entry<String, Object> entry : additionalFields.entrySet()) {
				payload.put(entry.getKey(), entry.getValue());
			}
		}

		return payload;
	}
//    **********************************************

	private Object safe(Object v) {
		return v != null ? v : JSONObject.NULL;
	}

	// ========== ENCRYPT TOKEN ==========
	public String encryptTokenPayload(JSONObject payload) throws Exception {
		String jsonPayload = payload.toString();
		return AES256Util.encrypt(jsonPayload).toUpperCase();
	}

	// One-shot helper
	public String createAndEncryptSessionToken(UsersEntity userEntity, Map<String, Object> additionalFields)
			throws Exception {
		JSONObject payload = createSessionTokenPayload(userEntity, additionalFields);
		return encryptTokenPayload(payload);
	}

	public JSONObject createSessionTokenPayload(Optional<UsersEntity> user, Object additionalFields) {
		// TODO Auto-generated method stub
		return null;
	}
}
