package com.rms.common.serviceImplement;

import com.rms.common.entities.BankDetailsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface BankDetailsServiceIMP {
    // Get All Record BankDetailss 
    public List<BankDetailsEntity> getAllRecordBankDetails(String token) throws Exception;

    // Get All BankDetailss in Pagination
    public Map<String, Object> getAllBankDetails(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single BankDetails By Id
    public BankDetailsEntity getOneBankDetails(Long id, String token) throws Exception;

    // Add/Create New BankDetails
    public String addBankDetails(BankDetailsEntity bank_detailsEntity, String token) throws Exception;

    // Update Existing BankDetails
    public String updateBankDetails(BankDetailsEntity bank_detailsEntity,String token)throws Exception;

    // Delete BankDetails By Id
    public String deleteBankDetails(Long id, String token) throws Exception;

    // Add Multiple BankDetails
    public String addMultipleBankDetails(List<BankDetailsEntity> bank_detailsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get BankDetails By Createdat
    public List<BankDetailsEntity> getBankDetailsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get BankDetails By Createdat Range
    public List<BankDetailsEntity> getBankDetailsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get BankDetails By Createdat Range with Pagination
    public Map<String, Object> getBankDetailsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get BankDetails By Updatedat
    public List<BankDetailsEntity> getBankDetailsByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get BankDetails By Updatedat Range
    public List<BankDetailsEntity> getBankDetailsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get BankDetails By Updatedat Range with Pagination
    public Map<String, Object> getBankDetailsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
