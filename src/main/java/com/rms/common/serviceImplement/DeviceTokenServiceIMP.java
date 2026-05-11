package com.rms.common.serviceImplement;

import com.rms.common.entities.DeviceTokenEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface DeviceTokenServiceIMP {
    // Get All Record DeviceTokens 
    public List<DeviceTokenEntity> getAllRecordDeviceToken(String token) throws Exception;

    // Get All DeviceTokens in Pagination
    public Map<String, Object> getAllDeviceToken(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single DeviceToken By Id
    public DeviceTokenEntity getOneDeviceToken(Long id, String token) throws Exception;

    // Add/Create New DeviceToken
    public String addDeviceToken(DeviceTokenEntity device_tokenEntity, String token) throws Exception;

    // Update Existing DeviceToken
    public String updateDeviceToken(DeviceTokenEntity device_tokenEntity,String token)throws Exception;

    // Delete DeviceToken By Id
    public String deleteDeviceToken(Long id, String token) throws Exception;

    // Add Multiple DeviceToken
    public String addMultipleDeviceToken(List<DeviceTokenEntity> device_tokenEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
