package com.rms.common.serviceImplement;

import com.rms.common.entities.MenuItemAddonsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface MenuItemAddonsServiceIMP {
    // Get All Record MenuItemAddonss 
    public List<MenuItemAddonsEntity> getAllRecordMenuItemAddons(String token) throws Exception;

    // Get All MenuItemAddonss in Pagination
    public Map<String, Object> getAllMenuItemAddons(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single MenuItemAddons By Id
    public MenuItemAddonsEntity getOneMenuItemAddons(Long id, String token) throws Exception;

    // Add/Create New MenuItemAddons
    public String addMenuItemAddons(MenuItemAddonsEntity menu_item_addonsEntity, String token) throws Exception;

    // Update Existing MenuItemAddons
    public String updateMenuItemAddons(MenuItemAddonsEntity menu_item_addonsEntity,String token)throws Exception;

    // Delete MenuItemAddons By Id
    public String deleteMenuItemAddons(Long id, String token) throws Exception;

    // Add Multiple MenuItemAddons
    public String addMultipleMenuItemAddons(List<MenuItemAddonsEntity> menu_item_addonsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get MenuItemAddons By Createdat
    public List<MenuItemAddonsEntity> getMenuItemAddonsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get MenuItemAddons By Createdat Range
    public List<MenuItemAddonsEntity> getMenuItemAddonsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get MenuItemAddons By Createdat Range with Pagination
    public Map<String, Object> getMenuItemAddonsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
