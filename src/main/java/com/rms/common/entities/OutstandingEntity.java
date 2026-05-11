package com.rms.common.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "outstanding")
public class OutstandingEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer id;

	@ManyToOne
	@JoinColumn(name = "user_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "restaurantId", "branchId",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity userId;
	
	
	@ManyToOne
	@JoinColumn(name = "deduct_by_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "restaurantId", "branchId",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity deductById;

	@Column(name = "mode")
	private Integer mode;

	@Column(name = "service")
	private String service;

	@Digits(integer = 10, fraction = 2)
	@Column(name = "opening_bal", columnDefinition = "DECIMAL(12, 2) DEFAULT 0.00")
	private BigDecimal openingBal;

	@Digits(integer = 10, fraction = 2)
	@Column(name = "amount")
	private BigDecimal amount;

	@Digits(integer = 10, fraction = 2)
	@Column(name = "closing_bal", columnDefinition = "DECIMAL(12, 2) DEFAULT 0.00")
	private BigDecimal closingBal;

	@Size(max = 50)
	@Column(name = "order_id")
	private String orderId;

	@Size(max = 255)
	@Column(name = "remark")
	private String remark;

	@Column(name = "date")
	private LocalDate date;

	@Size(max = 10) // or adjust based on your requirements
	@Column(name = "time")
	private String time;

	@PrePersist
	protected void onCreate() {
		this.date = LocalDate.now();
		this.time = generateCurrentTime(); // Set the current time in AM/PM format
		System.out.println("Time set during PrePersist: " + this.time);
	}

	private String generateCurrentTime() {
		// Get current time in Asia/Kolkata time zone
		ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

		// Use a simple time format with AM/PM
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a");

		return now.format(formatter); // Return formatted time
	}

}
