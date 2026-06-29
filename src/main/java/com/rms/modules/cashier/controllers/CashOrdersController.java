package com.rms.modules.cashier.controllers;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.modules.cashier.services.CashOrdersService;
import com.rms.common.response.ApiResponse;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/cashier/orders")
public class CashOrdersController {

	@Autowired
	@Qualifier("cashOrdersService")
	private OrdersServiceIMP ordersServiceIMP;

	@Autowired
	private CashOrdersService cashOrdersService;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private TokenUtil tokenUtil;

	@GetMapping("/xl_export")
	public ResponseEntity<byte[]> downloadOrdersExcel(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {

		try {
			// 📦 Call updated service method
			ByteArrayInputStream in = cashOrdersService.streamExcel(token, fromDate, toDate);

			byte[] bytes = in.readAllBytes();

			// 📄 Dynamic file name
			String fileName = "Orders_Report_" + fromDate + "_to_" + toDate + ".xlsx";

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName);
			headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

			return new ResponseEntity<>(bytes, headers, HttpStatus.OK);

		} catch (SecurityException e) {
			return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

		} catch (IOException e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
		}
	}

	@GetMapping("/history")
	public ResponseEntity<Object> getKitchenOrdersWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "paymentStatus", required = false) String paymentStatus,
			@RequestParam(value = "paymentMethod", required = false) String paymentMethod,
			@RequestParam(value = "searchValue", required = false) String searchValue,

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

			Map<String, Object> result = cashOrdersService.getOrdersByCashierId(token, fromDate, toDate, status,
					paymentStatus, paymentMethod, searchValue, pageNumber, pageSize);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Kitchen orders retrieved successfully");

		} catch (DateTimeParseException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch kitchen orders. Please try again later");
		}
	}

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

			Map<String, Object> result = cashOrdersService.getOrdersWithFilters(fromDate, toDate, status, searchValue,
					pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Menu categories retrieved successfully");

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

	@PostMapping("/adds")
	public ResponseEntity<Object> addOrders(@RequestHeader("access_token") String token,
			@RequestBody Map<String, Object> ordersPayload // ⚡ JSON payload directly Map me
	) {
		try {
			Map<String, Object> result = cashOrdersService.addOrderss(ordersPayload, token);
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
			// Cashier-role authorization (same gate as the service path).
			Authorization.authorizeCashier(token);
			tokenUtil.decryptAndStoreToken(token);

			// Use the native-projection repo methods. Loading OrdersEntity via the
			// service triggers a JOIN graph (12+ EAGER ManyToOne associations on
			// OrdersEntity plus self-referential UsersEntity.parent/branch FKs)
			// that exceeds Postgres' 1664-column per-target-list limit (SQLState
			// 54011), surfacing on the wire as HTTP 404 because the JDBC error
			// bubbles up as a generic RuntimeException.
			List<Object[]> detailRows = ordersRepository.findOrderDetailScalarById(id);
			if (detailRows == null || detailRows.isEmpty()) {
				return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, "Orders not found");
			}
			Map<String, Object> detail = mapOrderDetailRow(detailRows.get(0));
			List<Object[]> itemRows = ordersRepository.findOrderItemsScalarByOrderId(id);
			detail.put("orderItems", itemRows.stream().map(this::mapOrderItemRow).collect(java.util.stream.Collectors.toList()));
			return ApiResponse.responseBuilder(detail, "SUCCESS", HttpStatus.OK, "Orders retrieved successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	private Map<String, Object> mapOrderDetailRow(Object[] r) {
		Map<String, Object> m = new LinkedHashMap<>();
		int i = 0;
		m.put("id", asLong(r[i++]));
		m.put("orderNumber", asString(r[i++]));
		m.put("orderType", asString(r[i++]));
		m.put("status", asString(r[i++]));
		m.put("paymentStatus", asString(r[i++]));
		m.put("paymentMethod", asString(r[i++]));
		m.put("paymentRemarks", asString(r[i++]));
		m.put("subtotal", asBigDecimal(r[i++]));
		m.put("taxAmount", asBigDecimal(r[i++]));
		m.put("serChargeAmount", asBigDecimal(r[i++]));
		m.put("discountAmount", asBigDecimal(r[i++]));
		m.put("deliveryFee", asBigDecimal(r[i++]));
		m.put("totalAmount", asBigDecimal(r[i++]));
		m.put("walletAmountUsed", asBigDecimal(r[i++]));
		m.put("specialInstructions", asString(r[i++]));
		m.put("estimatedTime", asInteger(r[i++]));
		m.put("createdAt", asDateTime(r[i++]));
		m.put("updatedAt", asDateTime(r[i++]));
		m.put("completedAt", asDateTime(r[i++]));
		m.put("kitchenAcceptAt", asDateTime(r[i++]));
		m.put("kitchenReadyAt", asDateTime(r[i++]));
		m.put("deliveryAcceptAt", asDateTime(r[i++]));
		m.put("customerName", asString(r[i++]));
		m.put("customerPhone", asString(r[i++]));
		m.put("customerEmail", asString(r[i++]));
		m.put("tableNumber", asString(r[i++]));
		m.put("couponCode", asString(r[i++]));
		m.put("deliveryStatus", asString(r[i++]));
		m.put("bankRefNum", asString(r[i++]));
		m.put("apiRefNum", asString(r[i++]));
		m.put("customerId", asLong(r[i++]));
		m.put("branchId", asLong(r[i++]));
		m.put("cashierId", asLong(r[i++]));
		m.put("captainId", asLong(r[i++]));
		m.put("sectionId", asLong(r[i++]));
		m.put("tableBookingId", asLong(r[i++]));
		m.put("restaurantId", asLong(r[i++]));
		return m;
	}

	private Map<String, Object> mapOrderItemRow(Object[] r) {
		Map<String, Object> m = new LinkedHashMap<>();
		int i = 0;
		m.put("id", asLong(r[i++]));
		m.put("menuItemName", asString(r[i++]));
		m.put("quantity", asInteger(r[i++]));
		m.put("price", asBigDecimal(r[i++]));
		m.put("addonsTotal", asBigDecimal(r[i++]));
		m.put("itemTotal", asBigDecimal(r[i++]));
		m.put("status", asString(r[i++]));
		m.put("gstRate", asBigDecimal(r[i++]));
		m.put("gstType", asString(r[i++]));
		m.put("taxableAmount", asBigDecimal(r[i++]));
		m.put("gstAmount", asBigDecimal(r[i++]));
		m.put("specialInstructions", asString(r[i++]));
		m.put("createdAt", asDateTime(r[i++]));
		return m;
	}

	private static String asString(Object v) { return v != null ? v.toString() : null; }
	private static Long asLong(Object v) {
		if (v == null) return null;
		if (v instanceof Number n) return n.longValue();
		return Long.parseLong(v.toString());
	}
	private static Integer asInteger(Object v) {
		if (v == null) return null;
		if (v instanceof Number n) return n.intValue();
		return Integer.parseInt(v.toString());
	}
	private static BigDecimal asBigDecimal(Object v) {
		if (v == null) return null;
		if (v instanceof BigDecimal b) return b;
		if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
		return new BigDecimal(v.toString());
	}
	private static LocalDateTime asDateTime(Object v) {
		if (v == null) return null;
		if (v instanceof LocalDateTime ldt) return ldt;
		if (v instanceof Timestamp ts) return ts.toLocalDateTime();
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

	@GetMapping("/byTableBookingId")
	public ResponseEntity<Object> getOrdersByTableBookingId(@RequestHeader("access_token") String token,
			@RequestParam Long tableBookingId) {
		try {
			List<Map<String, Object>> result = cashOrdersService.getOrdersByTableBookingId(tableBookingId, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		}
	}

	// ***** Api- XL File Download *****
	@PutMapping("/cancel-item")
	public ResponseEntity<Object> cancelOrderItem(
			@RequestBody Map<String, Object> body,
			@RequestHeader("access_token") String token) {
		try {
			Long orderItemId = Long.parseLong(body.get("orderItemId").toString());
			cashOrdersService.cancelOrderItem(orderItemId, token);
			return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Item cancelled successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Throwable e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		}
	}

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
