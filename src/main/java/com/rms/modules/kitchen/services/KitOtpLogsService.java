package com.rms.modules.kitchen.services;

import com.rms.common.entities.OtpLogsEntity;
import com.rms.common.repositories.OtpLogsRepository;
import com.rms.common.serviceImplement.OtpLogsServiceIMP;
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
@Qualifier("kitOtpLogsService")
public class KitOtpLogsService implements OtpLogsServiceIMP {

    private final OtpLogsRepository otplogsrepository;

    public KitOtpLogsService(OtpLogsRepository otplogsrepository) {
        this.otplogsrepository = otplogsrepository;
    }

    @Override
    public List<OtpLogsEntity> getAllRecordOtpLogs(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return otplogsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllOtpLogs(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = otplogsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public OtpLogsEntity getOneOtpLogs(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return otplogsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OtpLogs not found"));
    }

    @Override
    public String addOtpLogs(OtpLogsEntity otp_logsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        OtpLogsEntity newEntity = new OtpLogsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : OtpLogsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(otp_logsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        otplogsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateOtpLogs(OtpLogsEntity otp_logsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        OtpLogsEntity existingEntity = otplogsrepository.findById(otp_logsEntity.getId())
                .orElseThrow(() -> new RuntimeException("OtpLogs not found"));

        // Update non-foreign fields using reflection
        for (Field field : OtpLogsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(otp_logsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        otplogsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteOtpLogs(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!otplogsrepository.existsById(id)) {
            throw new RuntimeException("OtpLogs not found");
        }
        otplogsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleOtpLogs(List<OtpLogsEntity> otp_logsEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<OtpLogsEntity> entitiesToSave = new ArrayList<>();

        for (OtpLogsEntity entity : otp_logsEntitys) {
            OtpLogsEntity newEntity = new OtpLogsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : OtpLogsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        otplogsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByExpiresatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return otplogsrepository.findByExpiresAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOtpLogsByExpiresatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = otplogsrepository.findByExpiresAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByExpiresat(LocalDate expiresat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = expiresat.atStartOfDay();
        return otplogsrepository.findByExpiresAt(dateTime);
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return otplogsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOtpLogsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = otplogsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return otplogsrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByVerifiedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return otplogsrepository.findByVerifiedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOtpLogsByVerifiedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = otplogsrepository.findByVerifiedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByVerifiedat(LocalDate verifiedat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = verifiedat.atStartOfDay();
        return otplogsrepository.findByVerifiedAt(dateTime);
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByUsedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return otplogsrepository.findByUsedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOtpLogsByUsedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = otplogsrepository.findByUsedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByUsedat(LocalDate usedat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = usedat.atStartOfDay();
        return otplogsrepository.findByUsedAt(dateTime);
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return otplogsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOtpLogsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = otplogsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OtpLogsEntity> getOtpLogsByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return otplogsrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OtpLogsEntity> page = otplogsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("OtpLogss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Identifier");
            header.createCell(2).setCellValue("Mobile_number");
            header.createCell(3).setCellValue("Otp_code");
            header.createCell(4).setCellValue("Otp_type");
            header.createCell(5).setCellValue("Type");
            header.createCell(6).setCellValue("Is_verified");
            header.createCell(7).setCellValue("Is_used");
            header.createCell(8).setCellValue("Attempt_count");
            header.createCell(9).setCellValue("Expires_at");
            header.createCell(10).setCellValue("Created_at");
            header.createCell(11).setCellValue("Verified_at");
            header.createCell(12).setCellValue("Used_at");
            header.createCell(13).setCellValue("Updated_at");

            int rowNum = 1;
            for (OtpLogsEntity otp_logsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(otp_logsEntity.getId() != null ? otp_logsEntity.getId() : 0);
                row.createCell(1).setCellValue(otp_logsEntity.getIdentifier() != null ? otp_logsEntity.getIdentifier() : "N/A");
                row.createCell(2).setCellValue(otp_logsEntity.getMobileNumber() != null ? otp_logsEntity.getMobileNumber() : "N/A");
                row.createCell(3).setCellValue(otp_logsEntity.getOtpCode() != null ? otp_logsEntity.getOtpCode() : "N/A");
                row.createCell(4).setCellValue(otp_logsEntity.getOtpType() != null ? otp_logsEntity.getOtpType() : "N/A");
                row.createCell(5).setCellValue(otp_logsEntity.getType() != null ? otp_logsEntity.getType() : "N/A");
                row.createCell(6).setCellValue(otp_logsEntity.getIsVerified() != null && otp_logsEntity.getIsVerified() ? "Active" : "Inactive");
                row.createCell(7).setCellValue(otp_logsEntity.getIsUsed() != null && otp_logsEntity.getIsUsed() ? "Active" : "Inactive");
                row.createCell(8).setCellValue(otp_logsEntity.getAttemptCount() != null ? otp_logsEntity.getAttemptCount() : 0);
                LocalDateTime expiresAt = otp_logsEntity.getExpiresAt();
                String formattedExpiresAt = (expiresAt != null) ? expiresAt.format(dateTimeFormat) : "";
                row.createCell(9).setCellValue(formattedExpiresAt);
                LocalDateTime createdAt = otp_logsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(10).setCellValue(formattedCreatedAt);
                LocalDateTime verifiedAt = otp_logsEntity.getVerifiedAt();
                String formattedVerifiedAt = (verifiedAt != null) ? verifiedAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedVerifiedAt);
                LocalDateTime usedAt = otp_logsEntity.getUsedAt();
                String formattedUsedAt = (usedAt != null) ? usedAt.format(dateTimeFormat) : "";
                row.createCell(12).setCellValue(formattedUsedAt);
                LocalDateTime updatedAt = otp_logsEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(13).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
