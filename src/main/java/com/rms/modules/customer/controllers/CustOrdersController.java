package com.rms.modules.customer.controllers;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.OrderItemsRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.modules.customer.services.CustOrdersService;
import com.rms.common.response.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;
import java.util.ArrayList;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("api/customer/orders")
public class CustOrdersController {

	@Autowired
	@Qualifier("custOrdersService")
	private OrdersServiceIMP ordersServiceIMP;

	@Autowired
	private CustOrdersService custOrdersService;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private CustomersRepository customersRepository;

	@Autowired
	private UsersRepository usersRepository;

	@GetMapping("/track")
	public ResponseEntity<Object> getDeliveryRoute(@RequestHeader("access_token") String token,
			@RequestParam(value = "deliveryId", required = false) Integer deliveryId,
			@RequestParam(value = "branchId", required = false) Long branchId,
			@RequestParam(value = "addressId", required = false) Long addressId) {

		try {
			System.out.println("\n📥 API HIT → /api/delivery/location/route");

			// 🔐 DELIVERY AUTH

			Map<String, Object> result = custOrdersService.getDeliveryLocation(deliveryId, branchId, addressId);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Delivery route fetched successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (RuntimeException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch delivery route");
		}
	}

	@GetMapping("/isAllowedOrder")
	public ResponseEntity<Object> getValidOrderDistance(@RequestHeader("access_token") String token,

			@RequestParam(value = "addressId", required = false) Long addressId,
			@RequestParam(value = "branchId", required = false) Long branchId) {

		try {

			DeliveryZonesEntity result = custOrdersService.isZoneAllow(addressId, branchId);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Allow to process order.");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu categories. Please try again later");
		}
	}

//	@GetMapping("/ordersList")
//	public ResponseEntity<Object> getCustomerOrders(@RequestHeader("access_token") String token) {
//
//		try {
//
//			System.out.println("\n===== CUSTOMER ORDERS CONTROLLER HIT =====");
//			System.out.println("Token received");
//
//			Map<String, Object> result = custOrdersService.getOrdersWithFiltersForCustomer(token);
//
//			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
//					"Customer orders retrieved successfully");
//
//		} catch (SecurityException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
//
//		} catch (Exception e) {
//			e.printStackTrace();
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
//					"Unable to fetch customer orders");
//		}
//	}

