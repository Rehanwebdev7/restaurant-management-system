package com.rms.common.serviceImplement;

import com.rms.common.entities.SlidersEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface SlidersServiceIMP {
    // Get All Record Sliderss 
    public List<SlidersEntity> getAllRecordSliders(String token) throws Exception;

    // Get All Sliderss in Pagination
    public Map<String, Object> getAllSliders(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Sliders By Id
    public SlidersEntity getOneSliders(Long id, String token) throws Exception;

    // Add/Create New Sliders
    public String addSliders(SlidersEntity slidersEntity, String token) throws Exception;

    // Update Existing Sliders
    public String updateSliders(SlidersEntity slidersEntity,String token)throws Exception;

    // Delete Sliders By Id
    public String deleteSliders(Long id, String token) throws Exception;

    // Add Multiple Sliders
    public String addMultipleSliders(List<SlidersEntity> slidersEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
