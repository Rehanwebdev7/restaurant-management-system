package com.rms.modules.branch.controllers;

import com.rms.common.entities.WalletTopupRequestEntity;
import com.rms.common.serviceImplement.WalletTopupRequestServiceIMP;
import com.rms.modules.branch.services.BrWalletTopupRequestService;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
@RequestMapping("api/branch/wallet_topup_request")
public class BrWalletTopupRequestController {

	@Autowired
	@Qualifier("brWalletTopupRequestService")
	private WalletTopupRequestServiceIMP walletTopupRequestServiceIMP;

	@Autowired
	private BrWalletTopupRequestService brWalletTopupRequestService;
 
	@GetMapping("/xl_export")
	public ResponseEntity<byte[]> downloadOrdersExcel(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {

		try {
			// 📦 Call updated service method
			ByteArrayInputStream in = brWalletTopupRequestService.streamExcel(token,fromDate, toDate);

			byte[] bytes = in.readAllBytes();

			// 📄 Dynamic file name
			String fileName = "withdraw_Request_" + fromDate + "_to_" + toDate + ".xlsx";

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

	// ***** Api – Filter Wallet Topup Requests *****
	@GetMapping("/history")
	public ResponseEntity<Object> getHistory(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "mode", required = false) Integer mode,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "searchValue", required = false) String searchValue,

			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {

			LocalDateTime startDate = null;
			LocalDateTime endDate = null;

			// ================= DATE PARSING =================
			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {

				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

				LocalDate fromDate = LocalDate.parse(fromDateStr, formatter);
				LocalDate toDate = LocalDate.parse(toDateStr, formatter);

				startDate = fromDate.atStartOfDay(); // 00:00:00
				endDate = toDate.atTime(LocalTime.MAX); // 23:59:59.999999999
			}

			// ================= SERVICE CALL =================
			Map<String, Object> result = brWalletTopupRequestService.approvalHistory(startDate, endDate, mode, status,
					searchValue, pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Wallet topup requests retrieved successfully");

		} catch (DateTimeParseException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch wallet topup requests. Please try again later");
		}
	}

	// ***** Api – Filter Wallet Topup Requests *****
	@GetMapping("/filter")
	public ResponseEntity<Object> getWalletTopupRequestsWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "mode", required = false) Integer mode,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "searchValue", required = false) String searchValue,

			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {

		try {

			LocalDateTime startDate = null;
			LocalDateTime endDate = null;

			// ================= DATE PARSING =================
			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {

				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

				LocalDate fromDate = LocalDate.parse(fromDateStr, formatter);
				LocalDate toDate = LocalDate.parse(toDateStr, formatter);

				startDate = fromDate.atStartOfDay(); // 00:00:00
				endDate = toDate.atTime(LocalTime.MAX); // 23:59:59.999999999
			}

			// ================= SERVICE CALL =================
			Map<String, Object> result = brWalletTopupRequestService.getWalletTopupRequestsWithFilters_ForBranch(
					startDate, endDate, mode, status, searchValue, pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Wallet topup requests retrieved successfully");

		} catch (DateTimeParseException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd");

		} catch (SecurityException e) {

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();

			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch wallet topup requests. Please try again later");
		}
	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP.getAllRecordWalletTopupRequest(token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Add Single Record *****
	@PostMapping("/add")
	public ResponseEntity<Object> addWalletTopupRequest(@RequestHeader("access_token") String token,
			@RequestBody WalletTopupRequestEntity wallet_topup_requestEntity) {
		try {
			String result = walletTopupRequestServiceIMP.addWalletTopupRequest(wallet_topup_requestEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"WalletTopupRequest added successfully");
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
			WalletTopupRequestEntity result = walletTopupRequestServiceIMP.getOneWalletTopupRequest(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest retrieved successfully");
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
	public ResponseEntity<Object> updateWalletTopupRequest(@RequestHeader("access_token") String token,
			@RequestBody WalletTopupRequestEntity wallet_topup_requestEntity) {
		try {
			String result = walletTopupRequestServiceIMP.updateWalletTopupRequest(wallet_topup_requestEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest updated successfully");
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
			String result = walletTopupRequestServiceIMP.deleteWalletTopupRequest(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest deleted successfully");
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
			Map<String, Object> result = walletTopupRequestServiceIMP.getAllWalletTopupRequest(pageNumber, pageSize,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest retrieved successfully");
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
			@RequestBody List<WalletTopupRequestEntity> list) {
		try {
			String result = walletTopupRequestServiceIMP.addMultipleWalletTopupRequest(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"WalletTopupRequest added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Approveddate Range *****
	@GetMapping("/ApproveddateRange")
	public ResponseEntity<Object> getWalletTopupRequestByApproveddateRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByApproveddateBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Approveddate *****
	@GetMapping("/byApproveddate")
	public ResponseEntity<Object> getWalletTopupRequestByApproveddate(@RequestHeader("access_token") String token,
			@RequestParam LocalDate approvedDate) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByApproveddate(approvedDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Approveddate Range With Pagination *****
	@GetMapping("/ApproveddateRangeWithPagination")
	public ResponseEntity<Object> getWalletTopupRequestByApproveddateRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByApproveddateBetweenPagination(fromDate, toDate, pageNumber, pageSize,
							token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date Range *****
	@GetMapping("/DateRange")
	public ResponseEntity<Object> getWalletTopupRequestByDateRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByDateBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date *****
	@GetMapping("/byDate")
	public ResponseEntity<Object> getWalletTopupRequestByDate(@RequestHeader("access_token") String token,
			@RequestParam LocalDate date) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP.getWalletTopupRequestByDate(date,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date Range With Pagination *****
	@GetMapping("/DateRangeWithPagination")
	public ResponseEntity<Object> getWalletTopupRequestByDateRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByDateBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Transdate Range *****
	@GetMapping("/TransdateRange")
	public ResponseEntity<Object> getWalletTopupRequestByTransdateRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByTransdateBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Transdate *****
	@GetMapping("/byTransdate")
	public ResponseEntity<Object> getWalletTopupRequestByTransdate(@RequestHeader("access_token") String token,
			@RequestParam LocalDate transDate) {
		try {
			List<WalletTopupRequestEntity> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByTransdate(transDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Transdate Range With Pagination *****
	@GetMapping("/TransdateRangeWithPagination")
	public ResponseEntity<Object> getWalletTopupRequestByTransdateRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = walletTopupRequestServiceIMP
					.getWalletTopupRequestByTransdateBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTopupRequest fetched successfully");
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
			ByteArrayInputStream in = walletTopupRequestServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=WalletTopupRequest.xlsx");
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