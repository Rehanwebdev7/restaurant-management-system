package com.rms.modules.admin.controllers;

import com.rms.common.entities.GlobalSettingEntity;
import com.rms.modules.admin.services.AdmGlobalSettingService;
import com.rms.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/admin/global_setting")
public class AdmGlobalSettingController {

    @Autowired
    private AdmGlobalSettingService globalSettingService;

    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
        try {
            List<GlobalSettingEntity> result = globalSettingService.getAllRecordGlobalSetting(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/getAll")
    public ResponseEntity<Object> getAll(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Map<String, Object> result = globalSettingService.getAllGlobalSetting(pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Global settings retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            GlobalSettingEntity result = globalSettingService.getOneGlobalSetting(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Global setting retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/add")
    public ResponseEntity<Object> addGlobalSetting(
            @RequestHeader("access_token") String token,
            @RequestBody GlobalSettingEntity entity) {
        try {
            String result = globalSettingService.addGlobalSetting(entity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Global setting added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/update")
    public ResponseEntity<Object> updateGlobalSettingPost(
            @RequestHeader("access_token") String token,
            @RequestBody GlobalSettingEntity entity) {
        try {
            String result = globalSettingService.updateGlobalSetting(entity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Global setting updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PutMapping("/update")
    public ResponseEntity<Object> updateGlobalSetting(
            @RequestHeader("access_token") String token,
            @RequestBody GlobalSettingEntity entity) {
        try {
            String result = globalSettingService.updateGlobalSetting(entity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Global setting updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteGlobalSetting(@RequestHeader("access_token") String token, @PathVariable Long id) {
        try {
            String result = globalSettingService.deleteGlobalSetting(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Global setting deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/save")
    public ResponseEntity<Object> saveSetting(
            @RequestHeader("access_token") String token,
            @RequestBody GlobalSettingEntity entity) {
        try {
            String result = globalSettingService.addGlobalSetting(entity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Setting saved");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
