package com.rms.modules.admin.services;

import com.rms.common.entities.GlobalSettingEntity;
import com.rms.common.repositories.GlobalSettingRepository;
import com.rms.common.serviceImplement.GlobalSettingServiceIMP;
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
@Qualifier("admGlobalSettingService")
public class AdmGlobalSettingService implements GlobalSettingServiceIMP {

    private final GlobalSettingRepository globalsettingrepository;

    public AdmGlobalSettingService(GlobalSettingRepository globalsettingrepository) {
        this.globalsettingrepository = globalsettingrepository;
    }

    @Override
    public List<GlobalSettingEntity> getAllRecordGlobalSetting(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return globalsettingrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllGlobalSetting(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = globalsettingrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public GlobalSettingEntity getOneGlobalSetting(Long id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return globalsettingrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("GlobalSetting not found"));
    }

    @Override
    public String addGlobalSetting(GlobalSettingEntity global_settingEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        GlobalSettingEntity newEntity = new GlobalSettingEntity();

        // Copy non-foreign fields using reflection
        for (Field field : GlobalSettingEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(global_settingEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        globalsettingrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateGlobalSetting(GlobalSettingEntity global_settingEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        GlobalSettingEntity existingEntity = globalsettingrepository.findById(global_settingEntity.getId())
                .orElseThrow(() -> new RuntimeException("GlobalSetting not found"));

        // Update non-foreign fields using reflection
        for (Field field : GlobalSettingEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(global_settingEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        globalsettingrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteGlobalSetting(Long id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!globalsettingrepository.existsById(id)) {
            throw new RuntimeException("GlobalSetting not found");
        }
        globalsettingrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleGlobalSetting(List<GlobalSettingEntity> global_settingEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        List<GlobalSettingEntity> entitiesToSave = new ArrayList<>();

        for (GlobalSettingEntity entity : global_settingEntitys) {
            GlobalSettingEntity newEntity = new GlobalSettingEntity();

            // Copy non-foreign fields using reflection
            for (Field field : GlobalSettingEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        globalsettingrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<GlobalSettingEntity> page = globalsettingrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("GlobalSettings");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Cron_on_off");
            header.createCell(2).setCellValue("Force_update");
            header.createCell(3).setCellValue("Latest_version");
            header.createCell(4).setCellValue("Lock_system");
            header.createCell(5).setCellValue("Maintainance_mode");
            header.createCell(6).setCellValue("Min_amount");
            header.createCell(7).setCellValue("System_ip");

            int rowNum = 1;
            for (GlobalSettingEntity global_settingEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(global_settingEntity.getId() != null ? global_settingEntity.getId() : 0);
                row.createCell(1).setCellValue(global_settingEntity.getCronOnOff() != null ? global_settingEntity.getCronOnOff() : "N/A");
                row.createCell(2).setCellValue(global_settingEntity.getForceUpdate() != null ? global_settingEntity.getForceUpdate() : "N/A");
                row.createCell(3).setCellValue(global_settingEntity.getLatestVersion() != null ? global_settingEntity.getLatestVersion() : "N/A");
                row.createCell(4).setCellValue(global_settingEntity.getLockSystem() != null ? global_settingEntity.getLockSystem() : "N/A");
                row.createCell(5).setCellValue(global_settingEntity.getMaintainanceMode() != null ? global_settingEntity.getMaintainanceMode() : "N/A");
                row.createCell(6).setCellValue(global_settingEntity.getMinAmount() != null ? global_settingEntity.getMinAmount().doubleValue() : 0.0);
                row.createCell(7).setCellValue(global_settingEntity.getSystemIp() != null ? global_settingEntity.getSystemIp() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
