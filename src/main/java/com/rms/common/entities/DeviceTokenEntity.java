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
@Table(name = "device_token")
public class DeviceTokenEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@Column(name = "platform")
	private String platform;

	@Column(name = "token")
	private String token;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "users_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "parentId", "isActive",
			"isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity userstId;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "customers_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "parentId", "isActive",
			"isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private CustomersEntity customersId;
	

}
