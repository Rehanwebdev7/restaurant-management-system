package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.RestaurantHoursEntity;
import com.rms.common.serviceImplement.RestaurantHoursServiceIMP;
import com.rms.modules.restaurant.services.RestRestaurantHoursService;
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
@RequestMapping("api/restaurant/restaurant_hours")
public class RestRestaurantHoursController {

	@Autowired
	@Qualifier("restRestaurantHoursService")
	private RestaurantHoursServiceIMP restaurantHoursServiceIMP;
	
	@Autowired
	private RestRestaurantHoursService restRestaurantHoursService;
	
	 @GetMapping("branchId")
		public ResponseEntity<Object> getByIds(@RequestHeader("access_token") String token,
				@RequestParam("id") Long branchId) {
			try {

				// 🔹 branchId param se hi aa rahi hai
				List<RestaurantHoursEntity> result = restRestaurantHoursService.getBybranchId(branchId, token);

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

	@PutMapping("/bulkAdd")
	public ResponseEntity<Object> upsertMultipleRestaurantHours(@RequestHeader("access_token") String token,
			@RequestBody List<RestaurantHoursEntity> hoursList) {
		try {

			String result = restRestaurantHoursService.upsertRestaurantHours(token,hoursList) ;

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"Restaurant hours added/updated successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (RuntimeException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());

		} catch (Exception e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP.getAllRecordRestaurantHours(token);
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
	public ResponseEntity<Object> addRestaurantHours(@RequestHeader("access_token") String token,
			@RequestBody RestaurantHoursEntity restaurant_hoursEntity) {
		try {
			String result = restaurantHoursServiceIMP.addRestaurantHours(restaurant_hoursEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"RestaurantHours added successfully");
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
	@GetMapping("/{id}")
	public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
		try {
			RestaurantHoursEntity result = restaurantHoursServiceIMP.getOneRestaurantHours(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours retrieved successfully");
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
	public ResponseEntity<Object> updateRestaurantHours(@RequestHeader("access_token") String token,
			@RequestBody RestaurantHoursEntity restaurant_hoursEntity) {
		try {
			String result = restaurantHoursServiceIMP.updateRestaurantHours(restaurant_hoursEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours updated successfully");
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
			String result = restaurantHoursServiceIMP.deleteRestaurantHours(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours deleted successfully");
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
			Map<String, Object> result = restaurantHoursServiceIMP.getAllRestaurantHours(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours retrieved successfully");
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
			@RequestBody List<RestaurantHoursEntity> list) {
		try {
			String result = restaurantHoursServiceIMP.addMultipleRestaurantHours(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"RestaurantHours added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Specialdate Range *****
	@GetMapping("/SpecialdateRange")
	public ResponseEntity<Object> getRestaurantHoursBySpecialdateRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP
					.getRestaurantHoursBySpecialdateBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Specialdate *****
	@GetMapping("/bySpecialdate")
	public ResponseEntity<Object> getRestaurantHoursBySpecialdate(@RequestHeader("access_token") String token,
			@RequestParam LocalDate specialDate) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP.getRestaurantHoursBySpecialdate(specialDate,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Specialdate Range With Pagination *****
	@GetMapping("/SpecialdateRangeWithPagination")
	public ResponseEntity<Object> getRestaurantHoursBySpecialdateRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = restaurantHoursServiceIMP
					.getRestaurantHoursBySpecialdateBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range *****
	@GetMapping("/CreatedatRange")
	public ResponseEntity<Object> getRestaurantHoursByCreatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP
					.getRestaurantHoursByCreatedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat *****
	@GetMapping("/byCreatedat")
	public ResponseEntity<Object> getRestaurantHoursByCreatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate createdAt) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP.getRestaurantHoursByCreatedat(createdAt,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range With Pagination *****
	@GetMapping("/CreatedatRangeWithPagination")
	public ResponseEntity<Object> getRestaurantHoursByCreatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = restaurantHoursServiceIMP
					.getRestaurantHoursByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range *****
	@GetMapping("/UpdatedatRange")
	public ResponseEntity<Object> getRestaurantHoursByUpdatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP
					.getRestaurantHoursByUpdatedatBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat *****
	@GetMapping("/byUpdatedat")
	public ResponseEntity<Object> getRestaurantHoursByUpdatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate updatedAt) {
		try {
			List<RestaurantHoursEntity> result = restaurantHoursServiceIMP.getRestaurantHoursByUpdatedat(updatedAt,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range With Pagination *****
	@GetMapping("/UpdatedatRangeWithPagination")
	public ResponseEntity<Object> getRestaurantHoursByUpdatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = restaurantHoursServiceIMP
					.getRestaurantHoursByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"RestaurantHours fetched successfully");
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
			ByteArrayInputStream in = restaurantHoursServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=RestaurantHours.xlsx");
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