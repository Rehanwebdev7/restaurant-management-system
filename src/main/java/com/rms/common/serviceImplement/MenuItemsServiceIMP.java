package com.rms.common.serviceImplement;

import com.rms.common.entities.MenuItemsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface MenuItemsServiceIMP {
    // Get All Record MenuItemss 
    public List<MenuItemsEntity> getAllRecordMenuItems(String token) throws Exception;

    // Get All MenuItemss in Pagination
    public Map<String, Object> getAllMenuItems(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single MenuItems By Id
    public MenuItemsEntity getOneMenuItems(Long id, String token) throws Exception;

    // Add/Create New MenuItems
    public String addMenuItems(MenuItemsEntity menu_itemsEntity, String token) throws Exception;

    // Update Existing MenuItems
    public String updateMenuItems(MenuItemsEntity menu_itemsEntity,String token)throws Exception;

    // Delete MenuItems By Id
    public String deleteMenuItems(Long id, String token) throws Exception;

    // Add Multiple MenuItems
    public String addMultipleMenuItems(List<MenuItemsEntity> menu_itemsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
