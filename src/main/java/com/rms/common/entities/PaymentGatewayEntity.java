//package com.rms.common.entities;
//
//public class PaymentGatewayEntity {
//
//}
package com.rms.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.rms.common.converter.JsonNodeConverter;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "payment_gateway")
public class PaymentGatewayEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer id;

	@Size(max = 255)
	@Column(name = "status")
	private Boolean status;
	
	@Size(max = 255)
	@Column(name = "allow_cod")
	private Boolean allowCod;

	@Size(max = 255)
	@Column(name = "vendorname")
	private String vendorname;

	@Column(name = "on_of")
	private String onOf;
	

	@Column(name = "title")
	private String title;
	

	@Column(name = "payment_method")
	private String paymentMethod;

	@Convert(converter = JsonNodeConverter.class)
	@Column(name = "credentials", columnDefinition = "json")
	private JsonNode credentials;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "restaurant_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "userId", "password", "dateOfBirth", "photoUrl",
		"updatedAt", "isDeleted", "isActive", "createdAt", "parentId", "role",
		"lastLogin", "lastLoginAt", "branchId", "balance", "outstandingBalance" })
	private UsersEntity restaurantId;
	
	@PrePersist
	protected void onCreate() {
		if (this.status == null)
			this.status = Boolean.TRUE;
		if (this.allowCod == null)
			this.allowCod = Boolean.TRUE;}

}