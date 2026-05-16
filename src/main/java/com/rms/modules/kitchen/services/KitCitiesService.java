package com.rms.modules.kitchen.services;

import com.rms.common.entities.CitiesEntity;
import com.rms.common.repositories.CitiesRepository;
import com.rms.common.serviceImplement.CitiesServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.StatesRepository;

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
@Qualifier("kitCitiesService")
public class KitCitiesService implements CitiesServiceIMP {

    private final CitiesRepository citiesrepository;
    private final StatesRepository statesrepository;

    public KitCitiesService(CitiesRepository citiesrepository, StatesRepository statesrepository) {
        this.citiesrepository = citiesrepository;
        this.statesrepository = statesrepository;
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
    public List<CitiesEntity> getAllRecordCities(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return citiesrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCities(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = citiesrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public CitiesEntity getOneCities(Integer id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return citiesrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cities not found"));
    }

    @Override
    public String addCities(CitiesEntity citiesEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        CitiesEntity newEntity = new CitiesEntity();

        // Copy non-foreign fields using reflection
        for (Field field : CitiesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(citiesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle state_id foreign key
        if (citiesEntity.getStateId() != null && citiesEntity.getStateId().getId() != null) {
            newEntity.setStateId(
                fetchReferenceById(citiesEntity.getStateId(), statesrepository, "States not found")
            );
        }

        citiesrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateCities(CitiesEntity citiesEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        CitiesEntity existingEntity = citiesrepository.findById(citiesEntity.getId())
                .orElseThrow(() -> new RuntimeException("Cities not found"));

        // Update non-foreign fields using reflection
        for (Field field : CitiesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(citiesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle state_id foreign key
        if (citiesEntity.getStateId() != null && citiesEntity.getStateId().getId() != null) {
            existingEntity.setStateId(
                fetchReferenceById(citiesEntity.getStateId(), statesrepository, "States not found")
            );
        }

        citiesrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteCities(Integer id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!citiesrepository.existsById(id)) {
            throw new RuntimeException("Cities not found");
        }
        citiesrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCities(List<CitiesEntity> citiesEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<CitiesEntity> entitiesToSave = new ArrayList<>();

        for (CitiesEntity entity : citiesEntitys) {
            CitiesEntity newEntity = new CitiesEntity();

            // Copy non-foreign fields using reflection
            for (Field field : CitiesEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle state_id foreign key
            if (entity.getStateId() != null && entity.getStateId().getId() != null) {
                newEntity.setStateId(
                    fetchReferenceById(entity.getStateId(), statesrepository, "States not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        citiesrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<CitiesEntity> getCitiesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return citiesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCitiesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = citiesrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CitiesEntity> getCitiesByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return citiesrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<CitiesEntity> getCitiesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return citiesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCitiesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = citiesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CitiesEntity> getCitiesByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return citiesrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<CitiesEntity> page = citiesrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Citiess");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("State_id");
            header.createCell(3).setCellValue("Is_active");
            header.createCell(4).setCellValue("Created_at");
            header.createCell(5).setCellValue("Updated_at");

            int rowNum = 1;
            for (CitiesEntity citiesEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(citiesEntity.getId() != null ? citiesEntity.getId() : 0);
                row.createCell(1).setCellValue(citiesEntity.getName() != null ? citiesEntity.getName() : "N/A");
                row.createCell(2).setCellValue(citiesEntity.getStateId() != null ? citiesEntity.getStateId().toString() : "N/A");
                row.createCell(3).setCellValue(citiesEntity.getIsActive() != null && citiesEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = citiesEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(4).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = citiesEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(5).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
