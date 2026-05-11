package com.rms.modules.restaurant.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.serviceImplement.MenuCategoryServiceIMP;
import com.rms.modules.restaurant.services.RestMenuCategoryService;
import com.rms.modules.restaurant.services.RestMenuItemsService;
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
@RequestMapping("api/restaurant/menu_category")
public class RestMenuCategoryController {

    @Autowired
    @Qualifier("restMenuCategoryService")
    private MenuCategoryServiceIMP menuCategoryServiceIMP;
    
    @Autowired
    private RestMenuCategoryService restMenuCategoryService;
    
    
    @GetMapping("/filter") 
	public ResponseEntity<Object> getMenuItemsWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "isActive", required = false) Boolean isActive,
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

			Map<String, Object> result = restMenuCategoryService.getMenuCategoriesWithFilters(token,fromDate, toDate,isActive, searchValue,
					pageNumber, pageSize );

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
    
    @PostMapping("/add_Category")
	public ResponseEntity<Object> addMenuCategory(@RequestHeader("access_token") String token,
			@RequestPart(value = "photo", required = false) MultipartFile icon,
			@RequestPart("payload") String payloadJson) {

		try {
			String result = restMenuCategoryService.addMenuCategoryWithIcon(icon, payloadJson, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"Menu category added successfully");

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
    
    @PostMapping("/update_Category")
	public ResponseEntity<Object> updateMenuCategory(@RequestHeader("access_token") String token,
			@RequestPart(value = "photo", required = false) MultipartFile icon,
			@RequestPart("payload") String payloadJson) {

		try {
			// ================= BASIC VALIDATION =================
			if (payloadJson == null || payloadJson.isBlank()) {
				throw new IllegalArgumentException("Payload cannot be empty");
			}

			// ================= JSON → ENTITY =================
			ObjectMapper mapper = new ObjectMapper();
			MenuCategoryEntity payloadEntity = mapper.readValue(payloadJson, MenuCategoryEntity.class);

			// ================= ID CHECK =================
			if (payloadEntity.getId() == null) {
				throw new IllegalArgumentException("Menu category id is mandatory for update");
			}

			// ================= SERVICE CALL =================
			String result = restMenuCategoryService.updateMenuCategoryWithIcon(icon, payloadJson, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Menu category updated successfully");

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

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<MenuCategoryEntity> result = menuCategoryServiceIMP.getAllRecordMenuCategory(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Single Record ***** 
    @PostMapping("/add")
    public ResponseEntity<Object> addMenuCategory(@RequestHeader("access_token") String token,@RequestBody MenuCategoryEntity menu_categoryEntity) {
        try {
            String result = menuCategoryServiceIMP.addMenuCategory(menu_categoryEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuCategory added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Id ***** 
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Object> getById( @RequestHeader("access_token") String token,@PathVariable Long id) {
        try {
            MenuCategoryEntity result = menuCategoryServiceIMP.getOneMenuCategory(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory retrieved successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Update Record  ***** 
    @PutMapping("/update")
    public ResponseEntity<Object> updateMenuCategory( @RequestHeader("access_token") String token,@RequestBody MenuCategoryEntity menu_categoryEntity) {
        try {
            String result = menuCategoryServiceIMP.updateMenuCategory(menu_categoryEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory updated successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Delete Record ***** 
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@RequestHeader("access_token") String token,@PathVariable Long id) {
        try {
            String result = menuCategoryServiceIMP.deleteMenuCategory(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory deleted successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get All With Pagination ***** 
    @GetMapping("/getAll")
    public ResponseEntity<Object> getAll(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(defaultValue = "10", required = false) Integer pageSize) {
        try {
            Map<String, Object> result = menuCategoryServiceIMP.getAllMenuCategory(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory retrieved successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Multiple Record ***** 
    @PostMapping("/addMultiple")
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<MenuCategoryEntity> list) {
        try {
            String result = menuCategoryServiceIMP.addMultipleMenuCategory(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuCategory added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range ***** 
    @GetMapping("/CreatedatRange")
    public ResponseEntity<Object> getMenuCategoryByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<MenuCategoryEntity> result = menuCategoryServiceIMP.getMenuCategoryByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getMenuCategoryByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<MenuCategoryEntity> result = menuCategoryServiceIMP.getMenuCategoryByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getMenuCategoryByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = menuCategoryServiceIMP.getMenuCategoryByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range ***** 
    @GetMapping("/UpdatedatRange")
    public ResponseEntity<Object> getMenuCategoryByUpdatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<MenuCategoryEntity> result = menuCategoryServiceIMP.getMenuCategoryByUpdatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat ***** 
    @GetMapping("/byUpdatedat")
    public ResponseEntity<Object> getMenuCategoryByUpdatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate updatedAt) {
        try {
            List<MenuCategoryEntity> result = menuCategoryServiceIMP.getMenuCategoryByUpdatedat(updatedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range With Pagination ***** 
    @GetMapping("/UpdatedatRangeWithPagination")
    public ResponseEntity<Object> getMenuCategoryByUpdatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = menuCategoryServiceIMP.getMenuCategoryByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuCategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- XL File Download ***** 
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadUsersExcel(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "100") int pageSize) {
        try {
            ByteArrayInputStream in = menuCategoryServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=MenuCategory.xlsx");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
         }catch (SecurityException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}