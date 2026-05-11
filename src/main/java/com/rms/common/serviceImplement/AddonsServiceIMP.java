package com.rms.common.serviceImplement;

import com.rms.common.entities.AddonsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface AddonsServiceIMP {
    // Get All Record Addonss 
    public List<AddonsEntity> getAllRecordAddons(String token) throws Exception;

    // Get All Addonss in Pagination
    public Map<String, Object> getAllAddons(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Addons By Id
    public AddonsEntity getOneAddons(Long id, String token) throws Exception;

    // Add/Create New Addons
    public String addAddons(AddonsEntity addonsEntity, String token) throws Exception;

    // Update Existing Addons
    public String updateAddons(AddonsEntity addonsEntity,String token)throws Exception;

    // Delete Addons By Id
    public String deleteAddons(Long id, String token) throws Exception;

    // Add Multiple Addons
    public String addMultipleAddons(List<AddonsEntity> addonsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Addons By Createdat
    public List<AddonsEntity> getAddonsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Addons By Createdat Range
    public List<AddonsEntity> getAddonsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Addons By Createdat Range with Pagination
    public Map<String, Object> getAddonsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Addons By Updatedat
    public List<AddonsEntity> getAddonsByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get Addons By Updatedat Range
    public List<AddonsEntity> getAddonsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Addons By Updatedat Range with Pagination
    public Map<String, Object> getAddonsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
