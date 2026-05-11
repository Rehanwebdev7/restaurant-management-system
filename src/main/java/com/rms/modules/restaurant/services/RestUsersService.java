package com.rms.modules.restaurant.services;

import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.UsersServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import jakarta.transaction.Transactional;

import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.RestaurantBranchRepository;

import org.springframework.beans.factory.annotation.Autowired;
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

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;

@Service
@Qualifier("restUsersService")
public class RestUsersService implements UsersServiceIMP {

	private final UsersRepository usersrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private RestaurantBranchRepository restaurantBranchRepository;

	@Autowired
	private SubscriptionRepository subscriptionRepository;

	public RestUsersService(UsersRepository usersrepository, RestaurantBranchRepository restaurantbranchrepository) {
		this.usersrepository = usersrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
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
	
	  public List<UsersEntity> getAllRecordUsers(String token, String userType) throws Exception {

	        // 🔐 ADMIN AUTH
	        Authorization.authorizeRestaurant(token);

	        if (userType == null || userType.isBlank()) {
	            throw new IllegalArgumentException("userType is required");
	        }

	        // 🔥 ROLE BASED USERS
	        return usersrepository.findAllByRoleIgnoreCase(userType);
	    }
//	public List<UsersEntity> getAllRecordUsers(String token, String userType) throws Exception {
//
//	    System.out.println("\n=========== GET USERS START ===========");
//
//	    // 🔐 AUTH
//	    Authorization.authorizeRestaurant(token);
//
//	    if (userType == null || userType.isBlank()) {
//	        throw new IllegalArgumentException("userType is required");
//	    }
//
//	    // ================= TOKEN DECRYPT =================
//	    System.out.println("🔐 Decrypting token...");
//
//	    tokenUtil.decryptAndStoreToken(token);
//	    Integer currentUserId = tokenUtil.getCurrentUserId();
//	    tokenUtil.clearTokenData();
//
//	    if (currentUserId == null) {
//	        throw new RuntimeException("Invalid token: user not found");
//	    }
//
//	    Long restaurantId = currentUserId.longValue();
//	    System.out.println("🏪 Restaurant ID from token : " + restaurantId);
//
//	    // ================= FETCH RESTAURANT =================
//	    UsersEntity restaurant =
//	            usersrepository.findById(restaurantId)
//	                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//	    System.out.println("✅ Restaurant found : " + restaurant.getId());
//
//	    // ================= FETCH USERS =================
//	    System.out.println("🔍 Fetching users by role + restaurant...");
//
//	    List<UsersEntity> users =
//	            usersrepository.findAllByRoleIgnoreCaseAndParentId(
//	                    userType,
//	                    restaurant
//	            );
//
//	    System.out.println("👥 Total Users Found : " + users.size());
//	    System.out.println("=========== GET USERS END ===========\n");
//
//	    return users;
//	}


	public List<UsersEntity> getByRestaurantId(String token,String userType) throws Exception {
		Authorization.authorizeRestaurant(token);

		// 🔓 Token Decrypt
		tokenUtil.decryptAndStoreToken(token);
		Integer currentUserId = tokenUtil.getCurrentUserId();
		
		return usersrepository.findByParentId_idAndRoleIgnoreCase(currentUserId.longValue(),userType);
	}

	public Map<String, Object> getUsersWithFilters(String role, LocalDate fromDate, LocalDate toDate, Boolean isActive,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 Admin Authorization
		Authorization.authorizeRestaurant(token);

		// 🔓 Token Decrypt
		tokenUtil.decryptAndStoreToken(token);
		Integer currentUserId = tokenUtil.getCurrentUserId();

		Specification<UsersEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= SOFT DELETE (MANDATORY) =================
			predicates.add(cb.equal(root.get("isDeleted"), false));

			// ================= PARENT ID FILTER (MANDATORY) =================
			predicates.add(cb.equal(root.get("parentId").get("id"), currentUserId.longValue()));

			// ================= ROLE FILTER =================
			if (role != null && !role.trim().isEmpty()) {
				predicates.add(cb.equal(cb.upper(root.get("role")), role.trim().toUpperCase()));
			}

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates
						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			}

			// Active filter (outside search block)
			if (isActive != null) {
				predicates.add(cb.equal(root.get("isActive"), isActive));
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.trim().isEmpty()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				// String fields
				searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("email")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("mobile")), pattern));

				// Boolean search
				if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
					Boolean active = Boolean.valueOf(searchValue);
					searchPredicates.add(cb.equal(root.get("isActive"), active));
				}

				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page<UsersEntity> page = usersrepository.findAll(spec, pageable);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	@Override
	public List<UsersEntity> getAllRecordUsers(String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		return usersrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllUsers(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = usersrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public UsersEntity getOneUsers(Long id, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		return usersrepository.findById(id).orElseThrow(() -> new RuntimeException("Users not found"));
	}

//    @Override
//    public String addUsers(UsersEntity usersEntity, String token) throws Exception {
//        Authorization.authorizeRestaurant(token);
//        UsersEntity newEntity = new UsersEntity();
//
//        // Copy non-foreign fields using reflection
//        for (Field field : UsersEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//            Object value = field.get(usersEntity);
//            if (value != null && !field.getName().endsWith("Id")) {
//                field.set(newEntity, value);
//            }
//        }
//
//        // Handle parent_id foreign key
//        if (usersEntity.getParentId() != null && usersEntity.getParentId().getId() != null) {
//            newEntity.setParentId(
//                fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found")
//            );
//        }
//
//        // Handle branch_id foreign key
//        if (usersEntity.getBranchId() != null && usersEntity.getBranchId().getId() != null) {
//            newEntity.setBranchId(
//                fetchReferenceById(usersEntity.getBranchId(), restaurantbranchrepository, "Restaurant_branch not found")
//            );
//        }
//
//        usersrepository.save(newEntity);
//        return "Added Successfully";
//    }
//    @Override
//    @Transactional
//    public String addUsers(UsersEntity usersEntity, String token) throws Exception {
//
//        System.out.println("🚀 addUsers() STARTED");
//
//        try {
//            // ================= AUTHORIZATION =================
//            Authorization.authorizeRestaurant(token);
//
//            // ================= TOKEN DECRYPT =================
//            tokenUtil.decryptAndStoreToken(token);
//            Integer currentUserId = tokenUtil.getCurrentUserId();
//
//            System.out.println("🆔 Current Restaurant ID: " + currentUserId);
//
//            // ================= MOBILE UNIQUE CHECK =================
//            String mobile = usersEntity.getMobile();
//
//            if (mobile == null || mobile.trim().isEmpty()) {
//                throw new RuntimeException("Mobile number is required");
//            }
//
//            if (usersRepository.existsByMobile(mobile)) {
//                throw new RuntimeException("Mobile number already exists");
//            }
//
//            // ================= BRANCH ID (MANDATORY) =================
//            if (usersEntity.getBranchId() == null || usersEntity.getBranchId().getId() == null) {
//                throw new RuntimeException("BranchId is mandatory");
//            }
//
//            Long branchId = usersEntity.getBranchId().getId();
//
//            UsersEntity branch = usersRepository
//                    .findById(branchId)
//                    .orElseThrow(() -> new RuntimeException("Branch not found"));
//
//            // ================= PARENT USER (FROM TOKEN ONLY) =================
//            UsersEntity parentUser = usersRepository.findById(currentUserId.longValue())
//                    .orElseThrow(() -> new RuntimeException("Parent user not found from token"));
//
//            System.out.println("✅ Parent User: " + parentUser.getId());
//            System.out.println("✅ Branch Verified: " + branch.getId());
//
//            // ================= ENTITY COPY =================
//            UsersEntity newEntity = new UsersEntity();
//
//            for (Field field : UsersEntity.class.getDeclaredFields()) {
//                field.setAccessible(true);
//                Object value = field.get(usersEntity);
//
//                // ❌ Skip id & parentId
//                if (value != null &&
//                    !field.getName().equals("id") &&
//                    !field.getName().equals("parentId")) {
//
//                    field.set(newEntity, value);
//                }
//            }
//
//            // ✅ FORCE SET VALUES
//            newEntity.setParentId(parentUser);
//            newEntity.setBranchId(branch);
//
//            // ================= SAVE =================
//            usersRepository.save(newEntity);
//
//            System.out.println("✅ User saved successfully");
//            return "Added Successfully";
//
//        } finally {
//            tokenUtil.clearTokenData();
//            System.out.println("🧹 Token data cleared");
//            System.out.println("🏁 addUsers() COMPLETED");
//        }
//    }

	@Override
	@Transactional
	public UsersEntity addUsers(UsersEntity usersEntity, String token) throws Exception {

		System.out.println("🚀 addUsers() STARTED");

		try {
			// ================= AUTH =================
			Authorization.authorizeRestaurant(token);

			// ================= TOKEN =================
			tokenUtil.decryptAndStoreToken(token);
			Integer restaurantId = tokenUtil.getCurrentUserId();

			System.out.println("🆔 Restaurant ID from Token: " + restaurantId);

			// ================= MOBILE CHECK =================
			String mobile = usersEntity.getMobile();

			if (mobile == null || mobile.trim().isEmpty()) {
				throw new RuntimeException("Mobile number is required");
			}

			if (usersRepository.existsByMobile(mobile)) {
				throw new RuntimeException("Mobile number already exists");
			}

			// ================= FETCH RESTAURANT =================
			UsersEntity restaurant = usersRepository.findById(restaurantId.longValue())
					.orElseThrow(() -> new RuntimeException("Restaurant not found from token"));

			// ================= SUBSCRIPTION CHECK =================
			List<SubscriptionEntity> activeSubs = subscriptionRepository.findActiveSubscriptionsByUserId(restaurantId.longValue());
			if (activeSubs.isEmpty()) {
				throw new RuntimeException("No active subscription. Please subscribe to a plan.");
			}
			SubscriptionEntity sub = activeSubs.get(0);

			// ================= ROLE =================
			String role = usersEntity.getRole();

			if (role == null || role.trim().isEmpty()) {
				throw new RuntimeException("Role is mandatory");
			}

			// ================= ROLE-BASED LIMIT CHECK =================
			if (role.equalsIgnoreCase("branch")) {
				Integer maxBranch = sub.getPlan().getMaxBranch();
				if (maxBranch != null) {
					long count = usersRepository.countByParentId_idAndRoleIgnoreCaseAndIsDeletedFalse(restaurantId.longValue(), "branch");
					if (count >= maxBranch) {
						throw new RuntimeException("Branch limit reached (" + maxBranch + "). Please upgrade your plan.");
					}
				}
			} else if (role.equalsIgnoreCase("kitchen")) {
				Integer maxKitchen = sub.getPlan().getMaxKitchen();
				if (maxKitchen != null) {
					long count = usersRepository.countByParentId_idAndRoleIgnoreCaseAndIsDeletedFalse(restaurantId.longValue(), "kitchen");
					if (count >= maxKitchen) {
						throw new RuntimeException("Kitchen limit reached (" + maxKitchen + "). Please upgrade your plan.");
					}
				}
			} else if (role.equalsIgnoreCase("delivery")) {
				Integer maxDelivery = sub.getPlan().getMaxDeliveryBoy();
				if (maxDelivery != null) {
					long count = usersRepository.countByParentId_idAndRoleIgnoreCaseAndIsDeletedFalse(restaurantId.longValue(), "delivery");
					if (count >= maxDelivery) {
						throw new RuntimeException("Delivery boy limit reached (" + maxDelivery + "). Please upgrade your plan.");
					}
				}
			}

			UsersEntity branch = null;

			// ================= ROLE BASED LOGIC =================
			if (!role.equalsIgnoreCase("BRANCH")) {

				// ❌ BRANCH ID COMPULSORY FOR NON-BRANCH USERS
				if (usersEntity.getBranchId() == null || usersEntity.getBranchId().getId() == null) {
					throw new RuntimeException("BranchId is mandatory for role: " + role);
				}

				Long branchId = usersEntity.getBranchId().getId();

				branch = usersRepository.findById(branchId).orElseThrow(() -> new RuntimeException("Branch not found"));

				System.out.println("✅ Branch Verified: " + branch.getId());
			}

			// ================= COPY ENTITY =================
			UsersEntity newEntity = new UsersEntity();

			for (Field field : UsersEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(usersEntity);

				if (value != null && !field.getName().equals("id") && !field.getName().equals("parentId")
						&& !field.getName().equals("branchId")) {

					field.set(newEntity, value);
				}
			}

			// ================= FORCE SET =================
			newEntity.setParentId(restaurant);

			if (branch != null) {
				newEntity.setBranchId(branch);
			}

			// ================= SAVE =================
			UsersEntity saved = usersRepository.save(newEntity);

			System.out.println("✅ User saved successfully with role: " + role);
			return saved;

		} finally {
			tokenUtil.clearTokenData();
			System.out.println("🧹 Token data cleared");
			System.out.println("🏁 addUsers() COMPLETED");
		}
	}

	@Override
	public String updateUsers(UsersEntity usersEntity, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		UsersEntity existingEntity = usersrepository.findById(usersEntity.getId())
				.orElseThrow(() -> new RuntimeException("Users not found"));

		// Update non-foreign fields using reflection
		for (Field field : UsersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(usersEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle parent_id foreign key
		if (usersEntity.getParentId() != null && usersEntity.getParentId().getId() != null) {
			existingEntity
					.setParentId(fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found"));
		}

		// Handle branch_id foreign key
		if (usersEntity.getBranchId() != null && usersEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(
					fetchReferenceById(usersEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		usersrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteUsers(Long id, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		if (!usersrepository.existsById(id)) {
			throw new RuntimeException("Users not found");
		}
		usersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleUsers(List<UsersEntity> usersEntitys, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		List<UsersEntity> entitiesToSave = new ArrayList<>();

		for (UsersEntity entity : usersEntitys) {
			UsersEntity newEntity = new UsersEntity();

			// Copy non-foreign fields using reflection
			for (Field field : UsersEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle parent_id foreign key
			if (entity.getParentId() != null && entity.getParentId().getId() != null) {
				newEntity.setParentId(fetchReferenceById(entity.getParentId(), usersrepository, "Users not found"));
			}

			// Handle branch_id foreign key
			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				newEntity.setBranchId(
						fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found"));
			}

			entitiesToSave.add(newEntity);
		}

		usersrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<UsersEntity> getUsersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<UsersEntity> getUsersByCreatedat(LocalDate createdat, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return usersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<UsersEntity> getUsersByLastloginBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByLastLoginBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByLastloginBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = usersrepository.findByLastLoginBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<UsersEntity> getUsersByLastlogin(LocalDate lastlogin, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = lastlogin.atStartOfDay();
		return usersrepository.findByLastLogin(dateTime);
	}

	@Override
	public List<UsersEntity> getUsersByLastloginatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByLastloginatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<UsersEntity> getUsersByLastloginat(LocalDate lastloginat, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = lastloginat.atStartOfDay();
		return usersrepository.findByLastLoginAt(dateTime);
	}

	@Override
	public List<UsersEntity> getUsersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<UsersEntity> getUsersByUpdatedat(LocalDate updatedat, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return usersrepository.findByUpdatedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<UsersEntity> page = usersrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("Userss");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Created_at");
			header.createCell(2).setCellValue("Email");
			header.createCell(3).setCellValue("Is_active");
			header.createCell(4).setCellValue("Is_deleted");
			header.createCell(5).setCellValue("Last_login");
			header.createCell(6).setCellValue("Last_login_at");
			header.createCell(7).setCellValue("Mobile");
			header.createCell(8).setCellValue("Name");
			header.createCell(9).setCellValue("Password");
			header.createCell(10).setCellValue("Role");
			header.createCell(11).setCellValue("Updated_at");
			header.createCell(12).setCellValue("User_type");
			header.createCell(13).setCellValue("Parent_id");
			header.createCell(14).setCellValue("Branch_id");

			int rowNum = 1;
			for (UsersEntity usersEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(usersEntity.getId() != null ? usersEntity.getId() : 0);
				LocalDateTime createdAt = usersEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(1).setCellValue(formattedCreatedAt);
				row.createCell(2).setCellValue(usersEntity.getEmail() != null ? usersEntity.getEmail() : "N/A");
				row.createCell(3).setCellValue(
						usersEntity.getIsActive() != null && usersEntity.getIsActive() ? "Active" : "Inactive");
				row.createCell(4).setCellValue(
						usersEntity.getIsDeleted() != null && usersEntity.getIsDeleted() ? "Active" : "Inactive");
				LocalDateTime lastLogin = usersEntity.getLastLogin();
				String formattedLastLogin = (lastLogin != null) ? lastLogin.format(dateTimeFormat) : "";
				row.createCell(5).setCellValue(formattedLastLogin);
				LocalDateTime lastLoginAt = usersEntity.getLastLoginAt();
				String formattedLastLoginAt = (lastLoginAt != null) ? lastLoginAt.format(dateTimeFormat) : "";
				row.createCell(6).setCellValue(formattedLastLoginAt);
				row.createCell(7).setCellValue(usersEntity.getMobile() != null ? usersEntity.getMobile() : "N/A");
				row.createCell(8).setCellValue(usersEntity.getName() != null ? usersEntity.getName() : "N/A");
				row.createCell(9).setCellValue(usersEntity.getPassword() != null ? usersEntity.getPassword() : "N/A");
				row.createCell(10).setCellValue(usersEntity.getRole() != null ? usersEntity.getRole() : "N/A");
				LocalDateTime updatedAt = usersEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(11).setCellValue(formattedUpdatedAt);
//                row.createCell(12).setCellValue(usersEntity.getUserType() != null ? usersEntity.getUserType() : "N/A");
				row.createCell(12)
						.setCellValue(usersEntity.getParentId() != null ? usersEntity.getParentId().toString() : "N/A");
				row.createCell(13)
						.setCellValue(usersEntity.getBranchId() != null ? usersEntity.getBranchId().toString() : "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
