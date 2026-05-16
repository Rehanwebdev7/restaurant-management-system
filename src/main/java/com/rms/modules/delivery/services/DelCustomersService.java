package com.rms.modules.delivery.services;

import com.rms.common.entities.CustomersEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.serviceImplement.CustomersServiceIMP;
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
@Qualifier("delCustomersService")
public class DelCustomersService implements CustomersServiceIMP {

    private final CustomersRepository customersrepository;
    private final UsersRepository usersrepository;

    public DelCustomersService(CustomersRepository customersrepository, UsersRepository usersrepository) {
        this.customersrepository = customersrepository;
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
    public List<CustomersEntity> getAllRecordCustomers(String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return customersrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCustomers(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = customersrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public CustomersEntity getOneCustomers(Long id, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return customersrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customers not found"));
    }

    @Override
    public String addCustomers(CustomersEntity customersEntity, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        CustomersEntity newEntity = new CustomersEntity();

        // Copy non-foreign fields using reflection
        for (Field field : CustomersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(customersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle user_id foreign key
        if (customersEntity.getUserId() != null && customersEntity.getUserId().getId() != null) {
            newEntity.setUserId(
                fetchReferenceById(customersEntity.getUserId(), usersrepository, "Users not found")
            );
        }

        customersrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateCustomers(CustomersEntity customersEntity, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        CustomersEntity existingEntity = customersrepository.findById(customersEntity.getId())
                .orElseThrow(() -> new RuntimeException("Customers not found"));

        // Update non-foreign fields using reflection
        for (Field field : CustomersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(customersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle user_id foreign key
        if (customersEntity.getUserId() != null && customersEntity.getUserId().getId() != null) {
            existingEntity.setUserId(
                fetchReferenceById(customersEntity.getUserId(), usersrepository, "Users not found")
            );
        }

        customersrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteCustomers(Long id, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        if (!customersrepository.existsById(id)) {
            throw new RuntimeException("Customers not found");
        }
        customersrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCustomers(List<CustomersEntity> customersEntitys, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        List<CustomersEntity> entitiesToSave = new ArrayList<>();

        for (CustomersEntity entity : customersEntitys) {
            CustomersEntity newEntity = new CustomersEntity();

            // Copy non-foreign fields using reflection
            for (Field field : CustomersEntity.class.getDeclaredFields()) {
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

        customersrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<CustomersEntity> getCustomersByDateofbirthBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return customersrepository.findByDateOfBirthBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getCustomersByDateofbirthBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = customersrepository.findByDateOfBirthBetween(fromDate, toDate, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CustomersEntity> getCustomersByDateofbirth(LocalDate dateofbirth, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return customersrepository.findByDateOfBirth(dateofbirth);
    }

    @Override
    public List<CustomersEntity> getCustomersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return customersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCustomersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = customersrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CustomersEntity> getCustomersByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return customersrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<CustomersEntity> getCustomersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return customersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCustomersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = customersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CustomersEntity> getCustomersByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return customersrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<CustomersEntity> page = customersrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Customerss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Email");
            header.createCell(3).setCellValue("Mobile_number");
            header.createCell(4).setCellValue("Password");
            header.createCell(5).setCellValue("Photo_url");
            header.createCell(6).setCellValue("Date_of_birth");
            header.createCell(7).setCellValue("Is_active");
            header.createCell(8).setCellValue("Created_at");
            header.createCell(9).setCellValue("User_id");
            header.createCell(10).setCellValue("Is_deleted");
            header.createCell(11).setCellValue("Updated_at");

            int rowNum = 1;
            for (CustomersEntity customersEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(customersEntity.getId() != null ? customersEntity.getId() : 0);
                row.createCell(1).setCellValue(customersEntity.getName() != null ? customersEntity.getName() : "N/A");
                row.createCell(2).setCellValue(customersEntity.getEmail() != null ? customersEntity.getEmail() : "N/A");
                row.createCell(3).setCellValue(customersEntity.getMobileNumber() != null ? customersEntity.getMobileNumber() : "N/A");
                row.createCell(4).setCellValue("[protected]"); // do not export password hashes to spreadsheets
                row.createCell(5).setCellValue(customersEntity.getPhotoUrl() != null ? customersEntity.getPhotoUrl() : "N/A");
                LocalDate dateOfBirth = customersEntity.getDateOfBirth();
                String formattedDateOfBirth = (dateOfBirth != null) ? dateOfBirth.format(dateFormat) : "";
                row.createCell(6).setCellValue(formattedDateOfBirth);
                row.createCell(7).setCellValue(customersEntity.getIsActive() != null && customersEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = customersEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(8).setCellValue(formattedCreatedAt);
                row.createCell(9).setCellValue(customersEntity.getUserId() != null ? customersEntity.getUserId().toString() : "N/A");
                row.createCell(10).setCellValue(customersEntity.getIsDeleted() != null ? customersEntity.getIsDeleted() : 0);
                LocalDateTime updatedAt = customersEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
