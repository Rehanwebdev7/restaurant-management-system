package com.rms.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Entity;
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
import jakarta.persistence.PrePersist;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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
@Table(name = "coupon_usage_limit")
public class CouponUsageLimitEntity {

    @Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;
    
    @ManyToOne
   	@JoinColumn(name = "branch_id")
   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
   	private UsersEntity branchId;
    
    @ManyToOne
   	@JoinColumn(name = "restaurant_id")
   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
   	private UsersEntity restaurantId;
    
    
    @ManyToOne
   	@JoinColumn(name = "customer_id")
   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
   	private UsersEntity customerId;
    
    @Size(max = 255)
    @Column(name = "coupon_code")
    private String couponCode;
    
    @Column(name = "rem_usage_limit")
    private Integer remUsageLimit ;
    
    @Column(name = "last_update_at")
	private LocalDateTime lastUpdateAt;
    
    

    

}
