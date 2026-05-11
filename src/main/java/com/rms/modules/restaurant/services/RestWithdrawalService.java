package com.rms.modules.restaurant.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.WalletTopupRequestEntity;
import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.WalletTopupRequestRepository;
import com.rms.common.repositories.WalletTransactionsRepository;
import com.rms.common.repositories.UsersRepository;
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
public class RestWithdrawalService {

    @Autowired
    private WalletTopupRequestRepository walletTopupRequestRepository;

    @Autowired
    private WalletTransactionsRepository walletTransactionsRepository;

    @Autowired
    private CustomersRepository customersRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    private Long getRestaurantIdFromToken(String token) throws Exception {
        tokenUtil.decryptAndStoreToken(token);
        return tokenUtil.getCurrentUserId().longValue();
    }

    /**
     * Get all withdrawal requests for restaurant
     */
    public Map<String, Object> getAllWithdrawals(Integer pageNumber, Integer pageSize, String status, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<WalletTopupRequestEntity> page;

        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            page = walletTopupRequestRepository.findByRequestTypeAndCustomerId_UserId_IdAndStatus("WITHDRAWAL", restaurantId, status.toLowerCase(), pageable);
        } else {
            page = walletTopupRequestRepository.findByRequestTypeAndCustomerId_UserId_Id("WITHDRAWAL", restaurantId, pageable);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    /**
     * Approve withdrawal request
     */
    @Transactional
    public String approveWithdrawal(Integer requestId, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        WalletTopupRequestEntity request = walletTopupRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));

        // Validate request belongs to this restaurant's customers
        if (request.getCustomerId() == null || request.getCustomerId().getUserId() == null ||
            !request.getCustomerId().getUserId().getId().equals(restaurantId)) {
            throw new RuntimeException("Unauthorized to approve this request");
        }

        // Validate request type
        if (!"WITHDRAWAL".equals(request.getRequestType())) {
            throw new RuntimeException("This is not a withdrawal request");
        }

        // Validate status
        if (!"pending".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Request is already " + request.getStatus());
        }

        // Update request status
        UsersEntity approver = usersRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        request.setStatus("approved");
        request.setApprovedById(approver);
        request.setApprovedDate(LocalDateTime.now());

        walletTopupRequestRepository.save(request);

        return "Withdrawal request approved successfully";
    }

    /**
     * Reject withdrawal request
     */
    @Transactional
    public String rejectWithdrawal(Integer requestId, String remarks, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        WalletTopupRequestEntity request = walletTopupRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));

        // Validate request belongs to this restaurant's customers
        if (request.getCustomerId() == null || request.getCustomerId().getUserId() == null ||
            !request.getCustomerId().getUserId().getId().equals(restaurantId)) {
            throw new RuntimeException("Unauthorized to reject this request");
        }

        // Validate status
        if (!"pending".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Request is already " + request.getStatus());
        }

        // Update request status
        UsersEntity approver = usersRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        request.setStatus("rejected");
        request.setApprovedById(approver);
        request.setApprovedDate(LocalDateTime.now());
        if (remarks != null && !remarks.trim().isEmpty()) {
            request.setRemark(remarks);
        }

        walletTopupRequestRepository.save(request);

        return "Withdrawal request rejected";
    }

    /**
     * Mark withdrawal as paid and process wallet deduction
     */
    @Transactional
    public String markAsPaid(Integer requestId, String utr, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        WalletTopupRequestEntity request = walletTopupRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));

        // Validate request belongs to this restaurant's customers
        if (request.getCustomerId() == null || request.getCustomerId().getUserId() == null ||
            !request.getCustomerId().getUserId().getId().equals(restaurantId)) {
            throw new RuntimeException("Unauthorized to process this request");
        }

        // Validate status
        if (!"approved".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Only approved requests can be marked as paid");
        }

        CustomersEntity customer = request.getCustomerId();
        BigDecimal amount = request.getAmount();

        // Check wallet balance again
        BigDecimal currentBalance = customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO;
        if (currentBalance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient wallet balance. Current balance: " + currentBalance);
        }

        // Deduct from wallet
        BigDecimal newBalance = currentBalance.subtract(amount);
        customer.setWalletBalance(newBalance);
        customersRepository.save(customer);

        // Create wallet transaction record
        WalletTransactionsEntity transaction = new WalletTransactionsEntity();
        transaction.setCustomerId(customer);
        transaction.setOpBal(currentBalance);
        transaction.setAmount(amount.negate()); // Negative for withdrawal
        transaction.setClosingBal(newBalance);
        transaction.setMessage("Wallet withdrawal - " + (utr != null ? "UTR: " + utr : "Request ID: " + requestId));
        transaction.setStatus("SUCCESS");
        transaction.setMode(3); // 3 = Withdrawal
        transaction.setBankDetailId(request.getBankId());
        transaction.setBankRefId(utr);

        ZoneId zoneId = ZoneId.of("Asia/Kolkata");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        transaction.setDate(LocalDate.now());
        transaction.setTime(now.toLocalTime());

        walletTransactionsRepository.save(transaction);

        // Update request status
        request.setStatus("paid");
        request.setUtr(utr);
        request.setTransDate(LocalDateTime.now());

        walletTopupRequestRepository.save(request);

        return "Withdrawal marked as paid. Amount debited: " + amount;
    }

    /**
     * Get withdrawal request by ID
     */
    public WalletTopupRequestEntity getWithdrawalById(Integer requestId, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        WalletTopupRequestEntity request = walletTopupRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));

        // Validate request belongs to this restaurant's customers
        if (request.getCustomerId() == null || request.getCustomerId().getUserId() == null ||
            !request.getCustomerId().getUserId().getId().equals(restaurantId)) {
            throw new RuntimeException("Unauthorized to view this request");
        }

        return request;
    }
}
