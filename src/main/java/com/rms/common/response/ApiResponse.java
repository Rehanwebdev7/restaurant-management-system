//package //Write Package Name Here com.Crud.Response;
 package com.rms.common.response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.LinkedHashMap;
import java.util.Map;

public class ApiResponse<T> {

    public static <T> ResponseEntity<Object> responseBuilder(T responseObject, String status, HttpStatus httpStatus, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("Status", status);
        response.put("StatusCode", httpStatus.value());
        response.put("message", message);
        response.put("data", responseObject);

        return new ResponseEntity<>(response, httpStatus);
    }
}

//package com.branchx.fintech.common.response;
//
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import java.util.LinkedHashMap;
//import java.util.Map;
//
//public class ApiResponse<T> {
//
//    /**
//     * Builds a ResponseEntity object with the given parameters.
//     *
//     * @param responseObject The data to be included in the response.
//     * @param status The status of the response (e.g., SUCCESS).
//     * @param httpStatus The HTTP status code (e.g., HttpStatus.CREATED).
//     * @param message The message to be included in the response.
//     * @return A ResponseEntity containing the built response.
//     */
//    public static <T> ResponseEntity<Object> responseBuilder(T responseObject, String status, HttpStatus httpStatus, String message) {
//        Map<String, Object> response = new LinkedHashMap<>();
//        response.put("Status", status); // Set the response status (e.g., SUCCESS)
//        response.put("StatusCode", httpStatus.value()); // Set the HTTP status code (e.g., 201)
//        response.put("message", message); // Set the response message
//        response.put("data", responseObject); // Set the response data object
//
//        // Return the ResponseEntity with the constructed response and HTTP status
//        return new ResponseEntity<>(response, httpStatus);
//    }
//}
