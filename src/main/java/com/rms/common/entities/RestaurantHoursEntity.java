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
@Table(name = "restaurant_hours")
public class RestaurantHoursEntity {

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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt"})
    private UsersEntity branchId;

    @Column(name = "day_of_week")
    private String dayOfWeek;

    @Column(name = "special_date")
    private LocalDate specialDate;

    @Column(name = "occasion_name")
    private String occasionName;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Column(name = "is_closed")
    private Boolean isClosed;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
    	 if (this.isClosed == null) this.isClosed = false;
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
