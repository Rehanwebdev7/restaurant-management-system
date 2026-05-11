package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.modules.admin.services.AdmMenuItemsService;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
@RequestMapping("api/superadmin/menu_items")
public class SuperadminMenuItemsController {

	@Autowired
	@Qualifier("admMenuItemsService")
	private MenuItemsServiceIMP menuItemsServiceIMP;

	@Autowired
	private AdmMenuItemsService admMenuItemsService;

	@PutMapping("/updateMultiple")
	public ResponseEntity<Object> updateMultiple(@RequestHeader("access_token") String token,
			@RequestBody List<MenuItemsEntity> list) {
		try {
			String result = admMenuItemsService.updateMultipleMenuItems(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuItems added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	
	@GetMapping("/filter")
	public ResponseEntity<Object> getMenuItemsWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "isActive", required = false) Boolean isActive,
			@RequestParam(value = "categoryId", required = false) Long categoryId,
			@RequestParam(value = "searchValue", required = false) String searchValue,
			@RequestParam(value = "branchId", required = false) Long branchId,

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

			Map<String, Object> result = admMenuItemsService.getMenuItemsWithFilters(fromDate, toDate,isActive,categoryId, searchValue,branchId,
					pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Menu items retrieved successfully");

		} catch (DateTimeParseException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu items. Please try again later");
		}
	}

	@PostMapping("/add_Menu")
	public ResponseEntity<Object> addMenuItem(@RequestHeader("access_token") String token,
			@RequestPart(value = "photo", required = false) MultipartFile photo,
			@RequestPart("payload") String payloadJson) {

		try {
			String result = admMenuItemsService.addMenuItemWithImage(token ,photo, payloadJson );

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Menu item added successfully");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (IllegalArgumentException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error occurred");
		}
	}

	// ================= UPDATE MENU ITEM =================
	@PostMapping("/update_Menu")
	public ResponseEntity<Object> updateMenuItem(@RequestHeader("access_token") String token,
			@RequestPart(value = "photo", required = false) MultipartFile photo,
			@RequestPart("payload") String payloadJson) {

		try {
			String result = admMenuItemsService.updateMenuItemWithImage(photo, payloadJson, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Menu item updated successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (IllegalArgumentException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (RuntimeException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error occurred");
		}
	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<MenuItemsEntity> result = menuItemsServiceIMP.getAllRecordMenuItems(token);
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
	public ResponseEntity<Object> addMenuItems(@RequestHeader("access_token") String token,
			@RequestBody MenuItemsEntity menu_itemsEntity) {
		try {
			String result = menuItemsServiceIMP.addMenuItems(menu_itemsEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuItems added successfully");
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
			MenuItemsEntity result = menuItemsServiceIMP.getOneMenuItems(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItems retrieved successfully");
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
	public ResponseEntity<Object> updateMenuItems(@RequestHeader("access_token") String token,
			@RequestBody MenuItemsEntity menu_itemsEntity) {
		try {
			String result = menuItemsServiceIMP.updateMenuItems(menu_itemsEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItems updated successfully");
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
			String result = menuItemsServiceIMP.deleteMenuItems(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItems deleted successfully");
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
			Map<String, Object> result = menuItemsServiceIMP.getAllMenuItems(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItems retrieved successfully");
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
			@RequestBody List<MenuItemsEntity> list) {
		try {
			String result = menuItemsServiceIMP.addMultipleMenuItems(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuItems added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
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
			ByteArrayInputStream in = menuItemsServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=MenuItems.xlsx");
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