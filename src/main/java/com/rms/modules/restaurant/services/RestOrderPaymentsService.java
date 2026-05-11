package com.rms.modules.restaurant.services;

import com.rms.common.entities.OrderPaymentsEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.repositories.OrderPaymentsRepository;
import com.rms.common.serviceImplement.OrderPaymentsServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
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

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;


import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
@Service
@Qualifier("restOrderPaymentsService")
public class RestOrderPaymentsService implements OrderPaymentsServiceIMP {

	private final OrderPaymentsRepository orderpaymentsrepository;
	private final OrdersRepository ordersrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private RestaurantBranchRepository restaurantBranchRepository;

	@Autowired
	private TokenUtil tokenUtil;
	
	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private OrdersRepository ordersRepository;
	
	@Autowired
	private OrderPaymentsRepository orderPaymentsRepository;

	public RestOrderPaymentsService(OrderPaymentsRepository orderpaymentsrepository, OrdersRepository ordersrepository,
			RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
		this.orderpaymentsrepository = orderpaymentsrepository;
		this.ordersrepository = ordersrepository;
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

	public Map<String, Object> getOrderPaymentsWithFilters(LocalDate fromDate, LocalDate toDate, String paymentStatus,
			String paymentMethod, String searchValue, Integer pageNumber, Integer pageSize, String token)
			throws Exception {

		// 🔐 RESTAURANT AUTH
		Authorization.authorizeRestaurant(token);

		// 🔓 TOKEN → restaurantId
		tokenUtil.decryptAndStoreToken(token);
		Integer currentRestaurantId = tokenUtil.getCurrentUserId();

		Specification<OrderPaymentsEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= MANDATORY RESTAURANT FILTER =================
			predicates.add(cb.equal(root.get("restaurantId").get("id"), currentRestaurantId.longValue()));

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates
						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			}

			// ================= PAYMENT STATUS FILTER =================
			if (paymentStatus != null && !paymentStatus.trim().isEmpty()) {
				predicates.add(cb.equal(cb.lower(root.get("paymentStatus")), paymentStatus.toLowerCase()));
			}

			// ================= PAYMENT METHOD FILTER =================
			if (paymentMethod != null && !paymentMethod.trim().isEmpty()) {
				predicates.add(cb.equal(cb.lower(root.get("paymentMethod")), paymentMethod.toLowerCase()));
			}
			
			

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.trim().isEmpty()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				// 🔹 PAYMENT FIELDS
				searchPredicates.add(cb.like(cb.lower(root.get("paymentGateway")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("gatewayTransactionId")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));

				// 🔹 AMOUNT SEARCH
				try {
					BigDecimal amount = new BigDecimal(searchValue);
					searchPredicates.add(cb.equal(root.get("amount"), amount));
				} catch (Exception ignored) {
				}

				// 🔹 BRANCH SEARCH
				Join<OrderPaymentsEntity, RestaurantBranchEntity> branchJoin = root.join("branchId", JoinType.LEFT);

				searchPredicates.add(cb.like(cb.lower(branchJoin.get("branchName")), pattern));

				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Pageable pageable = PageRequest.of(pageNumber, pageSize,Sort.by(Sort.Direction.DESC, "id"));
		Page<OrderPaymentsEntity> page = orderPaymentsRepository.findAll(spec, pageable);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	@Override
	public List<OrderPaymentsEntity> getAllRecordOrderPayments(String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		return orderpaymentsrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllOrderPayments(Integer pageNumber, Integer pageSize, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = orderpaymentsrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public OrderPaymentsEntity getOneOrderPayments(Long id, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		return orderpaymentsrepository.findById(id).orElseThrow(() -> new RuntimeException("OrderPayments not found"));
	}

	@Override
	public String addOrderPayments(OrderPaymentsEntity order_paymentsEntity, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		OrderPaymentsEntity newEntity = new OrderPaymentsEntity();

		// Copy non-foreign fields using reflection
		for (Field field : OrderPaymentsEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(order_paymentsEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle online_order_id foreign key
		if (order_paymentsEntity.getOnlineOrderId() != null
				&& order_paymentsEntity.getOnlineOrderId().getId() != null) {
			newEntity.setOnlineOrderId(
					fetchReferenceById(order_paymentsEntity.getOnlineOrderId(), ordersrepository, "Orders not found"));
		}

		// Handle branch_id foreign key
		if (order_paymentsEntity.getBranchId() != null && order_paymentsEntity.getBranchId().getId() != null) {
			newEntity.setBranchId(fetchReferenceById(order_paymentsEntity.getBranchId(), usersRepository,
					"Restaurant_branch not found"));
		}

		// Handle restaurant_id foreign key
		if (order_paymentsEntity.getRestaurantId() != null && order_paymentsEntity.getRestaurantId().getId() != null) {
			newEntity.setRestaurantId(
					fetchReferenceById(order_paymentsEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		orderpaymentsrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateOrderPayments(OrderPaymentsEntity order_paymentsEntity, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		OrderPaymentsEntity existingEntity = orderpaymentsrepository.findById(order_paymentsEntity.getId())
				.orElseThrow(() -> new RuntimeException("OrderPayments not found"));

		// Update non-foreign fields using reflection
		for (Field field : OrderPaymentsEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(order_paymentsEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle online_order_id foreign key
		if (order_paymentsEntity.getOnlineOrderId() != null
				&& order_paymentsEntity.getOnlineOrderId().getId() != null) {
			existingEntity.setOnlineOrderId(
					fetchReferenceById(order_paymentsEntity.getOnlineOrderId(), ordersrepository, "Orders not found"));
		}

		// Handle branch_id foreign key
		if (order_paymentsEntity.getBranchId() != null && order_paymentsEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(fetchReferenceById(order_paymentsEntity.getBranchId(),
					usersRepository, "Restaurant_branch not found"));
		}

		// Handle restaurant_id foreign key
		if (order_paymentsEntity.getRestaurantId() != null && order_paymentsEntity.getRestaurantId().getId() != null) {
			existingEntity.setRestaurantId(
					fetchReferenceById(order_paymentsEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		orderpaymentsrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteOrderPayments(Long id, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		if (!orderpaymentsrepository.existsById(id)) {
			throw new RuntimeException("OrderPayments not found");
		}
		orderpaymentsrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrderPayments(List<OrderPaymentsEntity> order_paymentsEntitys, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		List<OrderPaymentsEntity> entitiesToSave = new ArrayList<>();

		for (OrderPaymentsEntity entity : order_paymentsEntitys) {
			OrderPaymentsEntity newEntity = new OrderPaymentsEntity();

			// Copy non-foreign fields using reflection
			for (Field field : OrderPaymentsEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle online_order_id foreign key
			if (entity.getOnlineOrderId() != null && entity.getOnlineOrderId().getId() != null) {
				newEntity.setOnlineOrderId(
						fetchReferenceById(entity.getOnlineOrderId(), ordersrepository, "Orders not found"));
			}

			// Handle branch_id foreign key
			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				newEntity.setBranchId(fetchReferenceById(entity.getBranchId(), usersRepository,
						"Restaurant_branch not found"));
			}

			// Handle restaurant_id foreign key
			if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
				newEntity.setRestaurantId(
						fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		orderpaymentsrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByPaymenttimeBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return orderpaymentsrepository.findByPaymentTimeBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrderPaymentsByPaymenttimeBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = orderpaymentsrepository.findByPaymentTimeBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByPaymenttime(LocalDate paymenttime, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = paymenttime.atStartOfDay();
		return orderpaymentsrepository.findByPaymentTime(dateTime);
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByRefundtimeBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return orderpaymentsrepository.findByRefundTimeBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrderPaymentsByRefundtimeBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = orderpaymentsrepository.findByRefundTimeBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByRefundtime(LocalDate refundtime, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = refundtime.atStartOfDay();
		return orderpaymentsrepository.findByRefundTime(dateTime);
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByReconciledatBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return orderpaymentsrepository.findByReconciledAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrderPaymentsByReconciledatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = orderpaymentsrepository.findByReconciledAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByReconciledat(LocalDate reconciledat, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = reconciledat.atStartOfDay();
		return orderpaymentsrepository.findByReconciledAt(dateTime);
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByCreatedatBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return orderpaymentsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrderPaymentsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = orderpaymentsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByCreatedat(LocalDate createdat, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return orderpaymentsrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return orderpaymentsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrderPaymentsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = orderpaymentsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrderPaymentsEntity> getOrderPaymentsByUpdatedat(LocalDate updatedat, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return orderpaymentsrepository.findByUpdatedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<OrderPaymentsEntity> page = orderpaymentsrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("OrderPaymentss");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Online_order_id");
			header.createCell(2).setCellValue("Restaurant_id");
			header.createCell(3).setCellValue("Branch_id");
			header.createCell(4).setCellValue("Payment_method");
			header.createCell(5).setCellValue("Payment_gateway");
			header.createCell(6).setCellValue("Gateway_transaction_id");
			header.createCell(7).setCellValue("Amount");
			header.createCell(8).setCellValue("Payment_status");
			header.createCell(9).setCellValue("Payment_time");
			header.createCell(10).setCellValue("Refund_amount");
			header.createCell(11).setCellValue("Refund_reason");
			header.createCell(12).setCellValue("Refund_time");
			header.createCell(13).setCellValue("Is_reconciled");
			header.createCell(14).setCellValue("Reconciled_at");
			header.createCell(15).setCellValue("Created_at");
			header.createCell(16).setCellValue("Updated_at");

			int rowNum = 1;
			for (OrderPaymentsEntity order_paymentsEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(order_paymentsEntity.getId() != null ? order_paymentsEntity.getId() : 0);
				row.createCell(1)
						.setCellValue(order_paymentsEntity.getOnlineOrderId() != null
								? order_paymentsEntity.getOnlineOrderId().toString()
								: "N/A");
				row.createCell(2)
						.setCellValue(order_paymentsEntity.getRestaurantId() != null
								? order_paymentsEntity.getRestaurantId().toString()
								: "N/A");
				row.createCell(3)
						.setCellValue(order_paymentsEntity.getBranchId() != null
								? order_paymentsEntity.getBranchId().toString()
								: "N/A");
				row.createCell(4)
						.setCellValue(order_paymentsEntity.getPaymentMethod() != null
								? order_paymentsEntity.getPaymentMethod()
								: "N/A");
				row.createCell(5)
						.setCellValue(order_paymentsEntity.getPaymentGateway() != null
								? order_paymentsEntity.getPaymentGateway()
								: "N/A");
				row.createCell(6)
						.setCellValue(order_paymentsEntity.getGatewayTransactionId() != null
								? order_paymentsEntity.getGatewayTransactionId()
								: "N/A");
				row.createCell(7)
						.setCellValue(order_paymentsEntity.getAmount() != null
								? order_paymentsEntity.getAmount().doubleValue()
								: 0.0);
				row.createCell(8)
						.setCellValue(order_paymentsEntity.getPaymentStatus() != null
								? order_paymentsEntity.getPaymentStatus()
								: "N/A");
				LocalDateTime paymentTime = order_paymentsEntity.getPaymentTime();
				String formattedPaymentTime = (paymentTime != null) ? paymentTime.format(dateTimeFormat) : "";
				row.createCell(9).setCellValue(formattedPaymentTime);
				row.createCell(10)
						.setCellValue(order_paymentsEntity.getRefundAmount() != null
								? order_paymentsEntity.getRefundAmount().doubleValue()
								: 0.0);
				row.createCell(11).setCellValue(
						order_paymentsEntity.getRefundReason() != null ? order_paymentsEntity.getRefundReason()
								: "N/A");
				LocalDateTime refundTime = order_paymentsEntity.getRefundTime();
				String formattedRefundTime = (refundTime != null) ? refundTime.format(dateTimeFormat) : "";
				row.createCell(12).setCellValue(formattedRefundTime);
				row.createCell(13).setCellValue(
						order_paymentsEntity.getIsReconciled() != null && order_paymentsEntity.getIsReconciled()
								? "Active"
								: "Inactive");
				LocalDateTime reconciledAt = order_paymentsEntity.getReconciledAt();
				String formattedReconciledAt = (reconciledAt != null) ? reconciledAt.format(dateTimeFormat) : "";
				row.createCell(14).setCellValue(formattedReconciledAt);
				LocalDateTime createdAt = order_paymentsEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(15).setCellValue(formattedCreatedAt);
				LocalDateTime updatedAt = order_paymentsEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(16).setCellValue(formattedUpdatedAt);

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
