package com.rms.modules.cashier.services;

import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.UsersServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

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

@Service
@Qualifier("cashUsersService")
public class CashUsersService implements UsersServiceIMP {

    private final UsersRepository usersrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private TokenUtil tokenUtil;

    public CashUsersService(UsersRepository usersrepository, RestaurantBranchRepository restaurantbranchrepository) {
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
    
    
    public Map<String, Object> getUsersWithFilters(
            String role,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean isActive,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token) throws Exception {

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

        Specification<UsersEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // JOINs
            Join<UsersEntity, UsersEntity> branchJoin =
                    root.join("branchId", JoinType.LEFT);

            Join<UsersEntity, UsersEntity> parentJoin =
                    root.join("parentId", JoinType.LEFT);

            // ================= SOFT DELETE =================
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // ================= BRANCH FILTER =================
            predicates.add(cb.equal(branchJoin.get("id"), branchUser.getId()));

            // ================= RESTAURANT FILTER =================
            predicates.add(cb.equal(parentJoin.get("id"), restaurantUser.getId()));

            // ================= ROLE =================
            if (role != null && !role.trim().isEmpty()) {
                predicates.add(
                        cb.equal(
                                cb.upper(root.get("role")),
                                role.trim().toUpperCase()
                        )
                );
            }
            
            // Active filter (outside search block)
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            // ================= DATE =================
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

                predicates.add(
                        cb.or(
                                cb.like(cb.lower(root.get("name")), pattern),
                                cb.like(cb.lower(root.get("email")), pattern),
                                cb.like(cb.lower(root.get("mobile")), pattern)
                        )
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(
                Math.max(pageNumber, 0),
                pageSize
        );

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
        Authorization.authorizeCashier(token);
        return usersrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllUsers(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
        return usersrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Users not found"));
    }

    @Override
    public String addUsers(UsersEntity usersEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        UsersEntity newEntity = new UsersEntity();

        // Copy non-foreign fields using reflection
        for (Field field : UsersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(usersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle parent_id foreign key
        if (usersEntity.getParentId() != null && usersEntity.getParentId().getId() != null) {
            newEntity.setParentId(
                fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found")
            );
        }

        // Handle branch_id foreign key
        if (usersEntity.getBranchId() != null && usersEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(usersEntity.getBranchId(), usersrepository, "Restaurant_branch not found")
            );
        }

        usersrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateUsers(UsersEntity usersEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
                fetchReferenceById(usersEntity.getBranchId(), usersrepository, "Restaurant_branch not found")
            );
        }

        usersrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteUsers(Long id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!usersrepository.existsById(id)) {
            throw new RuntimeException("Users not found");
        }
        usersrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleUsers(List<UsersEntity> usersEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
                    fetchReferenceById(entity.getBranchId(), usersrepository, "Restaurant_branch not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        usersrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<UsersEntity> getUsersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return usersrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByLastloginBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByLastLoginBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByLastloginBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = lastlogin.atStartOfDay();
        return usersrepository.findByLastLogin(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByLastloginatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByLastloginatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = lastloginat.atStartOfDay();
        return usersrepository.findByLastLoginAt(dateTime);
    }

    @Override
    public List<UsersEntity> getUsersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
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
                row.createCell(9).setCellValue("[protected]"); // do not export password hashes to spreadsheets
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
