package com.rms.common.serviceImplement;

import com.rms.common.entities.DeliveryZonesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface DeliveryZonesServiceIMP {
    // Get All Record DeliveryZoness 
    public List<DeliveryZonesEntity> getAllRecordDeliveryZones(String token) throws Exception;

    // Get All DeliveryZoness in Pagination
    public Map<String, Object> getAllDeliveryZones(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single DeliveryZones By Id
    public DeliveryZonesEntity getOneDeliveryZones(Long id, String token) throws Exception;

    // Add/Create New DeliveryZones
    public String addDeliveryZones(DeliveryZonesEntity delivery_zonesEntity, String token) throws Exception;

    // Update Existing DeliveryZones
    public String updateDeliveryZones(DeliveryZonesEntity delivery_zonesEntity,String token)throws Exception;

    // Delete DeliveryZones By Id
    public String deleteDeliveryZones(Long id, String token) throws Exception;

    // Add Multiple DeliveryZones
    public String addMultipleDeliveryZones(List<DeliveryZonesEntity> delivery_zonesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get DeliveryZones By Createdat
    public List<DeliveryZonesEntity> getDeliveryZonesByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get DeliveryZones By Createdat Range
    public List<DeliveryZonesEntity> getDeliveryZonesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get DeliveryZones By Createdat Range with Pagination
    public Map<String, Object> getDeliveryZonesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
