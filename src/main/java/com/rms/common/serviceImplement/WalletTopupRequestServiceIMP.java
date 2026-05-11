package com.rms.common.serviceImplement;

import com.rms.common.entities.WalletTopupRequestEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface WalletTopupRequestServiceIMP {
    // Get All Record WalletTopupRequests 
    public List<WalletTopupRequestEntity> getAllRecordWalletTopupRequest(String token) throws Exception;

    // Get All WalletTopupRequests in Pagination
    public Map<String, Object> getAllWalletTopupRequest(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single WalletTopupRequest By Id
    public WalletTopupRequestEntity getOneWalletTopupRequest(Integer id, String token) throws Exception;

    // Add/Create New WalletTopupRequest
    public String addWalletTopupRequest(WalletTopupRequestEntity wallet_topup_requestEntity, String token) throws Exception;

    // Update Existing WalletTopupRequest
    public String updateWalletTopupRequest(WalletTopupRequestEntity wallet_topup_requestEntity,String token)throws Exception;

    // Delete WalletTopupRequest By Id
    public String deleteWalletTopupRequest(Integer id, String token) throws Exception;

    // Add Multiple WalletTopupRequest
    public String addMultipleWalletTopupRequest(List<WalletTopupRequestEntity> wallet_topup_requestEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

    // Get WalletTopupRequest By Approveddate
    public List<WalletTopupRequestEntity> getWalletTopupRequestByApproveddate(LocalDate approvedDate, String token) throws Exception;

    // Get WalletTopupRequest By Approveddate Range
    public List<WalletTopupRequestEntity> getWalletTopupRequestByApproveddateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get WalletTopupRequest By Approveddate Range with Pagination
    public Map<String, Object> getWalletTopupRequestByApproveddateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get WalletTopupRequest By Date
    public List<WalletTopupRequestEntity> getWalletTopupRequestByDate(LocalDate date, String token) throws Exception;

    // Get WalletTopupRequest By Date Range
    public List<WalletTopupRequestEntity> getWalletTopupRequestByDateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get WalletTopupRequest By Date Range with Pagination
    public Map<String, Object> getWalletTopupRequestByDateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get WalletTopupRequest By Transdate
    public List<WalletTopupRequestEntity> getWalletTopupRequestByTransdate(LocalDate transDate, String token) throws Exception;

    // Get WalletTopupRequest By Transdate Range
    public List<WalletTopupRequestEntity> getWalletTopupRequestByTransdateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception;

    // Get WalletTopupRequest By Transdate Range with Pagination
    public Map<String, Object> getWalletTopupRequestByTransdateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception;

}
