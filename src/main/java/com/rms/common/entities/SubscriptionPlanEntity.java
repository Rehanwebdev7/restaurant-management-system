package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.Digits;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "subscription_plans")
public class SubscriptionPlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Digits(integer = 10, fraction = 2)
    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "max_branch")
    private Integer maxBranch;

    @Column(name = "max_kitchen")
    private Integer maxKitchen;

    @Column(name = "max_delivery_boy")
    private Integer maxDeliveryBoy;

    @Column(name = "features", columnDefinition = "TEXT")
    private String features;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.isActive == null) this.isActive = true;
        if (this.isDeleted == null) this.isDeleted = false;
        if (this.sortOrder == null) this.sortOrder = 0;
        if (this.durationDays == null) this.durationDays = 30;
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
