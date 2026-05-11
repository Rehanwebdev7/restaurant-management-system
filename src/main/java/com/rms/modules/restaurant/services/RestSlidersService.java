package com.rms.modules.restaurant.services;

import com.rms.common.entities.SlidersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SlidersRepository;
import com.rms.common.serviceImplement.SlidersServiceIMP;
import com.rms.common.util.FileUploadService;
import com.rms.common.util.GoogleDriveUtil;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
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

@Service
@Qualifier("restSlidersService")
public class RestSlidersService implements SlidersServiceIMP {

    private final SlidersRepository slidersrepository;
    private final UsersRepository usersrepository;
    
    @Autowired
    private SlidersRepository slidersRepository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private GoogleDriveUtil googleDriveUtil;

    @Autowired
    private FileUploadService fileUploadService;
    
    @Autowired
    private TokenUtil tokenUtil;

    public RestSlidersService(SlidersRepository slidersrepository, UsersRepository usersrepository) {
        this.slidersrepository = slidersrepository;
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
    
    
    @Transactional
    public String addSliderWithImage(
            MultipartFile image,
            String title,
            String platform,
            String description,
            String token
    ) throws Exception {

        // ================= TOKEN =================
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }

        Authorization.authorizeRestaurant(token);

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }

        // ================= TOKEN → USER ID =================
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();
        tokenUtil.clearTokenData();

        if (currentUserId == null) {
            throw new RuntimeException("Invalid token: user not found");
        }

        // ================= FETCH RESTAURANT FROM TOKEN =================
        UsersEntity restaurant = usersRepository.findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
            throw new IllegalArgumentException("Logged-in user is not a restaurant");
        }

        // ================= CREATE ENTITY =================
        SlidersEntity entity = new SlidersEntity();
        entity.setTitle(title);
        entity.setPlatform(platform);
        entity.setDescription(description);
        entity.setRestaurantId(restaurant);

        // ================= SAVE FIRST =================
        SlidersEntity savedEntity = slidersRepository.save(entity);

        // ================= IMAGE UPLOAD =================
        if (image != null && !image.isEmpty()) {

            String fileName = "slider_" + savedEntity.getId();

            // old: String imageUrl = googleDriveUtil.uploadFile(image, fileName, "Sliders");
            final Long _entityId = savedEntity.getId();
            String imageUrl = fileUploadService.uploadFile(image, fileName, "Sliders",
                driveUrl -> slidersRepository.updateDriveImageUrl(_entityId, driveUrl));
            savedEntity.setImageUrl(imageUrl);
            slidersRepository.save(savedEntity);
        }

        return "Slider added successfully";
    }

    
    @Transactional
    public String updateSlider(
            MultipartFile image,
            Long sliderId,
            String title,
            String platform,
            String description,
            String token
    ) throws Exception {

        // 🔐 TOKEN
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }
        Authorization.authorizeRestaurant(token);

        if (sliderId == null) {
            throw new IllegalArgumentException("sliderId is required");
        }

        // 🔓 TOKEN → RESTAURANT ID
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();
        tokenUtil.clearTokenData();

        UsersEntity restaurant = usersRepository.findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
            throw new IllegalArgumentException("Token user is not a restaurant");
        }

        // ================= FETCH SLIDER =================
        SlidersEntity slider = slidersRepository.findById(sliderId)
                .orElseThrow(() -> new RuntimeException("Slider not found"));

        // 🔒 SAFETY: slider same restaurant ka ho
        if (!slider.getRestaurantId().getId().equals(restaurant.getId())) {
            throw new SecurityException("You are not allowed to update this slider");
        }

        // ================= UPDATE FIELDS =================
        if (title != null && !title.isBlank()) {
            slider.setTitle(title);
        }

        if (platform != null && !platform.isBlank()) {
            slider.setPlatform(platform);
        }

        if (description != null && !description.isBlank()) {
            slider.setDescription(description);
        }

        // ================= IMAGE UPLOAD =================
        if (image != null && !image.isEmpty()) {
            String fileName = "slider_" + slider.getId();
            // old: String imageUrl = googleDriveUtil.uploadFile(image, fileName, "Sliders");
            final Long _entityId = slider.getId();
            String imageUrl = fileUploadService.uploadFile(image, fileName, "Sliders",
                driveUrl -> slidersRepository.updateDriveImageUrl(_entityId, driveUrl));
            slider.setImageUrl(imageUrl);
        }

        slidersRepository.save(slider);
        return "Slider updated successfully";
    }
    
    @Transactional(readOnly = true)
    public List<SlidersEntity> getSlidersByRestaurantAndPlatform(
            Long restaurantId,
            String platform
    ) {

        if (restaurantId == null) {
            throw new IllegalArgumentException("restaurantId is required");
        }

        if (platform == null || platform.isBlank()) {
            throw new IllegalArgumentException("platform is required");
        }

        List<SlidersEntity> sliders =
                slidersRepository.findByRestaurantId_IdAndPlatformIgnoreCase(
                        restaurantId,
                        platform
                );

        if (sliders.isEmpty()) {
            throw new RuntimeException("No sliders found");
        }

        return sliders;
    }



    @Override
    public List<SlidersEntity> getAllRecordSliders(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return slidersrepository.findAll();
    }

