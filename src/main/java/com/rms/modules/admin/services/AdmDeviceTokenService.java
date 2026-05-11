package com.rms.modules.admin.services;

import com.rms.common.entities.DeviceTokenEntity;
import com.rms.common.repositories.DeviceTokenRepository;
import com.rms.common.serviceImplement.DeviceTokenServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.CustomersRepository;
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
@Qualifier("admDeviceTokenService")
public class AdmDeviceTokenService implements DeviceTokenServiceIMP {

    private final DeviceTokenRepository devicetokenrepository;
    private final CustomersRepository customersrepository;
    private final UsersRepository usersrepository;

    public AdmDeviceTokenService(DeviceTokenRepository devicetokenrepository, CustomersRepository customersrepository, UsersRepository usersrepository) {
        this.devicetokenrepository = devicetokenrepository;
        this.customersrepository = customersrepository;
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

    @Override
    public List<DeviceTokenEntity> getAllRecordDeviceToken(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return devicetokenrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllDeviceToken(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = devicetokenrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public DeviceTokenEntity getOneDeviceToken(Long id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return devicetokenrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("DeviceToken not found"));
    }

    @Override
    public String addDeviceToken(DeviceTokenEntity device_tokenEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        DeviceTokenEntity newEntity = new DeviceTokenEntity();

        // Copy non-foreign fields using reflection
        for (Field field : DeviceTokenEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(device_tokenEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle customers_id foreign key
        if (device_tokenEntity.getCustomersId() != null && device_tokenEntity.getCustomersId().getId() != null) {
            newEntity.setCustomersId(
                fetchReferenceById(device_tokenEntity.getCustomersId(), customersrepository, "Customers not found")
            );
        }

        // Handle users_id foreign key
        if (device_tokenEntity.getUserstId() != null && device_tokenEntity.getUserstId().getId() != null) {
            newEntity.setUserstId(
                fetchReferenceById(device_tokenEntity.getUserstId(), usersrepository, "Users not found")
            );
        }

        devicetokenrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateDeviceToken(DeviceTokenEntity device_tokenEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        DeviceTokenEntity existingEntity = devicetokenrepository.findById(device_tokenEntity.getId())
                .orElseThrow(() -> new RuntimeException("DeviceToken not found"));

        // Update non-foreign fields using reflection
        for (Field field : DeviceTokenEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(device_tokenEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle customers_id foreign key
        if (device_tokenEntity.getCustomersId() != null && device_tokenEntity.getCustomersId().getId() != null) {
            existingEntity.setCustomersId(
                fetchReferenceById(device_tokenEntity.getCustomersId(), customersrepository, "Customers not found")
            );
        }

        // Handle users_id foreign key
        if (device_tokenEntity.getUserstId() != null && device_tokenEntity.getUserstId().getId() != null) {
            existingEntity.setUserstId(
                fetchReferenceById(device_tokenEntity.getUserstId(), usersrepository, "Users not found")
            );
        }

        devicetokenrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteDeviceToken(Long id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!devicetokenrepository.existsById(id)) {
            throw new RuntimeException("DeviceToken not found");
        }
        devicetokenrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleDeviceToken(List<DeviceTokenEntity> device_tokenEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<DeviceTokenEntity> entitiesToSave = new ArrayList<>();

        for (DeviceTokenEntity entity : device_tokenEntitys) {
            DeviceTokenEntity newEntity = new DeviceTokenEntity();

            // Copy non-foreign fields using reflection
            for (Field field : DeviceTokenEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle customers_id foreign key
            if (entity.getCustomersId() != null && entity.getCustomersId().getId() != null) {
                newEntity.setCustomersId(
                    fetchReferenceById(entity.getCustomersId(), customersrepository, "Customers not found")
                );
            }

            // Handle users_id foreign key
            if (entity.getUserstId() != null && entity.getUserstId().getId() != null) {
                newEntity.setUserstId(
                    fetchReferenceById(entity.getUserstId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        devicetokenrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<DeviceTokenEntity> page = devicetokenrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("DeviceTokens");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Platform");
            header.createCell(2).setCellValue("Token");
            header.createCell(3).setCellValue("Customers_id");
            header.createCell(4).setCellValue("Users_id");

            int rowNum = 1;
            for (DeviceTokenEntity device_tokenEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(device_tokenEntity.getId() != null ? device_tokenEntity.getId() : 0);
                row.createCell(1).setCellValue(device_tokenEntity.getPlatform() != null ? device_tokenEntity.getPlatform() : "N/A");
                row.createCell(2).setCellValue(device_tokenEntity.getToken() != null ? device_tokenEntity.getToken() : "N/A");
                row.createCell(3).setCellValue(device_tokenEntity.getCustomersId() != null ? device_tokenEntity.getCustomersId().toString() : "N/A");
                row.createCell(4).setCellValue(device_tokenEntity.getUserstId() != null ? device_tokenEntity.getUserstId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
