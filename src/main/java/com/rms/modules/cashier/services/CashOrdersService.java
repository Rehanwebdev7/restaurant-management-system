package com.rms.modules.cashier.services;

import com.rms.common.Constant;
import com.rms.common.dto.BranchOrderSummaryDTO;
import com.rms.common.entities.AddonsItemsEntity;
import com.rms.common.entities.CustomerDeliveryAddressesEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrderAddonsItemsEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.SectionEntity;
import com.rms.common.entities.TableBookingEntity;
import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.UsersProfileEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.common.util.CacheData;
import com.rms.common.util.DiningTableReleaseScheduler;
import com.rms.common.util.GstCalculator;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.modules.customer.services.CustCustomerDeliveryAddressesService;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.DeliveryZonesRepository;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.OrderAddonsItemsRepository;
import com.rms.common.repositories.OrderItemsRepository;
import com.rms.common.repositories.AddonsItemsRepository;
import com.rms.common.repositories.CustomerDeliveryAddressesRepository;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.SectionRepository;
import com.rms.common.repositories.TableBookingRepository;
import com.rms.common.repositories.UsersProfileRepository;
import com.rms.common.repositories.UsersRepository;

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
import java.time.LocalTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import com.rms.common.util.StatusFilterUtil;

@Service
@Qualifier("cashOrdersService")
public class CashOrdersService implements OrdersServiceIMP {

	private final OrdersRepository ordersrepository;
	private final CustomersRepository customersrepository;
	private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private TableBookingRepository tableBookingRepository;

	@Autowired
	private DiningTablesRepository diningtablesrepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private OrderAddonsItemsRepository orderAddonsItemsRepository;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private AddonsItemsRepository addonsItemsRepository;

	@Autowired
	private SectionRepository sectionRepository;

	@Autowired
	private DeliveryZonesRepository deliveryZonesRepository;

	@Autowired
	private CashCustomerDeliveryAddressesService cashCustomerDeliveryAddressesService;

	@Autowired
	private Constant constant;

	@Autowired
	private CacheData cacheData;

	@Autowired
	private DiningTableReleaseScheduler diningTableReleaseScheduler;

	@Autowired
	private UsersProfileRepository usersProfileRepository;

	public CashOrdersService(OrdersRepository ordersrepository, CustomersRepository customersrepository,
			CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository,
			RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
		this.ordersrepository = ordersrepository;
		this.customersrepository = customersrepository;
		this.customerdeliveryaddressesrepository = customerdeliveryaddressesrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
		this.usersrepository = usersrepository;
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

	private LocalDateTime resolveBookingDateTime(TableBookingEntity booking, LocalDateTime now) {
		LocalDate date = booking.getBookingDate() != null ? booking.getBookingDate() : now.toLocalDate();
		LocalTime time = booking.getBookingTime() != null
				? booking.getBookingTime().withSecond(0).withNano(0)
				: now.toLocalTime().withSecond(0).withNano(0);
		return LocalDateTime.of(date, time);
	}

	private int parseMinutes(String value, int fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException e) {
			return fallback;
		}
	}

	private UsersProfileEntity getProfileForBooking(TableBookingEntity booking) {
		if (booking == null || booking.getTableId() == null || booking.getTableId().getRestaurantId() == null) {
			return null;
		}
		Long restaurantId = booking.getTableId().getRestaurantId().getId();
		return restaurantId != null ? usersProfileRepository.findFirstByRestaurantId_id(restaurantId) : null;
	}

	private Map<String, Object> buildSummaryResponse(Page<OrdersEntity> page) {
		List<BranchOrderSummaryDTO> records = page.getContent().stream()
				.map(BranchOrderSummaryDTO::fromOrderEntity)
				.collect(Collectors.toCollection(ArrayList::new));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", records);
		return response;
	}

	private boolean isPaidStatus(String paymentStatus) {
		return paymentStatus != null
				&& Arrays.asList("SUCCESS", "PAID", "COMPLETED").contains(paymentStatus.trim().toUpperCase());
	}

	private boolean isScalarOnlyUpdate(OrdersEntity ordersEntity) {
		return ordersEntity.getCustomerId() == null
				&& ordersEntity.getCustomerDeliveryAddressesId() == null
				&& ordersEntity.getBranchId() == null
				&& ordersEntity.getCaptainId() == null
				&& ordersEntity.getDeliveryId() == null
				&& ordersEntity.getRestaurantId() == null
				&& ordersEntity.getTableBookingId() == null
				&& ordersEntity.getCashierId() == null
				&& ordersEntity.getSectionId() == null
				&& ordersEntity.getPaymentGatewayId() == null
				&& (ordersEntity.getRawItems() == null || ordersEntity.getRawItems().isEmpty());
	}

