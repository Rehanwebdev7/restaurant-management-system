package com.rms.common.exception;

import org.springframework.http.HttpStatus;

public class Costum_Exception extends Exception {
    private HttpStatus status;

    public Costum_Exception(String message) {
        super(message);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public Costum_Exception(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public HttpStatus getHttpStatus() {
        return status;
    }
}
