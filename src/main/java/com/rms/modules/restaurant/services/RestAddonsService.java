package com.rms.modules.restaurant.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.common.entities.AddonsEntity;
import com.rms.common.entities.AddonsItemsEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.AddonsItemsRepository;
import com.rms.common.repositories.AddonsRepository;
import com.rms.common.serviceImplement.AddonsServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;


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


import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
@Service
@Qualifier("restAddonsService")
public class RestAddonsService implements AddonsServiceIMP {

    private final AddonsRepository addonsrepository;
    private final UsersRepository usersrepository;
    
	@Autowired
	private AddonsRepository addonsRepository;
	
	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private AddonsItemsRepository addonsItemsRepository;
	
	@Autowired
	private UsersRepository usersRepository;

    public RestAddonsService(AddonsRepository addonsrepository, UsersRepository usersrepository) {
        this.addonsrepository = addonsrepository;
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
    
//    @Transactional(rollbackFor = Exception.class)
//    public String addAddons(Map<String, Object> payload, String token) throws Exception {
//
//        // 🔐 Authorization
//        Authorization.authorizeRestaurant(token);
//
//        // 🔓 TOKEN → USER ID
//        tokenUtil.decryptAndStoreToken(token);
//        Integer currentUserId = tokenUtil.getCurrentUserId();
//
//        ObjectMapper objectMapper = new ObjectMapper();
//
//        // =========================
//        // 1️⃣ Extract addonItems
//        // =========================
//        Object addonItemsObj = payload.get("addonItems");
//
//        // =========================
//        // 2️⃣ ADDON MASTER
//        // =========================
//        AddonsEntity newAddonEntity = new AddonsEntity();
//
//        for (Field field : AddonsEntity.class.getDeclaredFields()) {
//
//            field.setAccessible(true);
//            String fieldName = field.getName();
//
//            // ❌ Skip FK & audit
//            if (fieldName.endsWith("Id")
//                    || fieldName.equals("createdAt")
//                    || fieldName.equals("updatedAt")) {
//                continue;
//            }
//
//            if (payload.containsKey(fieldName) && payload.get(fieldName) != null) {
//                Object convertedValue =
//                        objectMapper.convertValue(payload.get(fieldName), field.getType());
//                field.set(newAddonEntity, convertedValue);
//            }
//        }
//
//        // =========================
//        // 3️⃣ RESTAURANT FROM TOKEN
//        // =========================
//        UsersEntity restaurant = usersrepository.findById(Long.valueOf(currentUserId))
//                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//        newAddonEntity.setRestaurantId(restaurant);
//
//        // 💾 Save Addon Master
//        addonsrepository.save(newAddonEntity);
//
//        // =========================
//        // 4️⃣ ADDON ITEMS
//        // =========================
//        if (addonItemsObj instanceof List<?> addonItemsList) {
//
//            for (Object itemObj : addonItemsList) {
//
//                if (!(itemObj instanceof Map<?, ?> itemMap)) {
//                    continue;
//                }
//
//                AddonsItemsEntity newItemEntity = new AddonsItemsEntity();
//
//                for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {
//
//                    field.setAccessible(true);
//                    String fieldName = field.getName();
//
//                    if (fieldName.endsWith("Id")
//                            || fieldName.equals("createdAt")
//                            || fieldName.equals("updatedAt")) {
//                        continue;
//                    }
//
//                    if (itemMap.containsKey(fieldName) && itemMap.get(fieldName) != null) {
//                        Object convertedValue =
//                                objectMapper.convertValue(itemMap.get(fieldName), field.getType());
//                        field.set(newItemEntity, convertedValue);
//                    }
//                }
//
//                newItemEntity.setAddonsId(newAddonEntity);
//                addonsItemsRepository.save(newItemEntity);
//            }
//        }
//
//        return "Added Successfully";
//    }
    
    @Transactional(rollbackFor = Exception.class)
    public String addAddons(Map<String, Object> payload, String token) throws Exception {

        // 🔐 Authorization
        Authorization.authorizeRestaurant(token);

        // 🔓 TOKEN → USER ID
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        ObjectMapper objectMapper = new ObjectMapper();

        // =========================
        // 1️⃣ Extract addonItems
        // =========================
        Object addonItemsObj = payload.get("addonItems");

        // =========================
        // 2️⃣ ADDON MASTER
        // =========================
        AddonsEntity newAddonEntity = new AddonsEntity();

        for (Field field : AddonsEntity.class.getDeclaredFields()) {

            field.setAccessible(true);
            String fieldName = field.getName();

            // ❌ Skip FK & audit
            if (fieldName.endsWith("Id")
                    || fieldName.equals("createdAt")
                    || fieldName.equals("updatedAt")) {
                continue;
            }

            if (payload.containsKey(fieldName) && payload.get(fieldName) != null) {
                Object convertedValue =
                        objectMapper.convertValue(payload.get(fieldName), field.getType());
                field.set(newAddonEntity, convertedValue);
            }
        }

        // =========================
        // 3️⃣ RESTAURANT FROM TOKEN
        // =========================
        UsersEntity restaurant = usersrepository.findById(Long.valueOf(currentUserId))
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        newAddonEntity.setRestaurantId(restaurant);

        // =========================
        // 4️⃣ BRANCH FROM PAYLOAD
        // =========================
        Map<String, Object> branchMap = (Map<String, Object>) payload.get("branchId");

        if (branchMap == null || branchMap.get("id") == null) {
            throw new RuntimeException("branchId is required");
        }

        Long branchId = Long.parseLong(branchMap.get("id").toString());

        UsersEntity branch = usersrepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        newAddonEntity.setBranchId(branch);

        // 💾 Save Addon Master
        addonsrepository.save(newAddonEntity);

        // =========================
        // 5️⃣ ADDON ITEMS
        // =========================
        if (addonItemsObj instanceof List<?> addonItemsList) {

            for (Object itemObj : addonItemsList) {

                if (!(itemObj instanceof Map<?, ?> itemMap)) {
                    continue;
                }

                AddonsItemsEntity newItemEntity = new AddonsItemsEntity();

                for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {

                    field.setAccessible(true);
                    String fieldName = field.getName();

                    if (fieldName.endsWith("Id")
                            || fieldName.equals("createdAt")
                            || fieldName.equals("updatedAt")) {
                        continue;
                    }

                    if (itemMap.containsKey(fieldName) && itemMap.get(fieldName) != null) {
                        Object convertedValue =
                                objectMapper.convertValue(itemMap.get(fieldName), field.getType());
                        field.set(newItemEntity, convertedValue);
                    }
                }

                newItemEntity.setAddonsId(newAddonEntity);
                addonsItemsRepository.save(newItemEntity);
            }
        }

        return "Added Successfully";
    }


    
//    @Transactional(rollbackFor = Exception.class)
//    public String updateAddons(Map<String, Object> payload, String token) throws Exception {
//
//        // 🔐 Authorization
//        Authorization.authorizeRestaurant(token);
//
//        // 🔓 Decrypt token & extract userId
//        tokenUtil.decryptAndStoreToken(token);
//        Integer currentUserId = tokenUtil.getCurrentUserId();
//
//        if (currentUserId == null) {
//            throw new RuntimeException("Invalid token. User not found");
//        }
//
//        ObjectMapper objectMapper = new ObjectMapper();
//
//        // =========================
//        // 1️⃣ Validate addon id
//        // =========================
//        if (!payload.containsKey("id") || payload.get("id") == null) {
//            throw new RuntimeException("addon id is required");
//        }
//
//        Long addonId = objectMapper.convertValue(payload.get("id"), Long.class);
//
//        AddonsEntity existingAddon = addonsrepository.findById(addonId)
//                .orElseThrow(() -> new RuntimeException("Addon not found"));
//
//        // =========================
//        // 2️⃣ Extract addonItems
//        // =========================
//        Object addonItemsObj = payload.get("addonItems");
//
//        // =========================
//        // 3️⃣ UPDATE ADDON MASTER (NON-FK)
//        // =========================
//        for (Field field : AddonsEntity.class.getDeclaredFields()) {
//
//            field.setAccessible(true);
//            String fieldName = field.getName();
//
//            if (fieldName.equals("id")
//                    || fieldName.endsWith("Id")
//                    || fieldName.equals("createdAt")
//                    || fieldName.equals("updatedAt")) {
//                continue;
//            }
//
//            if (payload.containsKey(fieldName) && payload.get(fieldName) != null) {
//                Object convertedValue =
//                        objectMapper.convertValue(payload.get(fieldName), field.getType());
//                field.set(existingAddon, convertedValue);
//            }
//        }
//
//        // =========================
//        // 4️⃣ SET restaurantId FROM TOKEN
//        // =========================
//        UsersEntity restaurant = usersrepository.findById(Long.valueOf(currentUserId))
//                .orElseThrow(() -> new RuntimeException("Restaurant user not found"));
//
//        existingAddon.setRestaurantId(restaurant);
//
//        // 💾 Save updated addon master
//        addonsrepository.save(existingAddon);
//
//        // =========================
//        // 5️⃣ DELETE OLD ADDON ITEMS
//        // =========================
//        addonsItemsRepository.deleteByAddonsId(existingAddon);
//
//        // =========================
//        // 6️⃣ RE-INSERT ADDON ITEMS
//        // =========================
//        if (addonItemsObj instanceof List<?> addonItemsList) {
//
//            for (Object itemObj : addonItemsList) {
//
//                if (!(itemObj instanceof Map<?, ?> itemMap)) {
//                    continue;
//                }
//
//                AddonsItemsEntity newItemEntity = new AddonsItemsEntity();
//
//                for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {
//
//                    field.setAccessible(true);
//                    String fieldName = field.getName();
//
//                    if (fieldName.equals("id")
//                            || fieldName.endsWith("Id")
//                            || fieldName.equals("createdAt")
//                            || fieldName.equals("updatedAt")) {
//                        continue;
//                    }
//
//                    if (itemMap.containsKey(fieldName) && itemMap.get(fieldName) != null) {
//                        Object convertedValue =
//                                objectMapper.convertValue(itemMap.get(fieldName), field.getType());
//                        field.set(newItemEntity, convertedValue);
//                    }
//                }
//
//                newItemEntity.setAddonsId(existingAddon);
//                addonsItemsRepository.save(newItemEntity);
//            }
//        }
//
//        return "Updated Successfully";
//    }
    
    @Transactional(rollbackFor = Exception.class)
    public String updateAddons(Map<String, Object> payload, String token) throws Exception {

        // 🔐 Authorization
        Authorization.authorizeRestaurant(token);

        // 🔓 Token decrypt
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        if (currentUserId == null) {
            throw new RuntimeException("Invalid token. User not found");
        }

        ObjectMapper objectMapper = new ObjectMapper();

        // =========================
        // 1️⃣ Validate addon id
        // =========================
        if (!payload.containsKey("id") || payload.get("id") == null) {
            throw new RuntimeException("Addon id is required");
        }

        Long addonId = objectMapper.convertValue(payload.get("id"), Long.class);

        AddonsEntity existingAddon = addonsrepository.findById(addonId)
                .orElseThrow(() -> new RuntimeException("Addon not found"));

        // =========================
        // 2️⃣ UPDATE ADDON MASTER (NON-FK FIELDS)
        // =========================
        for (Field field : AddonsEntity.class.getDeclaredFields()) {

            field.setAccessible(true);
            String fieldName = field.getName();

            if (fieldName.equals("id")
                    || fieldName.endsWith("Id")
                    || fieldName.equals("createdAt")
                    || fieldName.equals("updatedAt")) {
                continue;
            }

            if (payload.containsKey(fieldName) && payload.get(fieldName) != null) {
                Object convertedValue =
                        objectMapper.convertValue(payload.get(fieldName), field.getType());
                field.set(existingAddon, convertedValue);
            }
        }

        // =========================
        // 3️⃣ SET restaurantId FROM TOKEN
        // =========================
        UsersEntity restaurant = usersrepository.findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Restaurant user not found"));

        existingAddon.setRestaurantId(restaurant);

        // =========================
        // 4️⃣ READ branchId OBJECT SAFELY  ✅🔥
        // =========================
        if (!payload.containsKey("branchId") || payload.get("branchId") == null) {
            throw new RuntimeException("branchId is required");
        }

        Object branchObj = payload.get("branchId");

        if (!(branchObj instanceof Map<?, ?> branchMap) || branchMap.get("id") == null) {
            throw new RuntimeException("branchId.id is required");
        }

        Long branchId = objectMapper.convertValue(branchMap.get("id"), Long.class);

        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        existingAddon.setBranchId(branch);

        // 💾 Save addon master
        addonsrepository.save(existingAddon);

        // =========================
        // 5️⃣ ADDON ITEMS
        // =========================
        Object addonItemsObj = payload.get("addonItems");

        addonsItemsRepository.deleteByAddonsId(existingAddon);

        if (addonItemsObj instanceof List<?> addonItemsList) {

            for (Object itemObj : addonItemsList) {

                if (!(itemObj instanceof Map<?, ?> itemMap)) continue;

                AddonsItemsEntity newItemEntity = new AddonsItemsEntity();

                for (Field field : AddonsItemsEntity.class.getDeclaredFields()) {

                    field.setAccessible(true);
                    String fieldName = field.getName();

                    if (fieldName.equals("id")
                            || fieldName.endsWith("Id")
                            || fieldName.equals("createdAt")
                            || fieldName.equals("updatedAt")) {
                        continue;
                    }

                    if (itemMap.containsKey(fieldName) && itemMap.get(fieldName) != null) {
                        Object convertedValue =
                                objectMapper.convertValue(itemMap.get(fieldName), field.getType());
                        field.set(newItemEntity, convertedValue);
                    }
                }

                newItemEntity.setAddonsId(existingAddon);
                addonsItemsRepository.save(newItemEntity);
            }
        }

        return "Updated Successfully";
    }



    public Map<String, Object> getAddonsWithFilters(
            LocalDate fromDate,
            LocalDate toDate,
            Boolean isActive,
            String searchValue,
            Integer pageNumber,
            Integer pageSize,
            String token
    ) throws Exception {

        // 🔐 Admin Authorization
        Authorization.authorizeRestaurant(token);

        // 🔓 TOKEN → RESTAURANT ID
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();

        Specification<AddonsEntity> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // ================= RESTAURANT FILTER (MANDATORY) =================
            predicates.add(
                    cb.equal(
                            root.get("restaurantId").get("id"),
                            currentUserId.longValue()
                    )
            );
            
         // Active filter (outside search block)
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
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

            // ================= SEARCH FILTER =================
            if (searchValue != null && !searchValue.trim().isEmpty()) {

                String pattern = "%" + searchValue.toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();

                // 🔹 ADDON FIELDS
                searchPredicates.add(cb.like(cb.lower(root.get("name")), pattern));
                searchPredicates.add(cb.like(cb.lower(root.get("description")), pattern));

                // 🔹 MIN ADDON
                try {
                    Integer minAddon = Integer.valueOf(searchValue);
                    searchPredicates.add(cb.equal(root.get("minAddon"), minAddon));
                } catch (Exception ignored) {}

                // 🔹 MAX ADDON
                try {
                    Integer maxAddon = Integer.valueOf(searchValue);
                    searchPredicates.add(cb.equal(root.get("maxAddon"), maxAddon));
                } catch (Exception ignored) {}

                // 🔹 BOOLEAN FIELDS
                if (searchValue.equalsIgnoreCase("true") || searchValue.equalsIgnoreCase("false")) {
                    Boolean boolValue = Boolean.valueOf(searchValue);
                    searchPredicates.add(cb.equal(root.get("isMultiple"), boolValue));
                    searchPredicates.add(cb.equal(root.get("showOnline"), boolValue));
                    searchPredicates.add(cb.equal(root.get("showInCaptain"), boolValue));
                }

                // 🔹 IS ACTIVE
//                try {
//                    Integer isActive = Integer.valueOf(searchValue);
//                    searchPredicates.add(cb.equal(root.get("isActive"), isActive));
//                } catch (Exception ignored) {}

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable =
                PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));

        Page<AddonsEntity> page = addonsRepository.findAll(spec, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }


    @Override
    public List<AddonsEntity> getAllRecordAddons(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return addonsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllAddons(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = addonsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public AddonsEntity getOneAddons(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return addonsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Addons not found"));
    }

    @Override
    public String addAddons(AddonsEntity addonsEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        AddonsEntity newEntity = new AddonsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : AddonsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(addonsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (addonsEntity.getRestaurantId() != null && addonsEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(addonsEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        addonsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateAddons(AddonsEntity addonsEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        AddonsEntity existingEntity = addonsrepository.findById(addonsEntity.getId())
                .orElseThrow(() -> new RuntimeException("Addons not found"));

        // Update non-foreign fields using reflection
        for (Field field : AddonsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(addonsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (addonsEntity.getRestaurantId() != null && addonsEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(addonsEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        addonsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteAddons(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        if (!addonsrepository.existsById(id)) {
            throw new RuntimeException("Addons not found");
        }
        addonsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleAddons(List<AddonsEntity> addonsEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        List<AddonsEntity> entitiesToSave = new ArrayList<>();

        for (AddonsEntity entity : addonsEntitys) {
            AddonsEntity newEntity = new AddonsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : AddonsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle restaurant_id foreign key
            if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
                newEntity.setRestaurantId(
                    fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        addonsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<AddonsEntity> getAddonsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return addonsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getAddonsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = addonsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<AddonsEntity> getAddonsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return addonsrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<AddonsEntity> getAddonsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return addonsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getAddonsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = addonsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<AddonsEntity> getAddonsByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return addonsrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<AddonsEntity> page = addonsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Addonss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Description");
            header.createCell(3).setCellValue("Restaurant_id");
            header.createCell(4).setCellValue("Min_addon");
            header.createCell(5).setCellValue("Max_addon");
            header.createCell(6).setCellValue("Is_multiple");
            header.createCell(7).setCellValue("Show_online");
            header.createCell(8).setCellValue("Show_in_captain");
            header.createCell(9).setCellValue("Is_active");
            header.createCell(10).setCellValue("Created_at");
            header.createCell(11).setCellValue("Updated_at");

            int rowNum = 1;
            for (AddonsEntity addonsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(addonsEntity.getId() != null ? addonsEntity.getId() : 0);
                row.createCell(1).setCellValue(addonsEntity.getName() != null ? addonsEntity.getName() : "N/A");
                row.createCell(2).setCellValue(addonsEntity.getDescription() != null ? addonsEntity.getDescription() : "N/A");
                row.createCell(3).setCellValue(addonsEntity.getRestaurantId() != null ? addonsEntity.getRestaurantId().toString() : "N/A");
                row.createCell(4).setCellValue(addonsEntity.getMinAddon() != null ? addonsEntity.getMinAddon() : 0);
                row.createCell(5).setCellValue(addonsEntity.getMaxAddon() != null ? addonsEntity.getMaxAddon() : 0);
                row.createCell(6).setCellValue(addonsEntity.getIsMultiple() != null && addonsEntity.getIsMultiple() ? "Active" : "Inactive");
                row.createCell(7).setCellValue(addonsEntity.getShowOnline() != null && addonsEntity.getShowOnline() ? "Active" : "Inactive");
                row.createCell(8).setCellValue(addonsEntity.getShowInCaptain() != null && addonsEntity.getShowInCaptain() ? "Active" : "Inactive");
//                row.createCell(9).setCellValue(addonsEntity.getIsActive() != null ? addonsEntity.getIsActive() : 0);
                LocalDateTime createdAt = addonsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(10).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = addonsEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