	private CustomersEntity resolveCustomerForOrder(Map<String, Object> payload, UsersEntity restaurant)
			throws Exception {
		Map<String, Object> customerMap = (Map<String, Object>) payload.get("customerId");
		if (customerMap != null && customerMap.get("id") != null) {
			Long customerId = Long.parseLong(customerMap.get("id").toString());
			return customersrepository.findById(customerId)
					.orElseThrow(() -> new RuntimeException("Customer not found"));
		}

		String customerPhone = payload.get("customerPhone") != null ? payload.get("customerPhone").toString().trim() : "";
		if (customerPhone.isBlank()) {
			return null;
		}

		CustomersEntity customer = customersrepository.findByMobileNumberAndUserId(customerPhone, restaurant)
				.orElseGet(CustomersEntity::new);

		if (customer.getId() == null) {
			customer.setMobileNumber(customerPhone);
			customer.setUserId(restaurant);
			customer.setIsActive(true);
			customer.setIsDeleted(0);
		}

		String customerName = payload.get("customerName") != null ? payload.get("customerName").toString().trim() : "";
		String customerEmail = payload.get("customerEmail") != null ? payload.get("customerEmail").toString().trim()
				: payload.get("cutomerEmail") != null ? payload.get("cutomerEmail").toString().trim() : "";

		if (!customerName.isBlank()) {
			customer.setName(customerName);
		}
		if (!customerEmail.isBlank()) {
			customer.setEmail(customerEmail);
		}

		return customersrepository.save(customer);
	}

	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate) throws Exception {

		// 🔐 AUTH
		Authorization.authorizeCashier(token);
		tokenUtil.decryptAndStoreToken(token);
		Integer currentUserId = tokenUtil.getCurrentUserId();
		String currentRole = tokenUtil.getCurrentUserType();
		System.out.println("1");
		UsersEntity operator = usersrepository.findById(currentUserId.longValue())
				.orElseThrow(() -> new RuntimeException("User not found"));
		System.out.println("2");
		// 📅 Date range
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);

		List<OrdersEntity> ordersList = "captain".equalsIgnoreCase(currentRole)
				? ordersrepository.findByCaptainIdAndCreatedAtBetween(operator, fromDateTime, toDateTime)
				: ordersrepository.findByCashierIdAndCreatedAtBetween(operator, fromDateTime, toDateTime);

		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

			Sheet sheet = workbook.createSheet("Orders");

			// 🧾 HEADER
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Order Number");
			header.createCell(1).setCellValue("Order Type");
			header.createCell(2).setCellValue("Customer");
			header.createCell(3).setCellValue("Items");
			header.createCell(4).setCellValue("Total Amount");
			header.createCell(5).setCellValue("Order Status");
			header.createCell(6).setCellValue("Payment");
			header.createCell(7).setCellValue("Delivery Partner");
			header.createCell(8).setCellValue("Created At");

			int rowNum = 1;

			for (OrdersEntity order : ordersList) {

				Row row = sheet.createRow(rowNum++);

				// 1️⃣ Order Number
				row.createCell(0).setCellValue(order.getOrderNumber() != null ? order.getOrderNumber() : "");

				// 2️⃣ Order Type
				row.createCell(1).setCellValue(order.getOrderType() != null ? order.getOrderType() : "");

				// 3️⃣ Customer (Name + Mobile)
				String customer = "";
				if (order.getCustomerId() != null) {
					customer = order.getCustomerId().getName() + " (" + order.getCustomerId().getMobileNumber() + ")";
				}
				row.createCell(2).setCellValue(customer);

				// 4️⃣ ITEMS (Flatten order_items)
				StringBuilder itemsBuilder = new StringBuilder();
				if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
					for (OrderItemsEntity item : order.getOrderItems()) {
						itemsBuilder.append(item.getMenuItemName()).append(" x").append(item.getQuantity())
								.append(", ");
					}
					// remove last comma
					itemsBuilder.setLength(itemsBuilder.length() - 2);
				}
				row.createCell(3).setCellValue(itemsBuilder.toString());

				// 5️⃣ Total Amount
				row.createCell(4)
						.setCellValue(order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);

				// 6️⃣ Order Status
				row.createCell(5).setCellValue(order.getStatus() != null ? order.getStatus() : "");

				// 7️⃣ Payment (Status + Method)
				String payment = "";
				if (order.getPaymentStatus() != null) {
					payment = order.getPaymentStatus();
				}
				if (order.getPaymentMethod() != null) {
					payment += " (" + order.getPaymentMethod() + ")";
				}
				row.createCell(6).setCellValue(payment);
				// 8️⃣ Restaurant Name
				// 1️⃣1️⃣ Delivery Partner
				row.createCell(7).setCellValue(order.getDeliveryId() != null ? order.getDeliveryId().getName() : "");

				// 8️⃣ Created At
				row.createCell(8)
						.setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(dateTimeFormat) : "");
			}

			// 🔧 Auto-size
			for (int i = 0; i <= 7; i++) {
				sheet.autoSizeColumn(i);
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	public Map<String, Object> getOrdersByCashierId(String token, LocalDate fromDate, LocalDate toDate, String status,
			String paymentStatus, String paymentMethod, String searchValue, Integer pageNumber, Integer pageSize

	) throws Exception {

		// 🔐 CASHIER AUTH
		Authorization.authorizeCashier(token);

		// 🔓 TOKEN → CASHIER
		tokenUtil.decryptAndStoreToken(token);
		Long cashierId = tokenUtil.getCurrentUserId().longValue();
		String currentRole = tokenUtil.getCurrentUserType();

		// ================= FETCH CASHIER =================
		UsersEntity cashierUser = usersRepository.findById(cashierId)
				.orElseThrow(() -> new RuntimeException("Cashier not found"));

		// ================= BRANCH =================
		UsersEntity branchUser = cashierUser.getBranchId();
		if (branchUser == null) {
			throw new RuntimeException("Branch not assigned to cashier");
		}
		Long branchId = branchUser.getId();

		if (branchUser.getParentId() == null) {
			throw new RuntimeException("Restaurant not found for branch");
		}
		Long restaurantId = branchUser.getParentId().getId();

		Specification<OrdersEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			if ("captain".equalsIgnoreCase(currentRole)) {
				predicates.add(cb.equal(root.get("captainId").get("id"), cashierId));
			} else {
				predicates.add(cb.equal(root.get("cashierId").get("id"), cashierId));
			}

			// ✅ BRANCH FILTER
			predicates.add(cb.equal(root.get("branchId").get("id"), branchId));

			// ✅ RESTAURANT FILTER
			predicates.add(cb.equal(root.get("restaurantId").get("id"), restaurantId));

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates
						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			}

			// ================= STATUS FILTER =================
			Predicate statusPred = StatusFilterUtil.buildStatusPredicate(cb, root.get("status"), status);
			if (statusPred != null) {
				predicates.add(statusPred);
			}

			if (paymentStatus != null && !paymentStatus.trim().isEmpty()) {
				predicates.add(cb.equal(cb.lower(root.get("paymentStatus")), paymentStatus.toLowerCase()));
			}

			// ================= PAYMENT METHOD FILTER =================
			if (paymentMethod != null && !paymentMethod.trim().isEmpty()) {
				predicates.add(cb.equal(cb.lower(root.get("paymentMethod")), paymentMethod.toLowerCase()));
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.isBlank()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				searchPredicates.add(cb.like(cb.lower(root.get("orderNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("orderType")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("tableNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));

				try {
					BigDecimal amount = new BigDecimal(searchValue);
					searchPredicates.add(cb.equal(root.get("totalAmount"), amount));
				} catch (Exception ignored) {
				}

				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		// ================= PAGINATION =================
		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page<OrdersEntity> page = ordersRepository.findAll(spec, pageable);
		return buildSummaryResponse(page);
	}

	public Map<String, Object> getOrdersWithFilters(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 CASHIER AUTH
		Authorization.authorizeCashier(token);

		// 🔓 TOKEN → CASHIER
		tokenUtil.decryptAndStoreToken(token);
		Integer cashierId = tokenUtil.getCurrentUserId();

		// ================= CASHIER USER =================
		UsersEntity cashier = usersRepository.findById(cashierId.longValue())
				.orElseThrow(() -> new RuntimeException("Cashier not found from token"));

		// ================= BRANCH USER =================
		UsersEntity branchUser = cashier.getBranchId();
		if (branchUser == null) {
			throw new RuntimeException("Branch not mapped with cashier");
		}

		// ================= RESTAURANT USER (OPTIONAL) =================
		UsersEntity restaurantUser = branchUser.getParentId(); // can be null

		Specification<OrdersEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= JOINS =================
			Join<OrdersEntity, UsersEntity> branchJoin = root.join("branchId", JoinType.LEFT);

			// ================= BRANCH FILTER (MANDATORY) =================
			predicates.add(cb.equal(branchJoin.get("id"), branchUser.getId()));

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates
						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			}

			// ================= STATUS FILTER =================
			Predicate statusPred2 = StatusFilterUtil.buildStatusPredicate(cb, root.get("status"), status);
			if (statusPred2 != null) {
				predicates.add(statusPred2);
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.trim().isEmpty()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				// 🔹 ORDER FIELDS
				searchPredicates.add(cb.like(cb.lower(root.get("orderNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("orderType")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("tableNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));

				// 🔹 CUSTOMER INFO
				searchPredicates.add(cb.like(cb.lower(root.get("customerName")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerPhone")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerEmail")), pattern));

				// 🔹 AMOUNT
				try {
					BigDecimal amount = new BigDecimal(searchValue);
					searchPredicates.add(cb.equal(root.get("totalAmount"), amount));
				} catch (Exception ignored) {
				}

				// 🔹 BRANCH NAME
				searchPredicates.add(cb.like(cb.lower(branchJoin.get("name")), pattern));

				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));

		Page<OrdersEntity> page = ordersRepository.findAll(spec, pageable);
		return buildSummaryResponse(page);
	}

	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> addOrderss(Map<String, Object> payload, String token) throws Exception {

		System.out.println("\n╔══════════════════════════════════════════════╗");
		System.out.println("║            🧾 ORDER CREATION START           ║");
		System.out.println("╚══════════════════════════════════════════════╝");

		// 🔐 AUTHENTICATION
		Authorization.authorizeCashier(token);
		System.out.println("🔐 AUTH            : Cashier Authorized");

		// 🔓 TOKEN DATA EXTRACTION
		tokenUtil.decryptAndStoreToken(token);
		Long cashierId = tokenUtil.getCurrentUserId().longValue();
		String currentRole = tokenUtil.getCurrentUserType();
		Long branchIdFromToken = tokenUtil.getBranchId() != null ? tokenUtil.getBranchId().longValue() : null;

		System.out.println("👤 Cashier ID      : " + cashierId);
		System.out.println("🏬 Branch ID(Token): " + branchIdFromToken);

		// 🔍 FETCH CASHIER DETAILS
		UsersEntity cashier = usersrepository.findById(cashierId)
				.orElseThrow(() -> new RuntimeException("Cashier not found"));

		// 🔍 FETCH BRANCH DETAILS
		UsersEntity branch = cashier.getBranchId();
		if (branch == null)
			throw new RuntimeException("Branch not mapped with cashier");

		// 🔍 FETCH RESTAURANT DETAILS
		UsersEntity restaurant = branch.getParentId();
		if (restaurant == null)
			throw new RuntimeException("Restaurant not mapped with branch");

		System.out.println("🏬 Branch ID       : " + branch.getId());
		System.out.println("🍽️ Restaurant ID  : " + restaurant.getId());

		// ============================================================
		// 🔥 ORDER TYPE
		// ============================================================
		String orderType = payload.get("orderType") != null && !payload.get("orderType").toString().trim().isEmpty()
				? payload.get("orderType").toString().trim().toUpperCase()
				: "DINING";

		// Accept DINE_IN as alias for DINING (frontend uses DINE_IN)
		if ("DINE_IN".equals(orderType)) orderType = "DINING";

		String paymentMethod = payload.get("paymentMethod") != null
				? payload.get("paymentMethod").toString().trim().toUpperCase()
				: "CASH";

		if (!Arrays.asList("DELIVERY", "TAKEAWAY", "DINING").contains(orderType))
			throw new RuntimeException("Invalid order type");

		System.out.println("\n══════════════ ORDER INFO ══════════════");
		System.out.println("Order Type       : " + orderType);
		System.out.println("Payment Method   : " + paymentMethod);

		// ============================================================
		// 👤 CUSTOMER
		// ============================================================
		CustomersEntity customer = resolveCustomerForOrder(payload, restaurant);
		if (customer != null) {
			System.out.println("Customer Name    : " + customer.getName());
		}

		// ============================================================
		// VARIABLES
		// ============================================================
		CustomerDeliveryAddressesEntity addressExist = null;
		Double distance = null;
		DeliveryZonesEntity matchedZone = null;
		BigDecimal deliveryCharge = BigDecimal.ZERO;
		TableBookingEntity tableBooking = null;
		SectionEntity sectionRecord = null;

		// ============================================================
		// 🚚 DELIVERY
		// ============================================================
		if ("DELIVERY".equals(orderType)) {

			if (customer == null)
				throw new RuntimeException("Customer required for DELIVERY");

			Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
			if (custAddressMap == null || custAddressMap.get("id") == null)
				throw new RuntimeException("custAddressId required");

			Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());

			addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
					.orElseThrow(() -> new RuntimeException("Address not found"));

			if (!addressExist.getCustomerId().getId().equals(customer.getId()))
				throw new RuntimeException("Address does not belong to customer");

			if (payload.get("distance") == null)
				throw new RuntimeException("Distance required");

			distance = Double.parseDouble(payload.get("distance").toString());
			matchedZone = findMatchingDeliveryZone(distance, branch.getId());

			deliveryCharge = matchedZone.getDeliveryCharge() != null ? matchedZone.getDeliveryCharge()
					: BigDecimal.ZERO;

			System.out.println("\n════════════ DELIVERY DETAILS ═══════════");
			System.out.println("Distance (KM)    : " + distance);
			System.out.println("Delivery Charge : ₹" + deliveryCharge);
		}

		// ============================================================
		// 🍽️ DINING
		// ============================================================
		if ("DINING".equals(orderType)) {

			Map<String, Object> tableBookingMap = (Map<String, Object>) payload.get("tableBookingId");
			if (tableBookingMap == null || tableBookingMap.get("id") == null)
				throw new RuntimeException("tableBookingId required");

			Long tableBookingId = Long.parseLong(tableBookingMap.get("id").toString());

			tableBooking = tableBookingRepository.findById(tableBookingId)
					.orElseThrow(() -> new RuntimeException("Table booking not found"));

			String bookingStatus = tableBooking.getStatus() != null ? tableBooking.getStatus().toUpperCase() : "";
			if (Arrays.asList("NO_SHOW", "CANCELLED").contains(bookingStatus)) {
				throw new RuntimeException("Table reservation has expired. Please book again.");
			}
			if ("RESERVED".equals(bookingStatus)) {
				LocalDateTime now = LocalDateTime.now();
				LocalDateTime bookingAt = resolveBookingDateTime(tableBooking, now);
				UsersProfileEntity profile = getProfileForBooking(tableBooking);
				int bufferMinutes = parseMinutes(profile != null ? profile.getBookingBufferMinutes() : null, 0);
				if (bookingAt.isAfter(now.plusMinutes(bufferMinutes))) {
					throw new RuntimeException("This reservation is scheduled for later. Please create the order closer to the booked time.");
				}
			}

			if (tableBooking.getTableId() != null && tableBooking.getTableId().getSectionId() != null) {

				sectionRecord = tableBooking.getTableId().getSectionId();
				System.out.println("\n════════════ DINING DETAILS ════════════");
				System.out.println("Section Name    : " + sectionRecord.getName());
			}
		}

		// ============================================================
		// 🧾 CREATE ORDER
		// ============================================================
		OrdersEntity order = new OrdersEntity();
		order.setRestaurantId(restaurant);
		order.setBranchId(branch);
		if ("captain".equalsIgnoreCase(currentRole)) {
			order.setCaptainId(cashier);
		} else {
			order.setCashierId(cashier);
		}
		order.setCustomerId(customer);
		order.setPaymentMethod(paymentMethod);
		order.setOrderType(orderType);
		order.setStatus("PENDING");
		order.setPaymentStatus("PENDING");
		order.setDeliveryFee(deliveryCharge);

		if (addressExist != null)
			order.setCustomerDeliveryAddressesId(addressExist);

		if (tableBooking != null)
			order.setTableBookingId(tableBooking);
		if (tableBooking != null && tableBooking.getTableId() != null) {
			order.setTableNumber(tableBooking.getTableId().getTableNumber());
		}

		if (sectionRecord != null)
			order.setSectionId(sectionRecord);

		order.setCustomerName((String) payload.get("customerName"));
		order.setCustomerPhone((String) payload.get("customerPhone"));
		order.setCustomerEmail(
				payload.get("customerEmail") != null ? payload.get("customerEmail").toString()
						: (String) payload.get("cutomerEmail"));

		OrdersEntity savedOrder = ordersrepository.save(order);
		String orderGeneratedId = Constant.generateOrderId(savedOrder.getId());

		// If this order is tied to a reservation, mark the table as occupied and confirm the booking.
		if (tableBooking != null && tableBooking.getTableId() != null) {
			DiningTablesEntity diningTable = tableBooking.getTableId();
			if (diningTable.getStatus() == null || diningTable.getStatus() != 2) {
				diningTable.setStatus(2);
				diningTable.setUpdatedAt(java.time.LocalDateTime.now());
				diningtablesrepository.save(diningTable);
			}
			if ("RESERVED".equalsIgnoreCase(tableBooking.getStatus())) {
				tableBooking.setStatus("CONFIRMED");
				tableBookingRepository.save(tableBooking);
			}
		}

		System.out.println("\n🧾 Order Number   : " + orderGeneratedId);

		// ============================================================
		// 🛒 ITEMS BILLING
		// ============================================================
		BigDecimal orderItemsTotal = BigDecimal.ZERO;
		BigDecimal orderAddonsTotal = BigDecimal.ZERO;

		List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
		if (items == null || items.isEmpty())
			throw new RuntimeException("Items empty");

		System.out.println("\n════════════ ITEM BILL ════════════");

		java.util.List<OrderItemsEntity> orderedSavedItems = new java.util.ArrayList<>();
		java.util.List<MenuItemsEntity>  orderedMenuItems  = new java.util.ArrayList<>();

		for (Map<String, Object> itemMap : items) {

			Long menuItemId = Long.parseLong(itemMap.get("menu_item_id").toString());
			Integer qty = Integer.parseInt(itemMap.get("quantity").toString());

			MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
					.orElseThrow(() -> new RuntimeException("Menu item not found"));

			BigDecimal itemTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(qty));
			orderItemsTotal = orderItemsTotal.add(itemTotal);

			System.out.println(menuItem.getName() + "  x" + qty + "  = ₹" + itemTotal);

			OrderItemsEntity orderItem = new OrderItemsEntity();
			orderItem.setOrderId(savedOrder);
			orderItem.setMenuItemId(menuItem);
			orderItem.setMenuItemName(menuItem.getName());
			orderItem.setQuantity(qty);
			orderItem.setPrice(itemTotal);
			orderItem.setAddonsTotal(BigDecimal.ZERO);

			OrderItemsEntity savedItem = orderItemsRepository.save(orderItem);

			List<Map<String, Object>> addonItems = (List<Map<String, Object>>) itemMap.get("addonItems");
			BigDecimal addonTotal = BigDecimal.ZERO;

			if (addonItems != null) {
				for (Map<String, Object> addonMap : addonItems) {

					Long addonId = Long.parseLong(addonMap.get("addonItemId").toString());
					Integer addonQty = Integer.parseInt(addonMap.get("quantity").toString());

					AddonsItemsEntity addon = addonsItemsRepository.findById(addonId)
							.orElseThrow(() -> new RuntimeException("Addon not found"));

					BigDecimal addonPrice = addon.getPrice().multiply(BigDecimal.valueOf(addonQty));
					addonTotal = addonTotal.add(addonPrice);

					System.out.println("  ➕ " + addon.getName() + " x" + addonQty + " = ₹" + addonPrice);

					OrderAddonsItemsEntity orderAddon = new OrderAddonsItemsEntity();
					orderAddon.setOrderItemId(savedItem);
					orderAddon.setName(addon.getName());
					orderAddon.setQuantity(addonQty.toString());
					orderAddon.setPrice(addonPrice);
					orderAddonsItemsRepository.save(orderAddon);
				}
			}

			savedItem.setAddonsTotal(addonTotal);
			savedItem.setItemTotal(itemTotal.add(addonTotal));
			orderItemsRepository.save(savedItem);

			orderAddonsTotal = orderAddonsTotal.add(addonTotal);

			orderedSavedItems.add(savedItem);
			orderedMenuItems.add(menuItem);
		}

		// ============================================================
		// 🧮 TAX SECTION
		// ============================================================
		SectionEntity taxSection = null;

		if ("DINING".equals(orderType)) {
			taxSection = sectionRecord;
		} else {
			taxSection = sectionRepository.findByBranchId_IdAndType(branch.getId(), "ONLINE").orElse(null);
		}

		// ============================================================
		// 🧾 PER-ITEM GST: uses each menu item's gst_percentage / gst_type,
		// falling back to the section's taxPercentage when the item has none.
		// Service charge stays section-based.
		// ============================================================
		BigDecimal fallbackRate = (taxSection != null && taxSection.getTaxPercentage() != null)
				? taxSection.getTaxPercentage()
				: BigDecimal.ZERO;

		java.util.List<GstCalculator.Line> gstLines = new java.util.ArrayList<>(orderedSavedItems.size());
		for (int i = 0; i < orderedSavedItems.size(); i++) {
			OrderItemsEntity oi = orderedSavedItems.get(i);
			MenuItemsEntity  mi = orderedMenuItems.get(i);
			BigDecimal line = (oi.getPrice() != null ? oi.getPrice() : BigDecimal.ZERO)
					.add(oi.getAddonsTotal() != null ? oi.getAddonsTotal() : BigDecimal.ZERO);
			gstLines.add(new GstCalculator.Line(line, mi.getGstPercentage(), mi.getGstType()));
		}

		GstCalculator.Result gstResult =
				GstCalculator.compute(gstLines, fallbackRate, BigDecimal.ZERO);

		for (int i = 0; i < orderedSavedItems.size(); i++) {
			OrderItemsEntity oi = orderedSavedItems.get(i);
			GstCalculator.LineResult lr = gstResult.lines.get(i);
			oi.setGstRate(lr.effectiveRate);
			oi.setGstType(lr.effectiveType);
			oi.setTaxableAmount(lr.taxableAmount);
			oi.setGstAmount(lr.gstAmount);
			orderItemsRepository.save(oi);
		}

		BigDecimal gstAmount = gstResult.gstAmount;

		BigDecimal serviceChargeAmount = BigDecimal.ZERO;
		if (taxSection != null && taxSection.getServiceChargePercentage() != null) {
			BigDecimal subtotalGross = orderItemsTotal.add(orderAddonsTotal);
			serviceChargeAmount = subtotalGross
					.multiply(taxSection.getServiceChargePercentage())
					.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
		}

		// ============================================================
		// 💰 FINAL BILL
		// subtotal persisted = pre-tax (inclusive-aware); items payable comes
		// from the calculator so inclusive/exclusive/mixed carts all reconcile.
		// ============================================================
		BigDecimal finalSubtotal = gstResult.subtotal;
		BigDecimal netAmount = gstResult.itemsPayable.add(serviceChargeAmount).add(deliveryCharge);

		System.out.println("\n════════════ FINAL BILL ════════════");
		System.out.println("Items Subtotal   : ₹" + orderItemsTotal);
		System.out.println("Addons Total     : ₹" + orderAddonsTotal);
		System.out.println("GST              : ₹" + gstAmount);
		System.out.println("Service Charge   : ₹" + serviceChargeAmount);
		System.out.println("Delivery Charge  : ₹" + deliveryCharge);
		System.out.println("----------------------------------");
		System.out.println("TOTAL PAYABLE    : ₹" + netAmount);
		System.out.println("══════════════════════════════════");

		savedOrder.setSubtotal(finalSubtotal);
		savedOrder.setTaxAmount(gstAmount);
		savedOrder.setSerChargeAmount(serviceChargeAmount);
		savedOrder.setTotalAmount(netAmount);
		savedOrder.setOrderNumber(orderGeneratedId);
		savedOrder.setEstimatedTime("DELIVERY".equals(orderType) ? 30 : 20);

		ordersrepository.save(savedOrder);

		System.out.println("\n✅ ORDER COMPLETED SUCCESSFULLY");
		System.out.println("══════════════════════════════════");
		// PG orders: kitchen notification + cache add payment SUCCESS ke baad hoga
		if (!"PG".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
			// ================== KITCHEN NOTIFICATION ==================
			System.out.println("\n🔔 Triggering Kitchen Notification...");

			Map<String, Object> data = new LinkedHashMap<>();
			data.put("type", "NEW_ORDER");
			data.put("orderId", orderGeneratedId);
			data.put("orderType", savedOrder.getOrderType());
			data.put("amount", savedOrder.getTotalAmount());
			data.put("paymentMethod", savedOrder.getPaymentMethod());
			data.put("branchId", branch.getId());

			System.out.println("📦 Notification Data Payload : " + data);

			constant.sendNotificationByBranchAndRole(branch.getId(), "KITCHEN", "🍽️ New Order Received!",
					"Order #" + orderGeneratedId + " has arrived. Please start preparing.", data);

			System.out.println("✅ Kitchen notification sent for Order: " + orderGeneratedId);

			// ================= ADD ORDER TO KITCHEN CACHE =================
			Map<String, Object> cachePayload = new LinkedHashMap<>();
			cachePayload.put("orderId", savedOrder.getId());
			cachePayload.put("branchId", savedOrder.getBranchId().getId());
			cachePayload.put("orderType", savedOrder.getOrderType());
			cachePayload.put("amount", savedOrder.getTotalAmount());
			cachePayload.put("status", savedOrder.getStatus());
			cachePayload.put("createdAt", savedOrder.getCreatedAt());
			cacheData.addKitchenPendingOrder(cachePayload);
			System.out.println("✅ Kitchen cache updated for Order: " + orderGeneratedId);
		}

//		return "Order Created Successfully - Order ID: " + orderGenerated_id;

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("id", savedOrder.getId());
		response.put("orderNumber", savedOrder.getOrderNumber());
		response.put("orderType", savedOrder.getOrderType());
		response.put("paymentMethod", savedOrder.getPaymentMethod());
		response.put("paymentStatus", savedOrder.getPaymentStatus());
		response.put("status", savedOrder.getStatus());
		response.put("subtotal", savedOrder.getSubtotal());
		response.put("taxAmount", savedOrder.getTaxAmount());
		response.put("deliveryFee", savedOrder.getDeliveryFee());
		response.put("totalAmount", savedOrder.getTotalAmount());
		if (savedOrder.getTableBookingId() != null) {
			response.put("tableBookingId", savedOrder.getTableBookingId().getId());
		}
		return response;
	}
