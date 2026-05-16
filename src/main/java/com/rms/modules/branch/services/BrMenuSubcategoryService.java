package com.rms.modules.branch.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.MenuSubcategoryRepository;
import com.rms.common.serviceImplement.MenuSubcategoryServiceIMP;
import com.rms.common.util.FileUploadService;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.MenuCategoryRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
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

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;


@Service
@Qualifier("brMenuSubcategoryService")
public class BrMenuSubcategoryService implements MenuSubcategoryServiceIMP {

    private final MenuSubcategoryRepository menusubcategoryrepository;
    private final MenuCategoryRepository menucategoryrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    

   	@Autowired
   	private RestaurantBranchRepository restaurantBranchRepository;

   	@Autowired
   	private MenuCategoryRepository menuCategoryRepository;
   	
   	
   	@Autowired
   	private MenuSubcategoryRepository menuSubcategoryRepository;

   	@Autowired
   	private MenuItemsRepository menuItemsRepository;

   	@Autowired
   	private TokenUtil tokenUtil;
   	
   	@Autowired
   	private GoogleDriveUtil googleDriveUtil;

   	@Autowired
   	private FileUploadService fileUploadService;

    @Autowired
    private UsersRepository usersRepository;
    public BrMenuSubcategoryService(MenuSubcategoryRepository menusubcategoryrepository, MenuCategoryRepository menucategoryrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
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
    
    public Map<String, Object> getMenuSubcategoriesWithFilters(
            LocalDate fromDate,
            LocalDate toDate,
            Boolean isActive,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token
    ) throws Exception {

        // 🔐 BRANCH AUTH
        Authorization.authorizeBranch(token);

        // ================= TOKEN =================
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        // ================= BRANCH USER =================
        UsersEntity branchUser = usersRepository.findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (branchUser.getParentId() == null) {
            throw new RuntimeException("Restaurant (parent) not found for branch");
        }

        UsersEntity restaurantUser = branchUser.getParentId();

        Specification<MenuSubcategoryEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // ================= JOINS =================
            Join<MenuSubcategoryEntity, UsersEntity> branchJoin =
                    root.join("branchId", JoinType.LEFT);

            Join<UsersEntity, UsersEntity> parentJoin =
                    branchJoin.join("parentId", JoinType.LEFT);

            Join<MenuSubcategoryEntity, MenuCategoryEntity> categoryJoin =
                    root.join("menuCategoryId", JoinType.LEFT);

            // ================= SOFT DELETE =================
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // ================= BRANCH FILTER =================
            predicates.add(cb.equal(branchJoin.get("id"), branchUser.getId()));

            // ================= RESTAURANT FILTER (PARENT) =================
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
         // Active filter (outside search block)
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            // ================= SEARCH =================
            if (searchValue != null && !searchValue.trim().isEmpty()) {

                String pattern = "%" + searchValue.toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();

                // Subcategory fields
                searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("description")), pattern));

