package com.rms.common.serviceImplement;

import com.rms.common.entities.TableBookingEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface TableBookingServiceIMP {
    // Get All Record TableBookings 
    public List<TableBookingEntity> getAllRecordTableBooking(String token) throws Exception;

    // Get All TableBookings in Pagination
    public Map<String, Object> getAllTableBooking(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single TableBooking By Id
    public TableBookingEntity getOneTableBooking(Long id, String token) throws Exception;

    // Add/Create New TableBooking
    public String addTableBooking(TableBookingEntity table_bookingEntity, String token) throws Exception;

    // Update Existing TableBooking
    public String updateTableBooking(TableBookingEntity table_bookingEntity,String token)throws Exception;

    // Delete TableBooking By Id
    public String deleteTableBooking(Long id, String token) throws Exception;

    // Add Multiple TableBooking
    public String addMultipleTableBooking(List<TableBookingEntity> table_bookingEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get TableBooking By Bookingdate
    public List<TableBookingEntity> getTableBookingByBookingdate(LocalDate bookingDate, String token) throws Exception;

    // Get TableBooking By Bookingdate Range
    public List<TableBookingEntity> getTableBookingByBookingdateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get TableBooking By Bookingdate Range with Pagination
    public Map<String, Object> getTableBookingByBookingdateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
