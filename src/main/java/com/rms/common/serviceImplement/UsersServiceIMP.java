package com.rms.common.serviceImplement;

import com.rms.common.entities.UsersEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface UsersServiceIMP {
    // Get All Record Userss 
    public List<UsersEntity> getAllRecordUsers(String token) throws Exception;

    // Get All Userss in Pagination
    public Map<String, Object> getAllUsers(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Users By Id
    public UsersEntity getOneUsers(Long id, String token) throws Exception;

    // Add/Create New Users
    public String addUsers(UsersEntity usersEntity, String token) throws Exception;

    // Update Existing Users
    public String updateUsers(UsersEntity usersEntity,String token)throws Exception;

    // Delete Users By Id
    public String deleteUsers(Long id, String token) throws Exception;

    // Add Multiple Users
    public String addMultipleUsers(List<UsersEntity> usersEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Users By Lastlogin
    public List<UsersEntity> getUsersByLastlogin(LocalDate lastLogin, String token) throws Exception;

    // Get Users By Lastlogin Range
    public List<UsersEntity> getUsersByLastloginBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Users By Lastlogin Range with Pagination
    public Map<String, Object> getUsersByLastloginBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Users By Lastloginat
    public List<UsersEntity> getUsersByLastloginat(LocalDate lastLoginAt, String token) throws Exception;

    // Get Users By Lastloginat Range
    public List<UsersEntity> getUsersByLastloginatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Users By Lastloginat Range with Pagination
    public Map<String, Object> getUsersByLastloginatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Users By Createdat
    public List<UsersEntity> getUsersByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Users By Createdat Range
    public List<UsersEntity> getUsersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Users By Createdat Range with Pagination
    public Map<String, Object> getUsersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Users By Updatedat
    public List<UsersEntity> getUsersByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get Users By Updatedat Range
    public List<UsersEntity> getUsersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Users By Updatedat Range with Pagination
    public Map<String, Object> getUsersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
