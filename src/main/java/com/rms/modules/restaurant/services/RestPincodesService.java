package com.rms.modules.restaurant.services;

import com.rms.common.entities.PincodesEntity;
import com.rms.common.repositories.PincodesRepository;
import com.rms.common.serviceImplement.PincodesServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.CitiesRepository;
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
@Qualifier("restPincodesService")
public class RestPincodesService implements PincodesServiceIMP {

    private final PincodesRepository pincodesrepository;
    private final CitiesRepository citiesrepository;
    private final StatesRepository statesrepository;

    public RestPincodesService(PincodesRepository pincodesrepository, CitiesRepository citiesrepository, StatesRepository statesrepository) {
        this.pincodesrepository = pincodesrepository;
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
    public List<PincodesEntity> getAllRecordPincodes(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return pincodesrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllPincodes(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = pincodesrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public PincodesEntity getOnePincodes(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return pincodesrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pincodes not found"));
    }

    @Override
    public String addPincodes(PincodesEntity pincodesEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        PincodesEntity newEntity = new PincodesEntity();

        // Copy non-foreign fields using reflection
        for (Field field : PincodesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(pincodesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle city_id foreign key
        if (pincodesEntity.getCityId() != null && pincodesEntity.getCityId().getId() != null) {
            newEntity.setCityId(
                fetchReferenceById(pincodesEntity.getCityId(), citiesrepository, "Cities not found")
            );
        }

        // Handle state_id foreign key
        if (pincodesEntity.getStateId() != null && pincodesEntity.getStateId().getId() != null) {
            newEntity.setStateId(
                fetchReferenceById(pincodesEntity.getStateId(), statesrepository, "States not found")
            );
        }

        pincodesrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updatePincodes(PincodesEntity pincodesEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        PincodesEntity existingEntity = pincodesrepository.findById(pincodesEntity.getId())
                .orElseThrow(() -> new RuntimeException("Pincodes not found"));

        // Update non-foreign fields using reflection
        for (Field field : PincodesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(pincodesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle city_id foreign key
        if (pincodesEntity.getCityId() != null && pincodesEntity.getCityId().getId() != null) {
            existingEntity.setCityId(
                fetchReferenceById(pincodesEntity.getCityId(), citiesrepository, "Cities not found")
            );
        }

        // Handle state_id foreign key
        if (pincodesEntity.getStateId() != null && pincodesEntity.getStateId().getId() != null) {
            existingEntity.setStateId(
                fetchReferenceById(pincodesEntity.getStateId(), statesrepository, "States not found")
            );
        }

        pincodesrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deletePincodes(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        if (!pincodesrepository.existsById(id)) {
            throw new RuntimeException("Pincodes not found");
        }
        pincodesrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultiplePincodes(List<PincodesEntity> pincodesEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        List<PincodesEntity> entitiesToSave = new ArrayList<>();

        for (PincodesEntity entity : pincodesEntitys) {
            PincodesEntity newEntity = new PincodesEntity();

            // Copy non-foreign fields using reflection
            for (Field field : PincodesEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle city_id foreign key
            if (entity.getCityId() != null && entity.getCityId().getId() != null) {
                newEntity.setCityId(
                    fetchReferenceById(entity.getCityId(), citiesrepository, "Cities not found")
                );
            }

            // Handle state_id foreign key
            if (entity.getStateId() != null && entity.getStateId().getId() != null) {
                newEntity.setStateId(
                    fetchReferenceById(entity.getStateId(), statesrepository, "States not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        pincodesrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<PincodesEntity> getPincodesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return pincodesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getPincodesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = pincodesrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<PincodesEntity> getPincodesByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return pincodesrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<PincodesEntity> getPincodesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return pincodesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getPincodesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = pincodesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<PincodesEntity> getPincodesByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return pincodesrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<PincodesEntity> page = pincodesrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Pincodess");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("State_id");
            header.createCell(2).setCellValue("City_id");
            header.createCell(3).setCellValue("Pincode");
            header.createCell(4).setCellValue("Is_active");
            header.createCell(5).setCellValue("Created_at");
            header.createCell(6).setCellValue("Updated_at");

            int rowNum = 1;
            for (PincodesEntity pincodesEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(pincodesEntity.getId() != null ? pincodesEntity.getId() : 0);
                row.createCell(1).setCellValue(pincodesEntity.getStateId() != null ? pincodesEntity.getStateId().toString() : "N/A");
                row.createCell(2).setCellValue(pincodesEntity.getCityId() != null ? pincodesEntity.getCityId().toString() : "N/A");
                row.createCell(3).setCellValue(pincodesEntity.getPincode() != null ? pincodesEntity.getPincode() : "N/A");
                row.createCell(4).setCellValue(pincodesEntity.getIsActive() != null && pincodesEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = pincodesEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(5).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = pincodesEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(6).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
