package com.rms.modules.admin.services;

import com.rms.common.entities.OutstandingEntity;
import com.rms.common.repositories.OutstandingRepository;
import com.rms.common.serviceImplement.OutstandingServiceIMP;
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
@Qualifier("admOutstandingService")
public class AdmOutstandingService implements OutstandingServiceIMP {

    private final OutstandingRepository outstandingrepository;
    private final UsersRepository usersrepository;

    public AdmOutstandingService(OutstandingRepository outstandingrepository, UsersRepository usersrepository) {
        this.outstandingrepository = outstandingrepository;
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
    public List<OutstandingEntity> getAllRecordOutstanding(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return outstandingrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllOutstanding(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = outstandingrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public OutstandingEntity getOneOutstanding(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return outstandingrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outstanding not found"));
    }

    @Override
    public String addOutstanding(OutstandingEntity outstandingEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        OutstandingEntity newEntity = new OutstandingEntity();

        // Copy non-foreign fields using reflection
        for (Field field : OutstandingEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(outstandingEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle user_id foreign key
        if (outstandingEntity.getUserId() != null && outstandingEntity.getUserId().getId() != null) {
            newEntity.setUserId(
                fetchReferenceById(outstandingEntity.getUserId(), usersrepository, "Users not found")
            );
        }

        outstandingrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateOutstanding(OutstandingEntity outstandingEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        OutstandingEntity existingEntity = outstandingrepository.findById(outstandingEntity.getId())
                .orElseThrow(() -> new RuntimeException("Outstanding not found"));

        // Update non-foreign fields using reflection
        for (Field field : OutstandingEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(outstandingEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle user_id foreign key
        if (outstandingEntity.getUserId() != null && outstandingEntity.getUserId().getId() != null) {
            existingEntity.setUserId(
                fetchReferenceById(outstandingEntity.getUserId(), usersrepository, "Users not found")
            );
        }

        outstandingrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteOutstanding(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!outstandingrepository.existsById(id)) {
            throw new RuntimeException("Outstanding not found");
        }
        outstandingrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleOutstanding(List<OutstandingEntity> outstandingEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<OutstandingEntity> entitiesToSave = new ArrayList<>();

        for (OutstandingEntity entity : outstandingEntitys) {
            OutstandingEntity newEntity = new OutstandingEntity();

            // Copy non-foreign fields using reflection
            for (Field field : OutstandingEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle user_id foreign key
            if (entity.getUserId() != null && entity.getUserId().getId() != null) {
                newEntity.setUserId(
                    fetchReferenceById(entity.getUserId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        outstandingrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<OutstandingEntity> getOutstandingByDateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return outstandingrepository.findByDateBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getOutstandingByDateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = outstandingrepository.findByDateBetween(fromDate, toDate, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OutstandingEntity> getOutstandingByDate(LocalDate date, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return outstandingrepository.findByDate(date);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OutstandingEntity> page = outstandingrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Outstandings");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Amount");
            header.createCell(2).setCellValue("Closing_bal");
            header.createCell(3).setCellValue("Date");
            header.createCell(4).setCellValue("Mode");
            header.createCell(5).setCellValue("Opening_bal");
            header.createCell(6).setCellValue("Order_id");
            header.createCell(7).setCellValue("Remark");
            header.createCell(8).setCellValue("Service");
            header.createCell(9).setCellValue("Time");
            header.createCell(10).setCellValue("User_id");

            int rowNum = 1;
            for (OutstandingEntity outstandingEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(outstandingEntity.getId() != null ? outstandingEntity.getId() : 0);
                row.createCell(1).setCellValue(outstandingEntity.getAmount() != null ? outstandingEntity.getAmount().doubleValue() : 0.0);
                row.createCell(2).setCellValue(outstandingEntity.getClosingBal() != null ? outstandingEntity.getClosingBal().doubleValue() : 0.0);
                LocalDate date = outstandingEntity.getDate();
                String formattedDate = (date != null) ? date.format(dateFormat) : "";
                row.createCell(3).setCellValue(formattedDate);
                row.createCell(4).setCellValue(outstandingEntity.getMode() != null ? outstandingEntity.getMode() : 0);
                row.createCell(5).setCellValue(outstandingEntity.getOpeningBal() != null ? outstandingEntity.getOpeningBal().doubleValue() : 0.0);
                row.createCell(6).setCellValue(outstandingEntity.getOrderId() != null ? outstandingEntity.getOrderId() : "N/A");
                row.createCell(7).setCellValue(outstandingEntity.getRemark() != null ? outstandingEntity.getRemark() : "N/A");
                row.createCell(8).setCellValue(outstandingEntity.getService() != null ? outstandingEntity.getService() : "N/A");
                row.createCell(9).setCellValue(outstandingEntity.getTime() != null ? outstandingEntity.getTime() : "N/A");
                row.createCell(10).setCellValue(outstandingEntity.getUserId() != null ? outstandingEntity.getUserId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
