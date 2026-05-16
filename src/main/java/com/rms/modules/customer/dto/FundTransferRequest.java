package com.rms.modules.customer.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FundTransferRequest {
    private Long bankId;
    private BigDecimal amount;
    private String transferMode;
}
