package com.rms.common.serviceImplement;

import com.rms.common.entities.SectionEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface SectionServiceIMP {
    // Get All Record Sections 
    public List<SectionEntity> getAllRecordSection(String token) throws Exception;

    // Get All Sections in Pagination
    public Map<String, Object> getAllSection(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Section By Id
    public SectionEntity getOneSection(Long id, String token) throws Exception;

    // Add/Create New Section
    public String addSection(SectionEntity sectionEntity, String token) throws Exception;

    // Update Existing Section
    public String updateSection(SectionEntity sectionEntity,String token)throws Exception;

    // Delete Section By Id
    public String deleteSection(Long id, String token) throws Exception;

    // Add Multiple Section
    public String addMultipleSection(List<SectionEntity> sectionEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
