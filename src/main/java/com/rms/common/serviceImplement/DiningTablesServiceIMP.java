package com.rms.common.serviceImplement;

import com.rms.common.entities.DiningTablesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface DiningTablesServiceIMP {
    // Get All Record DiningTabless 
    public List<DiningTablesEntity> getAllRecordDiningTables(String token) throws Exception;

    // Get All DiningTabless in Pagination
    public Map<String, Object> getAllDiningTables(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single DiningTables By Id
    public DiningTablesEntity getOneDiningTables(Long id, String token) throws Exception;

    // Add/Create New DiningTables
    public String addDiningTables(DiningTablesEntity dining_tablesEntity, String token) throws Exception;

    // Update Existing DiningTables
    public String updateDiningTables(DiningTablesEntity dining_tablesEntity,String token)throws Exception;

    // Delete DiningTables By Id
    public String deleteDiningTables(Long id, String token) throws Exception;

    // Add Multiple DiningTables
    public String addMultipleDiningTables(List<DiningTablesEntity> dining_tablesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get DiningTables By Createdat
    public List<DiningTablesEntity> getDiningTablesByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get DiningTables By Createdat Range
    public List<DiningTablesEntity> getDiningTablesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get DiningTables By Createdat Range with Pagination
    public Map<String, Object> getDiningTablesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get DiningTables By Updatedat
    public List<DiningTablesEntity> getDiningTablesByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get DiningTables By Updatedat Range
    public List<DiningTablesEntity> getDiningTablesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get DiningTables By Updatedat Range with Pagination
    public Map<String, Object> getDiningTablesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
