package com.rms.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

@Entity 
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "wallet_transactions")
public class WalletTransactionsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer id;

	@Size(max = 255)
	@Column(name = "mode")
	private Integer mode;

	@Digits(integer = 38, fraction = 2)
	@Column(name = "op_bal")
	private BigDecimal opBal;

	@Digits(integer = 38, fraction = 2)
	@Column(name = "amount")
	private BigDecimal amount;

	@Digits(integer = 38, fraction = 2)
	@Column(name = "closing_bal")
	private BigDecimal closingBal;

//    @Column(name = "user_id")
//    private Integer userId;
	@ManyToOne
	@JoinColumn(name = "user_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "restaurantId", "branchId",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity userId;

	@ManyToOne
	@JoinColumn(name = "order_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer" })
	private OrdersEntity orderId;

	@Size(max = 255)
	@Column(name = "bank_ref_id")
	private String bankRefId;
	
	@ManyToOne
	@JoinColumn(name = "bank_detail_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer" })
	private BankDetailsEntity bankDetailId;

	@ManyToOne
	@JoinColumn(name = "customer_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "photoUrl", "dateOfBirth", "isActive",
			"createdAt", "userId", "isDeleted", "updatedAt" })
	private CustomersEntity customerId;

	@Size(max = 255)
	@Column(name = "message", columnDefinition = "Text")
	private String message;

	@Size(max = 255)
	@Column(name = "status")
	private String status;

	@Column(name = "date")
	private LocalDate date;

	@Column(name = "time")
	private LocalTime time;

	@PrePersist
	protected void onCreate() {
		ZoneId zoneId = ZoneId.of("Asia/Kolkata");
		ZonedDateTime now = ZonedDateTime.now(zoneId);

		this.date = LocalDate.now();
		this.time = now.toLocalTime(); // LocalTime
	}
}
