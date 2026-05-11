package com.rms.modules.admin.services;

import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.entities.RestaurantHoursEntity;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.serviceImplement.PaymentGatewayServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import org.springframework.data.domain.Sort;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.time.LocalTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

@Service
@Qualifier("admPaymentGatewayService")
public class AdmPaymentGatewayService implements PaymentGatewayServiceIMP {

    private final PaymentGatewayRepository paymentgatewayrepository;
    private final UsersRepository usersrepository;

    public AdmPaymentGatewayService(PaymentGatewayRepository paymentgatewayrepository, UsersRepository usersrepository) {
        this.paymentgatewayrepository = paymentgatewayrepository;
        this.usersrepository = usersrepository;
    }

    public <T, ID> T fetchReferenceById(T inputRef, JpaRepository<T, ID> repo, String notFoundMessage) {
        if (inputRef != null) {
            try {
                Field idField = inputRef.getClass().getDeclaredField("id");
                idField.setAccessible(true);
                Object idValue = idField.get(inputRef);
                if (idValue != null) {
                    return repo.findById((ID) idValue).orElseThrow(() -> new RuntimeException(notFoundMessage));
                } else {
                    throw new RuntimeException("Foreign key ID is null");
                }
            } catch (NoSuchFieldException | IllegalAccessException e) {
                throw new RuntimeException("Invalid reference structure: " + e.getMessage());
            }
        }
        return null;
    }

    public List<PaymentGatewayEntity> getByrestaurantId(Long branchId, String token) throws Exception {

		// 🔐 Authorization
		Authorization.authorizeAdmin(token);

		if (branchId == null) {
			throw new RuntimeException("BranchId is required");
		}

		List<PaymentGatewayEntity> zones = paymentgatewayrepository.findAllByRestaurantId_id(branchId);

		if (zones.isEmpty()) {
			throw new RuntimeException("Not found for branchId: " + branchId);
		}

		return zones;
	}
    @Override
    public List<PaymentGatewayEntity> getAllRecordPaymentGateway(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return paymentgatewayrepository.findAll();
    }
//    public List<PaymentGatewayEntity> getAllRecordPaymentGateway(String token) throws Exception {
//
//        Authorization.authorizeAdmin(token);
//
//        // 🔥 sirf restaurant-wise payment gateways
//        return paymentgatewayrepository.findByRestaurantIdIsNotNull();
//    }


    @Override
    public Map<String, Object> getAllPaymentGateway(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = paymentgatewayrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public PaymentGatewayEntity getOnePaymentGateway(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return paymentgatewayrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PaymentGateway not found"));
    }

    @Override
    public String addPaymentGateway(PaymentGatewayEntity payment_gatewayEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        PaymentGatewayEntity newEntity = new PaymentGatewayEntity();

        // Copy non-foreign fields using reflection
        for (Field field : PaymentGatewayEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(payment_gatewayEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (payment_gatewayEntity.getRestaurantId() != null && payment_gatewayEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(payment_gatewayEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        paymentgatewayrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updatePaymentGateway(PaymentGatewayEntity payment_gatewayEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        PaymentGatewayEntity existingEntity = paymentgatewayrepository.findById(payment_gatewayEntity.getId())
                .orElseThrow(() -> new RuntimeException("PaymentGateway not found"));

        // Update non-foreign fields using reflection
        for (Field field : PaymentGatewayEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(payment_gatewayEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (payment_gatewayEntity.getRestaurantId() != null && payment_gatewayEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(payment_gatewayEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        paymentgatewayrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deletePaymentGateway(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!paymentgatewayrepository.existsById(id)) {
            throw new RuntimeException("PaymentGateway not found");
        }
        paymentgatewayrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultiplePaymentGateway(List<PaymentGatewayEntity> payment_gatewayEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<PaymentGatewayEntity> entitiesToSave = new ArrayList<>();

        for (PaymentGatewayEntity entity : payment_gatewayEntitys) {
            PaymentGatewayEntity newEntity = new PaymentGatewayEntity();

            // Copy non-foreign fields using reflection
            for (Field field : PaymentGatewayEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle restaurant_id foreign key
            if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
                newEntity.setRestaurantId(
                    fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        paymentgatewayrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<PaymentGatewayEntity> page = paymentgatewayrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("PaymentGateways");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Credentials");
            header.createCell(2).setCellValue("On_of");
            header.createCell(3).setCellValue("Status");
            header.createCell(4).setCellValue("Vendorname");
            header.createCell(5).setCellValue("Restaurant_id");

            int rowNum = 1;
            for (PaymentGatewayEntity payment_gatewayEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(payment_gatewayEntity.getId() != null ? payment_gatewayEntity.getId() : 0);
                row.createCell(1).setCellValue(payment_gatewayEntity.getCredentials() != null ? payment_gatewayEntity.getCredentials().toString() : "N/A");
                row.createCell(2).setCellValue(payment_gatewayEntity.getOnOf() != null ? payment_gatewayEntity.getOnOf() : "N/A");
                row.createCell(3).setCellValue(payment_gatewayEntity.getStatus() != null && payment_gatewayEntity.getStatus() ? "Active" : "Inactive");
                row.createCell(4).setCellValue(payment_gatewayEntity.getVendorname() != null ? payment_gatewayEntity.getVendorname() : "N/A");
                row.createCell(5).setCellValue(payment_gatewayEntity.getRestaurantId() != null ? payment_gatewayEntity.getRestaurantId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
