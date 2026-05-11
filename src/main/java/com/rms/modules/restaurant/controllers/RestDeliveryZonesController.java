package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.serviceImplement.DeliveryZonesServiceIMP;
import com.rms.modules.restaurant.services.RestDeliveryZonesService;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/restaurant/delivery_zones")
public class RestDeliveryZonesController {

	@Autowired
	@Qualifier("restDeliveryZonesService")
	private DeliveryZonesServiceIMP deliveryZonesServiceIMP;

	@Autowired
	private RestDeliveryZonesService restDeliveryZonesService;
	
	@GetMapping("/filter")
	public ResponseEntity<Object> getDeliveryZonesWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "isActive", required = false) Boolean isActive,

			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {

			Map<String, Object> result = restDeliveryZonesService.getDeliveryZonesWithFilters(isActive,
					pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Delivery zones retrieved successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch delivery zones");
		}
	}

	@GetMapping("branchId")
	public ResponseEntity<Object> getByIds(@RequestHeader("access_token") String token,
			@RequestParam("id") Long branchId) {
		try {

			// 🔹 branchId param se hi aa rahi hai
			List<DeliveryZonesEntity> result = restDeliveryZonesService.getBybranchId(branchId, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Delivery zones retrieved successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (RuntimeException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());

		} catch (Exception e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

//	@PostMapping("/bulkUpdate")
//	public ResponseEntity<Object> bulkUpdateUsersProfile(
//			@RequestHeader(value = "access_token", required = false) String token,
//			@RequestBody List<DeliveryZonesEntity> list) {
//
//		try {
//			String result = restDeliveryZonesService.bulkUpsertDeliveryZonesByBranch(list, token);
//
//			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
//					"Bulk Users Profile updated successfully");
//
//		} catch (SecurityException e) {
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
//
//		} catch (IllegalArgumentException e) {
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
//
//		} catch (RuntimeException e) {
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
//
//		} catch (Exception e) {
//			e.printStackTrace();
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
//					"Internal server error occurred");
//		}
//	}
	
	@PostMapping("/bulkUpdate") 
	public ResponseEntity<Object> addOrUpdateDeliveryZones(@RequestHeader("access_token") String token,
			@RequestBody List<DeliveryZonesEntity> deliveryZonesList) {

		try {

			String result = restDeliveryZonesService.multipleUpdateDeliveryZones(deliveryZonesList, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"Delivery Zones processed successfully");

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

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<DeliveryZonesEntity> result = deliveryZonesServiceIMP.getAllRecordDeliveryZones(token);
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
	public ResponseEntity<Object> addDeliveryZones(@RequestHeader("access_token") String token,
			@RequestBody DeliveryZonesEntity delivery_zonesEntity) {
		try {
			String result = deliveryZonesServiceIMP.addDeliveryZones(delivery_zonesEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"DeliveryZones added successfully");
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
			DeliveryZonesEntity result = deliveryZonesServiceIMP.getOneDeliveryZones(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"DeliveryZones retrieved successfully");
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
	public ResponseEntity<Object> updateDeliveryZones(@RequestHeader("access_token") String token,
			@RequestBody DeliveryZonesEntity delivery_zonesEntity) {
		try {
			String result = deliveryZonesServiceIMP.updateDeliveryZones(delivery_zonesEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "DeliveryZones updated successfully");
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
			String result = deliveryZonesServiceIMP.deleteDeliveryZones(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "DeliveryZones deleted successfully");
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
			Map<String, Object> result = deliveryZonesServiceIMP.getAllDeliveryZones(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"DeliveryZones retrieved successfully");
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
			@RequestBody List<DeliveryZonesEntity> list) {
		try {
			String result = deliveryZonesServiceIMP.addMultipleDeliveryZones(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"DeliveryZones added successfully");
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
	public ResponseEntity<Object> getDeliveryZonesByCreatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<DeliveryZonesEntity> result = deliveryZonesServiceIMP.getDeliveryZonesByCreatedatBetween(fromDate,
					toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "DeliveryZones fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat *****
	@GetMapping("/byCreatedat")
	public ResponseEntity<Object> getDeliveryZonesByCreatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate createdAt) {
		try {
			List<DeliveryZonesEntity> result = deliveryZonesServiceIMP.getDeliveryZonesByCreatedat(createdAt, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "DeliveryZones fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range With Pagination *****
	@GetMapping("/CreatedatRangeWithPagination")
	public ResponseEntity<Object> getDeliveryZonesByCreatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = deliveryZonesServiceIMP.getDeliveryZonesByCreatedatBetweenPagination(fromDate,
					toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "DeliveryZones fetched successfully");
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
			ByteArrayInputStream in = deliveryZonesServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=DeliveryZones.xlsx");
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