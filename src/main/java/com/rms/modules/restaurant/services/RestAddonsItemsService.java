package com.rms.modules.restaurant.services;

import com.rms.common.entities.AddonsItemsEntity;
import com.rms.common.repositories.AddonsItemsRepository;
import com.rms.common.serviceImplement.AddonsItemsServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.AddonsRepository;

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
@Qualifier("restAddonsItemsService")
public class RestAddonsItemsService implements AddonsItemsServiceIMP {

    private final AddonsItemsRepository addonsitemsrepository;
    private final AddonsRepository addonsrepository;
    
    @Autowired
    private AddonsItemsRepository addonsItemsRepository;

    public RestAddonsItemsService(AddonsItemsRepository addonsitemsrepository, AddonsRepository addonsrepository) {
        this.addonsitemsrepository = addonsitemsrepository;
        this.addonsrepository = addonsrepository;
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
    
    public List<AddonsItemsEntity> getBybranchId(Long addonsId, String token) throws Exception {

		// 🔐 Authorization
		Authorization.authorizeRestaurant(token);

		if (addonsId == null) {
			throw new RuntimeException("BranchId is required");
		}

		List<AddonsItemsEntity> zones = addonsItemsRepository.findAllByAddonsId_Id(addonsId);

		if (zones.isEmpty()) {
			throw new RuntimeException("No delivery zones found for branchId: " + addonsId);
		}

		return zones;
	}

    @Override
    public List<AddonsItemsEntity> getAllRecordAddonsItems(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return addonsitemsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllAddonsItems(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = addonsitemsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public AddonsItemsEntity getOneAddonsItems(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return addonsitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AddonsItems not found"));
    }

    @Override
    public String addAddonsItems(AddonsItemsEntity addons_itemsEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        AddonsItemsEntity newEntity = new AddonsItemsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(addons_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle addons_id foreign key
        if (addons_itemsEntity.getAddonsId() != null && addons_itemsEntity.getAddonsId().getId() != null) {
            newEntity.setAddonsId(
                fetchReferenceById(addons_itemsEntity.getAddonsId(), addonsrepository, "Addons not found")
            );
        }

        addonsitemsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateAddonsItems(AddonsItemsEntity addons_itemsEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        AddonsItemsEntity existingEntity = addonsitemsrepository.findById(addons_itemsEntity.getId())
                .orElseThrow(() -> new RuntimeException("AddonsItems not found"));

        // Update non-foreign fields using reflection
        for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(addons_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle addons_id foreign key
        if (addons_itemsEntity.getAddonsId() != null && addons_itemsEntity.getAddonsId().getId() != null) {
            existingEntity.setAddonsId(
                fetchReferenceById(addons_itemsEntity.getAddonsId(), addonsrepository, "Addons not found")
            );
        }

        addonsitemsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteAddonsItems(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        if (!addonsitemsrepository.existsById(id)) {
            throw new RuntimeException("AddonsItems not found");
        }
        addonsitemsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleAddonsItems(List<AddonsItemsEntity> addons_itemsEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        List<AddonsItemsEntity> entitiesToSave = new ArrayList<>();

        for (AddonsItemsEntity entity : addons_itemsEntitys) {
            AddonsItemsEntity newEntity = new AddonsItemsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle addons_id foreign key
            if (entity.getAddonsId() != null && entity.getAddonsId().getId() != null) {
                newEntity.setAddonsId(
                    fetchReferenceById(entity.getAddonsId(), addonsrepository, "Addons not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        addonsitemsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<AddonsItemsEntity> getAddonsItemsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return addonsitemsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getAddonsItemsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = addonsitemsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<AddonsItemsEntity> getAddonsItemsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return addonsitemsrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<AddonsItemsEntity> getAddonsItemsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return addonsitemsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getAddonsItemsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = addonsitemsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<AddonsItemsEntity> getAddonsItemsByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return addonsitemsrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<AddonsItemsEntity> page = addonsitemsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("AddonsItemss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Addons_id");
            header.createCell(2).setCellValue("Name");
            header.createCell(3).setCellValue("Price");
            header.createCell(4).setCellValue("Attribute");
            header.createCell(5).setCellValue("Is_active");
            header.createCell(6).setCellValue("Created_at");
            header.createCell(7).setCellValue("Updated_at");

            int rowNum = 1;
            for (AddonsItemsEntity addons_itemsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(addons_itemsEntity.getId() != null ? addons_itemsEntity.getId() : 0);
                row.createCell(1).setCellValue(addons_itemsEntity.getAddonsId() != null ? addons_itemsEntity.getAddonsId().toString() : "N/A");
                row.createCell(2).setCellValue(addons_itemsEntity.getName() != null ? addons_itemsEntity.getName() : "N/A");
                row.createCell(3).setCellValue(addons_itemsEntity.getPrice() != null ? addons_itemsEntity.getPrice().doubleValue() : 0.0);
                row.createCell(4).setCellValue(addons_itemsEntity.getAttribute() != null ? addons_itemsEntity.getAttribute() : "N/A");
                row.createCell(5).setCellValue(addons_itemsEntity.getIsActive() != null && addons_itemsEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = addons_itemsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(6).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = addons_itemsEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(7).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
