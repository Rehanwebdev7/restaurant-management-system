package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.MenuItemAddonsEntity;
import com.rms.common.serviceImplement.MenuItemAddonsServiceIMP;
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
@RequestMapping("api/superadmin/menu_item_addons")
public class SuperadminMenuItemAddonsController {

    @Autowired
    @Qualifier("admMenuItemAddonsService")
    private MenuItemAddonsServiceIMP menuItemAddonsServiceIMP;

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<MenuItemAddonsEntity> result = menuItemAddonsServiceIMP.getAllRecordMenuItemAddons(token);
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
    public ResponseEntity<Object> addMenuItemAddons(@RequestHeader("access_token") String token,@RequestBody MenuItemAddonsEntity menu_item_addonsEntity) {
        try {
            String result = menuItemAddonsServiceIMP.addMenuItemAddons(menu_item_addonsEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuItemAddons added successfully");
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
            MenuItemAddonsEntity result = menuItemAddonsServiceIMP.getOneMenuItemAddons(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons retrieved successfully");
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
    public ResponseEntity<Object> updateMenuItemAddons( @RequestHeader("access_token") String token,@RequestBody MenuItemAddonsEntity menu_item_addonsEntity) {
        try {
            String result = menuItemAddonsServiceIMP.updateMenuItemAddons(menu_item_addonsEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons updated successfully");
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
            String result = menuItemAddonsServiceIMP.deleteMenuItemAddons(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons deleted successfully");
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
            Map<String, Object> result = menuItemAddonsServiceIMP.getAllMenuItemAddons(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons retrieved successfully");
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
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<MenuItemAddonsEntity> list) {
        try {
            String result = menuItemAddonsServiceIMP.addMultipleMenuItemAddons(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "MenuItemAddons added successfully");
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
    public ResponseEntity<Object> getMenuItemAddonsByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<MenuItemAddonsEntity> result = menuItemAddonsServiceIMP.getMenuItemAddonsByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getMenuItemAddonsByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<MenuItemAddonsEntity> result = menuItemAddonsServiceIMP.getMenuItemAddonsByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getMenuItemAddonsByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = menuItemAddonsServiceIMP.getMenuItemAddonsByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "MenuItemAddons fetched successfully");
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
            ByteArrayInputStream in = menuItemAddonsServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=MenuItemAddons.xlsx");
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