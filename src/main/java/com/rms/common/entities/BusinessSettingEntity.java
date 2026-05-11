package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;

@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "business_settings")
public class BusinessSettingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private UsersEntity restaurantId;

    // Domain
    @Column(name = "domain_url")
    private String domainUrl;

    // Branding
    @Column(name = "theme_mode", length = 10)
    private String themeMode;

    @Column(name = "primary_color", length = 20)
    private String primaryColor;

    @Column(name = "secondary_color", length = 20)
    private String secondaryColor;

    @Column(name = "tertiary_color", length = 20)
    private String tertiaryColor;

    @Column(name = "font_color", length = 20)
    private String fontColor;

    @Column(name = "font_name", length = 50)
    private String fontName;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "drive_logo_url", length = 500)
    private String driveLogoUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "drive_favicon_url", length = 500)
    private String driveFaviconUrl;

    // Organisation
    @Column(name = "organisation_name")
    private String organisationName;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "authorised_person_name")
    private String authorisedPersonName;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    // Tax & Compliance
    @Column(name = "gst_number", length = 20)
    private String gstNumber;

    @Column(name = "gst_certificate_url", length = 500)
    private String gstCertificateUrl;

    @Column(name = "drive_gst_certificate_url", length = 500)
    private String driveGstCertificateUrl;

    @Column(name = "fssai_number", length = 20)
    private String fssaiNumber;

    @Column(name = "pan_company", length = 15)
    private String panCompany;

    @Column(name = "pan_signatory", length = 15)
    private String panSignatory;

    @Column(name = "aadhaar_number", length = 15)
    private String aadhaarNumber;

    // Contact
    @Column(name = "email")
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "whatsapp_number", length = 20)
    private String whatsappNumber;

    @Column(name = "ambulance_number", length = 20)
    private String ambulanceNumber;

    // Location
    @Column(name = "google_map_embed", columnDefinition = "TEXT")
    private String googleMapEmbed;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // Social Media (JSON)
    @Column(name = "social_media_links", columnDefinition = "TEXT")
    private String socialMediaLinks;

    // Google Rating Link
    @Column(name = "google_rating_url", length = 500)
    private String googleRatingUrl;

    // Marquee / Ticker
    @Column(name = "marquee_text", length = 500)
    private String marqueeText;

    @Column(name = "marquee_is_live")
    private Boolean marqueeIsLive;

    @Column(name = "marquee_bg_color", length = 20)
    private String marqueeBgColor;

    @Column(name = "marquee_text_color", length = 20)
    private String marqueeTextColor;

    @Column(name = "marquee_speed")
    private Integer marqueeSpeed;

    // Legal & Policy (TEXT)
    @Column(name = "about_us", columnDefinition = "TEXT")
    private String aboutUs;

    @Column(name = "privacy_policy", columnDefinition = "TEXT")
    private String privacyPolicy;

    @Column(name = "terms_conditions", columnDefinition = "TEXT")
    private String termsConditions;

    @Column(name = "refund_policy", columnDefinition = "TEXT")
    private String refundPolicy;

    @Column(name = "cancellation_policy", columnDefinition = "TEXT")
    private String cancellationPolicy;

    @Column(name = "our_mission", columnDefinition = "TEXT")
    private String ourMission;

    @Column(name = "our_vision", columnDefinition = "TEXT")
    private String ourVision;

    // Menu Filter Visibility (all default to true)
    @Column(name = "filter_recommended")
    private Boolean filterRecommended;

    @Column(name = "filter_popular")
    private Boolean filterPopular;

    @Column(name = "filter_discount")
    private Boolean filterDiscount;

    @Column(name = "filter_fast_serving")
    private Boolean filterFastServing;

    @Column(name = "filter_price")
    private Boolean filterPrice;

    @Column(name = "filter_rating")
    private Boolean filterRating;

    @Column(name = "filter_veg_nonveg")
    private Boolean filterVegNonveg;

    // Referral Settings
    @Digits(integer = 10, fraction = 2)
    @Column(name = "referral_amount")
    private BigDecimal referralAmount;

    @Column(name = "referral_enabled")
    private Boolean referralEnabled;

    // Timestamps
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
