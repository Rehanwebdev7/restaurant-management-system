package com.rms.common.serviceImplement;

import com.rms.common.entities.ApiLogsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface ApiLogsServiceIMP {
    // Get All Record ApiLogss 
    public List<ApiLogsEntity> getAllRecordApiLogs(String token) throws Exception;

    // Get All ApiLogss in Pagination
    public Map<String, Object> getAllApiLogs(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single ApiLogs By Id
    public ApiLogsEntity getOneApiLogs(Integer id, String token) throws Exception;

    // Add/Create New ApiLogs
    public String addApiLogs(ApiLogsEntity api_logsEntity, String token) throws Exception;

    // Update Existing ApiLogs
    public String updateApiLogs(ApiLogsEntity api_logsEntity,String token)throws Exception;

    // Delete ApiLogs By Id
    public String deleteApiLogs(Integer id, String token) throws Exception;

    // Add Multiple ApiLogs
    public String addMultipleApiLogs(List<ApiLogsEntity> api_logsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get ApiLogs By Date
    public List<ApiLogsEntity> getApiLogsByDate(LocalDate date, String token) throws Exception;

    // Get ApiLogs By Date Range
    public List<ApiLogsEntity> getApiLogsByDateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get ApiLogs By Date Range with Pagination
    public Map<String, Object> getApiLogsByDateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
