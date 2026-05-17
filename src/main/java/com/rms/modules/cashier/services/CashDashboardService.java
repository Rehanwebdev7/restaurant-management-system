package com.rms.modules.cashier.services;

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
public class CashDashboardService {
	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	UsersRepository usersRepository;

	@Transactional(readOnly = true)
	public Map<String, Object> getCashierDashboardStats(String token, LocalDate fromDate, LocalDate toDate)
			throws Exception {

		System.out.println("\n========== CASHIER DASHBOARD START ==========");

		// 🔐 CASHIER AUTH
		Authorization.authorizeCashier(token);

		// 🔓 TOKEN DATA
		tokenUtil.decryptAndStoreToken(token);
		Long cashierId = tokenUtil.getCurrentUserId().longValue();
		String currentRole = tokenUtil.getCurrentUserType();
		tokenUtil.clearTokenData();

		System.out.println("Cashier ID : " + cashierId);

		// ================= CASHIER =================
		UsersEntity cashier = usersRepository.findById(cashierId)
				.orElseThrow(() -> new RuntimeException("Cashier not found"));

		if (cashier.getBranchId() == null)
			throw new RuntimeException("Branch not mapped with cashier");

		UsersEntity branch = cashier.getBranchId();

		System.out.println("Branch ID : " + branch.getId());

		// ================= DATE RANGE =================
		LocalDateTime from = fromDate.atStartOfDay();
		LocalDateTime to = toDate.atTime(LocalTime.MAX);

		// ================= TOTALS (CASHIER BASED) =================
		boolean isCaptain = "captain".equalsIgnoreCase(currentRole);
		Long totalOrders = isCaptain
				? ordersRepository.countTotalOrdersByCaptain(cashier, branch, from, to)
				: ordersRepository.countTotalOrdersByCashier(cashier, branch, from, to);

		BigDecimal totalRevenue = isCaptain
				? ordersRepository.getTotalRevenueByCaptain(cashier, branch, from, to)
				: ordersRepository.getTotalRevenueByCashier(cashier, branch, from, to);

		List<com.rms.common.entities.OrdersEntity> scopedOrders = isCaptain
				? ordersRepository.findByCaptainIdAndCreatedAtBetween(cashier, from, to)
				: ordersRepository.findByCashierIdAndCreatedAtBetween(cashier, from, to);

		// ================= STATUS COUNTS =================
		List<Object[]> statusWise = isCaptain
				? ordersRepository.countOrdersByStatusByCaptain(cashier, branch, from, to)
				: ordersRepository.countOrdersByStatusByCashier(cashier, branch, from, to);

		Map<String, Long> statusMap = new LinkedHashMap<>();

		long preparingCount = 0L;
		long readyCount = 0L;

		for (Object[] row : statusWise) {

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

		long pendingOrders = 0L;
		Map<String, Long> ordersByType = new LinkedHashMap<>();
		ordersByType.put("DINING", 0L);
		ordersByType.put("TAKEAWAY", 0L);
		ordersByType.put("DELIVERY", 0L);

		Map<String, BigDecimal> ordersByPayment = new LinkedHashMap<>();
		ordersByPayment.put("Cash", BigDecimal.ZERO);
		ordersByPayment.put("Card", BigDecimal.ZERO);
		ordersByPayment.put("Online", BigDecimal.ZERO);

		long paidCompletedOrders = 0L;

		for (com.rms.common.entities.OrdersEntity order : scopedOrders) {
			String status = order.getStatus() != null ? order.getStatus().toUpperCase() : "";
			if (!"COMPLETED".equals(status) && !"CANCELLED".equals(status) && !"DELIVERED".equals(status)
					&& !"SERVED".equals(status)) {
				pendingOrders++;
			}

			String orderType = order.getOrderType() != null ? order.getOrderType().toUpperCase() : "";
			if ("DINE_IN".equals(orderType)) {
				orderType = "DINING";
			}
			if (ordersByType.containsKey(orderType)) {
				ordersByType.put(orderType, ordersByType.get(orderType) + 1);
			}

			boolean isPaidCompleted =
					("SUCCESS".equalsIgnoreCase(order.getPaymentStatus())
							|| "PAID".equalsIgnoreCase(order.getPaymentStatus())
							|| "COMPLETED".equalsIgnoreCase(order.getPaymentStatus()));
			if (!isPaidCompleted) {
				continue;
			}

			paidCompletedOrders++;
			BigDecimal amount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
			String paymentMethod = order.getPaymentMethod() != null ? order.getPaymentMethod().toUpperCase() : "";

			if ("CARD".equals(paymentMethod)) {
				ordersByPayment.put("Card", ordersByPayment.get("Card").add(amount));
			} else if ("UPI".equals(paymentMethod) || "PG".equals(paymentMethod)) {
				ordersByPayment.put("Online", ordersByPayment.get("Online").add(amount));
			} else {
				ordersByPayment.put("Cash", ordersByPayment.get("Cash").add(amount));
			}
		}

		BigDecimal averageOrderValue = paidCompletedOrders > 0
				? totalRevenue.divide(BigDecimal.valueOf(paidCompletedOrders), 2, RoundingMode.HALF_UP)
				: BigDecimal.ZERO;

		// ================= RESPONSE =================
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("cashierId", cashier.getId());
		response.put("cashierName", cashier.getName());
		response.put("role", isCaptain ? "captain" : "cashier");

		response.put("branchId", branch.getId());
		response.put("branchName", branch.getName());

		response.put("fromDate", fromDate);
		response.put("toDate", toDate);

		response.put("totalOrders", totalOrders);
		response.put("totalRevenue", totalRevenue);
		response.put("averageOrderValue", averageOrderValue);
		response.put("pendingOrders", pendingOrders);

		response.put("preparingOrders", preparingCount);
		response.put("readyOrders", readyCount);

		response.put("ordersByStatus", statusMap);
		response.put("ordersByType", ordersByType);
		response.put("ordersByPayment", ordersByPayment);

		System.out.println("========== CASHIER DASHBOARD END ==========\n");

		return response;
	}

}
