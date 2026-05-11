package com.rms.modules.restaurant.services;

import com.rms.common.entities.MessageApprovalEntity;
import com.rms.common.repositories.MessageApprovalRepository;
import com.rms.common.serviceImplement.MessageApprovalServiceIMP;
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
@Qualifier("restMessageApprovalService")
public class RestMessageApprovalService implements MessageApprovalServiceIMP {

    private final MessageApprovalRepository messageapprovalrepository;

    public RestMessageApprovalService(MessageApprovalRepository messageapprovalrepository) {
        this.messageapprovalrepository = messageapprovalrepository;
    }

    @Override
    public List<MessageApprovalEntity> getAllRecordMessageApproval(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return messageapprovalrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMessageApproval(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = messageapprovalrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public MessageApprovalEntity getOneMessageApproval(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return messageapprovalrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MessageApproval not found"));
    }

    @Override
    public String addMessageApproval(MessageApprovalEntity message_approvalEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        MessageApprovalEntity newEntity = new MessageApprovalEntity();

        // Copy non-foreign fields using reflection
        for (Field field : MessageApprovalEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(message_approvalEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        messageapprovalrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateMessageApproval(MessageApprovalEntity message_approvalEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        MessageApprovalEntity existingEntity = messageapprovalrepository.findById(message_approvalEntity.getId())
                .orElseThrow(() -> new RuntimeException("MessageApproval not found"));

        // Update non-foreign fields using reflection
        for (Field field : MessageApprovalEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(message_approvalEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        messageapprovalrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteMessageApproval(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        if (!messageapprovalrepository.existsById(id)) {
            throw new RuntimeException("MessageApproval not found");
        }
        messageapprovalrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMessageApproval(List<MessageApprovalEntity> message_approvalEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        List<MessageApprovalEntity> entitiesToSave = new ArrayList<>();

        for (MessageApprovalEntity entity : message_approvalEntitys) {
            MessageApprovalEntity newEntity = new MessageApprovalEntity();

            // Copy non-foreign fields using reflection
            for (Field field : MessageApprovalEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        messageapprovalrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<MessageApprovalEntity> page = messageapprovalrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("MessageApprovals");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("App");
            header.createCell(2).setCellValue("Email");
            header.createCell(3).setCellValue("Name");
            header.createCell(4).setCellValue("Sms");
            header.createCell(5).setCellValue("Whatsapp");

            int rowNum = 1;
            for (MessageApprovalEntity message_approvalEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(message_approvalEntity.getId() != null ? message_approvalEntity.getId() : 0);
                row.createCell(1).setCellValue(message_approvalEntity.getApp() != null && message_approvalEntity.getApp() ? "Active" : "Inactive");
                row.createCell(2).setCellValue(message_approvalEntity.getEmail() != null && message_approvalEntity.getEmail() ? "Active" : "Inactive");
                row.createCell(3).setCellValue(message_approvalEntity.getName() != null ? message_approvalEntity.getName() : "N/A");
                row.createCell(4).setCellValue(message_approvalEntity.getSms() != null && message_approvalEntity.getSms() ? "Active" : "Inactive");
                row.createCell(5).setCellValue(message_approvalEntity.getWhatsapp() != null && message_approvalEntity.getWhatsapp() ? "Active" : "Inactive");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
