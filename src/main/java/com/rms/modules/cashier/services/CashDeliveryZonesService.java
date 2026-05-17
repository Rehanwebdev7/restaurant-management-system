package com.rms.modules.cashier.services;

import com.rms.common.Constant;
import com.rms.common.apis.GoogleMapsService;
import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.UsersProfileEntity;
import com.rms.common.repositories.DeliveryZonesRepository;
import com.rms.common.serviceImplement.DeliveryZonesServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersProfileRepository;
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
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

@Service
@Qualifier("cashDeliveryZonesService")
public class CashDeliveryZonesService implements DeliveryZonesServiceIMP {

    private final DeliveryZonesRepository deliveryzonesrepository;
    private final RestaurantBranchRepository restaurantbranchrepository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private TokenUtil tokenUtil;
    
    @Autowired
    private GoogleMapsService googleMapsService;

    @Autowired
    private UsersProfileRepository usersProfileRepository;

    public CashDeliveryZonesService(DeliveryZonesRepository deliveryzonesrepository, RestaurantBranchRepository restaurantbranchrepository) {
        this.deliveryzonesrepository = deliveryzonesrepository;
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
    
    
   
    
//    public Double getDistance(Double latitude, Double longitude, String token) throws Exception {
//
//        System.out.println("====== DISTANCE CALCULATION START (GOOGLE MAPS) ======");
//
//        System.out.println("Incoming Latitude  : " + latitude);
//        System.out.println("Incoming Longitude : " + longitude);
//
//        // 🔓 TOKEN DECRYPT
//        tokenUtil.decryptAndStoreToken(token);
//
//        Integer branchId = tokenUtil.getBranchId();
//        System.out.println("Branch ID from Token : " + branchId);
//
//        if (branchId == null) {
//            throw new RuntimeException("Branch ID not found in token");
//        }
//
//        // 🔍 FETCH BRANCH PROFILE
//        UsersProfileEntity usersProfileEntity =
//                usersProfileRepository.findByRestaurantId_id(branchId.longValue());
//
//        if (usersProfileEntity == null) {
//            throw new RuntimeException("Users profile not found for branchId: " + branchId);
//        }
//
//        Double br_latitude = usersProfileEntity.getLatitude();
//        Double br_longitude = usersProfileEntity.getLongitude();
//
//        System.out.println("Branch Latitude  : " + br_latitude);
//        System.out.println("Branch Longitude : " + br_longitude);
//
//        if (latitude == null || longitude == null) {
//            throw new RuntimeException("Customer latitude/longitude is null");
//        }
//
//        // 📏 GOOGLE MAP ROAD DISTANCE
//        Double distance = googleMapsService.getRoadDistanceInKm(
//                br_latitude,
//                br_longitude,
//                latitude,
//                longitude
//        );
//
//        System.out.println("Final Road Distance Used (KM) : " + distance);
//        System.out.println("====== DISTANCE CALCULATION END ======");
//
//        return distance;
//    }
    
    public Map<String, Object> getDistance(
            Double latitude,
            Double longitude,
            String token
    ) throws Exception {

        System.out.println("====== DISTANCE CALCULATION START (GOOGLE MAPS) ======");

        System.out.println("Incoming Latitude  : " + latitude);
        System.out.println("Incoming Longitude : " + longitude);

        // 🔓 TOKEN DECRYPT
        tokenUtil.decryptAndStoreToken(token);

        Integer branchId = tokenUtil.getBranchId();
        if (branchId == null) {
            Integer currentUserId = tokenUtil.getCurrentUserId();
            UsersEntity cashier = usersRepository.findById(currentUserId.longValue())
                    .orElseThrow(() -> new RuntimeException("Cashier not found"));
            branchId = cashier.getBranchId() != null && cashier.getBranchId().getId() != null
                    ? cashier.getBranchId().getId().intValue()
                    : null;
        }
        System.out.println("Branch ID resolved : " + branchId);

        if (branchId == null) {
            throw new RuntimeException("Branch ID not found for cashier");
        }

        // 🔍 FETCH BRANCH PROFILE
        UsersProfileEntity usersProfileEntity =
                usersProfileRepository.findByRestaurantId_id(branchId.longValue());
        if (usersProfileEntity == null) {
            UsersEntity branchUser = usersRepository.findById(branchId.longValue())
                    .orElseThrow(() -> new RuntimeException("Branch user not found"));
            if (branchUser.getParentId() != null && branchUser.getParentId().getId() != null) {
                usersProfileEntity = usersProfileRepository.findFirstByRestaurantId_id(branchUser.getParentId().getId());
            }
        }

        if (usersProfileEntity == null) {
            throw new RuntimeException("Users profile not found for branchId: " + branchId);
        }

        Double br_latitude = usersProfileEntity.getLatitude();
        Double br_longitude = usersProfileEntity.getLongitude();

        System.out.println("Branch Latitude  : " + br_latitude);
        System.out.println("Branch Longitude : " + br_longitude);

        if (latitude == null || longitude == null) {
            throw new RuntimeException("Customer latitude/longitude is null");
        }

        // 📏 GOOGLE MAP ROAD DISTANCE + TIME
        Map<String, Object> distanceInfo =
                googleMapsService.getRoadDistanceAndTime(
                        br_latitude,
                        br_longitude,
                        latitude,
                        longitude
                );

        System.out.println("Final Distance (KM) : " + distanceInfo.get("distance_km"));
        System.out.println("Estimated Time     : " + distanceInfo.get("duration_text"));

        System.out.println("====== DISTANCE CALCULATION END ======");

        return distanceInfo;
    }



    @Override
    public List<DeliveryZonesEntity> getAllRecordDeliveryZones(String token) throws Exception {
        Authorization.authorizeCashier(token);
        return deliveryzonesrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllDeliveryZones(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = deliveryzonesrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public DeliveryZonesEntity getOneDeliveryZones(Long id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return deliveryzonesrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("DeliveryZones not found"));
    }

    @Override
    public String addDeliveryZones(DeliveryZonesEntity delivery_zonesEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        DeliveryZonesEntity newEntity = new DeliveryZonesEntity();

        // Copy non-foreign fields using reflection
        for (Field field : DeliveryZonesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(delivery_zonesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (delivery_zonesEntity.getBranchId() != null && delivery_zonesEntity.getBranchId().getId() != null) {
            newEntity.setBranchId(
                fetchReferenceById(delivery_zonesEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        deliveryzonesrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateDeliveryZones(DeliveryZonesEntity delivery_zonesEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        DeliveryZonesEntity existingEntity = deliveryzonesrepository.findById(delivery_zonesEntity.getId())
                .orElseThrow(() -> new RuntimeException("DeliveryZones not found"));

        // Update non-foreign fields using reflection
        for (Field field : DeliveryZonesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(delivery_zonesEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle branch_id foreign key
        if (delivery_zonesEntity.getBranchId() != null && delivery_zonesEntity.getBranchId().getId() != null) {
            existingEntity.setBranchId(
                fetchReferenceById(delivery_zonesEntity.getBranchId(), usersRepository, "Restaurant_branch not found")
            );
        }

        deliveryzonesrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteDeliveryZones(Long id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!deliveryzonesrepository.existsById(id)) {
            throw new RuntimeException("DeliveryZones not found");
        }
        deliveryzonesrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleDeliveryZones(List<DeliveryZonesEntity> delivery_zonesEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
        List<DeliveryZonesEntity> entitiesToSave = new ArrayList<>();

        for (DeliveryZonesEntity entity : delivery_zonesEntitys) {
            DeliveryZonesEntity newEntity = new DeliveryZonesEntity();

            // Copy non-foreign fields using reflection
            for (Field field : DeliveryZonesEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle branch_id foreign key
            if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
                newEntity.setBranchId(
                    fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        deliveryzonesrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<DeliveryZonesEntity> getDeliveryZonesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return deliveryzonesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getDeliveryZonesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = deliveryzonesrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<DeliveryZonesEntity> getDeliveryZonesByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return deliveryzonesrepository.findByCreatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeCashier(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<DeliveryZonesEntity> page = deliveryzonesrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("DeliveryZoness");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Branch_id");
            header.createCell(2).setCellValue("Zone_name");
            header.createCell(3).setCellValue("Description");
            header.createCell(4).setCellValue("Latitude");
            header.createCell(5).setCellValue("Longitude");
            header.createCell(6).setCellValue("Radius_km");
            header.createCell(7).setCellValue("Delivery_charge");
            header.createCell(8).setCellValue("Delivery_time_minutes");
            header.createCell(9).setCellValue("Is_active");
            header.createCell(10).setCellValue("Created_at");

            int rowNum = 1;
            for (DeliveryZonesEntity deliveryZonesEntity : page.getContent()) {

                Row row = sheet.createRow(rowNum++);

                // ID
                row.createCell(0).setCellValue(
                        deliveryZonesEntity.getId() != null ? deliveryZonesEntity.getId() : 0
                );

                // Branch ID
                row.createCell(1).setCellValue(
                        deliveryZonesEntity.getBranchId() != null
                                ? deliveryZonesEntity.getBranchId().getId()
                                : 0
                );

                // Zone Name
                row.createCell(2).setCellValue(
                        deliveryZonesEntity.getZoneName() != null
                                ? deliveryZonesEntity.getZoneName()
                                : "N/A"
                );

                // Description
                row.createCell(3).setCellValue(
                        deliveryZonesEntity.getDescription() != null
                                ? deliveryZonesEntity.getDescription()
                                : "N/A"
                );

                // Radius KM From
                row.createCell(4).setCellValue(
                        deliveryZonesEntity.getRadiusKmFrom() != null
                                ? deliveryZonesEntity.getRadiusKmFrom()
                                : 0.0
                );

                // Radius KM To
                row.createCell(5).setCellValue(
                        deliveryZonesEntity.getRadiusKmTo() != null
                                ? deliveryZonesEntity.getRadiusKmTo()
                                : 0.0
                );

                // Delivery Charge
                row.createCell(6).setCellValue(
                        deliveryZonesEntity.getDeliveryCharge() != null
                                ? deliveryZonesEntity.getDeliveryCharge().doubleValue()
                                : 0.0
                );

                // Delivery Time (Minutes)
                row.createCell(7).setCellValue(
                        deliveryZonesEntity.getDeliveryTimeMinutes() != null
                                ? deliveryZonesEntity.getDeliveryTimeMinutes()
                                : 0
                );

                // Status
                row.createCell(8).setCellValue(
                        Boolean.TRUE.equals(deliveryZonesEntity.getIsActive())
                                ? "Active"
                                : "Inactive"
                );

                // Created At
                LocalDateTime createdAt = deliveryZonesEntity.getCreatedAt();
                String formattedCreatedAt =
                        (createdAt != null) ? createdAt.format(dateTimeFormat) : "";

                row.createCell(9).setCellValue(formattedCreatedAt);
            }

            
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
