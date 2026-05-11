package com.rms.modules.restaurant.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.serviceImplement.MenuSubcategoryServiceIMP;
import com.rms.modules.restaurant.services.RestMenuSubcategoryService;
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
@RequestMapping("api/restaurant/menu_subcategory")
public class RestMenuSubcategoryController {

    @Autowired
    @Qualifier("restMenuSubcategoryService")
    private MenuSubcategoryServiceIMP menuSubcategoryServiceIMP;
    
    @Autowired
    private RestMenuSubcategoryService renuMenuSubcategoryService;
    
    @GetMapping("/filter")
	public ResponseEntity<Object> getMenuSubcategoriesWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "isActive", required = false) Boolean isActive,
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

			Map<String, Object> result = renuMenuSubcategoryService.getMenuSubcategoriesWithFilters(token,fromDate, toDate,isActive,
					searchValue, pageNumber, pageSize );

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Menu subcategories retrieved successfully");

		} catch (DateTimeParseException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch menu subcategories. Please try again later");
		}
	}
    
    @PostMapping("/add_Subcategory")
	public ResponseEntity<Object> addMenuSubcategory(@RequestHeader("access_token") String token,
			@RequestPart(value = "photo", required = false) MultipartFile icon,
			@RequestPart("payload") String payloadJson) {

		try {
			String result = renuMenuSubcategoryService.addMenuSubcategoryWithIcon(icon, payloadJson, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"Menu subcategory added successfully");

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
    
    @PostMapping("/update_Subcategory")
	public ResponseEntity<Object> updateMenuSubcategory(@RequestHeader("access_token") String token,
			@RequestPart(value = "photo", required = false) MultipartFile icon,
			@RequestPart("payload") String payloadJson) {

		try {
			if (payloadJson == null || payloadJson.isBlank()) {
				throw new IllegalArgumentException("Payload cannot be empty");
			}

			ObjectMapper mapper = new ObjectMapper();
			MenuSubcategoryEntity payloadEntity = mapper.readValue(payloadJson, MenuSubcategoryEntity.class);

			if (payloadEntity.getId() == null) {
				throw new IllegalArgumentException("Subcategory id is mandatory for update");
			}

			String result = renuMenuSubcategoryService.updateMenuSubcategoryWithIcon(payloadEntity, icon, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Menu subcategory updated successfully");

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
            List<MenuSubcategoryEntity> result = menuSubcategoryServiceIMP.getAllRecordMenuSubcategory(token);
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
    public ResponseEntity<Object> addMenuSubcategory(@RequestHeader("access_token") String token,@RequestBody MenuSubcategoryEntity menu_subcategoryEntity) {
        try {
            String result = menuSubcategoryServiceIMP.addMenuSubcategory(menu_subcategoryEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuSubcategory added successfully");
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
            MenuSubcategoryEntity result = menuSubcategoryServiceIMP.getOneMenuSubcategory(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory retrieved successfully");
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
    public ResponseEntity<Object> updateMenuSubcategory( @RequestHeader("access_token") String token,@RequestBody MenuSubcategoryEntity menu_subcategoryEntity) {
        try {
            String result = menuSubcategoryServiceIMP.updateMenuSubcategory(menu_subcategoryEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory updated successfully");
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
            String result = menuSubcategoryServiceIMP.deleteMenuSubcategory(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory deleted successfully");
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
            Map<String, Object> result = menuSubcategoryServiceIMP.getAllMenuSubcategory(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory retrieved successfully");
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
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<MenuSubcategoryEntity> list) {
        try {
            String result = menuSubcategoryServiceIMP.addMultipleMenuSubcategory(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuSubcategory added successfully");
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
    public ResponseEntity<Object> getMenuSubcategoryByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<MenuSubcategoryEntity> result = menuSubcategoryServiceIMP.getMenuSubcategoryByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getMenuSubcategoryByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<MenuSubcategoryEntity> result = menuSubcategoryServiceIMP.getMenuSubcategoryByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getMenuSubcategoryByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = menuSubcategoryServiceIMP.getMenuSubcategoryByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range ***** 
    @GetMapping("/UpdatedatRange")
    public ResponseEntity<Object> getMenuSubcategoryByUpdatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<MenuSubcategoryEntity> result = menuSubcategoryServiceIMP.getMenuSubcategoryByUpdatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat ***** 
    @GetMapping("/byUpdatedat")
    public ResponseEntity<Object> getMenuSubcategoryByUpdatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate updatedAt) {
        try {
            List<MenuSubcategoryEntity> result = menuSubcategoryServiceIMP.getMenuSubcategoryByUpdatedat(updatedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range With Pagination ***** 
    @GetMapping("/UpdatedatRangeWithPagination")
    public ResponseEntity<Object> getMenuSubcategoryByUpdatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = menuSubcategoryServiceIMP.getMenuSubcategoryByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuSubcategory fetched successfully");
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
            ByteArrayInputStream in = menuSubcategoryServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=MenuSubcategory.xlsx");
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