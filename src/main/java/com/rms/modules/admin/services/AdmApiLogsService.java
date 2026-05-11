package com.rms.modules.admin.services;

import com.rms.common.entities.ApiLogsEntity;
import com.rms.common.repositories.ApiLogsRepository;
import com.rms.common.serviceImplement.ApiLogsServiceIMP;
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
@Qualifier("admApiLogsService")
public class AdmApiLogsService implements ApiLogsServiceIMP {

    private final ApiLogsRepository apilogsrepository;

    public AdmApiLogsService(ApiLogsRepository apilogsrepository) {
        this.apilogsrepository = apilogsrepository;
    }

    @Override
    public List<ApiLogsEntity> getAllRecordApiLogs(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return apilogsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllApiLogs(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = apilogsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public ApiLogsEntity getOneApiLogs(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return apilogsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ApiLogs not found"));
    }

    @Override
    public String addApiLogs(ApiLogsEntity api_logsEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        ApiLogsEntity newEntity = new ApiLogsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : ApiLogsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(api_logsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        apilogsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateApiLogs(ApiLogsEntity api_logsEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        ApiLogsEntity existingEntity = apilogsrepository.findById(api_logsEntity.getId())
                .orElseThrow(() -> new RuntimeException("ApiLogs not found"));

        // Update non-foreign fields using reflection
        for (Field field : ApiLogsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(api_logsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        apilogsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteApiLogs(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!apilogsrepository.existsById(id)) {
            throw new RuntimeException("ApiLogs not found");
        }
        apilogsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleApiLogs(List<ApiLogsEntity> api_logsEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<ApiLogsEntity> entitiesToSave = new ArrayList<>();

        for (ApiLogsEntity entity : api_logsEntitys) {
            ApiLogsEntity newEntity = new ApiLogsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : ApiLogsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        apilogsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<ApiLogsEntity> getApiLogsByDateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return apilogsrepository.findByDateBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getApiLogsByDateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = apilogsrepository.findByDateBetween(fromDate, toDate, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<ApiLogsEntity> getApiLogsByDate(LocalDate date, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return apilogsrepository.findByDate(date);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<ApiLogsEntity> page = apilogsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("ApiLogss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Api_ref_id");
            header.createCell(2).setCellValue("Date");
            header.createCell(3).setCellValue("Latency");
            header.createCell(4).setCellValue("Operator_no");
            header.createCell(5).setCellValue("Request");
            header.createCell(6).setCellValue("Response");
            header.createCell(7).setCellValue("Service_type");
            header.createCell(8).setCellValue("Time");
            header.createCell(9).setCellValue("Txn_id");

            int rowNum = 1;
            for (ApiLogsEntity api_logsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(api_logsEntity.getId() != null ? api_logsEntity.getId() : 0);
                row.createCell(1).setCellValue(api_logsEntity.getApiRefId() != null ? api_logsEntity.getApiRefId() : "N/A");
                LocalDate date = api_logsEntity.getDate();
                String formattedDate = (date != null) ? date.format(dateFormat) : "";
                row.createCell(2).setCellValue(formattedDate);
                row.createCell(3).setCellValue(api_logsEntity.getLatency() != null ? api_logsEntity.getLatency() : 0);
                row.createCell(4).setCellValue(api_logsEntity.getOperatorNo() != null ? api_logsEntity.getOperatorNo() : "N/A");
                row.createCell(5).setCellValue(api_logsEntity.getRequest() != null ? api_logsEntity.getRequest().toString() : "N/A");
                row.createCell(6).setCellValue(api_logsEntity.getResponse() != null ? api_logsEntity.getResponse().toString() : "N/A");
                row.createCell(7).setCellValue(api_logsEntity.getServiceType() != null ? api_logsEntity.getServiceType() : "N/A");
                LocalTime time = api_logsEntity.getTime();
                String formattedTime = (time != null) ? time.format(timeFormat) : "";
                row.createCell(8).setCellValue(formattedTime);
                row.createCell(9).setCellValue(api_logsEntity.getTxnId() != null ? api_logsEntity.getTxnId() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
