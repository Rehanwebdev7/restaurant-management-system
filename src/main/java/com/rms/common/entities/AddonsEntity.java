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
@Table(name = "addons")
public class AddonsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@Column(name = "name")
	private String name;

	@Column(name = "description")
	private String description;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "restaurant_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "parentId", "isActive",
			"isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity restaurantId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "branch_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role", "parentId", "isActive",
			"isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt" })
	private UsersEntity branchId;

	@Column(name = "min_addon")
	private Integer minAddon;

	@Column(name = "max_addon")
	private Integer maxAddon;

	@Column(name = "is_multiple")
	private Boolean isMultiple ;

	@Column(name = "show_online")
	private Boolean showOnline ;

	@Column(name = "show_in_captain")
	private Boolean showInCaptain ;

	@Column(name = "is_active")
	private Boolean isActive;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {

	    if (this.isMultiple == null) this.isMultiple = false;
	    if (this.showOnline == null) this.showOnline = false;
	    if (this.showInCaptain == null) this.showInCaptain = false;

	    if (this.createdAt == null) this.createdAt = LocalDateTime.now();
	    if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
	}

}
