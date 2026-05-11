package com.rms.modules.admin.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.AddonsEntity;
import com.rms.common.entities.MenuCategoryEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.MenuSubcategoryEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.serviceImplement.MenuItemsServiceIMP;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.FileUploadService;
import com.rms.configuration.Authorization;

import com.rms.common.repositories.AddonsRepository;
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
@Qualifier("admMenuItemsService")
public class AdmMenuItemsService implements MenuItemsServiceIMP {

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
	private UsersRepository usersRepository;

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

	public AdmMenuItemsService(MenuItemsRepository menuitemsrepository, AddonsRepository addonsrepository,
			MenuCategoryRepository menucategoryrepository, MenuSubcategoryRepository menusubcategoryrepository,
			RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
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
	public String updateMultipleMenuItems(List<MenuItemsEntity> menuItemsEntities, String token) throws Exception {
		// 🔐 Admin Authorization
		Authorization.authorizeAdmin(token);

		List<MenuItemsEntity> entitiesToSave = new ArrayList<>();

		for (MenuItemsEntity entity : menuItemsEntities) {

			if (entity.getId() == null) {
				throw new RuntimeException("MenuItem id is required for update");
			}

			// Check if record exists
			MenuItemsEntity existingEntity = menuitemsrepository.findById(entity.getId())
					.orElseThrow(() -> new RuntimeException("MenuItem not found with id: " + entity.getId()));

			// 🔁 Copy non-foreign fields using reflection
			for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);

				if (value != null && !field.getName().endsWith("Id") && !field.getName().equals("createdAt") // skip
																												// audit
																												// fields
						&& !field.getName().equals("updatedAt")) {

					field.set(existingEntity, value);
				}
			}

			// ================= Handle Foreign Keys =================

			if (entity.getAddonsId() != null && entity.getAddonsId().getId() != null) {
				existingEntity
						.setAddonsId(fetchReferenceById(entity.getAddonsId(), addonsrepository, "Addons not found"));
			}

			if (entity.getMenuCategoryId() != null && entity.getMenuCategoryId().getId() != null) {
				existingEntity.setMenuCategoryId(fetchReferenceById(entity.getMenuCategoryId(), menucategoryrepository,
						"Menu_category not found"));
			}

			if (entity.getMenuSubcategoryId() != null && entity.getMenuSubcategoryId().getId() != null) {
				existingEntity.setMenuSubcategoryId(fetchReferenceById(entity.getMenuSubcategoryId(),
						menusubcategoryrepository, "Menu_subcategory not found"));
			}

			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				existingEntity.setBranchId(
						fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found"));
			}

			if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
				existingEntity.setRestaurantId(
						fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(existingEntity);
		}

		// 💾 Save all updated entities
		menuitemsrepository.saveAll(entitiesToSave);

		return "Updated Successfully";
	}

//	public Map<String, Object> getMenuItemsWithFilters(LocalDate fromDate, LocalDate toDate, Boolean isActive,
//			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {
//
//		// 🔐 Admin Authorization
//		Authorization.authorizeAdmin(token);
//
//		Specification<MenuItemsEntity> spec = (root, query, cb) -> {
//
//			List<Predicate> predicates = new ArrayList<>();
//
//			// ================= SOFT DELETE =================
//			predicates.add(cb.equal(root.get("isDeleted"), false));
//
//			// ================= DATE FILTER =================
//			if (fromDate != null && toDate != null) {
//				predicates
//						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
//			}
//
//			// ================= ACTIVE FILTER =================
//			if (isActive != null) {
//				predicates.add(cb.equal(root.get("isActive"), isActive));
//			}
//
//			// ================= SEARCH FILTER =================
//			if (searchValue != null && !searchValue.trim().isEmpty()) {
//
//				String pattern = "%" + searchValue.toLowerCase() + "%";
//				List<Predicate> searchPredicates = new ArrayList<>();
//
//				// 🔹 MENU ITEM FIELDS
//				searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
//
//				// 🔹 PRICE SEARCH (NUMBER)
//				try {
//					BigDecimal price = new BigDecimal(searchValue);
//					searchPredicates.add(cb.equal(root.get("price"), price));
//				} catch (Exception ignored) {
//				}
//
//				// 🔹 Boolean isActive
//				if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
//					searchPredicates.add(cb.equal(root.get("isActive"), Boolean.valueOf(searchValue)));
//				}
//
//				// ================= FOREIGN KEY SEARCH =================
//
//				// 🔥 RESTAURANT (UsersEntity)
//				Join<MenuItemsEntity, UsersEntity> restaurantJoin = root.join("restaurantId", JoinType.LEFT);
//
//				searchPredicates.add(cb.like(cb.lower(restaurantJoin.get("name")), pattern));
//				searchPredicates.add(cb.like(cb.lower(restaurantJoin.get("email")), pattern));
//				searchPredicates.add(cb.like(cb.lower(restaurantJoin.get("mobile")), pattern));
//
//				// 🔥 BRANCH NAME (UsersEntity)
////	            searchPredicates.add(cb.like(cb.lower(restaurantJoin.get("branchName")), pattern));
//
//				// Combine all searchPredicates with OR
//				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
//			}
//
//			// Combine all predicates with AND
//			return cb.and(predicates.toArray(new Predicate[0]));
//		};
//
//		// ================= PAGINATION =================
//		Pageable pageable = PageRequest.of(pageNumber, pageSize,Sort.by(Sort.Direction.DESC, "id"));
//		Page<MenuItemsEntity> page = menuItemsRepository.findAll(spec, pageable);
//
//		// ================= RESPONSE =================
//		Map<String, Object> response = new LinkedHashMap<>();
//		response.put("totalRecords", page.getTotalElements());
//		response.put("pageSize", page.getSize());
//		response.put("currentPage", page.getNumber() + 1);
//		response.put("totalPages", page.getTotalPages());
//		response.put("records", page.getContent());
//
//		return response;
//	}

