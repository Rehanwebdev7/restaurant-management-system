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
@Table(name = "delivery_zones")
public class DeliveryZonesEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role","restaurantId",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt"})
    private UsersEntity branchId;

    @Column(name = "zone_name")
    private String zoneName;

    @Column(name = "description")
    private String description;



    @Column(name = "radius_km_from")
//    @Digits(integer = 38, fraction = 2)
    private Double radiusKmFrom;
    
    @Column(name = "radius_km_to")
//    @Digits(integer = 38, fraction = 2)
    private Double radiusKmTo;

    @Column(name = "delivery_charge")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal deliveryCharge;

    @Column(name = "free_delivery_above")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal freeDeliveryAbove;

    @Column(name = "delivery_time_minutes")
    private Integer deliveryTimeMinutes;

    @Column(name = "is_active")
    private Boolean isActive ;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
    	 if (this.isActive == null) this.isActive = true;
//        if (this.latitude == null)
//            this.latitude = BigDecimal.valueOf(0.00);
//        if (this.longitude == null)
//            this.longitude = BigDecimal.valueOf(0.00);
//        if (this.radiusKm == null)
//            this.radiusKm = BigDecimal.valueOf(0.00);
        if (this.deliveryCharge == null)
            this.deliveryCharge = BigDecimal.valueOf(0.00);
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
    }
}
