package com.rms.modules.customer.controllers;

import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.BusinessSettingRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.RestaurantBranchServiceIMP;
import com.rms.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/customer/restaurant_branch")
public class CustRestaurantBranchController {

    @Autowired
    @Qualifier("custRestaurantBranchService")
    private RestaurantBranchServiceIMP restaurantBranchServiceIMP;

    @Autowired
    private RestaurantBranchRepository restaurantBranchRepository;

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    @Autowired
    private UsersRepository usersRepository;

    /**
     * Public list of active branches — multi-tenant aware.
     *
     * Resolves the calling tenant from the Host header (or
     * `?restaurantId=` override for embed widgets), looks up the
     * BusinessSettings row that owns that domain, and returns only the
     * branches whose `restaurant_id` matches. So `spicegarden.com` sees
     * Spice Garden's branches and `biryanihouse.com` sees Biryani House's —
     * no cross-tenant leakage.
     *
     * Falls back to the legacy "all active branches" behaviour ONLY when
     * the tenant cannot be resolved at all (no domain match + no localhost
     * fallback in business_settings). This keeps the demo cluster usable
     * for tenants that haven't onboarded their domain yet.
     */
    @GetMapping({ "/public/all", "/public" })
    public ResponseEntity<Object> getPublicActiveBranches(
            HttpServletRequest req,
            @RequestParam(value = "restaurantId", required = false) Long restaurantIdOverride) {
        try {
            Long restaurantId = restaurantIdOverride != null
                    ? restaurantIdOverride
                    : resolveTenantRestaurantId(req);

            // The canonical "branch" entity in this codebase lives in the
            // `users` table with role='branch' (parentId points to the
            // restaurant owner). The legacy `restaurant_branch` table holds
            // branch metadata (address, city) and is OPTIONALLY linked via
            // restaurant_branch.users_id (or similar). We query users first
            // — that's always populated — then enrich with restaurant_branch
            // when we can find a row for the same parent.
            List<UsersEntity> branchUsers = usersRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "branch".equalsIgnoreCase(u.getRole()))
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive())
                            && !Boolean.TRUE.equals(u.getIsDeleted()))
                    .filter(u -> {
                        if (restaurantId == null) return true; // legacy fallback
                        return u.getParentId() != null
                                && restaurantId.equals(u.getParentId().getId());
                    })
                    .collect(Collectors.toList());

            // Pull restaurant_branch rows once and key by their users_id /
            // branch-user-id link if the legacy schema has one. Older rows
            // may not link cleanly; we still return the user-level branch
            // with whatever metadata we can find on the users table itself.
            List<RestaurantBranchEntity> rbRows = restaurantBranchRepository.findAll();

            List<Map<String, Object>> result = branchUsers.stream()
                    .map(u -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("id", u.getId());
                        row.put("branchName", u.getName());
                        row.put("phone", u.getMobile());
                        row.put("email", u.getEmail());
                        row.put("restaurantId", u.getParentId() != null ? u.getParentId().getId() : null);
                        // Enrich from restaurant_branch table when available.
                        RestaurantBranchEntity meta = rbRows.stream()
                                .filter(rb -> rb.getRestaurantId() != null
                                        && rb.getRestaurantId().getId() != null
                                        && rb.getRestaurantId().getId().equals(u.getParentId() != null ? u.getParentId().getId() : null))
                                .findFirst().orElse(null);
                        if (meta != null) {
                            row.put("addressLine1", meta.getAddress());
                            row.put("city", meta.getPincodeId() != null && meta.getPincodeId().getCityId() != null
                                    ? meta.getPincodeId().getCityId().getName()
                                    : null);
                            row.put("latitude", meta.getLatitude());
                            row.put("longitude", meta.getLongitude());
                        }
                        return row;
                    })
                    .collect(Collectors.toList());

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
                    restaurantId != null
                        ? "Active branches retrieved (tenant=" + restaurantId + ", count=" + result.size() + ")"
                        : "Active branches retrieved (no tenant resolved, count=" + result.size() + ")");
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to fetch branches");
        }
    }

    private Long resolveTenantRestaurantId(HttpServletRequest req) {
        String host = CustBrandingController.resolveHost(req);
        if (host == null || host.isBlank()) return null;
        Optional<BusinessSettingEntity> exact = businessSettingRepository.findByDomainUrl(host);
        if (exact.isEmpty() && host.startsWith("www.")) {
            exact = businessSettingRepository.findByDomainUrl(host.substring(4));
        }
        if (exact.isEmpty()) {
            exact = businessSettingRepository.findByDomainUrl("localhost");
        }
        return exact.map(s -> s.getRestaurantId() != null ? s.getRestaurantId().getId() : null).orElse(null);
    }

    //***** Api- Get All Without Pagination *****
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getAllRecordRestaurantBranch(token);
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
    public ResponseEntity<Object> addRestaurantBranch(@RequestHeader("access_token") String token,@RequestBody RestaurantBranchEntity restaurant_branchEntity) {
        try {
            String result = restaurantBranchServiceIMP.addRestaurantBranch(restaurant_branchEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "RestaurantBranch added successfully");
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
            RestaurantBranchEntity result = restaurantBranchServiceIMP.getOneRestaurantBranch(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch retrieved successfully");
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
    public ResponseEntity<Object> updateRestaurantBranch( @RequestHeader("access_token") String token,@RequestBody RestaurantBranchEntity restaurant_branchEntity) {
        try {
            String result = restaurantBranchServiceIMP.updateRestaurantBranch(restaurant_branchEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch updated successfully");
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
            String result = restaurantBranchServiceIMP.deleteRestaurantBranch(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch deleted successfully");
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
            Map<String, Object> result = restaurantBranchServiceIMP.getAllRestaurantBranch(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch retrieved successfully");
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
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<RestaurantBranchEntity> list) {
        try {
            String result = restaurantBranchServiceIMP.addMultipleRestaurantBranch(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "RestaurantBranch added successfully");
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
    public ResponseEntity<Object> getRestaurantBranchByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getRestaurantBranchByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getRestaurantBranchByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getRestaurantBranchByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getRestaurantBranchByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = restaurantBranchServiceIMP.getRestaurantBranchByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range ***** 
    @GetMapping("/UpdatedatRange")
    public ResponseEntity<Object> getRestaurantBranchByUpdatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getRestaurantBranchByUpdatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat ***** 
    @GetMapping("/byUpdatedat")
    public ResponseEntity<Object> getRestaurantBranchByUpdatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate updatedAt) {
        try {
            List<RestaurantBranchEntity> result = restaurantBranchServiceIMP.getRestaurantBranchByUpdatedat(updatedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range With Pagination ***** 
    @GetMapping("/UpdatedatRangeWithPagination")
    public ResponseEntity<Object> getRestaurantBranchByUpdatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = restaurantBranchServiceIMP.getRestaurantBranchByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "RestaurantBranch fetched successfully");
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
            ByteArrayInputStream in = restaurantBranchServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=RestaurantBranch.xlsx");
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