                // Boolean
                if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
                    searchPredicates.add(
                            cb.equal(root.get("isActive"), Boolean.valueOf(searchValue))
                    );
                }

                // Branch name
                searchPredicates.add(
                        cb.like(cb.lower(branchJoin.get("name")), pattern)
                );

                // Category name
                searchPredicates.add(
                        cb.like(cb.lower(categoryJoin.get("name")), pattern)
                );

                // Restaurant name (parent)
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

        Page<MenuSubcategoryEntity> page =
                menuSubcategoryRepository.findAll(spec, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }
    
    
    @Transactional
    public String addMenuSubcategoryWithIcon(
            MultipartFile icon,
            String payloadJson,
            String token
    ) throws Exception {

        // ================= TOKEN CHECK =================
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }

        // 🔐 BRANCH AUTH
        Authorization.authorizeBranch(token);

        // ================= TOKEN DECRYPT =================
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IllegalArgumentException("Payload cannot be empty");
        }

        // ================= JSON → ENTITY =================
        ObjectMapper mapper = new ObjectMapper();
        MenuSubcategoryEntity inputEntity =
                mapper.readValue(payloadJson, MenuSubcategoryEntity.class);

        // ================= MENU CATEGORY REQUIRED =================
        if (inputEntity.getMenuCategoryId() == null
                || inputEntity.getMenuCategoryId().getId() == null) {
            throw new IllegalArgumentException("menuCategoryId is mandatory");
        }

        // ================= FETCH BRANCH FROM TOKEN =================
        UsersEntity branch =
                usersRepository.findById(currentUserId.longValue())
                        .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (branch.getParentId() == null) {
            throw new RuntimeException("Restaurant (parent) not found");
        }

        UsersEntity restaurant = branch.getParentId();

        // ================= VALIDATE MENU CATEGORY =================
        MenuCategoryEntity category =
                menuCategoryRepository.findById(
                        inputEntity.getMenuCategoryId().getId()
                ).orElseThrow(() -> new RuntimeException("Menu category not found"));

        // 🔥 CATEGORY MUST BELONG TO SAME RESTAURANT
        if (!category.getRestaurantId().getId()
                .equals(restaurant.getId())) {
            throw new SecurityException(
                    "Menu category does not belong to this restaurant"
            );
        }

        // ================= CREATE ENTITY =================
        MenuSubcategoryEntity entity = new MenuSubcategoryEntity();

        // ================= COPY NON-NULL FIELDS =================
        for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);

            if (Modifier.isStatic(field.getModifiers())
                    || Modifier.isFinal(field.getModifiers())
                    || field.getName().equals("id")
                    || field.getName().equals("createdAt")
                    || field.getName().equals("updatedAt")
                    || field.getName().endsWith("Id")) {
                continue;
            }

            Object value = field.get(inputEntity);
            if (value != null) {
                field.set(entity, value);
            }
        }

        // ================= SET VERIFIED DATA =================
        entity.setBranchId(branch);
        entity.setRestaurantId(restaurant);
        entity.setMenuCategoryId(category);
        entity.setIsDeleted(false);

        MenuSubcategoryEntity savedEntity =
                menuSubcategoryRepository.save(entity);

        // ================= ICON UPLOAD =================
        if (icon != null && !icon.isEmpty()) {

            String fileName = "menu_subcategory_" + savedEntity.getId();
            // old: String iconUrl = googleDriveUtil.uploadFile(icon, fileName, "menu_subcategories");
            final Long _entityId = savedEntity.getId();
            String iconUrl = fileUploadService.uploadFile(icon, fileName, "menu_subcategories",
                driveUrl -> menuSubcategoryRepository.updateDriveIconUrl(_entityId, driveUrl));

            savedEntity.setIconUrl(iconUrl);
            savedEntity.setUpdatedAt(LocalDateTime.now());
            menuSubcategoryRepository.save(savedEntity);
        }

        return "Menu subcategory added successfully";
    }

    @Transactional
    public String updateMenuSubcategoryWithIcon(
            MenuSubcategoryEntity inputEntity,
            MultipartFile photo,
            String token
    ) throws Exception {

        // ================= TOKEN =================
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }

        // 🔐 BRANCH AUTH
        Authorization.authorizeBranch(token);

        // ================= TOKEN DECRYPT =================
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        if (inputEntity.getId() == null) {
            throw new IllegalArgumentException("MenuSubcategory id is mandatory");
        }

        // ================= FETCH BRANCH FROM TOKEN =================
        UsersEntity branch =
                usersRepository.findById(currentUserId.longValue())
                        .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (branch.getParentId() == null) {
            throw new RuntimeException("Restaurant (parent) not found");
        }

        UsersEntity restaurant = branch.getParentId();

        // ================= FETCH EXISTING =================
        MenuSubcategoryEntity existingEntity =
                menusubcategoryrepository.findById(inputEntity.getId())
                        .orElseThrow(() -> new RuntimeException("MenuSubcategory not found"));

        // 🔥 SECURITY: SAME BRANCH + SAME RESTAURANT
        if (!existingEntity.getBranchId().getId().equals(branch.getId())
                || !existingEntity.getRestaurantId().getId().equals(restaurant.getId())) {

            throw new SecurityException("Unauthorized update attempt");
        }

        // ================= UPDATE NON-FK FIELDS =================
        for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);

            if (Modifier.isStatic(field.getModifiers())
                    || Modifier.isFinal(field.getModifiers())
                    || field.getName().equals("id")
                    || field.getName().equals("createdAt")
                    || field.getName().equals("updatedAt")
                    || field.getName().endsWith("Id")) {
                continue;
            }

            Object value = field.get(inputEntity);
            if (value != null) {
                field.set(existingEntity, value);
            }
        }

        // ================= MENU CATEGORY (OPTIONAL) =================
        if (inputEntity.getMenuCategoryId() != null
                && inputEntity.getMenuCategoryId().getId() != null) {

            MenuCategoryEntity category =
                    menucategoryrepository.findById(
                            inputEntity.getMenuCategoryId().getId()
                    ).orElseThrow(() -> new RuntimeException("Menu category not found"));

            // 🔥 CATEGORY MUST BELONG TO SAME RESTAURANT
            if (!category.getRestaurantId().getId()
                    .equals(restaurant.getId())) {
                throw new SecurityException("Invalid menu category");
            }

            existingEntity.setMenuCategoryId(category);
        }

        // ================= FORCE VERIFIED IDS =================
        existingEntity.setBranchId(branch);
        existingEntity.setRestaurantId(restaurant);
        existingEntity.setUpdatedAt(LocalDateTime.now());

        // ================= ICON UPDATE =================
        if (photo != null && !photo.isEmpty()) {

            String fileName = "menu_subcategory_" + existingEntity.getId();
            // old: String iconPath = googleDriveUtil.uploadFile(photo, fileName, "menu_subcategories");
            final Long _entityId = existingEntity.getId();
            String iconPath = fileUploadService.uploadFile(photo, fileName, "menu_subcategories",
                driveUrl -> menusubcategoryrepository.updateDriveIconUrl(_entityId, driveUrl));

            existingEntity.setIconUrl(iconPath);
        }

        menusubcategoryrepository.save(existingEntity);

        return "Menu subcategory updated successfully";
    }


    @Override
    public List<MenuSubcategoryEntity> getAllRecordMenuSubcategory(String token) throws Exception {
        Authorization.authorizeBranch(token);
        return menusubcategoryrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMenuSubcategory(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
        return menusubcategoryrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuSubcategory not found"));
    }

    @Override
    public String addMenuSubcategory(MenuSubcategoryEntity menu_subcategoryEntity, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
        if (!menusubcategoryrepository.existsById(id)) {
            throw new RuntimeException("MenuSubcategory not found");
        }

        long itemCount = menuItemsRepository.countByMenuSubcategoryId_IdAndIsDeletedFalse(id);
        if (itemCount > 0) {
            throw new RuntimeException("Cannot delete subcategory: " + itemCount
                    + " menu item(s) are still mapped under it. Remove or reassign the items first.");
        }

        menusubcategoryrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuSubcategory(List<MenuSubcategoryEntity> menu_subcategoryEntitys, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menusubcategoryrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuSubcategoryByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return menusubcategoryrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<MenuSubcategoryEntity> getMenuSubcategoryByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menusubcategoryrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuSubcategoryByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
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
