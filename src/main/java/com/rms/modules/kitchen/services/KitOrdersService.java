package com.rms.modules.kitchen.services;

import com.rms.common.Constant;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.dto.BranchOrderSummaryDTO;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.OrderItemsRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.common.util.CacheData;
import com.rms.common.util.OrderStatusVocab;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.CustomerDeliveryAddressesRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.entities.TableBookingEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import java.util.Objects;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import java.math.BigDecimal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Qualifier("kitOrdersService")
public class KitOrdersService implements OrdersServiceIMP {

	private final OrdersRepository ordersrepository;
	private final CustomersRepository customersrepository;
	private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private Constant constant;

	@Autowired
	private CacheData cacheData;

	@Autowired
	private DiningTablesRepository diningtablesrepository;

	@Autowired
	private com.rms.common.repositories.TableBookingRepository tableBookingRepository;

	@Autowired
	private com.rms.common.util.DiningTableReleaseScheduler diningTableReleaseScheduler;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	public KitOrdersService(OrdersRepository ordersrepository, CustomersRepository customersrepository,
			CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository,
			RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
		this.ordersrepository = ordersrepository;
		this.customersrepository = customersrepository;
		this.customerdeliveryaddressesrepository = customerdeliveryaddressesrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
		this.usersrepository = usersrepository;
	}

	private UsersEntity resolveKitchenUser(String token) throws Exception {
		Authorization.authorizeKitchen(token);
		tokenUtil.decryptAndStoreToken(token);
		Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();
		tokenUtil.clearTokenData();

		return usersRepository.findById(kitchenUserId)
				.orElseThrow(() -> new RuntimeException("Kitchen user not found"));
	}

	private UsersEntity requireBranchUser(UsersEntity kitchenUser) {
		if (kitchenUser == null || kitchenUser.getBranchId() == null) {
			throw new RuntimeException("Branch not assigned to kitchen user");
		}
		return kitchenUser.getBranchId();
	}

	private UsersEntity requireRestaurantUser(UsersEntity branchUser) {
		if (branchUser == null || branchUser.getParentId() == null) {
			throw new RuntimeException("Restaurant not found for branch");
		}
		return branchUser.getParentId();
	}

	private Map<String, Object> buildSummaryResponse(Page<Object[]> page) {
		List<BranchOrderSummaryDTO> records = page.getContent().stream()
				.filter(Objects::nonNull)
				.map(BranchOrderSummaryDTO::fromRow)
				.filter(Objects::nonNull)
				.collect(Collectors.toList());

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", records);
		return response;
	}

	public <T, ID> T fetchReferenceById(T inputRef, JpaRepository<T, ID> repo, String notFoundMessage) {
		if (inputRef != null) {
			try {
				Field idField = inputRef.getClass().getDeclaredField("id");
				idField.setAccessible(true);
				Object idValue = idField.get(inputRef);
				if (idValue != null) {
					return repo.findById((ID) idValue).orElseThrow(() -> new RuntimeException(notFoundMessage));
				} else {
					throw new RuntimeException("Foreign key ID is null");
				}
			} catch (NoSuchFieldException | IllegalAccessException e) {
				throw new RuntimeException("Invalid reference structure: " + e.getMessage());
			}
		}
		return null;
	}