	@GetMapping("/filter")
	public ResponseEntity<Object> getMenuCategoriesWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "searchValue", required = false) String searchValue,
			@RequestParam(value = "status", required = false) String status,

			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {
			LocalDate fromDate = null;
			LocalDate toDate = null;

			// ✅ Date parsing (only when both present)
			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {

				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
				fromDate = LocalDate.parse(fromDateStr, formatter);
				toDate = LocalDate.parse(toDateStr, formatter);
			}

			Map<String, Object> result = custOrdersService.getOrdersWithFiltersForCustomer(fromDate, toDate, status,
					searchValue, pageNumber, pageSize, token);
			Map<String, Object> sanitizedResult = sanitizeOrdersFilterResponse(result);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("Status", "SUCCESS");
			response.put("StatusCode", HttpStatus.OK.value());
			response.put("message", "Menu categories retrieved successfully");
			if (sanitizedResult != null) {
				response.putAll(sanitizedResult);
			}

			return new ResponseEntity<>(response, HttpStatus.OK);

		} catch (DateTimeParseException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu categories. Please try again later");
		}
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> sanitizeOrdersFilterResponse(Map<String, Object> result) {
		if (result == null) {
			return null;
		}

		Map<String, Object> responseMap = objectMapper.convertValue(result, new TypeReference<Map<String, Object>>() {
		});
		Object recordsObj = responseMap.get("records");
		if (!(recordsObj instanceof List<?> recordsList)) {
			return responseMap;
		}

		List<Map<String, Object>> sanitizedRecords = new ArrayList<>();
		for (Object recordObj : recordsList) {
			Map<String, Object> record = objectMapper.convertValue(recordObj, new TypeReference<Map<String, Object>>() {
			});
			removeNestedField(record, "customerDeliveryAddressesId", "customerId");
			record.remove("paymentGatewayId");

			Object orderItemsObj = record.get("orderItems");
			if (orderItemsObj instanceof List<?> orderItemsList) {
				List<Map<String, Object>> sanitizedOrderItems = new ArrayList<>();
				for (Object orderItemObj : orderItemsList) {
					Map<String, Object> orderItem = objectMapper.convertValue(orderItemObj,
							new TypeReference<Map<String, Object>>() {
							});
					Map<String, Object> menuItem = asMap(orderItem.get("menuItemId"));
					if (menuItem != null) {
						menuItem.remove("restaurantId");
						menuItem.remove("branchId");
						menuItem.remove("addonsId");
					}
					sanitizedOrderItems.add(orderItem);
				}
				record.put("orderItems", sanitizedOrderItems);
			}

			sanitizedRecords.add(record);
		}

		responseMap.put("records", sanitizedRecords);
		return responseMap;
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> asMap(Object value) {
		if (value instanceof Map<?, ?> map) {
			return (Map<String, Object>) map;
		}
		return null;
	}

	private void removeNestedField(Map<String, Object> parent, String parentKey, String childKey) {
		Map<String, Object> nestedMap = asMap(parent.get(parentKey));
		if (nestedMap != null) {
			nestedMap.remove(childKey);
		}
	}

	@PostMapping("/adds")
	public ResponseEntity<Object> addOrders(@RequestHeader("access_token") String token,
			@RequestBody Map<String, Object> ordersPayload // ⚡ JSON payload directly Map me
	) {
		try {
			Object result = custOrdersService.addOrderss(ordersPayload, token);
			System.out.println("📦 Order creation result type: " + (result != null ? result.getClass().getName() : "null"));

			// The service now returns a Map with order details
			if (result instanceof Map) {
				@SuppressWarnings("unchecked")
				Map<String, Object> resultMap = (Map<String, Object>) result;
				System.out.println("✅ Order created with ID: " + resultMap.get("orderId"));
				System.out.println("📤 Returning response with order object");
				return ApiResponse.responseBuilder(resultMap, "SUCCESS", HttpStatus.CREATED, "Orders added successfully");
			}

			// Fallback for string response (legacy)
			System.out.println("⚠️ Falling back to string response");
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Orders added successfully");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Add items to existing DINING order *****
	@PostMapping("/{orderId}/add-items")
	public ResponseEntity<Object> addItemsToOrder(
			@RequestHeader("access_token") String token,
			@PathVariable Long orderId,
			@RequestBody Map<String, Object> payload) {
		try {
			Object result = custOrdersService.addItemsToExistingOrder(orderId, payload, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Items added to order successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		}
	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getAllRecordOrders(token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Add Single Record (legacy entity form, kept under /add-entity) *****
	@PostMapping("/add-entity")
	public ResponseEntity<Object> addOrders(@RequestHeader("access_token") String token,
			@RequestBody OrdersEntity ordersEntity) {
		try {
			String result = ordersServiceIMP.addOrders(ordersEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Orders added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Simplified customer-facing order create *****
	// Frontend payload:
	// { branchId, orderType, items: [{menuItemId, quantity}], customerName,
	//   customerPhone, paymentMethod, deliveryAddress, specialInstructions }
	@PostMapping({ "/add", "/public/add" })
	@Transactional
	public ResponseEntity<Object> addCustomerOrder(
			@RequestHeader(value = "access_token", required = false) String token,
			@RequestBody Map<String, Object> payload) {
		try {
			// ---- Validation ----
			if (payload == null) {
				throw new IllegalArgumentException("Request body is required");
			}
			Long branchId = toLong(payload.get("branchId"));
			if (branchId == null) {
				throw new IllegalArgumentException("branchId is required");
			}
			String orderType = strOrDefault(payload.get("orderType"), "TAKEAWAY");
			String customerName = strOrDefault(payload.get("customerName"), "Guest");
			String customerPhone = strOrDefault(payload.get("customerPhone"), null);
			String paymentMethod = strOrDefault(payload.get("paymentMethod"), "CASH");
			String specialInstructions = strOrDefault(payload.get("specialInstructions"), null);

			Object itemsObj = payload.get("items");
			if (!(itemsObj instanceof List<?>) || ((List<?>) itemsObj).isEmpty()) {
				throw new IllegalArgumentException("items must be a non-empty array");
			}
			List<?> rawItems = (List<?>) itemsObj;

			// ---- Branch lookup ----
			UsersEntity branchUser = usersRepository.findById(branchId).orElse(null);
			if (branchUser == null) {
				throw new IllegalArgumentException("Invalid branchId: " + branchId);
			}

			// ---- Order shell ----
			OrdersEntity order = new OrdersEntity();
			order.setBranchId(branchUser);
			if (branchUser.getParentId() != null) {
				order.setRestaurantId(branchUser.getParentId());
			}
			order.setOrderType(orderType);
			order.setStatus("PENDING");
			order.setPaymentStatus("PENDING");
			order.setPaymentMethod(paymentMethod);
			order.setCustomerName(customerName);
			order.setCustomerPhone(customerPhone);
			order.setSpecialInstructions(specialInstructions);
			order.setOrderNumber("CUST-" + System.currentTimeMillis());

			// Hook to existing CustomersEntity when phone matches.
			if (customerPhone != null && !customerPhone.isBlank()) {
				Optional<CustomersEntity> existing = customersRepository.findByMobileNumber(customerPhone);
				existing.ifPresent(order::setCustomerId);
			}

			LocalDateTime now = LocalDateTime.now();
			order.setCreatedAt(now);
			order.setUpdatedAt(now);

			// Persist shell so we have an id for child items.
			OrdersEntity savedOrder = ordersRepository.save(order);

			// ---- Items ----
			BigDecimal subtotal = BigDecimal.ZERO;
			BigDecimal taxTotal = BigDecimal.ZERO;
			List<OrderItemsEntity> persistedItems = new ArrayList<>();

			for (Object raw : rawItems) {
				if (!(raw instanceof Map<?, ?>)) {
					continue;
				}
				@SuppressWarnings("unchecked")
				Map<String, Object> item = (Map<String, Object>) raw;
				Long menuItemId = toLong(item.get("menuItemId"));
				Integer qty = toInt(item.get("quantity"));
				if (menuItemId == null || qty == null || qty <= 0) {
					throw new IllegalArgumentException("Each item requires menuItemId and quantity > 0");
				}

				MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId).orElse(null);
				if (menuItem == null) {
					throw new IllegalArgumentException("Invalid menuItemId: " + menuItemId);
				}

				BigDecimal unitPrice = menuItem.getPrice() != null ? menuItem.getPrice() : BigDecimal.ZERO;
				BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

				BigDecimal gstRate = menuItem.getGstPercentage() != null ? menuItem.getGstPercentage() : BigDecimal.ZERO;
				BigDecimal gstAmount = lineTotal.multiply(gstRate).divide(BigDecimal.valueOf(100), 2,
						java.math.RoundingMode.HALF_UP);

				OrderItemsEntity oi = new OrderItemsEntity();
				oi.setOrderId(savedOrder);
				oi.setMenuItemId(menuItem);
				oi.setMenuItemName(menuItem.getName());
				oi.setPrice(unitPrice);
				oi.setQuantity(qty);
				oi.setItemTotal(lineTotal);
				oi.setAddonsTotal(BigDecimal.ZERO);
				oi.setGstRate(gstRate);
				oi.setGstType(menuItem.getGstType());
				oi.setTaxableAmount(lineTotal);
				oi.setGstAmount(gstAmount);
				oi.setStatus("PENDING");
				oi.setCreatedAt(now);
				oi.setUpdatedAt(now);
				persistedItems.add(orderItemsRepository.save(oi));

				subtotal = subtotal.add(lineTotal);
				taxTotal = taxTotal.add(gstAmount);
			}

			savedOrder.setSubtotal(subtotal);
			savedOrder.setTaxAmount(taxTotal);
			savedOrder.setTotalAmount(subtotal.add(taxTotal));
			savedOrder = ordersRepository.save(savedOrder);

			Map<String, Object> data = new LinkedHashMap<>();
			data.put("orderId", savedOrder.getId());
			data.put("orderNumber", savedOrder.getOrderNumber());
			data.put("status", savedOrder.getStatus());
			data.put("subtotal", savedOrder.getSubtotal());
			data.put("taxAmount", savedOrder.getTaxAmount());
			data.put("totalAmount", savedOrder.getTotalAmount());
			data.put("itemCount", persistedItems.size());

			return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.CREATED, "Order placed successfully");
		} catch (IllegalArgumentException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (RuntimeException e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to place order");
		}
	}

	private static Long toLong(Object v) {
		if (v == null) return null;
		if (v instanceof Number) return ((Number) v).longValue();
		try { return Long.parseLong(String.valueOf(v).trim()); } catch (NumberFormatException ex) { return null; }
	}

	private static Integer toInt(Object v) {
		if (v == null) return null;
		if (v instanceof Number) return ((Number) v).intValue();
		try { return Integer.parseInt(String.valueOf(v).trim()); } catch (NumberFormatException ex) { return null; }
	}

	private static String strOrDefault(Object v, String def) {
		if (v == null) return def;
		String s = String.valueOf(v).trim();
		return s.isEmpty() ? def : s;
	}

	// ***** Api- Get By Id *****
	// Uses native scalar projections (added in Session 11 for the cashier
	// detail fix) to avoid Postgres' 1664-column per-target-list limit.
	// Loading OrdersEntity directly would trigger Hibernate's 12-EAGER join
	// graph and bubble up as a confusing 404 / 500.
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
		try {
			List<Object[]> detailRows = ordersRepository.findOrderDetailScalarById(id);
			if (detailRows == null || detailRows.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, "Order not found");
			}
			Map<String, Object> detail = mapCustOrderDetailRow(detailRows.get(0));
			List<Object[]> itemRows = ordersRepository.findOrderItemsScalarByOrderId(id);
			detail.put("orderItems", itemRows.stream().map(this::mapCustOrderItemRow).collect(java.util.stream.Collectors.toList()));
			return ApiResponse.responseBuilder(detail, "SUCCESS", HttpStatus.OK, "Order retrieved successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	private Map<String, Object> mapCustOrderDetailRow(Object[] r) {
		Map<String, Object> m = new java.util.LinkedHashMap<>();
		int i = 0;
		m.put("id", custAsLong(r[i++]));
		m.put("orderNumber", custAsString(r[i++]));
		m.put("orderType", custAsString(r[i++]));
		m.put("status", custAsString(r[i++]));
		m.put("paymentStatus", custAsString(r[i++]));
		m.put("paymentMethod", custAsString(r[i++]));
		m.put("paymentRemarks", custAsString(r[i++]));
		m.put("subtotal", custAsBigDecimal(r[i++]));
		m.put("taxAmount", custAsBigDecimal(r[i++]));
		m.put("serChargeAmount", custAsBigDecimal(r[i++]));
		m.put("discountAmount", custAsBigDecimal(r[i++]));
		m.put("deliveryFee", custAsBigDecimal(r[i++]));
		m.put("totalAmount", custAsBigDecimal(r[i++]));
		m.put("walletAmountUsed", custAsBigDecimal(r[i++]));
		m.put("specialInstructions", custAsString(r[i++]));
		m.put("estimatedTime", custAsInteger(r[i++]));
		m.put("createdAt", custAsDateTime(r[i++]));
		m.put("updatedAt", custAsDateTime(r[i++]));
		m.put("completedAt", custAsDateTime(r[i++]));
		m.put("kitchenAcceptAt", custAsDateTime(r[i++]));
		m.put("kitchenReadyAt", custAsDateTime(r[i++]));
		m.put("deliveryAcceptAt", custAsDateTime(r[i++]));
		m.put("customerName", custAsString(r[i++]));
		m.put("customerPhone", custAsString(r[i++]));
		m.put("customerEmail", custAsString(r[i++]));
		m.put("tableNumber", custAsString(r[i++]));
		m.put("couponCode", custAsString(r[i++]));
		m.put("deliveryStatus", custAsString(r[i++]));
		m.put("bankRefNum", custAsString(r[i++]));
		m.put("apiRefNum", custAsString(r[i++]));
		m.put("customerId", custAsLong(r[i++]));
		m.put("branchId", custAsLong(r[i++]));
		m.put("cashierId", custAsLong(r[i++]));
		m.put("captainId", custAsLong(r[i++]));
		m.put("sectionId", custAsLong(r[i++]));
		m.put("tableBookingId", custAsLong(r[i++]));
		m.put("restaurantId", custAsLong(r[i++]));
		return m;
	}
	private Map<String, Object> mapCustOrderItemRow(Object[] r) {
		Map<String, Object> m = new java.util.LinkedHashMap<>();
		int i = 0;
		m.put("id", custAsLong(r[i++]));
		m.put("menuItemName", custAsString(r[i++]));
		m.put("quantity", custAsInteger(r[i++]));
		m.put("price", custAsBigDecimal(r[i++]));
		m.put("addonsTotal", custAsBigDecimal(r[i++]));
		m.put("itemTotal", custAsBigDecimal(r[i++]));
		m.put("status", custAsString(r[i++]));
		m.put("gstRate", custAsBigDecimal(r[i++]));
		m.put("gstType", custAsString(r[i++]));
		m.put("taxableAmount", custAsBigDecimal(r[i++]));
		m.put("gstAmount", custAsBigDecimal(r[i++]));
		m.put("specialInstructions", custAsString(r[i++]));
		m.put("createdAt", custAsDateTime(r[i++]));
		return m;
	}
	private static String custAsString(Object v) { return v != null ? v.toString() : null; }
	private static Long custAsLong(Object v) {
		if (v == null) return null;
		if (v instanceof Number n) return n.longValue();
		return Long.parseLong(v.toString());
	}
	private static Integer custAsInteger(Object v) {
		if (v == null) return null;
		if (v instanceof Number n) return n.intValue();
		return Integer.parseInt(v.toString());
	}
	private static java.math.BigDecimal custAsBigDecimal(Object v) {
		if (v == null) return null;
		if (v instanceof java.math.BigDecimal b) return b;
		if (v instanceof Number n) return java.math.BigDecimal.valueOf(n.doubleValue());
		return new java.math.BigDecimal(v.toString());
	}
	private static LocalDateTime custAsDateTime(Object v) {
		if (v == null) return null;
		if (v instanceof LocalDateTime ldt) return ldt;
		if (v instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
		return LocalDateTime.parse(v.toString());
	}

	// ***** Api- Update Record *****
	@PutMapping("/update")
	public ResponseEntity<Object> updateOrders(@RequestHeader("access_token") String token,
			@RequestBody OrdersEntity ordersEntity) {
		try {
			String result = ordersServiceIMP.updateOrders(ordersEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders updated successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Cancel Order *****
	@PutMapping("/{id}/cancel")
	public ResponseEntity<Object> cancelOrder(@RequestHeader("access_token") String token, @PathVariable Long id,
			@RequestBody(required = false) Map<String, Object> payload) {
		try {
			OrdersEntity cancelRequest = new OrdersEntity();
			cancelRequest.setId(id);
			cancelRequest.setStatus("CANCELLED");

			if (payload != null && payload.get("customerFeedback") != null) {
				cancelRequest.setCustomerFeedback(String.valueOf(payload.get("customerFeedback")));
			}

			String result = ordersServiceIMP.updateOrders(cancelRequest, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders updated successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Delete Record *****
	@DeleteMapping("/{id}")
	public ResponseEntity<Object> delete(@RequestHeader("access_token") String token, @PathVariable Long id) {
		try {
			String result = ordersServiceIMP.deleteOrders(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders deleted successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get All With Pagination *****
	@GetMapping("/getAll")
	public ResponseEntity<Object> getAll(@RequestHeader("access_token") String token,
			@RequestParam(defaultValue = "0", required = false) Integer pageNumber,
			@RequestParam(defaultValue = "10", required = false) Integer pageSize) {
		try {
			Map<String, Object> result = ordersServiceIMP.getAllOrders(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders retrieved successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Add Multiple Record *****
	@PostMapping("/addMultiple")
	public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,
			@RequestBody List<OrdersEntity> list) {
		try {
			String result = ordersServiceIMP.addMultipleOrders(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Orders added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range *****
	@GetMapping("/CreatedatRange")
	public ResponseEntity<Object> getOrdersByCreatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getOrdersByCreatedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat *****
	@GetMapping("/byCreatedat")
	public ResponseEntity<Object> getOrdersByCreatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate createdAt) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getOrdersByCreatedat(createdAt, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range With Pagination *****
	@GetMapping("/CreatedatRangeWithPagination")
	public ResponseEntity<Object> getOrdersByCreatedatRangeWithPagination(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate, @RequestParam Integer pageNumber,
			@RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = ordersServiceIMP.getOrdersByCreatedatBetweenPagination(fromDate, toDate,
					pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range *****
	@GetMapping("/UpdatedatRange")
	public ResponseEntity<Object> getOrdersByUpdatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getOrdersByUpdatedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat *****
	@GetMapping("/byUpdatedat")
	public ResponseEntity<Object> getOrdersByUpdatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate updatedAt) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getOrdersByUpdatedat(updatedAt, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range With Pagination *****
	@GetMapping("/UpdatedatRangeWithPagination")
	public ResponseEntity<Object> getOrdersByUpdatedatRangeWithPagination(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate, @RequestParam Integer pageNumber,
			@RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = ordersServiceIMP.getOrdersByUpdatedatBetweenPagination(fromDate, toDate,
					pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Completedat Range *****
	@GetMapping("/CompletedatRange")
	public ResponseEntity<Object> getOrdersByCompletedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getOrdersByCompletedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Completedat *****
	@GetMapping("/byCompletedat")
	public ResponseEntity<Object> getOrdersByCompletedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate completedAt) {
		try {
			List<OrdersEntity> result = ordersServiceIMP.getOrdersByCompletedat(completedAt, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Completedat Range With Pagination *****
	@GetMapping("/CompletedatRangeWithPagination")
	public ResponseEntity<Object> getOrdersByCompletedatRangeWithPagination(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate, @RequestParam Integer pageNumber,
			@RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = ordersServiceIMP.getOrdersByCompletedatBetweenPagination(fromDate, toDate,
					pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- XL File Download *****
	@GetMapping("/download")
	public ResponseEntity<byte[]> downloadUsersExcel(@RequestHeader("access_token") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "100") int pageSize) {
		try {
			ByteArrayInputStream in = ordersServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Orders.xlsx");
			headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

			return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
		} catch (SecurityException e) {
			return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
		} catch (IOException e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
