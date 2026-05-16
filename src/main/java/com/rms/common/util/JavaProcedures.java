package com.rms.common.util;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class JavaProcedures {
    public String outstandingTransactionProcedure(Map<String, Object> payload) {
        return "SUCCESS";
    }

    public String walletTransactionProcedure(Map<String, Object> payload) {
        return "SUCCESS";
    }
}
