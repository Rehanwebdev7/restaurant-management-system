package com.rms.modules.customer.controllers;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.TableBookingEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.TableBookingRepository;
import com.rms.common.serviceImplement.TableBookingServiceIMP;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustTableBookingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("api/customer/table_booking")
public class CustTableBookingController {

    @Autowired
    @Qualifier("custTableBookingService")
    private TableBookingServiceIMP tableBookingServiceIMP;

    @Autowired
    private CustTableBookingService custTableBookingService;

    @Autowired
    private TableBookingRepository tableBookingRepository;

    @Autowired
    private CustomersRepository customersRepository;

    //***** Api- Pre-flight Availability Check *****
    @GetMapping("/availability")
    public ResponseEntity<Object> checkAvailability(@RequestHeader("access_token") String token,
            @RequestParam Long tableId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime bookingTime) {
        try {
            Map<String, Object> result = custTableBookingService.checkAvailability(tableId, bookingDate, bookingTime, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Availability checked");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Per-Branch Reservation Config *****
    @GetMapping("/reservation-config/{branchId}")
    public ResponseEntity<Object> getReservationConfig(@RequestHeader("access_token") String token,
            @PathVariable Long branchId) {
        try {
            Map<String, Object> result = custTableBookingService.getReservationConfigForBranch(branchId, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "Reservation config fetched");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get All Without Pagination ***** 
    @GetMapping("/all")
    public ResponseEntity<Object> getAllRecord( @RequestHeader("access_token") String token) {
        try {
            List<TableBookingEntity> result = tableBookingServiceIMP.getAllRecordTableBooking(token);
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
    public ResponseEntity<Object> addTableBooking(@RequestHeader("access_token") String token,@RequestBody TableBookingEntity table_bookingEntity) {
        try {
            String result = tableBookingServiceIMP.addTableBooking(table_bookingEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "TableBooking added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    /**
     * Public reservation endpoint — no auth required so the Contact page can
     * accept walk-up bookings from un-signed-in visitors. Body shape mirrors
     * the legacy ContactPage submission:
     *   { name, email, phone, date, time, guests, notes }
     *
     * The legacy backend persists a stub TableBookingEntity with status
     * REQUESTED and the restaurant gets notified via the same channel as
     * authenticated bookings. We accept the request without strict
     * validation here so a flaky network never blocks the customer — the
     * restaurant team triages REQUESTED bookings before confirming a table.
     */
    @PostMapping("/public/add")
    public ResponseEntity<Object> addPublicReservation(@RequestBody Map<String, Object> payload) {
        try {
            String name = payload.get("name") != null ? String.valueOf(payload.get("name")).trim() : "";
            String phone = payload.get("phone") != null ? String.valueOf(payload.get("phone")).trim() : "";
            if (name.isEmpty() || phone.isEmpty()) {
                return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST,
                        "name and phone are required");
            }
            String dateStr = payload.get("date") != null ? String.valueOf(payload.get("date")) : null;
            String timeStr = payload.get("time") != null ? String.valueOf(payload.get("time")) : null;
            String notes = payload.get("notes") != null ? String.valueOf(payload.get("notes")) : "";
            String email = payload.get("email") != null ? String.valueOf(payload.get("email")) : "";
            Integer guests = payload.get("guests") != null ? Integer.parseInt(String.valueOf(payload.get("guests"))) : 2;

            // Upsert a CustomersEntity by mobile — same shape used by
            // LoginController.buildCustomerSessionData so the same guest
            // identity is reused for OTP login + reservation history.
            CustomersEntity customer = customersRepository.findByMobileNumber(phone).orElseGet(() -> {
                CustomersEntity c = new CustomersEntity();
                c.setMobileNumber(phone);
                c.setName(name);
                if (!email.isEmpty()) c.setEmail(email);
                c.setIsActive(true);
                c.setIsDeleted(0);
                return customersRepository.save(c);
            });
            if ((customer.getName() == null || customer.getName().isBlank()) && !name.isEmpty()) {
                customer.setName(name);
                customersRepository.save(customer);
            }

            TableBookingEntity tb = new TableBookingEntity();
            tb.setStatus("REQUESTED");
            tb.setCustomerId(customer);
            if (dateStr != null && !dateStr.isBlank()) {
                tb.setBookingDate(LocalDate.parse(dateStr));
            }
            if (timeStr != null && !timeStr.isBlank()) {
                tb.setBookingTime(LocalTime.parse(timeStr.length() == 5 ? timeStr + ":00" : timeStr));
            }
            tableBookingRepository.save(tb);

            Map<String, Object> data = new java.util.HashMap<>();
            data.put("reservationId", tb.getId());
            data.put("customerId", customer.getId());
            data.put("guests", guests);
            data.put("notes", notes);
            data.put("status", "REQUESTED");
            return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.CREATED,
                    "Reservation requested — we'll call you to confirm.");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to create reservation: " + e.getMessage());
        }
    }

    //***** Api- Get By Id ***** 
    @GetMapping("/{id}")
    public ResponseEntity<Object> getById( @RequestHeader("access_token") String token,@PathVariable Long id) {
        try {
            TableBookingEntity result = tableBookingServiceIMP.getOneTableBooking(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking retrieved successfully");
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
    public ResponseEntity<Object> updateTableBooking( @RequestHeader("access_token") String token,@RequestBody TableBookingEntity table_bookingEntity) {
        try {
            String result = tableBookingServiceIMP.updateTableBooking(table_bookingEntity,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking updated successfully");
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
            String result = tableBookingServiceIMP.deleteTableBooking(id,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking deleted successfully");
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
            Map<String, Object> result = tableBookingServiceIMP.getAllTableBooking(pageNumber, pageSize,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking retrieved successfully");
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
    public ResponseEntity<Object> addMultiple(@RequestHeader("access_token") String token,@RequestBody List<TableBookingEntity> list) {
        try {
            String result = tableBookingServiceIMP.addMultipleTableBooking(list,token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.CREATED, "TableBooking added successfully");
         }catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Bookingdate Range ***** 
    @GetMapping("/BookingdateRange")
    public ResponseEntity<Object> getTableBookingByBookingdateRange(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        try {
            List<TableBookingEntity> result = tableBookingServiceIMP.getTableBookingByBookingdateBetween(fromDate, toDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Bookingdate ***** 
    @GetMapping("/byBookingdate")
    public ResponseEntity<Object> getTableBookingByBookingdate(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate bookingDate) {
        try {
            List<TableBookingEntity> result = tableBookingServiceIMP.getTableBookingByBookingdate(bookingDate, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    //***** Api- Get By Bookingdate Range With Pagination ***** 
    @GetMapping("/BookingdateRangeWithPagination")
    public ResponseEntity<Object> getTableBookingByBookingdateRangeWithPagination(
            @RequestHeader("access_token") String token,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {
        try {
            Map<String, Object> result = tableBookingServiceIMP.getTableBookingByBookingdateBetweenPagination(fromDate, toDate, pageNumber, pageSize, token);
            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK, "TableBooking fetched successfully");
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
            ByteArrayInputStream in = tableBookingServiceIMP.streamExcel(pageNumber, pageSize,token);
            byte[] bytes = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=TableBooking.xlsx");
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