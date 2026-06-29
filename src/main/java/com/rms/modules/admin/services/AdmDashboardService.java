package com.rms.modules.admin.services;

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
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.CustomersRepository;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.util.stream.Collectors;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.math.RoundingMode;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
public class AdmDashboardService {
	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private CustomersRepository customersRepository;

	@Transactional(readOnly = true)
	public Map<String, Object> getDashboardData(LocalDate fromDate, LocalDate toDate, String token) throws Exception {

		System.out.println("🚀 Dashboard Service Started");

		// 🔐 Admin Authorization
		Authorization.authorizeAdmin(token);
		System.out.println("✅ Admin Authorized");

		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);

		System.out.println("📅 From: " + fromDateTime);
		System.out.println("📅 To: " + toDateTime);

		// ================= SUMMARY =================
		Long totalOrders = ordersRepository.countTotalOrders(fromDateTime, toDateTime);
		System.out.println("📊 Total Orders: " + totalOrders);

		BigDecimal totalRevenue = ordersRepository.getTotalRevenue(fromDateTime, toDateTime);
		System.out.println("💰 Total Revenue: " + totalRevenue);

		if (totalRevenue == null) {
			totalRevenue = BigDecimal.ZERO;
			System.out.println("⚠️ Total Revenue was null, set to ZERO");
		}

		BigDecimal averageOrderValue = BigDecimal.ZERO;
		if (totalOrders != null && totalOrders > 0) {
			averageOrderValue = totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
		}

		System.out.println("📈 Average Order Value: " + averageOrderValue);

		Map<String, Object> summary = new LinkedHashMap<>();
		summary.put("totalOrders", totalOrders);
		summary.put("totalRevenue", totalRevenue);
		summary.put("averageOrderValue", averageOrderValue);

		Map<String, Object> period = new LinkedHashMap<>();
		period.put("fromDate", fromDate);
		period.put("toDate", toDate);
		summary.put("period", period);

		// ================= ORDER BY STATUS =================
		Map<String, Long> orderByStatus = new LinkedHashMap<>();
		orderByStatus.put("PENDING", 0L);
		orderByStatus.put("COMPLETED", 0L);
		orderByStatus.put("CANCELLED", 0L);
		orderByStatus.put("UNKNOWN", 0L);

		System.out.println("📦 Default Order Status Map Initialized");

		List<Object[]> statusCounts = ordersRepository.countOrdersByStatus(fromDateTime, toDateTime);

		System.out.println("📥 Status Count Rows: " + statusCounts.size());

		for (Object[] row : statusCounts) {

			String status = (String) row[0];
			Long count = (Long) row[1];

			System.out.println("➡️ Raw Status: " + status + " | Count: " + count);

			if (status == null) {
				System.out.println("⚠️ NULL status found, mapped to UNKNOWN");
				orderByStatus.put("UNKNOWN", orderByStatus.get("UNKNOWN") + count);
			} else {
				orderByStatus.put(status.toUpperCase(), count);
			}
		}

		// ================= RESTAURANT & CUSTOMER DATA =================
		List<com.rms.common.entities.UsersEntity> restaurants = usersRepository.findByRoleAndIsDeletedFalse("restaurant");
		long totalRestaurants = restaurants.size();
		long totalCustomers = customersRepository.count();

		List<Map<String, Object>> pendingApprovalsList = restaurants.stream()
				.filter(r -> r.getApprovalStatus() != null && "PENDING".equalsIgnoreCase(r.getApprovalStatus()))
				.map(r -> {
					Map<String, Object> m = new LinkedHashMap<>();
					m.put("name", r.getName() != null ? r.getName() : "");
					m.put("email", r.getEmail() != null ? r.getEmail() : r.getMobile());
					// Guard against legacy/seed rows where createdAt may be null.
					long days = 0L;
					if (r.getCreatedAt() != null) {
						days = ChronoUnit.DAYS.between(r.getCreatedAt().toLocalDate(), LocalDate.now());
					}
					m.put("applied_days_ago", days);
					return m;
				})
				.collect(Collectors.toList());
		long pendingApprovals = pendingApprovalsList.size();

		// Per-restaurant order stats
		List<Object[]> restaurantStats = ordersRepository.getRestaurantOrderStats(fromDateTime, toDateTime);
		List<Map<String, Object>> topRestaurants = restaurantStats.stream()
				.map(row -> {
					Map<String, Object> m = new LinkedHashMap<>();
					m.put("restaurantId", row[0]);
					m.put("restaurantName", row[1]);
					m.put("totalOrders", row[2]);
					m.put("totalRevenue", row[3] != null ? row[3] : BigDecimal.ZERO);
					m.put("pendingOrders", row[4] != null ? row[4] : 0L);
					m.put("completedOrders", row[5] != null ? row[5] : 0L);
					m.put("cancelledOrders", row[6] != null ? row[6] : 0L);
					return m;
				})
				.collect(Collectors.toList());

		// ================= MONTHLY REVENUE TREND (last 12 months) =================
		LocalDateTime trendFrom = toDate.minusMonths(11).withDayOfMonth(1).atStartOfDay();
		LocalDateTime trendTo = toDate.atTime(LocalTime.MAX);
		List<Object[]> monthlyRows = ordersRepository.getMonthlyRevenueTrend(trendFrom, trendTo);
		List<Map<String, Object>> revenueTrend = new ArrayList<>();
		for (Object[] row : monthlyRows) {
			Map<String, Object> entry = new LinkedHashMap<>();
			entry.put("date", row[0]);
			entry.put("revenue", row[1]);
			entry.put("orderCount", ((Number) row[2]).longValue());
			revenueTrend.add(entry);
		}

		// ================= DAILY ORDER TREND (last 7 days) =================
		LocalDateTime dailyFrom = toDate.minusDays(6).atStartOfDay();
		List<Object[]> dailyRows = ordersRepository.getDailyOrderTrend(dailyFrom, trendTo);
		List<Map<String, Object>> dailyOrderTrend = new ArrayList<>();
		for (Object[] row : dailyRows) {
			Map<String, Object> entry = new LinkedHashMap<>();
			entry.put("date", row[0]);
			entry.put("orderCount", ((Number) row[1]).longValue());
			dailyOrderTrend.add(entry);
		}

		// ================= FINAL DATA =================
		Map<String, Object> data = new LinkedHashMap<>();
		data.put("summary", summary);
		data.put("orderByStatus", orderByStatus);
		data.put("revenueTrend", revenueTrend);
		data.put("dailyOrderTrend", dailyOrderTrend);
		data.put("topRestaurants", topRestaurants);
		data.put("topMenuItems", new ArrayList<>());
		data.put("totalRestaurants", totalRestaurants);
		data.put("totalCustomers", totalCustomers);
		data.put("pendingApprovals", pendingApprovals);
		data.put("pendingApprovalsList", pendingApprovalsList);

		System.out.println("✅ Dashboard Data Prepared Successfully");
		return data;
	}

}
