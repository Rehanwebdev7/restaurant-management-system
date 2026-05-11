package com.rms.modules.admin.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.MenuSubcategoryRepository;
import com.rms.common.serviceImplement.MenuSubcategoryServiceIMP;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.FileUploadService;
import com.rms.configuration.Authorization;

import jakarta.transaction.Transactional;

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
import java.util.Objects;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Qualifier("admMenuSubcategoryService")
public class AdmMenuSubcategoryService implements MenuSubcategoryServiceIMP {

    private final MenuSubcategoryRepository menusubcategoryrepository;
    private final MenuCategoryRepository menucategoryrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
	private UsersRepository usersRepository;

	@Autowired
	private RestaurantBranchRepository restaurantBranchRepository;

	@Autowired
	private MenuCategoryRepository menuCategoryRepository;
	
	
	@Autowired
	private MenuSubcategoryRepository menuSubcategoryRepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	@Autowired
	private GoogleDriveUtil googleDriveUtil;

	@Autowired
	private FileUploadService fileUploadService;

    public AdmMenuSubcategoryService(MenuSubcategoryRepository menusubcategoryrepository, MenuCategoryRepository menucategoryrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
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

        // 🔐 Admin Authorization
        Authorization.authorizeAdmin(token);

        Specification<MenuSubcategoryEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // ================= SOFT DELETE =================
            predicates.add(cb.equal(root.get("isDeleted"), false));

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

            // ================= SEARCH FILTER =================
            if (searchValue != null && !searchValue.trim().isEmpty()) {

                String pattern = "%" + searchValue.toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();

                // 🔹 SUBCATEGORY FIELDS
                searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("description")), pattern));

                // 🔹 BOOLEAN isActive
                if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
                    searchPredicates.add(
                            cb.equal(root.get("isActive"), Boolean.valueOf(searchValue))
                    );
                }
                
           

                // ================= FOREIGN KEY SEARCH =================

                // 🔥 RESTAURANT (UsersEntity)
                Join<MenuSubcategoryEntity, UsersEntity> restaurantJoin =
                        root.join("restaurantId", JoinType.LEFT);

                searchPredicates.add(
                        cb.like(cb.lower(restaurantJoin.get("name")), pattern)
                );
                searchPredicates.add(
                        cb.like(cb.lower(restaurantJoin.get("email")), pattern)
                );
                searchPredicates.add(
                        cb.like(cb.lower(restaurantJoin.get("mobile")), pattern)
                );

                // 🔥 BRANCH (RestaurantBranchEntity)
                Join<MenuSubcategoryEntity, UsersEntity> branchJoin =
                        root.join("branchId", JoinType.LEFT);

                searchPredicates.add(
                        cb.like(cb.lower(branchJoin.get("name")), pattern)
                );

                // 🔥 MENU CATEGORY (MenuCategoryEntity)
                Join<MenuSubcategoryEntity, MenuCategoryEntity> categoryJoin =
                        root.join("menuCategoryId", JoinType.LEFT);

                searchPredicates.add(
                        cb.like(cb.lower(categoryJoin.get("name")), pattern)
                );

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }
            
