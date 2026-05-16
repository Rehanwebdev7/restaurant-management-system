package com.rms.modules.customer.services;

import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.serviceImplement.DiningTablesServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.SectionRepository;
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
@Qualifier("custDiningTablesService")
public class CustDiningTablesService implements DiningTablesServiceIMP {

	private final DiningTablesRepository diningtablesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final SectionRepository sectionrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private UsersRepository usersRepository;

	public CustDiningTablesService(DiningTablesRepository diningtablesrepository,
			RestaurantBranchRepository restaurantbranchrepository, SectionRepository sectionrepository,
			UsersRepository usersrepository) {
		this.diningtablesrepository = diningtablesrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
		this.sectionrepository = sectionrepository;
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

	@Override
	public List<DiningTablesEntity> getAllRecordDiningTables(String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return diningtablesrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllDiningTables(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = diningtablesrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public DiningTablesEntity getOneDiningTables(Long id, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return diningtablesrepository.findById(id).orElseThrow(() -> new RuntimeException("DiningTables not found"));
	}

	@Override
	public String addDiningTables(DiningTablesEntity dining_tablesEntity, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		DiningTablesEntity newEntity = new DiningTablesEntity();

		// Copy non-foreign fields using reflection
		for (Field field : DiningTablesEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(dining_tablesEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle branch_id foreign key
		if (dining_tablesEntity.getBranchId() != null && dining_tablesEntity.getBranchId().getId() != null) {
			newEntity.setBranchId(fetchReferenceById(dining_tablesEntity.getBranchId(), usersRepository,
					"Restaurant_branch not found"));
		}

		// Handle section_id foreign key
		if (dining_tablesEntity.getSectionId() != null && dining_tablesEntity.getSectionId().getId() != null) {
			newEntity.setSectionId(
					fetchReferenceById(dining_tablesEntity.getSectionId(), sectionrepository, "Section not found"));
		}

		// Handle restaurant_id foreign key
		if (dining_tablesEntity.getRestaurantId() != null && dining_tablesEntity.getRestaurantId().getId() != null) {
			newEntity.setRestaurantId(
					fetchReferenceById(dining_tablesEntity.getRestaurantId(), usersRepository, "Users not found"));
		}

		diningtablesrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateDiningTables(DiningTablesEntity dining_tablesEntity, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		DiningTablesEntity existingEntity = diningtablesrepository.findById(dining_tablesEntity.getId())
				.orElseThrow(() -> new RuntimeException("DiningTables not found"));

		// Update non-foreign fields using reflection
		for (Field field : DiningTablesEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(dining_tablesEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle branch_id foreign key
		if (dining_tablesEntity.getBranchId() != null && dining_tablesEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(fetchReferenceById(dining_tablesEntity.getBranchId(), usersRepository,
					"Restaurant_branch not found"));
		}

		// Handle section_id foreign key
		if (dining_tablesEntity.getSectionId() != null && dining_tablesEntity.getSectionId().getId() != null) {
			existingEntity.setSectionId(
					fetchReferenceById(dining_tablesEntity.getSectionId(), sectionrepository, "Section not found"));
		}

		// Handle restaurant_id foreign key
		if (dining_tablesEntity.getRestaurantId() != null && dining_tablesEntity.getRestaurantId().getId() != null) {
			existingEntity.setRestaurantId(
					fetchReferenceById(dining_tablesEntity.getRestaurantId(), usersRepository, "Users not found"));
		}

		diningtablesrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteDiningTables(Long id, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		if (!diningtablesrepository.existsById(id)) {
			throw new RuntimeException("DiningTables not found");
		}
		diningtablesrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleDiningTables(List<DiningTablesEntity> dining_tablesEntitys, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		List<DiningTablesEntity> entitiesToSave = new ArrayList<>();

		for (DiningTablesEntity entity : dining_tablesEntitys) {
			DiningTablesEntity newEntity = new DiningTablesEntity();

			// Copy non-foreign fields using reflection
			for (Field field : DiningTablesEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle branch_id foreign key
			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				newEntity.setBranchId(
						fetchReferenceById(entity.getBranchId(), usersrepository, "Restaurant_branch not found"));
			}

			// Handle section_id foreign key
			if (entity.getSectionId() != null && entity.getSectionId().getId() != null) {
				newEntity.setSectionId(
						fetchReferenceById(entity.getSectionId(), sectionrepository, "Section not found"));
			}

			// Handle restaurant_id foreign key
			if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
				newEntity.setRestaurantId(
						fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		diningtablesrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<DiningTablesEntity> getDiningTablesByCreatedatBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return diningtablesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getDiningTablesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = diningtablesrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<DiningTablesEntity> getDiningTablesByCreatedat(LocalDate createdat, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return diningtablesrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<DiningTablesEntity> getDiningTablesByUpdatedatBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return diningtablesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getDiningTablesByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = diningtablesrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<DiningTablesEntity> getDiningTablesByUpdatedat(LocalDate updatedat, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return diningtablesrepository.findByUpdatedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<DiningTablesEntity> page = diningtablesrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("DiningTabless");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Restaurant_id");
			header.createCell(2).setCellValue("Branch_id");
			header.createCell(3).setCellValue("Table_number");
			header.createCell(4).setCellValue("Section_id");
			header.createCell(5).setCellValue("Capacity");
			header.createCell(6).setCellValue("Status");
			header.createCell(7).setCellValue("Qr_code");
			header.createCell(8).setCellValue("Notes");
			header.createCell(9).setCellValue("Is_deleted");
			header.createCell(10).setCellValue("Created_at");
			header.createCell(11).setCellValue("Updated_at");

			int rowNum = 1;
			for (DiningTablesEntity dining_tablesEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(dining_tablesEntity.getId() != null ? dining_tablesEntity.getId() : 0);
				row.createCell(1)
						.setCellValue(dining_tablesEntity.getRestaurantId() != null
								? dining_tablesEntity.getRestaurantId().toString()
								: "N/A");
				row.createCell(2).setCellValue(
						dining_tablesEntity.getBranchId() != null ? dining_tablesEntity.getBranchId().toString()
								: "N/A");
				row.createCell(3)
						.setCellValue(dining_tablesEntity.getTableNumber() != null
								? dining_tablesEntity.getTableNumber().toString()
								: "N/A");
				row.createCell(4)
						.setCellValue(dining_tablesEntity.getSectionId() != null
								? dining_tablesEntity.getSectionId().toString()
								: "N/A");
				row.createCell(5).setCellValue(
						dining_tablesEntity.getCapacity() != null ? dining_tablesEntity.getCapacity() : 0);
				row.createCell(6)
						.setCellValue(dining_tablesEntity.getStatus() != null ? dining_tablesEntity.getStatus() : 0);
				row.createCell(7).setCellValue(
						dining_tablesEntity.getQrCode() != null ? dining_tablesEntity.getQrCode() : "N/A");
				row.createCell(8)
						.setCellValue(dining_tablesEntity.getNotes() != null ? dining_tablesEntity.getNotes() : "N/A");
				row.createCell(9)
						.setCellValue(dining_tablesEntity.getIsDeleted() != null && dining_tablesEntity.getIsDeleted()
								? "Active"
								: "Inactive");
				LocalDateTime createdAt = dining_tablesEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(10).setCellValue(formattedCreatedAt);
				LocalDateTime updatedAt = dining_tablesEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(11).setCellValue(formattedUpdatedAt);

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
