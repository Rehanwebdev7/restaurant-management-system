package com.rms.common.util;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.OutstandingEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.OutstandingRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.WalletTransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class JavaProcedures {

    @Autowired
    private WalletTransactionsRepository walletTransactionsRepository;

    @Autowired
    private OutstandingRepository outstandingRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Transactional
    public String outstandingTransactionProcedure(Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            String orderId = payload.get("orderId") != null ? payload.get("orderId").toString() : null;
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            String mode = payload.getOrDefault("mode", "CREDIT").toString();
            String service = payload.get("service") != null ? payload.get("service").toString() : null;
            String remark = payload.get("remark") != null ? payload.get("remark").toString() : null;

            UsersEntity user = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            BigDecimal currentBal = user.getOutstandingBalance() != null ? user.getOutstandingBalance() : BigDecimal.ZERO;

            boolean isCredit = "CREDIT".equalsIgnoreCase(mode);
            BigDecimal closingBal = isCredit ? currentBal.add(amount) : currentBal.subtract(amount);

            OutstandingEntity outstanding = new OutstandingEntity();
            outstanding.setUserId(user);
            outstanding.setMode(isCredit ? 0 : 1);
            outstanding.setService(service);
            outstanding.setOpeningBal(currentBal);
            outstanding.setAmount(amount);
            outstanding.setClosingBal(closingBal);
            outstanding.setOrderId(orderId);
            outstanding.setRemark(remark);

            outstandingRepository.save(outstanding);

            if (isCredit) {
                usersRepository.addOutstandingBalance(userId.intValue(), amount);
            } else {
                usersRepository.deductOutstandingBalance(userId.intValue(), amount);
            }

            System.out.println("✅ Outstanding transaction saved: " + mode + " ₹" + amount + " for user " + userId);
            return "SUCCESS";
        } catch (Exception e) {
            System.out.println("❌ outstandingTransactionProcedure error: " + e.getMessage());
            throw new RuntimeException("Outstanding transaction failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String walletTransactionProcedure(Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            Object orderIdObj = payload.get("orderId");
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            String mode = payload.getOrDefault("mode", "credit").toString();
            String remarks = payload.get("remarks") != null ? payload.get("remarks").toString() : null;

            UsersEntity user = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            BigDecimal currentBal = user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;
            boolean isCredit = "credit".equalsIgnoreCase(mode);
            BigDecimal closingBal = isCredit ? currentBal.add(amount) : currentBal.subtract(amount);

            WalletTransactionsEntity tx = new WalletTransactionsEntity();
            tx.setUserId(user);
            tx.setMode(isCredit ? 0 : 1);
            tx.setOpBal(currentBal);
            tx.setAmount(amount);
            tx.setClosingBal(closingBal);
            tx.setMessage(remarks);
            tx.setStatus("SUCCESS");

            // Store order ID if provided (avoid loading full entity to prevent 1664-column error)
            if (orderIdObj != null) {
                try {
                    Long orderId = Long.valueOf(orderIdObj.toString());
                    // Use a direct query to verify order exists without loading all columns
                    String orderNum = ordersRepository.findOrderNumber(orderId);
                    if (orderNum != null) {
                        OrdersEntity order = new OrdersEntity();
                        order.setId(orderId);
                        tx.setOrderId(order);
                    }
                } catch (Exception ignored) {}
            }

            walletTransactionsRepository.save(tx);

            if (isCredit) {
                usersRepository.addBalance(userId.intValue(), amount);
            } else {
                usersRepository.deductBalance(userId.intValue(), amount);
            }

            System.out.println("✅ Wallet transaction saved: " + mode + " ₹" + amount + " for user " + userId);
            return "SUCCESS";
        } catch (Exception e) {
            System.out.println("❌ walletTransactionProcedure error: " + e.getMessage());
            throw new RuntimeException("Wallet transaction failed: " + e.getMessage(), e);
        }
    }
}
