package com.rms.modules.cashier.services;

import com.rms.common.entities.OutstandingEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.OutstandingRepository;
import com.rms.common.serviceImplement.OutstandingServiceIMP;
import com.rms.common.util.JavaProcedures;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

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
import java.math.BigDecimal;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.HashMap;

@Service
@Qualifier("cashOutstandingService")
public class CashOutstandingService implements OutstandingServiceIMP {

	private final OutstandingRepository outstandingrepository;
	private final UsersRepository usersrepository;

	public CashOutstandingService(OutstandingRepository outstandingrepository, UsersRepository usersrepository) {
		this.outstandingrepository = outstandingrepository;
		this.usersrepository = usersrepository;
	}

	@Autowired
	private JavaProcedures javaProcedures;
	
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
	
	public ByteArrayInputStream streamOutstandingLedgerExcel(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {

		// 🔐 Authorization - delivery user
		try {
			Authorization.authorizeCashier(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}

		// 🔓 Token → Delivery User
		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

		UsersEntity deliveryUser = usersrepository.findById(deliveryUserId)
				.orElseThrow(() -> new RuntimeException("Delivery user not found"));

		// 📅 Date range conversion
		LocalDate from = fromDate != null ? fromDate : null;
		LocalDate to = toDate != null ? toDate : null;

		// 📦 Fetch outstanding records
		List<OutstandingEntity> outstandingList;

		if (from != null && to != null) {
			outstandingList = outstandingrepository.findByDeductById_IdAndDateBetween(deliveryUserId, from, to);
		} else {
			outstandingList = outstandingrepository.findByDeductById_Id(deliveryUserId);
		}

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

			Sheet sheet = workbook.createSheet("Outstanding Ledger");

			// 🧾 Header Row
			Row header = sheet.createRow(0);

			header.createCell(0).setCellValue("ID");
			header.createCell(1).setCellValue("Mode");
			header.createCell(2).setCellValue("Service");
			header.createCell(3).setCellValue("Opening Balance");
			header.createCell(4).setCellValue("Amount");
			header.createCell(5).setCellValue("Closing Balance");
			header.createCell(6).setCellValue("User Name");
			header.createCell(7).setCellValue("Deducted By");
			header.createCell(8).setCellValue("Order ID");
			header.createCell(9).setCellValue("Remark");
			header.createCell(10).setCellValue("Date");
			header.createCell(11).setCellValue("Time");

			// 🧾 Data Rows
			int rowNum = 1;
			for (OutstandingEntity outst : outstandingList) {

				Row row = sheet.createRow(rowNum++);

				row.createCell(0).setCellValue(outst.getId() != null ? outst.getId() : 0);

				row.createCell(1).setCellValue(outst.getMode() == null ? "Unknown"
						: outst.getMode() == 0 ? "Credit" : outst.getMode() == 1 ? "Debit" : "Unknown");

				row.createCell(2).setCellValue(outst.getService() != null ? outst.getService() : "");

				row.createCell(3)
						.setCellValue(outst.getOpeningBal() != null ? outst.getOpeningBal().doubleValue() : 0.0);

				row.createCell(4).setCellValue(outst.getAmount() != null ? outst.getAmount().doubleValue() : 0.0);

				row.createCell(5)
						.setCellValue(outst.getClosingBal() != null ? outst.getClosingBal().doubleValue() : 0.0);

				row.createCell(6).setCellValue(outst.getUserId() != null ? outst.getUserId().getName() : "");

				row.createCell(7).setCellValue(outst.getDeductById() != null ? outst.getDeductById().getName() : "");

				row.createCell(8).setCellValue(outst.getOrderId() != null ? outst.getOrderId() : "");

				row.createCell(9).setCellValue(outst.getRemark() != null ? outst.getRemark() : "");

				row.createCell(10).setCellValue(outst.getDate() != null ? outst.getDate().format(dateFormat) : "");

				row.createCell(11).setCellValue(outst.getTime() != null ? outst.getTime() : "");
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
	
	public Map<String, Object> getOutstandingWithFilters(LocalDate fromDate, LocalDate toDate, Integer mode,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 DELIVERY AUTH
		Authorization.authorizeCashier(token);

		// 🔓 TOKEN → DELIVERY USER
		tokenUtil.decryptAndStoreToken(token);
		Long userId = tokenUtil.getCurrentUserId().longValue();

		// ================= USER =================
		UsersEntity user = usersrepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

		// ================= SPECIFICATION =================
		Specification<OutstandingEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= MANDATORY USER FILTER =================
			Join<OutstandingEntity, UsersEntity> userJoin = root.join("deductById", JoinType.INNER);
			predicates.add(cb.equal(userJoin.get("id"), userId));

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates.add(cb.between(root.get("date"), fromDate, toDate));
			}

			// ================= MODE FILTER =================
			if (mode != null) {
				predicates.add(cb.equal(root.get("mode"), mode));
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.isBlank()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				// 🔍 order_id
				searchPredicates.add(cb.like(cb.lower(root.get("orderId")), pattern));

				// 🔍 remark
				searchPredicates.add(cb.like(cb.lower(root.get("remark")), pattern));

				// 🔍 service
				searchPredicates.add(cb.like(cb.lower(root.get("service")), pattern));

				// 🔍 amount
				try {
					BigDecimal amount = new BigDecimal(searchValue);
					searchPredicates.add(cb.equal(root.get("amount"), amount));
				} catch (Exception ignored) {
				}

				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		// ================= PAGINATION =================
		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));

		Page<OutstandingEntity> page = outstandingrepository.findAll(spec, pageable);

		// ================= RESPONSE =================
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	public Map<String, Object> deductoutstannding(Map<String, Object> payload, String token) throws Exception {

		Authorization.authorizeCashier(token);

		tokenUtil.decryptAndStoreToken(token);
		Long branch = tokenUtil.getCurrentUserId().longValue();


		UsersEntity deliveryUser = usersrepository.findById(branch)
				.orElseThrow(() -> new RuntimeException("Branch not found"));

		// ===============================
		// 1️⃣ Extract & validate inputs
		// ===============================
		if (payload.get("userId") == null) {
			throw new RuntimeException("userId is mandatory");
		}

		if (payload.get("amount") == null) {
			throw new RuntimeException("amount is mandatory");
		}

		Long userId = Long.valueOf(payload.get("userId").toString());
		BigDecimal amount = new BigDecimal(payload.get("amount").toString());
		String remark = payload.get("remark") != null ? payload.get("remark").toString() : null;

		// ===============================
		// 2️⃣ Prepare Outstanding Payload
		// ===============================
		Map<String, Object> outstandingPayload = new HashMap<>();

		outstandingPayload.put("userId", userId);
		outstandingPayload.put("amount", amount);
		outstandingPayload.put("mode", "DEBIT");
		outstandingPayload.put("service", "DEBIT_OUTSTANDING");
		outstandingPayload.put("deductById", branch);

		if (remark != null) {
			outstandingPayload.put("remark", remark);
		}

		// ⚠️ orderId intentionally NOT sent (avoid null crash)

		// ===============================
		// 3️⃣ Call central procedure
		// ===============================
		String result = javaProcedures.outstandingTransactionProcedure(outstandingPayload);

		// ===============================
		// 4️⃣ Response
		// ===============================
		Map<String, Object> response = new HashMap<>();
		response.put("status", "SUCCESS");
		response.put("message", result);

		return response;
	}

	@Override
	public List<OutstandingEntity> getAllRecordOutstanding(String token) throws Exception {
		Authorization.authorizeCashier(token);
		return outstandingrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllOutstanding(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = outstandingrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public OutstandingEntity getOneOutstanding(Integer id, String token) throws Exception {
		Authorization.authorizeCashier(token);
		return outstandingrepository.findById(id).orElseThrow(() -> new RuntimeException("Outstanding not found"));
	}

	@Override
	public String addOutstanding(OutstandingEntity outstandingEntity, String token) throws Exception {
		Authorization.authorizeCashier(token);
		OutstandingEntity newEntity = new OutstandingEntity();

		// Copy non-foreign fields using reflection
		for (Field field : OutstandingEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(outstandingEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle user_id foreign key
		if (outstandingEntity.getUserId() != null && outstandingEntity.getUserId().getId() != null) {
			newEntity.setUserId(fetchReferenceById(outstandingEntity.getUserId(), usersrepository, "Users not found"));
		}

		outstandingrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateOutstanding(OutstandingEntity outstandingEntity, String token) throws Exception {
		Authorization.authorizeCashier(token);
		OutstandingEntity existingEntity = outstandingrepository.findById(outstandingEntity.getId())
				.orElseThrow(() -> new RuntimeException("Outstanding not found"));

		// Update non-foreign fields using reflection
		for (Field field : OutstandingEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(outstandingEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle user_id foreign key
		if (outstandingEntity.getUserId() != null && outstandingEntity.getUserId().getId() != null) {
			existingEntity
					.setUserId(fetchReferenceById(outstandingEntity.getUserId(), usersrepository, "Users not found"));
		}

		outstandingrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteOutstanding(Integer id, String token) throws Exception {
		Authorization.authorizeCashier(token);
		if (!outstandingrepository.existsById(id)) {
			throw new RuntimeException("Outstanding not found");
		}
		outstandingrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOutstanding(List<OutstandingEntity> outstandingEntitys, String token) throws Exception {
		Authorization.authorizeCashier(token);
		List<OutstandingEntity> entitiesToSave = new ArrayList<>();

		for (OutstandingEntity entity : outstandingEntitys) {
			OutstandingEntity newEntity = new OutstandingEntity();

			// Copy non-foreign fields using reflection
			for (Field field : OutstandingEntity.class.getDeclaredFields()) {
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

		outstandingrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<OutstandingEntity> getOutstandingByDateBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCashier(token);
		return outstandingrepository.findByDateBetween(fromDate, toDate);
	}

	@Override
	public Map<String, Object> getOutstandingByDateBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = outstandingrepository.findByDateBetween(fromDate, toDate, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OutstandingEntity> getOutstandingByDate(LocalDate date, String token) throws Exception {
		Authorization.authorizeCashier(token);
		return outstandingrepository.findByDate(date);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<OutstandingEntity> page = outstandingrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("Outstandings");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Amount");
			header.createCell(2).setCellValue("Closing_bal");
			header.createCell(3).setCellValue("Date");
			header.createCell(4).setCellValue("Mode");
			header.createCell(5).setCellValue("Opening_bal");
			header.createCell(6).setCellValue("Order_id");
			header.createCell(7).setCellValue("Remark");
			header.createCell(8).setCellValue("Service");
			header.createCell(9).setCellValue("Time");
			header.createCell(10).setCellValue("User_id");

			int rowNum = 1;
			for (OutstandingEntity outstandingEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(outstandingEntity.getId() != null ? outstandingEntity.getId() : 0);
				row.createCell(1).setCellValue(
						outstandingEntity.getAmount() != null ? outstandingEntity.getAmount().doubleValue() : 0.0);
				row.createCell(2)
						.setCellValue(outstandingEntity.getClosingBal() != null
								? outstandingEntity.getClosingBal().doubleValue()
								: 0.0);
				LocalDate date = outstandingEntity.getDate();
				String formattedDate = (date != null) ? date.format(dateFormat) : "";
				row.createCell(3).setCellValue(formattedDate);
				row.createCell(4).setCellValue(outstandingEntity.getMode() != null ? outstandingEntity.getMode() : 0);
				row.createCell(5)
						.setCellValue(outstandingEntity.getOpeningBal() != null
								? outstandingEntity.getOpeningBal().doubleValue()
								: 0.0);
				row.createCell(6)
						.setCellValue(outstandingEntity.getOrderId() != null ? outstandingEntity.getOrderId() : "N/A");
				row.createCell(7)
						.setCellValue(outstandingEntity.getRemark() != null ? outstandingEntity.getRemark() : "N/A");
				row.createCell(8)
						.setCellValue(outstandingEntity.getService() != null ? outstandingEntity.getService() : "N/A");
				row.createCell(9)
						.setCellValue(outstandingEntity.getTime() != null ? outstandingEntity.getTime() : "N/A");
				row.createCell(10).setCellValue(
						outstandingEntity.getUserId() != null ? outstandingEntity.getUserId().toString() : "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