	public Map<String, Object> getMenuItemsWithFilters(
	        LocalDate fromDate,
	        LocalDate toDate,
	        Boolean isActive,
	        Long categoryId,
	        String searchValue,
	        Long branchId,
	        Integer pageNumber,
	        Integer pageSize,
	        String token
	) throws Exception {

	    // 🔐 Admin Authorization
	    Authorization.authorizeAdmin(token);

	    Specification<MenuItemsEntity> spec = (root, query, cb) -> {

	        List<Predicate> predicates = new ArrayList<>();

	        // ================= SOFT DELETE =================
	        predicates.add(cb.equal(root.get("isDeleted"), false));

	        // ================= BRANCH FILTER =================
	        if (branchId != null) {
	            Join<MenuItemsEntity, UsersEntity> branchJoin =
	                    root.join("branchId", JoinType.INNER);

	            predicates.add(cb.equal(branchJoin.get("id"), branchId));
	        }

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

	        // ================= ACTIVE FILTER =================
	        if (isActive != null) {
	            predicates.add(cb.equal(root.get("isActive"), isActive));
	        }

	        // ================= SEARCH FILTER =================
	        if (searchValue != null && !searchValue.trim().isEmpty()) {

	            String pattern = "%" + searchValue.toLowerCase() + "%";
	            List<Predicate> searchPredicates = new ArrayList<>();

	            // 🔹 MENU ITEM NAME
	            searchPredicates.add(
	                    cb.like(cb.lower(root.get("name")), pattern)
	            );

	            // 🔹 PRICE SEARCH
	            try {
	                BigDecimal price = new BigDecimal(searchValue);
	                searchPredicates.add(cb.equal(root.get("price"), price));
	            } catch (Exception ignored) {}

	            // 🔹 isActive text search
	            if (searchValue.equalsIgnoreCase("true")
	                    || searchValue.equalsIgnoreCase("false")) {
	                searchPredicates.add(
	                        cb.equal(root.get("isActive"),
	                                Boolean.valueOf(searchValue))
	                );
	            }

	            // 🔹 RESTAURANT SEARCH
	            Join<MenuItemsEntity, UsersEntity> restaurantJoin =
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

	            predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
	        }

	        return cb.and(predicates.toArray(new Predicate[0]));
	    };

	    Pageable pageable =
	            PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));

	    Page<MenuItemsEntity> page =
	            menuItemsRepository.findAll(spec, pageable);

	    Map<String, Object> response = new LinkedHashMap<>();
	    response.put("totalRecords", page.getTotalElements());
	    response.put("pageSize", page.getSize());
	    response.put("currentPage", page.getNumber() + 1);
	    response.put("totalPages", page.getTotalPages());
	    response.put("records", page.getContent());

	    return response;
	}

	
	@Transactional
	public String addMenuItemWithImage(String token, MultipartFile photo, String payloadJson) throws Exception {

	    // ================= TOKEN =================
	    if (token == null || token.isBlank()) {
	        throw new SecurityException("Access token is missing");
	    }
	    Authorization.authorizeAdmin(token);

	    if (payloadJson == null || payloadJson.isBlank()) {
	        throw new IllegalArgumentException("Payload cannot be empty");
	    }

	    ObjectMapper mapper = new ObjectMapper();

	    // ================= JSON → ENTITY =================
	    MenuItemsEntity inputEntity = mapper.readValue(payloadJson, MenuItemsEntity.class);

	    // ================= READ FK IDS SAFELY =================
	    Long restaurantId = inputEntity.getRestaurantId() != null
	            ? inputEntity.getRestaurantId().getId()
	            : null;

	    Long branchId = inputEntity.getBranchId() != null
	            ? inputEntity.getBranchId().getId()
	            : null;

	    Long categoryId = inputEntity.getMenuCategoryId() != null
	            ? inputEntity.getMenuCategoryId().getId()
	            : null;

	    Long subCategoryId = inputEntity.getMenuSubcategoryId() != null
	            ? inputEntity.getMenuSubcategoryId().getId()
	            : null;

	    Long addonsId = inputEntity.getAddonsId() != null
	            ? inputEntity.getAddonsId().getId()
	            : null;

	    if (restaurantId == null || branchId == null || categoryId == null || subCategoryId == null) {
	        throw new IllegalArgumentException(
	                "restaurantId, branchId, menuCategoryId, menuSubcategoryId are mandatory");
	    }

	    // ================= FETCH FK ENTITIES =================
	    UsersEntity restaurant = usersRepository.findById(restaurantId)
	            .orElseThrow(() -> new RuntimeException("Restaurant not found"));

	    if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
	        throw new IllegalArgumentException("Provided user is not a restaurant");
	    }

	    UsersEntity branch = usersRepository.findById(branchId)
	            .orElseThrow(() -> new RuntimeException("Branch not found"));

	    MenuCategoryEntity category = menuCategoryRepository.findById(categoryId)
	            .orElseThrow(() -> new RuntimeException("Menu category not found"));

	    MenuSubcategoryEntity subcategory = menuSubcategoryRepository.findById(subCategoryId)
	            .orElseThrow(() -> new RuntimeException("Menu subcategory not found"));

	    AddonsEntity addons = null;
	    if (addonsId != null) {
	        addons = addonsRepository.findById(addonsId)
	                .orElseThrow(() -> new RuntimeException("Addons not found"));
	    }

	    // ================= CREATE ENTITY =================
	    MenuItemsEntity newEntity = new MenuItemsEntity();

	    // ================= COPY NON-FK FIELDS (MAGIC PART) =================
	    for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
	        field.setAccessible(true);

	        // skip unwanted fields
	        if (Modifier.isStatic(field.getModifiers())
	                || Modifier.isFinal(field.getModifiers())
	                || field.getName().equals("id")
	                || field.getName().equals("createdAt")
	                || field.getName().endsWith("Id")) {
	            continue;
	        }

	        Object value = field.get(inputEntity);
	        if (value != null) {
	            field.set(newEntity, value);
	        }
	    }

	    // ================= SET FK RELATIONS =================
	    newEntity.setRestaurantId(restaurant);
	    newEntity.setBranchId(branch);
	    newEntity.setMenuCategoryId(category);
	    newEntity.setMenuSubcategoryId(subcategory);
	    newEntity.setAddonsId(addons);

	    MenuItemsEntity savedEntity = menuItemsRepository.save(newEntity);

	    // ================= IMAGE UPLOAD =================
	    if (photo != null && !photo.isEmpty()) {
	        String fileName = "menu_item_" + savedEntity.getId();
	        // old: String imageUrl = googleDriveUtil.uploadFile(photo, fileName, "Menu_items");
	        final Long _entityId = savedEntity.getId();
	        String imageUrl = fileUploadService.uploadFile(photo, fileName, "Menu_items",
	            driveUrl -> menuItemsRepository.updateDriveImageUrl(_entityId, driveUrl));
	        savedEntity.setImageUrl(imageUrl);
	        menuItemsRepository.save(savedEntity);
	    }

	    return "Menu item added successfully";
	}

