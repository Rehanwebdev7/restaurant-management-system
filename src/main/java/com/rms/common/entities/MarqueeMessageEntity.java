package com.rms.common.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "marquee_messages")
public class MarqueeMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    @JsonIgnoreProperties({"password", "parentId", "branchId", "approvalStatus", "approvalNotes",
        "hospitalName", "hospitalType", "hospitalCode", "gstNumber", "city", "state", "pincode",
        "balance", "outstandingBalance", "lastLogin", "lastLoginAt", "isDeleted", "createdAt", "updatedAt"})
    private UsersEntity restaurantId;

    @Column(name = "message", length = 500, nullable = false)
    private String message;

    @Column(name = "bg_color", length = 20)
    private String bgColor;

    @Column(name = "text_color", length = 20)
    private String textColor;

    @Column(name = "speed")
    private Integer speed;

    @Column(name = "font_weight", length = 10)
    private String fontWeight;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "schedule_start")
    private LocalDateTime scheduleStart;

    @Column(name = "schedule_end")
    private LocalDateTime scheduleEnd;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (displayOrder == null) displayOrder = 0;
        if (speed == null) speed = 30;
        if (bgColor == null) bgColor = "#1a1a2e";
        if (textColor == null) textColor = "#ffffff";
        if (fontWeight == null) fontWeight = "500";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
