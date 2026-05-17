package com.rms.modules.delivery.services;

import com.rms.common.Constant;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.OrderItemsRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.common.util.JavaProcedures;
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
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import java.math.BigDecimal;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.HashMap;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import com.rms.common.util.StatusFilterUtil;

@Service
@Qualifier("delOrdersService")
public class DelOrdersService implements OrdersServiceIMP {

	private final OrdersRepository ordersrepository;
	private final CustomersRepository customersrepository;
	private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private Constant constant;

	@Autowired
	private JavaProcedures javaProcedures;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	public DelOrdersService(OrdersRepository ordersrepository, CustomersRepository customersrepository,
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

	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate) throws Exception {

		// 🔐 AUTH
		Authorization.authorizeDelivery(token);
		tokenUtil.decryptAndStoreToken(token);
		Integer branchId = tokenUtil.getCurrentUserId();

		UsersEntity branch = usersrepository.findById(branchId.longValue())
				.orElseThrow(() -> new RuntimeException("Delivery not found"));

		// 📅 Date range
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);

		List<OrdersEntity> ordersList = ordersrepository.findByDeliveryIdAndCreatedAtBetween(branch, fromDateTime,
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
			header.createCell(7).setCellValue("Created At");
			header.createCell(8).setCellValue("Delivered At");

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

				// 8️⃣ Created At
				row.createCell(7)
						.setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(dateTimeFormat) : "");
				// 8️⃣ Created At
				row.createCell(8)
						.setCellValue(order.getCompletedAt() != null ? order.getCompletedAt().format(dateTimeFormat) : "");
			}

			// 🔧 Auto-size
			for (int i = 0; i <= 7; i++) {
				sheet.autoSizeColumn(i);
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public String completeOrderAndProcessPayment(Map<String, Object> payload, String token) throws Exception {

		System.out.println("====== completeOrderAndProcessPayment() START ======");

		// ================= AUTHORIZE DELIVERY USER =================
		Authorization.authorizeDelivery(token);

		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

		UsersEntity deliveryUser = usersrepository.findById(deliveryUserId)
				.orElseThrow(() -> new RuntimeException("Delivery user not found"));

		// ================= READ & VALIDATE PAYLOAD =================
		if (payload == null || payload.isEmpty()) {
			throw new RuntimeException("Payload is required");
		}

		Long orderId = payload.get("orderId") != null ? Long.valueOf(payload.get("orderId").toString()) : null;

		String status = payload.get("status") != null ? payload.get("status").toString() : null;

		String deliveryStatus = payload.get("deliveryStatus") != null ? payload.get("deliveryStatus").toString() : null;

		String paymentMethod = payload.get("paymentMethod") != null ? payload.get("paymentMethod").toString() : null;

		if (orderId == null) {
			throw new RuntimeException("orderId is required");
		}
		if (status == null || paymentMethod == null || deliveryStatus == null) {
			throw new RuntimeException("status and paymentMethod are required");
		}

		// ================= FETCH ORDER =================
		OrdersEntity existingEntity = ordersrepository.findById(orderId)
				.orElseThrow(() -> new RuntimeException("Order not found"));

		System.out.println("Order fetched: " + existingEntity.getId());

		// ================= PREVENT DUPLICATE COMPLETION =================
		if ("COMPLETED".equalsIgnoreCase(existingEntity.getStatus())
				|| "DELIVERED".equalsIgnoreCase(existingEntity.getStatus())) {
			throw new RuntimeException("Order already completed");
		}

		// ================= UPDATE ORDER =================
		existingEntity.setStatus(status.toUpperCase());
		existingEntity.setDeliveryStatus(deliveryStatus.toUpperCase());
		existingEntity.setPaymentMethod(paymentMethod.toLowerCase());
		existingEntity.setCompletedAt(LocalDateTime.now());
		existingEntity.setDeliveryId(deliveryUser);
		existingEntity.setPaymentStatus("COMPLETED");

		System.out.println("Order status updated → " + status);
		System.out.println("Payment method → " + paymentMethod);

		// ================= PAYMENT GATEWAY LOGIC =================
		String bankRefId = null;
		String apiRefId = null;

		if ("pg".equalsIgnoreCase(paymentMethod)) {
			throw new RuntimeException("payment gateway is underprocessing.");
//
//			// 🔔 FUTURE PAYMENT GATEWAY INTEGRATION
//			System.out.println("Calling payment gateway...");
//
//			bankRefId = "PG_BANK_" + orderId;
//			apiRefId = "PG_API_" + System.currentTimeMillis();
//
//			existingEntity.setBankRefNum(bankRefId);
//			existingEntity.setApiRefNum(apiRefId);
//
//			System.out.println("PG response received");
		} else if ("cash".equalsIgnoreCase(paymentMethod) || "upi".equalsIgnoreCase(paymentMethod)) {

			// CASH PAYMENT → OUTSTANDING CREDIT
			Map<String, Object> outstandingPayload = new HashMap<>();

			outstandingPayload.put("userId", deliveryUserId);
			outstandingPayload.put("orderId", existingEntity.getOrderNumber());
			outstandingPayload.put("amount", existingEntity.getTotalAmount());
			outstandingPayload.put("mode", "CREDIT");
			outstandingPayload.put("service", "ORDER_DELIVERY");
			outstandingPayload.put("remark", "Cash collected from customer");

			javaProcedures.outstandingTransactionProcedure(outstandingPayload);
		}

		// ================= WALLET TRANSACTION =================
		if (existingEntity.getDeliveryFee() != null && existingEntity.getDeliveryFee().compareTo(BigDecimal.ZERO) > 0) {

			Map<String, Object> walletPayload = new HashMap<>();

			walletPayload.put("userId", deliveryUserId);
			walletPayload.put("orderId", existingEntity.getId());
			walletPayload.put("amount", existingEntity.getDeliveryFee());
			walletPayload.put("mode", "credit");
			walletPayload.put("remarks", "Order delivered successfully");
			walletPayload.put("bankRefId", bankRefId != null ? bankRefId : "AUTO_" + orderId);
//			walletPayload.put("bankDetailId", 1);

			System.out.println("Wallet payload → " + walletPayload);

			javaProcedures.walletTransactionProcedure(walletPayload);

			System.out.println("Wallet transaction completed");
		}

		// ================= SAVE ORDER =================
		ordersrepository.save(existingEntity);
		System.out.println("Order saved successfully");
		System.out.println("====== completeOrderAndProcessPayment() END ======");

		return "Order completed and payment processed successfully";
	}

	public Map<String, Object> getOrdersWithFilters(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 DELIVERY AUTH
		Authorization.authorizeDelivery(token);

		// 🔓 TOKEN → DELIVERY USER
		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

		// ================= DELIVERY USER → BRANCH =================
		UsersEntity deliveryUser = usersRepository.findById(deliveryUserId)
				.orElseThrow(() -> new RuntimeException("Delivery user not found"));

		if (deliveryUser.getBranchId() == null || deliveryUser.getBranchId().getId() == null) {
			throw new RuntimeException("No branch mapped with delivery user");
		}
		Long branchId = deliveryUser.getBranchId().getId();

		// ================= DATE RANGE =================
		LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
		LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

		// ================= PAGEABLE (frontend sends 1-indexed) =================
		int pageIndex = Math.max(pageNumber - 1, 0);
		Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "id"));

		// ================= NATIVE QUERY (avoids 1664-column limit) =================
		Page<Object[]> page = ordersRepository.findDeliveryOrderSummaries(
				branchId, fromDateTime, toDateTime, status, searchValue, pageable);

		List<com.rms.common.dto.BranchOrderSummaryDTO> records = page.getContent().stream()
				.map(com.rms.common.dto.BranchOrderSummaryDTO::fromRow)
				.collect(java.util.stream.Collectors.toList());

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", records);

		return response;
	}

