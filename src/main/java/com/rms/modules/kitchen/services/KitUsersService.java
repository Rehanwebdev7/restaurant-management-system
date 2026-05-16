package com.rms.modules.kitchen.services;

import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.UsersServiceIMP;
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
@Qualifier("kitUsersService")
public class KitUsersService implements UsersServiceIMP {

    private final UsersRepository usersrepository;

    public KitUsersService(UsersRepository usersrepository) {
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
    public List<UsersEntity> getAllRecordUsers(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return usersrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllUsers(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = usersrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public UsersEntity getOneUsers(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return usersrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Users not found"));
    }

    @Override
    public String addUsers(UsersEntity usersEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        UsersEntity newEntity = new UsersEntity();

        // Copy non-foreign fields using reflection
        for (Field field : UsersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(usersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle parent_id foreign key
        if (usersEntity.getParentId() != null && usersEntity.getParentId().getId() != null) {
            newEntity.setParentId(
                fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found")
            );
        }

        usersrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateUsers(UsersEntity usersEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        UsersEntity existingEntity = usersrepository.findById(usersEntity.getId())
                .orElseThrow(() -> new RuntimeException("Users not found"));

        // Update non-foreign fields using reflection
        for (Field field : UsersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(usersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle parent_id foreign key
        if (usersEntity.getParentId() != null && usersEntity.getParentId().getId() != null) {
            existingEntity.setParentId(
                fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found")
            );
        }

        usersrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteUsers(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!usersrepository.existsById(id)) {
            throw new RuntimeException("Users not found");
        }
        usersrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleUsers(List<UsersEntity> usersEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<UsersEntity> entitiesToSave = new ArrayList<>();

        for (UsersEntity entity : usersEntitys) {
            UsersEntity newEntity = new UsersEntity();

            // Copy non-foreign fields using reflection
            for (Field field : UsersEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle parent_id foreign key
            if (entity.getParentId() != null && entity.getParentId().getId() != null) {
                newEntity.setParentId(
                    fetchReferenceById(entity.getParentId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        usersrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<UsersEntity> getUsersByLastloginBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByLastLoginBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByLastloginBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = usersrepository.findByLastLoginBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<UsersEntity> getUsersByLastlogin(LocalDate lastlogin, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = lastlogin.atStartOfDay();
        return usersrepository.findByLastLogin(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByLastloginatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByLastloginatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<UsersEntity> getUsersByLastloginat(LocalDate lastloginat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = lastloginat.atStartOfDay();
        return usersrepository.findByLastLoginAt(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<UsersEntity> getUsersByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return usersrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<UsersEntity> getUsersByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return usersrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<UsersEntity> page = usersrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Userss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Email");
            header.createCell(3).setCellValue("Mobile");
            header.createCell(4).setCellValue("Password");
            header.createCell(5).setCellValue("Role");
            header.createCell(6).setCellValue("User_type");
            header.createCell(7).setCellValue("Parent_id");
            header.createCell(8).setCellValue("Is_active");
            header.createCell(9).setCellValue("Is_deleted");
            header.createCell(10).setCellValue("Last_login");
            header.createCell(11).setCellValue("Last_login_at");
            header.createCell(12).setCellValue("Created_at");
            header.createCell(13).setCellValue("Updated_at");

            int rowNum = 1;
            for (UsersEntity usersEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(usersEntity.getId() != null ? usersEntity.getId() : 0);
                row.createCell(1).setCellValue(usersEntity.getName() != null ? usersEntity.getName() : "N/A");
                row.createCell(2).setCellValue(usersEntity.getEmail() != null ? usersEntity.getEmail() : "N/A");
                row.createCell(3).setCellValue(usersEntity.getMobile() != null ? usersEntity.getMobile() : "N/A");
                row.createCell(4).setCellValue("[protected]"); // do not export password hashes to spreadsheets
                row.createCell(5).setCellValue(usersEntity.getRole() != null ? usersEntity.getRole() : "N/A");
                row.createCell(6).setCellValue(usersEntity.getParentId() != null ? usersEntity.getParentId().toString() : "N/A");
                row.createCell(7).setCellValue(usersEntity.getIsActive() != null && usersEntity.getIsActive() ? "Active" : "Inactive");
                row.createCell(8).setCellValue(usersEntity.getIsDeleted() != null && usersEntity.getIsDeleted() ? "Active" : "Inactive");
                LocalDateTime lastLogin = usersEntity.getLastLogin();
                String formattedLastLogin = (lastLogin != null) ? lastLogin.format(dateTimeFormat) : "";
                row.createCell(9).setCellValue(formattedLastLogin);
                LocalDateTime lastLoginAt = usersEntity.getLastLoginAt();
                String formattedLastLoginAt = (lastLoginAt != null) ? lastLoginAt.format(dateTimeFormat) : "";
                row.createCell(10).setCellValue(formattedLastLoginAt);
                LocalDateTime createdAt = usersEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = usersEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(12).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
