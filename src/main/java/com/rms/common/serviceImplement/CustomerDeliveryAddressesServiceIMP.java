package com.rms.common.serviceImplement;

import com.rms.common.entities.CustomerDeliveryAddressesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface CustomerDeliveryAddressesServiceIMP {
    // Get All Record CustomerDeliveryAddressess 
    public List<CustomerDeliveryAddressesEntity> getAllRecordCustomerDeliveryAddresses(String token) throws Exception;

    // Get All CustomerDeliveryAddressess in Pagination
    public Map<String, Object> getAllCustomerDeliveryAddresses(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single CustomerDeliveryAddresses By Id
    public CustomerDeliveryAddressesEntity getOneCustomerDeliveryAddresses(Long id, String token) throws Exception;

    // Add/Create New CustomerDeliveryAddresses
    public String addCustomerDeliveryAddresses(CustomerDeliveryAddressesEntity customer_delivery_addressesEntity, String token) throws Exception;

    // Update Existing CustomerDeliveryAddresses
    public String updateCustomerDeliveryAddresses(CustomerDeliveryAddressesEntity customer_delivery_addressesEntity,String token)throws Exception;

    // Delete CustomerDeliveryAddresses By Id
    public String deleteCustomerDeliveryAddresses(Long id, String token) throws Exception;

    // Add Multiple CustomerDeliveryAddresses
    public String addMultipleCustomerDeliveryAddresses(List<CustomerDeliveryAddressesEntity> customer_delivery_addressesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get CustomerDeliveryAddresses By Createdat
    public List<CustomerDeliveryAddressesEntity> getCustomerDeliveryAddressesByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get CustomerDeliveryAddresses By Createdat Range
    public List<CustomerDeliveryAddressesEntity> getCustomerDeliveryAddressesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get CustomerDeliveryAddresses By Createdat Range with Pagination
    public Map<String, Object> getCustomerDeliveryAddressesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
