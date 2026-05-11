package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.serviceImplement.CustomersServiceIMP;
import com.rms.common.response.ApiResponse;
import com.rms.modules.admin.services.AdmCustomersService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/superadmin/customers")
public class SuperadminCustomersController {

    @Autowired
    @Qualifier("admCustomersService")
    private CustomersServiceIMP customersServiceIMP;

    @Autowired
    private AdmCustomersService admCustomersService;

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getAllRecordCustomers(token);
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
    public ResponseEntity<Object> addCustomers(@RequestHeader("access_token") String token,@RequestBody CustomersEntity customersEntity) {
        try {
            String result = customersServiceIMP.addCustomers(customersEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Customers added successfully");
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
            CustomersEntity result = customersServiceIMP.getOneCustomers(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers retrieved successfully");
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
    public ResponseEntity<Object> updateCustomers( @RequestHeader("access_token") String token,@RequestBody CustomersEntity customersEntity) {
        try {
            String result = customersServiceIMP.updateCustomers(customersEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers updated successfully");
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
            String result = customersServiceIMP.deleteCustomers(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers deleted successfully");
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
            Map<String, Object> result = customersServiceIMP.getAllCustomers(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers retrieved successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Update referral bonuses for all customers *****
    @PostMapping("/referral-bonus/apply-all")
    public ResponseEntity<Object> applyReferralBonusForAll(
            @RequestHeader("access_token") String token,
            @RequestBody Map<String, Object> payload) {
        try {
            BigDecimal signupBonus = payload.get("signupBonus") != null
                    ? new BigDecimal(payload.get("signupBonus").toString())
                    : BigDecimal.ZERO;
            BigDecimal recurringBonus = payload.get("recurringBonus") != null
                    ? new BigDecimal(payload.get("recurringBonus").toString())
                    : BigDecimal.ZERO;

            Map<String, Object> result = admCustomersService.updateReferralBonusesForAll(signupBonus, recurringBonus, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Referral bonuses updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Multiple Record ***** 
    @PostMapping("/addMultiple")
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<CustomersEntity> list) {
        try {
            String result = customersServiceIMP.addMultipleCustomers(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Customers added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Dateofbirth Range ***** 
    @GetMapping("/DateofbirthRange")
    public ResponseEntity<Object> getCustomersByDateofbirthRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getCustomersByDateofbirthBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Dateofbirth ***** 
    @GetMapping("/byDateofbirth")
    public ResponseEntity<Object> getCustomersByDateofbirth(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate dateOfBirth) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getCustomersByDateofbirth(dateOfBirth, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Dateofbirth Range With Pagination ***** 
    @GetMapping("/DateofbirthRangeWithPagination")
    public ResponseEntity<Object> getCustomersByDateofbirthRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = customersServiceIMP.getCustomersByDateofbirthBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range ***** 
    @GetMapping("/CreatedatRange")
    public ResponseEntity<Object> getCustomersByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getCustomersByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getCustomersByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getCustomersByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getCustomersByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = customersServiceIMP.getCustomersByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range ***** 
    @GetMapping("/UpdatedatRange")
    public ResponseEntity<Object> getCustomersByUpdatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getCustomersByUpdatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat ***** 
    @GetMapping("/byUpdatedat")
    public ResponseEntity<Object> getCustomersByUpdatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate updatedAt) {
        try {
            List<CustomersEntity> result = customersServiceIMP.getCustomersByUpdatedat(updatedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range With Pagination ***** 
    @GetMapping("/UpdatedatRangeWithPagination")
    public ResponseEntity<Object> getCustomersByUpdatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = customersServiceIMP.getCustomersByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched successfully");
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
            ByteArrayInputStream in = customersServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Customers.xlsx");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
         }catch (SecurityException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // =========================================================================
    // MANAGEMENT: paginated customer list with per-customer stats.
    // Accepts admin/branch/cashier tokens (view-only).
    // =========================================================================
    @GetMapping("/management/list")
    public ResponseEntity<Object> managementList(
            @RequestHeader("access_token") String token,
            @RequestParam(value = "searchValue", required = false) String searchValue,
            @RequestParam(value = "branchId", required = false) Long branchId,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        try {
            Map<String, Object> result = admCustomersService.getManagementList(
                    token, searchValue, branchId, pageNumber, pageSize);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Customers fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to fetch customers");
        }
    }
}
