package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.List;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "order_items")
public class OrderItemsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private OrdersEntity orderId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private MenuItemsEntity menuItemId;

    @Column(name = "menu_item_name")
    private String menuItemName;

    @Column(name = "price")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal price;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "addons_total")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal addonsTotal;

    @Column(name = "special_instructions")
    private String specialInstructions;

    @Column(name = "item_total")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal itemTotal;

    @Column(name = "status")
    private String status;
    
//    @OneToMany(mappedBy = "orderItemId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    private List<OrderAddonsItemsEntity> addonItems;
    
 // ✅ Cascade + orphanRemoval added (THIS WAS REQUIRED)
    @OneToMany(
        mappedBy = "orderItemId",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler","orderItemId"})
    private List<OrderAddonsItemsEntity> addonItems;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kitchen_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "email", "gstNumber", "panNumber", "aadhaarmask", "flat",
		"building", "area", "city", "cityId", "pincodeId", "stateId", "landmark", "pincode", "latitude",
		"longitude", "userType", "subRole", "companyName", "companyAddress", "registerDate", "isActive", "dfault",
		"relationshipManager", "address", "aadhaarNumber", "storeId", "outstandingBalance", "referenceId",
		"parentId", "employeeId", "myCommission", "retailerCommission", "sellerCommission", "distServiceMargin",
		"retServiceMargin","branchId"})
    private UsersEntity kitchenId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.price == null)
            this.price = BigDecimal.valueOf(0.00);
        if (this.addonsTotal == null)
            this.addonsTotal = BigDecimal.valueOf(0.00);
        if (this.status == null)
            this.status = "PENDING";
        if (this.itemTotal == null)
            this.itemTotal = BigDecimal.valueOf(0.00);
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
