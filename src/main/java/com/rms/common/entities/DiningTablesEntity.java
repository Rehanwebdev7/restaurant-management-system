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
@Table(name = "dining_tables")
public class DiningTablesEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "restaurant_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity restaurantId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "branch_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler",  "password", "role",
			"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity branchId;

	@Column(name = "table_number")
	private String tableNumber;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "section_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "name", "email", "mobile", "password", "role",
		"parentId", "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt","branchId","restaurantId" })
	private SectionEntity sectionId;

	@Column(name = "capacity")
	private Integer capacity;

	@Column(name = "status")
	private Integer status;

	@Column(name = "qr_code")
	private String qrCode;

	@Column(name = "notes")
	private String notes;

	@Column(name = "is_deleted")
	private Boolean isDeleted ;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		 if (this.isDeleted == null) this.isDeleted = false;
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
		if (this.updatedAt == null)
			this.updatedAt = LocalDateTime.now();
	}
}
