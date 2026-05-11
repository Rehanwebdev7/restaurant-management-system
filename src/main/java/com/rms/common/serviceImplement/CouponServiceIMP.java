package com.rms.common.serviceImplement;

import com.rms.common.entities.CouponEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface CouponServiceIMP {
    // Get All Record Coupons 
    public List<CouponEntity> getAllRecordCoupon(String token) throws Exception;

    // Get All Coupons in Pagination
    public Map<String, Object> getAllCoupon(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single Coupon By Id
    public CouponEntity getOneCoupon(Integer id, String token) throws Exception;

    // Add/Create New Coupon
    public String addCoupon(CouponEntity couponEntity, String token) throws Exception;

    // Update Existing Coupon
    public String updateCoupon(CouponEntity couponEntity,String token)throws Exception;

    // Delete Coupon By Id
    public String deleteCoupon(Integer id, String token) throws Exception;

    // Add Multiple Coupon
    public String addMultipleCoupon(List<CouponEntity> couponEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get Coupon By Validity
    public List<CouponEntity> getCouponByValidity(LocalDate validity, String token) throws Exception;

    // Get Coupon By Validity Range
    public List<CouponEntity> getCouponByValidityBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Coupon By Validity Range with Pagination
    public Map<String, Object> getCouponByValidityBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Coupon By Createdat
    public List<CouponEntity> getCouponByCreatedat(LocalDate createdAt, String token) throws Exception;

    // Get Coupon By Createdat Range
    public List<CouponEntity> getCouponByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get Coupon By Createdat Range with Pagination
    public Map<String, Object> getCouponByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Available Coupons (global, suggested, firstOrder)
    default Map<String, Object> getAvailableCoupons(Map<String, Object> requestBody, String token) throws Exception {
        throw new UnsupportedOperationException("Not implemented");
    }

    // Apply Coupon (couponCode, menuItemId, customerId)
    default Map<String, Object> applyCoupon(Map<String, Object> requestBody, String token) throws Exception {
        throw new UnsupportedOperationException("Not implemented");
    }

}
