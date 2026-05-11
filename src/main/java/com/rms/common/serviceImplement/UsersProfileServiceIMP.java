package com.rms.common.serviceImplement;

import com.rms.common.entities.UsersProfileEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface UsersProfileServiceIMP {
    // Get All Record UsersProfiles 
    public List<UsersProfileEntity> getAllRecordUsersProfile(String token) throws Exception;

    // Get All UsersProfiles in Pagination
    public Map<String, Object> getAllUsersProfile(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single UsersProfile By Id
    public UsersProfileEntity getOneUsersProfile(Long id, String token) throws Exception;

    // Add/Create New UsersProfile
    public String addUsersProfile(UsersProfileEntity users_profileEntity, String token) throws Exception;

    // Update Existing UsersProfile
    public String updateUsersProfile(UsersProfileEntity users_profileEntity,String token)throws Exception;

    // Delete UsersProfile By Id
    public String deleteUsersProfile(Long id, String token) throws Exception;

    // Add Multiple UsersProfile
    public String addMultipleUsersProfile(List<UsersProfileEntity> users_profileEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get UsersProfile By Createdat
    public List<UsersProfileEntity> getUsersProfileByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get UsersProfile By Createdat Range
    public List<UsersProfileEntity> getUsersProfileByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get UsersProfile By Createdat Range with Pagination
    public Map<String, Object> getUsersProfileByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get UsersProfile By Updatedat
    public List<UsersProfileEntity> getUsersProfileByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get UsersProfile By Updatedat Range
    public List<UsersProfileEntity> getUsersProfileByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get UsersProfile By Updatedat Range with Pagination
    public Map<String, Object> getUsersProfileByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
