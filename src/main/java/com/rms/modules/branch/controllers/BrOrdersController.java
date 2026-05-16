package com.rms.modules.branch.controllers;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.modules.branch.services.BrOrdersService;
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
@RequestMapping("api/branch/orders")
public class BrOrdersController {

    @Autowired
    @Qualifier("brOrdersService")
    private OrdersServiceIMP ordersServiceIMP;
    
    @Autowired
    private BrOrdersService brOrdersService;

    private String requireToken(String token) {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Missing access token");
        }
        return token;
    }
    
    @GetMapping("/xl_export")
   	public ResponseEntity<byte[]> downloadOrdersExcel(@RequestHeader(value = "access_token", required = false) String token,
   			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate)
   			 {

   		try {
   			String resolvedToken = requireToken(token);
   			// 📦 Call updated service method
   			ByteArrayInputStream in = brOrdersService.streamExcel(resolvedToken,fromDate, toDate) ;

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
    
    @GetMapping("/filter")
   	public ResponseEntity<Object> getMenuCategoriesWithFilters(@RequestHeader(value = "access_token", required = false) String token,

   			@RequestParam(value = "fromDate", required = false) String fromDateStr,
   			@RequestParam(value = "toDate", required = false) String toDateStr,
   			@RequestParam(value = "active", required = false) Boolean isActive,
   			@RequestParam(value = "status", required = false) String status,
   			@RequestParam(value = "searchValue", required = false) String searchValue,
   			

   			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

   		try {
   			String resolvedToken = requireToken(token);
   			LocalDate fromDate = null;
   			LocalDate toDate = null;

   			// ✅ Date parsing (only when both present)
   			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {

   				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
   				fromDate = LocalDate.parse(fromDateStr, formatter);
   				toDate = LocalDate.parse(toDateStr, formatter);
   			}

   			Map<String, Object> result = brOrdersService.getOrdersWithFilters( resolvedToken,fromDate, toDate,isActive,
   					status,searchValue,  pageNumber, pageSize);

   			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
   					"Orders retrieved successfully");

   		} catch (DateTimeParseException e) {
   			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
   					"Invalid date format. Please use yyyy-MM-dd (e.g. 2025-11-06)");

   		} catch (SecurityException e) {
   			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

   		} catch (Exception e) {
   			e.printStackTrace();
   			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
   					"Unable to fetch orders. Please try again later");
   		}
   	}

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader(value = "access_token", required = false) String token) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getAllRecordOrders(requireToken(token));
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
    public ResponseEntity<Object> addOrders(@RequestHeader(value = "access_token", required = false) String token,@RequestBody OrdersEntity ordersEntity) {
        try {
            String result = ordersServiceIMP.addOrders(ordersEntity, requireToken(token));
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Orders added successfully");
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
    public ResponseEntity<Object> getById( @RequestHeader(value = "access_token", required = false) String token,@PathVariable Long id) {
        try {
            OrdersEntity result = ordersServiceIMP.getOneOrders(id, requireToken(token));
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders retrieved successfully");
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
    public ResponseEntity<Object> updateOrders( @RequestHeader(value = "access_token", required = false) String token,@RequestBody OrdersEntity ordersEntity) {
        try {
            String result = ordersServiceIMP.updateOrders(ordersEntity, requireToken(token));
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders updated successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/orderUpdate")
    public ResponseEntity<Object> updateOrdersAlias(
            @RequestHeader(value = "access_token", required = false) String token,
            @RequestBody OrdersEntity ordersEntity) {
        return updateOrders(token, ordersEntity);
    }

    //***** Api- Delete Record ***** 
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@RequestHeader(value = "access_token", required = false) String token,@PathVariable Long id) {
        try {
            String result = ordersServiceIMP.deleteOrders(id, requireToken(token));
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders deleted successfully");
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
            @RequestHeader(value = "access_token", required = false) String token,
            @RequestParam(defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(defaultValue = "10", required = false) Integer pageSize) {
        try {
            Map<String, Object> result = ordersServiceIMP.getAllOrders(pageNumber, pageSize,requireToken(token));
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders retrieved successfully");
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
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<OrdersEntity> list) {
        try {
            String result = ordersServiceIMP.addMultipleOrders(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Orders added successfully");
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
    public ResponseEntity<Object> getOrdersByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getOrdersByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getOrdersByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getOrdersByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getOrdersByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = ordersServiceIMP.getOrdersByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range ***** 
    @GetMapping("/UpdatedatRange")
    public ResponseEntity<Object> getOrdersByUpdatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getOrdersByUpdatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat ***** 
    @GetMapping("/byUpdatedat")
    public ResponseEntity<Object> getOrdersByUpdatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate updatedAt) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getOrdersByUpdatedat(updatedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range With Pagination ***** 
    @GetMapping("/UpdatedatRangeWithPagination")
    public ResponseEntity<Object> getOrdersByUpdatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = ordersServiceIMP.getOrdersByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Completedat Range ***** 
    @GetMapping("/CompletedatRange")
    public ResponseEntity<Object> getOrdersByCompletedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getOrdersByCompletedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Completedat ***** 
    @GetMapping("/byCompletedat")
    public ResponseEntity<Object> getOrdersByCompletedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate completedAt) {
        try {
            List<OrdersEntity> result = ordersServiceIMP.getOrdersByCompletedat(completedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Completedat Range With Pagination ***** 
    @GetMapping("/CompletedatRangeWithPagination")
    public ResponseEntity<Object> getOrdersByCompletedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = ordersServiceIMP.getOrdersByCompletedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders fetched successfully");
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
            ByteArrayInputStream in = ordersServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Orders.xlsx");
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
