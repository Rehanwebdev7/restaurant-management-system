package com.rms.modules.restaurant.controllers;

import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.serviceImplement.PaymentGatewayServiceIMP;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/restaurant/payment_gateway")
public class RestPaymentGatewayController {

    @Autowired
    @Qualifier("restPaymentGatewayService")
    private PaymentGatewayServiceIMP paymentGatewayServiceIMP;

    //***** Api- Get All Without Pagination *****
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord(@RequestHeader("access_token") String token) {
        try {
            List<PaymentGatewayEntity> result = paymentGatewayServiceIMP.getAllRecordPaymentGateway(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Single Record *****
    @PostMapping("/add")
    public ResponseEntity<Object> addPaymentGateway(@RequestHeader("access_token") String token, @RequestBody PaymentGatewayEntity payment_gatewayEntity) {
        try {
            String result = paymentGatewayServiceIMP.addPaymentGateway(payment_gatewayEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "PaymentGateway added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Id *****
    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@RequestHeader("access_token") String token, @PathVariable Integer id) {
        try {
            PaymentGatewayEntity result = paymentGatewayServiceIMP.getOnePaymentGateway(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "PaymentGateway retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Update Record  *****
    @PutMapping("/update")
    public ResponseEntity<Object> updatePaymentGateway(@RequestHeader("access_token") String token, @RequestBody PaymentGatewayEntity payment_gatewayEntity) {
        try {
            String result = paymentGatewayServiceIMP.updatePaymentGateway(payment_gatewayEntity, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "PaymentGateway updated successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Delete Record *****
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@RequestHeader("access_token") String token, @PathVariable Integer id) {
        try {
            String result = paymentGatewayServiceIMP.deletePaymentGateway(id, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "PaymentGateway deleted successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get All With Pagination *****
    @GetMapping("/getAll")
    public ResponseEntity<Object> getAll(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(defaultValue = "10", required = false) Integer pageSize) {
        try {
            Map<String, Object> result = paymentGatewayServiceIMP.getAllPaymentGateway(pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "PaymentGateway retrieved successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Multiple Record *****
    @PostMapping("/addMultiple")
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token, @RequestBody List<PaymentGatewayEntity> list) {
        try {
            String result = paymentGatewayServiceIMP.addMultiplePaymentGateway(list, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "PaymentGateway added successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- XL File Download *****
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadUsersExcel(
            @RequestHeader("access_token") String token,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "100") int pageSize) {
        try {
            ByteArrayInputStream in = paymentGatewayServiceIMP.streamExcel(pageNumber, pageSize, token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=PaymentGateway.xlsx");
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