//            // ================= ACTIVE FILTER (NEW) =================
//            if (isActive != null) {
//                predicates.add(cb.equal(root.get("isActive"), isActive));
//            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(pageNumber, pageSize,Sort.by(Sort.Direction.DESC, "id"));
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
    public String addMenuSubcategoryWithIcon(MultipartFile icon, String payloadJson, String token) throws Exception {

        // ================= TOKEN CHECK =================
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }
        Authorization.authorizeAdmin(token);

        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IllegalArgumentException("Payload cannot be empty");
        }

        // ================= JSON → ENTITY =================
        MenuSubcategoryEntity inputEntity = parseSubcategoryPayload(payloadJson);
        validateRequiredPayload(inputEntity);

        UsersEntity restaurant = resolveRestaurant(inputEntity.getRestaurantId().getId());
        UsersEntity branch = resolveBranch(inputEntity.getBranchId().getId(), restaurant);
        MenuCategoryEntity category = resolveCategory(inputEntity.getMenuCategoryId().getId(), restaurant, branch);

        // ================= CREATE ENTITY =================
        MenuSubcategoryEntity entity = new MenuSubcategoryEntity();

        // ================= COPY NON-NULL FIELDS =================
        for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);

            if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())
                    || field.getName().equals("id") || field.getName().equals("createdAt")
                    || field.getName().equals("updatedAt")) {
                continue;
            }

            Object value = field.get(inputEntity);
            if (value != null) {
                field.set(entity, value);
            }
        }

        // ================= SET VERIFIED IDS =================
        entity.setRestaurantId(restaurant);
        entity.setBranchId(branch);
        entity.setMenuCategoryId(category);
        entity.setIsDeleted(false);
        entity.setName(inputEntity.getName().trim());
        entity.setDescription(inputEntity.getDescription() == null ? null : inputEntity.getDescription().trim());
        entity.setUpdatedAt(LocalDateTime.now());

        MenuSubcategoryEntity savedEntity = menuSubcategoryRepository.save(entity);

        // ================= ICON UPLOAD =================
        if (icon != null && !icon.isEmpty()) {
            String iconUrl = storeSubcategoryIcon(icon, restaurant, branch, savedEntity.getId());
            savedEntity.setIconUrl(iconUrl);
            savedEntity.setUpdatedAt(LocalDateTime.now());
            menuSubcategoryRepository.save(savedEntity);
        }

        return "Menu subcategory added successfully";
    }
    
