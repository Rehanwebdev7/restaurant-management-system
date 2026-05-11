package com.rms.common.entities;

import jakarta.persistence.*;

import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

//@JsonPropertyOrder({
//    "id",
//    "addonsId",
//    "name",
//    "price",
//    "attribute",
//    "isActive",
//    "createdAt",
//    "updatedAt"
//})

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "addons_items")
public class AddonsItemsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "addons_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler","description", 
			"isMultiple", "showOnline", "showInCaptain" ,"restaurantId" ,"branchId"})
	private AddonsEntity addonsId;

	@Column(name = "name")
	private String name;

	@Column(name = "price")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal price;

	@Column(name = "attribute")
	private String attribute;

	@Column(name = "is_active")
	private Boolean isActive ;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		 if (this.isActive == null) this.isActive = true;
		if (this.price == null)
			this.price = BigDecimal.valueOf(0.00);
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
		if (this.updatedAt == null)
			this.updatedAt = LocalDateTime.now();
	}
}
