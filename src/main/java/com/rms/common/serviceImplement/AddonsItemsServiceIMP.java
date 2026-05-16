package com.rms.common.serviceImplement;

import com.rms.common.entities.AddonsItemsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface AddonsItemsServiceIMP {
    // Get All Record AddonsItemss 
    public List<AddonsItemsEntity> getAllRecordAddonsItems(String token) throws Exception;

    // Get All AddonsItemss in Pagination
    public Map<String, Object> getAllAddonsItems(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single AddonsItems By Id
    public AddonsItemsEntity getOneAddonsItems(Long id, String token) throws Exception;

    // Add/Create New AddonsItems
    public String addAddonsItems(AddonsItemsEntity addons_itemsEntity, String token) throws Exception;

    // Update Existing AddonsItems
    public String updateAddonsItems(AddonsItemsEntity addons_itemsEntity,String token)throws Exception;

    // Delete AddonsItems By Id
    public String deleteAddonsItems(Long id, String token) throws Exception;

    // Add Multiple AddonsItems
    public String addMultipleAddonsItems(List<AddonsItemsEntity> addons_itemsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get AddonsItems By Createdat
    public List<AddonsItemsEntity> getAddonsItemsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get AddonsItems By Createdat Range
    public List<AddonsItemsEntity> getAddonsItemsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get AddonsItems By Createdat Range with Pagination
    public Map<String, Object> getAddonsItemsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get AddonsItems By Updatedat
    public List<AddonsItemsEntity> getAddonsItemsByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get AddonsItems By Updatedat Range
    public List<AddonsItemsEntity> getAddonsItemsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get AddonsItems By Updatedat Range with Pagination
    public Map<String, Object> getAddonsItemsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Filter helper for role-specific screens
    default Map<String, Object> getAddonsItemsWithFilters(LocalDate fromDate, LocalDate toDate, Boolean isActive, String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {
        throw new UnsupportedOperationException("Filter operation not available");
    }

}
