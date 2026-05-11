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
@Table(name = "order_addons_items")
public class OrderAddonsItemsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@Column(name = "name")
	private String name;

	@Column(name = "quantity")
	private String quantity;

	@Column(name = "price")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal price;

//    @Column(name = "order_item_id")
//    private Long orderItemId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "order_item_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "orderId", "menuItemId", "quantity", "addonsTotal",
			"specialInstructions", "itemTotal", "status", "addonItems", "kitchenId", "createdAt", "updatedAt" })
	private OrderItemsEntity orderItemId;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		if (this.price == null)
			this.price = BigDecimal.valueOf(0.00);
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
	}
}
