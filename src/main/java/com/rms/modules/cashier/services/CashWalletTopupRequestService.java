package com.rms.modules.cashier.services;

import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.WalletTopupRequestEntity;
import com.rms.common.repositories.WalletTopupRequestRepository;
import com.rms.common.serviceImplement.WalletTopupRequestServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import com.rms.common.repositories.UsersRepository;
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
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import java.math.BigDecimal;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

@Service
@Qualifier("cashWalletTopupRequestService")
public class CashWalletTopupRequestService implements WalletTopupRequestServiceIMP {

	private final WalletTopupRequestRepository wallettopuprequestrepository;
	private final UsersRepository usersrepository;
//    private final UsersRepository usersrepository;

	@Autowired
	private TokenUtil tokenUtil;

	public CashWalletTopupRequestService(WalletTopupRequestRepository wallettopuprequestrepository,
			UsersRepository usersrepository) {
		this.wallettopuprequestrepository = wallettopuprequestrepository;
		this.usersrepository = usersrepository;
//        this.usersrepository = usersrepository;
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

	public ByteArrayInputStream streamExcel(String token, LocalDate fromDate, LocalDate toDate) throws Exception {

		// 🔐 AUTH
		Authorization.authorizeBranch(token);

		// 🔓 TOKEN → USER ID
		tokenUtil.decryptAndStoreToken(token);
		Integer currentUserId = tokenUtil.getCurrentUserId();

		UsersEntity user = usersrepository.findById(currentUserId.longValue())
				.orElseThrow(() -> new RuntimeException("User not found"));

		// 📅 DATE RANGE
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);

		// 📦 FETCH DATA (TOKEN USER + DATE FILTER)
		List<WalletTopupRequestEntity> list = wallettopuprequestrepository
				.findByApprovedById_idAndApprovedDateBetween(currentUserId.longValue(), fromDateTime, toDateTime);

		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

			Sheet sheet = workbook.createSheet("Wallet Topup Requests");

			// 🧾 HEADER
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("User Name");
			header.createCell(1).setCellValue("Mobile");
			header.createCell(2).setCellValue("Amount");
			header.createCell(3).setCellValue("Bank Name");
			header.createCell(4).setCellValue("UTR");
			header.createCell(5).setCellValue("Status");
			header.createCell(6).setCellValue("Approved By");
			header.createCell(7).setCellValue("Approved Date");
			header.createCell(8).setCellValue("Reason");

			int rowNum = 1;

			for (WalletTopupRequestEntity entity : list) {

				Row row = sheet.createRow(rowNum++);

				row.createCell(0).setCellValue(entity.getUserId() != null ? entity.getUserId().getName() : "");

				row.createCell(1).setCellValue(entity.getUserId() != null ? entity.getUserId().getMobile() : "");

				row.createCell(2).setCellValue(entity.getAmount() != null ? entity.getAmount().doubleValue() : 0.0);

				row.createCell(3)
						.setCellValue(entity.getBankId() != null && entity.getBankId().getName() != null
								? entity.getBankId().getName()
								: "");

				row.createCell(4).setCellValue(entity.getUtr() != null ? entity.getUtr() : "");

				row.createCell(5).setCellValue(entity.getStatus() != null ? entity.getStatus() : "");

				row.createCell(6)
						.setCellValue(entity.getApprovedById() != null ? entity.getApprovedById().getName() : "");

				row.createCell(7).setCellValue(
						entity.getApprovedDate() != null ? entity.getApprovedDate().format(dateTimeFormat) : "");

				row.createCell(8).setCellValue(entity.getReason() != null ? entity.getReason() : "");
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	public Map<String, Object> approvalHistory(LocalDateTime fromDate, LocalDateTime toDate, Integer mode,
			String status, String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		// 🔐 AUTHORIZATION (BRANCH)
		Authorization.authorizeBranch(token);

		// 🔓 TOKEN → BRANCH USER
		tokenUtil.decryptAndStoreToken(token);
		Long branchUserId = tokenUtil.getCurrentUserId().longValue();

		// ================= BRANCH VALIDATION =================
//		UsersEntity branchUser = usersrepository.findById(branchUserId)
//				.orElseThrow(() -> new RuntimeException("Branch user not found"));

		// ================= SPECIFICATION =================
		Specification<WalletTopupRequestEntity> spec = (root, query, cb) -> {

			query.distinct(true);

			List<Predicate> predicates = new ArrayList<>();

			// 🔹 JOIN wallet → delivery user
			Join<WalletTopupRequestEntity, UsersEntity> branchUserJoin = root.join("approvedById", JoinType.INNER);

			// 🔹 JOIN delivery → branch
//			Join<UsersEntity, UsersEntity> branchJoin = deliveryUserJoin.join("branchId", JoinType.INNER);

			// 🔒 MANDATORY BRANCH FILTER
			predicates.add(cb.equal(branchUserJoin.get("id"), branchUserId));

			// 🔹 DATE FILTER
			if (fromDate != null && toDate != null) {
				predicates.add(cb.between(root.get("approvedDate"), fromDate, toDate));
			}

			// 🔹 MODE FILTER
			if (mode != null) {
				predicates.add(cb.equal(root.get("mode"), mode));
			}

			// 🔹 STATUS FILTER
			if (status != null && !status.isBlank()) {
				predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
			}

			// 🔍 SEARCH FILTER
			if (searchValue != null && !searchValue.isBlank()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				searchPredicates.add(cb.like(cb.lower(root.get("orderId")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("remark")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("reason")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("utr")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("bankName")), pattern));

				// 🔢 AMOUNT SEARCH
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

		Page<WalletTopupRequestEntity> page = wallettopuprequestrepository.findAll(spec, pageable);

		// ================= RESPONSE =================
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	public Map<String, Object> getWalletTopupRequestsWithFilters_ForBranch(LocalDateTime fromDate, LocalDateTime toDate,
			Integer mode, String status, String searchValue, Integer pageNumber, Integer pageSize, String token)
			throws Exception {

		// 🔐 AUTHORIZATION (BRANCH)
		Authorization.authorizeBranch(token);

		// 🔓 TOKEN → BRANCH USER
		tokenUtil.decryptAndStoreToken(token);
		Long branchUserId = tokenUtil.getCurrentUserId().longValue();

		// ================= BRANCH VALIDATION =================
//		UsersEntity branchUser = usersrepository.findById(branchUserId)
//				.orElseThrow(() -> new RuntimeException("Branch user not found"));

		// ================= SPECIFICATION =================
		Specification<WalletTopupRequestEntity> spec = (root, query, cb) -> {

			query.distinct(true);

			List<Predicate> predicates = new ArrayList<>();

			// 🔹 JOIN wallet → delivery user
			Join<WalletTopupRequestEntity, UsersEntity> deliveryUserJoin = root.join("userId", JoinType.INNER);

			// 🔹 JOIN delivery → branch
			Join<UsersEntity, UsersEntity> branchJoin = deliveryUserJoin.join("branchId", JoinType.INNER);

			// 🔒 MANDATORY BRANCH FILTER
			predicates.add(cb.equal(branchJoin.get("id"), branchUserId));

			// 🔹 DATE FILTER
			if (fromDate != null && toDate != null) {
				predicates.add(cb.between(root.get("date"), fromDate, toDate));
			}

			// 🔹 MODE FILTER
			if (mode != null) {
				predicates.add(cb.equal(root.get("mode"), mode));
			}

			// 🔹 STATUS FILTER
			if (status != null && !status.isBlank()) {
				predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
			}

			// 🔍 SEARCH FILTER
			if (searchValue != null && !searchValue.isBlank()) {

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				searchPredicates.add(cb.like(cb.lower(root.get("orderId")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("remark")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("reason")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("utr")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("bankName")), pattern));

				// 🔢 AMOUNT SEARCH
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

		Page<WalletTopupRequestEntity> page = wallettopuprequestrepository.findAll(spec, pageable);

		// ================= RESPONSE =================
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		return response;
	}

	@Override
	public List<WalletTopupRequestEntity> getAllRecordWalletTopupRequest(String token) throws Exception {
		Authorization.authorizeBranch(token);
		return wallettopuprequestrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllWalletTopupRequest(Integer pageNumber, Integer pageSize, String token)
			throws Exception {
		Authorization.authorizeBranch(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = wallettopuprequestrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public WalletTopupRequestEntity getOneWalletTopupRequest(Integer id, String token) throws Exception {
		Authorization.authorizeBranch(token);
		return wallettopuprequestrepository.findById(id)
				.orElseThrow(() -> new RuntimeException("WalletTopupRequest not found"));
	}

	@Override
	public String addWalletTopupRequest(WalletTopupRequestEntity wallet_topup_requestEntity, String token)
			throws Exception {
		Authorization.authorizeBranch(token);
		WalletTopupRequestEntity newEntity = new WalletTopupRequestEntity();

		// Copy non-foreign fields using reflection
		for (Field field : WalletTopupRequestEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(wallet_topup_requestEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle user_id foreign key
		if (wallet_topup_requestEntity.getUserId() != null && wallet_topup_requestEntity.getUserId().getId() != null) {
			newEntity.setUserId(
					fetchReferenceById(wallet_topup_requestEntity.getUserId(), usersrepository, "Users not found"));
		}

		// Handle approved_by_id foreign key
		if (wallet_topup_requestEntity.getApprovedById() != null
				&& wallet_topup_requestEntity.getApprovedById().getId() != null) {
			newEntity.setApprovedById(fetchReferenceById(wallet_topup_requestEntity.getApprovedById(), usersrepository,
					"Users not found"));
		}

		wallettopuprequestrepository.save(newEntity);
		return "Added Successfully";
	}

	@Override
	public String updateWalletTopupRequest(WalletTopupRequestEntity request, String token) throws Exception {

		// 🔐 AUTH
		Authorization.authorizeBranch(token);

		// 🔓 TOKEN → APPROVER
		tokenUtil.decryptAndStoreToken(token);
		Long approvedByUserId = tokenUtil.getCurrentUserId().longValue();

		WalletTopupRequestEntity existingEntity = wallettopuprequestrepository.findById(request.getId())
				.orElseThrow(() -> new RuntimeException("WalletTopupRequest not found"));

		String oldStatus = existingEntity.getStatus();
		String newStatus = request.getStatus();

		// ================= SAFE FIELD UPDATE (FOR LOOP) =================
		for (Field field : WalletTopupRequestEntity.class.getDeclaredFields()) {
			field.setAccessible(true);

			String fieldName = field.getName();
			Object newValue = field.get(request);

			// ❌ Skip null values
			if (newValue == null)
				continue;

			// ❌ Skip system / controlled fields
			if (fieldName.equals("id") || fieldName.equals("approvedById") || fieldName.equals("approvedDate")
					|| fieldName.equals("userId") || fieldName.equals("date")) {
				continue;
			}

			field.set(existingEntity, newValue);
		}

		// ================= SET APPROVED BY (CONTROLLED) =================
		UsersEntity approvedByUser = usersrepository.findById(approvedByUserId)
				.orElseThrow(() -> new RuntimeException("ApprovedBy user not found"));

		existingEntity.setApprovedById(approvedByUser);

		// ================= SET APPROVED DATE (ALWAYS, ASIA/KOLKATA) =================
		ZonedDateTime indianTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).withNano(0);

		existingEntity.setApprovedDate(indianTime.toLocalDateTime());

		// ================= BUSINESS LOGIC (ONLY ON FIRST APPROVAL) =================
		if ("APPROVED".equalsIgnoreCase(newStatus) && !"APPROVED".equalsIgnoreCase(oldStatus)) {

			// 🔥 wallet credit logic (execute once only)
		}

		// ================= SAVE =================
		wallettopuprequestrepository.save(existingEntity);

		return "Updated Successfully";
	}

//    @Override
//    public String updateWalletTopupRequest(WalletTopupRequestEntity wallet_topup_requestEntity, String token) throws Exception {
//        Authorization.authorizeBranch(token);
//        WalletTopupRequestEntity existingEntity = wallettopuprequestrepository.findById(wallet_topup_requestEntity.getId())
//                .orElseThrow(() -> new RuntimeException("WalletTopupRequest not found"));
//
//        // Update non-foreign fields using reflection
//        for (Field field : WalletTopupRequestEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//            Object value = field.get(wallet_topup_requestEntity);
//            if (value != null && !field.getName().endsWith("Id")) {
//                field.set(existingEntity, value);
//            }
//        }
//
//        // Handle user_id foreign key
//        if (wallet_topup_requestEntity.getUserId() != null && wallet_topup_requestEntity.getUserId().getId() != null) {
//            existingEntity.setUserId(
//                fetchReferenceById(wallet_topup_requestEntity.getUserId(), usersrepository, "Users not found")
//            );
//        }
//
//        // Handle approved_by_id foreign key
//        if (wallet_topup_requestEntity.getApprovedById() != null && wallet_topup_requestEntity.getApprovedById().getId() != null) {
//            existingEntity.setApprovedById(
//                fetchReferenceById(wallet_topup_requestEntity.getApprovedById(), usersrepository, "Users not found")
//            );
//        }
//
//        wallettopuprequestrepository.save(existingEntity);
//        return "Updated Successfully";
//    }

	@Override
	public String deleteWalletTopupRequest(Integer id, String token) throws Exception {
		Authorization.authorizeBranch(token);
		if (!wallettopuprequestrepository.existsById(id)) {
			throw new RuntimeException("WalletTopupRequest not found");
		}
		wallettopuprequestrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleWalletTopupRequest(List<WalletTopupRequestEntity> wallet_topup_requestEntitys,
			String token) throws Exception {
		Authorization.authorizeBranch(token);
		List<WalletTopupRequestEntity> entitiesToSave = new ArrayList<>();

		for (WalletTopupRequestEntity entity : wallet_topup_requestEntitys) {
			WalletTopupRequestEntity newEntity = new WalletTopupRequestEntity();

			// Copy non-foreign fields using reflection
			for (Field field : WalletTopupRequestEntity.class.getDeclaredFields()) {
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

			// Handle approved_by_id foreign key
			if (entity.getApprovedById() != null && entity.getApprovedById().getId() != null) {
				newEntity.setApprovedById(
						fetchReferenceById(entity.getApprovedById(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		wallettopuprequestrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<WalletTopupRequestEntity> getWalletTopupRequestByApproveddateBetween(LocalDate fromDate,
			LocalDate toDate, String token) throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return wallettopuprequestrepository.findByApprovedDateBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getWalletTopupRequestByApproveddateBetweenPagination(LocalDate fromDate,
			LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeBranch(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = wallettopuprequestrepository.findByApprovedDateBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<WalletTopupRequestEntity> getWalletTopupRequestByApproveddate(LocalDate approveddate, String token)
			throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime dateTime = approveddate.atStartOfDay();
		return wallettopuprequestrepository.findByApprovedDate(dateTime);
	}

	@Override
	public List<WalletTopupRequestEntity> getWalletTopupRequestByDateBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return wallettopuprequestrepository.findByDateBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getWalletTopupRequestByDateBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeBranch(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = wallettopuprequestrepository.findByDateBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<WalletTopupRequestEntity> getWalletTopupRequestByDate(LocalDate date, String token) throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime dateTime = date.atStartOfDay();
		return wallettopuprequestrepository.findByDate(dateTime);
	}

	@Override
	public List<WalletTopupRequestEntity> getWalletTopupRequestByTransdateBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return wallettopuprequestrepository.findByTransDateBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getWalletTopupRequestByTransdateBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeBranch(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = wallettopuprequestrepository.findByTransDateBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<WalletTopupRequestEntity> getWalletTopupRequestByTransdate(LocalDate transdate, String token)
			throws Exception {
		Authorization.authorizeBranch(token);
		LocalDateTime dateTime = transdate.atStartOfDay();
		return wallettopuprequestrepository.findByTransDate(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<WalletTopupRequestEntity> page = wallettopuprequestrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("WalletTopupRequests");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Amount");
			header.createCell(2).setCellValue("Approved_date");
			header.createCell(3).setCellValue("Bank_name");
			header.createCell(4).setCellValue("Date");
			header.createCell(5).setCellValue("Mode");
			header.createCell(6).setCellValue("Order_id");
			header.createCell(7).setCellValue("Reason");
			header.createCell(8).setCellValue("Recorn");
			header.createCell(9).setCellValue("Remark");
			header.createCell(10).setCellValue("Status");
			header.createCell(11).setCellValue("Time");
			header.createCell(12).setCellValue("Trans_date");
			header.createCell(13).setCellValue("Utr");
			header.createCell(14).setCellValue("Approved_by_id");
			header.createCell(15).setCellValue("User_id");

			int rowNum = 1;
			for (WalletTopupRequestEntity wallet_topup_requestEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(
						wallet_topup_requestEntity.getId() != null ? wallet_topup_requestEntity.getId() : 0);
				row.createCell(1)
						.setCellValue(wallet_topup_requestEntity.getAmount() != null
								? wallet_topup_requestEntity.getAmount().doubleValue()
								: 0.0);
				LocalDateTime approvedDate = wallet_topup_requestEntity.getApprovedDate();
				String formattedApprovedDate = (approvedDate != null) ? approvedDate.format(dateTimeFormat) : "";
				row.createCell(2).setCellValue(formattedApprovedDate);
//				row.createCell(3)
//						.setCellValue(wallet_topup_requestEntity.getBankName() != null
//								? wallet_topup_requestEntity.getBankName()
//								: "N/A");
				LocalDateTime date = wallet_topup_requestEntity.getDate();
				String formattedDate = (date != null) ? date.format(dateTimeFormat) : "";
				row.createCell(4).setCellValue(formattedDate);
				row.createCell(5).setCellValue(
						wallet_topup_requestEntity.getMode() != null ? wallet_topup_requestEntity.getMode() : 0);
				row.createCell(6)
						.setCellValue(wallet_topup_requestEntity.getOrderId() != null
								? wallet_topup_requestEntity.getOrderId()
								: "N/A");
				row.createCell(7).setCellValue(
						wallet_topup_requestEntity.getReason() != null ? wallet_topup_requestEntity.getReason()
								: "N/A");
				row.createCell(8).setCellValue(
						wallet_topup_requestEntity.getRecorn() != null ? wallet_topup_requestEntity.getRecorn() : 0);
				row.createCell(9).setCellValue(
						wallet_topup_requestEntity.getRemark() != null ? wallet_topup_requestEntity.getRemark()
								: "N/A");
				row.createCell(10).setCellValue(
						wallet_topup_requestEntity.getStatus() != null ? wallet_topup_requestEntity.getStatus()
								: "N/A");
				row.createCell(11).setCellValue(
						wallet_topup_requestEntity.getTime() != null ? wallet_topup_requestEntity.getTime() : "N/A");
				LocalDateTime transDate = wallet_topup_requestEntity.getTransDate();
				String formattedTransDate = (transDate != null) ? transDate.format(dateTimeFormat) : "";
				row.createCell(12).setCellValue(formattedTransDate);
				row.createCell(13).setCellValue(
						wallet_topup_requestEntity.getUtr() != null ? wallet_topup_requestEntity.getUtr() : "N/A");
				row.createCell(14)
						.setCellValue(wallet_topup_requestEntity.getApprovedById() != null
								? wallet_topup_requestEntity.getApprovedById().toString()
								: "N/A");
				row.createCell(15)
						.setCellValue(wallet_topup_requestEntity.getUserId() != null
								? wallet_topup_requestEntity.getUserId().toString()
								: "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
