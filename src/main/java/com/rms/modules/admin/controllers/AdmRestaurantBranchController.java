package com.rms.modules.admin.controllers;

import com.rms.common.dto.BranchStatusDTO;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.serviceImplement.RestaurantBranchServiceIMP;
import com.rms.common.services.BranchStatusService;
import com.rms.modules.admin.services.AdmRestaurantBranchService;
import com.rms.common.response.ApiResponse;

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

@RestController
@RequestMapping("api/admin/restaurant_branch")
public class AdmRestaurantBranchController {

	@Autowired
	@Qualifier("admRestaurantBranchService")
	private RestaurantBranchServiceIMP restaurantBranchServiceIMP;
	
	@Autowired
	private AdmRestaurantBranchService aaAdmRestaurantBranchService;

	@Autowired
	private BranchStatusService branchStatusService;

	@GetMapping("/filter")
	public ResponseEntity<Object> getBranchesWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "searchValue", required = false) String searchValue,

			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {
			LocalDate fromDate = null;
			LocalDate toDate = null;

			// ✅ Date parsing only if both dates present
			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {

				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
				fromDate = LocalDate.parse(fromDateStr, formatter);
				toDate = LocalDate.parse(toDateStr, formatter);
			}

			Map<String, Object> result = aaAdmRestaurantBranchService.getBranchesWithFilters(fromDate, toDate, searchValue,
					pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Restaurant branches retrieved successfully");

		} catch (DateTimeParseException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch restaurant branches. Please try again later");
		}
	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getAllRecordRestaurantBranch(token);
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
	public ResponseEntity<Object> addRestaurantBranch(@RequestHeader("access_token") String token,
			@RequestBody RestaurantBranchEntity restaurant_branchEntity) {
		try {
			String result = restaurantBranchServiceIMP.addRestaurantBranch(restaurant_branchEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"RestaurantBranch added successfully");
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
			RestaurantBranchEntity result = restaurantBranchServiceIMP.getOneRestaurantBranch(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch retrieved successfully");
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
	public ResponseEntity<Object> updateRestaurantBranch(@RequestHeader("access_token") String token,
			@RequestBody RestaurantBranchEntity restaurant_branchEntity) {
		try {
			String result = restaurantBranchServiceIMP.updateRestaurantBranch(restaurant_branchEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch updated successfully");
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
			String result = restaurantBranchServiceIMP.deleteRestaurantBranch(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch deleted successfully");
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
			Map<String, Object> result = restaurantBranchServiceIMP.getAllRestaurantBranch(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch retrieved successfully");
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
			@RequestBody List<RestaurantBranchEntity> list) {
		try {
			String result = restaurantBranchServiceIMP.addMultipleRestaurantBranch(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"RestaurantBranch added successfully");
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
	public ResponseEntity<Object> getRestaurantBranchByCreatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<RestaurantBranchEntity> result = restaurantBranchServiceIMP
					.getRestaurantBranchByCreatedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat *****
	@GetMapping("/byCreatedat")
	public ResponseEntity<Object> getRestaurantBranchByCreatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate createdAt) {
		try {
			List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getRestaurantBranchByCreatedat(createdAt,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range With Pagination *****
	@GetMapping("/CreatedatRangeWithPagination")
	public ResponseEntity<Object> getRestaurantBranchByCreatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = restaurantBranchServiceIMP
					.getRestaurantBranchByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range *****
	@GetMapping("/UpdatedatRange")
	public ResponseEntity<Object> getRestaurantBranchByUpdatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<RestaurantBranchEntity> result = restaurantBranchServiceIMP
					.getRestaurantBranchByUpdatedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat *****
	@GetMapping("/byUpdatedat")
	public ResponseEntity<Object> getRestaurantBranchByUpdatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate updatedAt) {
		try {
			List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getRestaurantBranchByUpdatedat(updatedAt,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range With Pagination *****
	@GetMapping("/UpdatedatRangeWithPagination")
	public ResponseEntity<Object> getRestaurantBranchByUpdatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = restaurantBranchServiceIMP
					.getRestaurantBranchByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantBranch fetched successfully");
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
			ByteArrayInputStream in = restaurantBranchServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=RestaurantBranch.xlsx");
			headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

			return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
		} catch (SecurityException e) {
			return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
		} catch (IOException e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// ===================== Branch Order Control =====================

	@GetMapping("/branch-status/{branchId}")
	public ResponseEntity<Object> getBranchStatus(@RequestHeader("access_token") String token,
			@PathVariable Long branchId) {
		try {
			com.rms.configuration.Authorization.authorizeAdminOrRestaurant(token);
			Object result = branchStatusService.getBranchStatus(branchId, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Branch status fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		}
	}

	@PostMapping("/stop-orders/{branchId}")
	public ResponseEntity<Object> stopOrders(@RequestHeader("access_token") String token,
			@PathVariable Long branchId) {
		try {
			com.rms.configuration.Authorization.authorizeAdminOrRestaurant(token);
			branchStatusService.stopOrders(branchId, token);
			Object result = branchStatusService.getBranchStatus(branchId, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders stopped successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		}
	}

	@PostMapping("/resume-orders/{branchId}")
	public ResponseEntity<Object> resumeOrders(@RequestHeader("access_token") String token,
			@PathVariable Long branchId) {
		try {
			com.rms.configuration.Authorization.authorizeAdminOrRestaurant(token);
			branchStatusService.scheduleRelease(branchId, token);
			Object result = branchStatusService.getBranchStatus(branchId, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders resumed successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		}
	}
}