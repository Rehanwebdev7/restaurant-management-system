package com.rms.modules.restaurant.services;

import com.rms.common.dto.BranchOrderSummaryDTO;
import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.CustomerDeliveryAddressesRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
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

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Qualifier("restOrdersService")
public class RestOrdersService implements OrdersServiceIMP {

	private final OrdersRepository ordersrepository;
	private final CustomersRepository customersrepository;
	private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final UsersRepository usersrepository;
//    private final UsersRepository usersrepository;
//    private final UsersRepository usersrepository;

	@Autowired
	private RestaurantBranchRepository restaurantBranchRepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private DiningTablesRepository diningTablesRepository;

	public RestOrdersService(OrdersRepository ordersrepository, CustomersRepository customersrepository,
			CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository,
			RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
		this.ordersrepository = ordersrepository;
		this.customersrepository = customersrepository;
		this.customerdeliveryaddressesrepository = customerdeliveryaddressesrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
		this.usersrepository = usersrepository;
//        this.usersrepository = usersrepository;
//        this.usersrepository = usersrepository;
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

	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate) throws Exception {

		System.out.println("STARTED");
		// 🔐 AUTHORIZATION (ADMIN)
		try {
			System.out.println("AUTHENTICATED");
			Authorization.authorizeAdminOrRestaurant(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		System.out.println("DECRYPTION");
		// 🔓 TOKEN → RESTAURANT
		tokenUtil.decryptAndStoreToken(token);
		Integer currentRestaurantId = tokenUtil.getCurrentUserId();

		UsersEntity restaurant = usersrepository.findById(currentRestaurantId.longValue())
				.orElseThrow(() -> new RuntimeException("Restaurant not found"));

		// 📅 Date range
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);

		// 📦 Fetch orders (ONLY TOKEN RESTAURANT)
		List<OrdersEntity> ordersList = ordersrepository.findByRestaurantIdAndCreatedAtBetween(restaurant, fromDateTime,
				toDateTime);

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
			header.createCell(7).setCellValue("Restaurant");
			header.createCell(8).setCellValue("Branch");
			header.createCell(9).setCellValue("Captain");
			header.createCell(10).setCellValue("Delivery Partner");
			header.createCell(11).setCellValue("Created At");

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
					itemsBuilder.setLength(itemsBuilder.length() - 2); // remove last comma
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
				row.createCell(7)
						.setCellValue(order.getRestaurantId() != null ? order.getRestaurantId().getName() : "");

				// 9️⃣ Branch Name
				row.createCell(8).setCellValue(order.getBranchId() != null ? order.getBranchId().getName() : "");

				// 🔟 Captain
				row.createCell(9).setCellValue(order.getCaptainId() != null ? order.getCaptainId().getName() : "");

				// 1️⃣1️⃣ Delivery Partner
				row.createCell(10).setCellValue(order.getDeliveryId() != null ? order.getDeliveryId().getName() : "");

				// 1️⃣2️⃣ Created At
				row.createCell(11)
						.setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(dateTimeFormat) : "");
			}

