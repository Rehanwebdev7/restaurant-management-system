package com.rms.modules.customer.services;

import com.rms.common.entities.CustomerDeliveryAddressesEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.repositories.CustomerDeliveryAddressesRepository;
import com.rms.common.serviceImplement.CustomerDeliveryAddressesServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.PincodesRepository;

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
@Qualifier("custCustomerDeliveryAddressesService")
public class CustCustomerDeliveryAddressesService implements CustomerDeliveryAddressesServiceIMP {

	private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
	private final CustomersRepository customersrepository;
	private final PincodesRepository pincodesrepository;

	public CustCustomerDeliveryAddressesService(CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository,
			CustomersRepository customersrepository, PincodesRepository pincodesrepository) {
		this.customerdeliveryaddressesrepository = customerdeliveryaddressesrepository;
		this.customersrepository = customersrepository;
		this.pincodesrepository = pincodesrepository;
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

	public Map<String, Object> getByCustomerId(String token) throws Exception {

		Authorization.authorizeCustomer(token);

		// 🔓 DECRYPT TOKEN & GET CUSTOMER ID
		System.out.println("Decrypting token...");
		tokenUtil.decryptAndStoreToken(token);
		System.out.println("Token has been decrypted successfully");

		Long customerId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("Customer ID extracted from token: " + customerId);

		// 🟢 FETCH DEFAULT ADDRESS (SAFE WAY)
		List<CustomerDeliveryAddressesEntity> defaultAddresses = customerdeliveryaddressesrepository
				.findByCustomerId_IdAndIsDefaultAndIsActiveTrue(customerId, true);

		CustomerDeliveryAddressesEntity prior = null;
		if (defaultAddresses != null && !defaultAddresses.isEmpty()) {
			prior = defaultAddresses.get(0); // ✅ SAFE even if multiple records
		}

		// 🟢 FETCH NON-DEFAULT ADDRESSES
		List<CustomerDeliveryAddressesEntity> otherAddresses = customerdeliveryaddressesrepository
				.findByCustomerId_IdAndIsDefaultAndIsActiveTrue(customerId, false);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("priorAddress", prior);
		response.put("otherAddresses", otherAddresses);

		return response;
	}

	@Override
	public List<CustomerDeliveryAddressesEntity> getAllRecordCustomerDeliveryAddresses(String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return customerdeliveryaddressesrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllCustomerDeliveryAddresses(Integer pageNumber, Integer pageSize, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = customerdeliveryaddressesrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public CustomerDeliveryAddressesEntity getOneCustomerDeliveryAddresses(Long id, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return customerdeliveryaddressesrepository.findById(id)
				.orElseThrow(() -> new RuntimeException("CustomerDeliveryAddresses not found"));
	}

	@Override
	public String addCustomerDeliveryAddresses(CustomerDeliveryAddressesEntity customer_delivery_addressesEntity,
			String token) throws Exception {

		System.out.println("====== addCustomerDeliveryAddresses() START ======");

		// 🔐 AUTHORIZE
		System.out.println("Authorizing customer...");
		Authorization.authorizeCustomer(token);
		System.out.println("Authorization SUCCESS");

		// 🔓 DECRYPT TOKEN & GET CUSTOMER ID
		System.out.println("Decrypting token...");
		tokenUtil.decryptAndStoreToken(token);
		System.out.println("Token has been decrypted successfully");

		Long customerId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("Customer ID extracted from token: " + customerId);

		// ================= CUSTOMER EXISTENCE CHECK =================
		System.out.println("Checking if customer exists in DB");

		CustomersEntity customer = customersrepository.findById(customerId).orElseThrow(() -> {
			System.out.println("Customer not found for ID: " + customerId);
			return new RuntimeException("Customer not found");
		});

		System.out.println("Customer found: ID = " + customer.getId());

		// ================= UPDATE EXISTING ADDRESSES =================
		System.out.println("Fetching existing delivery addresses for customer");

		List<CustomerDeliveryAddressesEntity> existingAddresses = customerdeliveryaddressesrepository
				.findByCustomerId_IdAndIsActiveTrue(customerId);

		if (existingAddresses != null && !existingAddresses.isEmpty()) {

			System.out.println("Existing addresses found: " + existingAddresses.size());
			System.out.println("Setting isDefault = false for all existing addresses");

			for (CustomerDeliveryAddressesEntity address : existingAddresses) {
				address.setIsDefault(false);
			}

			customerdeliveryaddressesrepository.saveAll(existingAddresses);
			System.out.println("All existing addresses updated successfully");

		} else {
			System.out.println("No existing addresses found for customer");
		}

		// ================= CREATE NEW ENTITY =================
		CustomerDeliveryAddressesEntity newEntity = new CustomerDeliveryAddressesEntity();
		System.out.println("Creating new CustomerDeliveryAddressesEntity");

		// Copy non-foreign fields using reflection
		for (Field field : CustomerDeliveryAddressesEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(customer_delivery_addressesEntity);

			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
				System.out.println("Copied field: " + field.getName() + " = " + value);
			}
		}

		// ================= SET CUSTOMER FROM TOKEN =================
		newEntity.setCustomerId(customer);
		System.out.println("Customer ID set from token");

		// ================= HANDLE PINCODE FK =================
		if (customer_delivery_addressesEntity.getPincodeId() != null
				&& customer_delivery_addressesEntity.getPincodeId().getId() != null) {

			System.out
					.println("Fetching pincode reference: " + customer_delivery_addressesEntity.getPincodeId().getId());

			newEntity.setPincodeId(fetchReferenceById(customer_delivery_addressesEntity.getPincodeId(),
					pincodesrepository, "Pincode not found"));

			System.out.println("Pincode reference set successfully");
		}

		// ================= SET DEFAULT ADDRESS =================
		newEntity.setIsDefault(true);
		System.out.println("New address marked as DEFAULT");

		// ================= SAVE =================
		System.out.println("Saving new delivery address");
		customerdeliveryaddressesrepository.save(newEntity);
		System.out.println("New delivery address saved successfully");

		System.out.println("====== addCustomerDeliveryAddresses() END ======");

		return "Added Successfully";
	}

	@Override
	public String updateCustomerDeliveryAddresses(CustomerDeliveryAddressesEntity customer_delivery_addressesEntity,
			String token) throws Exception {

		System.out.println("====== updateCustomerDeliveryAddresses() START ======");

		// 🔐 AUTHORIZE
		System.out.println("Authorizing customer...");
		Authorization.authorizeCustomer(token);
		System.out.println("Authorization SUCCESS");

		// 🔓 DECRYPT TOKEN & GET CUSTOMER ID
		System.out.println("Decrypting token...");
		tokenUtil.decryptAndStoreToken(token);
		System.out.println("Token has been decrypted successfully");

		Long customerId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("Customer ID extracted from token: " + customerId);

		// ================= CUSTOMER EXISTENCE CHECK =================
		System.out.println("Checking if customer exists in DB");

		CustomersEntity customer = customersrepository.findById(customerId).orElseThrow(() -> {
			System.out.println("Customer not found for ID: " + customerId);
			return new RuntimeException("Customer not found");
		});

		System.out.println("Customer found: ID = " + customer.getId());

		// ================= FETCH EXISTING ADDRESS =================
		System.out.println("Fetching delivery address to update");

		CustomerDeliveryAddressesEntity existingEntity = customerdeliveryaddressesrepository
				.findById(customer_delivery_addressesEntity.getId()).orElseThrow(() -> {
					System.out.println("CustomerDeliveryAddress not found");
					return new RuntimeException("CustomerDeliveryAddresses not found");
				});

		System.out.println("Existing address found with ID: " + existingEntity.getId());

		// ================= OWNERSHIP CHECK =================
		if (existingEntity.getCustomerId() == null || !existingEntity.getCustomerId().getId().equals(customerId)) {

			System.out.println("Address does not belong to logged-in customer");
			throw new SecurityException("Unauthorized address update attempt");
		}

		System.out.println("Ownership verified");

		// ================= HANDLE DEFAULT LOGIC =================
		if (Boolean.TRUE.equals(customer_delivery_addressesEntity.getIsDefault())) {

			System.out.println("Payload requests DEFAULT address");

			List<CustomerDeliveryAddressesEntity> existingAddresses = customerdeliveryaddressesrepository
					.findByCustomerId_IdAndIsActiveTrue(customerId);

			if (existingAddresses != null && !existingAddresses.isEmpty()) {

				System.out.println("Resetting isDefault for all customer addresses");

				for (CustomerDeliveryAddressesEntity address : existingAddresses) {

					if (!address.getId().equals(existingEntity.getId())) {
						address.setIsDefault(false);
					}
				}

				customerdeliveryaddressesrepository.saveAll(existingAddresses);
				System.out.println("All other addresses marked as NON-DEFAULT");
			}

			existingEntity.setIsDefault(true);
			System.out.println("Current address marked as DEFAULT");
		}

		// ================= UPDATE NON-FK FIELDS =================
		System.out.println("Updating non-foreign fields");

		for (Field field : CustomerDeliveryAddressesEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(customer_delivery_addressesEntity);

			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
				System.out.println("Updated field: " + field.getName() + " = " + value);
			}
		}

		// ================= SET CUSTOMER FROM TOKEN =================
		existingEntity.setCustomerId(customer);
		System.out.println("Customer ID re-set from token");

		// ================= HANDLE PINCODE FK =================
		if (customer_delivery_addressesEntity.getPincodeId() != null
				&& customer_delivery_addressesEntity.getPincodeId().getId() != null) {

			System.out
					.println("Updating pincode reference: " + customer_delivery_addressesEntity.getPincodeId().getId());

			existingEntity.setPincodeId(fetchReferenceById(customer_delivery_addressesEntity.getPincodeId(),
					pincodesrepository, "Pincode not found"));

			System.out.println("Pincode updated successfully");
		}

		// ================= SAVE =================
		System.out.println("Saving updated delivery address");
		customerdeliveryaddressesrepository.save(existingEntity);
		System.out.println("Delivery address updated successfully");

		System.out.println("====== updateCustomerDeliveryAddresses() END ======");

		return "Updated Successfully";
	}

	@Override
	public String deleteCustomerDeliveryAddresses(Long id, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		if (!customerdeliveryaddressesrepository.existsById(id)) {
			throw new RuntimeException("CustomerDeliveryAddresses not found");
		}
		customerdeliveryaddressesrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleCustomerDeliveryAddresses(
			List<CustomerDeliveryAddressesEntity> customer_delivery_addressesEntitys, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		List<CustomerDeliveryAddressesEntity> entitiesToSave = new ArrayList<>();

		for (CustomerDeliveryAddressesEntity entity : customer_delivery_addressesEntitys) {
			CustomerDeliveryAddressesEntity newEntity = new CustomerDeliveryAddressesEntity();

			// Copy non-foreign fields using reflection
			for (Field field : CustomerDeliveryAddressesEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle customer_id foreign key
			if (entity.getCustomerId() != null && entity.getCustomerId().getId() != null) {
				newEntity.setCustomerId(
						fetchReferenceById(entity.getCustomerId(), customersrepository, "Customers not found"));
			}

			// Handle pincode_id foreign key
			if (entity.getPincodeId() != null && entity.getPincodeId().getId() != null) {
				newEntity.setPincodeId(
						fetchReferenceById(entity.getPincodeId(), pincodesrepository, "Pincodes not found"));
			}

			entitiesToSave.add(newEntity);
		}

		customerdeliveryaddressesrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<CustomerDeliveryAddressesEntity> getCustomerDeliveryAddressesByCreatedatBetween(LocalDate fromDate,
			LocalDate toDate, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return customerdeliveryaddressesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getCustomerDeliveryAddressesByCreatedatBetweenPagination(LocalDate fromDate,
			LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = customerdeliveryaddressesrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<CustomerDeliveryAddressesEntity> getCustomerDeliveryAddressesByCreatedat(LocalDate createdat,
			String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return customerdeliveryaddressesrepository.findByCreatedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<CustomerDeliveryAddressesEntity> page = customerdeliveryaddressesrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("CustomerDeliveryAddressess");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Customer_id");
			header.createCell(2).setCellValue("Address_type");
			header.createCell(3).setCellValue("Address_line1");
			header.createCell(4).setCellValue("Address_line2");
			header.createCell(5).setCellValue("Pincode_id");
			header.createCell(6).setCellValue("Latitude");
			header.createCell(7).setCellValue("Longitude");
			header.createCell(8).setCellValue("Landmark");
			header.createCell(9).setCellValue("Delivery_instructions");
			header.createCell(10).setCellValue("Is_default");
			header.createCell(11).setCellValue("Is_active");
			header.createCell(12).setCellValue("Created_at");

			int rowNum = 1;
			for (CustomerDeliveryAddressesEntity customer_delivery_addressesEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0)
						.setCellValue(customer_delivery_addressesEntity.getId() != null
								? customer_delivery_addressesEntity.getId()
								: 0);
				row.createCell(1)
						.setCellValue(customer_delivery_addressesEntity.getCustomerId() != null
								? customer_delivery_addressesEntity.getCustomerId().toString()
								: "N/A");
				row.createCell(2)
						.setCellValue(customer_delivery_addressesEntity.getAddressType() != null
								? customer_delivery_addressesEntity.getAddressType()
								: "N/A");
				row.createCell(3)
						.setCellValue(customer_delivery_addressesEntity.getAddressLine1() != null
								? customer_delivery_addressesEntity.getAddressLine1()
								: "N/A");
				row.createCell(4)
						.setCellValue(customer_delivery_addressesEntity.getAddressLine2() != null
								? customer_delivery_addressesEntity.getAddressLine2()
								: "N/A");
				row.createCell(5)
						.setCellValue(customer_delivery_addressesEntity.getPincodeId() != null
								? customer_delivery_addressesEntity.getPincodeId().toString()
								: "N/A");
				row.createCell(6)
						.setCellValue(customer_delivery_addressesEntity.getLatitude() != null
								? customer_delivery_addressesEntity.getLatitude().doubleValue()
								: 0.0);
				row.createCell(7)
						.setCellValue(customer_delivery_addressesEntity.getLongitude() != null
								? customer_delivery_addressesEntity.getLongitude().doubleValue()
								: 0.0);
				row.createCell(8)
						.setCellValue(customer_delivery_addressesEntity.getLandmark() != null
								? customer_delivery_addressesEntity.getLandmark()
								: "N/A");
				row.createCell(9)
						.setCellValue(customer_delivery_addressesEntity.getDeliveryInstructions() != null
								? customer_delivery_addressesEntity.getDeliveryInstructions()
								: "N/A");
				row.createCell(10).setCellValue(customer_delivery_addressesEntity.getIsDefault() != null
						&& customer_delivery_addressesEntity.getIsDefault() ? "Active" : "Inactive");
				row.createCell(11).setCellValue(customer_delivery_addressesEntity.getIsActive() != null
						&& customer_delivery_addressesEntity.getIsActive() ? "Active" : "Inactive");
				LocalDateTime createdAt = customer_delivery_addressesEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(12).setCellValue(formattedCreatedAt);

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}
}
