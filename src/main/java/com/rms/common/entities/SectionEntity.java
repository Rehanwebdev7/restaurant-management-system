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
@Table(name = "section")
public class SectionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name")
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",  "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt"})
    private UsersEntity restaurantId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt"})
    private UsersEntity branchId;

    @Column(name = "type")
    private String type;

    @Column(name = "tax_percentage")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal taxPercentage;

    @Column(name = "service_charge_percentage")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal serviceChargePercentage;
    
    @PrePersist
    protected void onCreate() {
        if (this.taxPercentage == null)
            this.taxPercentage = BigDecimal.valueOf(0.00);
    }
}
