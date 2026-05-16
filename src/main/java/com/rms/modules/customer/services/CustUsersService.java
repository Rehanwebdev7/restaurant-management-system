package com.rms.modules.customer.services;

import com.rms.common.Constant;
import com.rms.common.apis.GoogleMapsService;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.serviceImplement.UsersServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.UsersProfileRepository;

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
import java.lang.invoke.ConstantBootstraps;
import java.lang.reflect.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

@Service
@Qualifier("custUsersService")
public class CustUsersService implements UsersServiceIMP {

	private final UsersRepository usersrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final CustomersRepository customersRepository;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private GoogleMapsService googleMapsService;

	@Autowired
	private UsersProfileRepository usersProfileRepository;

	@Autowired
	private Constant constant;

	@Autowired
	private TokenUtil tokenUtil;

	public CustUsersService(UsersRepository usersrepository, RestaurantBranchRepository restaurantbranchrepository,
			CustomersRepository customersRepository) {
		this.usersrepository = usersrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
		this.customersRepository = customersRepository;
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

//    public List<Map<String, Object>> getNearestBranchesByRestaurant(
//            Long restaurantId,
//            double customerLat,
//            double customerLon) {
//
//        // 1️⃣ Validate restaurant exists
//        UsersEntity restaurant = usersRepository.findById(restaurantId)
//                .orElseThrow(() -> new RuntimeException("Invalid restaurant id"));
//
//        // 2️⃣ Fetch branches of this restaurant
//        List<UsersEntity> branchUsers =
//                usersRepository.findByParentId_id(restaurant.getId());
//
//        if (branchUsers == null || branchUsers.isEmpty()) {
//            throw new RuntimeException("No branches found for this restaurant");
//        }
//
//        // 3️⃣ Calculate & sort nearest branches
//        List<Map<String, Object>> nearestBranches =
//                Constant.findNearestBranches(
//                        customerLat,
//                        customerLon,
//                        branchUsers,
//                        usersProfileRepository
//                );
//
//        if (nearestBranches.isEmpty()) {
//            throw new RuntimeException("No branch location available");
//        }
//
//        return nearestBranches;
//    }

//    ********************** Ggoogle map[ *****************************

//    public List<Map<String, Object>> getNearestBranchesByRestaurant(
//            Long restaurantId,
//            double customerLat,
//            double customerLon) {
//
//        // 1️⃣ Validate restaurant
//        UsersEntity restaurant = usersRepository.findById(restaurantId)
//                .orElseThrow(() -> new RuntimeException("Invalid restaurant id"));
//
//        // 2️⃣ Fetch branches
//        List<UsersEntity> branchUsers =
//                usersRepository.findByParentId_id(restaurant.getId());
//
//        if (branchUsers == null || branchUsers.isEmpty()) {
//            throw new RuntimeException("No branches found for this restaurant");
//        }
//
//        // 3️⃣ Google Maps distance based nearest branches
//        List<Map<String, Object>> nearestBranches =
//                Constant.findNearestBranchesUsingGoogleMaps(
//                        customerLat,
//                        customerLon,
//                        branchUsers,
//                        usersProfileRepository,
//                        googleMapsService
//                );
//
//        if (nearestBranches.isEmpty()) {
//            throw new RuntimeException("No branch location available");
//        }
//
//        return nearestBranches;
//    }

//**********************************************************************************************

//    /**************************** Google map and calculation **************************
	public List<Map<String, Object>> getNearestBranchesByRestaurant(Long restaurantId, double customerLat,
			double customerLon) {

		UsersEntity restaurant = usersRepository.findById(restaurantId)
				.orElseThrow(() -> new RuntimeException("Invalid restaurant id"));

		List<UsersEntity> branchUsers = usersRepository.findByParentId_id(restaurant.getId());

		if (branchUsers == null || branchUsers.isEmpty()) {
			throw new RuntimeException("No branches found for this restaurant");
		}

		List<Map<String, Object>> nearestBranches = constant.findNearestBranches(customerLat, customerLon, branchUsers,
				usersProfileRepository, googleMapsService);

		if (nearestBranches.isEmpty()) {
			throw new RuntimeException("No branch location available");
		}

		return nearestBranches;
	}

//    ************************************************************************************

	@Override
	public List<UsersEntity> getAllRecordUsers(String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return usersrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllUsers(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
		return usersrepository.findById(id).orElseThrow(() -> new RuntimeException("Users not found"));
	}

	@Override
	public String addUsers(UsersEntity usersEntity, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
			newEntity.setParentId(fetchReferenceById(usersEntity.getParentId(), usersrepository, "Users not found"));
		}

		// Handle branch_id foreign key
		if (usersEntity.getBranchId() != null && usersEntity.getBranchId().getId() != null) {
			newEntity.setBranchId(
					fetchReferenceById(usersEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		usersrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateUsers(UsersEntity usersEntity, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
		if (!usersrepository.existsById(id)) {
			throw new RuntimeException("Users not found");
		}
		usersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleUsers(List<UsersEntity> usersEntitys, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return usersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<UsersEntity> getUsersByLastloginBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByLastLoginBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByLastloginBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = lastlogin.atStartOfDay();
		return usersrepository.findByLastLogin(dateTime);
	}

	@Override
	public List<UsersEntity> getUsersByLastloginatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByLastLoginAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByLastloginatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = lastloginat.atStartOfDay();
		return usersrepository.findByLastLoginAt(dateTime);
	}

	@Override
	public List<UsersEntity> getUsersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return usersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getUsersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
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
		Authorization.authorizeCustomer(token);
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
				row.createCell(9).setCellValue("[protected]"); // do not export password hashes to spreadsheets
				row.createCell(10).setCellValue(usersEntity.getRole() != null ? usersEntity.getRole() : "N/A");
				LocalDateTime updatedAt = usersEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(11).setCellValue(formattedUpdatedAt);
				row.createCell(12)
						.setCellValue(usersEntity.getParentId() != null ? usersEntity.getParentId().toString() : "N/A");
				row.createCell(13)
						.setCellValue(usersEntity.getBranchId() != null ? usersEntity.getBranchId().toString() : "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	public CustomersEntity getByUserId(String token) throws Exception {
		Authorization.authorizeCustomer(token);
		tokenUtil.decryptAndStoreToken(token);
		Long userId = tokenUtil.getCurrentUserId().longValue();
		return customersRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));
	}
}
