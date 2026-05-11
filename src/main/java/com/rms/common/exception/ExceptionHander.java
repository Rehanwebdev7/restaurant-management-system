package com.rms.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
public class ExceptionHander {

	// Custom Exception Handler
	@ExceptionHandler(Costum_Exception.class)
	public ResponseEntity<Map<String, Object>> handleCustomException(Costum_Exception ex) {
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("Status", ex.getHttpStatus().getReasonPhrase());
		response.put("StatusCode", ex.getHttpStatus().value());
		response.put("message", ex.getMessage());
		response.put("data", null); // Data can be null for exceptions
		return new ResponseEntity<>(response, ex.getHttpStatus());
	}

	// RuntimeException Handler
	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("Status", "Runtime Exception");
		response.put("StatusCode", HttpStatus.BAD_REQUEST.value());
		response.put("message", "Runtime Error: " + ex.getMessage());
		response.put("data", null); // Data can be null for exceptions
		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
	}

	// General Exception Handler
	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("Status", "Internal Server Error");
		response.put("StatusCode", HttpStatus.INTERNAL_SERVER_ERROR.value());
		response.put("message", "Internal Server Error: " + ex.getMessage());
		response.put("data", null); // Data can be null for exceptions
		return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
//+++++++++++++++++++++++++++++++++++++++
