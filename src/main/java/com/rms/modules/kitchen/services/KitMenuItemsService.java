package com.rms.modules.kitchen.services;

import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.AddonsRepository;
import com.rms.common.repositories.MenuCategoryRepository;
import com.rms.common.repositories.MenuSubcategoryRepository;
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
@Qualifier("kitMenuItemsService")
public class KitMenuItemsService implements MenuItemsServiceIMP {

    private final MenuItemsRepository menuitemsrepository;
    private final AddonsRepository addonsrepository;
    private final MenuCategoryRepository menucategoryrepository;
    private final MenuSubcategoryRepository menusubcategoryrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private UsersRepository usersRepository;

    public KitMenuItemsService(MenuItemsRepository menuitemsrepository, AddonsRepository addonsrepository, MenuCategoryRepository menucategoryrepository, MenuSubcategoryRepository menusubcategoryrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
        this.menuitemsrepository = menuitemsrepository;
        this.addonsrepository = addonsrepository;
        this.menucategoryrepository = menucategoryrepository;
        this.menusubcategoryrepository = menusubcategoryrepository;
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
    public List<MenuItemsEntity> getAllRecordMenuItems(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return menuitemsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMenuItems(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = menuitemsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public MenuItemsEntity getOneMenuItems(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return menuitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuItems not found"));
    }

    @Override
    public String addMenuItems(MenuItemsEntity menu_itemsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        MenuItemsEntity newEntity = new MenuItemsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle addons_id foreign key
        if (menu_itemsEntity.getAddonsId() != null && menu_itemsEntity.getAddonsId().getId() != null) {
            newEntity.setAddonsId(
                fetchReferenceById(menu_itemsEntity.getAddonsId(), addonsrepository, "Addons not found")
            );
        }

        // Handle menu_category_id foreign key
        if (menu_itemsEntity.getMenuCategoryId() != null && menu_itemsEntity.getMenuCategoryId().getId() != null) {
            newEntity.setMenuCategoryId(
                fetchReferenceById(menu_itemsEntity.getMenuCategoryId(), menucategoryrepository, "Menu_category not found")
            );
        }

        // Handle menu_subcategory_id foreign key
        if (menu_itemsEntity.getMenuSubcategoryId() != null && menu_itemsEntity.getMenuSubcategoryId().getId() != null) {
            newEntity.setMenuSubcategoryId(
                fetchReferenceById(menu_itemsEntity.getMenuSubcategoryId(), menusubcategoryrepository, "Menu_subcategory not found")
            );
        }

        // Handle branch_id foreign key
        if (menu_itemsEntity.getBranchId() != null && menu_itemsEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(menu_itemsEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (menu_itemsEntity.getRestaurantId() != null && menu_itemsEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(menu_itemsEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        menuitemsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateMenuItems(MenuItemsEntity menu_itemsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        MenuItemsEntity existingEntity = menuitemsrepository.findById(menu_itemsEntity.getId())
                .orElseThrow(() -> new RuntimeException("MenuItems not found"));

        // Update non-foreign fields using reflection
        for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle addons_id foreign key
        if (menu_itemsEntity.getAddonsId() != null && menu_itemsEntity.getAddonsId().getId() != null) {
            existingEntity.setAddonsId(
                fetchReferenceById(menu_itemsEntity.getAddonsId(), addonsrepository, "Addons not found")
            );
        }

        // Handle menu_category_id foreign key
        if (menu_itemsEntity.getMenuCategoryId() != null && menu_itemsEntity.getMenuCategoryId().getId() != null) {
            existingEntity.setMenuCategoryId(
                fetchReferenceById(menu_itemsEntity.getMenuCategoryId(), menucategoryrepository, "Menu_category not found")
            );
        }

        // Handle menu_subcategory_id foreign key
        if (menu_itemsEntity.getMenuSubcategoryId() != null && menu_itemsEntity.getMenuSubcategoryId().getId() != null) {
            existingEntity.setMenuSubcategoryId(
                fetchReferenceById(menu_itemsEntity.getMenuSubcategoryId(), menusubcategoryrepository, "Menu_subcategory not found")
            );
        }

        // Handle branch_id foreign key
        if (menu_itemsEntity.getBranchId() != null && menu_itemsEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(menu_itemsEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (menu_itemsEntity.getRestaurantId() != null && menu_itemsEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(menu_itemsEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        menuitemsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteMenuItems(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        MenuItemsEntity entity = menuitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuItems not found"));
        entity.setIsDeleted(true);
        menuitemsrepository.save(entity);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuItems(List<MenuItemsEntity> menu_itemsEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<MenuItemsEntity> entitiesToSave = new ArrayList<>();

        for (MenuItemsEntity entity : menu_itemsEntitys) {
            MenuItemsEntity newEntity = new MenuItemsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
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

            // Handle menu_category_id foreign key
            if (entity.getMenuCategoryId() != null && entity.getMenuCategoryId().getId() != null) {
                newEntity.setMenuCategoryId(
                    fetchReferenceById(entity.getMenuCategoryId(), menucategoryrepository, "Menu_category not found")
                );
            }

            // Handle menu_subcategory_id foreign key
            if (entity.getMenuSubcategoryId() != null && entity.getMenuSubcategoryId().getId() != null) {
                newEntity.setMenuSubcategoryId(
                    fetchReferenceById(entity.getMenuSubcategoryId(), menusubcategoryrepository, "Menu_subcategory not found")
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

        menuitemsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<MenuItemsEntity> page = menuitemsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("MenuItemss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Restaurant_id");
            header.createCell(2).setCellValue("Branch_id");
            header.createCell(3).setCellValue("Is_active");
            header.createCell(4).setCellValue("Menu_category_id");
            header.createCell(5).setCellValue("Menu_subcategory_id");
            header.createCell(6).setCellValue("Addons_id");
            header.createCell(7).setCellValue("Name");
            header.createCell(8).setCellValue("Description");
            header.createCell(9).setCellValue("Price");
            header.createCell(10).setCellValue("Mrp");
            header.createCell(11).setCellValue("Cost_price");
            header.createCell(12).setCellValue("Dietary_type");
            header.createCell(13).setCellValue("Is_available");
            header.createCell(14).setCellValue("Available_online");
            header.createCell(15).setCellValue("Image_url");
            header.createCell(16).setCellValue("Preparation_minutes");
            header.createCell(17).setCellValue("Delivery_minutes");
            header.createCell(18).setCellValue("Is_recommended");
            header.createCell(19).setCellValue("Spice_level");
            header.createCell(20).setCellValue("Priority");
            header.createCell(21).setCellValue("Created_at");
            header.createCell(22).setCellValue("Is_deleted");

            int rowNum = 1;
            for (MenuItemsEntity menu_itemsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(menu_itemsEntity.getId() != null ? menu_itemsEntity.getId() : 0);
                row.createCell(1).setCellValue(menu_itemsEntity.getRestaurantId() != null ? menu_itemsEntity.getRestaurantId().toString() : "N/A");
                row.createCell(2).setCellValue(menu_itemsEntity.getBranchId() != null ? menu_itemsEntity.getBranchId().toString() : "N/A");
                row.createCell(3).setCellValue(menu_itemsEntity.getIsActive() != null && menu_itemsEntity.getIsActive() ? "Active" : "Inactive");
                row.createCell(4).setCellValue(menu_itemsEntity.getMenuCategoryId() != null ? menu_itemsEntity.getMenuCategoryId().toString() : "N/A");
                row.createCell(5).setCellValue(menu_itemsEntity.getMenuSubcategoryId() != null ? menu_itemsEntity.getMenuSubcategoryId().toString() : "N/A");
                row.createCell(6).setCellValue(menu_itemsEntity.getAddonsId() != null ? menu_itemsEntity.getAddonsId().toString() : "N/A");
                row.createCell(7).setCellValue(menu_itemsEntity.getName() != null ? menu_itemsEntity.getName() : "N/A");
                row.createCell(8).setCellValue(menu_itemsEntity.getDescription() != null ? menu_itemsEntity.getDescription() : "N/A");
                row.createCell(9).setCellValue(menu_itemsEntity.getPrice() != null ? menu_itemsEntity.getPrice().doubleValue() : 0.0);
                row.createCell(10).setCellValue(menu_itemsEntity.getMrp() != null ? menu_itemsEntity.getMrp().doubleValue() : 0.0);
                row.createCell(11).setCellValue(menu_itemsEntity.getCostPrice() != null ? menu_itemsEntity.getCostPrice().doubleValue() : 0.0);
//                row.createCell(12).setCellValue(menu_itemsEntity.getDietaryType() != null ? menu_itemsEntity.getDietaryType() : "N/A");
                row.createCell(13).setCellValue(menu_itemsEntity.getIsAvailable() != null && menu_itemsEntity.getIsAvailable() ? "Active" : "Inactive");
                row.createCell(14).setCellValue(menu_itemsEntity.getAvailableOnline() != null && menu_itemsEntity.getAvailableOnline() ? "Active" : "Inactive");
                row.createCell(15).setCellValue(menu_itemsEntity.getImageUrl() != null ? menu_itemsEntity.getImageUrl() : "N/A");
                row.createCell(16).setCellValue(menu_itemsEntity.getPreparationMinutes() != null ? menu_itemsEntity.getPreparationMinutes() : 0);
                row.createCell(17).setCellValue(menu_itemsEntity.getDeliveryMinutes() != null ? menu_itemsEntity.getDeliveryMinutes() : 0);
                row.createCell(18).setCellValue(menu_itemsEntity.getIsRecommended() != null && menu_itemsEntity.getIsRecommended() ? "Active" : "Inactive");
                row.createCell(19).setCellValue(menu_itemsEntity.getSpiceLevel() != null ? menu_itemsEntity.getSpiceLevel() : "N/A");
                row.createCell(20).setCellValue(menu_itemsEntity.getPriority() != null ? menu_itemsEntity.getPriority() : 0);
                LocalDateTime createdAt = menu_itemsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(21).setCellValue(formattedCreatedAt);
                row.createCell(22).setCellValue(menu_itemsEntity.getIsDeleted() );

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
