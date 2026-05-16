package com.rms.modules.customer.controllers;

import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.modules.customer.services.CustOrdersService;
import com.rms.common.response.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
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

	// ***** Api- Add Single Record *****
	@PostMapping("/add")
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

	// ***** Api- Get By Id *****
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
		try {
			OrdersEntity result = ordersServiceIMP.getOneOrders(id, token);
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
