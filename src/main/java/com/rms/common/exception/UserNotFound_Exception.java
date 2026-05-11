package com.rms.common.exception;
import org.springframework.http.HttpStatus;

public class UserNotFound_Exception extends Costum_Exception {
	public UserNotFound_Exception(String message) {
		super(message, HttpStatus.NOT_FOUND);
	}
}