	@Transactional(readOnly = true)
	public Map<String, Long> getKitchenOrderStatusCounts(String token) throws Exception {

		System.out.println("🚀 Kitchen Order Status Count Service Started");

		// 🔐 TOKEN DECRYPT
		tokenUtil.decryptAndStoreToken(token);
		Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();

		System.out.println("🔐 Kitchen User ID : " + kitchenUserId);

		// ================= FETCH KITCHEN USER =================
		UsersEntity kitchenUser = usersRepository.findById(kitchenUserId)
				.orElseThrow(() -> new RuntimeException("Kitchen user not found"));

		if (kitchenUser.getBranchId() == null) {
			throw new RuntimeException("Branch not assigned to kitchen user");
		}

		UsersEntity branchUser = kitchenUser.getBranchId();
		Long branchId = branchUser.getId();

		System.out.println("🏬 Branch ID       : " + branchId);

		// ================= INIT STATUS MAP =================
		Map<String, Long> statusCountMap = new LinkedHashMap<>();
		statusCountMap.put("PENDING", 0L);
		statusCountMap.put("COMPLETED", 0L);
		statusCountMap.put("CANCELLED", 0L);
		statusCountMap.put("READY", 0L);
		statusCountMap.put("UNKNOWN", 0L);

		// =====================================================
		// 🔥 1️⃣ PENDING ORDERS → BRANCH WISE
		// =====================================================
		Long pendingCount = ordersRepository.countByStatusAndBranchId_Id("PENDING", branchId);

		System.out.println("📦 PENDING Orders (Branch-wise): " + pendingCount);

		statusCountMap.put("PENDING", pendingCount);

		// =====================================================
		// 🔥 2️⃣ OTHER STATUS → KITCHEN WISE
		// =====================================================
		List<Object[]> otherStatusCounts = ordersRepository.countByKitchenIdAndStatusNotPending(kitchenUserId);

		System.out.println("📊 Other Status Rows: " + otherStatusCounts.size());

		for (Object[] row : otherStatusCounts) {

			String status = (String) row[0];
			Long count = (Long) row[1];

			System.out.println("➡️ Status: " + status + " | Count: " + count);

			if (status == null) {
				statusCountMap.put("UNKNOWN", statusCountMap.get("UNKNOWN") + count);
			} else {
				statusCountMap.put(status.toUpperCase(), count);
			}
		}

		System.out.println("✅ Kitchen Order Status Count Prepared Successfully");
		return statusCountMap;
	}
//	 *************** xl &&&&&&&&&&&&

	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate) throws Exception {
		UsersEntity kitchenUser = resolveKitchenUser(token);
		UsersEntity branchUser = requireBranchUser(kitchenUser);
		UsersEntity restaurantUser = requireRestaurantUser(branchUser);

		LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
		LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

		List<BranchOrderSummaryDTO> ordersList = ordersrepository
				.findBranchOrderSummariesForExport(branchUser.getId(), restaurantUser.getId(), fromDateTime, toDateTime,
						null, null)
				.stream()
				.filter(Objects::nonNull)
				.map(BranchOrderSummaryDTO::fromRow)
				.filter(Objects::nonNull)
				.collect(Collectors.toList());

		String scopeLabel = "Kitchen: " + (kitchenUser.getName() != null ? kitchenUser.getName() : "-");
		return com.rms.common.util.ItemReportExcelBuilder.buildBranchSummaries(ordersList, fromDate, toDate, scopeLabel);
	}

	public Map<String, Object> getKitchenOrdersWithFilters(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		UsersEntity kitchenUser = resolveKitchenUser(token);
		UsersEntity branchUser = requireBranchUser(kitchenUser);
		UsersEntity restaurantUser = requireRestaurantUser(branchUser);

		LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
		LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;
		String normalizedStatus = status != null && !status.isBlank() ? OrderStatusVocab.canonical(status) : null;

		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page<Object[]> page = ordersRepository.findBranchOrderSummaries(branchUser.getId(), restaurantUser.getId(),
				fromDateTime, toDateTime, normalizedStatus, searchValue, pageable);

		return buildSummaryResponse(page);
	}

	public Map<String, Object> getOrdersKitchenId(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 KITCHEN AUTH
		Authorization.authorizeKitchen(token);

		// 🔓 TOKEN
		tokenUtil.decryptAndStoreToken(token);
		Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();

		// ================= FETCH KITCHEN USER =================
		UsersEntity kitchenUser = usersRepository.findById(kitchenUserId)
				.orElseThrow(() -> new RuntimeException("Kitchen user not found"));

		if (kitchenUser.getBranchId() == null) {
			throw new RuntimeException("Branch not assigned to kitchen user");
		}

		UsersEntity branchUser = kitchenUser.getBranchId();
		Long branchId = branchUser.getId();

		if (branchUser.getParentId() == null) {
			throw new RuntimeException("Restaurant not found for branch");
		}

		Long restaurantId = branchUser.getParentId().getId();

		// ================= CONVERT DATES =================
		LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
		LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

		// ================= PAGEABLE =================
		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));

		// ================= FETCH VIA NATIVE QUERY (SAFE - NO EAGER JOIN EXPLOSION) =================
		Page<Object[]> page = ordersRepository.findKitchenOrderSummaries(
				kitchenUserId, branchId, restaurantId,
				fromDateTime, toDateTime,
				status, searchValue,
				pageable
		);

		// ================= MAP RESULTS =================
		List<BranchOrderSummaryDTO> records = page.getContent().stream()
				.filter(Objects::nonNull)
				.map(BranchOrderSummaryDTO::fromRow)
				.filter(Objects::nonNull)
				.collect(Collectors.toList());

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", records);

		return response;
	}

	@Override
	public List<OrdersEntity> getAllRecordOrders(String token) throws Exception {
		UsersEntity kitchenUser = resolveKitchenUser(token);
		UsersEntity branchUser = requireBranchUser(kitchenUser);
		UsersEntity restaurantUser = requireRestaurantUser(branchUser);

		Specification<OrdersEntity> spec = (root, query, cb) -> cb.and(
				cb.equal(root.get("kitchenId").get("id"), kitchenUser.getId()),
				cb.equal(root.get("branchId").get("id"), branchUser.getId()),
				cb.equal(root.get("restaurantId").get("id"), restaurantUser.getId()));

		return ordersrepository.findAll(spec);
	}

	@Override
	public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception {
		UsersEntity kitchenUser = resolveKitchenUser(token);
		UsersEntity branchUser = requireBranchUser(kitchenUser);
		UsersEntity restaurantUser = requireRestaurantUser(branchUser);

		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page<Object[]> page = ordersrepository.findBranchOrderSummaries(branchUser.getId(), restaurantUser.getId(),
				null, null, null, null, pageable);
		return buildSummaryResponse(page);
	}

	@Override
	public OrdersEntity getOneOrders(Long id, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		return ordersrepository.findById(id).orElseThrow(() -> new RuntimeException("Orders not found"));
	}

	@Override
	public String addOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		OrdersEntity newEntity = new OrdersEntity();

		// Copy non-foreign fields using reflection
		for (Field field : OrdersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(ordersEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle customer_id foreign key
		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
			newEntity.setCustomerId(
					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
		}

		// Handle customer_delivery_addresses_id foreign key
		if (ordersEntity.getCustomerDeliveryAddressesId() != null
				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
			newEntity.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
					customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
		}

		// Handle branch_id foreign key
		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
			newEntity.setBranchId(
					fetchReferenceById(ordersEntity.getBranchId(), usersrepository, "Restaurant_branch not found"));
		}

		// Handle captain_id foreign key
		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
			newEntity.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
		}

		// Handle delivery_id foreign key
		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
			newEntity.setDeliveryId(
					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found"));
		}

		// Handle restaurant_id foreign key
		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
			newEntity.setRestaurantId(
					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		ordersrepository.save(newEntity);
		return "Added Successfully";
	}

