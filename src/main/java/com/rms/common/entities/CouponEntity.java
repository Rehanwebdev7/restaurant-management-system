package com.rms.common.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;
@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "coupon")
public class CouponEntity {

    @Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Size(max = 255)
    @Column(name = "coupon_name")
    private String couponName;
    
//    @Size(max = 255)
//    @Column(name = "for_user")
//    private String forUser;
    
    @Size(max = 255)
    @Column(name = "coupon_code")
    private String couponCode;
    
    

    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_amount")
    private BigDecimal discountAmount ;

    
    @Column(name = "validity")
    private LocalDate validity;


//    @Size(max = 255)
//    @Column(name = "settlement")
//    private String settlement;

    @Size(max = 255)
    @Column(name = "display_on_screen")
    private Boolean displayOnScreen;
    
//    @Column(name = "category")
//    private String category;
//    @ManyToOne
//   	@JoinColumn(name = "category_id")
//   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
//   	private CategoryEntity categoryId;
//    
    @Size(max = 255)
    @Column(name = "logo")
    private String logo;

    @Column(name = "drive_logo")
    private String driveLogo;


    @Column(name = "is_delete")
    private Boolean isDelete;

    
    @Column(name = "description",columnDefinition ="Text")
    private String description;

//    @Column(name = "lmd_id", unique = true)
//    private String lmdId;

    @Column(name = "title")
    private String title;
    
    

    
    @ManyToOne
   	@JoinColumn(name = "branch_id")
   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
   	private UsersEntity branchId;
    
    @ManyToOne
   	@JoinColumn(name = "restaurant_id")
   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
   	private UsersEntity restaurantId;
    
    
    @ManyToOne
   	@JoinColumn(name = "added_by_id")
   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
   	private UsersEntity addedById;
    
    @Column(name = "is_percent")
    private Boolean isPercent;
    
    @Column(name = "global")
    private Boolean global;
    
    @Column(name = "usage_limit")
    private Integer usageLimit ;
    
    @Column(name = "created_at")
	private LocalDateTime createdAt;
    
    @Column(name = "first_order")
    private Boolean firstOrder;
    
    
    @OneToMany(mappedBy = "couponId", cascade = CascadeType.ALL, orphanRemoval = true)
//	@JsonIgnore
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" ,"orderId","kitchenId","couponId"})	
	private List<CouponMappingEntity> CouponMappingId;
    
//    @OneToMany(
//            mappedBy = "orderItemId",
//            cascade = CascadeType.ALL,
//            orphanRemoval = true,
//            fetch = FetchType.LAZY
//        )
//        @JsonIgnoreProperties({"hibernateLazyInitializer", "handler","orderItemId"})
//        private List<OrderAddonsItemsEntity> addonItems;
////    
    @Column(name = "quantity")
    private Integer quantity ;
    @PrePersist
    protected void onCreate() {
    	if (this.isDelete == null) this.isDelete = false;
    	
    	if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();

    }


}
