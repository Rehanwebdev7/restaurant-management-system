package com.rms.modules.delivery.services;

import com.rms.common.entities.BankDetailsEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.BankDetailsRepository;
import com.rms.common.serviceImplement.BankDetailsServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
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
@Qualifier("delBankDetailsService")
public class DelBankDetailsService implements BankDetailsServiceIMP {

	private final BankDetailsRepository bankdetailsrepository;
	private final UsersRepository usersrepository;

	public DelBankDetailsService(BankDetailsRepository bankdetailsrepository, UsersRepository usersrepository) {
		this.bankdetailsrepository = bankdetailsrepository;
		this.usersrepository = usersrepository;
	}

	@Autowired
	private TokenUtil tokenUtil;
	
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
	
//	@Override
//	@Override
	public List<BankDetailsEntity> getAllRecordBankDetailsId(String token) throws Exception {

	    // 🔐 DELIVERY AUTH
	    Authorization.authorizeDelivery(token);

	    // 🔓 TOKEN → USER ID
	    tokenUtil.decryptAndStoreToken(token);
	    Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();
	    tokenUtil.clearTokenData();

	    // 👤 FETCH DELIVERY USER
	    UsersEntity deliveryUser = usersrepository.findById(deliveryUserId)
	            .orElseThrow(() -> new RuntimeException("Delivery user not found"));

	    // 📦 FETCH BANK DETAILS (USER BASED)
	    return bankdetailsrepository.findByUserId(deliveryUser);
	}



	@Override
	public List<BankDetailsEntity> getAllRecordBankDetails(String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return bankdetailsrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllBankDetails(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = bankdetailsrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public BankDetailsEntity getOneBankDetails(Long id, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return bankdetailsrepository.findById(id).orElseThrow(() -> new RuntimeException("BankDetails not found"));
	}

	@Override
	public String addBankDetails(BankDetailsEntity bank_detailsEntity, String token) throws Exception {

		// ✅ Token authorization
		Authorization.authorizeDelivery(token);

		// 🔓 TOKEN → DELIVERY USER ID
		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("Delivery User ID from token: " + deliveryUserId);

		BankDetailsEntity newEntity = new BankDetailsEntity();

		// ✅ Copy non-foreign fields using reflection
		for (Field field : BankDetailsEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(bank_detailsEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// ✅ Set userId from TOKEN (not from request)
		UsersEntity user = usersrepository.findById(deliveryUserId)
				.orElseThrow(() -> new RuntimeException("User not found"));

		newEntity.setUserId(user);

		bankdetailsrepository.save(newEntity);
		return "Added Successfully";
	}

//    @Override
//    public String addBankDetails(BankDetailsEntity bank_detailsEntity, String token) throws Exception {
//        Authorization.authorizeDelivery(token);
//        BankDetailsEntity newEntity = new BankDetailsEntity();
//
//        // Copy non-foreign fields using reflection
//        for (Field field : BankDetailsEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//            Object value = field.get(bank_detailsEntity);
//            if (value != null && !field.getName().endsWith("Id")) {
//                field.set(newEntity, value);
//            }
//        }
//
//        // Handle user_id foreign key
//        if (bank_detailsEntity.getUserId() != null && bank_detailsEntity.getUserId().getId() != null) {
//            newEntity.setUserId(
//                fetchReferenceById(bank_detailsEntity.getUserId(), usersrepository, "Users not found")
//            );
//        }
//
//        bankdetailsrepository.save(newEntity);
//        return "Added Successfully";
//    }

	@Override
	public String updateBankDetails(BankDetailsEntity bank_detailsEntity, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		BankDetailsEntity existingEntity = bankdetailsrepository.findById(bank_detailsEntity.getId())
				.orElseThrow(() -> new RuntimeException("BankDetails not found"));

		// Update non-foreign fields using reflection
		for (Field field : BankDetailsEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(bank_detailsEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle user_id foreign key
		if (bank_detailsEntity.getUserId() != null && bank_detailsEntity.getUserId().getId() != null) {
			existingEntity
					.setUserId(fetchReferenceById(bank_detailsEntity.getUserId(), usersrepository, "Users not found"));
		}

		bankdetailsrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteBankDetails(Long id, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		if (!bankdetailsrepository.existsById(id)) {
			throw new RuntimeException("BankDetails not found");
		}
		bankdetailsrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleBankDetails(List<BankDetailsEntity> bank_detailsEntitys, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		List<BankDetailsEntity> entitiesToSave = new ArrayList<>();

		for (BankDetailsEntity entity : bank_detailsEntitys) {
			BankDetailsEntity newEntity = new BankDetailsEntity();

			// Copy non-foreign fields using reflection
			for (Field field : BankDetailsEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle user_id foreign key
			if (entity.getUserId() != null && entity.getUserId().getId() != null) {
				newEntity.setUserId(fetchReferenceById(entity.getUserId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		bankdetailsrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<BankDetailsEntity> getBankDetailsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return bankdetailsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getBankDetailsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = bankdetailsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<BankDetailsEntity> getBankDetailsByCreatedat(LocalDate createdat, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return bankdetailsrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<BankDetailsEntity> getBankDetailsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return bankdetailsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getBankDetailsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = bankdetailsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<BankDetailsEntity> getBankDetailsByUpdatedat(LocalDate updatedat, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return bankdetailsrepository.findByUpdatedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<BankDetailsEntity> page = bankdetailsrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("BankDetailss");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Account_number");
			header.createCell(2).setCellValue("Created_at");
			header.createCell(3).setCellValue("Ifsc_code");
			header.createCell(4).setCellValue("Is_delete");
			header.createCell(5).setCellValue("Name");
			header.createCell(6).setCellValue("Status");
			header.createCell(7).setCellValue("Updated_at");
			header.createCell(8).setCellValue("Upi_id");
			header.createCell(9).setCellValue("User_id");

			int rowNum = 1;
			for (BankDetailsEntity bank_detailsEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(bank_detailsEntity.getId() != null ? bank_detailsEntity.getId() : 0);
				row.createCell(1).setCellValue(
						bank_detailsEntity.getAccountNumber() != null ? bank_detailsEntity.getAccountNumber() : "N/A");
				LocalDateTime createdAt = bank_detailsEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(2).setCellValue(formattedCreatedAt);
				row.createCell(3).setCellValue(
						bank_detailsEntity.getIfscCode() != null ? bank_detailsEntity.getIfscCode() : "N/A");
				row.createCell(4).setCellValue(
						bank_detailsEntity.getIsDelete() != null ? bank_detailsEntity.getIsDelete() : "N/A");
				row.createCell(5)
						.setCellValue(bank_detailsEntity.getName() != null ? bank_detailsEntity.getName() : "N/A");
				row.createCell(6)
						.setCellValue(bank_detailsEntity.getStatus() != null ? bank_detailsEntity.getStatus() : "N/A");
				LocalDateTime updatedAt = bank_detailsEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(7).setCellValue(formattedUpdatedAt);
				row.createCell(8)
						.setCellValue(bank_detailsEntity.getUpi() != null ? bank_detailsEntity.getUpi() : "N/A");
				row.createCell(9).setCellValue(
						bank_detailsEntity.getUserId() != null ? bank_detailsEntity.getUserId().toString() : "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
