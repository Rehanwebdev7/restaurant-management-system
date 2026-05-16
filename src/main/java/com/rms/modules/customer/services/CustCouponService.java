package com.rms.modules.customer.services;

import com.rms.common.entities.CouponEntity;
import com.rms.common.entities.CouponMappingEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.repositories.CouponRepository;
import com.rms.common.repositories.CouponMappingRepository;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.serviceImplement.CouponServiceIMP;
import com.rms.common.util.AES256Util;
import com.rms.common.util.CouponManagementUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.UsersRepository;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
import java.math.BigDecimal;

@Service
@Qualifier("custCouponService")
public class CustCouponService implements CouponServiceIMP {

    private final CouponRepository couponrepository;
    private final UsersRepository usersrepository;
    private final CustomersRepository customersrepository;
    private final MenuItemsRepository menuItemsRepository;
    private final CouponMappingRepository couponMappingRepository;

    public CustCouponService(CouponRepository couponrepository, UsersRepository usersrepository,
                             CustomersRepository customersrepository, MenuItemsRepository menuItemsRepository,
                             CouponMappingRepository couponMappingRepository) {
        this.couponrepository = couponrepository;
        this.usersrepository = usersrepository;
        this.customersrepository = customersrepository;
        this.menuItemsRepository = menuItemsRepository;
        this.couponMappingRepository = couponMappingRepository;
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
        Authorization.authorizeCustomer(token);
        return couponrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCoupon(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
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
        Authorization.authorizeCustomer(token);
        return couponrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    @Override
    public String addCoupon(CouponEntity couponEntity, String token) throws Exception {
        Authorization.authorizeCustomer(token);
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
        Authorization.authorizeCustomer(token);
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
        Authorization.authorizeCustomer(token);
        if (!couponrepository.existsById(id)) {
            throw new RuntimeException("Coupon not found");
        }
        couponrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCoupon(List<CouponEntity> couponEntitys, String token) throws Exception {
        Authorization.authorizeCustomer(token);
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
        Authorization.authorizeCustomer(token);
        return couponrepository.findByValidityBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getCouponByValidityBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
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
        Authorization.authorizeCustomer(token);
        return couponrepository.findByValidity(validity);
    }

    @Override
    public List<CouponEntity> getCouponByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCustomer(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return couponrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCouponByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCustomer(token);
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
        Authorization.authorizeCustomer(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return couponrepository.findByCreatedAt(dateTime);
    }


    @Override
    public Map<String, Object> getAvailableCoupons(Map<String, Object> requestBody, String token) throws Exception {
        Authorization.authorizeCustomer(token);

        // Extract request data
        Integer branchIdInt = (Integer) requestBody.get("branchId");
        Long branchId = branchIdInt.longValue();
        List<Integer> menuItemIds = (List<Integer>) requestBody.get("menuItemId");
        LocalDate today = LocalDate.now();

        // 1. Global coupons
        List<CouponEntity> globalCoupons = couponrepository.findGlobalCoupons(branchId, today);

        // 2. Suggested coupons (from menu item mappings)
        List<CouponEntity> suggestedCoupons = new ArrayList<>();
        if (menuItemIds != null && !menuItemIds.isEmpty()) {
            suggestedCoupons = couponrepository.findSuggestedCoupons(menuItemIds, branchId, today);
        }

        // 3. First order coupons - decrypt token to get customerId
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        Long customerId = tokenData.getLong("id");

        CustomersEntity customer = customersrepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        List<CouponEntity> firstOrderCoupons = new ArrayList<>();
        if (Boolean.TRUE.equals(customer.getIsFirstOrder())) {
            firstOrderCoupons = couponrepository.findFirstOrderCoupons(branchId, today);
        }

        // Build response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("global", globalCoupons.stream().map(this::convertCouponToMap).collect(Collectors.toList()));
        response.put("suggested", suggestedCoupons.stream().map(this::convertCouponToMap).collect(Collectors.toList()));
        response.put("firstOrder", firstOrderCoupons.stream().map(this::convertCouponToMap).collect(Collectors.toList()));

        return response;
    }

    private Map<String, Object> convertCouponToMap(CouponEntity c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("couponName", c.getCouponName());
        map.put("couponCode", c.getCouponCode());
        map.put("discountAmount", c.getDiscountAmount());
        map.put("validity", c.getValidity());
        map.put("displayOnScreen", c.getDisplayOnScreen());
        map.put("logo", c.getLogo());
        map.put("description", c.getDescription());
        map.put("title", c.getTitle());
        map.put("isPercent", c.getIsPercent());
        map.put("global", c.getGlobal());
        map.put("usageLimit", c.getUsageLimit());
        map.put("firstOrder", c.getFirstOrder());
        map.put("quantity", c.getQuantity());
        return map;
    }

    @Override
    public Map<String, Object> applyCoupon(Map<String, Object> requestBody, String token) throws Exception {
        Authorization.authorizeCustomer(token);

        // Extract couponCode from request
        String couponCode = requestBody.get("couponCode") != null
                ? requestBody.get("couponCode").toString().trim() : null;

        // Extract item qty map from request
        Map<Integer, Integer> itemQtyMap = CouponManagementUtil.extractMenuItemIdsWithQty(requestBody);

        // Extract customerId from token
        String decryptedToken = AES256Util.decrypt(token);
        JSONObject tokenData = new JSONObject(decryptedToken);
        Long customersId = tokenData.getLong("id");

        return applyCoupon(couponCode, itemQtyMap, customersId);
    }

    public Map<String, Object> applyCoupon(String couponCode, Map<Integer, Integer> itemQtyMap, Long customersId) throws Exception {

        System.out.println("\n==================== APPLY COUPON START ====================");
        System.out.println("🎟 Coupon Code  : " + couponCode);
        System.out.println("🧾 Item Qty Map : " + itemQtyMap);
        System.out.println("👤 Customer ID  : " + customersId);

        if (couponCode == null || couponCode.isEmpty()) {
            throw new RuntimeException("Coupon code is required");
        }
        if (itemQtyMap == null || itemQtyMap.isEmpty()) {
            throw new RuntimeException("Menu item IDs are required");
        }

        // Convert Integer keys to Long for DB queries
        Map<Long, Integer> qtyMap = itemQtyMap.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().longValue(), Map.Entry::getValue));
        List<Long> menuItemIds = new ArrayList<>(qtyMap.keySet());

        // Step 1: Fetch and validate coupon
        LocalDate today = LocalDate.now();
        CouponEntity coupon = couponrepository.findValidCouponByCode(couponCode, today)
                .orElseThrow(() -> new RuntimeException("Coupon not found or expired or not available"));

        CouponManagementUtil.validateCoupon(coupon);

        boolean isPercent = Boolean.TRUE.equals(coupon.getIsPercent());
        BigDecimal discountAmount = coupon.getDiscountAmount() != null ? coupon.getDiscountAmount() : BigDecimal.ZERO;
        Integer couponQty = coupon.getQuantity();

        System.out.println("📊 Coupon Qty Cap : " + couponQty);

        // Step 2: Fetch menu items and calculate menuTotal WITH quantities (full cart total)
        List<MenuItemsEntity> menuItems = menuItemsRepository.findAllById(menuItemIds);
        if (menuItems.isEmpty()) {
            throw new RuntimeException("No valid menu items found");
        }
        BigDecimal menuTotal = CouponManagementUtil.calculateMenuTotalWithQty(menuItems, qtyMap);

        // Step 3: Determine coupon type and calculate discount

        // CASE 1: First Order Coupon
        if (Boolean.TRUE.equals(coupon.getFirstOrder())) {
            System.out.println("\n🏷 CASE 1: First Order Coupon");

            CustomersEntity customer = customersrepository.findById(customersId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            if (!Boolean.TRUE.equals(customer.getIsFirstOrder())) {
                throw new RuntimeException("First order coupon not applicable");
            }

            // Eligible total = per-item qty capped by coupon quantity
            BigDecimal eligibleTotal = CouponManagementUtil.calculateEligibleTotal(menuItems, qtyMap, couponQty);
            BigDecimal discount = CouponManagementUtil.calculateDiscount(eligibleTotal, discountAmount, isPercent);
            BigDecimal paybleAmount = CouponManagementUtil.calculatePayable(menuTotal, discount);
            System.out.println("==================== APPLY COUPON END ====================\n");
            return CouponManagementUtil.buildCouponApplyResponse(menuTotal, eligibleTotal, discount, paybleAmount, discountAmount, isPercent,true);
        }

        // CASE 2: Global Coupon
        if (Boolean.TRUE.equals(coupon.getGlobal())) {
            System.out.println("\n🌍 CASE 2: Global Coupon");

            // Eligible total = per-item qty capped by coupon quantity
            BigDecimal eligibleTotal = CouponManagementUtil.calculateEligibleTotal(menuItems, qtyMap, couponQty);
            BigDecimal discount = CouponManagementUtil.calculateDiscount(eligibleTotal, discountAmount, isPercent);
            BigDecimal paybleAmount = CouponManagementUtil.calculatePayable(menuTotal, discount);
            System.out.println("==================== APPLY COUPON END ====================\n");
            return CouponManagementUtil.buildCouponApplyResponse(menuTotal, eligibleTotal, discount, paybleAmount, discountAmount, isPercent,false);
        }

        // CASE 3: Item-wise Coupon (not global, not firstOrder)
        System.out.println("\n📋 CASE 3: Item-wise Coupon");

        List<CouponMappingEntity> couponMappings = couponMappingRepository.findByCouponId_Id(coupon.getId());

        if (couponMappings == null || couponMappings.isEmpty()) {
            System.out.println("⚠ No coupon mappings found — no discount");
            System.out.println("==================== APPLY COUPON END ====================\n");
            return CouponManagementUtil.buildCouponApplyResponse(menuTotal, BigDecimal.ZERO, BigDecimal.ZERO, menuTotal, discountAmount, isPercent,false);
        }

        List<Long> matchedItemIds = CouponManagementUtil.getMatchedItemIds(menuItemIds, couponMappings);

        if (matchedItemIds.isEmpty()) {
            System.out.println("⚠ No matched items — no discount");
            System.out.println("==================== APPLY COUPON END ====================\n");
            return CouponManagementUtil.buildCouponApplyResponse(menuTotal, BigDecimal.ZERO, BigDecimal.ZERO, menuTotal, discountAmount, isPercent,false);
        }

        // Eligible total = matched items with per-item qty capped by coupon quantity
        BigDecimal eligibleTotal = CouponManagementUtil.calculateMatchedEligibleTotal(menuItems, matchedItemIds, qtyMap, couponQty);

        // Discount is calculated on eligible total only
        BigDecimal discount = CouponManagementUtil.calculateDiscount(eligibleTotal, discountAmount, isPercent);

        // Final payable = Full Menu Total - Discount
        BigDecimal paybleAmount = menuTotal.subtract(discount);
        if (paybleAmount.compareTo(BigDecimal.ZERO) < 0) {
            paybleAmount = BigDecimal.ZERO;
        }

        System.out.println("==================== APPLY COUPON END ====================\n");
        return CouponManagementUtil.buildCouponApplyResponse(menuTotal, eligibleTotal, discount, paybleAmount, discountAmount, isPercent,false);
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
