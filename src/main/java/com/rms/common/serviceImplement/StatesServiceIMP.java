package com.rms.common.serviceImplement;

import com.rms.common.entities.StatesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface StatesServiceIMP {
    // Get All Record Statess 
    public List<StatesEntity> getAllRecordStates(String token) throws Exception;

    // Get All Statess in Pagination
    public Map<String, Object> getAllStates(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single States By Id
    public StatesEntity getOneStates(Integer id, String token) throws Exception;

    // Add/Create New States
    public String addStates(StatesEntity statesEntity, String token) throws Exception;

    // Update Existing States
    public String updateStates(StatesEntity statesEntity,String token)throws Exception;

    // Delete States By Id
    public String deleteStates(Integer id, String token) throws Exception;

    // Add Multiple States
    public String addMultipleStates(List<StatesEntity> statesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get States By Createdat
    public List<StatesEntity> getStatesByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get States By Createdat Range
    public List<StatesEntity> getStatesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get States By Createdat Range with Pagination
    public Map<String, Object> getStatesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get States By Updatedat
    public List<StatesEntity> getStatesByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get States By Updatedat Range
    public List<StatesEntity> getStatesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get States By Updatedat Range with Pagination
    public Map<String, Object> getStatesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
