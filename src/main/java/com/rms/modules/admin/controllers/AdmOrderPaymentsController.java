package com.rms.modules.admin.controllers;

import com.rms.common.entities.OrderPaymentsEntity;
import com.rms.common.serviceImplement.OrderPaymentsServiceIMP;
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
@RequestMapping("api/admin/order_payments")
public class AdmOrderPaymentsController {

    @Autowired
    @Qualifier("admOrderPaymentsService")
    private OrderPaymentsServiceIMP orderPaymentsServiceIMP;

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getAllRecordOrderPayments(token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Record Fetched Successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Single Record ***** 
    @PostMapping("/add")
    public ResponseEntity<Object> addOrderPayments(@RequestHeader("access_token") String token,@RequestBody OrderPaymentsEntity order_paymentsEntity) {
        try {
            String result = orderPaymentsServiceIMP.addOrderPayments(order_paymentsEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "OrderPayments added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Id ***** 
    @GetMapping("/{id}")
    public ResponseEntity<Object> getById( @RequestHeader("access_token") String token,@PathVariable Long id) {
        try {
            OrderPaymentsEntity result = orderPaymentsServiceIMP.getOneOrderPayments(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments retrieved successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Update Record  ***** 
    @PutMapping("/update")
    public ResponseEntity<Object> updateOrderPayments( @RequestHeader("access_token") String token,@RequestBody OrderPaymentsEntity order_paymentsEntity) {
        try {
            String result = orderPaymentsServiceIMP.updateOrderPayments(order_paymentsEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments updated successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Delete Record ***** 
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@RequestHeader("access_token") String token,@PathVariable Long id) {
        try {
            String result = orderPaymentsServiceIMP.deleteOrderPayments(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments deleted successfully");
         }catch (SecurityException e) {
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
            Map<String, Object> result = orderPaymentsServiceIMP.getAllOrderPayments(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments retrieved successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Add Multiple Record ***** 
    @PostMapping("/addMultiple")
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<OrderPaymentsEntity> list) {
        try {
            String result = orderPaymentsServiceIMP.addMultipleOrderPayments(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "OrderPayments added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Paymenttime Range ***** 
    @GetMapping("/PaymenttimeRange")
    public ResponseEntity<Object> getOrderPaymentsByPaymenttimeRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByPaymenttimeBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Paymenttime ***** 
    @GetMapping("/byPaymenttime")
    public ResponseEntity<Object> getOrderPaymentsByPaymenttime(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate paymentTime) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByPaymenttime(paymentTime, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Paymenttime Range With Pagination ***** 
    @GetMapping("/PaymenttimeRangeWithPagination")
    public ResponseEntity<Object> getOrderPaymentsByPaymenttimeRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = orderPaymentsServiceIMP.getOrderPaymentsByPaymenttimeBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Refundtime Range ***** 
    @GetMapping("/RefundtimeRange")
    public ResponseEntity<Object> getOrderPaymentsByRefundtimeRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByRefundtimeBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Refundtime ***** 
    @GetMapping("/byRefundtime")
    public ResponseEntity<Object> getOrderPaymentsByRefundtime(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate refundTime) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByRefundtime(refundTime, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Refundtime Range With Pagination ***** 
    @GetMapping("/RefundtimeRangeWithPagination")
    public ResponseEntity<Object> getOrderPaymentsByRefundtimeRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = orderPaymentsServiceIMP.getOrderPaymentsByRefundtimeBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Reconciledat Range ***** 
    @GetMapping("/ReconciledatRange")
    public ResponseEntity<Object> getOrderPaymentsByReconciledatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByReconciledatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Reconciledat ***** 
    @GetMapping("/byReconciledat")
    public ResponseEntity<Object> getOrderPaymentsByReconciledat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate reconciledAt) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByReconciledat(reconciledAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Reconciledat Range With Pagination ***** 
    @GetMapping("/ReconciledatRangeWithPagination")
    public ResponseEntity<Object> getOrderPaymentsByReconciledatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = orderPaymentsServiceIMP.getOrderPaymentsByReconciledatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range ***** 
    @GetMapping("/CreatedatRange")
    public ResponseEntity<Object> getOrderPaymentsByCreatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByCreatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat ***** 
    @GetMapping("/byCreatedat")
    public ResponseEntity<Object> getOrderPaymentsByCreatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate createdAt) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByCreatedat(createdAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Createdat Range With Pagination ***** 
    @GetMapping("/CreatedatRangeWithPagination")
    public ResponseEntity<Object> getOrderPaymentsByCreatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = orderPaymentsServiceIMP.getOrderPaymentsByCreatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range ***** 
    @GetMapping("/UpdatedatRange")
    public ResponseEntity<Object> getOrderPaymentsByUpdatedatRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByUpdatedatBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat ***** 
    @GetMapping("/byUpdatedat")
    public ResponseEntity<Object> getOrderPaymentsByUpdatedat(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate updatedAt) {
        try {
            List<OrderPaymentsEntity> result = orderPaymentsServiceIMP.getOrderPaymentsByUpdatedat(updatedAt, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Updatedat Range With Pagination ***** 
    @GetMapping("/UpdatedatRangeWithPagination")
    public ResponseEntity<Object> getOrderPaymentsByUpdatedatRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = orderPaymentsServiceIMP.getOrderPaymentsByUpdatedatBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "OrderPayments fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
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
            ByteArrayInputStream in = orderPaymentsServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=OrderPayments.xlsx");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
         }catch (SecurityException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}