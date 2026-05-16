package com.rms.modules.branch.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.AddonsEntity;
import com.rms.common.entities.AddonsItemsEntity;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.common.util.FileUploadService;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.AddonsRepository;
import com.rms.common.repositories.AddonsItemsRepository;
import com.rms.common.repositories.MenuCategoryRepository;
import com.rms.common.repositories.MenuSubcategoryRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import java.math.BigDecimal;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Qualifier("brMenuItemsService")
public class BrMenuItemsService implements MenuItemsServiceIMP {

    private final MenuItemsRepository menuitemsrepository;
    private final AddonsRepository addonsrepository;
    private final MenuCategoryRepository menucategoryrepository;
    private final MenuSubcategoryRepository menusubcategoryrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
   	private GoogleDriveUtil googleDriveUtil;

   	@Autowired
   	private FileUploadService fileUploadService;



   	@Autowired
   	private MenuCategoryRepository menuCategoryRepository;

   	@Autowired
   	private MenuSubcategoryRepository menuSubcategoryRepository;

   	@Autowired
   	private MenuItemsRepository menuItemsRepository;

   	@Autowired
   	private RestaurantBranchRepository restaurantBranchRepository;

   	@Autowired
   	private AddonsRepository addonsRepository;

   	@Autowired
   	private AddonsItemsRepository addonsItemsRepository;

   	@Autowired
   	private TokenUtil tokenUtil;
    
    @Autowired 
    private UsersRepository usersRepository;

    public BrMenuItemsService(MenuItemsRepository menuitemsrepository, AddonsRepository addonsrepository, MenuCategoryRepository menucategoryrepository, MenuSubcategoryRepository menusubcategoryrepository, RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
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
    
    @Transactional(rollbackFor = Exception.class)
    public String updateMultipleMenuItems(
            List<MenuItemsEntity> menuItemsEntities,
            String token
    ) throws Exception {

        // 🔐 Branch Authorization
        Authorization.authorizeBranch(token);

        // 🔓 TOKEN → BRANCH
        tokenUtil.decryptAndStoreToken(token);
        Integer currentBranchId = tokenUtil.getCurrentUserId();

        UsersEntity branch =
                usersrepository.findById(currentBranchId.longValue())
                        .orElseThrow(() -> new RuntimeException("Branch not found"));

        // 🔥 RESTAURANT = parentId of branch
        if (branch.getParentId() == null) {
            throw new RuntimeException("Restaurant (parent) not found for this branch");
        }

        UsersEntity restaurant =
                usersrepository.findById(branch.getParentId().getId())
                        .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        List<MenuItemsEntity> entitiesToSave = new ArrayList<>();

        for (MenuItemsEntity entity : menuItemsEntities) {

            if (entity.getId() == null) {
                throw new RuntimeException("MenuItem id is required for update");
            }

            // 🔎 EXISTING RECORD
            MenuItemsEntity existingEntity =
                    menuitemsrepository.findById(entity.getId())
                            .orElseThrow(() ->
                                    new RuntimeException("MenuItem not found with id: " + entity.getId())
                            );

            // 🚨 SECURITY CHECK (same branch only)
            if (!existingEntity.getBranchId().getId()
                    .equals(branch.getId())) {
                throw new RuntimeException(
                        "You are not allowed to update this menu item"
                );
            }

            // 🔁 COPY NON-FK FIELDS
            for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);

                if (value != null
                        && !field.getName().endsWith("Id")
                        && !field.getName().equals("createdAt")
                        && !field.getName().equals("updatedAt")) {

                    field.set(existingEntity, value);
                }
            }

            // ================= FK HANDLING =================

            if (entity.getAddonsId() != null && entity.getAddonsId().getId() != null) {
                existingEntity.setAddonsId(
                        fetchReferenceById(
                                entity.getAddonsId(),
                                addonsrepository,
                                "Addons not found"
                        )
                );
            }

            if (entity.getMenuCategoryId() != null && entity.getMenuCategoryId().getId() != null) {
                existingEntity.setMenuCategoryId(
                        fetchReferenceById(
                                entity.getMenuCategoryId(),
                                menucategoryrepository,
                                "Menu category not found"
                        )
                );
            }

            if (entity.getMenuSubcategoryId() != null && entity.getMenuSubcategoryId().getId() != null) {
                existingEntity.setMenuSubcategoryId(
                        fetchReferenceById(
                                entity.getMenuSubcategoryId(),
                                menusubcategoryrepository,
                                "Menu subcategory not found"
                        )
                );
            }

            // 🔥 BRANCH & RESTAURANT → TOKEN ONLY
            existingEntity.setBranchId(branch);
            existingEntity.setRestaurantId(restaurant);

            entitiesToSave.add(existingEntity);
        }

