package com.rms.common.serviceImplement;

import com.rms.common.entities.CustomersEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface CustomersServiceIMP {
    // Get All Record Customerss 
    public List<CustomersEntity> getAllRecordCustomers(String token) throws Exception;

    // Get All Customerss in Pagination
    public Map<String, Object> getAllCustomers(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Customers By Id
    public CustomersEntity getOneCustomers(Long id, String token) throws Exception;

    // Add/Create New Customers
    public String addCustomers(CustomersEntity customersEntity, String token) throws Exception;

    // Update Existing Customers
    public String updateCustomers(CustomersEntity customersEntity,String token)throws Exception;

    // Delete Customers By Id
    public String deleteCustomers(Long id, String token) throws Exception;

    // Add Multiple Customers
    public String addMultipleCustomers(List<CustomersEntity> customersEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Customers By Dateofbirth
    public List<CustomersEntity> getCustomersByDateofbirth(LocalDate dateOfBirth, String token) throws Exception;

    // Get Customers By Dateofbirth Range
    public List<CustomersEntity> getCustomersByDateofbirthBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Customers By Dateofbirth Range with Pagination
    public Map<String, Object> getCustomersByDateofbirthBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Customers By Createdat
    public List<CustomersEntity> getCustomersByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Customers By Createdat Range
    public List<CustomersEntity> getCustomersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Customers By Createdat Range with Pagination
    public Map<String, Object> getCustomersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Customers By Updatedat
    public List<CustomersEntity> getCustomersByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get Customers By Updatedat Range
    public List<CustomersEntity> getCustomersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Customers By Updatedat Range with Pagination
    public Map<String, Object> getCustomersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
