package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.GlobalSettingEntity;
import com.rms.modules.admin.services.AdmGlobalSettingService;
import com.rms.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("api/superadmin/global_setting")
public class SuperadminGlobalSettingController {

    @Autowired
    private AdmGlobalSettingService globalSettingService;

    @GetMapping("/all")
    public ResponseEntity<Object> getAllSettings(@RequestHeader("access_token") String token) {
        try {
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Global settings retrieved");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/save")
    public ResponseEntity<Object> saveSetting(@RequestHeader("access_token") String token, @RequestBody GlobalSettingEntity entity) {
        try {
            return ApiResponse.responseBuilder(null, "SUCCESS", HttpStatus.OK, "Setting saved");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
}
