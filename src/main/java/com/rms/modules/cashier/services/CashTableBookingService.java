package com.rms.modules.cashier.services;

import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.entities.TableBookingEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.TableBookingRepository;
import com.rms.common.serviceImplement.TableBookingServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.UsersProfileRepository;
import com.rms.common.entities.UsersProfileEntity;

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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.math.BigDecimal;

@Service
@Qualifier("cashTableBookingService")
public class CashTableBookingService implements TableBookingServiceIMP {

	private final TableBookingRepository tablebookingrepository;
	private final DiningTablesRepository diningtablesrepository;
	private final UsersRepository usersrepository;
	private final CustomersRepository customersrepository;
	private final UsersProfileRepository usersProfileRepository;

	public CashTableBookingService(TableBookingRepository tablebookingrepository,
			DiningTablesRepository diningtablesrepository, UsersRepository usersrepository,
			CustomersRepository customersrepository, UsersProfileRepository usersProfileRepository) {
		this.tablebookingrepository = tablebookingrepository;
		this.diningtablesrepository = diningtablesrepository;
		this.usersrepository = usersrepository;
		this.customersrepository = customersrepository;
		this.usersProfileRepository = usersProfileRepository;
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

	@Override
	public List<TableBookingEntity> getAllRecordTableBooking(String token) throws Exception {
		Authorization.authorizeCashier(token);
		return tablebookingrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllTableBooking(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = tablebookingrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public TableBookingEntity getOneTableBooking(Long id, String token) throws Exception {
		Authorization.authorizeCashier(token);
		return tablebookingrepository.findById(id).orElseThrow(() -> new RuntimeException("TableBooking not found"));
	}

	@Override
	public String addTableBooking(TableBookingEntity table_bookingEntity, String token) throws Exception {

		// 🔐 AUTHORIZE CASHIER
		Authorization.authorizeCashier(token);
		System.out.println("AUTH ✔ Cashier Authorized");

		// 🔓 DECRYPT TOKEN & GET CASHIER ID
		tokenUtil.decryptAndStoreToken(token);
		Long cashierId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("Cashier ID from token: " + cashierId);

		// 👤 CHECK CASHIER EXISTENCE
		UsersEntity cashier = usersrepository.findById(cashierId)
				.orElseThrow(() -> new RuntimeException("Cashier not found"));

		// 🆕 CREATE NEW ENTITY
		TableBookingEntity newEntity = new TableBookingEntity();

		// 📋 COPY NON-FOREIGN FIELDS
		for (Field field : TableBookingEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(table_bookingEntity);

			// foreign keys skip (Id suffix)
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// 🍽️ HANDLE table_id
		if (table_bookingEntity.getTableId() != null && table_bookingEntity.getTableId().getId() != null) {
			DiningTablesEntity fetchedTable = fetchReferenceById(table_bookingEntity.getTableId(),
					diningtablesrepository, "Dining table not found");
			newEntity.setTableId(fetchedTable);
		} else {
			throw new RuntimeException("Table selection is mendatory");
		}

		// 👤 SET CASHIER AS users_id (FROM TOKEN)
		newEntity.setUsersId(cashier);

		// 🧑 HANDLE customer_id (optional — walk-in bookings by cashier/captain may not have a customer)
		if (table_bookingEntity.getCustomerId() != null && table_bookingEntity.getCustomerId().getId() != null) {

			newEntity.setCustomerId(
					fetchReferenceById(table_bookingEntity.getCustomerId(), customersrepository, "Customer not found"));
		}

		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime bookingAt = resolveBookingDateTime(newEntity, now);
		UsersProfileEntity profile = getProfileForTable(newEntity.getTableId());
		int bufferMinutes = parseMinutes(profile != null ? profile.getBookingBufferMinutes() : null, 0);
		int graceMinutes = parseMinutes(profile != null ? profile.getBookingGraceMinutes() : null, 15);

		boolean requestedReservation = "RESERVED".equalsIgnoreCase(table_bookingEntity.getStatus());
		boolean futureReservation = bookingAt.isAfter(now.plusMinutes(bufferMinutes));
		boolean isReservation = requestedReservation || futureReservation;

		// Prevent conflicting reservations
		if (newEntity.getTableId() != null && newEntity.getTableId().getId() != null) {
			List<TableBookingEntity> sameDay = tablebookingrepository
					.findByTableId_IdAndBookingDate(newEntity.getTableId().getId(), newEntity.getBookingDate());
			LocalDateTime windowStart = bookingAt.minusMinutes(bufferMinutes);
			LocalDateTime windowEnd = bookingAt.plusMinutes(graceMinutes);
			for (TableBookingEntity existing : sameDay) {
				if (existing.getId() == null) continue;
				String status = existing.getStatus() != null ? existing.getStatus().toUpperCase() : "";
				if (Arrays.asList("CANCELLED", "NO_SHOW", "COMPLETED").contains(status)) continue;
				LocalDateTime existingAt = resolveBookingDateTime(existing, now);
				LocalDateTime existingStart = existingAt.minusMinutes(bufferMinutes);
				LocalDateTime existingEnd = existingAt.plusMinutes(graceMinutes);
				boolean overlap = windowStart.isBefore(existingEnd) && windowEnd.isAfter(existingStart);
				if (overlap && (isReservation || existingAt.isAfter(now.minusMinutes(graceMinutes)))) {
					throw new RuntimeException("Table is already reserved for this time.");
				}
			}
		}

		// Concurrent booking protection for immediate seating (status=1 or null required)
		if (!isReservation && newEntity.getTableId() != null) {
			DiningTablesEntity fetchedTable = newEntity.getTableId();
			if (fetchedTable.getStatus() != null && fetchedTable.getStatus() != 1) {
				throw new RuntimeException("Table is not available. It may already be occupied or reserved.");
			}
		}

		// Set booking status/payment defaults based on config
		if (isReservation) {
			newEntity.setStatus("RESERVED");
		} else if (newEntity.getStatus() == null) {
			newEntity.setStatus("CONFIRMED");
		}

		boolean paymentRequired = profile != null && Boolean.TRUE.equals(profile.getBookingPaymentRequired());
		BigDecimal requiredAmount = profile != null ? profile.getBookingPaymentAmount() : null;
		if (paymentRequired) {
			if (newEntity.getPaymentStatus() == null) newEntity.setPaymentStatus("PENDING");
			if (newEntity.getAmount() == null && requiredAmount != null) {
				newEntity.setAmount(requiredAmount);
			}
		} else if (newEntity.getPaymentStatus() == null) {
			newEntity.setPaymentStatus("NOT_REQUIRED");
		}

		// 💾 SAVE
		newEntity = tablebookingrepository.save(newEntity);

		if (newEntity.getTableId() != null) {
			DiningTablesEntity diningTable = newEntity.getTableId();
			if (isReservation) {
				LocalDateTime holdFrom = bookingAt.minusMinutes(bufferMinutes);
				if (!now.isBefore(holdFrom) && (diningTable.getStatus() == null || diningTable.getStatus() == 1)) {
					diningTable.setStatus(3);
					diningTable.setUpdatedAt(now);
					diningtablesrepository.save(diningTable);
				}
			} else {
				diningTable.setStatus(2);
				diningTable.setUpdatedAt(now);
				diningtablesrepository.save(diningTable);
			}
		}

		return String.valueOf(newEntity.getId());
	}

	private LocalDateTime resolveBookingDateTime(TableBookingEntity booking, LocalDateTime now) {
		LocalDate date = booking.getBookingDate() != null ? booking.getBookingDate() : now.toLocalDate();
		LocalTime time = booking.getBookingTime() != null
				? booking.getBookingTime().withSecond(0).withNano(0)
				: now.toLocalTime().withSecond(0).withNano(0);
		booking.setBookingDate(date);
		booking.setBookingTime(time);
		return LocalDateTime.of(date, time);
	}

	private int parseMinutes(String value, int fallback) {
		if (value == null || value.isBlank()) return fallback;
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException e) {
			return fallback;
		}
	}

	private UsersProfileEntity getProfileForTable(DiningTablesEntity table) {
		if (table == null || table.getRestaurantId() == null || table.getRestaurantId().getId() == null) return null;
		return usersProfileRepository.findFirstByRestaurantId_id(table.getRestaurantId().getId());
	}

	@Override
	public String updateTableBooking(TableBookingEntity table_bookingEntity, String token) throws Exception {
		Authorization.authorizeCashier(token);
		TableBookingEntity existingEntity = tablebookingrepository.findById(table_bookingEntity.getId())
				.orElseThrow(() -> new RuntimeException("TableBooking not found"));

		// Update non-foreign fields using reflection
		for (Field field : TableBookingEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(table_bookingEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// Handle table_id foreign key
		if (table_bookingEntity.getTableId() != null && table_bookingEntity.getTableId().getId() != null) {
			existingEntity.setTableId(fetchReferenceById(table_bookingEntity.getTableId(), diningtablesrepository,
					"Dining_tables not found"));
		}

		// Handle user_id foreign key
		if (table_bookingEntity.getUsersId() != null && table_bookingEntity.getUsersId().getId() != null) {
			existingEntity.setUsersId(
					fetchReferenceById(table_bookingEntity.getUsersId(), usersrepository, "Users not found"));
		}

		// Handle customer_id foreign key
		if (table_bookingEntity.getCustomerId() != null && table_bookingEntity.getCustomerId().getId() != null) {
			existingEntity.setCustomerId(fetchReferenceById(table_bookingEntity.getCustomerId(), customersrepository,
					"Customers not found"));
		}

		tablebookingrepository.save(existingEntity);

		releaseTableIfBookingClosed(existingEntity);

		return "Updated Successfully";
	}

	private void releaseTableIfBookingClosed(TableBookingEntity booking) {
		if (booking == null || booking.getTableId() == null) return;

		String status = booking.getStatus();
		String paymentStatus = booking.getPaymentStatus();

		boolean closed = "COMPLETED".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status);
		boolean paid = "SUCCESS".equalsIgnoreCase(paymentStatus) || "PAID".equalsIgnoreCase(paymentStatus);
		if (!closed && !paid) return;

		DiningTablesEntity diningTable = booking.getTableId();
		if (diningTable.getStatus() == null || diningTable.getStatus() != 1) {
			diningTable.setStatus(1);
			diningTable.setUpdatedAt(LocalDateTime.now());
			diningtablesrepository.save(diningTable);
		}
	}

	@Override
	public String deleteTableBooking(Long id, String token) throws Exception {
		Authorization.authorizeCashier(token);
		TableBookingEntity booking = tablebookingrepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TableBooking not found"));

		if (booking.getTableId() != null) {
			DiningTablesEntity diningTable = booking.getTableId();
			diningTable.setStatus(1);
			diningTable.setUpdatedAt(LocalDateTime.now());
			diningtablesrepository.save(diningTable);
		}

		tablebookingrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleTableBooking(List<TableBookingEntity> table_bookingEntitys, String token)
			throws Exception {
		Authorization.authorizeCashier(token);
		List<TableBookingEntity> entitiesToSave = new ArrayList<>();

		for (TableBookingEntity entity : table_bookingEntitys) {
			TableBookingEntity newEntity = new TableBookingEntity();

			// Copy non-foreign fields using reflection
			for (Field field : TableBookingEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle table_id foreign key
			if (entity.getTableId() != null && entity.getTableId().getId() != null) {
				newEntity.setTableId(
						fetchReferenceById(entity.getTableId(), diningtablesrepository, "Dining_tables not found"));
			}

			// Handle user_id foreign key
			if (entity.getUsersId() != null && entity.getUsersId().getId() != null) {
				newEntity.setUsersId(fetchReferenceById(entity.getUsersId(), usersrepository, "Users not found"));
			}

			// Handle customer_id foreign key
			if (entity.getCustomerId() != null && entity.getCustomerId().getId() != null) {
				newEntity.setCustomerId(
						fetchReferenceById(entity.getCustomerId(), customersrepository, "Customers not found"));
			}

			entitiesToSave.add(newEntity);
		}

		tablebookingrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<TableBookingEntity> getTableBookingByBookingdateBetween(LocalDate fromDate, LocalDate toDate,
			String token) throws Exception {
		Authorization.authorizeCashier(token);
		return tablebookingrepository.findByBookingDateBetween(fromDate, toDate);
	}

	@Override
	public Map<String, Object> getTableBookingByBookingdateBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCashier(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = tablebookingrepository.findByBookingDateBetween(fromDate, toDate, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<TableBookingEntity> getTableBookingByBookingdate(LocalDate bookingdate, String token) throws Exception {
		Authorization.authorizeCashier(token);
		return tablebookingrepository.findByBookingDate(bookingdate);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<TableBookingEntity> page = tablebookingrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("TableBookings");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Amount");
			header.createCell(2).setCellValue("Booking_date");
			header.createCell(3).setCellValue("Booking_time");
			header.createCell(4).setCellValue("Payment_status");
			header.createCell(5).setCellValue("Status");
			header.createCell(6).setCellValue("Customer_id");
			header.createCell(7).setCellValue("Table_id");
			header.createCell(8).setCellValue("User_id");

			int rowNum = 1;
			for (TableBookingEntity table_bookingEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(table_bookingEntity.getId() != null ? table_bookingEntity.getId() : 0);
				row.createCell(1).setCellValue(
						table_bookingEntity.getAmount() != null ? table_bookingEntity.getAmount().doubleValue() : 0.0);
				LocalDate bookingDate = table_bookingEntity.getBookingDate();
				String formattedBookingDate = (bookingDate != null) ? bookingDate.format(dateFormat) : "";
				row.createCell(2).setCellValue(formattedBookingDate);
				LocalTime bookingTime = table_bookingEntity.getBookingTime();
				String formattedBookingTime = (bookingTime != null) ? bookingTime.format(timeFormat) : "";
				row.createCell(3).setCellValue(formattedBookingTime);
				row.createCell(4).setCellValue(
						table_bookingEntity.getPaymentStatus() != null ? table_bookingEntity.getPaymentStatus()
								: "N/A");
				row.createCell(5).setCellValue(
						table_bookingEntity.getStatus() != null ? table_bookingEntity.getStatus() : "N/A");
				row.createCell(6)
						.setCellValue(table_bookingEntity.getCustomerId() != null
								? table_bookingEntity.getCustomerId().toString()
								: "N/A");
				row.createCell(7).setCellValue(
						table_bookingEntity.getTableId() != null ? table_bookingEntity.getTableId().toString() : "N/A");
				row.createCell(8).setCellValue(
						table_bookingEntity.getUsersId() != null ? table_bookingEntity.getUsersId().toString() : "N/A");

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
