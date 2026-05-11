package com.rms.modules.restaurant.services;

import com.rms.common.entities.PaymentGatewayEntity;
import com.rms.common.repositories.PaymentGatewayRepository;
import com.rms.common.serviceImplement.PaymentGatewayServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.TokenUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import java.lang.reflect.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

@Service
@Qualifier("restPaymentGatewayService")
public class RestPaymentGatewayService implements PaymentGatewayServiceIMP {

    private final PaymentGatewayRepository paymentgatewayrepository;
    private final UsersRepository usersrepository;

    @Autowired
    private TokenUtil tokenUtil;

    public RestPaymentGatewayService(PaymentGatewayRepository paymentgatewayrepository, UsersRepository usersrepository) {
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

    // Get restaurant ID from token
    private Long getRestaurantIdFromToken(String token) throws Exception {
        tokenUtil.decryptAndStoreToken(token);
        return tokenUtil.getCurrentUserId().longValue();
    }

    // Get payment gateways for current restaurant only
    public List<PaymentGatewayEntity> getByRestaurantId(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);
        return paymentgatewayrepository.findAllByRestaurantId_id(restaurantId);
    }

    @Override
    public List<PaymentGatewayEntity> getAllRecordPaymentGateway(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);
        return paymentgatewayrepository.findAllByRestaurantId_id(restaurantId);
    }

    @Override
    public Map<String, Object> getAllPaymentGateway(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        // Get all for this restaurant then paginate manually
        List<PaymentGatewayEntity> allRecords = paymentgatewayrepository.findAllByRestaurantId_id(restaurantId);

        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, allRecords.size());
        List<PaymentGatewayEntity> pageContent = start < allRecords.size() ? allRecords.subList(start, end) : new ArrayList<>();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", allRecords.size());
        response.put("pageSize", pageSize);
        response.put("currentPage", pageNumber + 1);
        response.put("totalPages", (int) Math.ceil((double) allRecords.size() / pageSize));
        response.put("records", pageContent);
        return response;
    }

    @Override
    public PaymentGatewayEntity getOnePaymentGateway(Integer id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);
        PaymentGatewayEntity entity = paymentgatewayrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PaymentGateway not found"));

        // Verify ownership
        if (entity.getRestaurantId() == null || !entity.getRestaurantId().getId().equals(restaurantId)) {
            throw new RuntimeException("PaymentGateway not found");
        }
        return entity;
    }

    @Override
    public String addPaymentGateway(PaymentGatewayEntity payment_gatewayEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        PaymentGatewayEntity newEntity = new PaymentGatewayEntity();

        // Copy non-foreign fields using reflection
        for (Field field : PaymentGatewayEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(payment_gatewayEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Set restaurant_id from token (restaurant can only create for itself)
        newEntity.setRestaurantId(usersrepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found")));

        paymentgatewayrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updatePaymentGateway(PaymentGatewayEntity payment_gatewayEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        PaymentGatewayEntity existingEntity = paymentgatewayrepository.findById(payment_gatewayEntity.getId())
                .orElseThrow(() -> new RuntimeException("PaymentGateway not found"));

        // Verify ownership
        if (existingEntity.getRestaurantId() == null || !existingEntity.getRestaurantId().getId().equals(restaurantId)) {
            throw new RuntimeException("PaymentGateway not found");
        }

        // Update non-foreign fields using reflection
        for (Field field : PaymentGatewayEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(payment_gatewayEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        paymentgatewayrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deletePaymentGateway(Integer id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);

        PaymentGatewayEntity entity = paymentgatewayrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PaymentGateway not found"));

        // Verify ownership
        if (entity.getRestaurantId() == null || !entity.getRestaurantId().getId().equals(restaurantId)) {
            throw new RuntimeException("PaymentGateway not found");
        }

        paymentgatewayrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultiplePaymentGateway(List<PaymentGatewayEntity> payment_gatewayEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Long restaurantId = getRestaurantIdFromToken(token);
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

            // Set restaurant_id from token
            newEntity.setRestaurantId(usersrepository.findById(restaurantId)
                    .orElseThrow(() -> new RuntimeException("Restaurant not found")));

            entitiesToSave.add(newEntity);
        }

        paymentgatewayrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeRestaurant(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }

        Long restaurantId;
        try {
            restaurantId = getRestaurantIdFromToken(token);
        } catch (Exception e) {
            throw new IOException(e.getMessage());
        }

        List<PaymentGatewayEntity> records = paymentgatewayrepository.findAllByRestaurantId_id(restaurantId);

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("PaymentGateways");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Vendorname");
            header.createCell(2).setCellValue("Title");
            header.createCell(3).setCellValue("Payment_method");
            header.createCell(4).setCellValue("Status");
            header.createCell(5).setCellValue("On_of");

            int rowNum = 1;
            for (PaymentGatewayEntity payment_gatewayEntity : records) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(payment_gatewayEntity.getId() != null ? payment_gatewayEntity.getId() : 0);
                row.createCell(1).setCellValue(payment_gatewayEntity.getVendorname() != null ? payment_gatewayEntity.getVendorname() : "N/A");
                row.createCell(2).setCellValue(payment_gatewayEntity.getTitle() != null ? payment_gatewayEntity.getTitle() : "N/A");
                row.createCell(3).setCellValue(payment_gatewayEntity.getPaymentMethod() != null ? payment_gatewayEntity.getPaymentMethod() : "N/A");
                row.createCell(4).setCellValue(payment_gatewayEntity.getStatus() != null && payment_gatewayEntity.getStatus() ? "Active" : "Inactive");
                row.createCell(5).setCellValue(payment_gatewayEntity.getOnOf() != null ? payment_gatewayEntity.getOnOf() : "N/A");
            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
