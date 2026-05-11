package com.rms.common.serviceImplement;

import com.rms.common.entities.CouponUsageLimitEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface CouponUsageLimitServiceIMP {
    // Get All Record CouponUsageLimits 
    public List<CouponUsageLimitEntity> getAllRecordCouponUsageLimit(String token) throws Exception;

    // Get All CouponUsageLimits in Pagination
    public Map<String, Object> getAllCouponUsageLimit(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single CouponUsageLimit By Id
    public CouponUsageLimitEntity getOneCouponUsageLimit(Integer id, String token) throws Exception;

    // Add/Create New CouponUsageLimit
    public String addCouponUsageLimit(CouponUsageLimitEntity coupon_usage_limitEntity, String token) throws Exception;

    // Update Existing CouponUsageLimit
    public String updateCouponUsageLimit(CouponUsageLimitEntity coupon_usage_limitEntity,String token)throws Exception;

    // Delete CouponUsageLimit By Id
    public String deleteCouponUsageLimit(Integer id, String token) throws Exception;

    // Add Multiple CouponUsageLimit
    public String addMultipleCouponUsageLimit(List<CouponUsageLimitEntity> coupon_usage_limitEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get CouponUsageLimit By Lastupdateat
    public List<CouponUsageLimitEntity> getCouponUsageLimitByLastupdateat(LocalDate lastUpdateAt, String token) throws Exception;

    // Get CouponUsageLimit By Lastupdateat Range
    public List<CouponUsageLimitEntity> getCouponUsageLimitByLastupdateatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get CouponUsageLimit By Lastupdateat Range with Pagination
    public Map<String, Object> getCouponUsageLimitByLastupdateatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
