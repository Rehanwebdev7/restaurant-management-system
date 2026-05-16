package com.rms.modules.customer.services;

import com.rms.common.entities.CouponMappingEntity;
import com.rms.common.repositories.CouponMappingRepository;
import com.rms.common.serviceImplement.CouponMappingServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.CouponRepository;

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
@Qualifier("custCouponMappingService")
public class CustCouponMappingService implements CouponMappingServiceIMP {

    private final CouponMappingRepository couponmappingrepository;
    private final MenuItemsRepository menuitemsrepository;
    private final CouponRepository couponrepository;

    public CustCouponMappingService(CouponMappingRepository couponmappingrepository, MenuItemsRepository menuitemsrepository, CouponRepository couponrepository) {
        this.couponmappingrepository = couponmappingrepository;
        this.menuitemsrepository = menuitemsrepository;
        this.couponrepository = couponrepository;
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
    public List<CouponMappingEntity> getAllRecordCouponMapping(String token) throws Exception {
        Authorization.authorizeCustomer(token);
        return couponmappingrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCouponMapping(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = couponmappingrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public CouponMappingEntity getOneCouponMapping(Integer id, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        return couponmappingrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CouponMapping not found"));
    }

    @Override
    public String addCouponMapping(CouponMappingEntity coupon_mappingEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        CouponMappingEntity newEntity = new CouponMappingEntity();

        // Copy non-foreign fields using reflection
        for (Field field : CouponMappingEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(coupon_mappingEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle menu_item_id foreign key
        if (coupon_mappingEntity.getMenuItemId() != null && coupon_mappingEntity.getMenuItemId().getId() != null) {
            newEntity.setMenuItemId(
                fetchReferenceById(coupon_mappingEntity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
            );
        }

        // Handle coupon_id foreign key
        if (coupon_mappingEntity.getCouponId() != null && coupon_mappingEntity.getCouponId().getId() != null) {
            newEntity.setCouponId(
                fetchReferenceById(coupon_mappingEntity.getCouponId(), couponrepository, "Coupon not found")
            );
        }

        couponmappingrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateCouponMapping(CouponMappingEntity coupon_mappingEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        CouponMappingEntity existingEntity = couponmappingrepository.findById(coupon_mappingEntity.getId())
                .orElseThrow(() -> new RuntimeException("CouponMapping not found"));

        // Update non-foreign fields using reflection
        for (Field field : CouponMappingEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(coupon_mappingEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle menu_item_id foreign key
        if (coupon_mappingEntity.getMenuItemId() != null && coupon_mappingEntity.getMenuItemId().getId() != null) {
            existingEntity.setMenuItemId(
                fetchReferenceById(coupon_mappingEntity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
            );
        }

        // Handle coupon_id foreign key
        if (coupon_mappingEntity.getCouponId() != null && coupon_mappingEntity.getCouponId().getId() != null) {
            existingEntity.setCouponId(
                fetchReferenceById(coupon_mappingEntity.getCouponId(), couponrepository, "Coupon not found")
            );
        }

        couponmappingrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteCouponMapping(Integer id, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        if (!couponmappingrepository.existsById(id)) {
            throw new RuntimeException("CouponMapping not found");
        }
        couponmappingrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCouponMapping(List<CouponMappingEntity> coupon_mappingEntitys, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        List<CouponMappingEntity> entitiesToSave = new ArrayList<>();

        for (CouponMappingEntity entity : coupon_mappingEntitys) {
            CouponMappingEntity newEntity = new CouponMappingEntity();

            // Copy non-foreign fields using reflection
            for (Field field : CouponMappingEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle menu_item_id foreign key
            if (entity.getMenuItemId() != null && entity.getMenuItemId().getId() != null) {
                newEntity.setMenuItemId(
                    fetchReferenceById(entity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
                );
            }

            // Handle coupon_id foreign key
            if (entity.getCouponId() != null && entity.getCouponId().getId() != null) {
                newEntity.setCouponId(
                    fetchReferenceById(entity.getCouponId(), couponrepository, "Coupon not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        couponmappingrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<CouponMappingEntity> page = couponmappingrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("CouponMappings");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Coupon_id");
            header.createCell(2).setCellValue("Menu_item_id");

            int rowNum = 1;
            for (CouponMappingEntity coupon_mappingEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(coupon_mappingEntity.getId() != null ? coupon_mappingEntity.getId() : 0);
                row.createCell(1).setCellValue(coupon_mappingEntity.getCouponId() != null ? coupon_mappingEntity.getCouponId().toString() : "N/A");
                row.createCell(2).setCellValue(coupon_mappingEntity.getMenuItemId() != null ? coupon_mappingEntity.getMenuItemId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