//	@Override
//	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {
//		Authorization.authorizeKitchen(token);
//		OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
//				.orElseThrow(() -> new RuntimeException("Orders not found"));
//
//		// Update non-foreign fields using reflection
//		for (Field field : OrdersEntity.class.getDeclaredFields()) {
//			field.setAccessible(true);
//			Object value = field.get(ordersEntity);
//			if (value != null && !field.getName().endsWith("Id")) {
//				field.set(existingEntity, value);
//			}
//		}
//
//		// Handle customer_id foreign key
//		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
//			existingEntity.setCustomerId(
//					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
//		}
//
//		// Handle customer_delivery_addresses_id foreign key
//		if (ordersEntity.getCustomerDeliveryAddressesId() != null
//				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
//			existingEntity
//					.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
//							customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
//		}
//
//		// Handle branch_id foreign key
//		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
//			existingEntity.setBranchId(
//					fetchReferenceById(ordersEntity.getBranchId(), usersrepository, "Restaurant_branch not found"));
//		}
//
//		// Handle captain_id foreign key
//		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
//			existingEntity
//					.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
//		}
//
//		// Handle delivery_id foreign key
//		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
//			existingEntity.setDeliveryId(
//					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found"));
//		}
//
//		// Handle restaurant_id foreign key
//		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
//			existingEntity.setRestaurantId(
//					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found"));
//		}
//
//		ordersrepository.save(existingEntity);
//		return "Updated Successfully";
//	}

	@Override
	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {

		// 🔐 KITCHEN AUTH
		Authorization.authorizeKitchen(token);

		// 🔓 TOKEN
		tokenUtil.decryptAndStoreToken(token);
		Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();

		UsersEntity kitchenUser = usersrepository.findById(kitchenUserId)
				.orElseThrow(() -> new RuntimeException("Kitchen user not found"));

		OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
				.orElseThrow(() -> new RuntimeException("Orders not found"));

		// Track previous status & payment for conditional notifications & cache management
		String previousStatus = existingEntity.getStatus();
		String previousPaymentStatus = existingEntity.getPaymentStatus();

		// ================= UPDATE NON-FK FIELDS =================
		for (Field field : OrdersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(ordersEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// ================= PAYMENT TRANSITION: Schedule 5-min table release on DINING payment success =================
		String newPaymentStatus = existingEntity.getPaymentStatus();
		boolean isNowPaid = newPaymentStatus != null
				&& ("SUCCESS".equalsIgnoreCase(newPaymentStatus) || "PAID".equalsIgnoreCase(newPaymentStatus));
		boolean wasPreviouslyPaid = previousPaymentStatus != null
				&& ("SUCCESS".equalsIgnoreCase(previousPaymentStatus) || "PAID".equalsIgnoreCase(previousPaymentStatus));
		if (isNowPaid && !wasPreviouslyPaid && "DINING".equalsIgnoreCase(existingEntity.getOrderType())) {
			TableBookingEntity tableBooking = existingEntity.getTableBookingId();
			if (tableBooking != null && tableBooking.getTableId() != null) {
				System.out.println("💰 Payment SUCCESS → Scheduling 5-min table release");
				diningTableReleaseScheduler.scheduleRelease(tableBooking.getTableId().getId());
			}
		}

		// ================= FK HANDLING =================
		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
			existingEntity.setCustomerId(
					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
		}

		if (ordersEntity.getCustomerDeliveryAddressesId() != null
				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
			existingEntity
					.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
							customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
		}

		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(
					fetchReferenceById(ordersEntity.getBranchId(), usersrepository, "Restaurant_branch not found"));
		}

		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
			existingEntity
					.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
		}

		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
			existingEntity.setDeliveryId(
					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found"));
		}

		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
			existingEntity.setRestaurantId(
					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		// Check if status changed (for conditional notifications & cache management)
		String newStatus = existingEntity.getStatus();
		boolean statusChanged = !previousStatus.equalsIgnoreCase(newStatus);

		// ================= STATUS BASED NOTIFICATION (ONLY IF STATUS CHANGED) =================
		if (statusChanged) {
			System.out.println("\n================ STATUS UPDATE =================");
			System.out.println("Order No   : " + existingEntity.getOrderNumber());
			System.out.println("New Status : " + existingEntity.getStatus());

			Map<String, Object> data = new LinkedHashMap<>();
			data.put("type", "ORDER_STATUS_UPDATE");
			data.put("status", existingEntity.getStatus());
			data.put("orderId", existingEntity.getOrderNumber());
			data.put("orderType", existingEntity.getOrderType());
			data.put("amount", existingEntity.getTotalAmount());
			data.put("paymentMethod", existingEntity.getPaymentMethod());

			System.out.println("Payload : " + data);

			// ================= CUSTOMER NOTIFICATION (STATUS CHANGE ONLY) =================
			if (existingEntity.getCustomerId() != null) {
				System.out.println("\n📢 CMD → Sending notification to CUSTOMER");
				System.out.println("Customer ID : " + existingEntity.getCustomerId().getId());

				constant.sendNotificationToUser(
						existingEntity.getCustomerId().getId(), "📦 Order Update Customer", "Your order #"
								+ existingEntity.getOrderNumber() + " status updated to " + existingEntity.getStatus(),
						data);

				System.out.println("✅ Customer notification sent");
			}

			// ================= DELIVERY NOTIFICATION (CONFIRMED / legacy ACCEPTED_ORDER) =================
			String canonicalStatus = OrderStatusVocab.canonical(existingEntity.getStatus());
			if ("CONFIRMED".equals(canonicalStatus)) {

				existingEntity.setDeliveryStatus("CONFIRMED");
				// 🇮🇳 Asia/Kolkata time set
				LocalDateTime indiaTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime();

				existingEntity.setKitchenAcceptAt(indiaTime);
				System.out.println("\n📢 CMD → Sending notification to DELIVERY");

				constant.sendNotificationByBranchAndRole(existingEntity.getBranchId().getId(), "DELIVERY",
						"🚚 New Delivery Assigned", "Order #" + existingEntity.getOrderNumber() + " is ready for delivery",
						data);

				System.out.println("✅ Delivery notification sent");
			}

			// ================= READY STATUS (canonical + legacy READY_FOR_ORDER) =================
			if ("READY".equals(canonicalStatus)) {
				LocalDateTime indiaTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime();
				existingEntity.setKitchenReadyAt(indiaTime);
			}

			// ================= SERVED STATUS (DINING ORDERS) =================
			if ("SERVED".equalsIgnoreCase(existingEntity.getStatus())
					&& "DINING".equalsIgnoreCase(existingEntity.getOrderType())) {
				System.out.println("\n🍽️ DINING order marked as SERVED");
				LocalDateTime indiaTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime();
				existingEntity.setCompletedAt(indiaTime);
			}

			// ================= TABLE RELEASE ON COMPLETED/CANCELLED (DINING) — For backward compatibility =================
			// Note: Primary table release is now via payment SUCCESS scheduler (5-min delay)
			if (("COMPLETED".equalsIgnoreCase(existingEntity.getStatus())
					|| "CANCELLED".equalsIgnoreCase(existingEntity.getStatus()))
					&& "DINING".equalsIgnoreCase(existingEntity.getOrderType())) {

				// Only release if payment was NOT already triggered a release (avoids double-release)
				if (!isNowPaid || wasPreviouslyPaid) {
					TableBookingEntity tableBooking = existingEntity.getTableBookingId();
					if (tableBooking != null && tableBooking.getTableId() != null) {
						DiningTablesEntity diningTable = tableBooking.getTableId();
						diningTable.setStatus(1); // 1 = available
						diningTable.setUpdatedAt(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime());
						diningtablesrepository.save(diningTable);
						System.out.println("✅ Table T-" + diningTable.getTableNumber() + " released (status change)");
					}
				}
			}
		}

		// 🔥 FORCE SET KITCHEN ID FROM TOKEN
		existingEntity.setKitchenId(kitchenUser);

		// ================= REMOVE FROM KITCHEN CACHE (ONLY ON FINAL STATUSES) =================
		// Remove only when order reaches COMPLETED/SERVED/CANCELLED to avoid premature removal
		if ("COMPLETED".equalsIgnoreCase(existingEntity.getStatus())
				|| "SERVED".equalsIgnoreCase(existingEntity.getStatus())
				|| "CANCELLED".equalsIgnoreCase(existingEntity.getStatus())) {
			System.out.println("\n🧹 Removing order from kitchen cache (final status)");
			cacheData.removeKitchenOrderByOrderId(existingEntity.getId());
			System.out.println("✅ Removed from kitchen cache");
		}

		com.rms.common.util.OrderLifecycleUtil.normalizeBeforeSave(existingEntity);
		ordersrepository.save(existingEntity);

		if (ordersEntity.getRawItems() != null && !ordersEntity.getRawItems().isEmpty()) {
			orderItemsRepository.deleteByOrderId_Id(existingEntity.getId());
			List<OrderItemsEntity> newItems = new ArrayList<>();
			for (Map<String, Object> rawItem : ordersEntity.getRawItems()) {
				OrderItemsEntity item = new OrderItemsEntity();
				Object menuItemIdRaw = rawItem.get("menu_item_id");
				if (menuItemIdRaw != null) {
					Long menuItemId = Long.parseLong(menuItemIdRaw.toString());
					MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
						.orElseThrow(() -> new RuntimeException("MenuItem not found: " + menuItemId));
					item.setMenuItemId(menuItem);
					item.setMenuItemName(menuItem.getName());
				}
				if (rawItem.get("quantity") != null)
					item.setQuantity(Integer.parseInt(rawItem.get("quantity").toString()));
				if (rawItem.get("price") != null)
					item.setPrice(new BigDecimal(rawItem.get("price").toString()));
				if (rawItem.get("special_instructions") != null)
					item.setSpecialInstructions(rawItem.get("special_instructions").toString());
				if (item.getPrice() != null && item.getQuantity() != null)
					item.setItemTotal(item.getPrice().multiply(new BigDecimal(item.getQuantity())));
				item.setOrderId(existingEntity);
				newItems.add(item);
			}
			orderItemsRepository.saveAll(newItems);
		}

		// Always recalculate totals from current items
		recalculateOrderTotals(existingEntity);
		ordersrepository.save(existingEntity);

		com.rms.common.util.OrderLifecycleUtil.applyClosedSideEffects(
				existingEntity, diningtablesrepository, tableBookingRepository);

		System.out.println("✅ Order updated successfully");
		System.out.println("===============================================\n");

		return "Updated Successfully";
	}

//	@Override
//	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {
//
//		// 🔐 KITCHEN AUTH
//		Authorization.authorizeKitchen(token);
//
//		// 🔓 TOKEN
//		tokenUtil.decryptAndStoreToken(token);
//		Long kitchenUserId = tokenUtil.getCurrentUserId().longValue();
//
//		UsersEntity kitchenUser = usersrepository.findById(kitchenUserId)
//				.orElseThrow(() -> new RuntimeException("Kitchen user not found"));
//
//		OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
//				.orElseThrow(() -> new RuntimeException("Orders not found"));
//
//		// ================= UPDATE NON-FK FIELDS =================
//		for (Field field : OrdersEntity.class.getDeclaredFields()) {
//			field.setAccessible(true);
//			Object value = field.get(ordersEntity);
//			if (value != null && !field.getName().endsWith("Id")) {
//				field.set(existingEntity, value);
//			}
//		}
//
//		// ================= FK HANDLING =================
//
//		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
//			existingEntity.setCustomerId(
//					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
//		}
//
//		if (ordersEntity.getCustomerDeliveryAddressesId() != null
//				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
//			existingEntity
//					.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
//							customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
//		}
//
//		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
//			existingEntity.setBranchId(
//					fetchReferenceById(ordersEntity.getBranchId(), usersrepository, "Restaurant_branch not found"));
//		}
//
//		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
//			existingEntity
//					.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
//		}
//
//		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
//			existingEntity.setDeliveryId(
//					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found"));
//		}
//
//		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
//			existingEntity.setRestaurantId(
//					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found"));
//		}
//
//		if ("ACCEPTED_ORDER".equalsIgnoreCase(existingEntity.getStatus())) {
//
//			existingEntity.setDeliveryStatus("ACCEPTED_ORDER");
//			System.out.println("\n================ ORDER ACCEPTED NOTIFICATION ================");
//			System.out.println("Order Status      : " + existingEntity.getStatus());
//			System.out.println("Order Number      : " + existingEntity.getOrderNumber());
//			System.out.println("Order Type        : " + existingEntity.getOrderType());
//			System.out.println("Total Amount      : " + existingEntity.getTotalAmount());
//			System.out.println("Payment Method    : " + existingEntity.getPaymentMethod());
//			System.out.println("Branch ID         : " + existingEntity.getBranchId().getId());
//
//			// 📦 Notification Data Payload
//			Map<String, Object> data = new LinkedHashMap<>();
//			data.put("type", "Order_Ready");
//			data.put("orderId", existingEntity.getOrderNumber());
//			data.put("orderType", existingEntity.getOrderType());
//			data.put("amount", existingEntity.getTotalAmount());
//			data.put("paymentMethod", existingEntity.getPaymentMethod());
//
//			System.out.println("Notification Data : " + data);
//
//			// 🔔 Send Notification
//			System.out.println("\n📢 Sending notification to KITCHEN users...");
//			constant.sendNotificationByBranchAndRole(existingEntity.getBranchId().getId(), "KITCHEN",
//					"🍽️ New Order Received!", "Order #" + existingEntity.getOrderNumber() + " Order Deliver", data);
//
//		}
//
//		// 🔥 FORCE SET KITCHEN ID FROM TOKEN
//		existingEntity.setKitchenId(kitchenUser);
//
//		ordersrepository.save(existingEntity);
//
//		return "Updated Successfully";
//	}

	@Override
	public String deleteOrders(Long id, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		if (!ordersrepository.existsById(id)) {
			throw new RuntimeException("Orders not found");
		}
		ordersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrders(List<OrdersEntity> ordersEntitys, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		List<OrdersEntity> entitiesToSave = new ArrayList<>();

		for (OrdersEntity entity : ordersEntitys) {
			OrdersEntity newEntity = new OrdersEntity();

			// Copy non-foreign fields using reflection
			for (Field field : OrdersEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle customer_id foreign key
			if (entity.getCustomerId() != null && entity.getCustomerId().getId() != null) {
				newEntity.setCustomerId(
						fetchReferenceById(entity.getCustomerId(), customersrepository, "Customers not found"));
			}

			// Handle customer_delivery_addresses_id foreign key
			if (entity.getCustomerDeliveryAddressesId() != null
					&& entity.getCustomerDeliveryAddressesId().getId() != null) {
				newEntity.setCustomerDeliveryAddressesId(fetchReferenceById(entity.getCustomerDeliveryAddressesId(),
						customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
			}

			// Handle branch_id foreign key
			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				newEntity.setBranchId(
						fetchReferenceById(entity.getBranchId(), usersrepository, "Restaurant_branch not found"));
			}

			// Handle captain_id foreign key
			if (entity.getCaptainId() != null && entity.getCaptainId().getId() != null) {
				newEntity.setCaptainId(fetchReferenceById(entity.getCaptainId(), usersrepository, "Users not found"));
			}

			// Handle delivery_id foreign key
			if (entity.getDeliveryId() != null && entity.getDeliveryId().getId() != null) {
				newEntity.setDeliveryId(fetchReferenceById(entity.getDeliveryId(), usersrepository, "Users not found"));
			}

			// Handle restaurant_id foreign key
			if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
				newEntity.setRestaurantId(
						fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		ordersrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<OrdersEntity> getOrdersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeKitchen(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrdersEntity> getOrdersByCreatedat(LocalDate createdat, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return ordersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeKitchen(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedat(LocalDate updatedat, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return ordersrepository.findByUpdatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeKitchen(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedat(LocalDate completedat, String token) throws Exception {
		Authorization.authorizeKitchen(token);
		LocalDateTime dateTime = completedat.atStartOfDay();
		return ordersrepository.findByCompletedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<OrdersEntity> page = ordersrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("Orderss");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Restaurant_id");
			header.createCell(2).setCellValue("Captain_id");
			header.createCell(3).setCellValue("Branch_id");
			header.createCell(4).setCellValue("Delivery_id");
			header.createCell(5).setCellValue("Order_number");
			header.createCell(6).setCellValue("Order_type");
			header.createCell(7).setCellValue("Customer_id");
			header.createCell(8).setCellValue("Customer_delivery_addresses_id");
			header.createCell(9).setCellValue("Table_number");
			header.createCell(10).setCellValue("Status");
			header.createCell(11).setCellValue("Payment_status");
			header.createCell(12).setCellValue("Payment_method");
			header.createCell(13).setCellValue("Subtotal");
			header.createCell(14).setCellValue("Tax_amount");
			header.createCell(15).setCellValue("Discount_amount");
			header.createCell(16).setCellValue("Delivery_fee");
			header.createCell(17).setCellValue("Total_amount");
			header.createCell(18).setCellValue("Special_instructions");
			header.createCell(19).setCellValue("Estimated_time");
			header.createCell(20).setCellValue("Created_at");
			header.createCell(21).setCellValue("Updated_at");
			header.createCell(22).setCellValue("Customer_name");
			header.createCell(23).setCellValue("Customer_phone");
			header.createCell(24).setCellValue("Customer_email");
			header.createCell(25).setCellValue("Completed_at");

			int rowNum = 1;
			for (OrdersEntity ordersEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(ordersEntity.getId() != null ? ordersEntity.getId() : 0);
				row.createCell(1).setCellValue(
						ordersEntity.getRestaurantId() != null ? ordersEntity.getRestaurantId().toString() : "N/A");
				row.createCell(2).setCellValue(
						ordersEntity.getCaptainId() != null ? ordersEntity.getCaptainId().toString() : "N/A");
				row.createCell(3).setCellValue(
						ordersEntity.getBranchId() != null ? ordersEntity.getBranchId().toString() : "N/A");
				row.createCell(4).setCellValue(
						ordersEntity.getDeliveryId() != null ? ordersEntity.getDeliveryId().toString() : "N/A");
				row.createCell(5)
						.setCellValue(ordersEntity.getOrderNumber() != null ? ordersEntity.getOrderNumber() : "N/A");
				row.createCell(6)
						.setCellValue(ordersEntity.getOrderType() != null ? ordersEntity.getOrderType() : "N/A");
				row.createCell(7).setCellValue(
						ordersEntity.getCustomerId() != null ? ordersEntity.getCustomerId().toString() : "N/A");
				row.createCell(8)
						.setCellValue(ordersEntity.getCustomerDeliveryAddressesId() != null
								? ordersEntity.getCustomerDeliveryAddressesId().toString()
								: "N/A");
				row.createCell(9)
						.setCellValue(ordersEntity.getTableNumber() != null ? ordersEntity.getTableNumber() : "N/A");
				row.createCell(10).setCellValue(ordersEntity.getStatus() != null ? ordersEntity.getStatus() : "N/A");
				row.createCell(11).setCellValue(
						ordersEntity.getPaymentStatus() != null ? ordersEntity.getPaymentStatus() : "N/A");
				row.createCell(12).setCellValue(
						ordersEntity.getPaymentMethod() != null ? ordersEntity.getPaymentMethod() : "N/A");
				row.createCell(13).setCellValue(
						ordersEntity.getSubtotal() != null ? ordersEntity.getSubtotal().doubleValue() : 0.0);
				row.createCell(14).setCellValue(
						ordersEntity.getTaxAmount() != null ? ordersEntity.getTaxAmount().doubleValue() : 0.0);
				row.createCell(15)
						.setCellValue(ordersEntity.getDiscountAmount() != null
								? ordersEntity.getDiscountAmount().doubleValue()
								: 0.0);
				row.createCell(16).setCellValue(
						ordersEntity.getDeliveryFee() != null ? ordersEntity.getDeliveryFee().doubleValue() : 0.0);
				row.createCell(17).setCellValue(
						ordersEntity.getTotalAmount() != null ? ordersEntity.getTotalAmount().doubleValue() : 0.0);
				row.createCell(18).setCellValue(
						ordersEntity.getSpecialInstructions() != null ? ordersEntity.getSpecialInstructions() : "N/A");
				row.createCell(19)
						.setCellValue(ordersEntity.getEstimatedTime() != null ? ordersEntity.getEstimatedTime() : 0);
				LocalDateTime createdAt = ordersEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(20).setCellValue(formattedCreatedAt);
				LocalDateTime updatedAt = ordersEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(21).setCellValue(formattedUpdatedAt);
				row.createCell(22)
						.setCellValue(ordersEntity.getCustomerName() != null ? ordersEntity.getCustomerName() : "N/A");
				row.createCell(23).setCellValue(
						ordersEntity.getCustomerPhone() != null ? ordersEntity.getCustomerPhone() : "N/A");
				row.createCell(24).setCellValue(
						ordersEntity.getCustomerEmail() != null ? ordersEntity.getCustomerEmail() : "N/A");
				LocalDateTime completedAt = ordersEntity.getCompletedAt();
				String formattedCompletedAt = (completedAt != null) ? completedAt.format(dateTimeFormat) : "";
				row.createCell(25).setCellValue(formattedCompletedAt);

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	/**
	 * Recalculates order subtotal and totalAmount from current order items.
	 * Called after any order update to ensure totals are accurate.
	 */
	private void recalculateOrderTotals(OrdersEntity order) {
		List<OrderItemsEntity> items = orderItemsRepository.findByOrderId_Id(order.getId());

		BigDecimal calculatedSubtotal = BigDecimal.ZERO;
		for (OrderItemsEntity item : items) {
			BigDecimal itemTotal = item.getPrice()
				.multiply(BigDecimal.valueOf(item.getQuantity()));
			calculatedSubtotal = calculatedSubtotal.add(itemTotal);

			if (item.getAddonsTotal() != null) {
				calculatedSubtotal = calculatedSubtotal.add(item.getAddonsTotal());
			}
		}

		order.setSubtotal(calculatedSubtotal);

		BigDecimal taxAmount = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;
		BigDecimal serCharge = order.getSerChargeAmount() != null ? order.getSerChargeAmount() : BigDecimal.ZERO;
		BigDecimal deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
		BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;

		BigDecimal totalAmount = calculatedSubtotal
			.add(taxAmount)
			.add(serCharge)
			.add(deliveryFee)
			.subtract(discount);

		order.setTotalAmount(totalAmount);
	}
}
