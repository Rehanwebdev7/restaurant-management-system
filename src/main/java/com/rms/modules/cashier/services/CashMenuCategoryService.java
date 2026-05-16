package com.rms.modules.cashier.services;

import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.MenuCategoryRepository;
import com.rms.common.serviceImplement.MenuCategoryServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Qualifier("cashMenuCategoryService")
public class CashMenuCategoryService implements MenuCategoryServiceIMP {

    private final MenuCategoryRepository menucategoryrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private MenuCategoryRepository menuCategoryRepository;
    
    @Autowired
    private TokenUtil tokenUtil;

    public CashMenuCategoryService(MenuCategoryRepository menucategoryrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
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
    
    
    public Map<String, Object> getMenuCategoriesWithFilters(
            LocalDate fromDate,
            LocalDate toDate,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token
    ) throws Exception {

        // 🔐 CASHIER AUTH
        Authorization.authorizeCashier(token);

        // 🔓 TOKEN
        tokenUtil.decryptAndStoreToken(token);
        Integer cashierId = tokenUtil.getCurrentUserId();

        // ================= CASHIER =================
        UsersEntity cashier = usersRepository.findById(cashierId.longValue())
                .orElseThrow(() -> new RuntimeException("Cashier not found from token"));

        // ================= BRANCH =================
        UsersEntity branchUser = cashier.getBranchId();
        if (branchUser == null) {
            throw new RuntimeException("Branch not mapped with cashier");
        }

        // ================= RESTAURANT =================
        UsersEntity restaurantUser = branchUser.getParentId();
        if (restaurantUser == null) {
            throw new RuntimeException("Restaurant not mapped with branch");
        }

        Specification<MenuCategoryEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // ================= JOINS =================
            Join<MenuCategoryEntity, UsersEntity> branchJoin =
                    root.join("branchId", JoinType.LEFT);

            Join<UsersEntity, UsersEntity> parentJoin =
                    branchJoin.join("parentId", JoinType.LEFT);

            // ================= SOFT DELETE =================
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // ================= BRANCH FILTER (FROM CASHIER) =================
            predicates.add(cb.equal(branchJoin.get("id"), branchUser.getId()));

            // ================= RESTAURANT FILTER =================
            predicates.add(cb.equal(parentJoin.get("id"), restaurantUser.getId()));

            // ================= DATE FILTER =================
            if (fromDate != null && toDate != null) {
                predicates.add(
                        cb.between(
                                root.get("createdAt"),
                                fromDate.atStartOfDay(),
                                toDate.atTime(LocalTime.MAX)
                        )
                );
            }

            // ================= SEARCH =================
            if (searchValue != null && !searchValue.trim().isEmpty()) {

                String pattern = "%" + searchValue.toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();

                searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("description")), pattern));

                // Integer fields
                try {
                    Integer priority = Integer.valueOf(searchValue);
                    searchPredicates.add(cb.equal(root.get("priority"), priority));
                } catch (Exception ignored) {}

                // Decimal fields
                try {
                    BigDecimal tax = new BigDecimal(searchValue);
                    searchPredicates.add(cb.equal(root.get("taxPercentage"), tax));
                } catch (Exception ignored) {}

                // Boolean
                if (searchValue.equalsIgnoreCase("true")
                        || searchValue.equalsIgnoreCase("false")) {
                    searchPredicates.add(
                            cb.equal(root.get("isActive"),
                                    Boolean.valueOf(searchValue))
                    );
                }

                // Branch name
                searchPredicates.add(
                        cb.like(cb.lower(branchJoin.get("name")), pattern)
                );

                // Restaurant name
                searchPredicates.add(
                        cb.like(cb.lower(parentJoin.get("name")), pattern)
                );

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(
                Math.max(pageNumber, 0),
                pageSize
        );

        Page<MenuCategoryEntity> page =
                menuCategoryRepository.findAll(spec, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }


//    @Override
//    public List<MenuCategoryEntity> getAllRecordMenuCategory(String token) throws Exception {
//        Authorization.authorizeCashier(token);
//        return menucategoryrepository.findAll();
//    }
    @Override
    @Transactional(readOnly = true)
    public List<MenuCategoryEntity> getAllRecordMenuCategory(String token) throws Exception {

        // 🔐 CASHIER AUTH
        Authorization.authorizeCashier(token);

        // 🔓 TOKEN DATA
        tokenUtil.decryptAndStoreToken(token);
        Integer cashierId = tokenUtil.getCurrentUserId();
        tokenUtil.clearTokenData();

        // ================= CASHIER =================
        UsersEntity cashier = usersRepository.findById(cashierId.longValue())
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

        // ================= BRANCH =================
        UsersEntity branch = cashier.getBranchId();
        if (branch == null) {
            throw new RuntimeException("Branch not mapped with cashier");
        }

        // ================= FETCH ACTIVE CATEGORIES ONLY =================
        List<MenuCategoryEntity> categories =
                menucategoryrepository
                        .findByBranchId_IdAndIsActiveTrueAndIsDeletedFalse(
                                branch.getId()
                        );

        if (categories.isEmpty()) {
            throw new RuntimeException("No active menu categories found for this branch");
        }

        return categories;
    }


