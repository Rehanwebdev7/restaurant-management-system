package com.rms.modules.cashier.controllers;

import com.rms.common.entities.OutstandingEntity;
import com.rms.common.serviceImplement.OutstandingServiceIMP;
import com.rms.modules.branch.services.BrOutstandingService;
import com.rms.modules.cashier.services.CashOutstandingService;
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
@RequestMapping("api/cashier/outstanding")
public class CashOutstandingController {

	@Autowired
	@Qualifier("cashOutstandingService")
	private OutstandingServiceIMP outstandingServiceIMP;

	@Autowired
	private CashOutstandingService brOutstandingService;

	@GetMapping("/xl_export")
	public ResponseEntity<byte[]> downloadOrdersExcel(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {

		try {
			// 📦 Call updated service method
			ByteArrayInputStream in = brOutstandingService.streamOutstandingLedgerExcel(fromDate, toDate, token);

			byte[] bytes = in.readAllBytes();

			// 📄 Dynamic file name
			String fileName = "Outstanding_Ledger_" + fromDate + "_to_" + toDate + ".xlsx";

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
	public ResponseEntity<Object> getOutstandingWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "mode", required = false) Integer mode,
			@RequestParam(value = "searchValue", required = false) String searchValue,

			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {
			LocalDate fromDate = null;
			LocalDate toDate = null;

			// ================= DATE PARSING =================
			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {

				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
				fromDate = LocalDate.parse(fromDateStr, formatter);
				toDate = LocalDate.parse(toDateStr, formatter);
			}

			// ================= SERVICE CALL =================
			Map<String, Object> result = brOutstandingService.getOutstandingWithFilters(fromDate, toDate, mode,
					searchValue, pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Outstanding records retrieved successfully");

		} catch (DateTimeParseException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch outstanding records. Please try again later");
		}
	}

	// ***** API – Deduct Outstanding (DEBIT) *****
	@PostMapping("/deduct")
	public ResponseEntity<Object> deductOutstanding(@RequestHeader("access_token") String token,
			@RequestBody Map<String, Object> payload) {

		try {
			Map<String, Object> result = brOutstandingService.deductoutstannding(payload, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding deducted successfully");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());

		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Add Single Record *****
	@PostMapping("/add")
	public ResponseEntity<Object> addOutstanding(@RequestHeader("access_token") String token,
			@RequestBody OutstandingEntity outstandingEntity) {
		try {
			String result = outstandingServiceIMP.addOutstanding(outstandingEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Outstanding added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Id *****
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Integer id) {
		try {
			OutstandingEntity result = outstandingServiceIMP.getOneOutstanding(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding retrieved successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Update Record *****
	@PutMapping("/update")
	public ResponseEntity<Object> updateOutstanding(@RequestHeader("access_token") String token,
			@RequestBody OutstandingEntity outstandingEntity) {
		try {
			String result = outstandingServiceIMP.updateOutstanding(outstandingEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding updated successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Delete Record *****
	@DeleteMapping("/{id}")
	public ResponseEntity<Object> delete(@RequestHeader("access_token") String token, @PathVariable Integer id) {
		try {
			String result = outstandingServiceIMP.deleteOutstanding(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding deleted successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get All With Pagination *****
	@GetMapping("/getAll")
	public ResponseEntity<Object> getAll(@RequestHeader("access_token") String token,
			@RequestParam(defaultValue = "0", required = false) Integer pageNumber,
			@RequestParam(defaultValue = "10", required = false) Integer pageSize) {
		try {
			Map<String, Object> result = outstandingServiceIMP.getAllOutstanding(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding retrieved successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Add Multiple Record *****
	@PostMapping("/addMultiple")
	public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,
			@RequestBody List<OutstandingEntity> list) {
		try {
			String result = outstandingServiceIMP.addMultipleOutstanding(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Outstanding added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date Range *****
	@GetMapping("/DateRange")
	public ResponseEntity<Object> getOutstandingByDateRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<OutstandingEntity> result = outstandingServiceIMP.getOutstandingByDateBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date *****
	@GetMapping("/byDate")
	public ResponseEntity<Object> getOutstandingByDate(@RequestHeader("access_token") String token,
			@RequestParam LocalDate date) {
		try {
			List<OutstandingEntity> result = outstandingServiceIMP.getOutstandingByDate(date, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date Range With Pagination *****
	@GetMapping("/DateRangeWithPagination")
	public ResponseEntity<Object> getOutstandingByDateRangeWithPagination(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate, @RequestParam Integer pageNumber,
			@RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = outstandingServiceIMP.getOutstandingByDateBetweenPagination(fromDate, toDate,
					pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Outstanding fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- XL File Download *****
	@GetMapping("/download")
	public ResponseEntity<byte[]> downloadUsersExcel(@RequestHeader("access_token") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "100") int pageSize) {
		try {
			ByteArrayInputStream in = outstandingServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Outstanding.xlsx");
			headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

			return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
		} catch (SecurityException e) {
			return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
		} catch (IOException e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}