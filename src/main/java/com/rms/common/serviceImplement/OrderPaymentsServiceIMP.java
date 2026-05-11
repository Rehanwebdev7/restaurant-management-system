package com.rms.common.serviceImplement;

import com.rms.common.entities.OrderPaymentsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface OrderPaymentsServiceIMP {
    // Get All Record OrderPaymentss 
    public List<OrderPaymentsEntity> getAllRecordOrderPayments(String token) throws Exception;

    // Get All OrderPaymentss in Pagination
    public Map<String, Object> getAllOrderPayments(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single OrderPayments By Id
    public OrderPaymentsEntity getOneOrderPayments(Long id, String token) throws Exception;

    // Add/Create New OrderPayments
    public String addOrderPayments(OrderPaymentsEntity order_paymentsEntity, String token) throws Exception;

    // Update Existing OrderPayments
    public String updateOrderPayments(OrderPaymentsEntity order_paymentsEntity,String token)throws Exception;

    // Delete OrderPayments By Id
    public String deleteOrderPayments(Long id, String token) throws Exception;

    // Add Multiple OrderPayments
    public String addMultipleOrderPayments(List<OrderPaymentsEntity> order_paymentsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get OrderPayments By Paymenttime
    public List<OrderPaymentsEntity> getOrderPaymentsByPaymenttime(LocalDate paymentTime, String token) throws Exception;

    // Get OrderPayments By Paymenttime Range
    public List<OrderPaymentsEntity> getOrderPaymentsByPaymenttimeBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderPayments By Paymenttime Range with Pagination
    public Map<String, Object> getOrderPaymentsByPaymenttimeBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OrderPayments By Refundtime
    public List<OrderPaymentsEntity> getOrderPaymentsByRefundtime(LocalDate refundTime, String token) throws Exception;

    // Get OrderPayments By Refundtime Range
    public List<OrderPaymentsEntity> getOrderPaymentsByRefundtimeBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderPayments By Refundtime Range with Pagination
    public Map<String, Object> getOrderPaymentsByRefundtimeBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OrderPayments By Reconciledat
    public List<OrderPaymentsEntity> getOrderPaymentsByReconciledat(LocalDate reconciledAt, String token) throws Exception;

    // Get OrderPayments By Reconciledat Range
    public List<OrderPaymentsEntity> getOrderPaymentsByReconciledatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderPayments By Reconciledat Range with Pagination
    public Map<String, Object> getOrderPaymentsByReconciledatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OrderPayments By Createdat
    public List<OrderPaymentsEntity> getOrderPaymentsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get OrderPayments By Createdat Range
    public List<OrderPaymentsEntity> getOrderPaymentsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderPayments By Createdat Range with Pagination
    public Map<String, Object> getOrderPaymentsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OrderPayments By Updatedat
    public List<OrderPaymentsEntity> getOrderPaymentsByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get OrderPayments By Updatedat Range
    public List<OrderPaymentsEntity> getOrderPaymentsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderPayments By Updatedat Range with Pagination
    public Map<String, Object> getOrderPaymentsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
