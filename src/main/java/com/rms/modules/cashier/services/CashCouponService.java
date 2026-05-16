package com.rms.modules.cashier.services;

import com.rms.common.entities.CouponEntity;
import com.rms.common.repositories.CouponRepository;
import com.rms.common.serviceImplement.CouponServiceIMP;
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
@Qualifier("cashCouponService")
public class CashCouponService implements CouponServiceIMP {

    private final CouponRepository couponrepository;
    private final UsersRepository usersrepository;

    public CashCouponService(CouponRepository couponrepository, UsersRepository usersrepository) {
        this.couponrepository = couponrepository;
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
    public List<CouponEntity> getAllRecordCoupon(String token) throws Exception {
        Authorization.authorizeCashier(token);
        return couponrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCoupon(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = couponrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public CouponEntity getOneCoupon(Integer id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return couponrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    @Override
    public String addCoupon(CouponEntity couponEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        CouponEntity newEntity = new CouponEntity();

        // Copy non-foreign fields using reflection
        for (Field field : CouponEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(couponEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (couponEntity.getBranchId() != null && couponEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(couponEntity.getBranchId(), usersrepository, "Users not found")
            );
        }

        // Handle added_by_id foreign key
        if (couponEntity.getAddedById() != null && couponEntity.getAddedById().getId() != null) {
            newEntity.setAddedById(
                fetchReferenceById(couponEntity.getAddedById(), usersrepository, "Users not found")
            );
        }

        // Handle restaurant_id foreign key
        if (couponEntity.getRestaurantId() != null && couponEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(couponEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        couponrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateCoupon(CouponEntity couponEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        CouponEntity existingEntity = couponrepository.findById(couponEntity.getId())
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        // Update non-foreign fields using reflection
        for (Field field : CouponEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(couponEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (couponEntity.getBranchId() != null && couponEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(couponEntity.getBranchId(), usersrepository, "Users not found")
            );
        }

        // Handle added_by_id foreign key
        if (couponEntity.getAddedById() != null && couponEntity.getAddedById().getId() != null) {
            existingEntity.setAddedById(
                fetchReferenceById(couponEntity.getAddedById(), usersrepository, "Users not found")
            );
        }

        // Handle restaurant_id foreign key
        if (couponEntity.getRestaurantId() != null && couponEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(couponEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        couponrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteCoupon(Integer id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!couponrepository.existsById(id)) {
            throw new RuntimeException("Coupon not found");
        }
        couponrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCoupon(List<CouponEntity> couponEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
        List<CouponEntity> entitiesToSave = new ArrayList<>();

        for (CouponEntity entity : couponEntitys) {
            CouponEntity newEntity = new CouponEntity();

            // Copy non-foreign fields using reflection
            for (Field field : CouponEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle branch_id foreign key
            if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
                newEntity.setBranchId(
                    fetchReferenceById(entity.getBranchId(), usersrepository, "Users not found")
                );
            }

            // Handle added_by_id foreign key
            if (entity.getAddedById() != null && entity.getAddedById().getId() != null) {
                newEntity.setAddedById(
                    fetchReferenceById(entity.getAddedById(), usersrepository, "Users not found")
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

        couponrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<CouponEntity> getCouponByValidityBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return couponrepository.findByValidityBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getCouponByValidityBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = couponrepository.findByValidityBetween(fromDate, toDate, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CouponEntity> getCouponByValidity(LocalDate validity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return couponrepository.findByValidity(validity);
    }

    @Override
    public List<CouponEntity> getCouponByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return couponrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCouponByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = couponrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<CouponEntity> getCouponByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return couponrepository.findByCreatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<CouponEntity> page = couponrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Coupons");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Amount");
            header.createCell(2).setCellValue("Applicable_on");
            header.createCell(3).setCellValue("Coupon_code");
            header.createCell(4).setCellValue("Coupon_name");
            header.createCell(5).setCellValue("Description");
            header.createCell(6).setCellValue("Display_on_screen");
            header.createCell(7).setCellValue("For_user");
            header.createCell(8).setCellValue("Is_delete");
            header.createCell(9).setCellValue("Logo");
            header.createCell(10).setCellValue("Max_discount");
            header.createCell(11).setCellValue("Min_order_value");
            header.createCell(12).setCellValue("Title");
            header.createCell(13).setCellValue("Type");
            header.createCell(14).setCellValue("Validity");
            header.createCell(15).setCellValue("Branch_id");
            header.createCell(16).setCellValue("Restaurant_id");
            header.createCell(17).setCellValue("Added_by_id");
            header.createCell(18).setCellValue("Global");
            header.createCell(19).setCellValue("Is_percent");
            header.createCell(20).setCellValue("Quantity");
            header.createCell(21).setCellValue("Usage_limit");
            header.createCell(22).setCellValue("Created_at");
            header.createCell(23).setCellValue("First_order");

            int rowNum = 1;
            for (CouponEntity couponEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(couponEntity.getId() != null ? couponEntity.getId() : 0);
//                row.createCell(1).setCellValue(couponEntity.getAmount() != null ? couponEntity.getAmount().doubleValue() : 0.0);
//                row.createCell(2).setCellValue(couponEntity.getApplicableOn() != null ? couponEntity.getApplicableOn() : "N/A");
                row.createCell(3).setCellValue(couponEntity.getCouponCode() != null ? couponEntity.getCouponCode() : "N/A");
                row.createCell(4).setCellValue(couponEntity.getCouponName() != null ? couponEntity.getCouponName() : "N/A");
                row.createCell(5).setCellValue(couponEntity.getDescription() != null ? couponEntity.getDescription() : "N/A");
                row.createCell(6).setCellValue(couponEntity.getDisplayOnScreen() != null && couponEntity.getDisplayOnScreen() ? "Active" : "Inactive");
//                row.createCell(7).setCellValue(couponEntity.getForUser() != null ? couponEntity.getForUser() : "N/A");
                row.createCell(8).setCellValue(couponEntity.getIsDelete() != null && couponEntity.getIsDelete() ? "Active" : "Inactive");
                row.createCell(9).setCellValue(couponEntity.getLogo() != null ? couponEntity.getLogo() : "N/A");
//                row.createCell(10).setCellValue(couponEntity.getMaxDiscount() != null ? couponEntity.getMaxDiscount().doubleValue() : 0.0);
//                row.createCell(11).setCellValue(couponEntity.getMinOrderValue() != null ? couponEntity.getMinOrderValue().doubleValue() : 0.0);
                row.createCell(12).setCellValue(couponEntity.getTitle() != null ? couponEntity.getTitle() : "N/A");
//                row.createCell(13).setCellValue(couponEntity.getType() != null ? couponEntity.getType() : "N/A");
                LocalDate validity = couponEntity.getValidity();
                String formattedValidity = (validity != null) ? validity.format(dateFormat) : "";
                row.createCell(14).setCellValue(formattedValidity);
                row.createCell(15).setCellValue(couponEntity.getBranchId() != null ? couponEntity.getBranchId().toString() : "N/A");
                row.createCell(16).setCellValue(couponEntity.getRestaurantId() != null ? couponEntity.getRestaurantId().toString() : "N/A");
                row.createCell(17).setCellValue(couponEntity.getAddedById() != null ? couponEntity.getAddedById().toString() : "N/A");
                row.createCell(18).setCellValue(couponEntity.getGlobal() != null && couponEntity.getGlobal() ? "Active" : "Inactive");
                row.createCell(19).setCellValue(couponEntity.getIsPercent() != null && couponEntity.getIsPercent() ? "Active" : "Inactive");
                row.createCell(20).setCellValue(couponEntity.getQuantity() != null ? couponEntity.getQuantity() : 0);
                row.createCell(21).setCellValue(couponEntity.getUsageLimit() != null ? couponEntity.getUsageLimit() : 0);
                LocalDateTime createdAt = couponEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(22).setCellValue(formattedCreatedAt);
                row.createCell(23).setCellValue(couponEntity.getFirstOrder() != null && couponEntity.getFirstOrder() ? "Active" : "Inactive");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