			// 🔧 Auto-size columns
			for (int i = 0; i <= 11; i++) {
				sheet.autoSizeColumn(i);
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

//	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate
//
//	) throws Exception {
//
//		// 🔐 Authorization
//		try {
//			Authorization.authorizeAdmin(token);
//		} catch (Exception e) {
//			throw new IllegalArgumentException(e.getMessage());
//		}
//
//		// 🔓 TOKEN → RESTAURANT
//		tokenUtil.decryptAndStoreToken(token);
//		Integer currentRestaurantId = tokenUtil.getCurrentUserId();
//
//		UsersEntity restaurant = usersrepository.findById(currentRestaurantId.longValue())
//				.orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//		// 📅 Date range conversion
//		LocalDateTime fromDateTime = fromDate.atStartOfDay();
//		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);
//
//		// 📦 Fetch orders (ONLY TOKEN RESTAURANT)
//		List<OrdersEntity> ordersList = ordersrepository.findByRestaurantIdAndCreatedAtBetween(restaurant, fromDateTime,
//				toDateTime);
//
//		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
//
//		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
//
//			Sheet sheet = workbook.createSheet("Orders Report");
//
//			// 🧾 Header Row
//			Row header = sheet.createRow(0);
//
//			header.createCell(0).setCellValue("Order ID");
//			header.createCell(1).setCellValue("Order Number");
//			header.createCell(2).setCellValue("Order Type");
//			header.createCell(3).setCellValue("Order Status");
//			header.createCell(4).setCellValue("Payment Status");
//			header.createCell(5).setCellValue("Payment Method");
//			header.createCell(6).setCellValue("Restaurant");
//			header.createCell(7).setCellValue("Branch");
//			header.createCell(8).setCellValue("Captain");
//			header.createCell(9).setCellValue("Delivery Partner");
//			header.createCell(10).setCellValue("Customer Name");
//			header.createCell(11).setCellValue("Customer Phone");
//			header.createCell(12).setCellValue("Customer Email");
//			header.createCell(13).setCellValue("Table Number");
//			header.createCell(14).setCellValue("Subtotal");
//			header.createCell(15).setCellValue("Tax Amount");
//			header.createCell(16).setCellValue("Discount Amount");
//			header.createCell(17).setCellValue("Delivery Fee");
//			header.createCell(18).setCellValue("Total Amount");
//			header.createCell(19).setCellValue("Estimated Time (Min)");
//			header.createCell(20).setCellValue("Special Instructions");
//			header.createCell(21).setCellValue("Order Created At");
//			header.createCell(22).setCellValue("Order Completed At");
//
//			// 🧾 Data Rows
//			int rowNum = 1;
//
//			for (OrdersEntity order : ordersList) {
//
//				Row row = sheet.createRow(rowNum++);
//
//				row.createCell(0).setCellValue(order.getId() != null ? order.getId() : 0);
//				row.createCell(1).setCellValue(order.getOrderNumber() != null ? order.getOrderNumber() : "");
//				row.createCell(2).setCellValue(order.getOrderType() != null ? order.getOrderType() : "");
//				row.createCell(3).setCellValue(order.getStatus() != null ? order.getStatus() : "");
//				row.createCell(4).setCellValue(order.getPaymentStatus() != null ? order.getPaymentStatus() : "");
//				row.createCell(5).setCellValue(order.getPaymentMethod() != null ? order.getPaymentMethod() : "");
//
//				row.createCell(6)
//						.setCellValue(order.getRestaurantId() != null ? order.getRestaurantId().getName() : "");
//
//				row.createCell(7).setCellValue(order.getBranchId() != null ? order.getBranchId().getName() : "");
//
//				row.createCell(8).setCellValue(order.getCaptainId() != null ? order.getCaptainId().getName() : "");
//
//				row.createCell(9).setCellValue(order.getDeliveryId() != null ? order.getDeliveryId().getName() : "");
//
//				row.createCell(10).setCellValue(order.getCustomerName() != null ? order.getCustomerName() : "");
//				row.createCell(11).setCellValue(order.getCustomerPhone() != null ? order.getCustomerPhone() : "");
//				row.createCell(12).setCellValue(order.getCustomerEmail() != null ? order.getCustomerEmail() : "");
//				row.createCell(13).setCellValue(order.getTableNumber() != null ? order.getTableNumber() : "");
//
//				row.createCell(14).setCellValue(order.getSubtotal() != null ? order.getSubtotal().doubleValue() : 0.0);
//				row.createCell(15)
//						.setCellValue(order.getTaxAmount() != null ? order.getTaxAmount().doubleValue() : 0.0);
//				row.createCell(16).setCellValue(
//						order.getDiscountAmount() != null ? order.getDiscountAmount().doubleValue() : 0.0);
//				row.createCell(17)
//						.setCellValue(order.getDeliveryFee() != null ? order.getDeliveryFee().doubleValue() : 0.0);
//				row.createCell(18)
//						.setCellValue(order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);
//
//				row.createCell(19).setCellValue(order.getEstimatedTime() != null ? order.getEstimatedTime() : 0);
//				row.createCell(20)
//						.setCellValue(order.getSpecialInstructions() != null ? order.getSpecialInstructions() : "");
//				row.createCell(21)
//						.setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(dateTimeFormat) : "");
//				row.createCell(22).setCellValue(
//						order.getCompletedAt() != null ? order.getCompletedAt().format(dateTimeFormat) : "");
//			}
//
//			workbook.write(out);
//			return new ByteArrayInputStream(out.toByteArray());
//		}
//	}

	public Map<String, Object> getOrdersWithFilters(LocalDate fromDate, LocalDate toDate, Boolean isActive,
			String status, String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 Restaurant Authorization
		Authorization.authorizeAdminOrRestaurant(token);

		// 🔓 TOKEN → restaurantId
		tokenUtil.decryptAndStoreToken(token);
		Integer currentRestaurantId = tokenUtil.getCurrentUserId();

		// Native projection sidesteps Postgres' 1664-column per-target-list limit
		// (SQLState 54011). OrdersEntity has 12+ EAGER ManyToOne associations and
		// each UsersEntity self-joins its parent/branch — a JpaSpecification +
		// findAll(spec) blows the join graph before the row is even hydrated.
		LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
		LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;
		String normSearch = (searchValue != null && !searchValue.isBlank()) ? searchValue : null;
		String searchPattern = normSearch != null ? "%" + normSearch.toLowerCase() + "%" : null;
		String normStatus = (status != null && !status.isBlank()) ? status : null;

		Pageable pageable = PageRequest.of(Math.max(pageNumber != null ? pageNumber : 0, 0),
				pageSize != null ? pageSize : 10);

		// NB: the orders table has no is_active column, so the isActive parameter
		// is accepted on the signature for backward compat with the controller but
		// not forwarded to the SQL filter.
		Page<Object[]> page = ordersRepository.findOrdersByRestaurantSummaries(
				currentRestaurantId.longValue(),
				fromDateTime, toDateTime,
				normStatus,
				normSearch, searchPattern,
				pageable);

		List<BranchOrderSummaryDTO> records = page.getContent().stream()
				.map(BranchOrderSummaryDTO::fromRow)
				.filter(Objects::nonNull)
				.collect(Collectors.toCollection(ArrayList::new));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", records);

		return response;
	}

	public Map<String, Object> getOrdersWithFiltersAdmin(LocalDate fromDate, LocalDate toDate, Boolean isActive,
			String status, String searchValue, Integer pageNumber, Integer pageSize, String token,
			Long restaurantId, Long branchId) throws Exception {

		Authorization.authorizeAdmin(token);

		Specification<OrdersEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			if (restaurantId != null) {
				predicates.add(cb.equal(root.get("restaurantId").get("id"), restaurantId));
			}

			if (branchId != null) {
				predicates.add(cb.equal(root.get("branchId").get("id"), branchId));
			}

			if (fromDate != null && toDate != null) {
				predicates.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			}

			if (isActive != null) {
				predicates.add(cb.equal(root.get("isActive"), isActive));
			}

			if (status != null && !status.trim().isEmpty()) {
				predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
			}

			if (searchValue != null && !searchValue.trim().isEmpty()) {
				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();
				searchPredicates.add(cb.like(cb.lower(root.get("orderNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("orderType")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("tableNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerName")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerPhone")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerEmail")), pattern));
				try {
					BigDecimal amount = new BigDecimal(searchValue);
					searchPredicates.add(cb.equal(root.get("totalAmount"), amount));
				} catch (Exception ignored) {
				}
				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page<OrdersEntity> page = ordersRepository.findAll(spec, pageable);

		// Same DTO projection as getOrdersWithFilters above — see the comment there
		// for why raw OrdersEntity tree causes Postgres' 1664-column error.
		List<BranchOrderSummaryDTO> records = page.getContent().stream()
				.map(order -> {
					BranchOrderSummaryDTO dto = BranchOrderSummaryDTO.fromOrderEntity(order);
					if (dto != null) {
						dto.setOrderItemsCount(order.getOrderItems() != null ? (long) order.getOrderItems().size() : 0L);
					}
					return dto;
				})
				.filter(Objects::nonNull)
				.collect(Collectors.toCollection(ArrayList::new));

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
		Authorization.authorizeAdminOrRestaurant(token);
		return ordersrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = ordersrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public OrdersEntity getOneOrders(Long id, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
		return ordersrepository.findById(id).orElseThrow(() -> new RuntimeException("Orders not found"));
	}

	@Override
	public String addOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
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

	@Override
	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
		OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
				.orElseThrow(() -> new RuntimeException("Orders not found"));

		// Update non-foreign fields using reflection
		for (Field field : OrdersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(ordersEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
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
					fetchReferenceById(ordersEntity.getBranchId(), usersrepository, "Restaurant_branch not found"));
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

		ordersrepository.save(existingEntity);

		releaseTableIfOrderCompleted(existingEntity);

		return "Updated Successfully";
	}

	private void releaseTableIfOrderCompleted(OrdersEntity order) {
		if (order == null) return;

		boolean paid = "SUCCESS".equalsIgnoreCase(order.getPaymentStatus());
		boolean completed = "COMPLETED".equalsIgnoreCase(order.getStatus());
		if (!paid && !completed) return;

		String ot = order.getOrderType();
		if (!"DINE_IN".equalsIgnoreCase(ot) && !"DINING".equalsIgnoreCase(ot)) return;

		// Prefer the linked booking (consumer flow creates orders with tableBookingId).
		if (order.getTableBookingId() != null && order.getTableBookingId().getTableId() != null) {
			com.rms.common.entities.DiningTablesEntity bookedTable = order.getTableBookingId().getTableId();
			if (bookedTable.getId() != null) {
				diningTablesRepository.findById(bookedTable.getId()).ifPresent(table -> {
					if (table.getStatus() == null || table.getStatus() != 1) {
						table.setStatus(1);
						table.setUpdatedAt(LocalDateTime.now());
						diningTablesRepository.save(table);
					}
				});
				return;
			}
		}

		// Fallback: resolve by branch + table_number (cashier/admin flow).
		String tableNumber = order.getTableNumber();
		if (tableNumber == null || tableNumber.isBlank()) return;
		if (order.getBranchId() == null || order.getBranchId().getId() == null) return;

		diningTablesRepository
				.findFirstByBranchId_IdAndTableNumberAndIsDeletedFalse(order.getBranchId().getId(), tableNumber)
				.ifPresent(table -> {
					if (table.getStatus() == null || table.getStatus() != 1) {
						table.setStatus(1);
						table.setUpdatedAt(LocalDateTime.now());
						diningTablesRepository.save(table);
					}
				});
	}

	@Override
	public String deleteOrders(Long id, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
		if (!ordersrepository.existsById(id)) {
			throw new RuntimeException("Orders not found");
		}
		ordersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrders(List<OrdersEntity> ordersEntitys, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
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
		Authorization.authorizeAdminOrRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
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
		Authorization.authorizeAdminOrRestaurant(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return ordersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
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
		Authorization.authorizeAdminOrRestaurant(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return ordersrepository.findByUpdatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeAdminOrRestaurant(token);
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
		Authorization.authorizeAdminOrRestaurant(token);
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
}
