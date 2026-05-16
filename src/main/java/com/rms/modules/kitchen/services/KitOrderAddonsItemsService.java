package com.rms.modules.kitchen.services;

import com.rms.common.entities.OrderAddonsItemsEntity;
import com.rms.common.repositories.OrderAddonsItemsRepository;
import com.rms.common.serviceImplement.OrderAddonsItemsServiceIMP;
import com.rms.configuration.Authorization;

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
@Qualifier("kitOrderAddonsItemsService")
public class KitOrderAddonsItemsService implements OrderAddonsItemsServiceIMP {

    private final OrderAddonsItemsRepository orderaddonsitemsrepository;

    public KitOrderAddonsItemsService(OrderAddonsItemsRepository orderaddonsitemsrepository) {
        this.orderaddonsitemsrepository = orderaddonsitemsrepository;
    }

    @Override
    public List<OrderAddonsItemsEntity> getAllRecordOrderAddonsItems(String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return orderaddonsitemsrepository.findAll();
    }

    @Override
    public Map<String, Object> getAllOrderAddonsItems(Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page page = orderaddonsitemsrepository.findAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Override
    public OrderAddonsItemsEntity getOneOrderAddonsItems(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        return orderaddonsitemsrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OrderAddonsItems not found"));
    }

    @Override
    public String addOrderAddonsItems(OrderAddonsItemsEntity order_addons_itemsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        OrderAddonsItemsEntity newEntity = new OrderAddonsItemsEntity();

        // Copy non-foreign fields using reflection
        for (Field field : OrderAddonsItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(order_addons_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(newEntity, value);
            }
        }

        orderaddonsitemsrepository.save(newEntity);
        return "Added Successfully";
    }

    @Override
    public String updateOrderAddonsItems(OrderAddonsItemsEntity order_addons_itemsEntity, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        OrderAddonsItemsEntity existingEntity = orderaddonsitemsrepository.findById(order_addons_itemsEntity.getId())
                .orElseThrow(() -> new RuntimeException("OrderAddonsItems not found"));

        // Update non-foreign fields using reflection
        for (Field field : OrderAddonsItemsEntity.class.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(order_addons_itemsEntity);
            if (value != null && !field.getName().endsWith("Id")) {
                field.set(existingEntity, value);
            }
        }

        orderaddonsitemsrepository.save(existingEntity);
        return "Updated Successfully";
    }

    @Override
    public String deleteOrderAddonsItems(Long id, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        if (!orderaddonsitemsrepository.existsById(id)) {
            throw new RuntimeException("OrderAddonsItems not found");
        }
        orderaddonsitemsrepository.deleteById(id);
        return "Deleted Successfully";
    }

    @Override
    public String addMultipleOrderAddonsItems(List<OrderAddonsItemsEntity> order_addons_itemsEntitys, String token) throws Exception {
        Authorization.authorizeKitchen(token);
        List<OrderAddonsItemsEntity> entitiesToSave = new ArrayList<>();

        for (OrderAddonsItemsEntity entity : order_addons_itemsEntitys) {
            OrderAddonsItemsEntity newEntity = new OrderAddonsItemsEntity();

            // Copy non-foreign fields using reflection
            for (Field field : OrderAddonsItemsEntity.class.getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(entity);
                if (value != null && !field.getName().endsWith("Id")) {
                    field.set(newEntity, value);
                }
            }

            entitiesToSave.add(newEntity);
        }

        orderaddonsitemsrepository.saveAll(entitiesToSave);
        return "Added Successfully";
    }


    public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
        try {
            Authorization.authorizeAdmin(token);
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage());
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<OrderAddonsItemsEntity> page = orderaddonsitemsrepository.findAll(pageable);

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("OrderAddonsItemss");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Id");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Price");
            header.createCell(3).setCellValue("Order_item_id");
            header.createCell(4).setCellValue("Created_at");

            int rowNum = 1;
            for (OrderAddonsItemsEntity order_addons_itemsEntity : page.getContent()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(order_addons_itemsEntity.getId() != null ? order_addons_itemsEntity.getId() : 0);
                row.createCell(1).setCellValue(order_addons_itemsEntity.getName() != null ? order_addons_itemsEntity.getName() : "N/A");
                row.createCell(2).setCellValue(order_addons_itemsEntity.getPrice() != null ? order_addons_itemsEntity.getPrice().doubleValue() : 0.0);
                row.createCell(3).setCellValue(order_addons_itemsEntity.getOrderItemId() != null ? order_addons_itemsEntity.getOrderItemId() .getMenuItemName() : "N/A");
                LocalDateTime createdAt = order_addons_itemsEntity.getCreatedAt();
                String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
                row.createCell(4).setCellValue(formattedCreatedAt);

            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
