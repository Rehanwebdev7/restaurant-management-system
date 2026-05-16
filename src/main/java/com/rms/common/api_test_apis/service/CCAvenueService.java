package com.rms.common.api_test_apis.service;

import org.springframework.stereotype.Service;

@Service
public class CCAvenueService {
    public String getRSAKeyForMobile(String accessCode, String orderId) {
        if (accessCode == null || accessCode.isBlank() || orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("accessCode and orderId are required");
        }
        return "";
    }
}
