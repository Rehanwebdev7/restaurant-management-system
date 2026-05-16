package com.rms.modules.customer.services;

import com.rms.common.entities.AddonsEntity;
import com.rms.common.repositories.AddonsRepository;
import com.rms.common.serviceImplement.AddonsServiceIMP;
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
@Qualifier("custAddonsService")
public class CustAddonsService implements AddonsServiceIMP {

    private final AddonsRepository addonsrepository;
    private final UsersRepository usersrepository;

    public CustAddonsService(AddonsRepository addonsrepository, UsersRepository usersrepository) {
        this.addonsrepository = addonsrepository;
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
    public List<AddonsEntity> getAllRecordAddons(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        return addonsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllAddons(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = addonsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public AddonsEntity getOneAddons(Long id, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        return addonsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Addons not found"));
    }

    @Override
    public String addAddons(AddonsEntity addonsEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        AddonsEntity newEntity = new AddonsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : AddonsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(addonsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (addonsEntity.getRestaurantId() != null && addonsEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(addonsEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        addonsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateAddons(AddonsEntity addonsEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        AddonsEntity existingEntity = addonsrepository.findById(addonsEntity.getId())
                .orElseThrow(() -> new RuntimeException("Addons not found"));

        // Update non-foreign fields using reflection
        for (Field field : AddonsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(addonsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (addonsEntity.getRestaurantId() != null && addonsEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(addonsEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        addonsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteAddons(Long id, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        if (!addonsrepository.existsById(id)) {
            throw new RuntimeException("Addons not found");
        }
        addonsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleAddons(List<AddonsEntity> addonsEntitys, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        List<AddonsEntity> entitiesToSave = new ArrayList<>();

        for (AddonsEntity entity : addonsEntitys) {
            AddonsEntity newEntity = new AddonsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : AddonsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle restaurant_id foreign key
            if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
                newEntity.setRestaurantId(
                    fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        addonsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<AddonsEntity> getAddonsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return addonsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getAddonsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = addonsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<AddonsEntity> getAddonsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return addonsrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<AddonsEntity> getAddonsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return addonsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getAddonsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = addonsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<AddonsEntity> getAddonsByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return addonsrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<AddonsEntity> page = addonsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Addonss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Description");
            header.createCell(3).setCellValue("Restaurant_id");
            header.createCell(4).setCellValue("Min_addon");
            header.createCell(5).setCellValue("Max_addon");
            header.createCell(6).setCellValue("Is_multiple");
            header.createCell(7).setCellValue("Show_online");
            header.createCell(8).setCellValue("Show_in_captain");
            header.createCell(9).setCellValue("Is_active");
            header.createCell(10).setCellValue("Created_at");
            header.createCell(11).setCellValue("Updated_at");

            int rowNum = 1;
            for (AddonsEntity addonsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(addonsEntity.getId() != null ? addonsEntity.getId() : 0);
                row.createCell(1).setCellValue(addonsEntity.getName() != null ? addonsEntity.getName() : "N/A");
                row.createCell(2).setCellValue(addonsEntity.getDescription() != null ? addonsEntity.getDescription() : "N/A");
                row.createCell(3).setCellValue(addonsEntity.getRestaurantId() != null ? addonsEntity.getRestaurantId().toString() : "N/A");
                row.createCell(4).setCellValue(addonsEntity.getMinAddon() != null ? addonsEntity.getMinAddon() : 0);
                row.createCell(5).setCellValue(addonsEntity.getMaxAddon() != null ? addonsEntity.getMaxAddon() : 0);
                row.createCell(6).setCellValue(addonsEntity.getIsMultiple() != null && addonsEntity.getIsMultiple() ? "Active" : "Inactive");
                row.createCell(7).setCellValue(addonsEntity.getShowOnline() != null && addonsEntity.getShowOnline() ? "Active" : "Inactive");
                row.createCell(8).setCellValue(addonsEntity.getShowInCaptain() != null && addonsEntity.getShowInCaptain() ? "Active" : "Inactive");
//                row.createCell(9).setCellValue(addonsEntity.getIsActive() != null ? addonsEntity.getIsActive() : 0);
                LocalDateTime createdAt = addonsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(10).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = addonsEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
