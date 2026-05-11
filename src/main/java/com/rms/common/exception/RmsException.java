package com.rms.common.exception;

public class RmsException extends RuntimeException {
    private final int statusCode;

    public RmsException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
