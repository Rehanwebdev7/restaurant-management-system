package com.rms.common.exception;


import org.springframework.http.HttpStatus;

public class BadRequest_Exception extends Costum_Exception {
    public BadRequest_Exception(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
