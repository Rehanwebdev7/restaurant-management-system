package com.rms.modules.superadmin.controllers;

import com.rms.common.entities.SlidersEntity;
import com.rms.common.serviceImplement.SlidersServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.modules.admin.services.AdmSlidersService;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/superadmin/sliders")
public class SuperadminSlidersController {

	@Autowired
	@Qualifier("admSlidersService")
	private SlidersServiceIMP slidersServiceIMP;

	@Autowired
	private AdmSlidersService admSlidersService;

//	@PostMapping(value = "/add_slider", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//	public ResponseEntity<Object> addSlider(@RequestHeader("access_token") String token,
//			@RequestPart(value = "image", required = false) MultipartFile image,
//			@RequestPart("payload") String payloadJson, @RequestParam("restaurantId") Long restaurantId) {
//
//		try {
//
//			String result = admSlidersService.addSliderWithImage(image, payloadJson, restaurantId, token);
//
//			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Slider added successfully");
//
//		} catch (SecurityException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
//
//		} catch (IllegalArgumentException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
//
//		} catch (RuntimeException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
//
//		} catch (Exception e) {
//			e.printStackTrace();
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
//					"Internal server error occurred");
//		}
//	}
	@PostMapping("/add_slider")
	public ResponseEntity<Object> addSlider(@RequestHeader("access_token") String token,
			@RequestPart(value = "image", required = false) MultipartFile image, @RequestParam String title,
			@RequestParam(required = false) String platform, @RequestParam(required = false) String description,
			@RequestParam Long restaurantId) {
		try {

			String result = admSlidersService.addSliderWithImage(image, title, platform, description, restaurantId,
					token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Slider added successfully");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (IllegalArgumentException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

	@PutMapping("/update_slider")
	public ResponseEntity<Object> updateSlider(@RequestHeader("access_token") String token,
			@RequestPart(value = "image", required = false) MultipartFile image, @RequestParam Long sliderId,
			@RequestParam Long restaurantId, @RequestParam(required = false) String title,
			@RequestParam(required = false) String platform, @RequestParam(required = false) String description) {
		try {

			String result = admSlidersService.updateSlider(image, sliderId, restaurantId, title, platform, description,
					token);

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Slider updated successfully");

		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (IllegalArgumentException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Internal server error");
		}
	}

//	@PutMapping("/update_slider")
//	public ResponseEntity<Object> updateSlider(@RequestHeader("access_token") String token,
//			@RequestParam("sliderId") Long sliderId, @RequestParam("restaurantId") Long restaurantId,
//			@RequestPart(value = "image", required = false) MultipartFile image,
//			@RequestPart(value = "payload", required = false) String payloadJson) {
//
//		try {
//
//			String result = admSlidersService.updateSlider(image, payloadJson, restaurantId, sliderId, token);
//
//			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Slider updated successfully");
//
//		} catch (SecurityException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
//
//		} catch (IllegalArgumentException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
//
//		} catch (RuntimeException e) {
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
//
//		} catch (Exception e) {
//			e.printStackTrace();
//
//			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
//					"Internal server error occurred");
//		}
//	}

	// ***** Api- Get All Without Pagination *****
	@GetMapping("/all")
	public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
		try {
			List<SlidersEntity> result = slidersServiceIMP.getAllRecordSliders(token);
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
	public ResponseEntity<Object> addSliders(@RequestHeader("access_token") String token,
			@RequestBody SlidersEntity slidersEntity) {
		try {
			String result = slidersServiceIMP.addSliders(slidersEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Sliders added successfully");
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
			SlidersEntity result = slidersServiceIMP.getOneSliders(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Sliders retrieved successfully");
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
	public ResponseEntity<Object> updateSliders(@RequestHeader("access_token") String token,
			@RequestBody SlidersEntity slidersEntity) {
		try {
			String result = slidersServiceIMP.updateSliders(slidersEntity, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Sliders updated successfully");
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
			String result = slidersServiceIMP.deleteSliders(id, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Sliders deleted successfully");
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
			Map<String, Object> result = slidersServiceIMP.getAllSliders(pageNumber, pageSize, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Sliders retrieved successfully");
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
			@RequestBody List<SlidersEntity> list) {
		try {
			String result = slidersServiceIMP.addMultipleSliders(list, token);
			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "Sliders added successfully");
		} catch (SecurityException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
		} catch (RuntimeException e) {
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
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
			ByteArrayInputStream in = slidersServiceIMP.streamExcel(pageNumber, pageSize, token);
			byte[] bytes = in.readAllBytes();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Sliders.xlsx");
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