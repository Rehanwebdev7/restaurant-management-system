package com.rms.common.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Polymorphic content block for restaurant-scoped customer website content.
 *
 * One row = one card/tile/entry on a customer page. `page` + `section_type`
 * discriminator lets a single table power all the "static-looking" but
 * per-tenant content sections: testimonials, team, awards, facilities,
 * event packages, FAQs, department contacts, reach info, hours notes,
 * help categories, Instagram posts, stats, etc.
 *
 * `meta` JSONB column is the flexible escape hatch for type-specific extras:
 *   DEPARTMENT: { "phone": "+91...", "email": "x@y.z", "hours": "9-11 PM" }
 *   EVENT_PACKAGE: { "accent": "From ₹1200/head", "cta_href": "..." }
 *   TESTIMONIAL: { "rating": 5, "role": "Food Critic, Mumbai Mirror" }
 *   HELP_CATEGORY: { "cta": "email@x.z", "href": "mailto:..." }
 *
 * Tenant scoping: every row FK-tied to `restaurant_id` (users table).
 * Customer API resolves tenant via existing domain lookup pattern
 * (CustBrandingController.resolveTenantRestaurantId).
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(
    name = "restaurant_content_blocks",
    indexes = {
        @Index(name = "idx_content_blocks_lookup",
               columnList = "restaurant_id,page,section_type,is_active")
    }
)
public class RestaurantContentBlockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "role",
            "parentId", "isActive", "isDeleted", "createdAt", "updatedAt" })
    private UsersEntity restaurantId;

    /** 'HOME' | 'LOCATIONS' | 'CONTACT' | 'ABOUT' | 'FOOTER' */
    @Column(name = "page", nullable = false, length = 30)
    private String page;

    /**
     * Discriminator: TESTIMONIAL | INSTAGRAM_POST | FACILITY | EVENT_PACKAGE |
     * AWARD | REACH_INFO | FAQ | DEPARTMENT | HELP_CATEGORY | HOURS_NOTE |
     * TEAM_MEMBER | STAT | WHY_DINE
     */
    @Column(name = "section_type", nullable = false, length = 40)
    private String sectionType;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "subtitle", length = 255)
    private String subtitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "drive_image_url", length = 500)
    private String driveImageUrl;

    /** Lucide icon key — e.g. 'ChefHat', 'Award', 'Star', 'Wifi'. */
    @Column(name = "icon_name", length = 50)
    private String iconName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "jsonb")
    private JsonNode meta;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.isActive == null) this.isActive = true;
        if (this.sortOrder == null) this.sortOrder = 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
