package com.rms.common.serviceImplement;

import com.rms.common.entities.CitiesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface CitiesServiceIMP {
    // Get All Record Citiess 
    public List<CitiesEntity> getAllRecordCities(String token) throws Exception;

    // Get All Citiess in Pagination
    public Map<String, Object> getAllCities(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Cities By Id
    public CitiesEntity getOneCities(Integer id, String token) throws Exception;

    // Add/Create New Cities
    public String addCities(CitiesEntity citiesEntity, String token) throws Exception;

    // Update Existing Cities
    public String updateCities(CitiesEntity citiesEntity,String token)throws Exception;

    // Delete Cities By Id
    public String deleteCities(Integer id, String token) throws Exception;

    // Add Multiple Cities
    public String addMultipleCities(List<CitiesEntity> citiesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Cities By Createdat
    public List<CitiesEntity> getCitiesByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Cities By Createdat Range
    public List<CitiesEntity> getCitiesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Cities By Createdat Range with Pagination
    public Map<String, Object> getCitiesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Cities By Updatedat
    public List<CitiesEntity> getCitiesByUpdatedat(LocalDate updatedAt, String token) throws Exception;

    // Get Cities By Updatedat Range
    public List<CitiesEntity> getCitiesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Cities By Updatedat Range with Pagination
    public Map<String, Object> getCitiesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
