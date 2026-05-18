package com.rms.modules.customer.controllers;

import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.modules.customer.services.CustMenuItemsService;
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
@RequestMapping("api/customer/menu_items")
public class CustMenuItemsController {

	@Autowired
	@Qualifier("custMenuItemsService")
	private MenuItemsServiceIMP menuItemsServiceIMP;

	@Autowired
	private CustMenuItemsService custMenuItemsService;

	@GetMapping("/public/advanceFilter")
	public ResponseEntity<Object> getMenuItemsPublic(@RequestParam(required = false) Long branchId,
			@RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long subcategoryId,
			@RequestParam(required = false) String searchValue, @RequestParam(required = false) Boolean recommended, @RequestParam(required = false) Boolean dietaryType,
			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {

			if(branchId==null) {
				throw new RuntimeException("Required parameter branchId is null/empty.");
			}
			Map<String, Object> result = custMenuItemsService.getMenuItemsWithFilters_WithDietAndRecommend(branchId, categoryId,
					subcategoryId, searchValue, pageNumber, pageSize, dietaryType,recommended, null);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Menu items retrieved successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		}catch (RuntimeException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (Exception e) {

			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu items. Please try again later");
		}
	}

	@GetMapping("/advanceFilter")
	public ResponseEntity<Object> getMenuItems(@RequestHeader("access_token") String token, @RequestParam(required = false) Long branchId,
			@RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long subcategoryId,
			@RequestParam(required = false) String searchValue, @RequestParam(required = false) Boolean recommended, @RequestParam(required = false) Boolean dietaryType,
			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {

			System.out.println("====== GET /menu_items/filter START ======");
			System.out.println("Header access_token : " + token);
			System.out.println("branchId            : " + branchId);
			System.out.println("categoryId          : " + categoryId);
			System.out.println("subcategoryId       : " + subcategoryId);
			System.out.println("searchValue         : " + searchValue);
			System.out.println("dietaryType         : " + dietaryType);
			System.out.println("dietaryType         : " + recommended);
			System.out.println("pageNumber          : " + pageNumber);
			System.out.println("pageSize            : " + pageSize);

			if(branchId==null) {
				throw new RuntimeException("Required parameter branchId is null/empty.");
			}
			Map<String, Object> result = custMenuItemsService.getMenuItemsWithFilters_WithDietAndRecommend(branchId, categoryId,
					subcategoryId, searchValue, pageNumber, pageSize, dietaryType,recommended, token);

			System.out.println("Menu items fetched successfully");
			System.out.println("====== GET /menu_items/filter END ======");

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Menu items retrieved successfully");

		} catch (SecurityException e) {

			System.out.println("Authorization failed: " + e.getMessage());

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		}catch (RuntimeException e) {

			System.out.println("Authorization failed: " + e.getMessage());

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (Exception e) {

			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu items. Please try again later");
		}
	}

	@GetMapping("/filter")
	public ResponseEntity<Object> getMenuItems(@RequestHeader("access_token") String token, @RequestParam Long branchId,
			@RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long subcategoryId,
			@RequestParam(required = false) String searchValue, @RequestParam(defaultValue = "0") Integer pageNumber,
			@RequestParam(defaultValue = "10") Integer pageSize) {

		try {

			Map<String, Object> result = custMenuItemsService.getMenuItemsWithFilters(branchId, categoryId,
					subcategoryId, searchValue, pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Menu items retrieved successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu items. Please try again later");
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