//	@Transactional
//	public String addMenuItemWithImage(String token, MultipartFile photo, String payloadJson) throws Exception {
//
//	    System.out.println("====== addMenuItemWithImage START ======");
//
//	    // ================= TOKEN =================
//	    if (token == null || token.isBlank()) {
//	        throw new SecurityException("Access token is missing");
//	    }
//	    Authorization.authorizeAdmin(token);
//
//	    if (payloadJson == null || payloadJson.isBlank()) {
//	        throw new IllegalArgumentException("Payload cannot be empty");
//	    }
//
//	    System.out.println("Payload JSON: " + payloadJson);
//
//	    // ================= JSON PARSE =================
//	    ObjectMapper mapper = new ObjectMapper();
//	    JsonNode root = mapper.readTree(payloadJson);
//
//	    // ================= READ IDS SAFELY =================
//	    Long restaurantId = root.path("restaurantId").path("id").asLong(0);
//	    Long branchId = root.path("branchId").path("id").asLong(0);
//	    Long categoryId = root.path("menuCategoryId").path("id").asLong(0);
//	    Long subCategoryId = root.path("menuSubcategoryId").path("id").asLong(0);
//	    Long addonsId = root.path("addonsId").path("id").asLong(0);
//
//	    System.out.println("restaurantId = " + restaurantId);
//	    System.out.println("branchId = " + branchId);
//	    System.out.println("categoryId = " + categoryId);
//	    System.out.println("subCategoryId = " + subCategoryId);
//	    System.out.println("addonsId = " + addonsId);
//
//	    if (restaurantId == 0 || branchId == 0 || categoryId == 0 || subCategoryId == 0) {
//	        throw new IllegalArgumentException(
//	                "restaurantId, branchId, menuCategoryId, menuSubcategoryId are mandatory");
//	    }
//
//	    // ================= FETCH ENTITIES =================
//	    UsersEntity restaurant = usersRepository.findById(restaurantId)
//	            .orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//	    if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
//	        throw new IllegalArgumentException("Provided user is not a restaurant");
//	    }
//
//	    UsersEntity branch = usersRepository.findById(branchId)
//	            .orElseThrow(() -> new RuntimeException("Branch not found"));
//
//	    MenuCategoryEntity category = menuCategoryRepository.findById(categoryId)
//	            .orElseThrow(() -> new RuntimeException("Menu category not found"));
//
//	    MenuSubcategoryEntity subcategory = menuSubcategoryRepository.findById(subCategoryId)
//	            .orElseThrow(() -> new RuntimeException("Menu subcategory not found"));
//
//	    AddonsEntity addons = null;
//	    if (addonsId != 0) {
//	        addons = addonsRepository.findById(addonsId)
//	                .orElseThrow(() -> new RuntimeException("Addons not found"));
//	    }
//
//	    // ================= CREATE MENU ITEM =================
//	    MenuItemsEntity entity = new MenuItemsEntity();
//
//	    entity.setName(root.path("name").asText(null));
//	    entity.setDescription(root.path("description").asText(null));
//	    entity.setPrice(new BigDecimal(root.path("price").asText("0")));
//	    entity.setMrp(new BigDecimal(root.path("mrp").asText("0")));
//	    entity.setCostPrice(new BigDecimal(root.path("costPrice").asText("0")));
//
//	    entity.setDietaryType(root.path("dietaryType").asText(null));
//	    entity.setIsAvailable(root.path("isAvailable").asBoolean(false));
//	    entity.setAvailableOnline(root.path("availableOnline").asBoolean(false));
//
//	    entity.setPreparationMinutes(root.path("preparationMinutes").asInt(0));
//	    entity.setDeliveryMinutes(root.path("deliveryMinutes").asInt(0));
//
//	    entity.setIsRecommended(root.path("isRecommended").asBoolean(false));
//	    entity.setSpiceLevel(root.path("spiceLevel").asText(null));
//	    entity.setPriority(root.path("priority").asInt(0));
//
//	    // ================= SET RELATIONS =================
//	    entity.setRestaurantId(restaurant);
//	    entity.setBranchId(branch);
//	    entity.setMenuCategoryId(category);
//	    entity.setMenuSubcategoryId(subcategory);
//	    entity.setAddonsId(addons);
//
//	    MenuItemsEntity savedEntity = menuItemsRepository.save(entity);
//	    System.out.println("Menu item saved with ID: " + savedEntity.getId());
//
//	    // ================= IMAGE UPLOAD =================
//	    if (photo != null && !photo.isEmpty()) {
//	        String fileName = "menu_item_" + savedEntity.getId();
//	        String imageUrl = googleDriveUtil.uploadFile(photo, fileName, "Menu_items");
//	        savedEntity.setImageUrl(imageUrl);
//	        menuItemsRepository.save(savedEntity);
//	    }
//
//	    System.out.println("====== addMenuItemWithImage END ======");
//	    return "Menu item added successfully";
//	}

	@Transactional
	public String updateMenuItemWithImage(MultipartFile photo, String payloadJson, String token) throws Exception {

	    // ================= TOKEN =================
	    if (token == null || token.isBlank()) {
	        throw new SecurityException("Access token is missing");
	    }
	    Authorization.authorizeAdmin(token);

	    if (payloadJson == null || payloadJson.isBlank()) {
	        throw new IllegalArgumentException("Payload cannot be empty");
	    }

	    ObjectMapper mapper = new ObjectMapper();
	    JsonNode root = mapper.readTree(payloadJson);

	    // ================= ID CHECK =================
	    Long menuItemId = root.path("id").asLong(0);
	    if (menuItemId == 0) {
	        throw new IllegalArgumentException("Menu item id is mandatory for update");
	    }

	    // ================= FETCH EXISTING =================
	    MenuItemsEntity existingEntity = menuItemsRepository.findById(menuItemId)
	            .orElseThrow(() -> new RuntimeException("Menu item not found"));

	    // ================= READ REQUIRED IDS SAFELY =================
	    Long restaurantId = root.path("restaurantId").path("id").asLong(0);
	    Long branchId = root.path("branchId").path("id").asLong(0);
	    Long categoryId = root.path("menuCategoryId").path("id").asLong(0);
	    Long subCategoryId = root.path("menuSubcategoryId").path("id").asLong(0);
	    Long addonsId = root.path("addonsId").path("id").asLong(0);

	    if (restaurantId == 0 || branchId == 0 || categoryId == 0 || subCategoryId == 0) {
	        throw new IllegalArgumentException(
	                "restaurantId, branchId, menuCategoryId, menuSubcategoryId are mandatory");
	    }

	    // ================= VALIDATE RESTAURANT =================
	    UsersEntity restaurant = usersRepository.findById(restaurantId)
	            .orElseThrow(() -> new RuntimeException("Restaurant not found"));

	    if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
	        throw new IllegalArgumentException("Provided user is not a restaurant");
	    }

	    // ================= VALIDATE BRANCH =================
	    UsersEntity branch = usersRepository.findById(branchId)
	            .orElseThrow(() -> new RuntimeException("Branch not found"));

	    // ================= VALIDATE CATEGORY =================
	    MenuCategoryEntity category = menuCategoryRepository.findById(categoryId)
	            .orElseThrow(() -> new RuntimeException("Menu category not found"));

	    // ================= VALIDATE SUBCATEGORY =================
	    MenuSubcategoryEntity subcategory = menuSubcategoryRepository.findById(subCategoryId)
	            .orElseThrow(() -> new RuntimeException("Menu subcategory not found"));

	    // ================= OPTIONAL ADDONS =================
	    AddonsEntity addons = null;
	    if (addonsId != 0) {
	        addons = addonsRepository.findById(addonsId)
	                .orElseThrow(() -> new RuntimeException("Addons not found"));
	    }

	    // ================= JSON → TEMP ENTITY =================
	    MenuItemsEntity inputEntity = mapper.treeToValue(root, MenuItemsEntity.class);

	    // ================= UPDATE NON-FK FIELDS =================
	    for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
	        field.setAccessible(true);

	        if (Modifier.isStatic(field.getModifiers())
	                || Modifier.isFinal(field.getModifiers())
	                || field.getName().equals("id")
	                || field.getName().equals("createdAt")
	                || field.getName().endsWith("Id")) {
	            continue;
	        }

	        Object value = field.get(inputEntity);
	        if (value != null) {
	            field.set(existingEntity, value);
	        }
	    }

	    // ================= SET VERIFIED IDS =================
	    existingEntity.setRestaurantId(restaurant);
	    existingEntity.setBranchId(branch);
	    existingEntity.setMenuCategoryId(category);
	    existingEntity.setMenuSubcategoryId(subcategory);
	    existingEntity.setAddonsId(addons);

	    menuItemsRepository.save(existingEntity);

	    // ================= IMAGE UPDATE =================
	    if (photo != null && !photo.isEmpty()) {
	        String fileName = "menu_item_" + existingEntity.getId();
	        // old: String imageUrl = googleDriveUtil.uploadFile(photo, fileName, "Menu_items");
	        final Long _entityId = existingEntity.getId();
	        String imageUrl = fileUploadService.uploadFile(photo, fileName, "Menu_items",
	            driveUrl -> menuItemsRepository.updateDriveImageUrl(_entityId, driveUrl));
	        existingEntity.setImageUrl(imageUrl);
	        menuItemsRepository.save(existingEntity);
	    }

	    return "Menu item updated successfully";
	}

