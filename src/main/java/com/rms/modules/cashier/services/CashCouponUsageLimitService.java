package com.rms.modules.cashier.services;

import com.rms.common.entities.CouponUsageLimitEntity;
import com.rms.common.repositories.CouponUsageLimitRepository;
import com.rms.common.serviceImplement.CouponUsageLimitServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;
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
@Qualifier("cashCouponUsageLimitService")
public class CashCouponUsageLimitService implements CouponUsageLimitServiceIMP {

    private final CouponUsageLimitRepository couponusagelimitrepository;
    private final UsersRepository usersrepository;

    public CashCouponUsageLimitService(CouponUsageLimitRepository couponusagelimitrepository, UsersRepository usersrepository) {
        this.couponusagelimitrepository = couponusagelimitrepository;
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
    public List<CouponUsageLimitEntity> getAllRecordCouponUsageLimit(String token) throws Exception {
        Authorization.authorizeCashier(token);
        return couponusagelimitrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCouponUsageLimit(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = couponusagelimitrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public CouponUsageLimitEntity getOneCouponUsageLimit(Integer id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return couponusagelimitrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CouponUsageLimit not found"));
    }

    @Override
    public String addCouponUsageLimit(CouponUsageLimitEntity coupon_usage_limitEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        CouponUsageLimitEntity newEntity = new CouponUsageLimitEntity();

        // Copy non-foreign fields using reflection
        for (Field field : CouponUsageLimitEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(coupon_usage_limitEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle customer_id foreign key
        if (coupon_usage_limitEntity.getCustomerId() != null && coupon_usage_limitEntity.getCustomerId().getId() != null) {
            newEntity.setCustomerId(
                fetchReferenceById(coupon_usage_limitEntity.getCustomerId(), usersrepository, "Users not found")
            );
        }

        // Handle restaurant_id foreign key
        if (coupon_usage_limitEntity.getRestaurantId() != null && coupon_usage_limitEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(coupon_usage_limitEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        // Handle branch_id foreign key
        if (coupon_usage_limitEntity.getBranchId() != null && coupon_usage_limitEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(coupon_usage_limitEntity.getBranchId(), usersrepository, "Users not found")
            );
        }

        couponusagelimitrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateCouponUsageLimit(CouponUsageLimitEntity coupon_usage_limitEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        CouponUsageLimitEntity existingEntity = couponusagelimitrepository.findById(coupon_usage_limitEntity.getId())
                .orElseThrow(() -> new RuntimeException("CouponUsageLimit not found"));

        // Update non-foreign fields using reflection
        for (Field field : CouponUsageLimitEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(coupon_usage_limitEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle customer_id foreign key
        if (coupon_usage_limitEntity.getCustomerId() != null && coupon_usage_limitEntity.getCustomerId().getId() != null) {
            existingEntity.setCustomerId(
                fetchReferenceById(coupon_usage_limitEntity.getCustomerId(), usersrepository, "Users not found")
            );
        }

        // Handle restaurant_id foreign key
        if (coupon_usage_limitEntity.getRestaurantId() != null && coupon_usage_limitEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(coupon_usage_limitEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        // Handle branch_id foreign key
        if (coupon_usage_limitEntity.getBranchId() != null && coupon_usage_limitEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(coupon_usage_limitEntity.getBranchId(), usersrepository, "Users not found")
            );
        }

        couponusagelimitrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteCouponUsageLimit(Integer id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!couponusagelimitrepository.existsById(id)) {
            throw new RuntimeException("CouponUsageLimit not found");
        }
        couponusagelimitrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCouponUsageLimit(List<CouponUsageLimitEntity> coupon_usage_limitEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
        List<CouponUsageLimitEntity> entitiesToSave = new ArrayList<>();

        for (CouponUsageLimitEntity entity : coupon_usage_limitEntitys) {
            CouponUsageLimitEntity newEntity = new CouponUsageLimitEntity();

            // Copy non-foreign fields using reflection
            for (Field field : CouponUsageLimitEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle customer_id foreign key
            if (entity.getCustomerId() != null && entity.getCustomerId().getId() != null) {
                newEntity.setCustomerId(
                    fetchReferenceById(entity.getCustomerId(), usersrepository, "Users not found")
                );
            }

            // Handle restaurant_id foreign key
            if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
                newEntity.setRestaurantId(
                    fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found")
                );
            }

            // Handle branch_id foreign key
            if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
                newEntity.setBranchId(
                    fetchReferenceById(entity.getBranchId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        couponusagelimitrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<CouponUsageLimitEntity> getCouponUsageLimitByLastupdateatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return couponusagelimitrepository.findByLastUpdateAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCouponUsageLimitByLastupdateatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = couponusagelimitrepository.findByLastUpdateAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CouponUsageLimitEntity> getCouponUsageLimitByLastupdateat(LocalDate lastupdateat, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = lastupdateat.atStartOfDay();
        return couponusagelimitrepository.findByLastUpdateAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<CouponUsageLimitEntity> page = couponusagelimitrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("CouponUsageLimits");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Coupon_code");
            header.createCell(2).setCellValue("Last_update_at");
            header.createCell(3).setCellValue("Rem_usage_limit");
            header.createCell(4).setCellValue("Branch_id");
            header.createCell(5).setCellValue("Customer_id");
            header.createCell(6).setCellValue("Restaurant_id");

            int rowNum = 1;
            for (CouponUsageLimitEntity coupon_usage_limitEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(coupon_usage_limitEntity.getId() != null ? coupon_usage_limitEntity.getId() : 0);
                row.createCell(1).setCellValue(coupon_usage_limitEntity.getCouponCode() != null ? coupon_usage_limitEntity.getCouponCode() : "N/A");
                LocalDateTime lastUpdateAt = coupon_usage_limitEntity.getLastUpdateAt();
                String formattedLastUpdateAt = (lastUpdateAt != null) ? lastUpdateAt.format(dateTimeFormat) : "";
                row.createCell(2).setCellValue(formattedLastUpdateAt);
                row.createCell(3).setCellValue(coupon_usage_limitEntity.getRemUsageLimit() != null ? coupon_usage_limitEntity.getRemUsageLimit() : 0);
                row.createCell(4).setCellValue(coupon_usage_limitEntity.getBranchId() != null ? coupon_usage_limitEntity.getBranchId().toString() : "N/A");
                row.createCell(5).setCellValue(coupon_usage_limitEntity.getCustomerId() != null ? coupon_usage_limitEntity.getCustomerId().toString() : "N/A");
                row.createCell(6).setCellValue(coupon_usage_limitEntity.getRestaurantId() != null ? coupon_usage_limitEntity.getRestaurantId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
