package com.rms.modules.kitchen.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.AddonsEntity;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import com.rms.common.repositories.AddonsRepository;
import com.rms.common.repositories.MenuCategoryRepository;
import com.rms.common.repositories.MenuSubcategoryRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import org.springframework.data.domain.Sort;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.time.LocalTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.math.RoundingMode;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
public class KitDashboardService {
	@Autowired
	private OrdersRepository ordersRepository;
	
	@Autowired
	private TokenUtil tokenUtil;
	
	@Autowired
	UsersRepository usersRepository;
	
//	@Transactional(readOnly = true)
//	public Map<String, Object> getKitchenDashboardStats(
//	        String token,
//	        LocalDate fromDate,
//	        LocalDate toDate
//	) throws Exception {
//
//	    // 🔐 KITCHEN AUTH
//	    Authorization.authorizeKitchen(token);
//
//	    // 🔓 TOKEN → KITCHEN USER
//	    tokenUtil.decryptAndStoreToken(token);
//	    Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();
//	    tokenUtil.clearTokenData();
//
//	    // ================= KITCHEN USER =================
//	    UsersEntity kitchenUser = usersRepository.findById(kitchenUserId)
//	            .orElseThrow(() -> new RuntimeException("Kitchen user not found"));
//
//	    // ================= BRANCH =================
//	    if (kitchenUser.getBranchId() == null) {
//	        throw new RuntimeException("Branch not mapped with kitchen user");
//	    }
//
//	    UsersEntity branch = kitchenUser.getBranchId();
//
//	    // ================= DATE RANGE =================
//	    LocalDateTime from = fromDate.atStartOfDay();
//	    LocalDateTime to = toDate.atTime(LocalTime.MAX);
//
//	    // ================= DASHBOARD DATA =================
//	    Long totalOrders =
//	            ordersRepository.countTotalOrdersByBranch(branch, from, to);
//
//	    BigDecimal totalRevenue =
//	            ordersRepository.getTotalRevenueByBranch(branch, from, to);
//
//	    List<Object[]> statusWise =
//	            ordersRepository.countOrdersByStatusByBranch(branch, from, to);
//
//	    Map<String, Long> statusMap = new LinkedHashMap<>();
//	    for (Object[] row : statusWise) {
//	        statusMap.put(
//	                String.valueOf(row[0]),
//	                (Long) row[1]
//	        );
//	    }
//
//	    // ================= RESPONSE =================
//	    Map<String, Object> response = new LinkedHashMap<>();
//	    response.put("branchId", branch.getId());
//	    response.put("branchName", branch.getName());
//	    response.put("fromDate", fromDate);
//	    response.put("toDate", toDate);
//	    response.put("totalOrders", totalOrders);
//	    response.put("totalRevenue", totalRevenue);
//	    response.put("ordersByStatus", statusMap);
//
//	    return response;
//	}


	@Transactional(readOnly = true)
	public Map<String, Object> getKitchenDashboardStats(
	        String token,
	        LocalDate fromDate,
	        LocalDate toDate
	) throws Exception {

	    System.out.println("\n========== KITCHEN DASHBOARD START ==========");

	    // 🔐 AUTH
	    Authorization.authorizeKitchen(token);

	    // 🔓 TOKEN DATA
	    tokenUtil.decryptAndStoreToken(token);
	    Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();
	    tokenUtil.clearTokenData();

	    System.out.println("Kitchen User ID : " + kitchenUserId);

	    // ================= USER =================
	    UsersEntity kitchenUser = usersRepository.findById(kitchenUserId)
	            .orElseThrow(() -> new RuntimeException("Kitchen user not found"));

	    if (kitchenUser.getBranchId() == null)
	        throw new RuntimeException("Branch not mapped with kitchen user");

	    UsersEntity branch = kitchenUser.getBranchId();

	    System.out.println("Branch ID : " + branch.getId());

	    // ================= DATE RANGE =================
	    LocalDateTime from = fromDate.atStartOfDay();
	    LocalDateTime to = toDate.atTime(LocalTime.MAX);

	    // ================= TOTALS =================
	    // PENDING: branch-scoped (unassigned orders)
	    Long pendingCount = ordersRepository.countPendingByBranchIdAndDate("PENDING", branch.getId(), from, to);

	    // Revenue: branch-scoped (for branch reporting)
	    BigDecimal totalRevenue =
	            ordersRepository.getTotalRevenueByBranch(branch, from, to);

	    // ================= STATUS COUNTS (KITCHEN-SCOPED) =================
	    // Non-PENDING statuses: kitchen-scoped (only this kitchen user's orders)
	    List<Object[]> kitchenStatuses =
	            ordersRepository.countByKitchenIdAndStatusNotPendingAndDate(kitchenUserId, from, to);

	    Map<String, Long> statusMap = new LinkedHashMap<>();
	    statusMap.put("PENDING", pendingCount);

	    long preparingCount = 0L;
	    long readyCount = 0L;

	    for (Object[] row : kitchenStatuses) {

	        String status = String.valueOf(row[0]).toUpperCase();
	        Long count = (Long) row[1];

	        statusMap.put(status, count);

	        if ("PREPARING_ORDER".equalsIgnoreCase(status)
	                || "PREPARING".equalsIgnoreCase(status)
	                || "CONFIRMED".equalsIgnoreCase(status)
	                || "ACCEPTED_ORDER".equalsIgnoreCase(status)) {
	            preparingCount += count;
	        }

	        if ("READY_FOR_ORDER".equalsIgnoreCase(status)
	                || "READY".equalsIgnoreCase(status)) {
	            readyCount += count;
	        }

	    }

	    // Total: sum of kitchen-scoped orders (PENDING + PREPARING + READY)
	    Long totalOrders = pendingCount + preparingCount + readyCount;

	    System.out.println("Preparing Orders : " + preparingCount);
	    System.out.println("Ready Orders     : " + readyCount);

	    // ================= RESPONSE =================
	    Map<String, Object> response = new LinkedHashMap<>();
	    response.put("branchId", branch.getId());
	    response.put("branchName", branch.getName());
	    response.put("fromDate", fromDate);
	    response.put("toDate", toDate);
	    response.put("totalOrders", totalOrders);
	    response.put("totalRevenue", totalRevenue);

	    response.put("preparingOrders", preparingCount);
	    response.put("readyOrders", readyCount);

	    response.put("ordersByStatus", statusMap);

	    System.out.println("========== KITCHEN DASHBOARD END ==========\n");

	    return response;
	}

	



}
