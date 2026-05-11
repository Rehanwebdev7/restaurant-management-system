package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.OrderAddonsItemsEntity;
import com.rms.common.serviceImplement.OrderAddonsItemsServiceIMP;
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
@RequestMapping("api/superadmin/order_addons_items")
public class SuperadminOrderAddonsItemsController {

    @Autowired
    @Qualifier("admOrderAddonsItemsService")
    private OrderAddonsItemsServiceIMP orderAddonsItemsServiceIMP;

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<OrderAddonsItemsEntity> result = orderAddonsItemsServiceIMP.getAllRecordOrderAddonsItems(token);
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
    public ResponseEntity<Object> addOrderAddonsItems(@RequestHeader("access_token") String token,@RequestBody OrderAddonsItemsEntity order_addons_itemsEntity) {
        try {
            String result = orderAddonsItemsServiceIMP.addOrderAddonsItems(order_addons_itemsEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "OrderAddonsItems added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Id ***** 
    @GetMapping("/{id}")
    public ResponseEntity<Object> getById( @RequestHeader("access_token") String token,@PathVariable Long id) {
        try {
            OrderAddonsItemsEntity result = orderAddonsItemsServiceIMP.getOneOrderAddonsItems(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderAddonsItems retrieved successfully");
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
    public ResponseEntity<Object> updateOrderAddonsItems( @RequestHeader("access_token") String token,@RequestBody OrderAddonsItemsEntity order_addons_itemsEntity) {
        try {
            String result = orderAddonsItemsServiceIMP.updateOrderAddonsItems(order_addons_itemsEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderAddonsItems updated successfully");
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
            String result = orderAddonsItemsServiceIMP.deleteOrderAddonsItems(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderAddonsItems deleted successfully");
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
            Map<String, Object> result = orderAddonsItemsServiceIMP.getAllOrderAddonsItems(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderAddonsItems retrieved successfully");
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
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<OrderAddonsItemsEntity> list) {
        try {
            String result = orderAddonsItemsServiceIMP.addMultipleOrderAddonsItems(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "OrderAddonsItems added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
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
            ByteArrayInputStream in = orderAddonsItemsServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=OrderAddonsItems.xlsx");
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