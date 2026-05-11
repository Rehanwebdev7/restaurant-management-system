package com.rms.common.serviceImplement;

import com.rms.common.entities.OrderItemsEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface OrderItemsServiceIMP {
    // Get All Record OrderItemss 
    public List<OrderItemsEntity> getAllRecordOrderItems(String token) throws Exception;

    // Get All OrderItemss in Pagination
    public Map<String, Object> getAllOrderItems(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single OrderItems By Id
    public OrderItemsEntity getOneOrderItems(Long id, String token) throws Exception;

    // Add/Create New OrderItems
    public String addOrderItems(OrderItemsEntity order_itemsEntity, String token) throws Exception;

    // Update Existing OrderItems
    public String updateOrderItems(OrderItemsEntity order_itemsEntity,String token)throws Exception;

    // Delete OrderItems By Id
    public String deleteOrderItems(Long id, String token) throws Exception;

    // Add Multiple OrderItems
    public String addMultipleOrderItems(List<OrderItemsEntity> order_itemsEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get OrderItems By Createdat
    public List<OrderItemsEntity> getOrderItemsByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get OrderItems By Createdat Range
    public List<OrderItemsEntity> getOrderItemsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderItems By Createdat Range with Pagination
    public Map<String, Object> getOrderItemsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get OrderItems By Updatedat
    public List<OrderItemsEntity> getOrderItemsByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get OrderItems By Updatedat Range
    public List<OrderItemsEntity> getOrderItemsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get OrderItems By Updatedat Range with Pagination
    public Map<String, Object> getOrderItemsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