//	@Transactional
//	public String updateMenuItemWithImage(MultipartFile photo, String payloadJson, String token) throws Exception {
//
//		// ================= TOKEN =================
//		if (token == null || token.isBlank()) {
//			throw new SecurityException("Access token is missing");
//		}
//		Authorization.authorizeAdmin(token);
//
//		if (payloadJson == null || payloadJson.isBlank()) {
//			throw new IllegalArgumentException("Payload cannot be empty");
//		}
//
//		// ================= JSON → ENTITY =================
//		ObjectMapper mapper = new ObjectMapper();
//		MenuItemsEntity inputEntity = mapper.readValue(payloadJson, MenuItemsEntity.class);
//
//		// ================= ID CHECK =================
//		if (inputEntity.getId() == null) {
//			throw new IllegalArgumentException("Menu item id is mandatory for update");
//		}
//
//		// ================= FETCH EXISTING =================
//		MenuItemsEntity existingEntity = menuItemsRepository.findById(inputEntity.getId())
//				.orElseThrow(() -> new RuntimeException("Menu item not found"));
//
//		// ================= REQUIRED IDS =================
//		if (inputEntity.getRestaurantId() == null || inputEntity.getRestaurantId().getId() == null
//				|| inputEntity.getBranchId() == null || inputEntity.getBranchId().getId() == null
//				|| inputEntity.getMenuCategoryId() == null || inputEntity.getMenuCategoryId().getId() == null
//				|| inputEntity.getMenuSubcategoryId() == null || inputEntity.getMenuSubcategoryId().getId() == null) {
//
//			throw new IllegalArgumentException(
//					"restaurantId, branchId, menuCategoryId, menuSubcategoryId are mandatory");
//		}
//
//		// ================= VALIDATE RESTAURANT =================
//		UsersEntity restaurant = usersRepository.findById(inputEntity.getRestaurantId().getId())
//				.orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//		if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
//			throw new IllegalArgumentException("Provided user is not a restaurant");
//		}
//
//		// ================= VALIDATE BRANCH =================
//		UsersEntity branch = usersRepository.findById(inputEntity.getBranchId().getId())
//				.orElseThrow(() -> new RuntimeException("Branch not found"));
//
//		// ================= VALIDATE CATEGORY =================
//		MenuCategoryEntity category = menuCategoryRepository.findById(inputEntity.getMenuCategoryId().getId())
//				.orElseThrow(() -> new RuntimeException("Menu category not found"));
//
//		// ================= VALIDATE SUBCATEGORY =================
//		MenuSubcategoryEntity subcategory = menuSubcategoryRepository
//				.findById(inputEntity.getMenuSubcategoryId().getId())
//				.orElseThrow(() -> new RuntimeException("Menu subcategory not found"));
//
//		// ================= OPTIONAL ADDONS =================
//		AddonsEntity addons = null;
//		if (inputEntity.getAddonsId() != null && inputEntity.getAddonsId().getId() != null) {
//
//			addons = addonsRepository.findById(inputEntity.getAddonsId().getId())
//					.orElseThrow(() -> new RuntimeException("Addons not found"));
//		}
//
//		// ================= UPDATE NON-NULL FIELDS =================
//		for (Field field : MenuItemsEntity.class.getDeclaredFields()) {
//			field.setAccessible(true);
//
//			if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())
//					|| field.getName().equals("id") || field.getName().equals("createdAt")
//					|| field.getName().endsWith("Id")) {
//				continue;
//			}
//
//			Object value = field.get(inputEntity);
//			if (value != null) {
//				field.set(existingEntity, value);
//			}
//		}
//
//		// ================= SET VERIFIED IDS =================
//		existingEntity.setRestaurantId(restaurant);
//		existingEntity.setBranchId(branch);
//		existingEntity.setMenuCategoryId(category);
//		existingEntity.setMenuSubcategoryId(subcategory);
//		existingEntity.setAddonsId(addons);
//
//		menuItemsRepository.save(existingEntity);
//
//		// ================= IMAGE UPDATE (REPLACE) =================
//		if (photo != null && !photo.isEmpty()) {
//
//			String fileName = "menu_item_" + existingEntity.getId();
//			String imageUrl = googleDriveUtil.uploadFile(photo, fileName, "Menu_items");
//
//			existingEntity.setImageUrl(imageUrl);
//			menuItemsRepository.save(existingEntity);
//		}
//
//		return "Menu item updated successfully";
//	}

	@Override
	public List<MenuItemsEntity> getAllRecordMenuItems(String token) throws Exception {
		Authorization.authorizeAdmin(token);
		return menuitemsrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllMenuItems(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeAdmin(token);
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
		Authorization.authorizeAdmin(token);
		return menuitemsrepository.findById(id).orElseThrow(() -> new RuntimeException("MenuItems not found"));
	}

	@Override
	public String addMenuItems(MenuItemsEntity menu_itemsEntity, String token) throws Exception {
		Authorization.authorizeAdmin(token);
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
					fetchReferenceById(menu_itemsEntity.getAddonsId(), addonsrepository, "Addons not found"));
		}

		// Handle menu_category_id foreign key
		if (menu_itemsEntity.getMenuCategoryId() != null && menu_itemsEntity.getMenuCategoryId().getId() != null) {
			newEntity.setMenuCategoryId(fetchReferenceById(menu_itemsEntity.getMenuCategoryId(), menucategoryrepository,
					"Menu_category not found"));
		}

		// Handle menu_subcategory_id foreign key
		if (menu_itemsEntity.getMenuSubcategoryId() != null
				&& menu_itemsEntity.getMenuSubcategoryId().getId() != null) {
			newEntity.setMenuSubcategoryId(fetchReferenceById(menu_itemsEntity.getMenuSubcategoryId(),
					menusubcategoryrepository, "Menu_subcategory not found"));
		}

		// Handle branch_id foreign key
		if (menu_itemsEntity.getBranchId() != null && menu_itemsEntity.getBranchId().getId() != null) {
			newEntity.setBranchId(
					fetchReferenceById(menu_itemsEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		// Handle restaurant_id foreign key
		if (menu_itemsEntity.getRestaurantId() != null && menu_itemsEntity.getRestaurantId().getId() != null) {
			newEntity.setRestaurantId(
					fetchReferenceById(menu_itemsEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		menuitemsrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateMenuItems(MenuItemsEntity menu_itemsEntity, String token) throws Exception {
		Authorization.authorizeAdmin(token);
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
					fetchReferenceById(menu_itemsEntity.getAddonsId(), addonsrepository, "Addons not found"));
		}

		// Handle menu_category_id foreign key
		if (menu_itemsEntity.getMenuCategoryId() != null && menu_itemsEntity.getMenuCategoryId().getId() != null) {
			existingEntity.setMenuCategoryId(fetchReferenceById(menu_itemsEntity.getMenuCategoryId(),
					menucategoryrepository, "Menu_category not found"));
		}

		// Handle menu_subcategory_id foreign key
		if (menu_itemsEntity.getMenuSubcategoryId() != null
				&& menu_itemsEntity.getMenuSubcategoryId().getId() != null) {
			existingEntity.setMenuSubcategoryId(fetchReferenceById(menu_itemsEntity.getMenuSubcategoryId(),
					menusubcategoryrepository, "Menu_subcategory not found"));
		}

		// Handle branch_id foreign key
		if (menu_itemsEntity.getBranchId() != null && menu_itemsEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(
					fetchReferenceById(menu_itemsEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		// Handle restaurant_id foreign key
		if (menu_itemsEntity.getRestaurantId() != null && menu_itemsEntity.getRestaurantId().getId() != null) {
			existingEntity.setRestaurantId(
					fetchReferenceById(menu_itemsEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		menuitemsrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteMenuItems(Long id, String token) throws Exception {
		Authorization.authorizeAdmin(token);
		MenuItemsEntity entity = menuitemsrepository.findById(id)
				.orElseThrow(() -> new RuntimeException("MenuItems not found"));
		entity.setIsDeleted(true);
		menuitemsrepository.save(entity);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleMenuItems(List<MenuItemsEntity> menu_itemsEntitys, String token) throws Exception {
		Authorization.authorizeAdmin(token);
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
				newEntity.setAddonsId(fetchReferenceById(entity.getAddonsId(), addonsrepository, "Addons not found"));
			}

			// Handle menu_category_id foreign key
			if (entity.getMenuCategoryId() != null && entity.getMenuCategoryId().getId() != null) {
				newEntity.setMenuCategoryId(fetchReferenceById(entity.getMenuCategoryId(), menucategoryrepository,
						"Menu_category not found"));
			}

			// Handle menu_subcategory_id foreign key
			if (entity.getMenuSubcategoryId() != null && entity.getMenuSubcategoryId().getId() != null) {
				newEntity.setMenuSubcategoryId(fetchReferenceById(entity.getMenuSubcategoryId(),
						menusubcategoryrepository, "Menu_subcategory not found"));
			}

			// Handle branch_id foreign key
			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				newEntity.setBranchId(
						fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found"));
			}

			// Handle restaurant_id foreign key
			if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
				newEntity.setRestaurantId(
						fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found"));
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
				row.createCell(1)
						.setCellValue(menu_itemsEntity.getRestaurantId() != null
								? menu_itemsEntity.getRestaurantId().toString()
								: "N/A");
				row.createCell(2).setCellValue(
						menu_itemsEntity.getBranchId() != null ? menu_itemsEntity.getBranchId().toString() : "N/A");
				row.createCell(3).setCellValue(
						menu_itemsEntity.getIsActive() != null && menu_itemsEntity.getIsActive() ? "Active"
								: "Inactive");
				row.createCell(4)
						.setCellValue(menu_itemsEntity.getMenuCategoryId() != null
								? menu_itemsEntity.getMenuCategoryId().toString()
								: "N/A");
				row.createCell(5)
						.setCellValue(menu_itemsEntity.getMenuSubcategoryId() != null
								? menu_itemsEntity.getMenuSubcategoryId().toString()
								: "N/A");
				row.createCell(6).setCellValue(
						menu_itemsEntity.getAddonsId() != null ? menu_itemsEntity.getAddonsId().toString() : "N/A");
				row.createCell(7).setCellValue(menu_itemsEntity.getName() != null ? menu_itemsEntity.getName() : "N/A");
				row.createCell(8).setCellValue(
						menu_itemsEntity.getDescription() != null ? menu_itemsEntity.getDescription() : "N/A");
				row.createCell(9).setCellValue(
						menu_itemsEntity.getPrice() != null ? menu_itemsEntity.getPrice().doubleValue() : 0.0);
				row.createCell(10).setCellValue(
						menu_itemsEntity.getMrp() != null ? menu_itemsEntity.getMrp().doubleValue() : 0.0);
				row.createCell(11).setCellValue(
						menu_itemsEntity.getCostPrice() != null ? menu_itemsEntity.getCostPrice().doubleValue() : 0.0);
//				row.createCell(12).setCellValue( 
//						menu_itemsEntity.getDietaryType() != null ? menu_itemsEntity.getDietaryType() : "N/A");
				row.createCell(13)
						.setCellValue(menu_itemsEntity.getIsAvailable() != null && menu_itemsEntity.getIsAvailable()
								? "Active"
								: "Inactive");
				row.createCell(14).setCellValue(
						menu_itemsEntity.getAvailableOnline() != null && menu_itemsEntity.getAvailableOnline()
								? "Active"
								: "Inactive");
				row.createCell(15)
						.setCellValue(menu_itemsEntity.getImageUrl() != null ? menu_itemsEntity.getImageUrl() : "N/A");
				row.createCell(16)
						.setCellValue(menu_itemsEntity.getPreparationMinutes() != null
								? menu_itemsEntity.getPreparationMinutes()
								: 0);
				row.createCell(17).setCellValue(
						menu_itemsEntity.getDeliveryMinutes() != null ? menu_itemsEntity.getDeliveryMinutes() : 0);
				row.createCell(18)
						.setCellValue(menu_itemsEntity.getIsRecommended() != null && menu_itemsEntity.getIsRecommended()
								? "Active"
								: "Inactive");
				row.createCell(19).setCellValue(
						menu_itemsEntity.getSpiceLevel() != null ? menu_itemsEntity.getSpiceLevel() : "N/A");
				row.createCell(20)
						.setCellValue(menu_itemsEntity.getPriority() != null ? menu_itemsEntity.getPriority() : 0);
				LocalDateTime createdAt = menu_itemsEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(21).setCellValue(formattedCreatedAt);
//				row.createCell(22)
//						.setCellValue(menu_itemsEntity.getIsDeleted() != null ? menu_itemsEntity.getIsDeleted() : 0);
				row.createCell(22).setCellValue(Boolean.TRUE.equals(menu_itemsEntity.getIsDeleted()));

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
