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
@Table(name = "users")
public class UsersEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "email")
    private String email;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "password")
    private String password;

    @Column(name = "role")
    private String role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UsersEntity parentId;

    @Column(name = "is_active")
    private Boolean isActive ;

    @Column(name = "is_deleted")
    private Boolean isDeleted ;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UsersEntity branchId;

    @Column(name = "approval_status")
    private String approvalStatus;

    @Column(name = "approval_notes")
    private String approvalNotes;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "pincode")
    private String pincode;

	@Digits(integer = 10, fraction = 2)
	@Column(name = "balance")
	private BigDecimal balance;
	
	@Digits(integer = 10, fraction = 2)
	@Column(name = "outstanding_balance")
	private BigDecimal outstandingBalance;

    @Column(name = "is_order_stopped", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isOrderStopped = false;

    @Column(name = "order_stopped_at")
    private LocalDateTime orderStoppedAt;

    @Column(name = "order_stopped_by")
    private String orderStoppedBy;

    @PrePersist
    protected void onCreate() {
    	 if (this.isActive == null) this.isActive = true;
    	 if (this.isDeleted == null) this.isDeleted = false;
    	 if (this.isOrderStopped == null) this.isOrderStopped = false;
        if (this.lastLogin == null)
            this.lastLogin = LocalDateTime.now();
        if (this.lastLoginAt == null)
            this.lastLoginAt = LocalDateTime.now();
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
