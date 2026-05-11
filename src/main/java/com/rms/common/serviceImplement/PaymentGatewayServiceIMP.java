package com.rms.common.serviceImplement;

import com.rms.common.entities.PaymentGatewayEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface PaymentGatewayServiceIMP {
    // Get All Record PaymentGateways 
    public List<PaymentGatewayEntity> getAllRecordPaymentGateway(String token) throws Exception;

    // Get All PaymentGateways in Pagination
    public Map<String, Object> getAllPaymentGateway(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single PaymentGateway By Id
    public PaymentGatewayEntity getOnePaymentGateway(Integer id, String token) throws Exception;

    // Add/Create New PaymentGateway
    public String addPaymentGateway(PaymentGatewayEntity payment_gatewayEntity, String token) throws Exception;

    // Update Existing PaymentGateway
    public String updatePaymentGateway(PaymentGatewayEntity payment_gatewayEntity,String token)throws Exception;

    // Delete PaymentGateway By Id
    public String deletePaymentGateway(Integer id, String token) throws Exception;

    // Add Multiple PaymentGateway
    public String addMultiplePaymentGateway(List<PaymentGatewayEntity> payment_gatewayEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
