package com.rms.common.util;

import com.rms.common.dto.BranchOrderSummaryDTO;
import com.rms.common.entities.OrdersEntity;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

public final class ItemReportExcelBuilder {
    private ItemReportExcelBuilder() {
    }

    public static ByteArrayInputStream build(List<OrdersEntity> orders, LocalDate fromDate, LocalDate toDate, String scopeLabel)
            throws java.io.IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Orders");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Scope");
            header.createCell(1).setCellValue("From");
            header.createCell(2).setCellValue("To");
            header.createCell(3).setCellValue("Order Number");
            header.createCell(4).setCellValue("Status");
            header.createCell(5).setCellValue("Amount");

            int rowNum = 1;
            if (orders != null) {
                for (OrdersEntity order : orders) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(scopeLabel != null ? scopeLabel : "");
                    row.createCell(1).setCellValue(fromDate != null ? fromDate.toString() : "");
                    row.createCell(2).setCellValue(toDate != null ? toDate.toString() : "");
                    row.createCell(3).setCellValue(order != null && order.getOrderNumber() != null ? order.getOrderNumber() : "");
                    row.createCell(4).setCellValue(order != null && order.getStatus() != null ? order.getStatus() : "");
                    row.createCell(5).setCellValue(order != null && order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0D);
                }
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public static ByteArrayInputStream buildBranchSummaries(List<BranchOrderSummaryDTO> orders, LocalDate fromDate,
            LocalDate toDate, String scopeLabel) throws java.io.IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Orders");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Scope");
            header.createCell(1).setCellValue("From");
            header.createCell(2).setCellValue("To");
            header.createCell(3).setCellValue("Order Number");
            header.createCell(4).setCellValue("Status");
            header.createCell(5).setCellValue("Amount");

            int rowNum = 1;
            if (orders != null) {
                for (BranchOrderSummaryDTO order : orders) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(scopeLabel != null ? scopeLabel : "");
                    row.createCell(1).setCellValue(fromDate != null ? fromDate.toString() : "");
                    row.createCell(2).setCellValue(toDate != null ? toDate.toString() : "");
                    row.createCell(3).setCellValue(order != null && order.getOrderNumber() != null ? order.getOrderNumber() : "");
                    row.createCell(4).setCellValue(order != null && order.getStatus() != null ? order.getStatus() : "");
                    row.createCell(5).setCellValue(order != null && order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0D);
                }
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
