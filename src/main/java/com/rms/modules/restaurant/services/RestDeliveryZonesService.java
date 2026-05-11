package com.rms.modules.restaurant.services;

import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.DeliveryZonesRepository;
import com.rms.common.serviceImplement.DeliveryZonesServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;


import com.rms.common.repositories.RestaurantBranchRepository;
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
import java.lang.reflect.Modifier;

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
@Qualifier("restDeliveryZonesService")
public class RestDeliveryZonesService implements DeliveryZonesServiceIMP {

	private final DeliveryZonesRepository deliveryzonesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;

	@Autowired
	private RestaurantBranchRepository restaurantBranchRepository;

	@Autowired
	private DeliveryZonesRepository deliveryZonesRepository;
	
	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private UsersRepository usersRepository;

	public RestDeliveryZonesService(DeliveryZonesRepository deliveryzonesrepository,
			RestaurantBranchRepository restaurantbranchrepository) {
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

	public Map<String, Object> getDeliveryZonesWithFilters(Boolean isActive, Integer pageNumber, Integer pageSize,
			String token) throws Exception {

		// 🔐 AUTH
		Authorization.authorizeRestaurant(token);

		// 🔓 TOKEN DATA (SAME AS YOUR STYLE)
		tokenUtil.decryptAndStoreToken(token);
		Integer currentUserId = tokenUtil.getCurrentUserId(); // restaurantId

		Specification<DeliveryZonesEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= RESTAURANT FILTER =================
			Join<DeliveryZonesEntity, UsersEntity> branchJoin = root.join("branchId", JoinType.INNER);

			Join<UsersEntity, UsersEntity> restaurantJoin = branchJoin.join("parentId", JoinType.INNER);

			predicates.add(cb.equal(restaurantJoin.get("id"), currentUserId));

			// ================= ACTIVE FILTER =================
			if (isActive != null) {
				predicates.add(cb.equal(root.get("isActive"), isActive));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));

		Page<DeliveryZonesEntity> page = deliveryZonesRepository.findAll(spec, pageable);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	public List<DeliveryZonesEntity> getBybranchId(Long branchId, String token) throws Exception {

		// 🔐 Authorization
		Authorization.authorizeRestaurant(token);

		if (branchId == null) {
			throw new RuntimeException("BranchId is required");
		}

		List<DeliveryZonesEntity> zones = deliveryzonesrepository.findAllByBranchId_Id(branchId);

		if (zones.isEmpty()) {
			throw new RuntimeException("No delivery zones found.");
		}

		return zones;
	}
	
	@Transactional(rollbackFor = Exception.class)
	public String multipleUpdateDeliveryZones(
	        List<DeliveryZonesEntity> deliveryZones,
	        String token
	) throws Exception {

	    System.out.println("▶️ multipleUpdateDeliveryZones STARTED");

	    // 🔐 ONLY AUTHORIZATION (NO ID EXTRACTION)
	    Authorization.authorizeRestaurant(token);

	    if (deliveryZones == null || deliveryZones.isEmpty()) {
	        throw new RuntimeException("Delivery zones list cannot be empty");
	    }

	    for (DeliveryZonesEntity input : deliveryZones) {

	        System.out.println("➡️ Processing zone");

	        if (input.getBranchId() == null || input.getBranchId().getId() == null) {
	            throw new RuntimeException("BranchId is mandatory in request body");
	        }

	        Long branchId = input.getBranchId().getId();

	        UsersEntity branch = usersRepository.findById(branchId)
	                .orElseThrow(() ->
	                        new RuntimeException("Invalid Branch ID: " + branchId)
	                );

	        DeliveryZonesEntity entity;
	        if (input.getId() != null) {
	            entity = deliveryZonesRepository.findById(input.getId())
	                    .orElseThrow(() -> new RuntimeException("Delivery zone not found with id : " + input.getId()));
	        } else {
	            entity = new DeliveryZonesEntity();
	            entity.setCreatedAt(LocalDateTime.now());
	        }

	        updateDeliveryZoneFields(entity, input);
	        entity.setBranchId(branch);
	        deliveryZonesRepository.save(entity);
	    }

	    System.out.println("✅ multipleUpdateDeliveryZones COMPLETED");

	    return "All Delivery Zones Processed Successfully";
	}

	
	private void updateDeliveryZoneFields(
	        DeliveryZonesEntity target,
	        DeliveryZonesEntity source
	) {
	    target.setZoneName(source.getZoneName());
	    target.setDescription(source.getDescription());
	    target.setRadiusKmFrom(source.getRadiusKmFrom());
	    target.setRadiusKmTo(source.getRadiusKmTo());
	    target.setDeliveryCharge(source.getDeliveryCharge());
	    target.setDeliveryTimeMinutes(source.getDeliveryTimeMinutes());
	    target.setIsActive(source.getIsActive());
	}



//	@Transactional
//	public String bulkUpsertDeliveryZonesByBranch(List<DeliveryZonesEntity> zoneList, String token) throws Exception {
//
//		// ================= TOKEN VALIDATION =================
//		if (token == null || token.isBlank()) {
//			throw new SecurityException("Access token is missing");
//		}
//
//		// 🔐 Admin authorization
//		Authorization.authorizeRestaurant(token);
//
//		if (zoneList == null || zoneList.isEmpty()) {
//			throw new IllegalArgumentException("Request body cannot be empty");
//		}
//
//		for (DeliveryZonesEntity inputEntity : zoneList) {
//
//			// ================= BRANCH ID VALIDATION =================
//			if (inputEntity.getBranchId() == null || inputEntity.getBranchId().getId() == null) {
//
//				throw new IllegalArgumentException("Branch ID must be provided");
//			}
//
//			Long branchId = inputEntity.getBranchId().getId();
//
//			// ================= CHECK BRANCH EXISTS =================
//			UsersEntity branch = usersRepository.findById(branchId)
//					.orElseThrow(() -> new RuntimeException("Branch not found with id : " + branchId));
//
//			// ================= FIND EXISTING ZONE BY BRANCH =================
//			DeliveryZonesEntity entity = deliveryZonesRepository.findByBranchId(branch).orElse(null);
//
//			// ================= INSERT IF NOT EXISTS =================
//			if (entity == null) {
//				entity = new DeliveryZonesEntity();
//				entity.setBranchId(branch);
//				entity.setCreatedAt(LocalDateTime.now());
//			}
//
//			// ================= UPDATE NON-NULL FIELDS =================
//			for (Field field : DeliveryZonesEntity.class.getDeclaredFields()) {
//				field.setAccessible(true);
//
//				if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
//					continue;
//				}
//
//				Object value = field.get(inputEntity);
//
//				if (value != null && !field.getName().equals("id") && !field.getName().equals("branchId")
//						&& !field.getName().equals("createdAt")) {
//
//					field.set(entity, value);
//				}
//			}
//
//			// ================= FINAL SET & SAVE =================
//			entity.setBranchId(branch);
//
//			deliveryZonesRepository.save(entity);
//		}
//
//		return "Delivery zones UPSERT completed successfully";
//	}

	@Override
	public List<DeliveryZonesEntity> getAllRecordDeliveryZones(String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		return deliveryzonesrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllDeliveryZones(Integer pageNumber, Integer pageSize, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
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
		Authorization.authorizeRestaurant(token);
		return deliveryzonesrepository.findById(id).orElseThrow(() -> new RuntimeException("DeliveryZones not found"));
	}

	@Override
	public String addDeliveryZones(DeliveryZonesEntity delivery_zonesEntity, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
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
			newEntity.setBranchId(fetchReferenceById(delivery_zonesEntity.getBranchId(), usersRepository,
					"Restaurant_branch not found"));
		}

		deliveryzonesrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateDeliveryZones(DeliveryZonesEntity delivery_zonesEntity, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
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
			existingEntity.setBranchId(fetchReferenceById(delivery_zonesEntity.getBranchId(), usersRepository,
					"Restaurant_branch not found"));
		}

		deliveryzonesrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteDeliveryZones(Long id, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		if (!deliveryzonesrepository.existsById(id)) {
			throw new RuntimeException("DeliveryZones not found");
		}
		deliveryzonesrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleDeliveryZones(List<DeliveryZonesEntity> delivery_zonesEntitys, String token)
			throws Exception {
		Authorization.authorizeRestaurant(token);
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
						fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found"));
			}

			entitiesToSave.add(newEntity);
		}

		deliveryzonesrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<DeliveryZonesEntity> getDeliveryZonesByCreatedatBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeRestaurant(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return deliveryzonesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getDeliveryZonesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeRestaurant(token);
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
		Authorization.authorizeRestaurant(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return deliveryzonesrepository.findByCreatedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
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
				row.createCell(0).setCellValue(deliveryZonesEntity.getId() != null ? deliveryZonesEntity.getId() : 0);

				// Branch ID
				row.createCell(1).setCellValue(
						deliveryZonesEntity.getBranchId() != null ? deliveryZonesEntity.getBranchId().getId() : 0);

				// Zone Name
				row.createCell(2).setCellValue(
						deliveryZonesEntity.getZoneName() != null ? deliveryZonesEntity.getZoneName() : "N/A");

				// Description
				row.createCell(3).setCellValue(
						deliveryZonesEntity.getDescription() != null ? deliveryZonesEntity.getDescription() : "N/A");

				// Radius KM From
				row.createCell(4).setCellValue(
						deliveryZonesEntity.getRadiusKmFrom() != null ? deliveryZonesEntity.getRadiusKmFrom() : 0.0);

				// Radius KM To
				row.createCell(5).setCellValue(
						deliveryZonesEntity.getRadiusKmTo() != null ? deliveryZonesEntity.getRadiusKmTo() : 0.0);

				// Delivery Charge
				row.createCell(6)
						.setCellValue(deliveryZonesEntity.getDeliveryCharge() != null
								? deliveryZonesEntity.getDeliveryCharge().doubleValue()
								: 0.0);

				// Delivery Time (Minutes)
				row.createCell(7)
						.setCellValue(deliveryZonesEntity.getDeliveryTimeMinutes() != null
								? deliveryZonesEntity.getDeliveryTimeMinutes()
								: 0);

				// Status
				row.createCell(8)
						.setCellValue(Boolean.TRUE.equals(deliveryZonesEntity.getIsActive()) ? "Active" : "Inactive");

				// Created At
				LocalDateTime createdAt = deliveryZonesEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";

				row.createCell(9).setCellValue(formattedCreatedAt);
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
