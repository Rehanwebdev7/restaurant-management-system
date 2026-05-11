package com.rms.common.serviceImplement;

import com.rms.common.entities.PasswordResetsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface PasswordResetsServiceIMP {
    // Get All Record PasswordResetss 
    public List<PasswordResetsEntity> getAllRecordPasswordResets(String token) throws Exception;

    // Get All PasswordResetss in Pagination
    public Map<String, Object> getAllPasswordResets(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single PasswordResets By Id
    public PasswordResetsEntity getOnePasswordResets(Long id, String token) throws Exception;

    // Add/Create New PasswordResets
    public String addPasswordResets(PasswordResetsEntity password_resetsEntity, String token) throws Exception;

    // Update Existing PasswordResets
    public String updatePasswordResets(PasswordResetsEntity password_resetsEntity,String token)throws Exception;

    // Delete PasswordResets By Id
    public String deletePasswordResets(Long id, String token) throws Exception;

    // Add Multiple PasswordResets
    public String addMultiplePasswordResets(List<PasswordResetsEntity> password_resetsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get PasswordResets By Expiresat
    public List<PasswordResetsEntity> getPasswordResetsByExpiresat(LocalDate expiresAt, String token) throws Exception;

    // Get PasswordResets By Expiresat Range
    public List<PasswordResetsEntity> getPasswordResetsByExpiresatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get PasswordResets By Expiresat Range with Pagination
    public Map<String, Object> getPasswordResetsByExpiresatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get PasswordResets By Createdat
    public List<PasswordResetsEntity> getPasswordResetsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get PasswordResets By Createdat Range
    public List<PasswordResetsEntity> getPasswordResetsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get PasswordResets By Createdat Range with Pagination
    public Map<String, Object> getPasswordResetsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
