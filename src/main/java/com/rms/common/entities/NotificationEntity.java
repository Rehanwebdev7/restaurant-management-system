package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "notifications")
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    @Column(name = "title")
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "type")
    private String type; // ORDER, PROMO

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
    }
}
