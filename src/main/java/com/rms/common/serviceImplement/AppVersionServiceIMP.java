package com.rms.common.serviceImplement;

import com.rms.common.entities.AppVersionEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface AppVersionServiceIMP {
    // Get All Record AppVersions 
    public List<AppVersionEntity> getAllRecordAppVersion(String token) throws Exception;

    // Get All AppVersions in Pagination
    public Map<String, Object> getAllAppVersion(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single AppVersion By Id
    public AppVersionEntity getOneAppVersion(Long id, String token) throws Exception;

    // Add/Create New AppVersion
    public String addAppVersion(AppVersionEntity app_versionEntity, String token) throws Exception;

    // Update Existing AppVersion
    public String updateAppVersion(AppVersionEntity app_versionEntity,String token)throws Exception;

    // Delete AppVersion By Id
    public String deleteAppVersion(Long id, String token) throws Exception;

    // Add Multiple AppVersion
    public String addMultipleAppVersion(List<AppVersionEntity> app_versionEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get AppVersion By Createdat
    public List<AppVersionEntity> getAppVersionByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get AppVersion By Createdat Range
    public List<AppVersionEntity> getAppVersionByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get AppVersion By Createdat Range with Pagination
    public Map<String, Object> getAppVersionByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get AppVersion By Updatedat
    public List<AppVersionEntity> getAppVersionByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get AppVersion By Updatedat Range
    public List<AppVersionEntity> getAppVersionByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get AppVersion By Updatedat Range with Pagination
    public Map<String, Object> getAppVersionByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
