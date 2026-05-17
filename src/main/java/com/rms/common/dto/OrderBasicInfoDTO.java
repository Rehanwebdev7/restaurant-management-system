package com.rms.common.dto;

import java.math.BigDecimal;

public class OrderBasicInfoDTO {
    public final BigDecimal totalAmount;
    public final BigDecimal deliveryFee;
    public final String orderNumber;
    public final String status;

    public OrderBasicInfoDTO(Object totalAmount, Object deliveryFee, Object orderNumber, Object status) {
        this.totalAmount = totalAmount != null ? new BigDecimal(totalAmount.toString()) : null;
        this.deliveryFee = deliveryFee != null ? new BigDecimal(deliveryFee.toString()) : null;
        this.orderNumber = orderNumber != null ? orderNumber.toString() : null;
        this.status = status != null ? status.toString() : null;
    }
}
