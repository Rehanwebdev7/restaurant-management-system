package com.rms.common.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

import com.rms.common.entities.OrdersEntity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BranchOrderSummaryDTO {
    private Long id;
    private String orderNumber;
    private String orderType;
    private String status;
    private String paymentStatus;
    private String paymentMethod;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String tableNumber;
    private String couponCode;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private Integer estimatedTime;
    private String specialInstructions;
    private String deliveryStatus;
    private Long orderItemsCount;

    public static BranchOrderSummaryDTO fromRow(Object[] row) {
        if (row == null) {
            return null;
        }

        int index = 0;
        return new BranchOrderSummaryDTO(
                asLong(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asBigDecimal(row[index++]),
                asBigDecimal(row[index++]),
                asBigDecimal(row[index++]),
                asBigDecimal(row[index++]),
                asBigDecimal(row[index++]),
                asLocalDateTime(row[index++]),
                asLocalDateTime(row[index++]),
                asLocalDateTime(row[index++]),
                asInteger(row[index++]),
                asString(row[index++]),
                asString(row[index++]),
                asLong(row[index++]));
    }

    public static BranchOrderSummaryDTO fromOrderEntity(OrdersEntity order) {
        if (order == null) {
            return null;
        }

        return new BranchOrderSummaryDTO(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderType(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                order.getCustomerName() != null ? order.getCustomerName() : order.getCustomerId() != null ? order.getCustomerId().getName() : null,
                order.getCustomerPhone() != null ? order.getCustomerPhone() : order.getCustomerId() != null ? order.getCustomerId().getMobileNumber() : null,
                order.getCustomerEmail() != null ? order.getCustomerEmail() : order.getCustomerId() != null ? order.getCustomerId().getEmail() : null,
                order.getTableNumber(),
                order.getCouponCode(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getDiscountAmount(),
                order.getDeliveryFee(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getCompletedAt(),
                order.getEstimatedTime(),
                order.getSpecialInstructions(),
                order.getDeliveryStatus(),
                null);
    }

    public BigDecimal getAmount() {
        return totalAmount;
    }

    private static String asString(Object value) {
        return value != null ? value.toString() : null;
    }

    private static Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private static Integer asInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private static BigDecimal asBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private static LocalDateTime asLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return LocalDateTime.parse(value.toString());
    }
}
