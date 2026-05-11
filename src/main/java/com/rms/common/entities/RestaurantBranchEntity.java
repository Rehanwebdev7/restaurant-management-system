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
@Table(name = "restaurant_branch")
public class RestaurantBranchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "branch_name")
    private String branchName;

//    @Column(name = "restaurant_id")
//    private Long restaurantId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UsersEntity restaurantId;

    @Column(name = "address")
    private String address;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pincode_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PincodesEntity pincodeId;

    @Column(name = "latitude")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal latitude;

    @Column(name = "longitude")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal longitude;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "is_active")
    private Boolean isActive = false;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
    	 if (this.isActive == null) this.isActive = true;
    	 if (this.isDeleted == null) this.isDeleted = false;
        if (this.latitude == null)
            this.latitude = BigDecimal.valueOf(0.00);
        if (this.longitude == null)
            this.longitude = BigDecimal.valueOf(0.00);
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
