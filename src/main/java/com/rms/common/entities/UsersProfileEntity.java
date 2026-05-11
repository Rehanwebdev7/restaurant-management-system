package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
//    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "userId", "password", "dateOfBirth", "photoUrl",
			"updatedAt", "isDeleted", "isActive", "createdAt", "parentId" })
	private UsersEntity restaurantId;

	@Column(name = "restaurant_name")
	private String restaurantName;

	@Column(name = "gst_number")
	private String gstNumber;

	@Column(name = "gst_url")
	private String gstUrl;

	@Column(name = "drive_gst_url")
	private String driveGstUrl;

	@Column(name = "licence_url")
	private String licenceUrl;

	@Column(name = "drive_licence_url")
	private String driveLicenceUrl;

	@Column(name = "address")
	private String address;

//    @Column(name = "city")
//    private String city;
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "city_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private CitiesEntity cityId;

//    @Column(name = "state")
//    private String state;
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

	@Column(name = "latitude")
//    @Digits(integer = 38, fraction = 2)
	private Double latitude;

	@Column(name = "longitude")
//    @Digits(integer = 38, fraction = 2)
	private Double longitude;

	@Column(name = "timezone")
	private String timezone;

	@Column(name = "currency_code")
	private String currencyCode;

	@Column(name = "logo_url")
	private String logoUrl;

	@Column(name = "drive_logo_url")
	private String driveLogoUrl;

	@Column(name = "fevicon_url")
	private String feviconUrl;

	@Column(name = "drive_fevicon_url")
	private String driveFeviconUrl;

	@Column(name = "website")
	private String website;

	@Column(name = "phone")
	private String phone;

	@Column(name = "alternate_phone")
	private String alternatePhone;

	@Column(name = "secondary")
	private String secondary;

	@Column(name = "tertiary")
	private String tertiary;

	@Column(name = "font_colour")
	private String fontColour;

	@Column(name = "font_name")
	private String fontName;

	@Column(name = "other_doc_url")
	private String otherDocUrl;

	@Column(name = "drive_other_doc_url")
	private String driveOtherDocUrl;

//    @Column(name = "opening_time")
//    private LocalTime openingTime;
//
////    @Column(name = "closing_time")
//    private LocalTime closingTime;

	@Column(name = "description")
	private String description;

	@Column(name = "is_active")
	private Boolean isActive;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@Column(name = "primarys")
	private String primarys;
	
	@Column(name = "screen")
	private String screen;
	
	@Column(name = "pncode")
	private String pncode;

	@Column(name = "booking_buffer_minutes")
	private String bookingBufferMinutes;

	@Column(name = "booking_grace_minutes")
	private String bookingGraceMinutes;

	@Column(name = "booking_payment_required")
	private Boolean bookingPaymentRequired;

	@Column(name = "booking_payment_amount")
	@Digits(integer = 38, fraction = 2)
	private BigDecimal bookingPaymentAmount;
		
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "social_media_details", columnDefinition = "json")
	private JsonNode socialMediaDetails;

	@PrePersist
	protected void onCreate() {
		if (this.isActive == null)
			this.isActive = true;
//        if (this.latitude == null)
//            this.latitude = BigDecimal.valueOf(0.00);
//        if (this.longitude == null)
//            this.longitude = BigDecimal.valueOf(0.00);
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
		if (this.updatedAt == null)
			this.updatedAt = LocalDateTime.now();
	}
}
