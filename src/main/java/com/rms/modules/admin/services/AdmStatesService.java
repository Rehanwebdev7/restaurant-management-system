package com.rms.modules.admin.services;

import com.rms.common.entities.StatesEntity;
import com.rms.common.repositories.StatesRepository;
import com.rms.common.serviceImplement.StatesServiceIMP;
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
@Qualifier("admStatesService")
public class AdmStatesService implements StatesServiceIMP {

    private final StatesRepository statesrepository;

    public AdmStatesService(StatesRepository statesrepository) {
        this.statesrepository = statesrepository;
    }

    @Override
    public List<StatesEntity> getAllRecordStates(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return statesrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllStates(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = statesrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public StatesEntity getOneStates(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return statesrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("States not found"));
    }

    @Override
    public String addStates(StatesEntity statesEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        StatesEntity newEntity = new StatesEntity();

        // Copy non-foreign fields using reflection
        for (Field field : StatesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(statesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        statesrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateStates(StatesEntity statesEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        StatesEntity existingEntity = statesrepository.findById(statesEntity.getId())
                .orElseThrow(() -> new RuntimeException("States not found"));

        // Update non-foreign fields using reflection
        for (Field field : StatesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(statesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        statesrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteStates(Integer id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!statesrepository.existsById(id)) {
            throw new RuntimeException("States not found");
        }
        statesrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleStates(List<StatesEntity> statesEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<StatesEntity> entitiesToSave = new ArrayList<>();

        for (StatesEntity entity : statesEntitys) {
            StatesEntity newEntity = new StatesEntity();

            // Copy non-foreign fields using reflection
            for (Field field : StatesEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        statesrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<StatesEntity> getStatesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return statesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getStatesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = statesrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<StatesEntity> getStatesByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return statesrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<StatesEntity> getStatesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return statesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getStatesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = statesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<StatesEntity> getStatesByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return statesrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<StatesEntity> page = statesrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Statess");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Is_active");
            header.createCell(3).setCellValue("Created_at");
            header.createCell(4).setCellValue("Updated_at");

            int rowNum = 1;
            for (StatesEntity statesEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(statesEntity.getId() != null ? statesEntity.getId() : 0);
                row.createCell(1).setCellValue(statesEntity.getName() != null ? statesEntity.getName() : "N/A");
                row.createCell(2).setCellValue(statesEntity.getIsActive() != null && statesEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = statesEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(3).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = statesEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(4).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
