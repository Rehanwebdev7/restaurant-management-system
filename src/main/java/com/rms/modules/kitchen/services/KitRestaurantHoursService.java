package com.rms.modules.kitchen.services;

import com.rms.common.entities.RestaurantHoursEntity;
import com.rms.common.repositories.RestaurantHoursRepository;
import com.rms.common.serviceImplement.RestaurantHoursServiceIMP;
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
@Qualifier("kitRestaurantHoursService")
public class KitRestaurantHoursService implements RestaurantHoursServiceIMP {

    private final RestaurantHoursRepository restauranthoursrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private UsersRepository usersRepository;

    public KitRestaurantHoursService(RestaurantHoursRepository restauranthoursrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
        this.restauranthoursrepository = restauranthoursrepository;
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
    public List<RestaurantHoursEntity> getAllRecordRestaurantHours(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return restauranthoursrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllRestaurantHours(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = restauranthoursrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public RestaurantHoursEntity getOneRestaurantHours(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return restauranthoursrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RestaurantHours not found"));
    }

    @Override
    public String addRestaurantHours(RestaurantHoursEntity restaurant_hoursEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        RestaurantHoursEntity newEntity = new RestaurantHoursEntity();

        // Copy non-foreign fields using reflection
        for (Field field : RestaurantHoursEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(restaurant_hoursEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (restaurant_hoursEntity.getBranchId() != null && restaurant_hoursEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(restaurant_hoursEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (restaurant_hoursEntity.getRestaurantId() != null && restaurant_hoursEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(restaurant_hoursEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        restauranthoursrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateRestaurantHours(RestaurantHoursEntity restaurant_hoursEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        RestaurantHoursEntity existingEntity = restauranthoursrepository.findById(restaurant_hoursEntity.getId())
                .orElseThrow(() -> new RuntimeException("RestaurantHours not found"));

        // Update non-foreign fields using reflection
        for (Field field : RestaurantHoursEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(restaurant_hoursEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (restaurant_hoursEntity.getBranchId() != null && restaurant_hoursEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(restaurant_hoursEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (restaurant_hoursEntity.getRestaurantId() != null && restaurant_hoursEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(restaurant_hoursEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        restauranthoursrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteRestaurantHours(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!restauranthoursrepository.existsById(id)) {
            throw new RuntimeException("RestaurantHours not found");
        }
        restauranthoursrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleRestaurantHours(List<RestaurantHoursEntity> restaurant_hoursEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<RestaurantHoursEntity> entitiesToSave = new ArrayList<>();

        for (RestaurantHoursEntity entity : restaurant_hoursEntitys) {
            RestaurantHoursEntity newEntity = new RestaurantHoursEntity();

            // Copy non-foreign fields using reflection
            for (Field field : RestaurantHoursEntity.class.getDeclaredFields()) {
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

        restauranthoursrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<RestaurantHoursEntity> getRestaurantHoursBySpecialdateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return restauranthoursrepository.findBySpecialDateBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getRestaurantHoursBySpecialdateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = restauranthoursrepository.findBySpecialDateBetween(fromDate, toDate, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<RestaurantHoursEntity> getRestaurantHoursBySpecialdate(LocalDate specialdate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return restauranthoursrepository.findBySpecialDate(specialdate);
    }

    @Override
    public List<RestaurantHoursEntity> getRestaurantHoursByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return restauranthoursrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getRestaurantHoursByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = restauranthoursrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<RestaurantHoursEntity> getRestaurantHoursByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return restauranthoursrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<RestaurantHoursEntity> getRestaurantHoursByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return restauranthoursrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getRestaurantHoursByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = restauranthoursrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<RestaurantHoursEntity> getRestaurantHoursByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return restauranthoursrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<RestaurantHoursEntity> page = restauranthoursrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("RestaurantHourss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Restaurant_id");
            header.createCell(2).setCellValue("Branch_id");
            header.createCell(3).setCellValue("Day_of_week");
            header.createCell(4).setCellValue("Special_date");
            header.createCell(5).setCellValue("Opening_time");
            header.createCell(6).setCellValue("Closing_time");
            header.createCell(7).setCellValue("Is_closed");
            header.createCell(8).setCellValue("Created_at");
            header.createCell(9).setCellValue("Updated_at");

            int rowNum = 1;
            for (RestaurantHoursEntity restaurant_hoursEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(restaurant_hoursEntity.getId() != null ? restaurant_hoursEntity.getId() : 0);
                row.createCell(1).setCellValue(restaurant_hoursEntity.getRestaurantId() != null ? restaurant_hoursEntity.getRestaurantId().toString() : "N/A");
                row.createCell(2).setCellValue(restaurant_hoursEntity.getBranchId() != null ? restaurant_hoursEntity.getBranchId().toString() : "N/A");
                row.createCell(3).setCellValue(restaurant_hoursEntity.getDayOfWeek() != null ? restaurant_hoursEntity.getDayOfWeek() : "N/A");
                LocalDate specialDate = restaurant_hoursEntity.getSpecialDate();
                String formattedSpecialDate = (specialDate != null) ? specialDate.format(dateFormat) : "";
                row.createCell(4).setCellValue(formattedSpecialDate);
                LocalTime openingTime = restaurant_hoursEntity.getOpeningTime();
                String formattedOpeningTime = (openingTime != null) ? openingTime.format(timeFormat) : "";
                row.createCell(5).setCellValue(formattedOpeningTime);
                LocalTime closingTime = restaurant_hoursEntity.getClosingTime();
                String formattedClosingTime = (closingTime != null) ? closingTime.format(timeFormat) : "";
                row.createCell(6).setCellValue(formattedClosingTime);
                row.createCell(7).setCellValue(restaurant_hoursEntity.getIsClosed() != null && restaurant_hoursEntity.getIsClosed() ? "Active" : "Inactive");
                LocalDateTime createdAt = restaurant_hoursEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(8).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = restaurant_hoursEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(9).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