//	@Transactional(rollbackFor = Exception.class)
//	public String addOrderss(Map<String, Object> payload, String token) throws Exception {
//
//		System.out.println("\n==================== ORDER CREATION START ====================");
//
//		// 🔐 AUTHENTICATION
//		Authorization.authorizeCashier(token);
//		System.out.println("AUTH ✔ Cashier Authorized");
//
//		// 🔓 TOKEN DATA EXTRACTION
//		tokenUtil.decryptAndStoreToken(token);
//		Long cashierId = tokenUtil.getCurrentUserId().longValue();
//		Long branchId = tokenUtil.getBranchId().longValue();
//
//		System.out.println("Cashier ID       : " + cashierId);
//		System.out.println("Branch ID (TOKEN): " + branchId);
//
//		// 🔍 FETCH CASHIER DETAILS
//		UsersEntity cashier = usersrepository.findById(cashierId)
//				.orElseThrow(() -> new RuntimeException("Cashier not found"));
//
//		// 🔍 FETCH BRANCH DETAILS
//		UsersEntity branch = cashier.getBranchId();
//		if (branch == null)
//			throw new RuntimeException("Branch not mapped with cashier");
//
//		// 🔍 FETCH RESTAURANT DETAILS
//		UsersEntity restaurant = branch.getParentId();
//		if (restaurant == null)
//			throw new RuntimeException("Restaurant not mapped with branch");
//
//		System.out.println("Branch ID        : " + branch.getId());
//		System.out.println("Restaurant ID    : " + restaurant.getId());
//
//		// ============================================================
//		// 🔥 RESTAURANT TIMING VALIDATION
//		// ============================================================
//		System.out.println("\n---------------- RESTAURANT TIMING CHECK ----------------");
//
//		System.out.println("✔ Restaurant is open. Order placement allowed");
//
//		// ============================================================
//		// 🔥 ORDER TYPE VALIDATION & PROCESSING
//		// ============================================================
//		System.out.println("\n---------------- ORDER TYPE VALIDATION ----------------");
//
//		// Validate and set order type
//		String orderType = payload.get("orderType") != null && !payload.get("orderType").toString().trim().isEmpty()
//				? payload.get("orderType").toString().trim().toUpperCase()
//				: "DINING"; // Default to DINING if not provided
//
//		System.out.println("Order Type Received: " + orderType);
//
//		String paymentMethod = payload.get("paymentMethod") != null
//				&& !payload.get("paymentMethod").toString().trim().isEmpty()
//						? payload.get("paymentMethod").toString().trim().toUpperCase()
//						: "CASH";
//
//		// Validate order type
//		if (!Arrays.asList("DELIVERY", "TAKEAWAY", "DINING").contains(orderType)) {
//			throw new RuntimeException("Invalid order type. Allowed values: DELIVERY, TAKEAWAY, DINING");
//		}
//
//		// ================== CUSTOMER DETAILS EXTRACTION ==================
//		Map<String, Object> customerMap = (Map<String, Object>) payload.get("customerId");
//		Map<String, Object> sectionMap = (Map<String, Object>) payload.get("sectionId");
//
//		CustomersEntity customer = null;
//		if (customerMap != null && customerMap.get("id") != null) {
//			Long customerId = Long.parseLong(customerMap.get("id").toString());
//			customer = customersrepository.findById(customerId)
//					.orElseThrow(() -> new RuntimeException("Customer not found"));
//			System.out.println("Customer Found    : " + customer.getId() + " - " + customer.getName());
//		}
//
//		// ================== INITIALIZE VARIABLES ==================
//		CustomerDeliveryAddressesEntity addressExist = null;
//		Double distance = null;
//		DeliveryZonesEntity matchedZone = null;
//		BigDecimal deliveryCharge = BigDecimal.ZERO;
//		TableBookingEntity tableBooking = null;
//
//		// ============================================================
//		// 🔥 CONDITION 1: DELIVERY ORDER PROCESSING
//		// ============================================================
//		if ("DELIVERY".equals(orderType)) {
//			System.out.println("\n---------------- DELIVERY ORDER PROCESSING ----------------");
//
//			// ✅ VALIDATION 1: CUSTOMER MANDATORY FOR DELIVERY
//			if (customer == null) {
//				throw new RuntimeException("Customer is mandatory for DELIVERY order");
//			}
//
//			// ✅ VALIDATION 2: CUSTOMER ADDRESS MANDATORY
//			Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
//
//			if (custAddressMap == null || custAddressMap.get("id") == null) {
//				throw new RuntimeException("custAddressId is mandatory for DELIVERY order");
//			}
//
//			Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());
//
//			// ✅ FETCH ADDRESS DETAILS
//			addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
//					.orElseThrow(() -> new RuntimeException("Customer delivery address not found"));
//
//			// ✅ VALIDATE ADDRESS BELONGS TO CUSTOMER
//			if (!addressExist.getCustomerId().getId().equals(customer.getId())) {
//				throw new RuntimeException("Address does not belong to the specified customer");
//			}
//
//			System.out.println("Address Found     : " + addressExist.getId() + " - " + addressExist.getAddressLine1());
//
//			// ✅ UPDATE ADDRESS AS DEFAULT
//			CustomerDeliveryAddressesEntity addressUpdatePayload = new CustomerDeliveryAddressesEntity();
//			addressUpdatePayload.setId(custAddressId);
//			addressUpdatePayload.setCustomerId(customer);
//			addressUpdatePayload.setIsDefault(true);
//			addressUpdatePayload.setIsActive(true);
//
//			System.out.println("✔ Customer address validated and updated");
//
//			// ✅ VALIDATION 3: DISTANCE MANDATORY
//			if (payload.get("distance") == null) {
//				throw new RuntimeException("Distance is required for DELIVERY order");
//			}
//
//			// ✅ EXTRACT AND VALIDATE DISTANCE
//			distance = Double.parseDouble(payload.get("distance").toString());
//
//			if (distance == null || distance <= 0) {
//				throw new RuntimeException("Invalid distance value for DELIVERY order");
//			}
//
//			System.out.println("Delivery Distance : " + distance + " KM");
//
//			// ✅ FIND MATCHING DELIVERY ZONE
//			matchedZone = findMatchingDeliveryZone(distance, branchId);
//
//			if (matchedZone == null) {
//				throw new RuntimeException("No matching delivery zone found for distance: " + distance + " KM");
//			}
//
//			deliveryCharge = matchedZone.getDeliveryCharge() != null ? matchedZone.getDeliveryCharge()
//					: BigDecimal.ZERO;
//
//			System.out.println("Matched Zone     : " + matchedZone.getZoneName());
//			System.out.println("Delivery Charge  : " + deliveryCharge);
//		}
//
//		// ============================================================
//		// 🔥 CONDITION 3: DINING ORDER PROCESSING
//		// ============================================================
//		if ("DINING".equals(orderType)) {
//			System.out.println("\n---------------- DINING ORDER PROCESSING ----------------");
//
//			// ✅ VALIDATION: TABLE BOOKING ID MANDATORY
//			Map<String, Object> tableBookingMap = (Map<String, Object>) payload.get("tableBookingId");
//
//			if (tableBookingMap == null || tableBookingMap.get("id") == null) {
//				throw new RuntimeException("tableBookingId is mandatory for DINING order");
//			}
//
//			Long tableBookingId = Long.parseLong(tableBookingMap.get("id").toString());
//
//			// ✅ FETCH TABLE BOOKING DETAILS
//			tableBooking = tableBookingRepository.findById(tableBookingId)
//					.orElseThrow(() -> new RuntimeException("Table booking not found"));
//
//			// ✅ VALIDATE TABLE BOOKING BELONGS TO BRANCH
////	        if (!tableBooking.getBranchId().getId().equals(branch.getId())) {
////	            throw new RuntimeException("Table booking does not belong to this branch");
////	        }
//
//			System.out.println("Table Booking ID : " + tableBookingId);
//			System.out.println("Table Number     : " + tableBooking.getTableId().getTableNumber());
//			System.out.println("✔ Table booking validated successfully");
//		}
//
//		// ============================================================
//		// 🔥 CONDITION 2: TAKEAWAY ORDER PROCESSING
//		// ============================================================
//		if ("TAKEAWAY".equals(orderType)) {
//			System.out.println("\n---------------- TAKEAWAY ORDER PROCESSING ----------------");
//			System.out.println("✔ Takeaway order - No address, distance, or table booking required");
//		}
//
//		// ================== CREATE ORDER ENTITY ==================
//		OrdersEntity order = new OrdersEntity();
//
//		// ✅ SET COMMON FIELDS FOR ALL ORDER TYPES
//		order.setRestaurantId(restaurant);
//		order.setBranchId(branch);
//		order.setCashierId(cashier);
//		order.setCustomerId(customer);
//		order.setPaymentMethod(paymentMethod);
//
//		// ✅ SET ADDRESS ONLY FOR DELIVERY ORDERS
//		if (addressExist != null && "DELIVERY".equals(orderType)) {
//			order.setCustomerDeliveryAddressesId(addressExist);
//		}
//
//		// ✅ SET TABLE BOOKING ONLY FOR DINING ORDERS
//		SectionEntity sectionRecord = null;
//
//		if ("DINING".equals(orderType) && tableBooking != null) {
//
//			order.setTableBookingId(tableBooking);
//
//			if (tableBooking.getTableId() != null && tableBooking.getTableId().getSectionId() != null) {
//
//				sectionRecord = tableBooking.getTableId().getSectionId();
//				order.setSectionId(sectionRecord);
//
//				System.out.println("Section auto-fetched from table booking: " + sectionRecord.getName());
//
//			} else {
//				System.out.println("⚠️ Section not mapped with table. Skipping section assignment.");
//			}
//		}
//
//		// ✅ SET CUSTOMER DETAILS
//		order.setCustomerName((String) payload.get("customerName"));
//		order.setCustomerEmail((String) payload.get("cutomerEmail"));
//		order.setCustomerPhone((String) payload.get("customerPhone"));
//
//		// ✅ SET ORDER TYPE AND STATUS
//		order.setOrderType(orderType);
//		System.out.println("Order Type Final → " + orderType);
//
//		order.setStatus("PENDING");
//		order.setPaymentStatus("PENDING");
//		order.setSubtotal(BigDecimal.ZERO);
//		order.setTotalAmount(BigDecimal.ZERO);
//		order.setDeliveryFee(deliveryCharge); // Will be zero for non-delivery orders
//
//		// ✅ SAVE INITIAL ORDER
//		OrdersEntity savedOrder = ordersrepository.save(order);
//		String orderGenerated_id = Constant.generateOrderId(savedOrder.getId());
//
//		System.out.println("\nORDER CREATED → Order ID : " + savedOrder.getId());
//		System.out.println("Order Number    : " + orderGenerated_id);
//
//		// ================== ORDER ITEMS PROCESSING ==================
//		BigDecimal orderItemsTotal = BigDecimal.ZERO;
//		BigDecimal orderAddonsTotal = BigDecimal.ZERO;
//
//		List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
//
//		if (items == null || items.isEmpty()) {
//			throw new RuntimeException("Order items cannot be empty");
//		}
//
//		System.out.println("\n---------------- ORDER ITEMS PROCESSING ----------------");
//		System.out.println("Total Items Found: " + items.size());
//
//		int itemCounter = 1;
//		for (Map<String, Object> itemMap : items) {
//			System.out.println("\nProcessing Item " + itemCounter + " of " + items.size());
//
//			// ✅ CREATE ORDER ITEM ENTITY
//			OrderItemsEntity orderItem = new OrderItemsEntity();
//			orderItem.setOrderId(savedOrder);
//
//			// ✅ VALIDATE AND FETCH MENU ITEM
//			if (itemMap.get("menu_item_id") == null) {
//				throw new RuntimeException("menu_item_id is required for all items");
//			}
//
//			Long menuItemId = Long.parseLong(itemMap.get("menu_item_id").toString());
//			MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
//					.orElseThrow(() -> new RuntimeException("Menu item not found with ID: " + menuItemId));
//
//			// ✅ CALCULATE ITEM PRICE
//			BigDecimal price = menuItem.getPrice();
//
//			if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
//				throw new RuntimeException("Invalid price for menu item: " + menuItem.getName());
//			}
//
//			// ✅ VALIDATE QUANTITY
//			if (itemMap.get("quantity") == null) {
//				throw new RuntimeException("Quantity is required for menu item: " + menuItem.getName());
//			}
//
//			Integer quantity = Integer.parseInt(itemMap.get("quantity").toString());
//
//			if (quantity <= 0) {
//				throw new RuntimeException("Quantity must be greater than 0 for menu item: " + menuItem.getName());
//			}
//
//			BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(quantity));
//
//			// ✅ SET ORDER ITEM DETAILS
//			orderItem.setMenuItemId(menuItem);
//			orderItem.setMenuItemName(menuItem.getName());
//			orderItem.setPrice(itemTotal);
//			orderItem.setQuantity(quantity);
//			orderItem.setAddonsTotal(BigDecimal.ZERO);
//			orderItem.setSpecialInstructions((String) itemMap.get("special_instructions"));
//
//			// ✅ SAVE ORDER ITEM
//			OrderItemsEntity savedOrderItem = orderItemsRepository.save(orderItem);
//			orderItemsTotal = orderItemsTotal.add(itemTotal);
//
//			System.out.println("  Item: " + menuItem.getName() + " | Qty: " + quantity + " | Price: " + itemTotal);
//
//			// ================== ADDONS PROCESSING ==================
//			BigDecimal addonTotalForItem = BigDecimal.ZERO;
//			List<Map<String, Object>> addonItems = (List<Map<String, Object>>) itemMap.get("addonItems");
//
//			if (addonItems != null && !addonItems.isEmpty()) {
//				System.out.println("  Addons Found: " + addonItems.size());
//
//				int addonCounter = 1;
//				for (Map<String, Object> addonMap : addonItems) {
//
//					// ✅ VALIDATE ADDON ITEM ID
//					if (addonMap.get("addonItemId") == null) {
//						throw new RuntimeException("addonItemId is required for addons");
//					}
//
//					Long addonItemId = Long.parseLong(addonMap.get("addonItemId").toString());
//
//					// ✅ VALIDATE ADDON QUANTITY
//					if (addonMap.get("quantity") == null) {
//						throw new RuntimeException("Quantity is required for addon item ID: " + addonItemId);
//					}
//
//					Integer addonQty = Integer.parseInt(addonMap.get("quantity").toString());
//
//					if (addonQty <= 0) {
//						throw new RuntimeException(
//								"Addon quantity must be greater than 0 for addon ID: " + addonItemId);
//					}
//
//					// ✅ FETCH ADDON ITEM
//					AddonsItemsEntity addonItem = addonsItemsRepository.findById(addonItemId)
//							.orElseThrow(() -> new RuntimeException("Addon Item not found with ID: " + addonItemId));
//
//					// ✅ CALCULATE ADDON PRICE
//					BigDecimal addonPrice = addonItem.getPrice().multiply(BigDecimal.valueOf(addonQty));
//
//					// ✅ CREATE ORDER ADDON ENTITY
//					OrderAddonsItemsEntity orderAddon = new OrderAddonsItemsEntity();
//					orderAddon.setOrderItemId(savedOrderItem);
//					orderAddon.setName(addonItem.getName());
//					orderAddon.setQuantity(addonQty.toString());
//					orderAddon.setPrice(addonPrice);
//
//					// ✅ SAVE ORDER ADDON
//					orderAddonsItemsRepository.save(orderAddon);
//					addonTotalForItem = addonTotalForItem.add(addonPrice);
//
//					System.out.println("    Addon " + addonCounter + ": " + addonItem.getName() + " | Qty: " + addonQty
//							+ " | Price: " + addonPrice);
//					addonCounter++;
//				}
//			}
//
//			// ✅ UPDATE ORDER ITEM WITH ADDON TOTAL
//			savedOrderItem.setAddonsTotal(addonTotalForItem);
//			savedOrderItem.setItemTotal(itemTotal.add(addonTotalForItem));
//			orderItemsRepository.save(savedOrderItem);
//
//			orderAddonsTotal = orderAddonsTotal.add(addonTotalForItem);
//			itemCounter++;
//		}
//
//		System.out.println("\n---------------- ORDER TOTALS CALCULATION ----------------");
//		System.out.println("Items Total      : " + orderItemsTotal);
//		System.out.println("Addons Total     : " + orderAddonsTotal);
//
//		// ================== TAX & SERVICE CHARGE CALCULATION ==================
//		// Note: As per requirement, tax calculation only for DINING orders
//		BigDecimal gstAmount = BigDecimal.ZERO;
//		BigDecimal serviceChargeAmount = BigDecimal.ZERO;
//
//		if ("DINING".equals(orderType) && sectionRecord != null) {
//			System.out.println("\n---------------- DINING ORDER TAX CALCULATION ----------------");
//
//			BigDecimal gstPercentage = sectionRecord.getTaxPercentage() != null ? sectionRecord.getTaxPercentage()
//					: BigDecimal.ZERO;
//
//			BigDecimal serviceChargePercentage = sectionRecord.getServiceChargePercentage() != null
//					? sectionRecord.getServiceChargePercentage()
//					: BigDecimal.ZERO;
//
////<<<<<<< Updated upstream
//			BigDecimal finalSubtotal = orderItemsTotal.add(orderAddonsTotal);
//
//			gstAmount = finalSubtotal.multiply(gstPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
//			serviceChargeAmount = finalSubtotal.multiply(serviceChargePercentage).divide(BigDecimal.valueOf(100), 2,
//					RoundingMode.HALF_UP);
//
//			System.out.println("GST Percentage          : " + gstPercentage + "%");
//			System.out.println("Service Charge Percentage: " + serviceChargePercentage + "%");
//			System.out.println("GST Amount              : " + gstAmount);
//			System.out.println("Service Charge Amount   : " + serviceChargeAmount);
//		} else {
//			System.out.println("\n---------------- TAX CALCULATION SKIPPED ----------------");
//			System.out.println("Tax calculation only applies to DINING orders with valid section");
//		}
//
//		// ================== FINAL AMOUNT CALCULATION ==================
//		BigDecimal finalSubtotal = orderItemsTotal.add(orderAddonsTotal);
//		BigDecimal netAmount = finalSubtotal.add(gstAmount).add(serviceChargeAmount).add(deliveryCharge);
//
//		System.out.println("\n---------------- FINAL AMOUNT CALCULATION ----------------");
//		System.out.println("Subtotal              : " + finalSubtotal);
//		System.out.println("+ GST Amount          : " + gstAmount);
//		System.out.println("+ Service Charge      : " + serviceChargeAmount);
//		System.out.println("+ Delivery Charge     : " + deliveryCharge);
//		System.out.println("= Total Amount        : " + netAmount);
//
//		// ✅ UPDATE ORDER WITH FINAL AMOUNTS
//		savedOrder.setSubtotal(finalSubtotal);
//		savedOrder.setTotalAmount(netAmount);
//		savedOrder.setOrderNumber(orderGenerated_id);
//		savedOrder.setDeliveryFee(deliveryCharge);
//		savedOrder.setTaxAmount(gstAmount);
//
//		// ✅ SET ESTIMATED TIME BASED ON ORDER TYPE
//		if ("DELIVERY".equals(orderType)) {
//			savedOrder.setEstimatedTime(30); // 30 minutes for delivery
//		} else {
//			savedOrder.setEstimatedTime(20); // 20 minutes for takeaway/dining
//		}
//
//		// ✅ SAVE FINAL ORDER
//		ordersrepository.save(savedOrder);
//		// ================== FINAL SUMMARY ==================
//		System.out.println("\n==================== ORDER SUMMARY ====================");
//		System.out.println("Order ID              : " + savedOrder.getId());
//		System.out.println("Order Number          : " + orderGenerated_id);
//		System.out.println("Order Type            : " + orderType);
//		System.out.println("Customer Name         : "
//				+ (savedOrder.getCustomerName() != null ? savedOrder.getCustomerName() : "N/A"));
//		System.out.println("Customer Phone        : "
//				+ (savedOrder.getCustomerPhone() != null ? savedOrder.getCustomerPhone() : "N/A"));
//		System.out.println("Subtotal              : " + finalSubtotal);
//		System.out.println("GST Amount            : " + gstAmount);
//		System.out.println("Service Charge        : " + serviceChargeAmount);
//		System.out.println("Delivery Charge       : " + deliveryCharge);
//		System.out.println("Total Amount          : " + netAmount);
//		System.out.println("Estimated Time        : " + savedOrder.getEstimatedTime() + " minutes");
//
//		if ("DINING".equals(orderType) && tableBooking != null) {
//			System.out.println("Table Booking ID      : " + tableBooking.getId());
//			System.out.println("Table Number          : " + tableBooking.getTableId().getTableNumber());
//		}
//
//		if ("DELIVERY".equals(orderType) && addressExist != null) {
//			System.out.println("Delivery Address      : " + addressExist.getAddressLine1());
//			System.out.println("Delivery Distance     : " + distance + " KM");
//		}
//
//		System.out.println("✅ ORDER CREATED SUCCESSFULLY");
//		System.out.println("\n==================== ORDER CREATION END ====================");
//
//		// ================== KITCHEN NOTIFICATION ==================
//		System.out.println("\n🔔 Triggering Kitchen Notification...");
//
//		Map<String, Object> data = new LinkedHashMap<>();
//		data.put("type", "NEW_ORDER");
//		data.put("orderId", orderGenerated_id);
//		data.put("orderType", savedOrder.getOrderType());
//		data.put("amount", savedOrder.getTotalAmount());
//		data.put("paymentMethod", savedOrder.getPaymentMethod());
//		data.put("branchId", branch.getId());
//
//		System.out.println("📦 Notification Data Payload : " + data);
//
//		constant.sendNotificationByBranchAndRole(branch.getId(), "KITCHEN", "🍽️ New Order Received!",
//				"Order #" + orderGenerated_id + " has arrived. Please start preparing.", data);
//
//		System.out.println("✅ Kitchen notification sent for Order: " + orderGenerated_id);
//
//		// ================= ADD ORDER TO KITCHEN CACHE =================
//		Map<String, Object> cachePayload = new LinkedHashMap<>();
//		cachePayload.put("orderId", savedOrder.getId());
//		cachePayload.put("branchId", savedOrder.getBranchId().getId());
//		cachePayload.put("orderType", savedOrder.getOrderType());
//		cachePayload.put("amount", savedOrder.getTotalAmount());
//		cachePayload.put("status", savedOrder.getStatus());
//		cachePayload.put("createdAt", savedOrder.getCreatedAt());
//		System.out.println("enter cache");
//		cacheData.addKitchenPendingOrder(cachePayload);
//		System.out.println("enter cache 2");
//
//		return "Order Created Successfully - Order ID: " + orderGenerated_id;
//	}

	public DeliveryZonesEntity findMatchingDeliveryZone(Double distance, Long branchId) {

		System.out.println("\n=== DELIVERY ZONE MATCHING START ===");
		System.out.println("Branch ID  : " + branchId);
		System.out.println("Distance   : " + distance + " KM");

		List<DeliveryZonesEntity> zones = deliveryZonesRepository.findByBranchId_id(branchId);

		if (zones == null || zones.isEmpty()) {
			System.out.println("❌ No delivery zones configured");
			throw new RuntimeException("No delivery zones configured for this branch");
		}

		System.out.println("Available Zones: " + zones.size());

		for (DeliveryZonesEntity zone : zones) {

			Double from = zone.getRadiusKmFrom();
			Double to = zone.getRadiusKmTo();

			System.out.println("Checking Zone → " + zone.getZoneName() + " | From: " + from + " | To: " + to);

			if (from == null || to == null) {
				System.out.println("⚠ Skipped (From/To null)");
				continue;
			}

			if (distance >= from && distance <= to) {
				System.out.println("✅ MATCH FOUND");
				System.out.println("Zone ID: " + zone.getId());
				System.out.println("Delivery Charge: " + zone.getDeliveryCharge());
				return zone;
			}

			System.out.println("❌ Not in range");
		}

		System.out.println("❌ NO MATCHING DELIVERY ZONE FOUND");
		throw new RuntimeException("Out of delivery zone. No zone matches distance: " + distance + " KM");
	}

