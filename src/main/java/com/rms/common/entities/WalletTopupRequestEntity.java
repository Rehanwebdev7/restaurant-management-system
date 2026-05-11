package com.rms.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
import java.time.format.DateTimeFormatter;

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
@Table(name = "wallet_topup_request")
public class WalletTopupRequestEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer id;

	@Digits(integer = 38, fraction = 2)
	@Column(name = "amount")
	private BigDecimal amount;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "approved_by_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
			"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
			"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
			"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
			"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
			"retServiceMargin" })
	private UsersEntity approvedById;

	@Column(name = "approved_date")
	private LocalDateTime approvedDate;

	@Column(name = "date")
	private LocalDateTime date;

	@Size(max = 255)
	@Column(name = "mode")
	private Integer mode;

	@Size(max = 255)
	@Column(name = "order_id")
	private String orderId;

	@Size(max = 255)
	@Column(name = "reason")
	private String reason;

//	@Size(max = 255)
//	@Column(name = "bank_name")
//	private String bankName;

	@Column(name = "recorn")
	private Integer recorn;

	@Size(max = 255)
	@Column(name = "remark")
	private String remark;

	@Size(max = 255)
	@Column(name = "status")
	private String status;

	@Size(max = 255)
	@Column(name = "time")
	private String time;

	@Column(name = "trans_date")
	private LocalDateTime transDate;

	@Size(max = 255)
	@Column(name = "utr")
	private String utr;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "user_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "branchId", "password", "dateOfBirth", "photoUrl",
			"updatedAt", "isDeleted", "isActive", "createdAt", "parentId" })
	private UsersEntity userId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "bank_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer" })
	private BankDetailsEntity bankId;

	@Size(max = 50)
	@Column(name = "request_type")
	private String requestType; // "TOPUP" or "WITHDRAWAL"

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customer_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "photoUrl", "dateOfBirth", "isActive",
			"createdAt", "userId", "isDeleted", "updatedAt" })
	private CustomersEntity customerId;

	@PrePersist
	protected void onCreate() {
		ZonedDateTime indianTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).withNano(0);
//        this.approvedDate = LocalDate.now();
		this.date = indianTime.toLocalDateTime();
		if (this.status == null) {
			this.status = "pending";
		}
//        this.transDate = LocalDate.now();
	}

	private String generateCurrentTime(ZonedDateTime time) {
		return time.format(DateTimeFormatter.ofPattern("hh:mm a"));
	}
}
