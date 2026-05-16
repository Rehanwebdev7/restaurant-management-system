package com.rms.modules.branch.services;

import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.repositories.OrderItemsRepository;
import com.rms.common.serviceImplement.OrderItemsServiceIMP;
import com.rms.configuration.Authorization;
import com.rms.common.repositories.MenuItemsRepository;
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
@Qualifier("brOrderItemsService")
public class BrOrderItemsService implements OrderItemsServiceIMP {

    private final OrderItemsRepository orderitemsrepository;
    private final MenuItemsRepository menuitemsrepository;
    private final OrdersRepository ordersrepository;
    private final UsersRepository usersrepository;

    public BrOrderItemsService(OrderItemsRepository orderitemsrepository, MenuItemsRepository menuitemsrepository, OrdersRepository ordersrepository, UsersRepository usersrepository) {
        this.orderitemsrepository = orderitemsrepository;
        this.menuitemsrepository = menuitemsrepository;
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
    public List<OrderItemsEntity> getAllRecordOrderItems(String token) throws Exception {
        Authorization.authorizeBranch(token);
        return orderitemsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllOrderItems(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = orderitemsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public OrderItemsEntity getOneOrderItems(Long id, String token) throws Exception {
        Authorization.authorizeBranch(token);
        return orderitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OrderItems not found"));
    }

    @Override
    public String addOrderItems(OrderItemsEntity order_itemsEntity, String token) throws Exception {
        Authorization.authorizeBranch(token);
        OrderItemsEntity newEntity = new OrderItemsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : OrderItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(order_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        // Handle menu_item_id foreign key
        if (order_itemsEntity.getMenuItemId() != null && order_itemsEntity.getMenuItemId().getId() != null) {
            newEntity.setMenuItemId(
                fetchReferenceById(order_itemsEntity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
            );
        }

        // Handle order_id foreign key
        if (order_itemsEntity.getOrderId() != null && order_itemsEntity.getOrderId().getId() != null) {
            newEntity.setOrderId(
                fetchReferenceById(order_itemsEntity.getOrderId(), ordersrepository, "Orders not found")
            );
        }

        // Handle kitchen_id foreign key
        if (order_itemsEntity.getKitchenId() != null && order_itemsEntity.getKitchenId().getId() != null) {
            newEntity.setKitchenId(
                fetchReferenceById(order_itemsEntity.getKitchenId(), usersrepository, "Users not found")
            );
        }

        orderitemsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateOrderItems(OrderItemsEntity order_itemsEntity, String token) throws Exception {
        Authorization.authorizeBranch(token);
        OrderItemsEntity existingEntity = orderitemsrepository.findById(order_itemsEntity.getId())
                .orElseThrow(() -> new RuntimeException("OrderItems not found"));

        // Update non-foreign fields using reflection
        for (Field field : OrderItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(order_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        // Handle menu_item_id foreign key
        if (order_itemsEntity.getMenuItemId() != null && order_itemsEntity.getMenuItemId().getId() != null) {
            existingEntity.setMenuItemId(
                fetchReferenceById(order_itemsEntity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
            );
        }

        // Handle order_id foreign key
        if (order_itemsEntity.getOrderId() != null && order_itemsEntity.getOrderId().getId() != null) {
            existingEntity.setOrderId(
                fetchReferenceById(order_itemsEntity.getOrderId(), ordersrepository, "Orders not found")
            );
        }

        // Handle kitchen_id foreign key
        if (order_itemsEntity.getKitchenId() != null && order_itemsEntity.getKitchenId().getId() != null) {
            existingEntity.setKitchenId(
                fetchReferenceById(order_itemsEntity.getKitchenId(), usersrepository, "Users not found")
            );
        }

        orderitemsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteOrderItems(Long id, String token) throws Exception {
        Authorization.authorizeBranch(token);
        if (!orderitemsrepository.existsById(id)) {
            throw new RuntimeException("OrderItems not found");
        }
        orderitemsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleOrderItems(List<OrderItemsEntity> order_itemsEntitys, String token) throws Exception {
        Authorization.authorizeBranch(token);
        List<OrderItemsEntity> entitiesToSave = new ArrayList<>();

        for (OrderItemsEntity entity : order_itemsEntitys) {
            OrderItemsEntity newEntity = new OrderItemsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : OrderItemsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            // Handle menu_item_id foreign key
            if (entity.getMenuItemId() != null && entity.getMenuItemId().getId() != null) {
                newEntity.setMenuItemId(
                    fetchReferenceById(entity.getMenuItemId(), menuitemsrepository, "Menu_items not found")
                );
            }

            // Handle order_id foreign key
            if (entity.getOrderId() != null && entity.getOrderId().getId() != null) {
                newEntity.setOrderId(
                    fetchReferenceById(entity.getOrderId(), ordersrepository, "Orders not found")
                );
            }

            // Handle kitchen_id foreign key
            if (entity.getKitchenId() != null && entity.getKitchenId().getId() != null) {
                newEntity.setKitchenId(
                    fetchReferenceById(entity.getKitchenId(), usersrepository, "Users not found")
                );
            }

            entitiesToSave.add(newEntity);
        }

        orderitemsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }

    @Override
    public List<OrderItemsEntity> getOrderItemsByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return orderitemsrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOrderItemsByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = orderitemsrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OrderItemsEntity> getOrderItemsByCreatedat(LocalDate createdat, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime dateTime = createdat.atStartOfDay();
        return orderitemsrepository.findByCreatedAt(dateTime);
    }

    @Override
    public List<OrderItemsEntity> getOrderItemsByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        return orderitemsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
    }

    @Override
    public Map<String, Object> getOrderItemsByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeBranch(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
        Page page = orderitemsrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public List<OrderItemsEntity> getOrderItemsByUpdatedat(LocalDate updatedat, String token) throws Exception {
        Authorization.authorizeBranch(token);
        LocalDateTime dateTime = updatedat.atStartOfDay();
        return orderitemsrepository.findByUpdatedAt(dateTime);
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OrderItemsEntity> page = orderitemsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("OrderItemss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Order_id");
            header.createCell(2).setCellValue("Menu_item_id");
            header.createCell(3).setCellValue("Menu_item_name");
            header.createCell(4).setCellValue("Price");
            header.createCell(5).setCellValue("Quantity");
            header.createCell(6).setCellValue("Addons_total");
            header.createCell(7).setCellValue("Special_instructions");
            header.createCell(8).setCellValue("Item_total");
            header.createCell(9).setCellValue("Status");
            header.createCell(10).setCellValue("Kitchen_id");
            header.createCell(11).setCellValue("Created_at");
            header.createCell(12).setCellValue("Updated_at");

            int rowNum = 1;
            for (OrderItemsEntity order_itemsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(order_itemsEntity.getId() != null ? order_itemsEntity.getId() : 0);
                row.createCell(1).setCellValue(order_itemsEntity.getOrderId() != null ? order_itemsEntity.getOrderId().toString() : "N/A");
                row.createCell(2).setCellValue(order_itemsEntity.getMenuItemId() != null ? order_itemsEntity.getMenuItemId().toString() : "N/A");
                row.createCell(3).setCellValue(order_itemsEntity.getMenuItemName() != null ? order_itemsEntity.getMenuItemName() : "N/A");
                row.createCell(4).setCellValue(order_itemsEntity.getPrice() != null ? order_itemsEntity.getPrice().doubleValue() : 0.0);
                row.createCell(5).setCellValue(order_itemsEntity.getQuantity() != null ? order_itemsEntity.getQuantity() : 0);
                row.createCell(6).setCellValue(order_itemsEntity.getAddonsTotal() != null ? order_itemsEntity.getAddonsTotal().doubleValue() : 0.0);
                row.createCell(7).setCellValue(order_itemsEntity.getSpecialInstructions() != null ? order_itemsEntity.getSpecialInstructions() : "N/A");
                row.createCell(8).setCellValue(order_itemsEntity.getItemTotal() != null ? order_itemsEntity.getItemTotal().doubleValue() : 0.0);
                row.createCell(9).setCellValue(order_itemsEntity.getStatus() != null ? order_itemsEntity.getStatus() : "N/A");
                row.createCell(10).setCellValue(order_itemsEntity.getKitchenId() != null ? order_itemsEntity.getKitchenId().toString() : "N/A");
                LocalDateTime createdAt = order_itemsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(11).setCellValue(formattedCreatedAt);
                LocalDateTime updatedAt = order_itemsEntity.getUpdatedAt();
                String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
                row.createCell(12).setCellValue(formattedUpdatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