//    @Override
//    public Map<String, Object> getAllSliders(Integer pageNumber, Integer pageSize, String token) throws Exception {
//        Authorization.authorizeRestaurant(token);
//        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
//        Page page = slidersrepository.findAll(pageable);
//        Map<String, Object> response = new LinkedHashMap<>();
//        response.put("totalRecords", page.getTotalElements());
//        response.put("pageSize", page.getSize());
//        response.put("currentPage", page.getNumber() + 1);
//        response.put("totalPages", page.getTotalPages());
//        response.put("records", page.getContent());
//        return response;
//    }
    @Override
    public Map<String, Object> getAllSliders(
            Integer pageNumber,
            Integer pageSize,
            String token
    ) throws Exception {

        // 🔐 AUTH
        Authorization.authorizeRestaurant(token);

        // 🔓 TOKEN DECRYPT
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();
        tokenUtil.clearTokenData();

        if (currentUserId == null) {
            throw new RuntimeException("Invalid token : user not found");
        }

        Long restaurantId = currentUserId.longValue();
        System.out.println("Restaurant ID from token : " + restaurantId);

        Pageable pageable =
                PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));

        // ✅ TOKEN BASED DATA ONLY
        Page<SlidersEntity> page =
                slidersrepository.findByRestaurantId_Id(restaurantId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());

        return response;
    }


    @Override
    public SlidersEntity getOneSliders(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        return slidersrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sliders not found"));
    }

    @Override
    public String addSliders(SlidersEntity slidersEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        SlidersEntity newEntity = new SlidersEntity();

        // Copy non-foreign fields using reflection
        for (Field field : SlidersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(slidersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (slidersEntity.getRestaurantId() != null && slidersEntity.getRestaurantId().getId() != null) {
            newEntity.setRestaurantId(
                fetchReferenceById(slidersEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        slidersrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateSliders(SlidersEntity slidersEntity, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        SlidersEntity existingEntity = slidersrepository.findById(slidersEntity.getId())
                .orElseThrow(() -> new RuntimeException("Sliders not found"));

        // Update non-foreign fields using reflection
        for (Field field : SlidersEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(slidersEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle restaurant_id foreign key
        if (slidersEntity.getRestaurantId() != null && slidersEntity.getRestaurantId().getId() != null) {
            existingEntity.setRestaurantId(
                fetchReferenceById(slidersEntity.getRestaurantId(), usersrepository, "Users not found")
            );
        }

        slidersrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteSliders(Long id, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        if (!slidersrepository.existsById(id)) {
            throw new RuntimeException("Sliders not found");
        }
        slidersrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleSliders(List<SlidersEntity> slidersEntitys, String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        List<SlidersEntity> entitiesToSave = new ArrayList<>();

        for (SlidersEntity entity : slidersEntitys) {
            SlidersEntity newEntity = new SlidersEntity();

            // Copy non-foreign fields using reflection
            for (Field field : SlidersEntity.class.getDeclaredFields()) {
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

        slidersrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<SlidersEntity> page = slidersrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Sliderss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Description");
            header.createCell(2).setCellValue("Image_url");
            header.createCell(3).setCellValue("Title");
            header.createCell(4).setCellValue("Restaurant_id");

            int rowNum = 1;
            for (SlidersEntity slidersEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(slidersEntity.getId() != null ? slidersEntity.getId() : 0);
                row.createCell(1).setCellValue(slidersEntity.getDescription() != null ? slidersEntity.getDescription() : "N/A");
                row.createCell(2).setCellValue(slidersEntity.getImageUrl() != null ? slidersEntity.getImageUrl() : "N/A");
                row.createCell(3).setCellValue(slidersEntity.getTitle() != null ? slidersEntity.getTitle() : "N/A");
                row.createCell(4).setCellValue(slidersEntity.getRestaurantId() != null ? slidersEntity.getRestaurantId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
