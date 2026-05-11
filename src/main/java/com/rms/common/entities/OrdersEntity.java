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
@Table(name = "orders")
public class OrdersEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "restaurant_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId"})
	private UsersEntity restaurantId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "dining_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "capacity", "restaurantId", "branchId",
			"tableNumber", "sectionId", "capacity", "qrCode", "isDeleted", "createdAt", "updatedAt" })
	private UsersEntity diningtId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "captain_id")
	@JsonIgnoreProperties({"hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId" })
	private UsersEntity captainId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "kitchen_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId" })
	private UsersEntity kitchenId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "branch_id")
	@JsonIgnoreProperties({"hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId"})
	private UsersEntity branchId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "delivery_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId"})
	private UsersEntity deliveryId;

	@Column(name = "order_number", unique = true)
	private String orderNumber;

	@Column(name = "order_type")
	private String orderType;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customer_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "photoUrl", "dateOfBirth", "isActive",
			"createdAt", "userId", "isDeleted", "updatedAt" })
	private CustomersEntity customerId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "cashier_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId"})
	private UsersEntity cashierId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "section_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "restaurantId", "branchId", "type", "taxPercentage",
			"serviceChargePercentage" })
	private SectionEntity sectionId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customer_delivery_addresses_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler",
			 "landmark", "deliveryInstructions", "isDefault", "isActive" })
	private CustomerDeliveryAddressesEntity customerDeliveryAddressesId;

	@Column(name = "table_number")
	private String tableNumber;

	@Column(name = "status")
	private String status;
	
	@Column(name = "coupon_code")
	private String couponCode;

	@Column(name = "payment_status")
	private String paymentStatus;

	@Column(name = "payment_method")
	private String paymentMethod;

	@Column(name = "payment_remarks", columnDefinition = "Text")
	private String paymentRemarks;

	@Column(name = "subtotal")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal subtotal;

	@Column(name = "tax_amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal taxAmount;

	
	@Column(name = "ser_charge_amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal serChargeAmount;
	
	@Column(name = "discount_amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal discountAmount;

	@Column(name = "delivery_fee")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal deliveryFee;

	@Column(name = "total_amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal totalAmount;

	@Column(name = "wallet_amount_used")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal walletAmountUsed;

	@Column(name = "special_instructions")
	private String specialInstructions;

	@Column(name = "estimated_time")
	private Integer estimatedTime;

	@Column(name = "created_at")
	private LocalDateTime createdAt;
	
	@Column(name = "kitchen_accept_at")
	private LocalDateTime kitchenAcceptAt;
	
	@Column(name = "kitchen_ready_at")
	private LocalDateTime kitchenReadyAt;
	
	@Column(name = "delivery_accept_at")
	private LocalDateTime deliveryAcceptAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@Column(name = "customer_name")
	private String customerName;

	@Column(name = "customer_phone")
	private String customerPhone;

	@Column(name = "customer_email")
	private String customerEmail;

	@Column(name = "bank_ref_num")
	private String bankRefNum;

	@Column(name = "api_ref_num")
	private String apiRefNum;
	
	@Column(name = "customer_feedback", columnDefinition = "Text")
	private String customerFeedback;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "payment_gateway_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "addressType", "addressLine1", "addressLine2",
			"latitude", "longitude", "landmark", "deliveryInstructions", "isDefault", "isActive" })
	private PaymentGatewayEntity paymentGatewayId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "table_booking_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "capacity", "restaurantId", "branchId",
			"tableNumber", "sectionId", "capacity", "qrCode", "isDeleted", "createdAt", "updatedAt" })
	private TableBookingEntity tableBookingId;
	
	@Column(name = "delivery_status")
	private String deliveryStatus;
	
	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	@OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, orphanRemoval = true)
//	@JsonIgnore
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" ,"orderId","kitchenId",})	
	private List<OrderItemsEntity> orderItems;

	@PrePersist
	protected void onCreate() {
		if (this.subtotal == null)
			this.subtotal = BigDecimal.valueOf(0.00);
		if (this.taxAmount == null)
			this.taxAmount = BigDecimal.valueOf(0.00);
		if (this.discountAmount == null)
			this.discountAmount = BigDecimal.valueOf(0.00);
		if (this.deliveryFee == null)
			this.deliveryFee = BigDecimal.valueOf(0.00);
		if (this.totalAmount == null)
			this.totalAmount = BigDecimal.valueOf(0.00);
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
//        if (this.updatedAt == null)
//            this.updatedAt = LocalDateTime.now();
		if (this.completedAt == null)
			this.completedAt = LocalDateTime.now();
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

}
