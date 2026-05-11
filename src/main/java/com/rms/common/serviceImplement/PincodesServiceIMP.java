package com.rms.common.serviceImplement;

import com.rms.common.entities.PincodesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface PincodesServiceIMP {
    // Get All Record Pincodess 
    public List<PincodesEntity> getAllRecordPincodes(String token) throws Exception;

    // Get All Pincodess in Pagination
    public Map<String, Object> getAllPincodes(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Pincodes By Id
    public PincodesEntity getOnePincodes(Long id, String token) throws Exception;

    // Add/Create New Pincodes
    public String addPincodes(PincodesEntity pincodesEntity, String token) throws Exception;

    // Update Existing Pincodes
    public String updatePincodes(PincodesEntity pincodesEntity,String token)throws Exception;

    // Delete Pincodes By Id
    public String deletePincodes(Long id, String token) throws Exception;

    // Add Multiple Pincodes
    public String addMultiplePincodes(List<PincodesEntity> pincodesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Pincodes By Createdat
    public List<PincodesEntity> getPincodesByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Pincodes By Createdat Range
    public List<PincodesEntity> getPincodesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Pincodes By Createdat Range with Pagination
    public Map<String, Object> getPincodesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Pincodes By Updatedat
    public List<PincodesEntity> getPincodesByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get Pincodes By Updatedat Range
    public List<PincodesEntity> getPincodesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Pincodes By Updatedat Range with Pagination
    public Map<String, Object> getPincodesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
