package com.rms.modules.delivery.controllers;

import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.serviceImplement.WalletTransactionsServiceIMP;
import com.rms.modules.delivery.services.DelWalletTransactionsService;
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
@RequestMapping("api/delivery/wallet_transactions")
public class DelWalletTransactionsController {

	@Autowired
	@Qualifier("delWalletTransactionsService")
	private WalletTransactionsServiceIMP walletTransactionsServiceIMP;

	@Autowired
	private DelWalletTransactionsService delWalletTransactionsService;

	@GetMapping("/xl_export")
	public ResponseEntity<byte[]> downloadOrdersExcel(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {

		try {
			// 📦 Call updated service method
			ByteArrayInputStream in = delWalletTransactionsService.streamWalletLedgerExcel(fromDate, toDate, token);

			byte[] bytes = in.readAllBytes();

			// 📄 Dynamic file name
			String fileName = "Wallet_Ledger_" + fromDate + "_to_" + toDate + ".xlsx";

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
	public ResponseEntity<Object> getWalletTransactionsWithFilters(@RequestHeader("access_token") String token,

			@RequestParam(value = "fromDate", required = false) String fromDateStr,
			@RequestParam(value = "toDate", required = false) String toDateStr,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "searchValue", required = false) String searchValue,
			@RequestParam(value = "mode", required = false) Integer mode,

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
			Map<String, Object> result = delWalletTransactionsService.getWalletTransactionsWithFilters(fromDate, toDate,
					status, searchValue, mode, pageNumber, pageSize, token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Wallet transactions retrieved successfully");

		} catch (DateTimeParseException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
					"Invalid date format. Please use yyyy-MM-dd");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch wallet transactions. Please try again later");
		}
	}

	// ***** Api- Update Record *****
	@PostMapping("/testProcedure")
	public ResponseEntity<Object> testProcedure(@RequestHeader("access_token") String token,
			@RequestBody Map<String, Object> payload) {
		try {
			String result = delWalletTransactionsService.walletTransaction(payload);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions Processed successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

//	@GetMapping("/filter")
//	public ResponseEntity<Object> getOrdersWithFilters(@RequestHeader("access_token") String token,
//
//			@RequestParam(value = "fromDate", required = false) String fromDateStr,
//			@RequestParam(value = "toDate", required = false) String toDateStr,
//			@RequestParam(value = "status", required = false) String status,
//			@RequestParam(value = "searchValue", required = false) String searchValue,
//
//			@RequestParam(defaultValue = "0") Integer pageNumber, @RequestParam(defaultValue = "10") Integer pageSize) {
//
//		try {
//			LocalDate fromDate = null;
//			LocalDate toDate = null;
//
//			// ✅ Date parsing
//			if (fromDateStr != null && !fromDateStr.isBlank() && toDateStr != null && !toDateStr.isBlank()) {
//
//				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
//				fromDate = LocalDate.parse(fromDateStr, formatter);
//				toDate = LocalDate.parse(toDateStr, formatter);
//			}
//
//			// ✅ PARAMETER ORDER FIXED
//			Map<String, Object> result = delWalletTransactionsService.getWalletTransactionsWithFilters(fromDate, toDate,
//					status, // ✅ correct
//					searchValue, // ✅ correct
//					pageNumber, pageSize, token);
//
//			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Orders retrieved successfully");
//
//		} catch (DateTimeParseException e) {
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
//					"Invalid date format. Please use yyyy-MM-dd");
//
//		} catch (SecurityException e) {
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
//
//		} catch (Exception e) {
//			e.printStackTrace();
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
//					"Unable to fetch orders. Please try again later");
//		}
//	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<WalletTransactionsEntity> result = walletTransactionsServiceIMP.getAllRecordWalletTransactions(token);
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
	public ResponseEntity<Object> addWalletTransactions(@RequestHeader("access_token") String token,
			@RequestBody WalletTransactionsEntity wallet_transactionsEntity) {

		System.out.println("🚀 === ADD WALLET TRANSACTION API CALLED ===");

		try {
			System.out.println("🔐 Access Token received");
			System.out.println("📥 Request Body received: " + wallet_transactionsEntity);

			System.out.println("⚙️ Calling service: addWalletTransactions");
			String result = walletTransactionsServiceIMP.addWalletTransactions(wallet_transactionsEntity, token);

			System.out.println("✅ Wallet transaction added successfully");
			System.out.println("🏁 === API EXECUTION COMPLETED ===");

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"WalletTransactions added successfully");

		} catch (SecurityException e) {
			System.out.println("❌ SecurityException occurred: " + e.getMessage());
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());

		} catch (RuntimeException e) {
			System.out.println("❌ RuntimeException occurred: " + e.getMessage());
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());

		} catch (Exception e) {
			System.out.println("❌ Exception occurred");
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Id *****
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Integer id) {
		try {
			WalletTransactionsEntity result = walletTransactionsServiceIMP.getOneWalletTransactions(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions retrieved successfully");
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
	public ResponseEntity<Object> updateWalletTransactions(@RequestHeader("access_token") String token,
			@RequestBody WalletTransactionsEntity wallet_transactionsEntity) {
		try {
			String result = walletTransactionsServiceIMP.updateWalletTransactions(wallet_transactionsEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions updated successfully");
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
			String result = walletTransactionsServiceIMP.deleteWalletTransactions(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions deleted successfully");
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
			Map<String, Object> result = walletTransactionsServiceIMP.getAllWalletTransactions(pageNumber, pageSize,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions retrieved successfully");
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
			@RequestBody List<WalletTransactionsEntity> list) {
		try {
			String result = walletTransactionsServiceIMP.addMultipleWalletTransactions(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED,
					"WalletTransactions added successfully");
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
	public ResponseEntity<Object> getWalletTransactionsByDateRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<WalletTransactionsEntity> result = walletTransactionsServiceIMP
					.getWalletTransactionsByDateBetween(fromDate, toDate, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date *****
	@GetMapping("/byDate")
	public ResponseEntity<Object> getWalletTransactionsByDate(@RequestHeader("access_token") String token,
			@RequestParam LocalDate date) {
		try {
			List<WalletTransactionsEntity> result = walletTransactionsServiceIMP.getWalletTransactionsByDate(date,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Date Range With Pagination *****
	@GetMapping("/DateRangeWithPagination")
	public ResponseEntity<Object> getWalletTransactionsByDateRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = walletTransactionsServiceIMP
					.getWalletTransactionsByDateBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"WalletTransactions fetched successfully");
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
			ByteArrayInputStream in = walletTransactionsServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=WalletTransactions.xlsx");
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