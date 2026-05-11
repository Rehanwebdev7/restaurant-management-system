package com.rms.common.serviceImplement;

import com.rms.common.entities.MenuCategoryEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface MenuCategoryServiceIMP {
    // Get All Record MenuCategorys 
    public List<MenuCategoryEntity> getAllRecordMenuCategory(String token) throws Exception;

    // Get All MenuCategorys in Pagination
    public Map<String, Object> getAllMenuCategory(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single MenuCategory By Id
    public MenuCategoryEntity getOneMenuCategory(Long id, String token) throws Exception;

    // Add/Create New MenuCategory
    public String addMenuCategory(MenuCategoryEntity menu_categoryEntity, String token) throws Exception;

    // Update Existing MenuCategory
    public String updateMenuCategory(MenuCategoryEntity menu_categoryEntity,String token)throws Exception;

    // Delete MenuCategory By Id
    public String deleteMenuCategory(Long id, String token) throws Exception;

    // Add Multiple MenuCategory
    public String addMultipleMenuCategory(List<MenuCategoryEntity> menu_categoryEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get MenuCategory By Createdat
    public List<MenuCategoryEntity> getMenuCategoryByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get MenuCategory By Createdat Range
    public List<MenuCategoryEntity> getMenuCategoryByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get MenuCategory By Createdat Range with Pagination
    public Map<String, Object> getMenuCategoryByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get MenuCategory By Updatedat
    public List<MenuCategoryEntity> getMenuCategoryByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get MenuCategory By Updatedat Range
    public List<MenuCategoryEntity> getMenuCategoryByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get MenuCategory By Updatedat Range with Pagination
    public Map<String, Object> getMenuCategoryByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