//	@Transactional(rollbackFor = Exception.class)
//	public String addOrderss(Map<String, Object> payload, String token) throws Exception {
//
//		System.out.println("\n==================== ORDER CREATION START ====================");
//
//		// 🔐 AUTH
//		Authorization.authorizeCashier(token);
//		System.out.println("AUTH ✔ Cashier Authorized");
//
//		// 🔓 TOKEN DATA
//		tokenUtil.decryptAndStoreToken(token);
//		Long cashierId = tokenUtil.getCurrentUserId().longValue();
//		Long branchId = tokenUtil.getBranchId().longValue();
//
//		System.out.println("Cashier ID       : " + cashierId);
//		System.out.println("Branch ID (TOKEN): " + branchId);
//
//		UsersEntity cashier = usersrepository.findById(cashierId)
//				.orElseThrow(() -> new RuntimeException("Cashier not found"));
//
//		UsersEntity branch = cashier.getParentId();
//		if (branch == null)
//			throw new RuntimeException("Branch not mapped with cashier");
//
//		UsersEntity restaurant = branch.getParentId();
//		if (restaurant == null)
//			throw new RuntimeException("Restaurant not mapped with branch");
//
//		System.out.println("Branch ID        : " + branch.getId());
//		System.out.println("Restaurant ID    : " + restaurant.getId());
//
//		// ============================================================
//		// 🔥 RESTAURANT TIMING VALIDATION (ADDED)
//		// ============================================================
//		System.out.println("\n---------------- RESTAURANT TIMING CHECK ----------------");
//
////		boolean isOrderAllowed = constant.isOrderAllowedNow(restaurant.getId(), branch.getId());
////
////		if (!isOrderAllowed) {
////			throw new RuntimeException("Order cannot be placed at this time. Restaurant is currently closed.");
////		}
//
//		System.out.println("✔ Restaurant is open. Order placement allowed");
//
//		// ============================================================
//		// 🔥 CUSTOMER ADDRESS LOGIC (ADDED)
//		// ============================================================
//		System.out.println("\n---------------- CUSTOMER ADDRESS ----------------");
//
//		String orderType = payload.get("orderType") != null && !payload.get("orderType").toString().trim().isEmpty()
//				? payload.get("orderType").toString().trim()
//				: "ONLINE";
//		// ================== CUSTOMER ==================
//		Map<String, Object> customerMap = (Map<String, Object>) payload.get("cutomerId");
//
//		Map<String, Object> sectionMap = (Map<String, Object>) payload.get("sectionId");
//		CustomersEntity customer = null;
//		if (customerMap != null && customerMap.get("id") != null) {
//			Long customerId = Long.parseLong(customerMap.get("id").toString());
//
//			customer = customersrepository.findById(customerId)
//					.orElseThrow(() -> new RuntimeException("Customer not found"));
//
////			order.setCustomerId(customer);
//		}
//
//		CustomerDeliveryAddressesEntity addressExist = null;
//
//		if ("DELIVERY".equalsIgnoreCase(orderType)) {
////
////		    // ================= CUSTOMER ID =================
////		    Map<String, Object> customerMap = (Map<String, Object>) payload.get("customerId");
////
////		    if (customerMap == null || customerMap.get("id") == null) {
////		        throw new RuntimeException("customerId is mandatory in request payload");
////		    }
////
////		    Long customerId = Long.parseLong(customerMap.get("id").toString());
////
////		    CustomersEntity customer = customersrepository.findById(customerId)
////		            .orElseThrow(() -> new RuntimeException("Customer not found"));
//
//			// ================= ADDRESS ID =================
//			Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
//
//			if (custAddressMap == null || custAddressMap.get("id") == null) {
//				throw new RuntimeException("custAddressId is mandatory in request payload");
//			}
//
//			Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());
//
//			addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
//					.orElseThrow(() -> new RuntimeException("Customer delivery address not found"));
//
//			// ================= UPDATE PAYLOAD =================
//			CustomerDeliveryAddressesEntity addressUpdatePayload = new CustomerDeliveryAddressesEntity();
//			addressUpdatePayload.setId(custAddressId);
//			addressUpdatePayload.setCustomerId(customer); // ✅ NOW CORRECT
//			addressUpdatePayload.setIsDefault(true);
//			addressUpdatePayload.setIsActive(true);
//
//			// ================= UPDATE CALL =================
////		    cashCustomerDeliveryAddressesService
////		            .updateCustomerDeliveryAddresses(addressUpdatePayload, token);
//		}
//
//		if ("DELIVERY".equalsIgnoreCase(orderType)) {
//			Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
//
//			if (custAddressMap == null || custAddressMap.get("id") == null) {
//				throw new RuntimeException("custAddressId is mandatory in request payload");
//			}
//
//			Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());
//
//			addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
//					.orElseThrow(() -> new RuntimeException("Customer delivery address not found"));
//
//			CustomerDeliveryAddressesEntity addressUpdatePayload = new CustomerDeliveryAddressesEntity();
//			addressUpdatePayload.setId(custAddressId);
//			addressUpdatePayload.setCustomerId(customer);
//			addressUpdatePayload.setIsDefault(true);
//			addressUpdatePayload.setIsActive(true);
//
//			cashCustomerDeliveryAddressesService.updateCustomerDeliveryAddresses(addressUpdatePayload, token);
//
//		}
//		System.out.println("✔ Customer address updated & validated");
//
//		// ================== DISTANCE ==================
//		Double distance = null;
//		if (payload.get("distance") != null) {
//			distance = Double.parseDouble(payload.get("distance").toString());
//		}
//
//		if (distance == null && "DELIVERY".equalsIgnoreCase(orderType)) {
//			throw new RuntimeException("Distance is required for delivery order");
//		}
//
//		System.out.println("Delivery Distance: " + distance + " KM");
//
//		// ================== FIND DELIVERY ZONE ==================
//		DeliveryZonesEntity matchedZone = findMatchingDeliveryZone(distance, branchId);
//
//		BigDecimal deliveryCharge = matchedZone.getDeliveryCharge() != null ? matchedZone.getDeliveryCharge()
//				: BigDecimal.ZERO;
//
//		System.out.println("Matched Zone     : " + matchedZone.getZoneName());
//		System.out.println("Delivery Charge  : " + deliveryCharge);
//
//		// ================== SAVE ORDER ==================
//		OrdersEntity order = new OrdersEntity();
//		if (customerMap != null && customerMap.get("id") != null) {
//
//		}
//		order.setRestaurantId(restaurant);
//		order.setBranchId(branch);
//		order.setCashierId(cashier);
//		if (addressExist != null) {
//			order.setCustomerDeliveryAddressesId(addressExist);
//		}
//
//		SectionEntity sectionRecord = null;
//		if (sectionMap != null && sectionMap.get("id") != null) {
//			Long sectionId = Long.parseLong(sectionMap.get("id").toString());
//
//			sectionRecord = sectionRepository.findById(sectionId)
//					.orElseThrow(() -> new RuntimeException("Section not found"));
//
//			order.setSectionId(sectionRecord);
//		}
//
//		order.setCustomerName((String) payload.get("customerName"));
//		order.setCustomerEmail((String) payload.get("cutomerEmail"));
//		order.setCustomerPhone((String) payload.get("customerPhone"));
//
//		order.setOrderType(orderType.toUpperCase());
//		System.out.println("Order Type final → " + orderType);
//
//		order.setStatus("CREATED");
//		order.setPaymentStatus("PENDING");
//		order.setSubtotal(BigDecimal.ZERO);
//		order.setTotalAmount(BigDecimal.ZERO);
//
//		OrdersEntity savedOrder = ordersrepository.save(order);
//		String orderGenerated_id = Constant.generateOrderId(savedOrder.getId());
//
//		System.out.println("\nORDER CREATED → Order ID : " + savedOrder.getId());
//
//		// ================== TOTALS ==================
//		BigDecimal orderItemsTotal = BigDecimal.ZERO;
//		BigDecimal orderAddonsTotal = BigDecimal.ZERO;
//
//		List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
//
//		if (items != null) {
//			for (Map<String, Object> itemMap : items) {
//
//				OrderItemsEntity orderItem = new OrderItemsEntity();
//				orderItem.setOrderId(savedOrder);
//
//				Long menuItemId = Long.parseLong(itemMap.get("menu_item_id").toString());
//
//				MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
//						.orElseThrow(() -> new RuntimeException("Menu item not found"));
//
//				BigDecimal price = menuItem.getPrice();
//				Integer quantity = Integer.parseInt(itemMap.get("quantity").toString());
//
//				BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(quantity));
//
//				orderItem.setMenuItemId(menuItem);
//				orderItem.setMenuItemName(menuItem.getName());
//				orderItem.setPrice(itemTotal);
//				orderItem.setQuantity(quantity);
//				orderItem.setAddonsTotal(BigDecimal.ZERO);
//				orderItem.setSpecialInstructions((String) itemMap.get("special_instructions"));
//
//				OrderItemsEntity savedOrderItem = orderItemsRepository.save(orderItem);
//
//				orderItemsTotal = orderItemsTotal.add(itemTotal);
//
//				BigDecimal addonTotalForItem = BigDecimal.ZERO;
//
//				List<Map<String, Object>> addonItems = (List<Map<String, Object>>) itemMap.get("addonItems");
//
//				if (addonItems != null) {
//					for (Map<String, Object> addonMap : addonItems) {
//
//						Long addonItemId = Long.parseLong(addonMap.get("addonItemId").toString());
//
//						Integer addonQty = Integer.parseInt(addonMap.get("quantity").toString());
//
//						AddonsItemsEntity addonItem = addonsItemsRepository.findById(addonItemId)
//								.orElseThrow(() -> new RuntimeException("Addon Item not found"));
//
//						BigDecimal addonPrice = addonItem.getPrice().multiply(BigDecimal.valueOf(addonQty));
//
//						OrderAddonsItemsEntity orderAddon = new OrderAddonsItemsEntity();
//
//						orderAddon.setOrderItemId(savedOrderItem);
//						orderAddon.setName(addonItem.getName());
//						orderAddon.setQuantity(addonQty.toString());
//						orderAddon.setPrice(addonPrice);
//
//						orderAddonsItemsRepository.save(orderAddon);
//						addonTotalForItem = addonTotalForItem.add(addonPrice);
//					}
//				}
//
//				savedOrderItem.setAddonsTotal(addonTotalForItem);
//				savedOrderItem.setItemTotal(itemTotal.add(addonTotalForItem));
//
//				orderItemsRepository.save(savedOrderItem);
//				orderAddonsTotal = orderAddonsTotal.add(addonTotalForItem);
//			}
//		}
//
//		// ================== TAX ==================
//		if (sectionRecord == null) {
//			sectionRecord = sectionRepository.findByName(orderType);
//		}
//
//		BigDecimal gstPercentage = sectionRecord.getTaxPercentage() != null ? sectionRecord.getTaxPercentage()
//				: BigDecimal.ZERO;
//
//		BigDecimal serviceChargePercentage = sectionRecord.getServiceChargePercentage() != null
//				? sectionRecord.getServiceChargePercentage()
//				: BigDecimal.ZERO;
//
//		BigDecimal finalTotal = orderItemsTotal.add(orderAddonsTotal);
//
//		BigDecimal gstAmount = finalTotal.multiply(gstPercentage).divide(BigDecimal.valueOf(100));
//
//		BigDecimal serviceChargeAmount = finalTotal.multiply(serviceChargePercentage).divide(BigDecimal.valueOf(100));
//
//		BigDecimal netAmount = finalTotal.add(gstAmount).add(serviceChargeAmount).add(deliveryCharge);
//
//		savedOrder.setSubtotal(finalTotal);
//		savedOrder.setTotalAmount(netAmount);
//		savedOrder.setOrderNumber(orderGenerated_id);
//		savedOrder.setDeliveryFee(deliveryCharge);
//		ordersrepository.save(savedOrder);
//
//		System.out.println("✅ ORDER CREATED SUCCESSFULLY (Order ID: " + savedOrder.getId() + ")");
//		return "Order Created Successfully";
//	}
//
//	public DeliveryZonesEntity findMatchingDeliveryZone(Double distance, Long branchId) {
//
//		System.out.println("\n=== DELIVERY ZONE MATCHING START ===");
//		System.out.println("Branch ID  : " + branchId);
//		System.out.println("Distance   : " + distance + " KM");
//
//		List<DeliveryZonesEntity> zones = deliveryZonesRepository.findByBranchId_id(branchId);
//
//		if (zones == null || zones.isEmpty()) {
//			throw new RuntimeException("No delivery zones configured for this branch");
//		}
//
//		for (DeliveryZonesEntity zone : zones) {
//
//			Double from = zone.getRadiusKmFrom();
//			Double to = zone.getRadiusKmTo();
//
//			System.out.println("Checking Zone → " + zone.getZoneName() + " | From: " + from + " | To: " + to);
//
//			if (from == null || to == null) {
//				continue;
//			}
//
//			if (distance >= from && distance <= to) {
//				System.out.println("✅ MATCH FOUND → Zone ID: " + zone.getId());
//				return zone;
//			}
//		}
//
//		System.out.println("❌ NO MATCHING DELIVERY ZONE FOUND");
//		throw new RuntimeException("Out of delivery zone");
//	}

	@Override
	public List<OrdersEntity> getAllRecordOrders(String token) throws Exception {
		Authorization.authorizeCashier(token);
		return ordersrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception {
		return getOrdersByCashierId(token, null, null, null, null, null, null, pageNumber, pageSize);
	}

	@Override
	public OrdersEntity getOneOrders(Long id, String token) throws Exception {
		Authorization.authorizeCashier(token);
		return ordersrepository.findById(id).orElseThrow(() -> new RuntimeException("Orders not found"));
	}

	@Override
	public String addOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeCashier(token);
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
					fetchReferenceById(ordersEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
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

	@Override
	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeCashier(token);

		if (ordersEntity.getId() == null) {
			throw new RuntimeException("Order ID is required");
		}

		if (isScalarOnlyUpdate(ordersEntity)) {
			String orderType = ordersrepository.findOrderTypeValueById(ordersEntity.getId())
					.orElseThrow(() -> new RuntimeException("Orders not found"));
			Long tableBookingId = ordersrepository.findTableBookingIdValueById(ordersEntity.getId()).orElse(null);
			String previousPaymentStatus = ordersrepository.findPaymentStatusValueById(ordersEntity.getId()).orElse(null);

			int updated = ordersrepository.updateOrderPaymentSnapshot(
					ordersEntity.getId(),
					ordersEntity.getPaymentStatus(),
					ordersEntity.getStatus(),
					ordersEntity.getPaymentMethod(),
					ordersEntity.getPaymentRemarks(),
					ordersEntity.getBankRefNum(),
					ordersEntity.getApiRefNum());
			if (updated == 0) {
				throw new RuntimeException("Orders not found");
			}

			if (isPaidStatus(ordersEntity.getPaymentStatus())
					&& !isPaidStatus(previousPaymentStatus)
					&& "DINING".equalsIgnoreCase(orderType)
					&& tableBookingId != null) {
				TableBookingEntity tableBooking = tableBookingRepository.findById(tableBookingId).orElse(null);
				if (tableBooking != null && tableBooking.getTableId() != null) {
					diningTableReleaseScheduler.scheduleRelease(tableBooking.getTableId().getId());
				}
			}

			return "Record Updated Successfully";
		}

		OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
				.orElseThrow(() -> new RuntimeException("Orders not found"));

		String previousPaymentStatus = existingEntity.getPaymentStatus();

		// Update non-foreign fields using reflection
		for (Field field : OrdersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(ordersEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Schedule 5-minute table auto-release on DINING payment success
		String newPaymentStatus = existingEntity.getPaymentStatus();
		boolean isNowPaid = isPaidStatus(newPaymentStatus);
		boolean wasPreviouslyPaid = isPaidStatus(previousPaymentStatus);
		if (isNowPaid && !wasPreviouslyPaid && "DINING".equalsIgnoreCase(existingEntity.getOrderType())) {
			TableBookingEntity tableBooking = existingEntity.getTableBookingId();
			if (tableBooking != null && tableBooking.getTableId() != null) {
				diningTableReleaseScheduler.scheduleRelease(tableBooking.getTableId().getId());
			}
		}

		// Handle customer_id foreign key
		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
			existingEntity.setCustomerId(
					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
		}

		// Handle customer_delivery_addresses_id foreign key
		if (ordersEntity.getCustomerDeliveryAddressesId() != null
				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
			existingEntity
					.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
							customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
		}

		// Handle branch_id foreign key
		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(
					fetchReferenceById(ordersEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		// Handle captain_id foreign key
		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
			existingEntity
					.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
		}

		// Handle delivery_id foreign key
		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
			existingEntity.setDeliveryId(
					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found"));
		}

		// Handle restaurant_id foreign key
		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
			existingEntity.setRestaurantId(
					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found"));
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
					item.setPrice(new java.math.BigDecimal(rawItem.get("price").toString()));
				if (rawItem.get("special_instructions") != null)
					item.setSpecialInstructions(rawItem.get("special_instructions").toString());
				if (item.getPrice() != null && item.getQuantity() != null)
					item.setItemTotal(item.getPrice().multiply(new java.math.BigDecimal(item.getQuantity())));
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
		return "Updated Successfully";
	}

	@Override
	public String deleteOrders(Long id, String token) throws Exception {
		Authorization.authorizeCashier(token);
		if (!ordersrepository.existsById(id)) {
			throw new RuntimeException("Orders not found");
		}
		ordersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrders(List<OrdersEntity> ordersEntitys, String token) throws Exception {
		Authorization.authorizeCashier(token);
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
						fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found"));
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
		Authorization.authorizeCashier(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
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
		Authorization.authorizeCashier(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return ordersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCashier(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
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
		Authorization.authorizeCashier(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return ordersrepository.findByUpdatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCashier(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
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
		Authorization.authorizeCashier(token);
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

		java.math.BigDecimal calculatedSubtotal = java.math.BigDecimal.ZERO;
		for (OrderItemsEntity item : items) {
			java.math.BigDecimal itemTotal = item.getPrice()
				.multiply(java.math.BigDecimal.valueOf(item.getQuantity()));
			calculatedSubtotal = calculatedSubtotal.add(itemTotal);

			if (item.getAddonsTotal() != null) {
				calculatedSubtotal = calculatedSubtotal.add(item.getAddonsTotal());
			}
		}

		order.setSubtotal(calculatedSubtotal);

		java.math.BigDecimal taxAmount = order.getTaxAmount() != null ? order.getTaxAmount() : java.math.BigDecimal.ZERO;
		java.math.BigDecimal serCharge = order.getSerChargeAmount() != null ? order.getSerChargeAmount() : java.math.BigDecimal.ZERO;
		java.math.BigDecimal deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : java.math.BigDecimal.ZERO;
		java.math.BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : java.math.BigDecimal.ZERO;

		java.math.BigDecimal totalAmount = calculatedSubtotal
			.add(taxAmount)
			.add(serCharge)
			.add(deliveryFee)
			.subtract(discount);

		order.setTotalAmount(totalAmount);
	}
}
