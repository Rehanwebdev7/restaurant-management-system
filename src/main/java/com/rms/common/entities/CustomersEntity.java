package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customers")
public class CustomersEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "email")
    private String email;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "password")
    private String password;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "drive_photo_url", columnDefinition = "TEXT")
    private String drivePhotoUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "is_active")
    private Boolean isActive;

    
    @Column(name = "is_first_order")
    private Boolean isFirstOrder;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler",
            "password",
            "parentId",
            "branchId",
            "isActive",
            "isDeleted",
            "lastLogin",
            "lastLoginAt",
            "createdAt",
            "updatedAt",
            "approvalStatus",
            "approvalNotes",
            "balance",
            "outstandingBalance",
            "isOrderStopped",
            "orderStoppedAt",
            "orderStoppedBy",
            "acceptsTakeaway",
            "acceptsDelivery",
            "acceptsDineInReserve",
            "acceptsDineInNow",
            "dineInProximityMeters",
            "tableReservationAdvanceAmount"
    })
    private UsersEntity userId;

    @Column(name = "is_deleted")
    private Integer isDeleted;
    
    @Size(max = 255)
	@Column(name = "allow_cod")
	private Boolean allowCod;

    @Column(name = "referal_code", unique = true)
    private String referalCode;

    @Column(name = "referred_by_id")
    private Long referredById;

    @Digits(integer = 10, fraction = 2)
    @Column(name = "wallet_balance")
    private BigDecimal walletBalance;

    @Digits(integer = 10, fraction = 2)
    @Column(name = "referral_signup_bonus")
    private BigDecimal referralSignupBonus;

    @Digits(integer = 10, fraction = 2)
    @Column(name = "referral_recurring_bonus")
    private BigDecimal referralRecurringBonus;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
    	 if (this.isActive == null) this.isActive = true;
        if (this.dateOfBirth == null)
            this.dateOfBirth = LocalDate.now();
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.isFirstOrder == null)
            this.isFirstOrder = true;
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
