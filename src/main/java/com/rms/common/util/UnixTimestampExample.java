package com.rms.common.util;
import java.time.Instant;

public class UnixTimestampExample {
	 // Method to get the current timestamp in seconds (Unix epoch time)
    public static long getCurrentTimestamp() {
        return Instant.now().getEpochSecond();
    }

    public static long addFiveMinutes(long currentTimestamp) {
        return currentTimestamp + (5 * 60 * 1000); // 5 minutes in milliseconds
    }

//    // Method to add 5 minutes (300 seconds) to a given timestamp
//    public static long addFiveMinutes(long currentTimestamp) {
//        return currentTimestamp +30000; // Add 300 seconds
//    }
//    
    // Method to get the login session expiry timestamp (1 hour from now)
    public static long getLoginSessionExpiryTimestamp() {
        return getCurrentTimestamp() + (24 * 60 * 60); // 1 hour = 3600 seconds
//    	 return getCurrentTimestamp() + (1 * 60);
    }
//    // Method to get the current timestamp in seconds (Unix epoch time)
//    public static long getCurrentTimestamp() {
//        return Instant.now().getEpochSecond();
//    }
//
//    // Method to add 5 minutes (300 seconds) to a given timestamp
//    public static long addFiveMinutes(long currentTimestamp) {
//        return currentTimestamp +300000000; // Add 300 seconds
//    }
}

