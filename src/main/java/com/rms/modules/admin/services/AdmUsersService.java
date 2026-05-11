package com.rms.modules.admin.services;

import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.SubscriptionPlanEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionPlanRepository;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.UsersServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;

import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.PincodesRepository;
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
import org.json.JSONObject;
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

@Service
@Qualifier("admUsersService")
public class AdmUsersService implements UsersServiceIMP {

    private final UsersRepository usersrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    
    @Autowired
    private TokenUtil tokenUtil;
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private PincodesRepository pincodesRepository;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    public AdmUsersService(UsersRepository usersrepository, RestaurantBranchRepository restaurantbranchrepository) {
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
    
//    @Override
    public List<UsersEntity> getAllRecordUsers(String token, String userType) throws Exception {

        // 🔐 ADMIN AUTH
        Authorization.authorizeAdmin(token);

        if (userType == null || userType.isBlank()) {
            throw new IllegalArgumentException("userType is required");
        }

        // 🔥 ROLE BASED USERS
        return usersrepository.findAllByRoleIgnoreCase(userType);
    }


    
//    public Map<String, Object> getUsersWithFilters(
//            String role,
//            LocalDate fromDate,
//            LocalDate toDate,
//            String searchValue,
//            Integer pageNumber,
//            Integer pageSize,
//            String token) throws Exception {
//
//        // ✅ Admin auth
//        Authorization.authorizeAdmin(token);
//
//        Specification<UsersEntity> spec = (root, query, cb) -> {
//            List<Predicate> predicates = new ArrayList<>();
//
//            // 🔹 ROLE filter
//            if (role != null && !role.trim().isEmpty()) {
//                predicates.add(cb.equal(root.get("role"), role));
//            }
//
//            // 🔹 Date range filter
//            if (fromDate != null && toDate != null) {
//                predicates.add(cb.between(
//                        root.get("createdAt"),
//                        fromDate,
//                        toDate
//                ));
//            }
//
//            // 🔹 Search filter (name / brand / mobile)
//            if (searchValue != null && !searchValue.trim().isEmpty()) {
//                String pattern = "%" + searchValue.toLowerCase() + "%";
//
//                Predicate searchPredicate = cb.or(
//                        cb.like(cb.lower(root.get("authorisedName")), pattern),
//                        cb.like(cb.lower(root.get("brandName")), pattern),
//                        cb.like(cb.lower(root.get("legalName")), pattern),
//                        cb.like(cb.lower(root.get("mobileNumber")), pattern)
//                );
//                predicates.add(searchPredicate);
//            }
//
//            // ✅ agar predicates empty hue → ALL RECORDS
//            return predicates.isEmpty()
//                    ? cb.conjunction()
//                    : cb.and(predicates.toArray(new Predicate[0]));
//        };
//
//        Pageable pageable = PageRequest.of(pageNumber, pageSize);
//        Page<UsersEntity> page = usersrepository.findAll(spec, pageable);
//
//        List<Map<String, Object>> finalList = new ArrayList<>();
//
//        for (UsersEntity user : page.getContent()) {
//
//            
//
//            Map<String, Object> row = new LinkedHashMap<>();
//            row.put("user", user);
//
//            finalList.add(row);
//        }
//
//        Map<String, Object> response = new LinkedHashMap<>();
//        response.put("totalRecords", page.getTotalElements());
//        response.put("pageSize", page.getSize());
//        response.put("currentPage", page.getNumber() + 1);
//        response.put("totalPages", page.getTotalPages());
//        response.put("records", finalList);
//
//        return response;
//    }
    
//    
//    @Override
    public Map<String, Object> getUsersWithFilters(
            String role,
            Boolean active,  
            LocalDate fromDate,
            LocalDate toDate,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token) throws Exception {

        // 🔐 Admin Authorization
        Authorization.authorizeAdmin(token);

        Specification<UsersEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();
            
            // ================= SOFT DELETE (MANDATORY) =================
	        predicates.add(cb.equal(root.get("isDeleted"), false));

            // ================= ROLE FILTER =================
            if (role != null && !role.trim().isEmpty()) {
                predicates.add(
                    cb.equal(
                        cb.upper(root.get("role")),
                        role.trim().toUpperCase()
                    )
                );
            }
            
         // ================= ACTIVE FILTER (NEW) =================
            if (active != null) {
                predicates.add(cb.equal(root.get("isActive"), active));
            }

            // ================= DATE FILTER (createdAt) =================
            if (fromDate != null && toDate != null) {
                predicates.add(
                    cb.between(
                        root.get("createdAt"),
                        fromDate.atStartOfDay(),
                        toDate.atTime(LocalTime.MAX)
                    )
                );
            }

            // ================= SEARCH FILTER =================
//            if (searchValue != null && !searchValue.trim().isEmpty()) {
//
//                String pattern = "%" + searchValue.toLowerCase() + "%";
//
//                Predicate searchPredicate = cb.or(
//                        cb.like(cb.lower(root.get("name")), pattern),
//                        cb.like(cb.lower(root.get("email")), pattern),
//                        cb.like(cb.lower(root.get("mobile")), pattern)
//                );
//
//                predicates.add(searchPredicate);
//            }
            
            if (searchValue != null && !searchValue.trim().isEmpty()) {

                String pattern = "%" + searchValue.toLowerCase() + "%";

                List<Predicate> searchPredicates = new ArrayList<>();

                // String fields
                searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("email")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("mobile")), pattern));

//                // Boolean field (isActive)
//                if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
//                    Boolean active = Boolean.valueOf(searchValue);
//                    searchPredicates.add(cb.equal(root.get("isActive"), active));
//                }

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }


            // ================= DEFAULT (ALL DATA) =================
            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("id").descending());
        Page<UsersEntity> page = usersrepository.findAll(spec, pageable);

