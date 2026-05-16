package com.rms.modules.cashier.services;

import com.rms.common.entities.CustomerDeliveryAddressesEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.CustomerDeliveryAddressesRepository;
import com.rms.common.serviceImplement.CustomerDeliveryAddressesServiceIMP;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.PincodesRepository;
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
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;

@Service
@Qualifier("cashCustomerDeliveryAddressesService")
public class CashCustomerDeliveryAddressesService implements CustomerDeliveryAddressesServiceIMP {

    private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
    private final CustomersRepository customersrepository;
    private final PincodesRepository pincodesrepository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private TokenUtil tokenUtil;
    
    @Autowired
    private CustomersRepository customersRepository;
    
    @Autowired
    private CustomerDeliveryAddressesRepository customerDeliveryAddressesRepository;

    public CashCustomerDeliveryAddressesService(CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository, CustomersRepository customersrepository, PincodesRepository pincodesrepository) {
        this.customerdeliveryaddressesrepository = customerdeliveryaddressesrepository;
        this.customersrepository = customersrepository;
        this.pincodesrepository = pincodesrepository;
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
    
    @Transactional(readOnly = true)
    public List<CustomerDeliveryAddressesEntity> getAddressesByCustomerId(
            String token,
            Long customerId
    ) throws Exception {

        // 🔐 CASHIER AUTH
        Authorization.authorizeCashier(token);

        // ================= VALIDATION =================
        if (customerId == null) {
            throw new RuntimeException("CustomerId is required");
        }

        // 🔓 TOKEN DATA
        tokenUtil.decryptAndStoreToken(token);
        Integer cashierId = tokenUtil.getCurrentUserId();
        tokenUtil.clearTokenData();

        // ================= CASHIER =================
        UsersEntity cashier = usersRepository.findById(cashierId.longValue())
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

        // ================= BRANCH CHECK (optional but safe) =================
        UsersEntity branch = cashier.getBranchId();
        if (branch == null) {
            throw new RuntimeException("Branch not mapped with cashier");
        }

        // ================= CUSTOMER =================
        CustomersEntity customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // ================= FETCH ADDRESSES =================
        List<CustomerDeliveryAddressesEntity> addresses =
                customerDeliveryAddressesRepository
                        .findByCustomerId_IdAndIsActiveTrue(customer.getId());

        if (addresses.isEmpty()) {
            throw new RuntimeException("No delivery addresses found for this customer");
        }

        return addresses;
    }


    @Override
    public List<CustomerDeliveryAddressesEntity> getAllRecordCustomerDeliveryAddresses(String token) throws Exception {
        Authorization.authorizeCashier(token);
        return customerdeliveryaddressesrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllCustomerDeliveryAddresses(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
        return customerdeliveryaddressesrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CustomerDeliveryAddresses not found"));
    }

    @Override
    public String addCustomerDeliveryAddresses(
            CustomerDeliveryAddressesEntity customer_delivery_addressesEntity,
            String token) throws Exception {

        System.out.println("====== addCustomerDeliveryAddresses(CASHIER) START ======");

        // 🔐 AUTHORIZE CASHIER
        Authorization.authorizeCashier(token);
        System.out.println("Cashier authorized");

        // ================= CUSTOMER FROM PAYLOAD =================
        if (customer_delivery_addressesEntity.getCustomerId() == null
                || customer_delivery_addressesEntity.getCustomerId().getId() == null) {
            throw new RuntimeException("Customer ID is required in payload");
        }

        Long customerId = customer_delivery_addressesEntity.getCustomerId().getId();
        System.out.println("Customer ID from payload: " + customerId);

        CustomersEntity customer = customersrepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // ================= UPDATE EXISTING ADDRESSES =================
        System.out.println("Fetching existing addresses for customer");

        List<CustomerDeliveryAddressesEntity> existingAddresses =
                customerdeliveryaddressesrepository.findByCustomerId_IdAndIsActiveTrue(customerId);

        if (existingAddresses != null && !existingAddresses.isEmpty()) {

            System.out.println("Resetting isDefault for existing addresses");

            for (CustomerDeliveryAddressesEntity address : existingAddresses) {
                address.setIsDefault(false);
            }

            customerdeliveryaddressesrepository.saveAll(existingAddresses);
            System.out.println("Existing addresses updated");
        }

        // ================= CREATE NEW ENTITY =================
        CustomerDeliveryAddressesEntity newEntity = new CustomerDeliveryAddressesEntity();

        for (Field field : CustomerDeliveryAddressesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(customer_delivery_addressesEntity);

            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
                System.out.println("Copied field: " + field.getName());
            }
        }

        // ================= SET CUSTOMER =================
        newEntity.setCustomerId(customer);

        // ================= HANDLE PINCODE FK =================
        if (customer_delivery_addressesEntity.getPincodeId() != null
                && customer_delivery_addressesEntity.getPincodeId().getId() != null) {

            newEntity.setPincodeId(
                    fetchReferenceById(
                            customer_delivery_addressesEntity.getPincodeId(),
                            pincodesrepository,
                            "Pincode not found"
                    )
            );
        }

        // ================= SET DEFAULT =================
        newEntity.setIsDefault(true);
        System.out.println("New address marked as DEFAULT");

        // ================= SAVE =================
        customerdeliveryaddressesrepository.save(newEntity);

        System.out.println("====== addCustomerDeliveryAddresses(CASHIER) END ======");

        return "Added Successfully";
    }

//    @Override
//    public String updateCustomerDeliveryAddresses(
//            CustomerDeliveryAddressesEntity customer_delivery_addressesEntity,
//            String token) throws Exception {
//
//        System.out.println("====== updateCustomerDeliveryAddresses(CASHIER) START ======");
//
//        // 🔐 AUTHORIZE CASHIER
//        Authorization.authorizeCashier(token);
//        System.out.println("Cashier authorized");
//
//        // ================= FETCH EXISTING ADDRESS =================
//        CustomerDeliveryAddressesEntity existingEntity =
//                customerdeliveryaddressesrepository.findById(
//                        customer_delivery_addressesEntity.getId()
//                ).orElseThrow(() -> new RuntimeException("CustomerDeliveryAddresses not found"));
//
//        System.out.println("Existing address ID: " + existingEntity.getId());
//
//        // ================= CUSTOMER FROM PAYLOAD =================
//        if (customer_delivery_addressesEntity.getCustomerId() == null
//                || customer_delivery_addressesEntity.getCustomerId().getId() == null) {
//            throw new RuntimeException("Customer ID is required in payload");
//        }
//
//        Long customerId = customer_delivery_addressesEntity.getCustomerId().getId();
//        System.out.println("Customer ID from payload: " + customerId);
//
//        CustomersEntity customer = customersrepository.findById(customerId)
//                .orElseThrow(() -> new RuntimeException("Customer not found"));
//
//        // ================= HANDLE DEFAULT LOGIC =================
//        if (Boolean.TRUE.equals(customer_delivery_addressesEntity.getIsDefault())) {
//
//            System.out.println("Payload requests DEFAULT address");
//
//            List<CustomerDeliveryAddressesEntity> existingAddresses =
//                    customerdeliveryaddressesrepository.findByCustomerId_IdAndIsActiveTrue(customerId);
//
//            if (existingAddresses != null && !existingAddresses.isEmpty()) {
//
//                for (CustomerDeliveryAddressesEntity address : existingAddresses) {
//                    if (!address.getId().equals(existingEntity.getId())) {
//                        address.setIsDefault(false);
//                    }
//                }
//
//                customerdeliveryaddressesrepository.saveAll(existingAddresses);
//                System.out.println("Other addresses set to NON-DEFAULT");
//            }
//
//            existingEntity.setIsDefault(true);
//            System.out.println("Current address marked as DEFAULT");
//        }
//
//        // ================= UPDATE NON-FK FIELDS =================
//        for (Field field : CustomerDeliveryAddressesEntity.class.getDeclaredFields()) {
//            field.setAccessible(true);
//            Object value = field.get(customer_delivery_addressesEntity);
//
//            if (value != null && !field.getName().endsWith("Id")) {
//                field.set(existingEntity, value);
//                System.out.println("Updated field: " + field.getName());
//            }
//        }
//
//        // ================= SET CUSTOMER =================
//        existingEntity.setCustomerId(customer);
//
//        // ================= HANDLE PINCODE FK =================
//        if (customer_delivery_addressesEntity.getPincodeId() != null
//                && customer_delivery_addressesEntity.getPincodeId().getId() != null) {
//
//            existingEntity.setPincodeId(
//                    fetchReferenceById(
//                            customer_delivery_addressesEntity.getPincodeId(),
//                            pincodesrepository,
//                            "Pincode not found"
//                    )
//            );
//        }
//
//        // ================= SAVE =================
//        customerdeliveryaddressesrepository.save(existingEntity);
//
//        System.out.println("====== updateCustomerDeliveryAddresses(CASHIER) END ======");
//
//        return "Updated Successfully";
//    }
    
    @Override
    public String updateCustomerDeliveryAddresses(
            CustomerDeliveryAddressesEntity customer_delivery_addressesEntity,
            String token) throws Exception {

        System.out.println("====== updateCustomerDeliveryAddresses() START ======");

        // 🔐 AUTHORIZE (same)
        Authorization.authorizeCashier(token);

        // ================= GET CUSTOMER ID FROM PAYLOAD =================
        if (customer_delivery_addressesEntity.getCustomerId() == null ||
            customer_delivery_addressesEntity.getCustomerId().getId() == null) {

            throw new RuntimeException("CustomerId is required in payload");
        }

        Long customerId = customer_delivery_addressesEntity
                .getCustomerId()
                .getId();

        System.out.println("Customer ID from payload: " + customerId);

        // ================= CUSTOMER EXISTENCE CHECK =================
        CustomersEntity customer = customersrepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // ================= FETCH EXISTING ADDRESS =================
        CustomerDeliveryAddressesEntity existingEntity =
                customerdeliveryaddressesrepository
                        .findById(customer_delivery_addressesEntity.getId())
                        .orElseThrow(() -> new RuntimeException(
                                "CustomerDeliveryAddresses not found"));

        // ================= OWNERSHIP CHECK =================
        if (existingEntity.getCustomerId() == null ||
            !existingEntity.getCustomerId().getId().equals(customerId)) {

            throw new SecurityException("Unauthorized address update attempt");
        }

        // ================= HANDLE DEFAULT LOGIC =================
        if (Boolean.TRUE.equals(customer_delivery_addressesEntity.getIsDefault())) {

            List<CustomerDeliveryAddressesEntity> existingAddresses =
                    customerdeliveryaddressesrepository
                            .findByCustomerId_IdAndIsActiveTrue(customerId);

            for (CustomerDeliveryAddressesEntity address : existingAddresses) {
                if (!address.getId().equals(existingEntity.getId())) {
                    address.setIsDefault(false);
                }
            }

            customerdeliveryaddressesrepository.saveAll(existingAddresses);
            existingEntity.setIsDefault(true);
        }

        // ================= UPDATE NON-FK FIELDS =================
        for (Field field : CustomerDeliveryAddressesEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(customer_delivery_addressesEntity);

            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // ================= SET CUSTOMER FROM PAYLOAD =================
        existingEntity.setCustomerId(customer);

        // ================= HANDLE PINCODE FK =================
        if (customer_delivery_addressesEntity.getPincodeId() != null &&
            customer_delivery_addressesEntity.getPincodeId().getId() != null) {

            existingEntity.setPincodeId(
                    fetchReferenceById(
                            customer_delivery_addressesEntity.getPincodeId(),
                            pincodesrepository,
                            "Pincode not found"
                    )
            );
        }

        // ================= SAVE =================
        customerdeliveryaddressesrepository.save(existingEntity);

        System.out.println("====== updateCustomerDeliveryAddresses() END ======");

        return "Updated Successfully";
    }


    @Override
    public String deleteCustomerDeliveryAddresses(Long id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!customerdeliveryaddressesrepository.existsById(id)) {
            throw new RuntimeException("CustomerDeliveryAddresses not found");
        }
        customerdeliveryaddressesrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleCustomerDeliveryAddresses(List<CustomerDeliveryAddressesEntity> customer_delivery_addressesEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
                    fetchReferenceById(entity.getCustomerId(), customersrepository, "Customers not found")
                );
            }

            // Handle pincode_id foreign key
            if (entity.getPincodeId() != null && entity.getPincodeId().getId() != null) {
                newEntity.setPincodeId(
                    fetchReferenceById(entity.getPincodeId(), pincodesrepository, "Pincodes not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        customerdeliveryaddressesrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<CustomerDeliveryAddressesEntity> getCustomerDeliveryAddressesByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return customerdeliveryaddressesrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getCustomerDeliveryAddressesByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
    public List<CustomerDeliveryAddressesEntity> getCustomerDeliveryAddressesByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeCashier(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return customerdeliveryaddressesrepository.findByCreatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeCashier(token);
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
                row.createCell(0).setCellValue(customer_delivery_addressesEntity.getId() != null ? customer_delivery_addressesEntity.getId() : 0);
                row.createCell(1).setCellValue(customer_delivery_addressesEntity.getCustomerId() != null ? customer_delivery_addressesEntity.getCustomerId().toString() : "N/A");
                row.createCell(2).setCellValue(customer_delivery_addressesEntity.getAddressType() != null ? customer_delivery_addressesEntity.getAddressType() : "N/A");
                row.createCell(3).setCellValue(customer_delivery_addressesEntity.getAddressLine1() != null ? customer_delivery_addressesEntity.getAddressLine1() : "N/A");
                row.createCell(4).setCellValue(customer_delivery_addressesEntity.getAddressLine2() != null ? customer_delivery_addressesEntity.getAddressLine2() : "N/A");
                row.createCell(5).setCellValue(customer_delivery_addressesEntity.getPincodeId() != null ? customer_delivery_addressesEntity.getPincodeId().toString() : "N/A");
                row.createCell(6).setCellValue(customer_delivery_addressesEntity.getLatitude() != null ? customer_delivery_addressesEntity.getLatitude().doubleValue() : 0.0);
                row.createCell(7).setCellValue(customer_delivery_addressesEntity.getLongitude() != null ? customer_delivery_addressesEntity.getLongitude().doubleValue() : 0.0);
                row.createCell(8).setCellValue(customer_delivery_addressesEntity.getLandmark() != null ? customer_delivery_addressesEntity.getLandmark() : "N/A");
                row.createCell(9).setCellValue(customer_delivery_addressesEntity.getDeliveryInstructions() != null ? customer_delivery_addressesEntity.getDeliveryInstructions() : "N/A");
                row.createCell(10).setCellValue(customer_delivery_addressesEntity.getIsDefault() != null && customer_delivery_addressesEntity.getIsDefault() ? "Active" : "Inactive");
                row.createCell(11).setCellValue(customer_delivery_addressesEntity.getIsActive() != null && customer_delivery_addressesEntity.getIsActive() ? "Active" : "Inactive");
                LocalDateTime createdAt = customer_delivery_addressesEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(12).setCellValue(formattedCreatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