//    @Override
    public String updateMenuSubcategoryWithIcon(
            MenuSubcategoryEntity menu_subcategoryEntity,
            MultipartFile photo,
            String token
    ) throws Exception {

        Authorization.authorizeAdmin(token);

        MenuSubcategoryEntity existingEntity = menusubcategoryrepository
                .findById(menu_subcategoryEntity.getId())
                .orElseThrow(() -> new RuntimeException("MenuSubcategory not found"));

        // 🔹 1️⃣ Update non-foreign fields (same as before)
        for (Field field : MenuSubcategoryEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(menu_subcategoryEntity);

            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        if (menu_subcategoryEntity.getName() != null && menu_subcategoryEntity.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Subcategory name cannot be empty");
        }

        UsersEntity restaurant = existingEntity.getRestaurantId();
        if (menu_subcategoryEntity.getRestaurantId() != null
                && menu_subcategoryEntity.getRestaurantId().getId() != null) {
            restaurant = resolveRestaurant(menu_subcategoryEntity.getRestaurantId().getId());
            existingEntity.setRestaurantId(restaurant);
        }

        UsersEntity branch = existingEntity.getBranchId();
        if (menu_subcategoryEntity.getBranchId() != null
                && menu_subcategoryEntity.getBranchId().getId() != null) {
            branch = resolveBranch(menu_subcategoryEntity.getBranchId().getId(), restaurant);
            existingEntity.setBranchId(branch);
        } else if (branch != null && restaurant != null) {
            branch = resolveBranch(branch.getId(), restaurant);
            existingEntity.setBranchId(branch);
        }

        if (menu_subcategoryEntity.getMenuCategoryId() != null
                && menu_subcategoryEntity.getMenuCategoryId().getId() != null) {
            existingEntity.setMenuCategoryId(
                    resolveCategory(menu_subcategoryEntity.getMenuCategoryId().getId(), restaurant, branch)
            );
        } else if (existingEntity.getMenuCategoryId() != null && restaurant != null && branch != null) {
            existingEntity.setMenuCategoryId(
                    resolveCategory(existingEntity.getMenuCategoryId().getId(), restaurant, branch)
            );
        }

        if (menu_subcategoryEntity.getName() != null) {
            existingEntity.setName(menu_subcategoryEntity.getName().trim());
        }
        if (menu_subcategoryEntity.getDescription() != null) {
            existingEntity.setDescription(menu_subcategoryEntity.getDescription().trim());
        }

        // 🔹 5️⃣ MULTIPART LOGIC (icon replace)
        if (photo != null && !photo.isEmpty()) {
            if (existingEntity.getIconUrl() != null && !existingEntity.getIconUrl().isBlank()) {
                fileUploadService.deleteLocalFile(existingEntity.getIconUrl());
            }
            String iconPath = storeSubcategoryIcon(photo, existingEntity.getRestaurantId(), existingEntity.getBranchId(), existingEntity.getId());
            existingEntity.setIconUrl(iconPath);
        }

        existingEntity.setUpdatedAt(LocalDateTime.now());
        menusubcategoryrepository.save(existingEntity);
        return "Updated Successfully";
    }

    private MenuSubcategoryEntity parseSubcategoryPayload(String payloadJson) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(payloadJson, MenuSubcategoryEntity.class);
    }

    private void validateRequiredPayload(MenuSubcategoryEntity inputEntity) {
        if (inputEntity.getName() == null || inputEntity.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Subcategory name is mandatory");
        }

        if (inputEntity.getRestaurantId() == null || inputEntity.getRestaurantId().getId() == null) {
            throw new IllegalArgumentException("restaurantId is mandatory");
        }

        if (inputEntity.getBranchId() == null || inputEntity.getBranchId().getId() == null) {
            throw new IllegalArgumentException("branchId is mandatory");
        }

        if (inputEntity.getMenuCategoryId() == null || inputEntity.getMenuCategoryId().getId() == null) {
            throw new IllegalArgumentException("menuCategoryId is mandatory");
        }
    }

    private UsersEntity resolveRestaurant(Long restaurantId) {
        UsersEntity restaurant = usersRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!"restaurant".equalsIgnoreCase(restaurant.getRole())) {
            throw new IllegalArgumentException("Provided user is not a restaurant");
        }

        return restaurant;
    }

    private UsersEntity resolveBranch(Long branchId, UsersEntity restaurant) {
        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (!"branch".equalsIgnoreCase(branch.getRole())) {
            throw new IllegalArgumentException("Provided user is not a branch");
        }

        Long branchRestaurantId = branch.getParentId() != null ? branch.getParentId().getId() : null;
        if (restaurant != null && !Objects.equals(branchRestaurantId, restaurant.getId())) {
            throw new IllegalArgumentException("Selected branch does not belong to the selected restaurant");
        }

        return branch;
    }

    private MenuCategoryEntity resolveCategory(Long categoryId, UsersEntity restaurant, UsersEntity branch) {
        MenuCategoryEntity category = menuCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Menu category not found"));

        Long categoryRestaurantId = category.getRestaurantId() != null ? category.getRestaurantId().getId() : null;
        if (restaurant != null && !Objects.equals(categoryRestaurantId, restaurant.getId())) {
            throw new IllegalArgumentException("Selected category does not belong to the selected restaurant");
        }

        Long categoryBranchId = category.getBranchId() != null ? category.getBranchId().getId() : null;
        if (branch != null && !Objects.equals(categoryBranchId, branch.getId())) {
            throw new IllegalArgumentException("Selected category does not belong to the selected branch");
        }

        return category;
    }

    private String buildSubcategoryFolderPath(Long restaurantId, Long branchId, Long subcategoryId) {
        return String.format("restaurants/%d/branches/%d/menu-subcategories/%d", restaurantId, branchId, subcategoryId);
    }

    private String storeSubcategoryIcon(MultipartFile file, UsersEntity restaurant, UsersEntity branch, Long subcategoryId) throws IOException {
        String fileName = "menu_subcategory_" + subcategoryId;
        String folderPath = buildSubcategoryFolderPath(restaurant.getId(), branch.getId(), subcategoryId);
        return fileUploadService.uploadFile(file, fileName, folderPath, driveUrl -> { });
    }



    @Override
    public List<MenuSubcategoryEntity> getAllRecordMenuSubcategory(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return menusubcategoryrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMenuSubcategory(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        return menusubcategoryrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuSubcategory not found"));
    }

    @Override
    public String addMenuSubcategory(MenuSubcategoryEntity menu_subcategoryEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
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
    @Transactional
    public String deleteMenuSubcategory(Long id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        if (!menusubcategoryrepository.existsById(id)) {
            throw new RuntimeException("MenuSubcategory not found");
        }
        // Cascade delete: remove all menu items under this subcategory first
        List<MenuItemsEntity> items = menuItemsRepository.findByMenuSubcategoryId_Id(id);
        if (!items.isEmpty()) {
            menuItemsRepository.deleteAll(items);
        }
        menusubcategoryrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuSubcategory(List<MenuSubcategoryEntity> menu_subcategoryEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menusubcategoryrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuSubcategoryByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return menusubcategoryrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<MenuSubcategoryEntity> getMenuSubcategoryByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return menusubcategoryrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getMenuSubcategoryByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
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
