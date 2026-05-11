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
@Table(name = "sliders")
public class SlidersEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@Column(name = "image_url")
	private String imageUrl;

	@Column(name = "drive_image_url")
	private String driveImageUrl;

	@Column(name = "title")
	private String title;

	@Column(name = "platform")
	private String platform;

	@Column(name = "description")
	private String description;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "restaurant_id")
//    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "userId", "password", "dateOfBirth", "photoUrl",
			"updatedAt", "isDeleted", "isActive", "createdAt", "parentId", "name", "email", "mobile", "role",
			"lastLogin", "lastLoginAt", "branchId", "balance", "outstandingBalance" })
	private UsersEntity restaurantId;

}
