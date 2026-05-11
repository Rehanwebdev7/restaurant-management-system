package com.rms.common.serviceImplement;

import com.rms.common.entities.SmsFormatesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface SmsFormatesServiceIMP {
    // Get All Record SmsFormatess 
    public List<SmsFormatesEntity> getAllRecordSmsFormates(String token) throws Exception;

    // Get All SmsFormatess in Pagination
    public Map<String, Object> getAllSmsFormates(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single SmsFormates By Id
    public SmsFormatesEntity getOneSmsFormates(Integer id, String token) throws Exception;

    // Add/Create New SmsFormates
    public String addSmsFormates(SmsFormatesEntity sms_formatesEntity, String token) throws Exception;

    // Update Existing SmsFormates
    public String updateSmsFormates(SmsFormatesEntity sms_formatesEntity,String token)throws Exception;

    // Delete SmsFormates By Id
    public String deleteSmsFormates(Integer id, String token) throws Exception;

    // Add Multiple SmsFormates
    public String addMultipleSmsFormates(List<SmsFormatesEntity> sms_formatesEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
