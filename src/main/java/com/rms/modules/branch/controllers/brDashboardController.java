package com.rms.modules.branch.controllers;

import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.modules.admin.services.AdmDashboardService;
import com.rms.modules.admin.services.AdmMenuItemsService;
import com.rms.modules.branch.services.BrDashboardService;
import com.rms.modules.restaurant.services.RestDashboardService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/branch/dashboard")
public class brDashboardController {
	@Autowired
	private BrDashboardService brDashboardService;

	@GetMapping("/summary")
	public ResponseEntity<Object> getDashboardSummary(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {

		try {
			System.out.println("📡 Restaurant Dashboard Summary API Hit");

			// 🔥 SERVICE CALL
			Map<String, Object> result = brDashboardService.getBranchDashboardStats(token, fromDate, toDate);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Dashboard data fetched successfully");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

}