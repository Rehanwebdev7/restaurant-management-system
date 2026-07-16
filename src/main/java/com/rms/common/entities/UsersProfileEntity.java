package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Restaurant / branch operational profile record.
 *
 * As of 2026-07-16 schema refactor: this table holds ONLY operational
 * back-office data (address+geo, licence docs, timezone/currency, booking
 * policy, alternate phone). All branding / legal / contact identity fields
 * (colors, logo, business name, GST, phone, social) live in
 * `business_settings` as the sole source of truth. See
 * `AdmBusinessSettingService` + `CustBrandingController` for the customer-
 * facing storefront path.
 *
 * Historical duplicate columns removed in Phase 3:
 *   restaurant_name, gst_number, gst_url, drive_gst_url,
 *   logo_url, drive_logo_url, fevicon_url, drive_fevicon_url,
 *   website, phone, primarys, secondary, tertiary, font_colour, font_name,
 *   pncode, social_media_details.
 * DB columns dropped in Phase 4 migration after observation window.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users_profile")
public class UsersProfileEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "restaurant_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "userId", "password", "dateOfBirth", "photoUrl",
			"updatedAt", "isDeleted", "isActive", "createdAt", "parentId" })
	private UsersEntity restaurantId;

	// ---------- LICENCE / DOCUMENTS (unique to operational profile) ----------

	@Column(name = "licence_url")
	private String licenceUrl;

	@Column(name = "drive_licence_url")
	private String driveLicenceUrl;

	@Column(name = "other_doc_url")
	private String otherDocUrl;

	@Column(name = "drive_other_doc_url")
	private String driveOtherDocUrl;

	// ---------- ADDRESS (structured) ----------

	@Column(name = "address")
	private String address;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "city_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private CitiesEntity cityId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "state_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private StatesEntity stateId;

	@Column(name = "country")
	private String country;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "pincode_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private PincodesEntity pincodeId;

	// ---------- GEO (delivery zone geofence) ----------

	@Column(name = "latitude")
	private Double latitude;

	@Column(name = "longitude")
	private Double longitude;

	// ---------- LOCALE (used by orders + bookings) ----------

	@Column(name = "timezone")
	private String timezone;

	@Column(name = "currency_code")
	private String currencyCode;

	// ---------- CONTACT BACKUP ----------

	@Column(name = "alternate_phone")
	private String alternatePhone;

	// ---------- INTERNAL / MISC ----------

	@Column(name = "description")
	private String description;

	@Column(name = "screen")
	private String screen;

	@Column(name = "is_active")
	private Boolean isActive;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	// ---------- BOOKING POLICY (table reservation config) ----------

	@Column(name = "booking_buffer_minutes")
	private String bookingBufferMinutes;

	@Column(name = "booking_grace_minutes")
	private String bookingGraceMinutes;

	@Column(name = "booking_payment_required")
	private Boolean bookingPaymentRequired;

	@Column(name = "booking_payment_amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal bookingPaymentAmount;

	@PrePersist
	protected void onCreate() {
		if (this.isActive == null)
			this.isActive = true;
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
		if (this.updatedAt == null)
			this.updatedAt = LocalDateTime.now();
	}
}
