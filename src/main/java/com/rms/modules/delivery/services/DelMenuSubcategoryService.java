package com.rms.modules.delivery.services;

import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.repositories.MenuSubcategoryRepository;
import com.rms.common.serviceImplement.MenuSubcategoryServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.MenuCategoryRepository;
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
@Qualifier("delMenuSubcategoryService")
public class DelMenuSubcategoryService implements MenuSubcategoryServiceIMP {

    private final MenuSubcategoryRepository menusubcategoryrepository;
    private final MenuCategoryRepository menucategoryrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private UsersRepository usersRepository;

    public DelMenuSubcategoryService(MenuSubcategoryRepository menusubcategoryrepository, MenuCategoryRepository menucategoryrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
        this.menusubcategoryrepository = menusubcategoryrepository;
        this.menucategoryrepository = menucategoryrepository;
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
    public List<MenuSubcategoryEntity> getAllRecordMenuSubcategory(String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return menusubcategoryrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMenuSubcategory(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = menusubcategoryrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public MenuSubcategoryEntity getOneMenuSubcategory(Long id, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        return menusubcategoryrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuSubcategory not found"));
    }

    @Override
    public String addMenuSubcategory(MenuSubcategoryEntity menu_subcategoryEntity, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        MenuSubcategoryEntity newEntity = new MenuSubcategoryEntity();

        // Copy non-foreign fields using reflection
        for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_subcategoryEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle menu_category_id foreign key
        if (menu_subcategoryEntity.getMenuCategoryId() != null && menu_subcategoryEntity.getMenuCategoryId().getId() != null) {
            newEntity.setMenuCategoryId(
                fetchReferenceById(menu_subcategoryEntity.getMenuCategoryId(), menucategoryrepository, "Menu_category not found")
            );
        }

        // Handle branch_id foreign key
        if (menu_subcategoryEntity.getBranchId() != null && menu_subcategoryEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(menu_subcategoryEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (menu_subcategoryEntity.getRestaurantId() != null && menu_subcategoryEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(menu_subcategoryEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        menusubcategoryrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateMenuSubcategory(MenuSubcategoryEntity menu_subcategoryEntity, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        MenuSubcategoryEntity existingEntity = menusubcategoryrepository.findById(menu_subcategoryEntity.getId())
                .orElseThrow(() -> new RuntimeException("MenuSubcategory not found"));

        // Update non-foreign fields using reflection
        for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_subcategoryEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle menu_category_id foreign key
        if (menu_subcategoryEntity.getMenuCategoryId() != null && menu_subcategoryEntity.getMenuCategoryId().getId() != null) {
            existingEntity.setMenuCategoryId(
                fetchReferenceById(menu_subcategoryEntity.getMenuCategoryId(), menucategoryrepository, "Menu_category not found")
            );
        }

        // Handle branch_id foreign key
        if (menu_subcategoryEntity.getBranchId() != null && menu_subcategoryEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(menu_subcategoryEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (menu_subcategoryEntity.getRestaurantId() != null && menu_subcategoryEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(menu_subcategoryEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        menusubcategoryrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteMenuSubcategory(Long id, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        if (!menusubcategoryrepository.existsById(id)) {
            throw new RuntimeException("MenuSubcategory not found");
        }
        menusubcategoryrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuSubcategory(List<MenuSubcategoryEntity> menu_subcategoryEntitys, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        List<MenuSubcategoryEntity> entitiesToSave = new ArrayList<>();

        for (MenuSubcategoryEntity entity : menu_subcategoryEntitys) {
            MenuSubcategoryEntity newEntity = new MenuSubcategoryEntity();

            // Copy non-foreign fields using reflection
            for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle menu_category_id foreign key
            if (entity.getMenuCategoryId() != null && entity.getMenuCategoryId().getId() != null) {
                newEntity.setMenuCategoryId(
                    fetchReferenceById(entity.getMenuCategoryId(), menucategoryrepository, "Menu_category not found")
                );
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

        menusubcategoryrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<MenuSubcategoryEntity> getMenuSubcategoryByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menusubcategoryrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuSubcategoryByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = menusubcategoryrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<MenuSubcategoryEntity> getMenuSubcategoryByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return menusubcategoryrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<MenuSubcategoryEntity> getMenuSubcategoryByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menusubcategoryrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuSubcategoryByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = menusubcategoryrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<MenuSubcategoryEntity> getMenuSubcategoryByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeDelivery(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return menusubcategoryrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<MenuSubcategoryEntity> page = menusubcategoryrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("MenuSubcategorys");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Description");
            header.createCell(3).setCellValue("Menu_category_id");
            header.createCell(4).setCellValue("Restaurant_id");
            header.createCell(5).setCellValue("Branch_id");
            header.createCell(6).setCellValue("Is_active");
            header.createCell(7).setCellValue("Icon_url");
            header.createCell(8).setCellValue("Is_deleted");
            header.createCell(9).setCellValue("Created_at");
            header.createCell(10).setCellValue("Updated_at");

            int rowNum = 1;
            for (MenuSubcategoryEntity menu_subcategoryEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(menu_subcategoryEntity.getId() != null ? menu_subcategoryEntity.getId() : 0);
                row.createCell(1).setCellValue(menu_subcategoryEntity.getName() != null ? menu_subcategoryEntity.getName() : "N/A");
                row.createCell(2).setCellValue(menu_subcategoryEntity.getDescription() != null ? menu_subcategoryEntity.getDescription() : "N/A");
                row.createCell(3).setCellValue(menu_subcategoryEntity.getMenuCategoryId() != null ? menu_subcategoryEntity.getMenuCategoryId().toString() : "N/A");
                row.createCell(4).setCellValue(menu_subcategoryEntity.getRestaurantId() != null ? menu_subcategoryEntity.getRestaurantId().toString() : "N/A");
                row.createCell(5).setCellValue(menu_subcategoryEntity.getBranchId() != null ? menu_subcategoryEntity.getBranchId().toString() : "N/A");
                row.createCell(6).setCellValue(menu_subcategoryEntity.getIsActive() != null && menu_subcategoryEntity.getIsActive() ? "Active" : "Inactive");
                row.createCell(7).setCellValue(menu_subcategoryEntity.getIconUrl() != null ? menu_subcategoryEntity.getIconUrl() : "N/A");
                row.createCell(8).setCellValue(menu_subcategoryEntity.getIsDeleted() != null && menu_subcategoryEntity.getIsDeleted() ? "Active" : "Inactive");
                LocalDateTime createdAt = menu_subcategoryEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(9).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = menu_subcategoryEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(10).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
