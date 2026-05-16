package com.rms.modules.customer.services;

import com.rms.common.entities.SectionEntity;
import com.rms.common.repositories.SectionRepository;
import com.rms.common.serviceImplement.SectionServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
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
@Qualifier("custSectionService")
public class CustSectionService implements SectionServiceIMP {

    private final SectionRepository sectionrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private UsersRepository usersRepository;

    public CustSectionService(SectionRepository sectionrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
        this.sectionrepository = sectionrepository;
        this.restaurantbranchrepository = restaurantbranchrepository;
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
    public List<SectionEntity> getAllRecordSection(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        return sectionrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllSection(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = sectionrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public SectionEntity getOneSection(Long id, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        return sectionrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Section not found"));
    }

    @Override
    public String addSection(SectionEntity sectionEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        SectionEntity newEntity = new SectionEntity();

        // Copy non-foreign fields using reflection
        for (Field field : SectionEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(sectionEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (sectionEntity.getBranchId() != null && sectionEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(sectionEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (sectionEntity.getRestaurantId() != null && sectionEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(sectionEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        sectionrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateSection(SectionEntity sectionEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        SectionEntity existingEntity = sectionrepository.findById(sectionEntity.getId())
                .orElseThrow(() -> new RuntimeException("Section not found"));

        // Update non-foreign fields using reflection
        for (Field field : SectionEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(sectionEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (sectionEntity.getBranchId() != null && sectionEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(sectionEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (sectionEntity.getRestaurantId() != null && sectionEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(sectionEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        sectionrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteSection(Long id, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        if (!sectionrepository.existsById(id)) {
            throw new RuntimeException("Section not found");
        }
        sectionrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleSection(List<SectionEntity> sectionEntitys, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        List<SectionEntity> entitiesToSave = new ArrayList<>();

        for (SectionEntity entity : sectionEntitys) {
            SectionEntity newEntity = new SectionEntity();

            // Copy non-foreign fields using reflection
            for (Field field : SectionEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle branch_id foreign key
            if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
                newEntity.setBranchId(
                    fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found")
                );
            }

            // Handle restaurant_id foreign key
            if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
                newEntity.setRestaurantId(
                    fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        sectionrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<SectionEntity> page = sectionrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Sections");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Restaurant_id");
            header.createCell(3).setCellValue("Branch_id");
            header.createCell(4).setCellValue("Type");
            header.createCell(5).setCellValue("Tax_percentage");

            int rowNum = 1;
            for (SectionEntity sectionEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(sectionEntity.getId() != null ? sectionEntity.getId() : 0);
                row.createCell(1).setCellValue(sectionEntity.getName() != null ? sectionEntity.getName() : "N/A");
                row.createCell(2).setCellValue(sectionEntity.getRestaurantId() != null ? sectionEntity.getRestaurantId().toString() : "N/A");
                row.createCell(3).setCellValue(sectionEntity.getBranchId() != null ? sectionEntity.getBranchId().toString() : "N/A");
                row.createCell(4).setCellValue(sectionEntity.getType() != null ? sectionEntity.getType() : "N/A");
                row.createCell(5).setCellValue(sectionEntity.getTaxPercentage() != null ? sectionEntity.getTaxPercentage().doubleValue() : 0.0);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
