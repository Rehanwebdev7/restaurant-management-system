package com.rms.modules.admin.services;

import com.rms.common.entities.SmsFormatesEntity;
import com.rms.common.repositories.SmsFormatesRepository;
import com.rms.common.serviceImplement.SmsFormatesServiceIMP;
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
@Qualifier("admSmsFormatesService")
public class AdmSmsFormatesService implements SmsFormatesServiceIMP {

    private final SmsFormatesRepository smsformatesrepository;

    public AdmSmsFormatesService(SmsFormatesRepository smsformatesrepository) {
        this.smsformatesrepository = smsformatesrepository;
    }

    @Override
    public List<SmsFormatesEntity> getAllRecordSmsFormates(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return smsformatesrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllSmsFormates(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = smsformatesrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public SmsFormatesEntity getOneSmsFormates(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return smsformatesrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SmsFormates not found"));
    }

    @Override
    public String addSmsFormates(SmsFormatesEntity sms_formatesEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        SmsFormatesEntity newEntity = new SmsFormatesEntity();

        // Copy non-foreign fields using reflection
        for (Field field : SmsFormatesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(sms_formatesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        smsformatesrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateSmsFormates(SmsFormatesEntity sms_formatesEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        SmsFormatesEntity existingEntity = smsformatesrepository.findById(sms_formatesEntity.getId())
                .orElseThrow(() -> new RuntimeException("SmsFormates not found"));

        // Update non-foreign fields using reflection
        for (Field field : SmsFormatesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(sms_formatesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        smsformatesrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteSmsFormates(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!smsformatesrepository.existsById(id)) {
            throw new RuntimeException("SmsFormates not found");
        }
        smsformatesrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleSmsFormates(List<SmsFormatesEntity> sms_formatesEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<SmsFormatesEntity> entitiesToSave = new ArrayList<>();

        for (SmsFormatesEntity entity : sms_formatesEntitys) {
            SmsFormatesEntity newEntity = new SmsFormatesEntity();

            // Copy non-foreign fields using reflection
            for (Field field : SmsFormatesEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        smsformatesrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<SmsFormatesEntity> page = smsformatesrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("SmsFormatess");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Api_key");
            header.createCell(2).setCellValue("Entity_id");
            header.createCell(3).setCellValue("Message");
            header.createCell(4).setCellValue("Sender_id");
            header.createCell(5).setCellValue("Service");
            header.createCell(6).setCellValue("Template_id");
            header.createCell(7).setCellValue("User_id");

            int rowNum = 1;
            for (SmsFormatesEntity sms_formatesEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(sms_formatesEntity.getId() != null ? sms_formatesEntity.getId() : 0);
                row.createCell(1).setCellValue(sms_formatesEntity.getApiKey() != null ? sms_formatesEntity.getApiKey() : "N/A");
                row.createCell(2).setCellValue(sms_formatesEntity.getEntityId() != null ? sms_formatesEntity.getEntityId() : "N/A");
                row.createCell(3).setCellValue(sms_formatesEntity.getMessage() != null ? sms_formatesEntity.getMessage() : "N/A");
                row.createCell(4).setCellValue(sms_formatesEntity.getSenderId() != null ? sms_formatesEntity.getSenderId() : "N/A");
                row.createCell(5).setCellValue(sms_formatesEntity.getService() != null ? sms_formatesEntity.getService() : "N/A");
                row.createCell(6).setCellValue(sms_formatesEntity.getTemplateId() != null ? sms_formatesEntity.getTemplateId() : "N/A");
                row.createCell(7).setCellValue(sms_formatesEntity.getUserId() != null ? sms_formatesEntity.getUserId() : 0);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
