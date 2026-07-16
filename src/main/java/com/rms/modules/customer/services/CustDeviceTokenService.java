package com.rms.modules.customer.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.DeviceTokenEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.DeviceTokenRepository;
import com.rms.common.util.AES256Util;
import com.rms.configuration.Authorization;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Customer-scoped FCM device token registration (Batch 5).
 *
 * Ties an FCM push token to the signed-in customer so order-status
 * notifications and promo pings can be fanned out to their phone(s).
 */
@Service
public class CustDeviceTokenService {

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    @Autowired
    private CustomersRepository customersRepository;

    private Long getCustomerIdFromToken(String token) throws Exception {
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        return tokenData.getLong("id");
    }

    /**
     * Register (or refresh) a device token for the signed-in customer.
     * De-dupes on (customerId, token) so refreshing the FCM token
     * doesn't create duplicate rows.
     */
    public DeviceTokenEntity register(String authToken, String fcmToken, String platform) throws Exception {
        Authorization.authorizeCustomer(authToken);
        if (fcmToken == null || fcmToken.trim().isEmpty()) {
            throw new RuntimeException("FCM token is required");
        }
        Long customerId = getCustomerIdFromToken(authToken);
        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        DeviceTokenEntity entity = deviceTokenRepository
                .findFirstByCustomersId_IdAndToken(customerId, fcmToken.trim())
                .orElseGet(() -> {
                    DeviceTokenEntity fresh = new DeviceTokenEntity();
                    fresh.setCustomersId(customer);
                    fresh.setToken(fcmToken.trim());
                    return fresh;
                });
        entity.setPlatform(platform != null && !platform.isBlank() ? platform : "web");
        return deviceTokenRepository.save(entity);
    }

    /** Remove a single device token (e.g., on logout). */
    public String unregister(String authToken, Long tokenId) throws Exception {
        Authorization.authorizeCustomer(authToken);
        Long customerId = getCustomerIdFromToken(authToken);
        DeviceTokenEntity entity = deviceTokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Device token not found"));
        if (entity.getCustomersId() == null || !customerId.equals(entity.getCustomersId().getId())) {
            throw new SecurityException("Unauthorized");
        }
        deviceTokenRepository.delete(entity);
        return "Device token unregistered";
    }

    /** List device tokens for the signed-in customer. */
    public List<DeviceTokenEntity> listMine(String authToken) throws Exception {
        Authorization.authorizeCustomer(authToken);
        Long customerId = getCustomerIdFromToken(authToken);
        return deviceTokenRepository.findByCustomersId_Id(customerId);
    }
}
