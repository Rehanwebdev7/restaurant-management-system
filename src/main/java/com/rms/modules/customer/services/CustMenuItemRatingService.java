package com.rms.modules.customer.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.MenuItemRatingEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.MenuItemRatingRepository;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.util.AES256Util;
import com.rms.configuration.Authorization;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Customer-facing menu-item ratings + reviews (Batch 5 add).
 *
 * Uses `MenuItemRatingEntity` — table has a UNIQUE constraint on
 * (menu_item_id, mobile_number) so a customer can only leave one rating
 * per dish, updated on subsequent submits (upsert semantics).
 */
@Service
public class CustMenuItemRatingService {

    @Autowired
    private MenuItemRatingRepository ratingRepository;

    @Autowired
    private MenuItemsRepository menuItemsRepository;

    @Autowired
    private CustomersRepository customersRepository;

    private Long getCustomerIdFromToken(String token) throws Exception {
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        return tokenData.getLong("id");
    }

    /**
     * Submit or update a rating for a dish. Upserts by (itemId, mobile).
     */
    public Map<String, Object> submitRating(String token, Long itemId, Integer rating) throws Exception {
        Authorization.authorizeCustomer(token);
        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        Long customerId = getCustomerIdFromToken(token);
        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        String mobile = customer.getMobileNumber();

        MenuItemsEntity menuItem = menuItemsRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        // Upsert — one rating per (item, mobile)
        MenuItemRatingEntity entity = ratingRepository
                .findByMenuItemIdAndMobileNumber(itemId, mobile)
                .orElseGet(() -> {
                    MenuItemRatingEntity fresh = new MenuItemRatingEntity();
                    fresh.setMenuItem(menuItem);
                    fresh.setMobileNumber(mobile);
                    return fresh;
                });
        entity.setRating(rating);
        ratingRepository.save(entity);

        // Return the updated summary so client can refresh in one shot
        return getRatingSummary(itemId);
    }

    /**
     * Public rating summary for a dish — average + count.
     * No auth required; used to power dish cards on the menu.
     */
    public Map<String, Object> getRatingSummary(Long itemId) {
        Double avg = ratingRepository.findAverageRatingByMenuItemId(itemId);
        Long count = ratingRepository.countByMenuItemId(itemId);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("itemId", itemId);
        summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        summary.put("ratingCount", count != null ? count : 0L);
        return summary;
    }

    /**
     * All ratings for a dish, newest first. Public listing.
     */
    public List<MenuItemRatingEntity> getRatingsForItem(Long itemId) {
        return ratingRepository.findByMenuItemIdOrderByCreatedAtDesc(itemId);
    }
}
