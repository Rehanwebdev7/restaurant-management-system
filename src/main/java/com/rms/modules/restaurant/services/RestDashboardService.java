package com.rms.modules.restaurant.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.AddonsEntity;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.entities.OrdersEntity;
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
import com.rms.common.repositories.OrderItemsRepository;
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
public class RestDashboardService {
	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

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
	public Map<String, Object> getRestaurantDashboardStats(
	        String token,
	        LocalDate fromDate,
	        LocalDate toDate
	) throws Exception {

	    Authorization.authorizeRestaurant(token);
	    tokenUtil.decryptAndStoreToken(token);
	    Integer restaurantIdInt = tokenUtil.getCurrentUserId();
	    Long restaurantId = restaurantIdInt.longValue();

	    UsersEntity restaurant =
	            usersRepository.findById(restaurantId)
	                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));

	    LocalDateTime from = fromDate.atStartOfDay();
	    LocalDateTime to = toDate.atTime(LocalTime.MAX);

	    // Today's range
	    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
	    LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);

	    // === TODAY STATS ===
	    Long todayOrders = ordersRepository.countTodayOrders(restaurant, todayStart, todayEnd);
	    BigDecimal todayRevenue = ordersRepository.getTodayRevenue(restaurant, todayStart, todayEnd);
	    if (todayRevenue == null) todayRevenue = BigDecimal.ZERO;

	    // === PERIOD STATS ===
	    Long totalOrders = ordersRepository.countTotalOrders(restaurant, from, to);
	    BigDecimal totalRevenue = ordersRepository.getTotalRevenue(restaurant, from, to);
	    if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

	    BigDecimal avgOrderValue = totalOrders > 0
	            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
	            : BigDecimal.ZERO;

	    // === TOTAL CUSTOMERS ===
	    Long totalCustomers = ordersRepository.countDistinctCustomers(restaurant);

	    // === ACTIVE MENU ITEMS ===
	    Long activeMenuItems = menuItemsRepository.countActiveMenuItems(restaurantId);

	    // === ORDER BY STATUS (with frontend mapping) ===
	    List<Object[]> statusWise = ordersRepository.countOrdersByStatus(restaurant, from, to);
	    Map<String, Long> orderByStatus = new LinkedHashMap<>();
	    orderByStatus.put("PENDING", 0L);
	    orderByStatus.put("WORKING", 0L);
	    orderByStatus.put("COMPLETED", 0L);
	    orderByStatus.put("CANCELLED", 0L);

	    for (Object[] row : statusWise) {
	        String s = String.valueOf(row[0]);
	        Long c = (Long) row[1];

	        if (s.equalsIgnoreCase("PENDING")) {
	            orderByStatus.put("PENDING", orderByStatus.get("PENDING") + c);
	        } else if (List.of("PREPARING", "CONFIRMED", "READY", "ON_WAY").contains(s)) {
	            orderByStatus.put("WORKING", orderByStatus.get("WORKING") + c);
	        } else if (s.equalsIgnoreCase("DELIVERED")) {
	            orderByStatus.put("COMPLETED", orderByStatus.get("COMPLETED") + c);
	        } else if (s.equalsIgnoreCase("CANCELLED")) {
	            orderByStatus.put("CANCELLED", orderByStatus.get("CANCELLED") + c);
	        }
	    }

	    // === REVENUE TREND (last 7 days) ===
	    LocalDateTime sevenDaysAgo = LocalDate.now().minusDays(6).atStartOfDay();
	    List<Object[]> trendRows = ordersRepository.getDailyRevenueTrend(restaurantId, sevenDaysAgo);
	    List<Map<String, Object>> revenueTrend = new ArrayList<>();
	    for (Object[] row : trendRows) {
	        Map<String, Object> entry = new LinkedHashMap<>();
	        entry.put("date", String.valueOf(row[0]));
	        entry.put("revenue", row[1]);
	        revenueTrend.add(entry);
	    }

	    // === TOP MENU ITEMS ===
	    List<Object[]> topRows = orderItemsRepository.findTopMenuItems(restaurantId, from, to);
	    List<Map<String, Object>> topMenuItems = new ArrayList<>();
	    for (Object[] row : topRows) {
	        Map<String, Object> item = new LinkedHashMap<>();
	        item.put("name", String.valueOf(row[0]));
	        item.put("orders", row[1]);
	        item.put("revenue", row[2]);
	        topMenuItems.add(item);
	    }

	    // === RECENT ORDERS ===
	    List<OrdersEntity> recent = ordersRepository.findTop5ByRestaurantIdOrderByCreatedAtDesc(restaurant);
	    List<Map<String, Object>> recentOrders = new ArrayList<>();
	    for (OrdersEntity o : recent) {
	        Map<String, Object> entry = new LinkedHashMap<>();
	        entry.put("id", o.getOrderNumber());
	        entry.put("customer", o.getCustomerName() != null ? o.getCustomerName() : "Guest");
	        entry.put("amount", o.getTotalAmount());
	        entry.put("status", o.getStatus());
	        entry.put("time", o.getCreatedAt());
	        recentOrders.add(entry);
	    }

	    // === BUILD RESPONSE ===
	    Map<String, Object> summary = new LinkedHashMap<>();
	    summary.put("totalOrders", totalOrders);
	    summary.put("totalRevenue", totalRevenue);
	    summary.put("averageOrderValue", avgOrderValue);

	    Map<String, Object> response = new LinkedHashMap<>();
	    response.put("todayRevenue", todayRevenue);
	    response.put("todayOrders", todayOrders);
	    response.put("activeMenuItems", activeMenuItems);
	    response.put("totalCustomers", totalCustomers);
	    response.put("summary", summary);
	    response.put("orderByStatus", orderByStatus);
	    response.put("revenueTrend", revenueTrend);
	    response.put("topMenuItems", topMenuItems);
	    response.put("recentOrders", recentOrders);

	    return response;
	}


}