//    ******** branch id base  filter &&&&&&&&&&&&&&&&&&&

	public Map<String, Object> getOrdersWithFiltersBranchId(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 DELIVERY / BRANCH AUTH
		Authorization.authorizeDelivery(token);

		// ================= TOKEN → BRANCH ID =================
		tokenUtil.decryptAndStoreToken(token);
		Long branchId = tokenUtil.getBranchId().longValue();

		if (branchId == null) {
			throw new RuntimeException("BranchId not found in token");
		}

		// ================= DYNAMIC FILTER SPEC =================
		Specification<OrdersEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// 🔥 MANDATORY BRANCH FILTER (TOKEN BASED)
			predicates.add(cb.equal(root.get("branchId").get("id"), branchId));

			// ================= MANDATORY ORDER TYPE FILTER (ONLINE) =================
			predicates.add(cb.equal(cb.lower(root.get("orderType")), "delivery"));
			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates
						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			}

			// ================= STATUS FILTER =================
			Predicate statusPred = StatusFilterUtil.buildStatusPredicate(cb, root.get("deliveryStatus"), status);
			if (statusPred != null) {
				predicates.add(statusPred);
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.isBlank()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				searchPredicates.add(cb.like(cb.lower(root.get("orderNumber")), pattern));
//				searchPredicates.add(cb.like(cb.lower(root.get("orderType")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("tableNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerName")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerPhone")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerEmail")), pattern));

				// 🔢 amount search
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

		// ================= RESPONSE =================
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

//    public Map<String, Object> getOrdersWithFiltersBranchId(
//            LocalDate fromDate,
//            LocalDate toDate,
//            String status,
//            String searchValue,
//            Integer pageNumber,
//            Integer pageSize,
//            String token
//    ) throws Exception {
//
//        // 🔐 DELIVERY / BRANCH AUTH
//        Authorization.authorizeDelivery(token);
//
//        // 🔓 TOKEN → BRANCH ID
//        tokenUtil.decryptAndStoreToken(token);
//        Long branchId = tokenUtil.getCurrentUserId().longValue(); // 🔥 DIRECT BRANCH ID
//
//        if (branchId == null) {
//            throw new RuntimeException("BranchId not found in token");
//        }
//
//        Specification<OrdersEntity> spec = (root, query, cb) -> {
//
//            List<Predicate> predicates = new ArrayList<>();
//
//            // ================= BRANCH JOIN =================
//            Join<OrdersEntity, UsersEntity> branchJoin =
//                    root.join("branchId", JoinType.INNER);
//
//            // ================= MANDATORY BRANCH FILTER =================
//            predicates.add(
//                    cb.equal(
//                            branchJoin.get("id"),
//                            branchId
//                    )
//            );
//
//            // ================= DATE FILTER =================
//            if (fromDate != null && toDate != null) {
//                predicates.add(
//                        cb.between(
//                                root.get("createdAt"),
//                                fromDate.atStartOfDay(),
//                                toDate.atTime(LocalTime.MAX)
//                        )
//                );
//            }
//
//            // ================= STATUS FILTER =================
//            if (status != null && !status.isBlank()) {
//                predicates.add(
//                        cb.equal(
//                                cb.lower(root.get("status")),
//                                status.toLowerCase()
//                        )
//                );
//            }
//
//            // ================= SEARCH FILTER =================
//            if (searchValue != null && !searchValue.isBlank()) {
//
//                String pattern = "%" + searchValue.toLowerCase() + "%";
//                List<Predicate> searchPredicates = new ArrayList<>();
//
//                searchPredicates.add(cb.like(cb.lower(root.get("orderNumber")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("orderType")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("tableNumber")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("customerName")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("customerPhone")), pattern));
//                searchPredicates.add(cb.like(cb.lower(root.get("customerEmail")), pattern));
//
//                try {
//                    BigDecimal amount = new BigDecimal(searchValue);
//                    searchPredicates.add(cb.equal(root.get("totalAmount"), amount));
//                } catch (Exception ignored) {}
//
//                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
//            }
//
//            return cb.and(predicates.toArray(new Predicate[0]));
//        };
//
//        Pageable pageable = PageRequest.of(
//                Math.max(pageNumber, 0),
//                pageSize
//        );
//
//        Page<OrdersEntity> page =
//                ordersRepository.findAll(spec, pageable);
//
//        Map<String, Object> response = new LinkedHashMap<>();
//        response.put("totalRecords", page.getTotalElements());
//        response.put("pageSize", page.getSize());
//        response.put("currentPage", page.getNumber() + 1);
//        response.put("totalPages", page.getTotalPages());
//        response.put("records", page.getContent());
//
//        return response;
//    }
//***********************************8

	@Override
	public List<OrdersEntity> getAllRecordOrders(String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return ordersrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
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
		Authorization.authorizeDelivery(token);
		return ordersrepository.findById(id).orElseThrow(() -> new RuntimeException("Orders not found"));
	}

	@Override
	public String addOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeDelivery(token);
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

//    @Override
//    public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {
//        Authorization.authorizeDelivery(token);
//        OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
//                .orElseThrow(() -> new RuntimeException("Orders not found"));
//
//        // Update non-foreign fields using reflection
//        for (Field field : OrdersEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//            Object value = field.get(ordersEntity);
//            if (value != null && !field.getName().endsWith("Id")) {
//                field.set(existingEntity, value);
//            }
//        }
//
//        // Handle customer_id foreign key
//        if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
//            existingEntity.setCustomerId(
//                fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found")
//            );
//        }
//
//        // Handle customer_delivery_addresses_id foreign key
//        if (ordersEntity.getCustomerDeliveryAddressesId() != null && ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
//            existingEntity.setCustomerDeliveryAddressesId(
//                fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(), customerdeliveryaddressesrepository, "Customer_delivery_addresses not found")
//            );
//        }
//
//        // Handle branch_id foreign key
//        if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
//            existingEntity.setBranchId(
//                fetchReferenceById(ordersEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
//            );
//        }
//
//        // Handle captain_id foreign key
//        if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
//            existingEntity.setCaptainId(
//                fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found")
//            );
//        }
//
//        // Handle delivery_id foreign key
//        if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
//            existingEntity.setDeliveryId(
//                fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found")
//            );
//        }
//
//        // Handle restaurant_id foreign key
//        if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
//            existingEntity.setRestaurantId(
//                fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found")
//            );
//        }
//
//        ordersrepository.save(existingEntity);
//        return "Updated Successfully";
//    }

	@Override
	@Transactional
	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {
		System.out.println("=== updateOrders START ===");
		Authorization.authorizeDelivery(token);
		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

		Long orderId = ordersEntity.getId();
		String newStatus = ordersEntity.getStatus();

		if (orderId == null || newStatus == null || newStatus.isBlank()) {
			throw new RuntimeException("Order ID and status are required");
		}

		int updated = ordersrepository.updateOrderStatusByDelivery(orderId, newStatus.toUpperCase(), deliveryUserId);
		if (updated == 0) {
			throw new RuntimeException("Order not found or update failed");
		}

		return "Updated Successfully";
	}

	@Override
	public String deleteOrders(Long id, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		if (!ordersrepository.existsById(id)) {
			throw new RuntimeException("Orders not found");
		}
		ordersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrders(List<OrdersEntity> ordersEntitys, String token) throws Exception {
		Authorization.authorizeDelivery(token);
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
		Authorization.authorizeDelivery(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
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
		Authorization.authorizeDelivery(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return ordersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
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
		Authorization.authorizeDelivery(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return ordersrepository.findByUpdatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
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
		Authorization.authorizeDelivery(token);
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
