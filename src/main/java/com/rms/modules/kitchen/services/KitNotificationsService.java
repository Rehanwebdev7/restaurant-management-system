package com.rms.modules.kitchen.services;

import com.rms.common.entities.NotificationEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.NotificationRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KitNotificationsService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a, dd MMM");

    private UsersEntity resolveKitchenUser(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        tokenUtil.decryptAndStoreToken(token);
        Long id = tokenUtil.getCurrentUserId().longValue();
        tokenUtil.clearTokenData();
        return usersRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kitchen user not found"));
    }

    // ── GET: List all notifications, auto-sync from recent orders ─────────────
    @Transactional
    public Map<String, Object> getNotifications(String token) throws Exception {
        UsersEntity kitchenUser = resolveKitchenUser(token);
        Long userId = kitchenUser.getId();

        // Auto-generate notifications from orders in last 24 hours
        autoSyncOrderNotifications(kitchenUser);

        List<NotificationEntity> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> list = new ArrayList<>();
        for (NotificationEntity n : notifications) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", n.getId());
            item.put("title", n.getTitle());
            item.put("message", n.getMessage());
            item.put("type", n.getType());
            item.put("orderId", n.getOrderId());
            item.put("unread", !Boolean.TRUE.equals(n.getIsRead()));
            item.put("time", n.getCreatedAt() != null ? n.getCreatedAt().format(TIME_FMT) : "");
            item.put("createdAt", n.getCreatedAt());
            list.add(item);
        }

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("notifications", list);
        result.put("unreadCount", unreadCount);
        return result;
    }

    // Auto-create notification records for orders that don't have one yet
    private void autoSyncOrderNotifications(UsersEntity kitchenUser) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<OrdersEntity> recentOrders = ordersRepository.findByKitchenIdAndCreatedAtBetween(
                kitchenUser, since, LocalDateTime.now());

        if (recentOrders == null || recentOrders.isEmpty()) return;

        // Find order IDs that already have notifications
        List<NotificationEntity> existing =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(kitchenUser.getId());
        Set<Long> notifiedOrderIds = existing.stream()
                .filter(n -> n.getOrderId() != null)
                .map(NotificationEntity::getOrderId)
                .collect(Collectors.toSet());

        List<NotificationEntity> toCreate = new ArrayList<>();
        for (OrdersEntity order : recentOrders) {
            if (notifiedOrderIds.contains(order.getId())) continue;

            String status = order.getStatus();
            String title;
            String message;

            if ("PENDING".equalsIgnoreCase(status)) {
                title = "🔔 New Order #" + order.getOrderNumber();
                message = (order.getCustomerName() != null ? order.getCustomerName() : "Customer")
                        + " placed a " + formatType(order.getOrderType()) + " order";
            } else if ("PREPARING".equalsIgnoreCase(status)) {
                title = "⏳ Preparing #" + order.getOrderNumber();
                message = "Order is being prepared for "
                        + (order.getCustomerName() != null ? order.getCustomerName() : "customer");
            } else if ("READY".equalsIgnoreCase(status)) {
                title = "✅ Ready #" + order.getOrderNumber();
                message = "Order is ready for " + formatType(order.getOrderType());
            } else if ("DELIVERED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                title = "✔ Completed #" + order.getOrderNumber();
                message = "Order delivered to "
                        + (order.getCustomerName() != null ? order.getCustomerName() : "customer");
            } else {
                title = "Order #" + order.getOrderNumber();
                message = "Status: " + status;
            }

            NotificationEntity n = new NotificationEntity();
            n.setUserId(kitchenUser.getId());
            n.setOrderId(order.getId());
            n.setType("ORDER");
            n.setTitle(title);
            n.setMessage(message);
            n.setIsRead(false);
            n.setCreatedAt(order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now());
            toCreate.add(n);
        }

        if (!toCreate.isEmpty()) {
            notificationRepository.saveAll(toCreate);
        }
    }

    private String formatType(String type) {
        if (type == null) return "order";
        return type.replace("_", " ").toLowerCase();
    }

    // ── PUT: Mark a single notification as read ──────────────────────────────
    @Transactional
    public void markAsRead(String token, Long notificationId) throws Exception {
        UsersEntity kitchenUser = resolveKitchenUser(token);
        NotificationEntity n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!kitchenUser.getId().equals(n.getUserId())) {
            throw new SecurityException("Access denied");
        }
        n.setIsRead(true);
        n.setReadAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    // ── PUT: Mark all as read ─────────────────────────────────────────────────
    @Transactional
    public void markAllAsRead(String token) throws Exception {
        UsersEntity kitchenUser = resolveKitchenUser(token);
        List<NotificationEntity> unread =
                notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(kitchenUser.getId());
        LocalDateTime now = LocalDateTime.now();
        for (NotificationEntity n : unread) {
            n.setIsRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    // ── DELETE: Clear all notifications ──────────────────────────────────────
    @Transactional
    public void clearAll(String token) throws Exception {
        UsersEntity kitchenUser = resolveKitchenUser(token);
        List<NotificationEntity> all =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(kitchenUser.getId());
        notificationRepository.deleteAll(all);
    }
}
