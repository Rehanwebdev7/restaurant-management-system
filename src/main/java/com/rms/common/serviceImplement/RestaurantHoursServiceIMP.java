package com.rms.common.serviceImplement;

import com.rms.common.entities.RestaurantHoursEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface RestaurantHoursServiceIMP {
    // Get All Record RestaurantHourss 
    public List<RestaurantHoursEntity> getAllRecordRestaurantHours(String token) throws Exception;

    // Get All RestaurantHourss in Pagination
    public Map<String, Object> getAllRestaurantHours(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single RestaurantHours By Id
    public RestaurantHoursEntity getOneRestaurantHours(Long id, String token) throws Exception;

    // Add/Create New RestaurantHours
    public String addRestaurantHours(RestaurantHoursEntity restaurant_hoursEntity, String token) throws Exception;

    // Update Existing RestaurantHours
    public String updateRestaurantHours(RestaurantHoursEntity restaurant_hoursEntity,String token)throws Exception;

    // Delete RestaurantHours By Id
    public String deleteRestaurantHours(Long id, String token) throws Exception;

    // Add Multiple RestaurantHours
    public String addMultipleRestaurantHours(List<RestaurantHoursEntity> restaurant_hoursEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get RestaurantHours By Specialdate
    public List<RestaurantHoursEntity> getRestaurantHoursBySpecialdate(LocalDate specialDate, String token) throws Exception;

    // Get RestaurantHours By Specialdate Range
    public List<RestaurantHoursEntity> getRestaurantHoursBySpecialdateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get RestaurantHours By Specialdate Range with Pagination
    public Map<String, Object> getRestaurantHoursBySpecialdateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get RestaurantHours By Createdat
    public List<RestaurantHoursEntity> getRestaurantHoursByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get RestaurantHours By Createdat Range
    public List<RestaurantHoursEntity> getRestaurantHoursByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get RestaurantHours By Createdat Range with Pagination
    public Map<String, Object> getRestaurantHoursByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get RestaurantHours By Updatedat
    public List<RestaurantHoursEntity> getRestaurantHoursByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get RestaurantHours By Updatedat Range
    public List<RestaurantHoursEntity> getRestaurantHoursByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get RestaurantHours By Updatedat Range with Pagination
    public Map<String, Object> getRestaurantHoursByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
