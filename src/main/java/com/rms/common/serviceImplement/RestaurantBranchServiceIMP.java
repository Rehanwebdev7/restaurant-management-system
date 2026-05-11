package com.rms.common.serviceImplement;

import com.rms.common.entities.RestaurantBranchEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface RestaurantBranchServiceIMP {
    // Get All Record RestaurantBranchs 
    public List<RestaurantBranchEntity> getAllRecordRestaurantBranch(String token) throws Exception;

    // Get All RestaurantBranchs in Pagination
    public Map<String, Object> getAllRestaurantBranch(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single RestaurantBranch By Id
    public RestaurantBranchEntity getOneRestaurantBranch(Long id, String token) throws Exception;

    // Add/Create New RestaurantBranch
    public String addRestaurantBranch(RestaurantBranchEntity restaurant_branchEntity, String token) throws Exception;

    // Update Existing RestaurantBranch
    public String updateRestaurantBranch(RestaurantBranchEntity restaurant_branchEntity,String token)throws Exception;

    // Delete RestaurantBranch By Id
    public String deleteRestaurantBranch(Long id, String token) throws Exception;

    // Add Multiple RestaurantBranch
    public String addMultipleRestaurantBranch(List<RestaurantBranchEntity> restaurant_branchEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get RestaurantBranch By Createdat
    public List<RestaurantBranchEntity> getRestaurantBranchByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get RestaurantBranch By Createdat Range
    public List<RestaurantBranchEntity> getRestaurantBranchByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get RestaurantBranch By Createdat Range with Pagination
    public Map<String, Object> getRestaurantBranchByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get RestaurantBranch By Updatedat
    public List<RestaurantBranchEntity> getRestaurantBranchByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get RestaurantBranch By Updatedat Range
    public List<RestaurantBranchEntity> getRestaurantBranchByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get RestaurantBranch By Updatedat Range with Pagination
    public Map<String, Object> getRestaurantBranchByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
