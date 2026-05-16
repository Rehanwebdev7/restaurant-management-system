package com.rms.modules.kitchen.services;

import com.rms.common.entities.MenuItemAddonsEntity;
import com.rms.common.repositories.MenuItemAddonsRepository;
import com.rms.common.serviceImplement.MenuItemAddonsServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.AddonsRepository;
import com.rms.common.repositories.MenuItemsRepository;

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
@Qualifier("kitMenuItemAddonsService")
public class KitMenuItemAddonsService implements MenuItemAddonsServiceIMP {

    private final MenuItemAddonsRepository menuitemaddonsrepository;
    private final AddonsRepository addonsrepository;
    private final MenuItemsRepository menuitemsrepository;

    public KitMenuItemAddonsService(MenuItemAddonsRepository menuitemaddonsrepository, AddonsRepository addonsrepository, MenuItemsRepository menuitemsrepository) {
        this.menuitemaddonsrepository = menuitemaddonsrepository;
        this.addonsrepository = addonsrepository;
        this.menuitemsrepository = menuitemsrepository;
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
    public List<MenuItemAddonsEntity> getAllRecordMenuItemAddons(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return menuitemaddonsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMenuItemAddons(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = menuitemaddonsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public MenuItemAddonsEntity getOneMenuItemAddons(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return menuitemaddonsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuItemAddons not found"));
    }

    @Override
    public String addMenuItemAddons(MenuItemAddonsEntity menu_item_addonsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        MenuItemAddonsEntity newEntity = new MenuItemAddonsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : MenuItemAddonsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_item_addonsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle addon_id foreign key
        if (menu_item_addonsEntity.getAddonId() != null && menu_item_addonsEntity.getAddonId().getId() != null) {
            newEntity.setAddonId(
                fetchReferenceById(menu_item_addonsEntity.getAddonId(), addonsrepository, "Addons not found")
            );
        }

        // Handle menu_item_id foreign key
        if (menu_item_addonsEntity.getMenuItemId() != null && menu_item_addonsEntity.getMenuItemId().getId() != null) {
            newEntity.setMenuItemId(
                fetchReferenceById(menu_item_addonsEntity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
            );
        }

        menuitemaddonsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateMenuItemAddons(MenuItemAddonsEntity menu_item_addonsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        MenuItemAddonsEntity existingEntity = menuitemaddonsrepository.findById(menu_item_addonsEntity.getId())
                .orElseThrow(() -> new RuntimeException("MenuItemAddons not found"));

        // Update non-foreign fields using reflection
        for (Field field : MenuItemAddonsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_item_addonsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle addon_id foreign key
        if (menu_item_addonsEntity.getAddonId() != null && menu_item_addonsEntity.getAddonId().getId() != null) {
            existingEntity.setAddonId(
                fetchReferenceById(menu_item_addonsEntity.getAddonId(), addonsrepository, "Addons not found")
            );
        }

        // Handle menu_item_id foreign key
        if (menu_item_addonsEntity.getMenuItemId() != null && menu_item_addonsEntity.getMenuItemId().getId() != null) {
            existingEntity.setMenuItemId(
                fetchReferenceById(menu_item_addonsEntity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
            );
        }

        menuitemaddonsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteMenuItemAddons(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!menuitemaddonsrepository.existsById(id)) {
            throw new RuntimeException("MenuItemAddons not found");
        }
        menuitemaddonsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuItemAddons(List<MenuItemAddonsEntity> menu_item_addonsEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<MenuItemAddonsEntity> entitiesToSave = new ArrayList<>();

        for (MenuItemAddonsEntity entity : menu_item_addonsEntitys) {
            MenuItemAddonsEntity newEntity = new MenuItemAddonsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : MenuItemAddonsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle addon_id foreign key
            if (entity.getAddonId() != null && entity.getAddonId().getId() != null) {
                newEntity.setAddonId(
                    fetchReferenceById(entity.getAddonId(), addonsrepository, "Addons not found")
                );
            }

            // Handle menu_item_id foreign key
            if (entity.getMenuItemId() != null && entity.getMenuItemId().getId() != null) {
                newEntity.setMenuItemId(
                    fetchReferenceById(entity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        menuitemaddonsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<MenuItemAddonsEntity> getMenuItemAddonsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menuitemaddonsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuItemAddonsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = menuitemaddonsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<MenuItemAddonsEntity> getMenuItemAddonsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return menuitemaddonsrepository.findByCreatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<MenuItemAddonsEntity> page = menuitemaddonsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("MenuItemAddonss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Menu_item_id");
            header.createCell(2).setCellValue("Addon_id");
            header.createCell(3).setCellValue("Created_at");

            int rowNum = 1;
            for (MenuItemAddonsEntity menu_item_addonsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(menu_item_addonsEntity.getId() != null ? menu_item_addonsEntity.getId() : 0);
                row.createCell(1).setCellValue(menu_item_addonsEntity.getMenuItemId() != null ? menu_item_addonsEntity.getMenuItemId().toString() : "N/A");
                row.createCell(2).setCellValue(menu_item_addonsEntity.getAddonId() != null ? menu_item_addonsEntity.getAddonId().toString() : "N/A");
                LocalDateTime createdAt = menu_item_addonsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(3).setCellValue(formattedCreatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
