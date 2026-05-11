package com.rms.modules.restaurant.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.UsersProfileEntity;
import com.rms.common.repositories.UsersProfileRepository;
import com.rms.common.serviceImplement.UsersProfileServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.PincodesRepository;
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
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import java.lang.reflect.Modifier;

@Service
@Qualifier("restUsersProfileService")
public class RestUsersProfileService implements UsersProfileServiceIMP {

    private final UsersProfileRepository usersprofilerepository;
    private final PincodesRepository pincodesrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private UsersProfileRepository usersProfileRepository;

    public RestUsersProfileService(UsersProfileRepository usersprofilerepository, PincodesRepository pincodesrepository, UsersRepository usersrepository) {
        this.usersprofilerepository = usersprofilerepository;
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
    
//    @Transactional
//    public String addUsersProfileWithLogo(
//            MultipartFile logo,
//            MultipartFile coverImage,   // ✅ second image
//            String payloadJson,
//            String token) throws Exception {
//
//        // ================= TOKEN =================
//        if (token == null || token.isBlank()) {
//            throw new SecurityException("Access token is missing");
//        }
//        Authorization.authorizeAdmin(token);
//
//        if (payloadJson == null || payloadJson.isBlank()) {
//            throw new IllegalArgumentException("Payload cannot be empty");
//        }
//
//        // ================= JSON → ENTITY =================
//        ObjectMapper mapper = new ObjectMapper()
//                .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
//                .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
//
//        UsersProfileEntity inputEntity =
//                mapper.readValue(payloadJson, UsersProfileEntity.class);
//
//        // ================= REQUIRED RESTAURANT =================
//        if (inputEntity.getRestaurantId() == null
//                || inputEntity.getRestaurantId().getId() == null) {
//            throw new IllegalArgumentException("restaurantId is mandatory");
//        }
//
//        // ================= VALIDATE RESTAURANT =================
//        UsersEntity restaurant = usersRepository
//                .findById(inputEntity.getRestaurantId().getId())
//                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//        if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
//            throw new IllegalArgumentException("Provided user is not a restaurant");
//        }
//
//        // ================= UPSERT CHECK =================
//        UsersProfileEntity entity =
//                usersProfileRepository.findByRestaurantId(restaurant)
//                        .orElse(null);
//
//        // ================= INSERT CASE =================
//        if (entity == null) {
//            entity = new UsersProfileEntity();
//            entity.setRestaurantId(restaurant);
//            entity.setCreatedAt(LocalDateTime.now());
//        }
//
//        // ================= COPY NON-NULL FIELDS =================
//        for (Field field : UsersProfileEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//
//            if (Modifier.isStatic(field.getModifiers())
//                    || Modifier.isFinal(field.getModifiers())
//                    || field.getName().equals("id")
//                    || field.getName().equals("restaurantId")
//                    || field.getName().equals("createdAt")
//                    || field.getName().equals("updatedAt")) {
//                continue;
//            }
//
//            Object value = field.get(inputEntity);
//            if (value != null) {
//                field.set(entity, value);
//            }
//        }
//
//        entity.setRestaurantId(restaurant);
//        entity.setUpdatedAt(LocalDateTime.now());
//
//        UsersProfileEntity savedProfile =
//                usersProfileRepository.save(entity);
//
//        // ================= LOGO UPLOAD =================
//        if (logo != null && !logo.isEmpty()) {
//
//            String fileName = "restaurant_logo_" + restaurant.getId();
//
//            String logoUrl = googleDriveUtil.uploadFile(
//                    logo,
//                    fileName,
//                    "Restaurant_Logo"
//            );
//
//            savedProfile.setLogoUrl(logoUrl);
//            savedProfile.setUpdatedAt(LocalDateTime.now());
//
//            usersProfileRepository.save(savedProfile);
//        }
//
//        // ================= COVER IMAGE UPLOAD =================
//        if (coverImage != null && !coverImage.isEmpty()) {
//
//            String fileName = "restaurant_cover_" + restaurant.getId();
//
//            String coverImageUrl = googleDriveUtil.uploadFile(
//                    coverImage,
//                    fileName,
//                    "Restaurant_Cover"
//            );
//
//            // 👇 entity me jo field hai wahi use karo
//            savedProfile.setFeviconUrl(coverImageUrl);
//            savedProfile.setUpdatedAt(LocalDateTime.now());
//
//            usersProfileRepository.save(savedProfile);
//        }
//
//        return "Users profile added/updated successfully";
//    }
    
    @Transactional
    public String addOrUpdateBranchProfile(Map<String, Object> body, String token) throws Exception {

        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token missing");
        }
        Authorization.authorizeRestaurant(token);

        // ================= BRANCH ID (OBJECT FORM) =================
        Object branchObj = body.get("branchId");
        if (branchObj == null || !(branchObj instanceof Map)) {
            throw new IllegalArgumentException("branchId object is required");
        }

        Map<?, ?> branchMap = (Map<?, ?>) branchObj;
        Object idObj = branchMap.get("id");

        if (idObj == null) {
            throw new IllegalArgumentException("branchId.id is required");
        }

        Long branchId = Long.valueOf(idObj.toString());

        // 🔥 REMOVE branchId BEFORE MAPPING
        body.remove("branchId");

        // ================= FETCH BRANCH USER =================
        UsersEntity branchUser = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        // ================= UPSERT =================
        UsersProfileEntity profile =
                usersProfileRepository.findByRestaurantId(branchUser)
                        .orElse(null);

        if (profile == null) {
            profile = new UsersProfileEntity();
            profile.setRestaurantId(branchUser);
            profile.setCreatedAt(LocalDateTime.now());
        }

        // ================= MAP BODY → ENTITY =================
        ObjectMapper mapper = new ObjectMapper();
        UsersProfileEntity input =
                mapper.convertValue(body, UsersProfileEntity.class);

        for (Field field : UsersProfileEntity.class.getDeclaredFields()) {
            field.setAccessible(true);

            if (Modifier.isStatic(field.getModifiers())
                    || Modifier.isFinal(field.getModifiers())
                    || field.getName().equals("id")
                    || field.getName().equals("restaurantId")
                    || field.getName().equals("createdAt")
                    || field.getName().equals("updatedAt")) {
                continue;
            }

            try {
                Object value = field.get(input);
                if (value != null) {
                    field.set(profile, value);
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException(e);
            }
        }

        profile.setRestaurantId(branchUser);
        profile.setUpdatedAt(LocalDateTime.now());

        usersProfileRepository.save(profile);

        return "Branch profile added/updated successfully";
    }



    @Override
    public List<UsersProfileEntity> getAllRecordUsersProfile(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return usersprofilerepository.findAll();
    }

    @Override
    public Map<String, Object> getAllUsersProfile(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = usersprofilerepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public UsersProfileEntity getOneUsersProfile(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return usersprofilerepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UsersProfile not found"));
    }

    @Override
    public String addUsersProfile(UsersProfileEntity users_profileEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        UsersProfileEntity newEntity = new UsersProfileEntity();

        // Copy non-foreign fields using reflection
        for (Field field : UsersProfileEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(users_profileEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle pincode_id foreign key
        if (users_profileEntity.getPincodeId() != null && users_profileEntity.getPincodeId().getId() != null) {
            newEntity.setPincodeId(
                fetchReferenceById(users_profileEntity.getPincodeId(), pincodesrepository, "Pincodes not found")
            );
        }

        // Handle restaurant_id foreign key
        if (users_profileEntity.getRestaurantId() != null && users_profileEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(users_profileEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        usersprofilerepository.save(newEntity);
        return "Added Successfully";
    }
    
    public List<UsersProfileEntity> getBybranchId(Long branchId, String token) throws Exception {

		// 🔐 Authorization
		Authorization.authorizeRestaurant(token);

		if (branchId == null) {
			throw new RuntimeException("BranchId is required");
		}

		List<UsersProfileEntity> zones = usersprofilerepository.findAllByRestaurantId_Id(branchId);

		if (zones.isEmpty()) {
			throw new RuntimeException("No UserProfile Found: " + branchId);
		}

		return zones;
	}

    @Override
    public String updateUsersProfile(UsersProfileEntity users_profileEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        UsersProfileEntity existingEntity = usersprofilerepository.findById(users_profileEntity.getId())
                .orElseThrow(() -> new RuntimeException("UsersProfile not found"));

        // Update non-foreign fields using reflection
        for (Field field : UsersProfileEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(users_profileEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle pincode_id foreign key
        if (users_profileEntity.getPincodeId() != null && users_profileEntity.getPincodeId().getId() != null) {
            existingEntity.setPincodeId(
                fetchReferenceById(users_profileEntity.getPincodeId(), pincodesrepository, "Pincodes not found")
            );
        }

        // Handle restaurant_id foreign key
        if (users_profileEntity.getRestaurantId() != null && users_profileEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(users_profileEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        usersprofilerepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteUsersProfile(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        if (!usersprofilerepository.existsById(id)) {
            throw new RuntimeException("UsersProfile not found");
        }
        usersprofilerepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleUsersProfile(List<UsersProfileEntity> users_profileEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        List<UsersProfileEntity> entitiesToSave = new ArrayList<>();

        for (UsersProfileEntity entity : users_profileEntitys) {
            UsersProfileEntity newEntity = new UsersProfileEntity();

            // Copy non-foreign fields using reflection
            for (Field field : UsersProfileEntity.class.getDeclaredFields()) {
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

        usersprofilerepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<UsersProfileEntity> getUsersProfileByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersprofilerepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersProfileByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = usersprofilerepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<UsersProfileEntity> getUsersProfileByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return usersprofilerepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<UsersProfileEntity> getUsersProfileByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return usersprofilerepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getUsersProfileByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = usersprofilerepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<UsersProfileEntity> getUsersProfileByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return usersprofilerepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<UsersProfileEntity> page = usersprofilerepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("UsersProfiles");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Restaurant_id");
            header.createCell(2).setCellValue("Gst_number");
            header.createCell(3).setCellValue("Address");
            header.createCell(4).setCellValue("City");
            header.createCell(5).setCellValue("State");
            header.createCell(6).setCellValue("Country");
            header.createCell(7).setCellValue("Pincode_id");
            header.createCell(8).setCellValue("Latitude");
            header.createCell(9).setCellValue("Longitude");
            header.createCell(10).setCellValue("Timezone");
            header.createCell(11).setCellValue("Currency_code");
            header.createCell(12).setCellValue("Logo_url");
            header.createCell(13).setCellValue("Website");
            header.createCell(14).setCellValue("Phone");
            header.createCell(15).setCellValue("Alternate_phone");
            header.createCell(16).setCellValue("Opening_time");
            header.createCell(17).setCellValue("Closing_time");
            header.createCell(18).setCellValue("Description");
            header.createCell(19).setCellValue("Is_active");
            header.createCell(20).setCellValue("Created_at");
            header.createCell(21).setCellValue("Updated_at");
            header.createCell(22).setCellValue("Upi_api_token");

            int rowNum = 1;
            for (UsersProfileEntity users_profileEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(users_profileEntity.getId() != null ? users_profileEntity.getId() : 0);
                row.createCell(1).setCellValue(users_profileEntity.getRestaurantId() != null ? users_profileEntity.getRestaurantId().toString() : "N/A");
                row.createCell(2).setCellValue(users_profileEntity.getGstNumber() != null ? users_profileEntity.getGstNumber() : "N/A");
                row.createCell(3).setCellValue(users_profileEntity.getAddress() != null ? users_profileEntity.getAddress() : "N/A");
                row.createCell(4).setCellValue(users_profileEntity.getCityId() != null ? users_profileEntity.getCityId().toString() : "N/A");
                row.createCell(5).setCellValue(users_profileEntity.getStateId() != null ? users_profileEntity.getStateId().toString() : "N/A");
                row.createCell(6).setCellValue(users_profileEntity.getCountry() != null ? users_profileEntity.getCountry() : "N/A");
                row.createCell(7).setCellValue(users_profileEntity.getPincodeId() != null ? users_profileEntity.getPincodeId().toString() : "N/A");
                row.createCell(8).setCellValue(users_profileEntity.getLatitude() != null ? users_profileEntity.getLatitude().doubleValue() : 0.0);
                row.createCell(9).setCellValue(users_profileEntity.getLongitude() != null ? users_profileEntity.getLongitude().doubleValue() : 0.0);
                row.createCell(10).setCellValue(users_profileEntity.getTimezone() != null ? users_profileEntity.getTimezone() : "N/A");
                row.createCell(11).setCellValue(users_profileEntity.getCurrencyCode() != null ? users_profileEntity.getCurrencyCode() : "N/A");
                row.createCell(12).setCellValue(users_profileEntity.getLogoUrl() != null ? users_profileEntity.getLogoUrl() : "N/A");
                row.createCell(13).setCellValue(users_profileEntity.getWebsite() != null ? users_profileEntity.getWebsite() : "N/A");
                row.createCell(14).setCellValue(users_profileEntity.getPhone() != null ? users_profileEntity.getPhone() : "N/A");
                row.createCell(15).setCellValue(users_profileEntity.getAlternatePhone() != null ? users_profileEntity.getAlternatePhone() : "N/A");
//                LocalTime openingTime = users_profileEntity.getOpeningTime();
//                String formattedOpeningTime = (openingTime != null) ? openingTime.format(timeFormat) : "";
//                row.createCell(16).setCellValue(formattedOpeningTime);
//                LocalTime closingTime = users_profileEntity.getClosingTime();
//                String formattedClosingTime = (closingTime != null) ? closingTime.format(timeFormat) : "";
//                row.createCell(17).setCellValue(formattedClosingTime);
                row.createCell(18).setCellValue(users_profileEntity.getDescription() != null ? users_profileEntity.getDescription() : "N/A");
                row.createCell(19).setCellValue(users_profileEntity.getIsActive() != null && users_profileEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = users_profileEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(20).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = users_profileEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(21).setCellValue(formattedUpdatedAt);
//                row.createCell(22).setCellValue(users_profileEntity.getUpiApiToken() != null ? users_profileEntity.getUpiApiToken() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