    @Override
    public Map<String, Object> getAllMenuCategory(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = menucategoryrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public MenuCategoryEntity getOneMenuCategory(Long id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return menucategoryrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuCategory not found"));
    }

    @Override
    public String addMenuCategory(MenuCategoryEntity menu_categoryEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        MenuCategoryEntity newEntity = new MenuCategoryEntity();

        // Copy non-foreign fields using reflection
        for (Field field : MenuCategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_categoryEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (menu_categoryEntity.getBranchId() != null && menu_categoryEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(menu_categoryEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (menu_categoryEntity.getRestaurantId() != null && menu_categoryEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(menu_categoryEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        menucategoryrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateMenuCategory(MenuCategoryEntity menu_categoryEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        MenuCategoryEntity existingEntity = menucategoryrepository.findById(menu_categoryEntity.getId())
                .orElseThrow(() -> new RuntimeException("MenuCategory not found"));

        // Update non-foreign fields using reflection
        for (Field field : MenuCategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_categoryEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (menu_categoryEntity.getBranchId() != null && menu_categoryEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(menu_categoryEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        // Handle restaurant_id foreign key
        if (menu_categoryEntity.getRestaurantId() != null && menu_categoryEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(menu_categoryEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        menucategoryrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteMenuCategory(Long id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!menucategoryrepository.existsById(id)) {
            throw new RuntimeException("MenuCategory not found");
        }
        menucategoryrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuCategory(List<MenuCategoryEntity> menu_categoryEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
        List<MenuCategoryEntity> entitiesToSave = new ArrayList<>();

        for (MenuCategoryEntity entity : menu_categoryEntitys) {
            MenuCategoryEntity newEntity = new MenuCategoryEntity();

            // Copy non-foreign fields using reflection
            for (Field field : MenuCategoryEntity.class.getDeclaredFields()) {
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

        menucategoryrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<MenuCategoryEntity> getMenuCategoryByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menucategoryrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuCategoryByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = menucategoryrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<MenuCategoryEntity> getMenuCategoryByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return menucategoryrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<MenuCategoryEntity> getMenuCategoryByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menucategoryrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuCategoryByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = menucategoryrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<MenuCategoryEntity> getMenuCategoryByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return menucategoryrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<MenuCategoryEntity> page = menucategoryrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("MenuCategorys");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Restaurant_id");
            header.createCell(2).setCellValue("Branch_id");
            header.createCell(3).setCellValue("Name");
            header.createCell(4).setCellValue("Description");
            header.createCell(5).setCellValue("Priority");
            header.createCell(6).setCellValue("Is_active");
            header.createCell(7).setCellValue("Is_deleted");
            header.createCell(8).setCellValue("Icon_url");
            header.createCell(9).setCellValue("Tax_percentage");
            header.createCell(10).setCellValue("Created_at");
            header.createCell(11).setCellValue("Updated_at");

            int rowNum = 1;
            for (MenuCategoryEntity menu_categoryEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(menu_categoryEntity.getId() != null ? menu_categoryEntity.getId() : 0);
                row.createCell(1).setCellValue(menu_categoryEntity.getRestaurantId() != null ? menu_categoryEntity.getRestaurantId().toString() : "N/A");
                row.createCell(2).setCellValue(menu_categoryEntity.getBranchId() != null ? menu_categoryEntity.getBranchId().toString() : "N/A");
                row.createCell(3).setCellValue(menu_categoryEntity.getName() != null ? menu_categoryEntity.getName() : "N/A");
                row.createCell(4).setCellValue(menu_categoryEntity.getDescription() != null ? menu_categoryEntity.getDescription() : "N/A");
                row.createCell(5).setCellValue(menu_categoryEntity.getPriority() != null ? menu_categoryEntity.getPriority() : 0);
                row.createCell(6).setCellValue(menu_categoryEntity.getIsActive() != null && menu_categoryEntity.getIsActive() ? "Active" : "Inactive");
                row.createCell(7).setCellValue(menu_categoryEntity.getIsDeleted() != null && menu_categoryEntity.getIsDeleted() ? "Active" : "Inactive");
                row.createCell(8).setCellValue(menu_categoryEntity.getIconUrl() != null ? menu_categoryEntity.getIconUrl() : "N/A");
                row.createCell(9).setCellValue(menu_categoryEntity.getTaxPercentage() != null ? menu_categoryEntity.getTaxPercentage().doubleValue() : 0.0);
                LocalDateTime createdAt = menu_categoryEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(10).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = menu_categoryEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
