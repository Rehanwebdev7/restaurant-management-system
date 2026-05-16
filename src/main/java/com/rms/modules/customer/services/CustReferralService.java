package com.rms.modules.customer.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.ReferralContactsEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.ReferralContactsRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.WalletTransactionsRepository;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class CustReferralService {

    @Autowired
    private CustomersRepository customersRepository;

    @Autowired
    private WalletTransactionsRepository walletTransactionsRepository;

    @Autowired
    private ReferralContactsRepository referralContactsRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    private Long getCustomerIdFromToken(String token) throws Exception {
        tokenUtil.decryptAndStoreToken(token);
        return tokenUtil.getCurrentUserId().longValue();
    }

    // Mobile number IS the referral code. Strips any leading +91/spaces.
    private String normalizeCode(String code) {
        if (code == null) return "";
        String trimmed = code.trim().replaceAll("\\s+", "");
        if (trimmed.startsWith("+91")) trimmed = trimmed.substring(3);
        if (trimmed.startsWith("91") && trimmed.length() == 12) trimmed = trimmed.substring(2);
        return trimmed;
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("\\D+", "");
        if (digits.length() > 10) {
            digits = digits.substring(digits.length() - 10);
        }
        return digits;
    }

    /**
     * Get referral code for logged-in customer (== customer's mobile number)
     */
    public Map<String, Object> getMyReferralCode(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        String mobile = customer.getMobileNumber();
        if (mobile == null || mobile.isEmpty()) {
            throw new RuntimeException("Customer mobile number missing");
        }

        // Keep referal_code column in sync so legacy lookups still work
        if (!mobile.equals(customer.getReferalCode())) {
            customer.setReferalCode(mobile);
            customersRepository.save(customer);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("referralCode", mobile);
        response.put("customerName", customer.getName());
        return response;
    }

    /**
     * Validate a referral code (mobile number)
     */
    public Map<String, Object> validateReferralCode(String code, String token) throws Exception {
        Map<String, Object> response = new LinkedHashMap<>();

        String normalized = normalizeCode(code);
        if (normalized.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Referral code cannot be empty");
            return response;
        }

        Optional<CustomersEntity> referrer = customersRepository.findByMobileNumber(normalized);
        if (referrer.isPresent()) {
            response.put("valid", true);
            response.put("referrerName", referrer.get().getName());
            response.put("message", "Valid referral code");
        } else {
            response.put("valid", false);
            response.put("message", "Invalid referral code");
        }
        return response;
    }

    /**
     * Apply referral code (referrer's mobile number) for current customer
     */
    @Transactional
    public String applyReferralCode(String code, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (customer.getReferredById() != null) {
            throw new RuntimeException("You have already used a referral code");
        }

        String normalized = normalizeCode(code);
        Optional<CustomersEntity> referrerOpt = customersRepository.findByMobileNumber(normalized);
        if (referrerOpt.isEmpty()) {
            throw new RuntimeException("Invalid referral code");
        }

        CustomersEntity referrer = referrerOpt.get();

        if (referrer.getId().equals(customerId)) {
            throw new RuntimeException("You cannot use your own referral code");
        }

        customer.setReferredById(referrer.getId());
        customersRepository.save(customer);

        return "Referral code applied successfully";
    }

    /**
     * Get referral statistics for a customer
     */
    public Map<String, Object> getReferralStats(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Long totalReferrals = customersRepository.countByReferredById(customerId);

        BigDecimal totalEarnings = walletTransactionsRepository
                .sumAmountByCustomerIdAndMessageContaining(customerId, "Referral");
        if (totalEarnings == null) {
            totalEarnings = BigDecimal.ZERO;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("referralCode", customer.getMobileNumber());
        response.put("totalReferrals", totalReferrals);
        response.put("totalEarnings", totalEarnings);
        response.put("walletBalance", customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO);
        response.put("referralSignupBonus", customer.getReferralSignupBonus() != null ? customer.getReferralSignupBonus() : BigDecimal.ZERO);
        response.put("referralRecurringBonus", customer.getReferralRecurringBonus() != null ? customer.getReferralRecurringBonus() : BigDecimal.ZERO);
        return response;
    }

    public Map<String, Object> getReferralUsers(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        List<CustomersEntity> referredUsers = customersRepository.findByReferredById(customerId);
        List<Map<String, Object>> items = new ArrayList<>();

        for (CustomersEntity referred : referredUsers) {
            Long totalOrders = ordersRepository.countByCustomerId_Id(referred.getId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("customerId", referred.getId());
            item.put("name", referred.getName());
            item.put("mobileNumber", referred.getMobileNumber());
            item.put("totalOrders", totalOrders != null ? totalOrders : 0L);
            item.put("hasOrdered", totalOrders != null && totalOrders > 0);
            items.add(item);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("referrals", items);
        response.put("totalReferrals", items.size());
        return response;
    }

    @Transactional
    public Map<String, Object> upsertReferralContacts(String token, List<Map<String, String>> contacts) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        CustomersEntity referrer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        int savedCount = 0;
        if (contacts != null) {
            for (Map<String, String> contact : contacts) {
                String name = contact != null ? contact.getOrDefault("name", "") : "";
                String phone = contact != null ? contact.getOrDefault("phone", "") : "";
                String normalized = normalizePhone(phone);
                if (normalized.isEmpty()) {
                    continue;
                }

                Optional<ReferralContactsEntity> existingOpt = referralContactsRepository
                        .findFirstByReferrerCustomerId_IdAndNormalizedPhone(referrer.getId(), normalized);

                ReferralContactsEntity entity = existingOpt.orElseGet(() -> {
                    ReferralContactsEntity e = new ReferralContactsEntity();
                    e.setReferrerCustomerId(referrer);
                    e.setNormalizedPhone(normalized);
                    return e;
                });

                entity.setContactName(name != null && !name.isEmpty() ? name : entity.getContactName());
                entity.setContactPhone(phone);

                customersRepository.findByMobileNumber(normalized).ifPresent(mapped -> {
                    entity.setMappedCustomerId(mapped.getId());
                    if (mapped.getReferredById() == null || mapped.getReferredById().equals(referrer.getId())) {
                        mapped.setReferredById(referrer.getId());
                        customersRepository.save(mapped);
                    }
                });

                referralContactsRepository.save(entity);
                savedCount++;
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("saved", savedCount);
        return response;
    }

    public Map<String, Object> getReferralContacts(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Long customerId = getCustomerIdFromToken(token);

        List<ReferralContactsEntity> contacts =
                referralContactsRepository.findByReferrerCustomerId_Id(customerId);

        List<Map<String, Object>> items = new ArrayList<>();
        for (ReferralContactsEntity contact : contacts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", contact.getId());
            item.put("name", contact.getContactName());
            item.put("phone", contact.getContactPhone());
            item.put("normalizedPhone", contact.getNormalizedPhone());
            item.put("mappedCustomerId", contact.getMappedCustomerId());
            items.add(item);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("contacts", items);
        response.put("total", items.size());
        return response;
    }

    /**
     * Credit per-customer referral rewards to referrer for an order.
     *
     * - On the referee's FIRST order → credit referrer's {@code referralSignupBonus} (one-time).
     * - On EVERY order by the referee → credit referrer's {@code referralRecurringBonus}.
     *
     * Both bonuses are read from the REFERRER's own customer record, not business settings.
     * This should be called from the order service after a successful order is persisted.
     */
    @Transactional
    public void creditReferralRewards(Long referredCustomerId, OrdersEntity order, boolean isFirstOrder) {
        try {
            CustomersEntity referredCustomer = customersRepository.findById(referredCustomerId)
                    .orElse(null);

            if (referredCustomer == null || referredCustomer.getReferredById() == null) {
                return;
            }

            CustomersEntity referrer = customersRepository.findById(referredCustomer.getReferredById())
                    .orElse(null);
            if (referrer == null) {
                return;
            }

            if (isFirstOrder) {
                BigDecimal signupBonus = referrer.getReferralSignupBonus();
                if (signupBonus != null && signupBonus.compareTo(BigDecimal.ZERO) > 0) {
                    creditWallet(referrer, signupBonus, order,
                            "Referral signup bonus for " + safeName(referredCustomer) + "'s first order");
                }
            }

            BigDecimal recurringBonus = referrer.getReferralRecurringBonus();
            if (recurringBonus != null && recurringBonus.compareTo(BigDecimal.ZERO) > 0) {
                creditWallet(referrer, recurringBonus, order,
                        "Referral recurring bonus for order by " + safeName(referredCustomer));
            }
        } catch (Exception e) {
            System.err.println("Error crediting referral reward: " + e.getMessage());
        }
    }

    private void creditWallet(CustomersEntity referrer, BigDecimal amount, OrdersEntity order, String message) {
        BigDecimal currentBalance = referrer.getWalletBalance() != null ? referrer.getWalletBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = currentBalance.add(amount);
        referrer.setWalletBalance(newBalance);
        customersRepository.save(referrer);

        WalletTransactionsEntity transaction = new WalletTransactionsEntity();
        transaction.setCustomerId(referrer);
        transaction.setOpBal(currentBalance);
        transaction.setAmount(amount);
        transaction.setClosingBal(newBalance);
        transaction.setMessage(message);
        transaction.setStatus("SUCCESS");
        transaction.setMode(1); // 1 = Credit
        transaction.setOrderId(order);

        ZoneId zoneId = ZoneId.of("Asia/Kolkata");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        transaction.setDate(LocalDate.now());
        transaction.setTime(now.toLocalTime());

        walletTransactionsRepository.save(transaction);
    }

    private String safeName(CustomersEntity c) {
        if (c == null) return "customer";
        if (c.getName() != null && !c.getName().isEmpty()) return c.getName();
        if (c.getMobileNumber() != null) return c.getMobileNumber();
        return "customer";
    }
}
