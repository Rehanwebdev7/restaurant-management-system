package com.rms.modules.branch.services;

import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.serviceImplement.RestaurantBranchServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.PincodesRepository;
import com.rms.common.repositories.UsersRepository;

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

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;

@Service
@Qualifier("restRestaurantBranchService")
public class BrRestaurantBranchService implements RestaurantBranchServiceIMP {

    private final RestaurantBranchRepository restaurantbranchrepository;
    private final PincodesRepository pincodesrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private TokenUtil tokenUtil;
    
    @Autowired
    private RestaurantBranchRepository restaurantBranchRepository;

    public BrRestaurantBranchService(RestaurantBranchRepository restaurantbranchrepository, PincodesRepository pincodesrepository, UsersRepository usersrepository) {
        this.restaurantbranchrepository = restaurantbranchrepository;
        this.pincodesrepository = pincodesrepository;
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
    
    public Map<String, Object> getBranchesWithFilters(
            LocalDate fromDate,
            LocalDate toDate,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token) throws Exception {

        // 🔐 Admin Authorization
        Authorization.authorizeBranch(token);

        // 🔓 Token Decrypt
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        System.out.println("🆔 Current User ID from Token: " + currentUserId);

        Specification<RestaurantBranchEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // ================= SOFT DELETE (MANDATORY) =================
            predicates.add(cb.equal(root.get("isDeleted"), false));

            // ================= 🔥 OWN DATA ONLY (MANDATORY) =================
            predicates.add(
                cb.equal(
                    root.get("restaurantId").get("id"),
                    currentUserId.longValue()
                )
            );

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

            // ================= SEARCH FILTER =================
            if (searchValue != null && !searchValue.trim().isEmpty()) {

                String pattern = "%" + searchValue.toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();

                // 🔹 Branch fields
                searchPredicates.add(cb.like(cb.lower(root.get("branchName")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("address")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("phone")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("email")), pattern));

                // 🔹 Boolean isActive
                if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
                    searchPredicates.add(
                        cb.equal(root.get("isActive"), Boolean.valueOf(searchValue))
                    );
                }

                // 🔥 JOIN WITH RESTAURANT (UsersEntity)
                Join<RestaurantBranchEntity, UsersEntity> restaurantJoin =
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

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<RestaurantBranchEntity> page =
                restaurantBranchRepository.findAll(spec, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }
    
    public Map<String, Object> getAllRestaurantBranchId(
            Integer pageNumber,
            Integer pageSize,
            String token
    ) throws Exception {

        // 🔐 RESTAURANT AUTH
        Authorization.authorizeBranch(token);

        // 🔓 TOKEN → restaurantId
        tokenUtil.decryptAndStoreToken(token);
        Integer currentRestaurantId = tokenUtil.getCurrentUserId();

        Pageable pageable = PageRequest.of(
                pageNumber,
                pageSize,
                Sort.by(Sort.Direction.DESC, "id")
        );

        // ✅ ONLY LOGGED-IN RESTAURANT BRANCHES
        Page<RestaurantBranchEntity> page =
                restaurantbranchrepository.findByRestaurantId_Id(
                        currentRestaurantId.longValue(),
                        pageable
                );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }



    @Override
    public List<RestaurantBranchEntity> getAllRecordRestaurantBranch(String token) throws Exception {
        Authorization.authorizeBranch(token);
        return restaurantbranchrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllRestaurantBranch(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = restaurantbranchrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public RestaurantBranchEntity getOneRestaurantBranch(Long id, String token) throws Exception {
        Authorization.authorizeBranch(token);
        return restaurantbranchrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RestaurantBranch not found"));
    }

//    @Override
//    public String addRestaurantBranch(RestaurantBranchEntity restaurant_branchEntity, String token) throws Exception {
//        Authorization.authorizeBranch(token);
//        RestaurantBranchEntity newEntity = new RestaurantBranchEntity();
//
//        // Copy non-foreign fields using reflection
//        for (Field field : RestaurantBranchEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//            Object value = field.get(restaurant_branchEntity);
//            if (value != null && !field.getName().endsWith("Id")) {
//                field.set(newEntity, value);
//            }
//        }
//
//        // Handle pincode_id foreign key
//        if (restaurant_branchEntity.getPincodeId() != null && restaurant_branchEntity.getPincodeId().getId() != null) {
//            newEntity.setPincodeId(
//                fetchReferenceById(restaurant_branchEntity.getPincodeId(), pincodesrepository, "Pincodes not found")
//            );
//        }
//
//        // Handle restaurant_id foreign key
//        if (restaurant_branchEntity.getRestaurantId() != null && restaurant_branchEntity.getRestaurantId().getId() != null) {
//            newEntity.setRestaurantId(
//                fetchReferenceById(restaurant_branchEntity.getRestaurantId(), usersrepository, "Users not found")
//            );
//        }
//
//        restaurantbranchrepository.save(newEntity);
//        return "Added Successfully";
//    }
    
    @Override
    @Transactional
    public String addRestaurantBranch(
            RestaurantBranchEntity restaurant_branchEntity,
            String token) throws Exception {

        System.out.println("🚀 addRestaurantBranch() STARTED");

        // ================= AUTH =================
        Authorization.authorizeRestaurant(token);

        // ================= TOKEN DECRYPT =================
        tokenUtil.decryptAndStoreToken(token);
        Integer branchIdFromToken = tokenUtil.getCurrentUserId();

        System.out.println("🔓 Token Decrypted");
        System.out.println("🆔 Branch ID from Token: " + branchIdFromToken);

        // ================= FETCH BRANCH =================
        RestaurantBranchEntity parentBranch =
                restaurantbranchrepository.findById(branchIdFromToken.longValue())
                        .orElseThrow(() -> new RuntimeException("Branch not found from token"));

        // ================= FETCH PARENT RESTAURANT =================
        UsersEntity parentRestaurant = parentBranch.getRestaurantId();

        if (parentRestaurant == null) {
            throw new RuntimeException("Parent Restaurant not linked with branch");
        }

        System.out.println("🏢 Parent Restaurant ID: " + parentRestaurant.getId());

        RestaurantBranchEntity newEntity = new RestaurantBranchEntity();

        // ================= COPY NON-FK FIELDS =================
        for (Field field : RestaurantBranchEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(restaurant_branchEntity);

            if (value != null &&
                !field.getName().equals("id") &&
                !field.getName().endsWith("Id")) {

                field.set(newEntity, value);
            }
        }

        // ================= MOBILE UNIQUE CHECK =================
        String mobile = restaurant_branchEntity.getPhone();

        if (mobile == null || mobile.trim().isEmpty()) {
            throw new RuntimeException("Mobile number is required");
        }

        if (restaurantbranchrepository.existsByPhone(mobile)) {
            throw new RuntimeException("Mobile number already exists");
        }

        // ================= PINCODE FK =================
        if (restaurant_branchEntity.getPincodeId() != null &&
            restaurant_branchEntity.getPincodeId().getId() != null) {

            newEntity.setPincodeId(
                fetchReferenceById(
                    restaurant_branchEntity.getPincodeId(),
                    pincodesrepository,
                    "Pincode not found"
                )
            );
        }

        // ================= SET RESTAURANT FROM PARENT BRANCH =================
        newEntity.setRestaurantId(parentRestaurant);

        System.out.println("✅ Restaurant ID set using parent branch");

        // ================= SAVE =================
        restaurantbranchrepository.save(newEntity);

        // ================= CLEAR TOKEN =================
        tokenUtil.clearTokenData();

        System.out.println("🧹 Token data cleared");
        System.out.println("🏁 addRestaurantBranch() COMPLETED");

        return "Branch Added Successfully";
    }



    @Override
    public String updateRestaurantBranch(RestaurantBranchEntity restaurant_branchEntity, String token) throws Exception {
        Authorization.authorizeBranch(token);
        RestaurantBranchEntity existingEntity = restaurantbranchrepository.findById(restaurant_branchEntity.getId())
                .orElseThrow(() -> new RuntimeException("RestaurantBranch not found"));

        // Update non-foreign fields using reflection
        for (Field field : RestaurantBranchEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(restaurant_branchEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle pincode_id foreign key
        if (restaurant_branchEntity.getPincodeId() != null && restaurant_branchEntity.getPincodeId().getId() != null) {
            existingEntity.setPincodeId(
                fetchReferenceById(restaurant_branchEntity.getPincodeId(), pincodesrepository, "Pincodes not found")
            );
        }

        // Handle restaurant_id foreign key
        if (restaurant_branchEntity.getRestaurantId() != null && restaurant_branchEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(restaurant_branchEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        restaurantbranchrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteRestaurantBranch(Long id, String token) throws Exception {
        Authorization.authorizeBranch(token);
        if (!restaurantbranchrepository.existsById(id)) {
            throw new RuntimeException("RestaurantBranch not found");
        }
        restaurantbranchrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleRestaurantBranch(List<RestaurantBranchEntity> restaurant_branchEntitys, String token) throws Exception {
        Authorization.authorizeBranch(token);
        List<RestaurantBranchEntity> entitiesToSave = new ArrayList<>();

        for (RestaurantBranchEntity entity : restaurant_branchEntitys) {
            RestaurantBranchEntity newEntity = new RestaurantBranchEntity();

            // Copy non-foreign fields using reflection
            for (Field field : RestaurantBranchEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle pincode_id foreign key
            if (entity.getPincodeId() != null && entity.getPincodeId().getId() != null) {
                newEntity.setPincodeId(
                    fetchReferenceById(entity.getPincodeId(), pincodesrepository, "Pincodes not found")
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

        restaurantbranchrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<RestaurantBranchEntity> getRestaurantBranchByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return restaurantbranchrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getRestaurantBranchByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = restaurantbranchrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<RestaurantBranchEntity> getRestaurantBranchByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return restaurantbranchrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<RestaurantBranchEntity> getRestaurantBranchByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return restaurantbranchrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getRestaurantBranchByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = restaurantbranchrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<RestaurantBranchEntity> getRestaurantBranchByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return restaurantbranchrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<RestaurantBranchEntity> page = restaurantbranchrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("RestaurantBranchs");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Address");
            header.createCell(2).setCellValue("Branch_name");
            header.createCell(3).setCellValue("Created_at");
            header.createCell(4).setCellValue("Email");
            header.createCell(5).setCellValue("Is_active");
            header.createCell(6).setCellValue("Is_deleted");
            header.createCell(7).setCellValue("Latitude");
            header.createCell(8).setCellValue("Longitude");
            header.createCell(9).setCellValue("Phone");
            header.createCell(10).setCellValue("Restaurant_id");
            header.createCell(11).setCellValue("Updated_at");
            header.createCell(12).setCellValue("Pincode_id");

            int rowNum = 1;
            for (RestaurantBranchEntity restaurant_branchEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(restaurant_branchEntity.getId() != null ? restaurant_branchEntity.getId() : 0);
                row.createCell(1).setCellValue(restaurant_branchEntity.getAddress() != null ? restaurant_branchEntity.getAddress() : "N/A");
                row.createCell(2).setCellValue(restaurant_branchEntity.getBranchName() != null ? restaurant_branchEntity.getBranchName() : "N/A");
                LocalDateTime createdAt = restaurant_branchEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(3).setCellValue(formattedCreatedAt);
                row.createCell(4).setCellValue(restaurant_branchEntity.getEmail() != null ? restaurant_branchEntity.getEmail() : "N/A");
                row.createCell(5).setCellValue(restaurant_branchEntity.getIsActive() != null && restaurant_branchEntity.getIsActive() ? "Active" : "Inactive");
                row.createCell(6).setCellValue(restaurant_branchEntity.getIsDeleted() != null && restaurant_branchEntity.getIsDeleted() ? "Active" : "Inactive");
                row.createCell(7).setCellValue(restaurant_branchEntity.getLatitude() != null ? restaurant_branchEntity.getLatitude().doubleValue() : 0.0);
                row.createCell(8).setCellValue(restaurant_branchEntity.getLongitude() != null ? restaurant_branchEntity.getLongitude().doubleValue() : 0.0);
                row.createCell(9).setCellValue(restaurant_branchEntity.getPhone() != null ? restaurant_branchEntity.getPhone() : "N/A");
                row.createCell(10).setCellValue(restaurant_branchEntity.getRestaurantId() != null ? restaurant_branchEntity.getRestaurantId().toString() : "N/A");
                LocalDateTime updatedAt = restaurant_branchEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedUpdatedAt);
                row.createCell(12).setCellValue(restaurant_branchEntity.getPincodeId() != null ? restaurant_branchEntity.getPincodeId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
