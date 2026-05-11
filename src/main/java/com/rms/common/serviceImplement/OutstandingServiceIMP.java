package com.rms.common.serviceImplement;

import com.rms.common.entities.OutstandingEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface OutstandingServiceIMP {
    // Get All Record Outstandings 
    public List<OutstandingEntity> getAllRecordOutstanding(String token) throws Exception;

    // Get All Outstandings in Pagination
    public Map<String, Object> getAllOutstanding(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Outstanding By Id
    public OutstandingEntity getOneOutstanding(Integer id, String token) throws Exception;

    // Add/Create New Outstanding
    public String addOutstanding(OutstandingEntity outstandingEntity, String token) throws Exception;

    // Update Existing Outstanding
    public String updateOutstanding(OutstandingEntity outstandingEntity,String token)throws Exception;

    // Delete Outstanding By Id
    public String deleteOutstanding(Integer id, String token) throws Exception;

    // Add Multiple Outstanding
    public String addMultipleOutstanding(List<OutstandingEntity> outstandingEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Outstanding By Date
    public List<OutstandingEntity> getOutstandingByDate(LocalDate date, String token) throws Exception;

    // Get Outstanding By Date Range
    public List<OutstandingEntity> getOutstandingByDateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Outstanding By Date Range with Pagination
    public Map<String, Object> getOutstandingByDateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
