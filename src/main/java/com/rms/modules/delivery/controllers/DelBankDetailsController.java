package com.rms.modules.delivery.controllers;

import com.rms.common.entities.BankDetailsEntity;
import com.rms.common.serviceImplement.BankDetailsServiceIMP;
import com.rms.modules.delivery.services.DelBankDetailsService;
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
@RequestMapping("api/delivery/bank_details")
public class DelBankDetailsController {

	@Autowired
	@Qualifier("delBankDetailsService")
	private BankDetailsServiceIMP bankDetailsServiceIMP;
	
	@Autowired
	private DelBankDetailsService delBankDetailsService;

	@GetMapping("/bankDetail")
	public ResponseEntity<Object> getMyBankDetails(@RequestHeader("access_token") String token) {

		try {
			List<BankDetailsEntity> list = delBankDetailsService.getAllRecordBankDetailsId(token);

			return ApiResponse.responseBuilder(list, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}

}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<BankDetailsEntity> result = bankDetailsServiceIMP.getAllRecordBankDetails(token);
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
	public ResponseEntity<Object> addBankDetails(@RequestHeader("access_token") String token,
			@RequestBody BankDetailsEntity bank_detailsEntity) {
		try {
			String result = bankDetailsServiceIMP.addBankDetails(bank_detailsEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "BankDetails added successfully");
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
	@GetMapping("/{id}")
	public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Long id) {
		try {
			BankDetailsEntity result = bankDetailsServiceIMP.getOneBankDetails(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails retrieved successfully");
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
	public ResponseEntity<Object> updateBankDetails(@RequestHeader("access_token") String token,
			@RequestBody BankDetailsEntity bank_detailsEntity) {
		try {
			String result = bankDetailsServiceIMP.updateBankDetails(bank_detailsEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails updated successfully");
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
	public ResponseEntity<Object> delete(@RequestHeader("access_token") String token, @PathVariable Long id) {
		try {
			String result = bankDetailsServiceIMP.deleteBankDetails(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails deleted successfully");
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
			Map<String, Object> result = bankDetailsServiceIMP.getAllBankDetails(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails retrieved successfully");
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
			@RequestBody List<BankDetailsEntity> list) {
		try {
			String result = bankDetailsServiceIMP.addMultipleBankDetails(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "BankDetails added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range *****
	@GetMapping("/CreatedatRange")
	public ResponseEntity<Object> getBankDetailsByCreatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<BankDetailsEntity> result = bankDetailsServiceIMP.getBankDetailsByCreatedatBetween(fromDate, toDate,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat *****
	@GetMapping("/byCreatedat")
	public ResponseEntity<Object> getBankDetailsByCreatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate createdAt) {
		try {
			List<BankDetailsEntity> result = bankDetailsServiceIMP.getBankDetailsByCreatedat(createdAt, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Createdat Range With Pagination *****
	@GetMapping("/CreatedatRangeWithPagination")
	public ResponseEntity<Object> getBankDetailsByCreatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = bankDetailsServiceIMP.getBankDetailsByCreatedatBetweenPagination(fromDate,
					toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range *****
	@GetMapping("/UpdatedatRange")
	public ResponseEntity<Object> getBankDetailsByUpdatedatRange(@RequestHeader("access_token") String token,
			@RequestParam LocalDate fromDate, @RequestParam LocalDate toDate) {
		try {
			List<BankDetailsEntity> result = bankDetailsServiceIMP.getBankDetailsByUpdatedatBetween(fromDate, toDate,
					token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat *****
	@GetMapping("/byUpdatedat")
	public ResponseEntity<Object> getBankDetailsByUpdatedat(@RequestHeader("access_token") String token,
			@RequestParam LocalDate updatedAt) {
		try {
			List<BankDetailsEntity> result = bankDetailsServiceIMP.getBankDetailsByUpdatedat(updatedAt, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails fetched successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (Exception e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	// ***** Api- Get By Updatedat Range With Pagination *****
	@GetMapping("/UpdatedatRangeWithPagination")
	public ResponseEntity<Object> getBankDetailsByUpdatedatRangeWithPagination(
			@RequestHeader("access_token") String token, @RequestParam LocalDate fromDate,
			@RequestParam LocalDate toDate, @RequestParam Integer pageNumber, @RequestParam Integer pageSize) {
		try {
			Map<String, Object> result = bankDetailsServiceIMP.getBankDetailsByUpdatedatBetweenPagination(fromDate,
					toDate, pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "BankDetails fetched successfully");
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
			ByteArrayInputStream in = bankDetailsServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=BankDetails.xlsx");
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