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
@Table(name = "otp_logs")
public class OtpLogsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "identifier")
    private String identifier;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "otp_type")
    private String otpType;

    @Column(name = "type")
    private String type;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "is_used")
    private Boolean isUsed = false;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.expiresAt == null)
            this.expiresAt = LocalDateTime.now();
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.verifiedAt == null)
            this.verifiedAt = LocalDateTime.now();
        if (this.usedAt == null)
            this.usedAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
