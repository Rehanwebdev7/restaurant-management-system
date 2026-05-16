package com.rms.modules.delivery.services;

import com.rms.common.entities.ActivityLogsEntity;
import com.rms.common.repositories.ActivityLogsRepository;
import com.rms.common.serviceImplement.ActivityLogsServiceIMP;
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
@Qualifier("delActivityLogsService")
public class DelActivityLogsService implements ActivityLogsServiceIMP {

    private final ActivityLogsRepository activitylogsrepository;

    public DelActivityLogsService(ActivityLogsRepository activitylogsrepository) {
        this.activitylogsrepository = activitylogsrepository;
    }

    @Override
    public List<ActivityLogsEntity> getAllRecordActivityLogs(String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return activitylogsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllActivityLogs(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = activitylogsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public ActivityLogsEntity getOneActivityLogs(Long id, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return activitylogsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ActivityLogs not found"));
    }

    @Override
    public String addActivityLogs(ActivityLogsEntity activity_logsEntity, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        ActivityLogsEntity newEntity = new ActivityLogsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : ActivityLogsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(activity_logsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        activitylogsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateActivityLogs(ActivityLogsEntity activity_logsEntity, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        ActivityLogsEntity existingEntity = activitylogsrepository.findById(activity_logsEntity.getId())
                .orElseThrow(() -> new RuntimeException("ActivityLogs not found"));

        // Update non-foreign fields using reflection
        for (Field field : ActivityLogsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(activity_logsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        activitylogsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteActivityLogs(Long id, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        if (!activitylogsrepository.existsById(id)) {
            throw new RuntimeException("ActivityLogs not found");
        }
        activitylogsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleActivityLogs(List<ActivityLogsEntity> activity_logsEntitys, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        List<ActivityLogsEntity> entitiesToSave = new ArrayList<>();

        for (ActivityLogsEntity entity : activity_logsEntitys) {
            ActivityLogsEntity newEntity = new ActivityLogsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : ActivityLogsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        activitylogsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<ActivityLogsEntity> getActivityLogsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return activitylogsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getActivityLogsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = activitylogsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<ActivityLogsEntity> getActivityLogsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return activitylogsrepository.findByCreatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<ActivityLogsEntity> page = activitylogsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("ActivityLogss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("User_id");
            header.createCell(2).setCellValue("User_role");
            header.createCell(3).setCellValue("Action");
            header.createCell(4).setCellValue("Data");
            header.createCell(5).setCellValue("Ip_address");
            header.createCell(6).setCellValue("User_agent");
            header.createCell(7).setCellValue("Created_at");

            int rowNum = 1;
            for (ActivityLogsEntity activity_logsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(activity_logsEntity.getId() != null ? activity_logsEntity.getId() : 0);
                row.createCell(1).setCellValue(activity_logsEntity.getUserId() != null ? activity_logsEntity.getUserId() : 0);
                row.createCell(2).setCellValue(activity_logsEntity.getUserRole() != null ? activity_logsEntity.getUserRole() : "N/A");
                row.createCell(3).setCellValue(activity_logsEntity.getAction() != null ? activity_logsEntity.getAction() : "N/A");
                row.createCell(4).setCellValue(activity_logsEntity.getData() != null ? activity_logsEntity.getData() : "N/A");
                row.createCell(5).setCellValue(activity_logsEntity.getIpAddress() != null ? activity_logsEntity.getIpAddress() : "N/A");
                row.createCell(6).setCellValue(activity_logsEntity.getUserAgent() != null ? activity_logsEntity.getUserAgent() : "N/A");
                LocalDateTime createdAt = activity_logsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(7).setCellValue(formattedCreatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
