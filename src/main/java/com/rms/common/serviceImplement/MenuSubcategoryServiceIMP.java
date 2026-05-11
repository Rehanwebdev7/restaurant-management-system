package com.rms.common.serviceImplement;

import com.rms.common.entities.MenuSubcategoryEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface MenuSubcategoryServiceIMP {
    // Get All Record MenuSubcategorys 
    public List<MenuSubcategoryEntity> getAllRecordMenuSubcategory(String token) throws Exception;

    // Get All MenuSubcategorys in Pagination
    public Map<String, Object> getAllMenuSubcategory(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single MenuSubcategory By Id
    public MenuSubcategoryEntity getOneMenuSubcategory(Long id, String token) throws Exception;

    // Add/Create New MenuSubcategory
    public String addMenuSubcategory(MenuSubcategoryEntity menu_subcategoryEntity, String token) throws Exception;

    // Update Existing MenuSubcategory
    public String updateMenuSubcategory(MenuSubcategoryEntity menu_subcategoryEntity,String token)throws Exception;

    // Delete MenuSubcategory By Id
    public String deleteMenuSubcategory(Long id, String token) throws Exception;

    // Add Multiple MenuSubcategory
    public String addMultipleMenuSubcategory(List<MenuSubcategoryEntity> menu_subcategoryEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get MenuSubcategory By Createdat
    public List<MenuSubcategoryEntity> getMenuSubcategoryByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get MenuSubcategory By Createdat Range
    public List<MenuSubcategoryEntity> getMenuSubcategoryByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get MenuSubcategory By Createdat Range with Pagination
    public Map<String, Object> getMenuSubcategoryByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get MenuSubcategory By Updatedat
    public List<MenuSubcategoryEntity> getMenuSubcategoryByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get MenuSubcategory By Updatedat Range
    public List<MenuSubcategoryEntity> getMenuSubcategoryByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get MenuSubcategory By Updatedat Range with Pagination
    public Map<String, Object> getMenuSubcategoryByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
