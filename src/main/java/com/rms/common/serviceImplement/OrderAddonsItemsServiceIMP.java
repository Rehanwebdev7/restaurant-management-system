package com.rms.common.serviceImplement;

import com.rms.common.entities.OrderAddonsItemsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface OrderAddonsItemsServiceIMP {
    // Get All Record OrderAddonsItemss 
    public List<OrderAddonsItemsEntity> getAllRecordOrderAddonsItems(String token) throws Exception;

    // Get All OrderAddonsItemss in Pagination
    public Map<String, Object> getAllOrderAddonsItems(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single OrderAddonsItems By Id
    public OrderAddonsItemsEntity getOneOrderAddonsItems(Long id, String token) throws Exception;

    // Add/Create New OrderAddonsItems
    public String addOrderAddonsItems(OrderAddonsItemsEntity order_addons_itemsEntity, String token) throws Exception;

    // Update Existing OrderAddonsItems
    public String updateOrderAddonsItems(OrderAddonsItemsEntity order_addons_itemsEntity,String token)throws Exception;

    // Delete OrderAddonsItems By Id
    public String deleteOrderAddonsItems(Long id, String token) throws Exception;

    // Add Multiple OrderAddonsItems
    public String addMultipleOrderAddonsItems(List<OrderAddonsItemsEntity> order_addons_itemsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
