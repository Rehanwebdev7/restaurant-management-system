package com.rms.modules.delivery.services;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.repositories.WalletTransactionsRepository;
import com.rms.common.serviceImplement.WalletTransactionsServiceIMP;
import com.rms.common.util.JavaProcedures;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.BankDetailsRepository;
import com.rms.common.repositories.OrdersRepository;
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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Qualifier("delWalletTransactionsService")
public class DelWalletTransactionsService implements WalletTransactionsServiceIMP {

	private final WalletTransactionsRepository wallettransactionsrepository;
	private final BankDetailsRepository bankdetailsrepository;
	private final OrdersRepository ordersrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private WalletTransactionsRepository walletTransactionsRepository;

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private UsersRepository usersRepository;

	public DelWalletTransactionsService(WalletTransactionsRepository wallettransactionsrepository,
			BankDetailsRepository bankdetailsrepository, OrdersRepository ordersrepository,
			UsersRepository usersrepository) {
		this.wallettransactionsrepository = wallettransactionsrepository;
		this.bankdetailsrepository = bankdetailsrepository;
		this.ordersrepository = ordersrepository;
		this.usersrepository = usersrepository;
	}

	@Autowired
	private JavaProcedures javaProcedures;

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

	public ByteArrayInputStream streamWalletLedgerExcel(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {

		// 🔐 Authorization - delivery user
		try {
			Authorization.authorizeDelivery(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}

		// 🔓 Token → Delivery User
		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

		UsersEntity deliveryUser = usersRepository.findById(deliveryUserId)
				.orElseThrow(() -> new RuntimeException("Delivery user not found"));

		// 📅 Date range conversion
		LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
		LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

		// 📦 Fetch wallet transactions
		List<WalletTransactionsEntity> walletList;

		if (fromDateTime != null && toDateTime != null) {
			walletList = walletTransactionsRepository.findByUserId_idAndDateBetween(deliveryUserId, fromDate, toDate);
		} else {
			walletList = walletTransactionsRepository.findByUserId_id(deliveryUserId);
		}

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

			Sheet sheet = workbook.createSheet("Wallet Ledger");

			// 🧾 Header Row
			Row header = sheet.createRow(0);

			header.createCell(0).setCellValue("Transaction ID");
			header.createCell(1).setCellValue("Mode");
			header.createCell(2).setCellValue("Opening Balance");
			header.createCell(3).setCellValue("Amount");
			header.createCell(4).setCellValue("Closing Balance");
			header.createCell(5).setCellValue("User Name");
			header.createCell(6).setCellValue("Order Number");
			header.createCell(7).setCellValue("Bank Reference ID");
			header.createCell(8).setCellValue("Bank Detail");
			header.createCell(9).setCellValue("Message");
			header.createCell(10).setCellValue("Status");
			header.createCell(11).setCellValue("Date");
			header.createCell(12).setCellValue("Time");

			// 🧾 Data Rows
			int rowNum = 1;
			for (WalletTransactionsEntity txn : walletList) {
				Row row = sheet.createRow(rowNum++);

				row.createCell(0).setCellValue(txn.getId() != null ? txn.getId() : 0);
				row.createCell(1).setCellValue(txn.getMode() == null ? "Unknown"
						: (txn.getMode() == 0 ? "Credit" : txn.getMode() == 1 ? "Debit" : "Unknown"));

				row.createCell(2).setCellValue(txn.getOpBal() != null ? txn.getOpBal().doubleValue() : 0.0);
				row.createCell(3).setCellValue(txn.getAmount() != null ? txn.getAmount().doubleValue() : 0.0);
				row.createCell(4).setCellValue(txn.getClosingBal() != null ? txn.getClosingBal().doubleValue() : 0.0);

				row.createCell(5).setCellValue(txn.getUserId() != null ? txn.getUserId().getName() : "");

				row.createCell(6)
						.setCellValue(txn.getOrderId() != null && txn.getOrderId().getOrderNumber() != null
								? txn.getOrderId().getOrderNumber()
								: "");

				row.createCell(7).setCellValue(txn.getBankRefId() != null ? txn.getBankRefId() : "");

				row.createCell(8)
						.setCellValue(txn.getBankDetailId() != null && txn.getBankDetailId().getAccountNumber() != null
								? txn.getBankDetailId().getAccountNumber()
								: "");

				row.createCell(9).setCellValue(txn.getMessage() != null ? txn.getMessage() : "");
				row.createCell(10).setCellValue(txn.getStatus() != null ? txn.getStatus() : "");

				row.createCell(11).setCellValue(txn.getDate() != null ? txn.getDate().format(dateFormat) : "");
				row.createCell(12).setCellValue(txn.getTime() != null ? txn.getTime().format(timeFormat) : "");
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	public Map<String, Object> getWalletTransactionsWithFilters(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer mode, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 DELIVERY AUTH
		Authorization.authorizeDelivery(token);

		// 🔓 TOKEN → DELIVERY USER
		tokenUtil.decryptAndStoreToken(token);
		Long deliveryUserId = tokenUtil.getCurrentUserId().longValue();

		// ================= DELIVERY USER =================
		UsersEntity deliveryUser = usersRepository.findById(deliveryUserId)
				.orElseThrow(() -> new RuntimeException("Delivery user not found"));

		// ================= SPECIFICATION =================
		Specification<WalletTransactionsEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= MANDATORY USER FILTER =================
			Join<WalletTransactionsEntity, UsersEntity> userJoin = root.join("userId", JoinType.INNER);
			predicates.add(cb.equal(userJoin.get("id"), deliveryUserId));

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				predicates.add(cb.between(root.get("date"), fromDate, toDate));
			}

			// ================= STATUS FILTER (IGNORE CASE) =================
			if (status != null && !status.isBlank()) {
				predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
			}

			// ================= MODE FILTER =================
			if (mode != null) {
				predicates.add(cb.equal(root.get("mode"), mode));
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.isBlank()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				searchPredicates.add(cb.like(cb.lower(root.get("bankRefId")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("message")), pattern));
//				searchPredicates.add(cb.like(cb.lower(root.get("status")), pattern));

				// ================= ORDER ID SEARCH =================
				// ================= ORDER NUMBER SEARCH =================
				Join<WalletTransactionsEntity, OrdersEntity> orderJoin = root.join("orderId", JoinType.LEFT);

				searchPredicates.add(cb.like(cb.lower(orderJoin.get("orderNumber")), pattern));

				// ================= AMOUNT SEARCH =================
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

		Page<WalletTransactionsEntity> page = walletTransactionsRepository.findAll(spec, pageable);

		// ================= RESPONSE =================
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	/**
	 * Wallet credit / debit handler
	 */
	public String walletTransaction(Map<String, Object> payload) throws Exception {
		return javaProcedures.walletTransactionProcedure(payload);
	}

//	public Map<String, Object> getWalletTransactionsWithFilters(LocalDate fromDate, LocalDate toDate, String status,
//			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {
//
//		// 🔐 DELIVERY / USER AUTH
//		Authorization.authorizeDelivery(token);
//
//		// 🔓 TOKEN → USER
//		tokenUtil.decryptAndStoreToken(token);
//		Long userId = tokenUtil.getCurrentUserId().longValue();
//
//		// ================= USER =================
//		UsersEntity user = usersRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
//
//		// ================= PARENT BRANCH =================
//		if (user.getBranchId() == null) {
//			throw new RuntimeException("Branch not mapped with user");
//		}
//
//		UsersEntity branchUser = user.getBranchId();
//		Long branchId = branchUser.getId();
//
//		Specification<WalletTransactionsEntity> spec = (root, query, cb) -> {
//
//			List<Predicate> predicates = new ArrayList<>();
//
//			// ================= USER JOIN =================
//			Join<WalletTransactionsEntity, UsersEntity> userJoin = root.join("userId", JoinType.INNER);
//
//			// ================= BRANCH FILTER (MANDATORY) =================
//			predicates.add(cb.equal(userJoin.get("branchId").get("id"), branchId));
//
//			// ================= DATE FILTER =================
//			if (fromDate != null && toDate != null) {
//				predicates.add(cb.between(root.get("date"), fromDate, toDate));
//			}
//
//			// ================= STATUS FILTER =================
//			if (status != null && !status.isBlank()) {
//				predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
//			}
//
//			// ================= SEARCH FILTER =================
//			if (searchValue != null && !searchValue.isBlank()) {
//
//				String pattern = "%" + searchValue.toLowerCase() + "%";
//				List<Predicate> searchPredicates = new ArrayList<>();
//
//				searchPredicates.add(cb.like(cb.lower(root.get("mode")), pattern));
//				searchPredicates.add(cb.like(cb.lower(root.get("message")), pattern));
//				searchPredicates.add(cb.like(cb.lower(root.get("bankRefId")), pattern));
//				searchPredicates.add(cb.like(cb.lower(root.get("status")), pattern));
//
//				try {
//					BigDecimal amount = new BigDecimal(searchValue);
//					searchPredicates.add(cb.equal(root.get("amount"), amount));
//				} catch (Exception ignored) {
//				}
//
//				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
//			}
//
//			return cb.and(predicates.toArray(new Predicate[0]));
//		};
//
//		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize);
//
//		Page<WalletTransactionsEntity> page = walletTransactionsRepository.findAll(spec, pageable);
//
//		Map<String, Object> response = new LinkedHashMap<>();
//		response.put("totalRecords", page.getTotalElements());
//		response.put("pageSize", page.getSize());
//		response.put("currentPage", page.getNumber() + 1);
//		response.put("totalPages", page.getTotalPages());
//		response.put("records", page.getContent());
//
//		return response;
//	}

	@Override
	public List<WalletTransactionsEntity> getAllRecordWalletTransactions(String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return wallettransactionsrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllWalletTransactions(Integer pageNumber, Integer pageSize, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = wallettransactionsrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public WalletTransactionsEntity getOneWalletTransactions(Integer id, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return wallettransactionsrepository.findById(id)
				.orElseThrow(() -> new RuntimeException("WalletTransactions not found"));
	}

	@Override
	public String addWalletTransactions(WalletTransactionsEntity wallet_transactionsEntity, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		WalletTransactionsEntity newEntity = new WalletTransactionsEntity();

		// Copy non-foreign fields using reflection
		for (Field field : WalletTransactionsEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(wallet_transactionsEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle bank_detail_id foreign key
		if (wallet_transactionsEntity.getBankDetailId() != null
				&& wallet_transactionsEntity.getBankDetailId().getId() != null) {
			newEntity.setBankDetailId(fetchReferenceById(wallet_transactionsEntity.getBankDetailId(),
					bankdetailsrepository, "Bank_details not found"));
		}

		// Handle order_id foreign key
		if (wallet_transactionsEntity.getOrderId() != null && wallet_transactionsEntity.getOrderId().getId() != null) {
			newEntity.setOrderId(
					fetchReferenceById(wallet_transactionsEntity.getOrderId(), ordersrepository, "Orders not found"));
		}

		// Handle user_id foreign key
		if (wallet_transactionsEntity.getUserId() != null && wallet_transactionsEntity.getUserId().getId() != null) {
			newEntity.setUserId(
					fetchReferenceById(wallet_transactionsEntity.getUserId(), usersrepository, "Users not found"));
		}

		wallettransactionsrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateWalletTransactions(WalletTransactionsEntity wallet_transactionsEntity, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		WalletTransactionsEntity existingEntity = wallettransactionsrepository
				.findById(wallet_transactionsEntity.getId())
				.orElseThrow(() -> new RuntimeException("WalletTransactions not found"));

		// Update non-foreign fields using reflection
		for (Field field : WalletTransactionsEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(wallet_transactionsEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle bank_detail_id foreign key
		if (wallet_transactionsEntity.getBankDetailId() != null
				&& wallet_transactionsEntity.getBankDetailId().getId() != null) {
			existingEntity.setBankDetailId(fetchReferenceById(wallet_transactionsEntity.getBankDetailId(),
					bankdetailsrepository, "Bank_details not found"));
		}

		// Handle order_id foreign key
		if (wallet_transactionsEntity.getOrderId() != null && wallet_transactionsEntity.getOrderId().getId() != null) {
			existingEntity.setOrderId(
					fetchReferenceById(wallet_transactionsEntity.getOrderId(), ordersrepository, "Orders not found"));
		}

		// Handle user_id foreign key
		if (wallet_transactionsEntity.getUserId() != null && wallet_transactionsEntity.getUserId().getId() != null) {
			existingEntity.setUserId(
					fetchReferenceById(wallet_transactionsEntity.getUserId(), usersrepository, "Users not found"));
		}

		wallettransactionsrepository.save(existingEntity);
		return "Updated Successfully";
	}

	@Override
	public String deleteWalletTransactions(Integer id, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		if (!wallettransactionsrepository.existsById(id)) {
			throw new RuntimeException("WalletTransactions not found");
		}
		wallettransactionsrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleWalletTransactions(List<WalletTransactionsEntity> wallet_transactionsEntitys, String token)
			throws Exception {
		Authorization.authorizeDelivery(token);
		List<WalletTransactionsEntity> entitiesToSave = new ArrayList<>();

		for (WalletTransactionsEntity entity : wallet_transactionsEntitys) {
			WalletTransactionsEntity newEntity = new WalletTransactionsEntity();

			// Copy non-foreign fields using reflection
			for (Field field : WalletTransactionsEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle bank_detail_id foreign key
			if (entity.getBankDetailId() != null && entity.getBankDetailId().getId() != null) {
				newEntity.setBankDetailId(
						fetchReferenceById(entity.getBankDetailId(), bankdetailsrepository, "Bank_details not found"));
			}

			// Handle order_id foreign key
			if (entity.getOrderId() != null && entity.getOrderId().getId() != null) {
				newEntity.setOrderId(fetchReferenceById(entity.getOrderId(), ordersrepository, "Orders not found"));
			}

			// Handle user_id foreign key
			if (entity.getUserId() != null && entity.getUserId().getId() != null) {
				newEntity.setUserId(fetchReferenceById(entity.getUserId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		wallettransactionsrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<WalletTransactionsEntity> getWalletTransactionsByDateBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return wallettransactionsrepository.findByDateBetween(fromDate, toDate);
	}

	@Override
	public Map<String, Object> getWalletTransactionsByDateBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = wallettransactionsrepository.findByDateBetween(fromDate, toDate, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<WalletTransactionsEntity> getWalletTransactionsByDate(LocalDate date, String token) throws Exception {
		Authorization.authorizeDelivery(token);
		return wallettransactionsrepository.findByDate(date);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<WalletTransactionsEntity> page = wallettransactionsrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("WalletTransactionss");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Amount");
			header.createCell(2).setCellValue("Bank_ref_id");
			header.createCell(3).setCellValue("Closing_bal");
			header.createCell(4).setCellValue("Date");
			header.createCell(5).setCellValue("Message");
			header.createCell(6).setCellValue("Mode");
			header.createCell(7).setCellValue("Op_bal");
			header.createCell(8).setCellValue("Status");
			header.createCell(9).setCellValue("Time");
			header.createCell(10).setCellValue("Bank_detail_id");
			header.createCell(11).setCellValue("Order_id");
			header.createCell(12).setCellValue("User_id");

			int rowNum = 1;
			for (WalletTransactionsEntity wallet_transactionsEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(
						wallet_transactionsEntity.getId() != null ? wallet_transactionsEntity.getId() : 0);
				row.createCell(1)
						.setCellValue(wallet_transactionsEntity.getAmount() != null
								? wallet_transactionsEntity.getAmount().doubleValue()
								: 0.0);
				row.createCell(2)
						.setCellValue(wallet_transactionsEntity.getBankRefId() != null
								? wallet_transactionsEntity.getBankRefId()
								: "N/A");
				row.createCell(3)
						.setCellValue(wallet_transactionsEntity.getClosingBal() != null
								? wallet_transactionsEntity.getClosingBal().doubleValue()
								: 0.0);
				LocalDate date = wallet_transactionsEntity.getDate();
				String formattedDate = (date != null) ? date.format(dateFormat) : "";
				row.createCell(4).setCellValue(formattedDate);
				row.createCell(5).setCellValue(
						wallet_transactionsEntity.getMessage() != null ? wallet_transactionsEntity.getMessage()
								: "N/A");
				row.createCell(6).setCellValue(
						wallet_transactionsEntity.getMode() != null ? wallet_transactionsEntity.getMode() : 0);
				row.createCell(7)
						.setCellValue(wallet_transactionsEntity.getOpBal() != null
								? wallet_transactionsEntity.getOpBal().doubleValue()
								: 0.0);
				row.createCell(8).setCellValue(
						wallet_transactionsEntity.getStatus() != null ? wallet_transactionsEntity.getStatus() : "N/A");
				LocalTime time = wallet_transactionsEntity.getTime();
				String formattedTime = (time != null) ? time.format(timeFormat) : "";
				row.createCell(9).setCellValue(formattedTime);
				row.createCell(10)
						.setCellValue(wallet_transactionsEntity.getBankDetailId() != null
								? wallet_transactionsEntity.getBankDetailId().toString()
								: "N/A");
				row.createCell(11)
						.setCellValue(wallet_transactionsEntity.getOrderId() != null
								? wallet_transactionsEntity.getOrderId().toString()
								: "N/A");
				row.createCell(12)
						.setCellValue(wallet_transactionsEntity.getUserId() != null
								? wallet_transactionsEntity.getUserId().toString()
								: "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
