package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.List;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "bank_details")
public class BankDetailsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "user_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
			"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
			"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
			"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
			"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
			"retServiceMargin", "branchId" })
	private UsersEntity userId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customer_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "password", "photoUrl", "dateOfBirth", "isActive",
			"isFirstOrder", "createdAt", "updatedAt", "isDeleted", "allowCod", "referalCode", "referredById",
			"walletBalance" })
	private CustomersEntity customerId;

	@Column(name = "account_number")
	private String accountNumber;

	@Column(name = "ifsc_code")
	private String ifscCode;

	@Column(name = "upi")
	private String upi;

	@Column(name = "status")
	private String status;

	@Column(name = "name")
	@JsonAlias("name")
	@JsonProperty("bankName")
	private String name;

	@Column(name = "is_delete")
	private String isDelete;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

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

	@PrePersist
	protected void onCreate() {
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();

		if (this.status == null)
			this.status = "pending";
	}

	@PreUpdate
	protected void onUpdate() {
		if (this.updatedAt == null)
			this.updatedAt = LocalDateTime.now();
	}
}
