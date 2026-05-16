package com.rms.modules.branch.services;

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
public class BrDashboardService {
	@Autowired
	private OrdersRepository ordersRepository;
	
	@Autowired
	private TokenUtil tokenUtil;
	
	@Autowired
	UsersRepository usersRepository;

//	@Transactional(readOnly = true)
//	public Map<String, Object> getDashboardData(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
//
//		System.out.println("🚀 Dashboard Service Started");
//
//		// 🔐 Admin Authorization
//		Authorization.authorizeAdmin(token);
//		System.out.println("✅ Admin Authorized");
//
//		LocalDateTime fromDateTime = fromDate.atStartOfDay();
//		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);
//
//		System.out.println("📅 From: " + fromDateTime);
//		System.out.println("📅 To: " + toDateTime);
//
//		// ================= SUMMARY =================
//		Long totalOrders = ordersRepository.countTotalOrders(fromDateTime, toDateTime);
//		System.out.println("📊 Total Orders: " + totalOrders);
//
//		BigDecimal totalRevenue = ordersRepository.getTotalRevenue(fromDateTime, toDateTime);
//		System.out.println("💰 Total Revenue: " + totalRevenue);
//
//		if (totalRevenue == null) {
//			totalRevenue = BigDecimal.ZERO;
//			System.out.println("⚠️ Total Revenue was null, set to ZERO");
//		}
//
//		BigDecimal averageOrderValue = BigDecimal.ZERO;
//		if (totalOrders != null && totalOrders > 0) {
//			averageOrderValue = totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
//		}
//
//		System.out.println("📈 Average Order Value: " + averageOrderValue);
//
//		Map<String, Object> summary = new LinkedHashMap<>();
//		summary.put("totalOrders", totalOrders);
//		summary.put("totalRevenue", totalRevenue);
//		summary.put("averageOrderValue", averageOrderValue);
//
//		Map<String, Object> period = new LinkedHashMap<>();
//		period.put("fromDate", fromDate);
//		period.put("toDate", toDate);
//		summary.put("period", period);
//
//		// ================= ORDER BY STATUS =================
//		Map<String, Long> orderByStatus = new LinkedHashMap<>();
//		orderByStatus.put("PENDING", 0L);
//		orderByStatus.put("COMPLETED", 0L);
//		orderByStatus.put("CANCELLED", 0L);
//		orderByStatus.put("UNKNOWN", 0L);
//
//		System.out.println("📦 Default Order Status Map Initialized");
//
//		List<Object[]> statusCounts = ordersRepository.countOrdersByStatus(fromDateTime, toDateTime);
//
//		System.out.println("📥 Status Count Rows: " + statusCounts.size());
//
//		for (Object[] row : statusCounts) {
//
//			String status = (String) row[0];
//			Long count = (Long) row[1];
//
//			System.out.println("➡️ Raw Status: " + status + " | Count: " + count);
//
//			if (status == null) {
//				System.out.println("⚠️ NULL status found, mapped to UNKNOWN");
//				orderByStatus.put("UNKNOWN", orderByStatus.get("UNKNOWN") + count);
//			} else {
//				orderByStatus.put(status.toUpperCase(), count);
//			}
//		}
//
//		// ================= FINAL DATA =================
//		Map<String, Object> data = new LinkedHashMap<>();
//		data.put("summary", summary);
//		data.put("orderByStatus", orderByStatus);
//		data.put("revenueTrend", new ArrayList<>());
//		data.put("topRestaurants", new ArrayList<>());
//		data.put("topMenuItems", new ArrayList<>());
//
//		System.out.println("✅ Dashboard Data Prepared Successfully");
//		return data;
//	}
	@Transactional(readOnly = true)
	public Map<String, Object> getBranchDashboardStats(
	        String token,
	        LocalDate fromDate,
	        LocalDate toDate
	) throws Exception {

	    // 🔐 RESTAURANT / BRANCH AUTH
	    Authorization.authorizeBranch(token);

	    // 🔓 TOKEN → CURRENT USER
	    tokenUtil.decryptAndStoreToken(token);
	    Integer currentUserId = tokenUtil.getCurrentUserId();

	    if (currentUserId == null) {
	        throw new RuntimeException("Invalid token");
	    }

	    UsersEntity currentUser =
	            usersRepository.findById(currentUserId.longValue())
	                    .orElseThrow(() -> new RuntimeException("User not found"));

	    // ================= BRANCH RESOLVE =================
	    UsersEntity branch;

	    // case 1️⃣ → user itself is branch
	    if (currentUser.getParentId() != null) {
	        branch = currentUser;
	    }
	    // case 2️⃣ → user is restaurant → branch not allowed
	    else {
	        throw new RuntimeException("Branch user required for dashboard");
	    }

	    LocalDateTime from = fromDate.atStartOfDay();
	    LocalDateTime to = toDate.atTime(LocalTime.MAX);

	    // ================= DASHBOARD DATA =================

	    Long totalOrders =
	            ordersRepository.countTotalOrdersByBranch(branch, from, to);

	    BigDecimal totalRevenue =
	            ordersRepository.getTotalRevenueByBranch(branch, from, to);

	    List<Object[]> statusWise =
	            ordersRepository.countOrdersByStatusByBranch(branch, from, to);

	    Map<String, Long> statusMap = new LinkedHashMap<>();
	    for (Object[] row : statusWise) {
	        statusMap.put(
	                String.valueOf(row[0]),
	                (Long) row[1]
	        );
	    }

	    Map<String, Object> response = new LinkedHashMap<>();
	    response.put("branchId", branch.getId());
	    response.put("branchName", branch.getName());
	    response.put("fromDate", fromDate);
	    response.put("toDate", toDate);
	    response.put("totalOrders", totalOrders);
	    response.put("totalRevenue", totalRevenue);
	    response.put("ordersByStatus", statusMap);

	    return response;
	}



}
