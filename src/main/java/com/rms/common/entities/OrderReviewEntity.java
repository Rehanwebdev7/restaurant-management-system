package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "order_reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"order_id", "customer_id"}))
public class OrderReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "specialInstructions", "paymentRemarks",
            "bankRefNum", "apiRefNum", "idempotencyKey", "customerFeedback", "paymentGatewayId", "tableBookingId"})
    private OrdersEntity order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "photoUrl", "dateOfBirth",
            "isActive", "createdAt", "userId", "isDeleted", "updatedAt", "walletBalance",
            "referalCode", "referredById", "referralSignupBonus", "referralRecurringBonus"})
    private CustomersEntity customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role", "parentId",
            "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt",
            "email", "gstNumber", "panNumber", "aadhaarmask", "flat", "building", "area",
            "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
            "longitude", "userType", "subRole", "companyName", "companyAddress"})
    private UsersEntity restaurant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role", "parentId",
            "isActive", "isDeleted", "lastLogin", "lastLoginAt", "createdAt", "updatedAt",
            "email", "gstNumber", "panNumber", "aadhaarmask", "flat", "building", "area",
            "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
            "longitude", "userType", "subRole", "companyName", "companyAddress"})
    private UsersEntity branch;

    /** Star rating: 1 to 5 */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    /** Text review from customer */
    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    /** Photo URL uploaded with review */
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    /** Customer name snapshot at time of review */
    @Column(name = "customer_name")
    private String customerName;

    /** Food quality rating (1-5) */
    @Column(name = "food_rating")
    private Integer foodRating;

    /** Service quality rating (1-5) */
    @Column(name = "service_rating")
    private Integer serviceRating;

    /** Delivery/Packaging rating (1-5) */
    @Column(name = "delivery_rating")
    private Integer deliveryRating;

    /** Is the review visible to public */
    @Column(name = "is_visible")
    private Boolean isVisible = true;

    /** Admin reply to the review */
    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "admin_reply_at")
    private LocalDateTime adminReplyAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isVisible == null) this.isVisible = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
