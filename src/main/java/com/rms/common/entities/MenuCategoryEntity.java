package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "menu_category")
public class MenuCategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt"})
    private UsersEntity restaurantId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",  "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt"})
    private UsersEntity branchId;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "is_active")
    private Boolean isActive ;

    @Column(name = "is_deleted")
    private Boolean isDeleted ;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "drive_icon_url")
    private String driveIconUrl;

    @Column(name = "tax_percentage")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal taxPercentage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
    	 if (this.isActive == null) this.isActive = true;
    	 if (this.isDeleted == null) this.isDeleted = false;
        if (this.taxPercentage == null)
            this.taxPercentage = BigDecimal.valueOf(0.00);
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now(); 
     // ✅ Soft delete default
        if (this.isDeleted == null)
            this.isDeleted = false;   // 0 = active, 1 = deleted
    }
}