//        List<Map<String, Object>> finalList = new ArrayList<>();
//
//        for (UsersEntity user : page.getContent()) {
//            Map<String, Object> row = new LinkedHashMap<>();
////            row.put("user", user);
//            finalList.add(row);
//        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent()); // ✅ DIRECT USERS

        return response;
    }

    
    @Override
    public List<UsersEntity> getAllRecordUsers(String token) throws Exception {
        Authorization.authorizeAdmin(token);
        return usersrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllUsers(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        return usersrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Users not found"));
    }

//    @Override
//    public String addUsers(UsersEntity usersEntity, String token) throws Exception {
//        Authorization.authorizeAdmin(token);
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
    @Override
    @Transactional
    public UsersEntity addUsers(UsersEntity usersEntity, String token) throws Exception {

        System.out.println("🚀 addUsers() STARTED");

        try {
            // ================= AUTHORIZATION =================
            Authorization.authorizeAdmin(token);

            // ================= TOKEN DECRYPT (STANDARD) =================
            JSONObject tokenData = tokenUtil.decryptAndStoreToken(token);
            Integer currentUserId = tokenUtil.getCurrentUserId();

            System.out.println("🔓 Token Decrypted");
            System.out.println("🆔 Current Admin ID: " + currentUserId);

            // ================= MOBILE UNIQUE CHECK (GLOBAL) =================
            String mobile = usersEntity.getMobile();
            System.out.println("📱 Mobile from payload: " + mobile);

            if (mobile == null || mobile.trim().isEmpty()) {
                throw new RuntimeException("Mobile number is required");
            }

            // ✅ GLOBAL UNIQUE CHECK
            boolean mobileExists = usersRepository.existsByMobile(mobile);
            if (mobileExists) {
                System.out.println("❌ Mobile already exists in users table: " + mobile);
                throw new RuntimeException("Mobile number already exists");
            }

            System.out.println("✅ Mobile is globally unique");

            // ================= PARENT USER RESOLUTION =================
            UsersEntity parentUser;

            // Case 1️⃣ parentId from payload
            if (usersEntity.getParentId() != null &&
                usersEntity.getParentId().getId() != null) {

                Long parentId = usersEntity.getParentId().getId();
                System.out.println("📌 Parent ID from payload: " + parentId);

                parentUser = usersRepository.findById(parentId)
                        .orElseThrow(() -> new RuntimeException("Parent user not found"));

            }
            // Case 2️⃣ parentId from token
            else {
                System.out.println("📌 Parent ID from token");

                parentUser = usersRepository.findById(currentUserId.longValue())
                        .orElseThrow(() -> new RuntimeException("Parent user not found from token"));
            }

            System.out.println("✅ Parent User Resolved: " + parentUser.getId());

            // ================= ENTITY COPY =================
            UsersEntity newEntity = new UsersEntity();

            for (Field field : UsersEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(usersEntity);

                // ❌ Skip id & parentId
                if (value != null &&
                    !field.getName().equals("id") &&
                    !field.getName().equals("parentId")) {

                    field.set(newEntity, value);
                }
            }

            // ✅ Set Parent
            newEntity.setParentId(parentUser);

            // ================= SAVE =================
            UsersEntity saved = usersRepository.save(newEntity);

            System.out.println("✅ User saved successfully");

            // ================= AUTO FREE PLAN (RESTAURANT ONLY) =================
            if ("restaurant".equalsIgnoreCase(saved.getRole())) {
                subscriptionPlanRepository
                    .findFirstByPlanNameIgnoreCaseAndIsDeletedFalse("Free")
                    .ifPresent(freePlan -> {
                        SubscriptionEntity sub = new SubscriptionEntity();
                        sub.setUser(saved);
                        sub.setPlan(freePlan);
                        LocalDate today = LocalDate.now();
                        sub.setStartDate(today);
                        sub.setEndDate(today.plusDays(freePlan.getDurationDays() != null ? freePlan.getDurationDays() : 30));
                        sub.setAmountPaid(java.math.BigDecimal.ZERO);
                        sub.setDiscountAmount(java.math.BigDecimal.ZERO);
                        sub.setStatus("active");
                        subscriptionRepository.save(sub);
                        System.out.println("✅ Free plan auto-assigned to new restaurant: " + saved.getId());
                    });
            }

            return saved;

        } finally {
            // ================= TOKEN CLEAR =================
            tokenUtil.clearTokenData();
            System.out.println("🧹 Token data cleared");
            System.out.println("🏁 addUsers() COMPLETED");
        }
    }


    @Override
    public String updateUsers(UsersEntity usersEntity, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
            existingEntity.setParentId(
                fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found")
            );
        }

        // Handle branch_id foreign key
        if (usersEntity.getBranchId() != null && usersEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(usersEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        usersrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteUsers(Long id, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        UsersEntity record= usersrepository.findById(id)
        		.orElseThrow(() -> new RuntimeException("RestaurantBranch not found"));
//        if (!usersrepository.existsById(id)) {
//            throw new RuntimeException("Users not found");
//        }
//        record.setIsDeleted(true);
//        usersrepository.deleteById(record);
        record.setIsDeleted(true);
		usersrepository.save(record);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleUsers(List<UsersEntity> usersEntitys, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
                newEntity.setParentId(
                    fetchReferenceById(entity.getParentId(), usersrepository, "Users not found")
                );
            }

            // Handle branch_id foreign key
            if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
                newEntity.setBranchId(
                    fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        usersrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<UsersEntity> getUsersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return usersrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByLastloginBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByLastLoginBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByLastloginBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        LocalDateTime dateTime = lastlogin.atStartOfDay();
        return usersrepository.findByLastLogin(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByLastloginatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByLastloginatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
        LocalDateTime dateTime = lastloginat.atStartOfDay();
        return usersrepository.findByLastLoginAt(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeAdmin(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeAdmin(token);
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
        Authorization.authorizeAdmin(token);
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
                row.createCell(3).setCellValue(usersEntity.getIsActive() != null && usersEntity.getIsActive() ? "Active" : "Inactive");
                row.createCell(4).setCellValue(usersEntity.getIsDeleted() != null && usersEntity.getIsDeleted() ? "Active" : "Inactive");
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
                row.createCell(12).setCellValue(usersEntity.getParentId() != null ? usersEntity.getParentId().toString() : "N/A");
                row.createCell(13).setCellValue(usersEntity.getBranchId() != null ? usersEntity.getBranchId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
