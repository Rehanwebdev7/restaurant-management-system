package com.rms.common.services;

import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.AES256Util;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class BranchStatusService {

    @Autowired
    private UsersRepository usersRepository;

    public void stopOrders(Long branchId, String token) {
        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found: " + branchId));

        String stoppedBy = "admin";
        try {
            String decrypted = AES256Util.decrypt(token);
            JSONObject json = new JSONObject(decrypted);
            stoppedBy = json.optString("userType", "admin");
        } catch (Exception ignored) {}

        branch.setIsOrderStopped(true);
        branch.setOrderStoppedAt(LocalDateTime.now());
        branch.setOrderStoppedBy(stoppedBy);
        usersRepository.save(branch);
    }

    public void scheduleRelease(Long branchId, String token) {
        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found: " + branchId));
        branch.setIsOrderStopped(false);
        branch.setOrderStoppedAt(null);
        branch.setOrderStoppedBy(null);
        usersRepository.save(branch);
    }

    public void forceRelease(Long branchId, String token) {
        scheduleRelease(branchId, token);
    }

    public Object getBranchStatus(Long branchId, String token) {
        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found: " + branchId));

        Map<String, Object> status = new HashMap<>();
        status.put("branchId", branchId);
        status.put("branchName", branch.getName());
        status.put("adminStopped", Boolean.TRUE.equals(branch.getIsOrderStopped()));
        status.put("orderStoppedAt", branch.getOrderStoppedAt() != null ? branch.getOrderStoppedAt().toString() : null);
        status.put("orderStoppedBy", branch.getOrderStoppedBy());
        return status;
    }

    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        return null;
    }
}
