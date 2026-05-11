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
@Table(name = "customer_delivery_addresses")
public class CustomerDeliveryAddressesEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customer_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "userId", "password", "dateOfBirth", "photoUrl",
			"updatedAt", "isDeleted", "isActive", "createdAt" })
	private CustomersEntity customerId;

	@Column(name = "address_type")
	private String addressType;

	@Column(name = "address_line1")
	private String addressLine1;

	@Column(name = "address_line2")
	private String addressLine2;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "pincode_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private PincodesEntity pincodeId;

	@Column(name = "latitude")
//	@Digits(integer = 38, fraction = 2)
	private Double latitude;

	@Column(name = "longitude")
//	@Digits(integer = 38, fraction = 2)
	private Double longitude;

	@Column(name = "landmark")
	private String landmark;

	@Column(name = "delivery_instructions")
	private String deliveryInstructions;

	@Column(name = "is_default")
	private Boolean isDefault;
	
	@Column(name = "is_active")
	private Boolean isActive ;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		 if (this.isDefault == null) this.isDefault = true;
		 if (this.isActive == null) this.isActive = true;
//		if (this.latitude == null)
//			this.latitude = BigDecimal.valueOf(0.00);
		if (this.isActive == null)
			this.isActive = true;
//		if (this.longitude == null)
//			this.longitude = BigDecimal.valueOf(0.00);
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
	}
}
