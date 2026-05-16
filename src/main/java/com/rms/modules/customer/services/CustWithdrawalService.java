package com.rms.modules.customer.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.WalletTopupRequestEntity;
import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.entities.BankDetailsEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.WalletTopupRequestRepository;
import com.rms.common.repositories.WalletTransactionsRepository;
import com.rms.common.repositories.BankDetailsRepository;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CustWithdrawalService {

    @Autowired
    private CustomersRepository customersRepository;

    @Autowired
    private WalletTopupRequestRepository walletTopupRequestRepository;

    @Autowired
    private WalletTransactionsRepository walletTransactionsRepository;

    @Autowired
    private BankDetailsRepository bankDetailsRepository;

    @Autowired
    private TokenUtil tokenUtil;

    private Long getCustomerIdFromToken(String token) throws Exception {
        tokenUtil.decryptAndStoreToken(token);
        return tokenUtil.getCurrentUserId().longValue();
    }

    /**
     * Create withdrawal request
     */
    @Transactional
    public Map<String, Object> createWithdrawalRequest(Long bankDetailId, BigDecimal amount, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Validate amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid withdrawal amount");
        }

        // Check wallet balance
        BigDecimal walletBalance = customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO;
        if (walletBalance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient wallet balance. Available: " + walletBalance);
        }

        // Validate bank details
        BankDetailsEntity bankDetails = bankDetailsRepository.findById(bankDetailId)
                .orElseThrow(() -> new RuntimeException("Bank details not found"));

        // Check if bank details belong to this customer
        if (bankDetails.getUserId() == null || !bankDetails.getUserId().getId().equals(customer.getUserId().getId())) {
            throw new RuntimeException("Bank details do not belong to this customer");
        }

        // Check if bank details are approved
        if (!"approved".equalsIgnoreCase(bankDetails.getStatus())) {
            throw new RuntimeException("Bank details are not approved yet");
        }

        // Create withdrawal request
        WalletTopupRequestEntity request = new WalletTopupRequestEntity();
        request.setCustomerId(customer);
        request.setUserId(customer.getUserId());
        request.setBankId(bankDetails);
        request.setAmount(amount);
        request.setRequestType("WITHDRAWAL");
        request.setStatus("pending");
        request.setReason("Wallet withdrawal request");

        ZonedDateTime indianTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
        request.setTime(indianTime.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a")));

        walletTopupRequestRepository.save(request);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("requestId", request.getId());
        response.put("amount", amount);
        response.put("status", "pending");
        response.put("message", "Withdrawal request submitted successfully");
        return response;
    }

    /**
     * Get withdrawal history for customer
     */
    public Map<String, Object> getWithdrawalHistory(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<WalletTopupRequestEntity> page = walletTopupRequestRepository.findByCustomerId_IdAndRequestType(customerId, "WITHDRAWAL", pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    /**
     * Get customer wallet balance
     */
    public Map<String, Object> getWalletBalance(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("walletBalance", customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO);
        response.put("customerName", customer.getName());
        return response;
    }
}
