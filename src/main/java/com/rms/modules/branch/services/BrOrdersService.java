package com.rms.modules.branch.services;

import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.dto.BranchOrderSummaryDTO;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.OrderItemsRepository;
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

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import com.rms.common.util.StatusFilterUtil;

@Service
@Qualifier("brOrdersService")
public class BrOrdersService implements OrdersServiceIMP {

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
	private com.rms.common.repositories.DiningTablesRepository diningTablesRepository;

	@Autowired
	private com.rms.common.repositories.TableBookingRepository tableBookingRepository;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	private void assertDeliveryUserServesBranch(UsersEntity deliveryUser, UsersEntity branch) {
		if (deliveryUser == null || branch == null || branch.getId() == null) return;
		Long branchId = branch.getId();
		if (deliveryUser.getBranchId() != null && branchId.equals(deliveryUser.getBranchId().getId())) return;
		throw new SecurityException("Delivery user is not assigned to this branch");
	}

	private Map<String, Object> buildBranchOrderSummaryResponse(Page<Object[]> page) {
		List<BranchOrderSummaryDTO> records = page.getContent().stream()
				.map(BranchOrderSummaryDTO::fromRow)
				.collect(Collectors.toCollection(ArrayList::new));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", records);
		return response;
	}

	private BranchScope resolveBranchScope(String token) throws Exception {
		Authorization.authorizeBranch(token);
		tokenUtil.decryptAndStoreToken(token);
		Integer currentUserId = tokenUtil.getCurrentUserId();

		UsersEntity branchUser = usersRepository.findById(currentUserId.longValue())
				.orElseThrow(() -> new RuntimeException("Branch not found from token"));

		UsersEntity restaurantUser = branchUser.getParentId();
		if (restaurantUser == null) {
			throw new RuntimeException("Restaurant (parent) not found for branch");
		}
		return new BranchScope(branchUser, restaurantUser);
	}

	private LocalDateTime toStartOfDay(LocalDate date) {
		return date != null ? date.atStartOfDay() : null;
	}

	private LocalDateTime toEndOfDay(LocalDate date) {
		return date != null ? date.atTime(LocalTime.MAX) : null;
	}

	private String normalizeFilterValue(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private record BranchScope(UsersEntity branchUser, UsersEntity restaurantUser) {
	}

	public BrOrdersService(OrdersRepository ordersrepository, CustomersRepository customersrepository,
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
		BranchScope scope = resolveBranchScope(token);
		List<BranchOrderSummaryDTO> ordersList = ordersrepository
				.findBranchOrderSummariesForExport(scope.branchUser().getId(), scope.restaurantUser().getId(),
						toStartOfDay(fromDate), toEndOfDay(toDate), null, null)
				.stream()
				.map(BranchOrderSummaryDTO::fromRow)
				.collect(Collectors.toCollection(ArrayList::new));

		String scopeLabel = "Branch: " + (scope.branchUser().getName() != null ? scope.branchUser().getName() : "-");
		return com.rms.common.util.ItemReportExcelBuilder.buildBranchSummaries(ordersList, fromDate, toDate, scopeLabel);
	}

//	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate) throws Exception {
//
//		// 🔐 BRANCH AUTH
//		Authorization.authorizeRestaurant(token);
//
//		// 🔓 TOKEN → BRANCH ID
//		tokenUtil.decryptAndStoreToken(token);
//		Integer currentBranchId = tokenUtil.getCurrentUserId();
//
//		UsersEntity branch = usersrepository.findById(currentBranchId.longValue())
//				.orElseThrow(() -> new RuntimeException("Branch not found"));
//
//		// 🏢 RESTAURANT (via parentId)
//		UsersEntity restaurant = branch.getParentId();
//		if (restaurant == null) {
//			throw new RuntimeException("Restaurant not found for this branch");
//		}
//
//		// 📅 Date range
//		LocalDateTime fromDateTime = fromDate.atStartOfDay();
//		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);
//
//		// 📦 Fetch orders (ONLY TOKEN BRANCH)
//		List<OrdersEntity> ordersList = ordersrepository.findByBranchIdAndCreatedAtBetween(branch, fromDateTime,
//				toDateTime);
//
//		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
//
//		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
//
//			Sheet sheet = workbook.createSheet("Orders Report");
//
//			// 🧾 Header
//			Row header = sheet.createRow(0);
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
//				row.createCell(6).setCellValue(restaurant.getName() != null ? restaurant.getName() : "");
//
//				row.createCell(7).setCellValue(branch.getName() != null ? branch.getName() : "");
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
//
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

	public Map<String, Object> getOrdersWithFilters(String token, LocalDate fromDate, LocalDate toDate,
			Boolean isActive, String status, String searchValue, Integer pageNumber, Integer pageSize

	) throws Exception {
		BranchScope scope = resolveBranchScope(token);
		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), Math.max(pageSize, 1));

		Page<Object[]> page = ordersrepository.findBranchOrderSummaries(scope.branchUser().getId(),
				scope.restaurantUser().getId(), toStartOfDay(fromDate), toEndOfDay(toDate),
				normalizeFilterValue(status), normalizeFilterValue(searchValue), pageable);

		return buildBranchOrderSummaryResponse(page);
	}

	@Override
	public List<OrdersEntity> getAllRecordOrders(String token) throws Exception {
		BranchScope scope = resolveBranchScope(token);
		return ordersrepository.findByBranchId_Id(scope.branchUser().getId());
	}

	@Override
	public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception {
		BranchScope scope = resolveBranchScope(token);
		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), Math.max(pageSize, 1));
		Page<Object[]> page = ordersrepository.findBranchOrderSummaries(scope.branchUser().getId(),
				scope.restaurantUser().getId(), null, null, null, null, pageable);
		return buildBranchOrderSummaryResponse(page);
	}

	@Override
	public OrdersEntity getOneOrders(Long id, String token) throws Exception {
		Authorization.authorizeBranch(token);
		return ordersrepository.findById(id).orElseThrow(() -> new RuntimeException("Orders not found"));
	}

	@Override
	public String addOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeBranch(token);
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
			UsersEntity rider = fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found");
			assertDeliveryUserServesBranch(rider, newEntity.getBranchId());
			newEntity.setDeliveryId(rider);
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
		Authorization.authorizeBranch(token);
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
					fetchReferenceById(ordersEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		// Handle captain_id foreign key
		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
			existingEntity
					.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
		}

		// Handle delivery_id foreign key
		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
			UsersEntity rider = fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found");
			assertDeliveryUserServesBranch(rider, existingEntity.getBranchId());
			existingEntity.setDeliveryId(rider);
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

		com.rms.common.util.OrderLifecycleUtil.applyClosedSideEffects(
				existingEntity, diningTablesRepository, tableBookingRepository);
		return "Updated Successfully";
	}

	@Override
	public String deleteOrders(Long id, String token) throws Exception {
		Authorization.authorizeBranch(token);
		if (!ordersrepository.existsById(id)) {
			throw new RuntimeException("Orders not found");
		}
		ordersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrders(List<OrdersEntity> ordersEntitys, String token) throws Exception {
		Authorization.authorizeBranch(token);
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
		Authorization.authorizeBranch(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeBranch(token);
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
		Authorization.authorizeBranch(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return ordersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeBranch(token);
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
		Authorization.authorizeBranch(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return ordersrepository.findByUpdatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeBranch(token);
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
		Authorization.authorizeBranch(token);
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
