package com.rms.modules.customer.services;

import com.rms.common.entities.BankDetailsEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.repositories.BankDetailsRepository;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CustBankDetailsService {

    @Autowired
    private CustomersRepository customersRepository;

    @Autowired
    private BankDetailsRepository bankDetailsRepository;

    @Autowired
    private TokenUtil tokenUtil;

    public String addBankDetails(BankDetailsEntity bankDetailsEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        tokenUtil.decryptAndStoreToken(token);
        Long customerId = tokenUtil.getCurrentUserId().longValue();

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BankDetailsEntity newEntity = new BankDetailsEntity();
        for (Field field : BankDetailsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(bankDetailsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        newEntity.setCustomerId(customer);
        newEntity.setUserId(customer.getUserId());
        bankDetailsRepository.save(newEntity);
        return "Added Successfully";
    }

    public Map<String, Object> getMyBankDetails(Integer pageNumber, Integer pageSize, String status, String token)
            throws Exception {
        Authorization.authorizeCustomer(token);
        tokenUtil.decryptAndStoreToken(token);
        Long customerId = tokenUtil.getCurrentUserId().longValue();

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<BankDetailsEntity> page;

        if (status != null && !status.isBlank()) {
            page = bankDetailsRepository.findByCustomerIdAndStatusIgnoreCase(customer, status.trim(), pageable);
        } else {
            page = bankDetailsRepository.findByCustomerId(customer, pageable);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }
}
