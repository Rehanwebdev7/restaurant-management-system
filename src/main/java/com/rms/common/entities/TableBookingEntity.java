package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.List;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "table_booking")
public class TableBookingEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "table_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "parentId", "isActive",
			"isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private DiningTablesEntity tableId;

	@Column(name = "status")
	private String status;

	@Column(name = "booking_date")
	private LocalDate bookingDate;

	@Column(name = "booking_time")
	private LocalTime bookingTime;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "users_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "parentId", "restaurantId",
			"branchId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity usersId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customer_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "photoUrl", "dateOfBirth", "isActive",
			"createdAt", "userId", "isDeleted", "updatedAt" })
	private CustomersEntity customerId;

	@Column(name = "payment_status")
	private String paymentStatus;

	@Column(name = "amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal amount;

	// 🔹 PRE-PERSIST LOGIC
	@PrePersist
	protected void onCreate() {
	    ZoneId kolkataZone = ZoneId.of("Asia/Kolkata");

	    if (this.bookingDate == null) {
	        this.bookingDate = LocalDate.now(kolkataZone);
	    }

	    if (this.bookingTime == null) {
	        this.bookingTime = LocalTime.now(kolkataZone)
	                .withSecond(0)
	                .withNano(0);
	    }
	}
}