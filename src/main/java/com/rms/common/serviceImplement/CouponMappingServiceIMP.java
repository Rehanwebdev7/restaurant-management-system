package com.rms.common.serviceImplement;

import com.rms.common.entities.CouponMappingEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface CouponMappingServiceIMP {
    // Get All Record CouponMappings 
    public List<CouponMappingEntity> getAllRecordCouponMapping(String token) throws Exception;

    // Get All CouponMappings in Pagination
    public Map<String, Object> getAllCouponMapping(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single CouponMapping By Id
    public CouponMappingEntity getOneCouponMapping(Integer id, String token) throws Exception;

    // Add/Create New CouponMapping
    public String addCouponMapping(CouponMappingEntity coupon_mappingEntity, String token) throws Exception;

    // Update Existing CouponMapping
    public String updateCouponMapping(CouponMappingEntity coupon_mappingEntity,String token)throws Exception;

    // Delete CouponMapping By Id
    public String deleteCouponMapping(Integer id, String token) throws Exception;

    // Add Multiple CouponMapping
    public String addMultipleCouponMapping(List<CouponMappingEntity> coupon_mappingEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
