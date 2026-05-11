package com.rms.common.serviceImplement;

import com.rms.common.entities.ActivityLogsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface ActivityLogsServiceIMP {
    // Get All Record ActivityLogss 
    public List<ActivityLogsEntity> getAllRecordActivityLogs(String token) throws Exception;

    // Get All ActivityLogss in Pagination
    public Map<String, Object> getAllActivityLogs(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single ActivityLogs By Id
    public ActivityLogsEntity getOneActivityLogs(Long id, String token) throws Exception;

    // Add/Create New ActivityLogs
    public String addActivityLogs(ActivityLogsEntity activity_logsEntity, String token) throws Exception;

    // Update Existing ActivityLogs
    public String updateActivityLogs(ActivityLogsEntity activity_logsEntity,String token)throws Exception;

    // Delete ActivityLogs By Id
    public String deleteActivityLogs(Long id, String token) throws Exception;

    // Add Multiple ActivityLogs
    public String addMultipleActivityLogs(List<ActivityLogsEntity> activity_logsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get ActivityLogs By Createdat
    public List<ActivityLogsEntity> getActivityLogsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get ActivityLogs By Createdat Range
    public List<ActivityLogsEntity> getActivityLogsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get ActivityLogs By Createdat Range with Pagination
    public Map<String, Object> getActivityLogsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
