package com.rms.modules.kitchen.services;

import com.rms.common.entities.PasswordResetsEntity;
import com.rms.common.repositories.PasswordResetsRepository;
import com.rms.common.serviceImplement.PasswordResetsServiceIMP;
import com.rms.configuration.Authorization;

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
@Qualifier("kitPasswordResetsService")
public class KitPasswordResetsService implements PasswordResetsServiceIMP {

    private final PasswordResetsRepository passwordresetsrepository;

    public KitPasswordResetsService(PasswordResetsRepository passwordresetsrepository) {
        this.passwordresetsrepository = passwordresetsrepository;
    }

    @Override
    public List<PasswordResetsEntity> getAllRecordPasswordResets(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return passwordresetsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllPasswordResets(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = passwordresetsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public PasswordResetsEntity getOnePasswordResets(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return passwordresetsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PasswordResets not found"));
    }

    @Override
    public String addPasswordResets(PasswordResetsEntity password_resetsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        PasswordResetsEntity newEntity = new PasswordResetsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : PasswordResetsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(password_resetsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        passwordresetsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updatePasswordResets(PasswordResetsEntity password_resetsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        PasswordResetsEntity existingEntity = passwordresetsrepository.findById(password_resetsEntity.getId())
                .orElseThrow(() -> new RuntimeException("PasswordResets not found"));

        // Update non-foreign fields using reflection
        for (Field field : PasswordResetsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(password_resetsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        passwordresetsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deletePasswordResets(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!passwordresetsrepository.existsById(id)) {
            throw new RuntimeException("PasswordResets not found");
        }
        passwordresetsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultiplePasswordResets(List<PasswordResetsEntity> password_resetsEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<PasswordResetsEntity> entitiesToSave = new ArrayList<>();

        for (PasswordResetsEntity entity : password_resetsEntitys) {
            PasswordResetsEntity newEntity = new PasswordResetsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : PasswordResetsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        passwordresetsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<PasswordResetsEntity> getPasswordResetsByExpiresatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return passwordresetsrepository.findByExpiresAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getPasswordResetsByExpiresatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = passwordresetsrepository.findByExpiresAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<PasswordResetsEntity> getPasswordResetsByExpiresat(LocalDate expiresat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = expiresat.atStartOfDay();
        return passwordresetsrepository.findByExpiresAt(dateTime);
    }

    @Override
    public List<PasswordResetsEntity> getPasswordResetsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return passwordresetsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getPasswordResetsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = passwordresetsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<PasswordResetsEntity> getPasswordResetsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return passwordresetsrepository.findByCreatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<PasswordResetsEntity> page = passwordresetsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("PasswordResetss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Email");
            header.createCell(2).setCellValue("Mobile");
            header.createCell(3).setCellValue("Token");
            header.createCell(4).setCellValue("Expires_at");
            header.createCell(5).setCellValue("Created_at");

            int rowNum = 1;
            for (PasswordResetsEntity password_resetsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(password_resetsEntity.getId() != null ? password_resetsEntity.getId() : 0);
                row.createCell(1).setCellValue(password_resetsEntity.getEmail() != null ? password_resetsEntity.getEmail() : "N/A");
                row.createCell(2).setCellValue(password_resetsEntity.getMobile() != null ? password_resetsEntity.getMobile() : "N/A");
                row.createCell(3).setCellValue(password_resetsEntity.getToken() != null ? password_resetsEntity.getToken() : "N/A");
                LocalDateTime expiresAt = password_resetsEntity.getExpiresAt();
                String formattedExpiresAt = (expiresAt != null) ? expiresAt.format(dateTimeFormat) : "";
                row.createCell(4).setCellValue(formattedExpiresAt);
                LocalDateTime createdAt = password_resetsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(5).setCellValue(formattedCreatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
