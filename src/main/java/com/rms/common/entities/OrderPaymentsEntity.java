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
@Table(name = "order_payments")
public class OrderPaymentsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "online_order_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private OrdersEntity onlineOrderId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UsersEntity restaurantId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UsersEntity branchId;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_gateway")
    private String paymentGateway;

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId;

    @Column(name = "amount")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal amount;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    @Column(name = "refund_amount")
    @Digits(integer = 38, fraction = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason")
    private String refundReason;

    @Column(name = "refund_time")
    private LocalDateTime refundTime;

    @Column(name = "is_reconciled")
    private Boolean isReconciled ;

    @Column(name = "reconciled_at")
    private LocalDateTime reconciledAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
    	 if (this.isReconciled == null) this.isReconciled = false;
        if (this.amount == null)
            this.amount = BigDecimal.valueOf(0.00);
        if (this.paymentTime == null)
            this.paymentTime = LocalDateTime.now();
        if (this.refundAmount == null)
            this.refundAmount = BigDecimal.valueOf(0.00);
        if (this.refundTime == null)
            this.refundTime = LocalDateTime.now();
        if (this.reconciledAt == null)
            this.reconciledAt = LocalDateTime.now();
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = LocalDateTime.now();
    }
}
