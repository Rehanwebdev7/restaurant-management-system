package com.rms.modules.cashier.services;

import com.rms.common.entities.WalletTransactionsEntity;
import com.rms.common.repositories.WalletTransactionsRepository;
import com.rms.common.serviceImplement.WalletTransactionsServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.BankDetailsRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.UsersRepository;

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
@Qualifier("cashWalletTransactionsService")
public class CashWalletTransactionsService implements WalletTransactionsServiceIMP {

    private final WalletTransactionsRepository wallettransactionsrepository;
    private final BankDetailsRepository bankdetailsrepository;
    private final OrdersRepository ordersrepository;
    private final UsersRepository usersrepository;

    public CashWalletTransactionsService(WalletTransactionsRepository wallettransactionsrepository, BankDetailsRepository bankdetailsrepository, OrdersRepository ordersrepository, UsersRepository usersrepository) {
        this.wallettransactionsrepository = wallettransactionsrepository;
        this.bankdetailsrepository = bankdetailsrepository;
        this.ordersrepository = ordersrepository;
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
    public List<WalletTransactionsEntity> getAllRecordWalletTransactions(String token) throws Exception {
        Authorization.authorizeCashier(token);
        return wallettransactionsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllWalletTransactions(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
        return wallettransactionsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WalletTransactions not found"));
    }

    @Override
    public String addWalletTransactions(WalletTransactionsEntity wallet_transactionsEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        if (wallet_transactionsEntity.getBankDetailId() != null && wallet_transactionsEntity.getBankDetailId().getId() != null) {
            newEntity.setBankDetailId(
                fetchReferenceById(wallet_transactionsEntity.getBankDetailId(), bankdetailsrepository, "Bank_details not found")
            );
        }

        // Handle order_id foreign key
        if (wallet_transactionsEntity.getOrderId() != null && wallet_transactionsEntity.getOrderId().getId() != null) {
            newEntity.setOrderId(
                fetchReferenceById(wallet_transactionsEntity.getOrderId(), ordersrepository, "Orders not found")
            );
        }

        // Handle user_id foreign key
        if (wallet_transactionsEntity.getUserId() != null && wallet_transactionsEntity.getUserId().getId() != null) {
            newEntity.setUserId(
                fetchReferenceById(wallet_transactionsEntity.getUserId(), usersrepository, "Users not found")
            );
        }

        wallettransactionsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateWalletTransactions(WalletTransactionsEntity wallet_transactionsEntity, String token) throws Exception {
        Authorization.authorizeCashier(token);
        WalletTransactionsEntity existingEntity = wallettransactionsrepository.findById(wallet_transactionsEntity.getId())
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
        if (wallet_transactionsEntity.getBankDetailId() != null && wallet_transactionsEntity.getBankDetailId().getId() != null) {
            existingEntity.setBankDetailId(
                fetchReferenceById(wallet_transactionsEntity.getBankDetailId(), bankdetailsrepository, "Bank_details not found")
            );
        }

        // Handle order_id foreign key
        if (wallet_transactionsEntity.getOrderId() != null && wallet_transactionsEntity.getOrderId().getId() != null) {
            existingEntity.setOrderId(
                fetchReferenceById(wallet_transactionsEntity.getOrderId(), ordersrepository, "Orders not found")
            );
        }

        // Handle user_id foreign key
        if (wallet_transactionsEntity.getUserId() != null && wallet_transactionsEntity.getUserId().getId() != null) {
            existingEntity.setUserId(
                fetchReferenceById(wallet_transactionsEntity.getUserId(), usersrepository, "Users not found")
            );
        }

        wallettransactionsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteWalletTransactions(Integer id, String token) throws Exception {
        Authorization.authorizeCashier(token);
        if (!wallettransactionsrepository.existsById(id)) {
            throw new RuntimeException("WalletTransactions not found");
        }
        wallettransactionsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleWalletTransactions(List<WalletTransactionsEntity> wallet_transactionsEntitys, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
                    fetchReferenceById(entity.getBankDetailId(), bankdetailsrepository, "Bank_details not found")
                );
            }

            // Handle order_id foreign key
            if (entity.getOrderId() != null && entity.getOrderId().getId() != null) {
                newEntity.setOrderId(
                    fetchReferenceById(entity.getOrderId(), ordersrepository, "Orders not found")
                );
            }

            // Handle user_id foreign key
            if (entity.getUserId() != null && entity.getUserId().getId() != null) {
                newEntity.setUserId(
                    fetchReferenceById(entity.getUserId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        wallettransactionsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<WalletTransactionsEntity> getWalletTransactionsByDateBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeCashier(token);
        return wallettransactionsrepository.findByDateBetween(fromDate, toDate);
    }

    @Override
    public Map<String, Object> getWalletTransactionsByDateBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeCashier(token);
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
        Authorization.authorizeCashier(token);
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
            header.createCell(1).setCellValue("Op_bal");
            header.createCell(2).setCellValue("Amount");
            header.createCell(3).setCellValue("Closing_bal");
            header.createCell(4).setCellValue("Status");
            header.createCell(5).setCellValue("Message");
            header.createCell(6).setCellValue("User_id");
            header.createCell(7).setCellValue("Order_id");
            header.createCell(8).setCellValue("Bank_ref_id");
            header.createCell(9).setCellValue("Date");
            header.createCell(10).setCellValue("Mode");
            header.createCell(11).setCellValue("Time");
            header.createCell(12).setCellValue("Bank_detail_id");

            int rowNum = 1;
            for (WalletTransactionsEntity wallet_transactionsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(wallet_transactionsEntity.getId() != null ? wallet_transactionsEntity.getId() : 0);
                row.createCell(1).setCellValue(wallet_transactionsEntity.getOpBal() != null ? wallet_transactionsEntity.getOpBal().doubleValue() : 0.0);
                row.createCell(2).setCellValue(wallet_transactionsEntity.getAmount() != null ? wallet_transactionsEntity.getAmount().doubleValue() : 0.0);
                row.createCell(3).setCellValue(wallet_transactionsEntity.getClosingBal() != null ? wallet_transactionsEntity.getClosingBal().doubleValue() : 0.0);
                row.createCell(4).setCellValue(wallet_transactionsEntity.getStatus() != null ? wallet_transactionsEntity.getStatus() : "N/A");
                row.createCell(5).setCellValue(wallet_transactionsEntity.getMessage() != null ? wallet_transactionsEntity.getMessage() : "N/A");
                row.createCell(6).setCellValue(wallet_transactionsEntity.getUserId() != null ? wallet_transactionsEntity.getUserId().toString() : "N/A");
                row.createCell(7).setCellValue(wallet_transactionsEntity.getOrderId() != null ? wallet_transactionsEntity.getOrderId().toString() : "N/A");
                row.createCell(8).setCellValue(wallet_transactionsEntity.getBankRefId() != null ? wallet_transactionsEntity.getBankRefId() : "N/A");
                LocalDate date = wallet_transactionsEntity.getDate();
                String formattedDate = (date != null) ? date.format(dateFormat) : "";
                row.createCell(9).setCellValue(formattedDate);
                row.createCell(10).setCellValue(wallet_transactionsEntity.getMode() != null ? wallet_transactionsEntity.getMode() : 0);
                LocalTime time = wallet_transactionsEntity.getTime();
                String formattedTime = (time != null) ? time.format(timeFormat) : "";
                row.createCell(11).setCellValue(formattedTime);
                row.createCell(12).setCellValue(wallet_transactionsEntity.getBankDetailId() != null ? wallet_transactionsEntity.getBankDetailId().toString() : "N/A");

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
