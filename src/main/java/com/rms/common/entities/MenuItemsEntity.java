package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ThreadLocalRandom;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "menu_items")
public class MenuItemsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

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

	@Column(name = "is_active")
	private Boolean isActive = false;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "menu_category_id")
	@JsonIgnoreProperties({ "restaurantId", "branchId", "description", "priority", "isActive", "isDeleted",
			"iconUrl", "taxPercentage", "createdAt", "updatedAt" })
	private MenuCategoryEntity menuCategoryId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "menu_subcategory_id")
	@JsonIgnoreProperties({  "description", "menuCategoryId", "restaurantId", "branchId", "isActive", "iconUrl",
			"isDeleted", "createdAt", "updatedAt" })
	private MenuSubcategoryEntity menuSubcategoryId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "addons_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "description", "restaurantId",
			"minAddon", "maxAddon", "isMultiple", "showOnline", "showInCaptain", "isActive", "createdAt", "updatedAt" })
	private AddonsEntity addonsId;

	@Column(name = "name")
	private String name;

	@Column(name = "description")
	private String description;

	@Column(name = "price")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal price;

	@Column(name = "mrp")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal mrp;

	@Column(name = "half_price")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal halfPrice;

	@Column(name = "half_mrp")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal halfMrp;

	@Column(name = "qtr_price")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal qtrPrice;

	@Column(name = "qtr_mrp")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal qtrMrp;

	@Column(name = "cost_price")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal costPrice;

	@Column(name = "dietary_type")
	private Boolean dietaryType;

	@Column(name = "is_available")
	private Boolean isAvailable;

	@Column(name = "available_online")
	private Boolean availableOnline;

	@Column(name = "image_url")
	private String imageUrl;

	@Column(name = "drive_image_url")
	private String driveImageUrl;

	@Column(name = "preparation_minutes")
	private Integer preparationMinutes;

	@Column(name = "delivery_minutes")
	private Integer deliveryMinutes;

	@Column(name = "is_recommended")
	private Boolean isRecommended;

	@Column(name = "spice_level")
	private String spiceLevel;

	@Column(name = "gst_percentage")
	@Digits(integer = 5, fraction = 2)
	private BigDecimal gstPercentage;

	/** INCLUSIVE or EXCLUSIVE — determines how GST is applied to the item price */
	@Column(name = "gst_type", length = 10)
	private String gstType;

	@Column(name = "priority")
	private Integer priority;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "is_deleted")
	private Boolean isDeleted;

	/** System-assigned default rating (4.0–5.0), set once on creation */
	@Column(name = "system_rating", precision = 3, scale = 2)
	private BigDecimal systemRating;

	/** Running average of all customer ratings */
	@Column(name = "average_rating", precision = 3, scale = 2)
	private BigDecimal averageRating;

	/** Total number of customer ratings received */
	@Column(name = "rating_count")
	private Integer ratingCount = 0;

	/**
	 * Effective rating exposed to clients:
	 * returns customer average when at least one rating exists,
	 * otherwise falls back to the system-generated default.
	 */
	@JsonProperty("rating")
	public BigDecimal getRating() {
		if (ratingCount != null && ratingCount > 0 && averageRating != null) {
			return averageRating.setScale(1, RoundingMode.HALF_UP);
		}
		return systemRating != null ? systemRating : BigDecimal.valueOf(4.5);
	}

	@PrePersist
	protected void onCreate() {
		if (this.price == null)
			this.price = BigDecimal.valueOf(0.00);
		if (this.mrp == null)
			this.mrp = BigDecimal.valueOf(0.00);
		if (this.costPrice == null)
			this.costPrice = BigDecimal.valueOf(0.00);
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
		if (this.isActive == null)
			this.isActive = true;
		if (this.isAvailable == null)
			this.isAvailable = true;
		if (this.isRecommended == null)
			this.isRecommended = false;
		if (this.isDeleted == null)
			this.isDeleted = false;

		// ✅ Soft delete default
		if (this.isDeleted == null)
			this.isDeleted = false;

		// Generate system rating once: random value in [4.0, 5.0]
		if (this.systemRating == null) {
			double rand = 4.0 + ThreadLocalRandom.current().nextDouble() * 1.0;
			this.systemRating = BigDecimal.valueOf(rand).setScale(1, RoundingMode.HALF_UP);
		}
		if (this.ratingCount == null)
			this.ratingCount = 0;
	}
}