        // 💾 SAVE
        menuitemsrepository.saveAll(entitiesToSave);

        return "Updated Successfully";
    }

    
    
    public Map<String, Object> getMenuItemsWithFilters(
            LocalDate fromDate,
            LocalDate toDate,
            Boolean isActive,
            Long categoryId,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token
    ) throws Exception {

        // 🔐 BRANCH AUTH
        Authorization.authorizeBranch(token);

        // 🔓 TOKEN
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        // ================= BRANCH USER =================
        UsersEntity branchUser = usersRepository.findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Branch not found from token"));

        if (branchUser.getParentId() == null) {
            throw new RuntimeException("Restaurant (parent) not found for branch");
        }

        UsersEntity restaurantUser = branchUser.getParentId();

        Specification<MenuItemsEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // ================= JOINS =================
            Join<MenuItemsEntity, UsersEntity> branchJoin =
                    root.join("branchId", JoinType.LEFT);

            Join<UsersEntity, UsersEntity> parentJoin =
                    branchJoin.join("parentId", JoinType.LEFT);

            // ================= SOFT DELETE =================
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // ================= BRANCH FILTER =================
            predicates.add(cb.equal(branchJoin.get("id"), branchUser.getId()));

            // ================= RESTAURANT FILTER (PARENT ID) =================
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
            
         // ================= CATEGORY FILTER (NEW) =================
            if (categoryId != null) {
                predicates.add(
                        cb.equal(
                                root.get("menuCategoryId").get("id"),
                                categoryId
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
                if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
                    searchPredicates.add(
                            cb.equal(root.get("isActive"), Boolean.valueOf(searchValue))
                    );
                }

                // Branch name (Users table)
                searchPredicates.add(
                        cb.like(cb.lower(branchJoin.get("name")), pattern)
                );

                // Restaurant name (parent user)
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

        Page<MenuItemsEntity> page =
                menuitemsrepository.findAll(spec, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }


    
    @Transactional
    public String addMenuItemWithImage(
            MultipartFile photo,
            String payloadJson,
            String token
    ) throws Exception {

        // ================= TOKEN =================
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }

        // 🔐 BRANCH AUTH
        Authorization.authorizeBranch(token);

        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IllegalArgumentException("Payload cannot be empty");
        }

        // ================= TOKEN DECRYPT =================
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        // ================= FETCH BRANCH FROM TOKEN =================
        UsersEntity branch = usersRepository
                .findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (branch.getParentId() == null) {
            throw new RuntimeException("Restaurant not linked with this branch");
        }

        UsersEntity restaurant = branch.getParentId();

        // ================= JSON → ENTITY =================
        ObjectMapper mapper = new ObjectMapper();
        MenuItemsEntity inputEntity =
                mapper.readValue(payloadJson, MenuItemsEntity.class);

        // ================= REQUIRED IDS (NO BRANCH / RESTAURANT) =================
        if (inputEntity.getMenuCategoryId() == null
                || inputEntity.getMenuCategoryId().getId() == null
                || inputEntity.getMenuSubcategoryId() == null
                || inputEntity.getMenuSubcategoryId().getId() == null) {

            throw new IllegalArgumentException(
                    "menuCategoryId and menuSubcategoryId are mandatory"
            );
        }

        // ================= VALIDATE CATEGORY =================
        MenuCategoryEntity category =
                menuCategoryRepository.findById(
                        inputEntity.getMenuCategoryId().getId()
                ).orElseThrow(() -> new RuntimeException("Menu category not found"));

        if (!category.getRestaurantId().getId()
                .equals(restaurant.getId())) {
            throw new SecurityException("Invalid menu category");
        }

        // ================= VALIDATE SUBCATEGORY =================
        MenuSubcategoryEntity subcategory =
                menuSubcategoryRepository.findById(
                        inputEntity.getMenuSubcategoryId().getId()
                ).orElseThrow(() -> new RuntimeException("Menu subcategory not found"));

        if (!subcategory.getRestaurantId().getId()
                .equals(restaurant.getId())) {
            throw new SecurityException("Invalid menu subcategory");
        }

        // ================= OPTIONAL ADDONS =================
        AddonsEntity addons = null;
        if (inputEntity.getAddonsId() != null
                && inputEntity.getAddonsId().getId() != null) {

            addons = addonsRepository
                    .findById(inputEntity.getAddonsId().getId())
                    .orElseThrow(() -> new RuntimeException("Addons not found"));
        }

        // ================= PARSE INLINE ADDONS FROM RAW JSON =================
        ObjectMapper rawMapper = new ObjectMapper();
        JsonNode rootNode = rawMapper.readTree(payloadJson);
        JsonNode inlineAddonsNode = rootNode.get("inlineAddons");

        // ================= CREATE ENTITY =================
        MenuItemsEntity entity = new MenuItemsEntity();

        for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
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

        // ================= SET VERIFIED IDS =================
        entity.setBranchId(branch);
        entity.setRestaurantId(restaurant);
        entity.setMenuCategoryId(category);
        entity.setMenuSubcategoryId(subcategory);
        entity.setAddonsId(addons);
        entity.setIsDeleted(false);

        MenuItemsEntity savedEntity =
                menuItemsRepository.save(entity);

        // ================= HANDLE INLINE ADDONS =================
        if (inlineAddonsNode != null && inlineAddonsNode.isArray() && inlineAddonsNode.size() > 0) {
            // Create or reuse addon group
            AddonsEntity addonGroup = addons;
            if (addonGroup == null) {
                addonGroup = new AddonsEntity();
                addonGroup.setName(entity.getName() + " Add-ons");
                addonGroup.setRestaurantId(restaurant);
                addonGroup.setBranchId(branch);
                addonGroup.setIsActive(true);
                addonGroup.setIsMultiple(true);
                addonGroup.setShowOnline(true);
                addonGroup.setShowInCaptain(true);
                addonGroup.setMinAddon(0);
                addonGroup.setMaxAddon(inlineAddonsNode.size());
                addonGroup = addonsRepository.save(addonGroup);
            } else {
                // Clear existing addon items for this group to replace with new ones
                addonsItemsRepository.deleteByAddonsId(addonGroup);
                addonGroup.setMaxAddon(inlineAddonsNode.size());
                addonGroup.setUpdatedAt(LocalDateTime.now());
                addonsRepository.save(addonGroup);
            }

            // Check if any addon is required
            boolean hasRequired = false;
            for (JsonNode addonNode : inlineAddonsNode) {
                boolean isReq = addonNode.has("isRequired") && addonNode.get("isRequired").asBoolean();
                if (isReq) { hasRequired = true; break; }
            }
            if (hasRequired) {
                addonGroup.setMinAddon(1);
                addonsRepository.save(addonGroup);
            }

            // Create addon items
            for (JsonNode addonNode : inlineAddonsNode) {
                String addonName = addonNode.has("name") ? addonNode.get("name").asText("") : "";
                double addonPrice = addonNode.has("price") ? addonNode.get("price").asDouble(0) : 0;
                boolean isRequired = addonNode.has("isRequired") && addonNode.get("isRequired").asBoolean();

                if (!addonName.isBlank()) {
                    AddonsItemsEntity addonItem = new AddonsItemsEntity();
                    addonItem.setAddonsId(addonGroup);
                    addonItem.setName(addonName);
                    addonItem.setPrice(BigDecimal.valueOf(addonPrice));
                    addonItem.setAttribute(isRequired ? "required" : "optional");
                    addonItem.setIsActive(true);
                    addonsItemsRepository.save(addonItem);
                }
            }

            // Link addon group to menu item
            savedEntity.setAddonsId(addonGroup);
            menuItemsRepository.save(savedEntity);
        }

        // ================= IMAGE UPLOAD =================
        if (photo != null && !photo.isEmpty()) {
            try {
                String fileName = "menu_item_" + savedEntity.getId();
                // old: String imageUrl = googleDriveUtil.uploadFile(photo, fileName, "Menu_items");
                final Long _entityId = savedEntity.getId();
                String imageUrl = fileUploadService.uploadFile(photo, fileName, "Menu_items",
                    driveUrl -> menuItemsRepository.updateDriveImageUrl(_entityId, driveUrl));

                savedEntity.setImageUrl(imageUrl);
                menuItemsRepository.save(savedEntity);
            } catch (Exception e) {
                System.err.println("Image upload failed for menu item " + savedEntity.getId() + ": " + e.getMessage());
            }
        }

        return "Menu item added successfully";
    }
    
    @Transactional
    public String updateMenuItemWithImage(
            MultipartFile photo,
            String payloadJson,
            String token
    ) throws Exception {

        // ================= TOKEN =================
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }

        // 🔐 BRANCH AUTH
        Authorization.authorizeBranch(token);

        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IllegalArgumentException("Payload cannot be empty");
        }

        // ================= TOKEN DECRYPT =================
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        // ================= FETCH BRANCH FROM TOKEN =================
        UsersEntity branch = usersRepository
                .findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (branch.getParentId() == null) {
            throw new RuntimeException("Restaurant not linked with this branch");
        }

        UsersEntity restaurant = branch.getParentId();

        // ================= JSON → ENTITY =================
        ObjectMapper mapper = new ObjectMapper();
        MenuItemsEntity inputEntity =
                mapper.readValue(payloadJson, MenuItemsEntity.class);

        // ================= ID CHECK =================
        if (inputEntity.getId() == null) {
            throw new IllegalArgumentException("Menu item id is mandatory for update");
        }

        // ================= FETCH EXISTING =================
        MenuItemsEntity existingEntity =
                menuItemsRepository.findById(inputEntity.getId())
                        .orElseThrow(() -> new RuntimeException("Menu item not found"));

        // 🔥 SECURITY: SAME BRANCH + RESTAURANT
        if (existingEntity.getBranchId() == null
                || !existingEntity.getBranchId().getId().equals(branch.getId())) {
            throw new SecurityException("Unauthorized update attempt (branch mismatch)");
        }

        if (existingEntity.getRestaurantId() == null
                || !existingEntity.getRestaurantId().getId().equals(restaurant.getId())) {
            throw new SecurityException("Unauthorized update attempt (restaurant mismatch)");
        }

        // ================= CATEGORY =================
        if (inputEntity.getMenuCategoryId() != null
                && inputEntity.getMenuCategoryId().getId() != null) {

            MenuCategoryEntity category =
                    menuCategoryRepository.findById(
                            inputEntity.getMenuCategoryId().getId()
                    ).orElseThrow(() -> new RuntimeException("Menu category not found"));

            if (!category.getRestaurantId().getId()
                    .equals(restaurant.getId())) {
                throw new SecurityException("Invalid menu category");
            }

            existingEntity.setMenuCategoryId(category);
        }

        // ================= SUBCATEGORY =================
        if (inputEntity.getMenuSubcategoryId() != null
                && inputEntity.getMenuSubcategoryId().getId() != null) {

            MenuSubcategoryEntity subcategory =
                    menuSubcategoryRepository.findById(
                            inputEntity.getMenuSubcategoryId().getId()
                    ).orElseThrow(() -> new RuntimeException("Menu subcategory not found"));

            if (!subcategory.getRestaurantId().getId()
                    .equals(restaurant.getId())) {
                throw new SecurityException("Invalid menu subcategory");
            }

            existingEntity.setMenuSubcategoryId(subcategory);
        }

        // ================= ADDONS (OPTIONAL) =================
        if (inputEntity.getAddonsId() != null
                && inputEntity.getAddonsId().getId() != null) {

            AddonsEntity addons =
                    addonsRepository.findById(
                            inputEntity.getAddonsId().getId()
                    ).orElseThrow(() -> new RuntimeException("Addons not found"));

            existingEntity.setAddonsId(addons);
        }

        // ================= PARSE INLINE ADDONS FROM RAW JSON =================
        ObjectMapper rawMapper = new ObjectMapper();
        JsonNode rootNode = rawMapper.readTree(payloadJson);
        JsonNode inlineAddonsNode = rootNode.get("inlineAddons");

        // ================= UPDATE NON-FK FIELDS =================
        for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
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

        menuItemsRepository.save(existingEntity);

        // ================= HANDLE INLINE ADDONS =================
        if (inlineAddonsNode != null && inlineAddonsNode.isArray() && inlineAddonsNode.size() > 0) {
            AddonsEntity addonGroup = existingEntity.getAddonsId();
            if (addonGroup == null) {
                addonGroup = new AddonsEntity();
                addonGroup.setName(existingEntity.getName() + " Add-ons");
                addonGroup.setRestaurantId(restaurant);
                addonGroup.setBranchId(branch);
                addonGroup.setIsActive(true);
                addonGroup.setIsMultiple(true);
                addonGroup.setShowOnline(true);
                addonGroup.setShowInCaptain(true);
                addonGroup.setMinAddon(0);
                addonGroup.setMaxAddon(inlineAddonsNode.size());
                addonGroup = addonsRepository.save(addonGroup);
            } else {
                addonsItemsRepository.deleteByAddonsId(addonGroup);
                addonGroup.setMaxAddon(inlineAddonsNode.size());
                addonGroup.setUpdatedAt(LocalDateTime.now());
                addonsRepository.save(addonGroup);
            }

            boolean hasRequired = false;
            for (JsonNode addonNode : inlineAddonsNode) {
                boolean isReq = addonNode.has("isRequired") && addonNode.get("isRequired").asBoolean();
                if (isReq) { hasRequired = true; break; }
            }
            if (hasRequired) {
                addonGroup.setMinAddon(1);
                addonsRepository.save(addonGroup);
            }

            for (JsonNode addonNode : inlineAddonsNode) {
                String addonName = addonNode.has("name") ? addonNode.get("name").asText("") : "";
                double addonPrice = addonNode.has("price") ? addonNode.get("price").asDouble(0) : 0;
                boolean isRequired = addonNode.has("isRequired") && addonNode.get("isRequired").asBoolean();

                if (!addonName.isBlank()) {
                    AddonsItemsEntity addonItem = new AddonsItemsEntity();
                    addonItem.setAddonsId(addonGroup);
                    addonItem.setName(addonName);
                    addonItem.setPrice(BigDecimal.valueOf(addonPrice));
                    addonItem.setAttribute(isRequired ? "required" : "optional");
                    addonItem.setIsActive(true);
                    addonsItemsRepository.save(addonItem);
                }
            }

            existingEntity.setAddonsId(addonGroup);
            menuItemsRepository.save(existingEntity);
        } else if (inlineAddonsNode != null && inlineAddonsNode.isArray() && inlineAddonsNode.size() == 0) {
            // All addons removed — unlink addon group
            if (existingEntity.getAddonsId() != null) {
                addonsItemsRepository.deleteByAddonsId(existingEntity.getAddonsId());
                existingEntity.setAddonsId(null);
                menuItemsRepository.save(existingEntity);
            }
        }

        // ================= IMAGE UPDATE =================
        if (photo != null && !photo.isEmpty()) {
            try {
                String fileName = "menu_item_" + existingEntity.getId();
                // old: String imageUrl = googleDriveUtil.uploadFile(photo, fileName, "Menu_items");
                final Long _entityId = existingEntity.getId();
                String imageUrl = fileUploadService.uploadFile(photo, fileName, "Menu_items",
                    driveUrl -> menuItemsRepository.updateDriveImageUrl(_entityId, driveUrl));

                existingEntity.setImageUrl(imageUrl);
                menuItemsRepository.save(existingEntity);
            } catch (Exception e) {
                System.err.println("Image upload failed for menu item " + existingEntity.getId() + ": " + e.getMessage());
            }
        }

        return "Menu item updated successfully";
    }



    @Override
    public List<MenuItemsEntity> getAllRecordMenuItems(String token) throws Exception {
        Authorization.authorizeBranch(token);
        return menuitemsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllMenuItems(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
        return menuitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuItems not found"));
    }

    @Override
    public String addMenuItems(MenuItemsEntity menu_itemsEntity, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
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
        Authorization.authorizeBranch(token);
        MenuItemsEntity entity = menuitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuItems not found"));
        entity.setIsDeleted(true);
        menuitemsrepository.save(entity);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleMenuItems(List<MenuItemsEntity> menu_itemsEntitys, String token) throws Exception {
        Authorization.authorizeBranch(token);
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
                row.createCell(22).setCellValue(menu_itemsEntity.getIsDeleted());

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
