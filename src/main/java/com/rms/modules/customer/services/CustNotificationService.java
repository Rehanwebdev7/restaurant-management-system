package com.rms.modules.customer.services;

import com.rms.common.entities.NotificationEntity;
import com.rms.common.repositories.NotificationRepository;
import com.rms.common.util.AES256Util;
import com.rms.configuration.Authorization;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CustNotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    private Long getCustomerIdFromToken(String token) throws Exception {
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        return tokenData.getLong("id");
    }

    public Map<String, Object> getNotifications(String token, Integer pageNumber, Integer pageSize) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<NotificationEntity> page = notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    public long getUnreadCount(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);
        return notificationRepository.countByCustomerIdAndIsReadFalse(customerId);
    }

    public String markAsRead(String token, Long notificationId) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getCustomerId().equals(customerId)) {
            throw new SecurityException("Unauthorized");
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
        return "Marked as read";
    }

    public String markAllAsRead(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        List<NotificationEntity> unread = notificationRepository
                .findByCustomerIdAndIsReadFalseOrderByCreatedAtDesc(customerId);

        LocalDateTime now = LocalDateTime.now();
        for (NotificationEntity n : unread) {
            n.setIsRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
        return "All marked as read";
    }
}
