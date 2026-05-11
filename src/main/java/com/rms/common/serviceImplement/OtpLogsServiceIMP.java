package com.rms.common.serviceImplement;

import com.rms.common.entities.OtpLogsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface OtpLogsServiceIMP {
    // Get All Record OtpLogss 
    public List<OtpLogsEntity> getAllRecordOtpLogs(String token) throws Exception;

    // Get All OtpLogss in Pagination
    public Map<String, Object> getAllOtpLogs(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single OtpLogs By Id
    public OtpLogsEntity getOneOtpLogs(Long id, String token) throws Exception;

    // Add/Create New OtpLogs
    public String addOtpLogs(OtpLogsEntity otp_logsEntity, String token) throws Exception;

    // Update Existing OtpLogs
    public String updateOtpLogs(OtpLogsEntity otp_logsEntity,String token)throws Exception;

    // Delete OtpLogs By Id
    public String deleteOtpLogs(Long id, String token) throws Exception;

    // Add Multiple OtpLogs
    public String addMultipleOtpLogs(List<OtpLogsEntity> otp_logsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get OtpLogs By Expiresat
    public List<OtpLogsEntity> getOtpLogsByExpiresat(LocalDate expiresAt, String token) throws Exception;

    // Get OtpLogs By Expiresat Range
    public List<OtpLogsEntity> getOtpLogsByExpiresatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OtpLogs By Expiresat Range with Pagination
    public Map<String, Object> getOtpLogsByExpiresatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OtpLogs By Createdat
    public List<OtpLogsEntity> getOtpLogsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get OtpLogs By Createdat Range
    public List<OtpLogsEntity> getOtpLogsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OtpLogs By Createdat Range with Pagination
    public Map<String, Object> getOtpLogsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OtpLogs By Verifiedat
    public List<OtpLogsEntity> getOtpLogsByVerifiedat(LocalDate verifiedAt, String token) throws Exception;

    // Get OtpLogs By Verifiedat Range
    public List<OtpLogsEntity> getOtpLogsByVerifiedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OtpLogs By Verifiedat Range with Pagination
    public Map<String, Object> getOtpLogsByVerifiedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OtpLogs By Usedat
    public List<OtpLogsEntity> getOtpLogsByUsedat(LocalDate usedAt, String token) throws Exception;

    // Get OtpLogs By Usedat Range
    public List<OtpLogsEntity> getOtpLogsByUsedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OtpLogs By Usedat Range with Pagination
    public Map<String, Object> getOtpLogsByUsedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OtpLogs By Updatedat
    public List<OtpLogsEntity> getOtpLogsByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get OtpLogs By Updatedat Range
    public List<OtpLogsEntity> getOtpLogsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OtpLogs By Updatedat Range with Pagination
    public Map<String, Object> getOtpLogsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
