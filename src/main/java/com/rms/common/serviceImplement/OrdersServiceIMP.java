package com.rms.common.serviceImplement;

import com.rms.common.entities.OrdersEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface OrdersServiceIMP {
    // Get All Record Orderss 
    public List<OrdersEntity> getAllRecordOrders(String token) throws Exception;

    // Get All Orderss in Pagination
    public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Orders By Id
    public OrdersEntity getOneOrders(Long id, String token) throws Exception;

    // Add/Create New Orders
    public String addOrders(OrdersEntity ordersEntity, String token) throws Exception;

    // Update Existing Orders
    public String updateOrders(OrdersEntity ordersEntity,String token)throws Exception;

    // Delete Orders By Id
    public String deleteOrders(Long id, String token) throws Exception;

    // Add Multiple Orders
    public String addMultipleOrders(List<OrdersEntity> ordersEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Orders By Createdat
    public List<OrdersEntity> getOrdersByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Orders By Createdat Range
    public List<OrdersEntity> getOrdersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Orders By Createdat Range with Pagination
    public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Orders By Updatedat
    public List<OrdersEntity> getOrdersByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get Orders By Updatedat Range
    public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Orders By Updatedat Range with Pagination
    public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Orders By Completedat
    public List<OrdersEntity> getOrdersByCompletedat(LocalDate completedAt, String token) throws Exception;

    // Get Orders By Completedat Range
    public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Orders By Completedat Range with Pagination
    public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
