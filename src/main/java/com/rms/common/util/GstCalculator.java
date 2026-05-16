package com.rms.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public final class GstCalculator {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private GstCalculator() {
    }

    public static Result compute(List<Line> lines, BigDecimal fallbackRate, BigDecimal ignoredDiscount) {
        List<LineResult> results = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal gstAmount = BigDecimal.ZERO;
        BigDecimal itemsPayable = BigDecimal.ZERO;

        if (lines == null) {
            return new Result(Collections.emptyList(), subtotal, gstAmount, itemsPayable);
        }

        for (Line line : lines) {
            BigDecimal gross = scale(line != null ? line.grossAmount : BigDecimal.ZERO);
            BigDecimal rate = scale(line != null && line.gstRate != null ? line.gstRate : fallbackRate);
            String type = normalizeType(line != null ? line.gstType : null);

            BigDecimal taxable;
            BigDecimal lineGst;
            BigDecimal payable;

            if ("INCLUSIVE".equals(type) && rate.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal divisor = BigDecimal.ONE.add(rate.divide(HUNDRED, 10, RoundingMode.HALF_UP));
                taxable = gross.divide(divisor, 2, RoundingMode.HALF_UP);
                lineGst = gross.subtract(taxable).setScale(2, RoundingMode.HALF_UP);
                payable = gross;
            } else {
                taxable = gross;
                lineGst = gross.multiply(rate).divide(HUNDRED, 2, RoundingMode.HALF_UP);
                payable = gross.add(lineGst).setScale(2, RoundingMode.HALF_UP);
            }

            subtotal = subtotal.add(taxable);
            gstAmount = gstAmount.add(lineGst);
            itemsPayable = itemsPayable.add(payable);
            results.add(new LineResult(taxable, lineGst, rate, type));
        }

        return new Result(results, scale(subtotal), scale(gstAmount), scale(itemsPayable));
    }

    public static final class Line {
        public final BigDecimal grossAmount;
        public final BigDecimal gstRate;
        public final String gstType;

        public Line(BigDecimal grossAmount, BigDecimal gstRate, String gstType) {
            this.grossAmount = grossAmount;
            this.gstRate = gstRate;
            this.gstType = gstType;
        }
    }

    public static final class LineResult {
        public final BigDecimal taxableAmount;
        public final BigDecimal gstAmount;
        public final BigDecimal effectiveRate;
        public final String effectiveType;

        public LineResult(BigDecimal taxableAmount, BigDecimal gstAmount, BigDecimal effectiveRate, String effectiveType) {
            this.taxableAmount = taxableAmount;
            this.gstAmount = gstAmount;
            this.effectiveRate = effectiveRate;
            this.effectiveType = effectiveType;
        }
    }

    public static final class Result {
        public final List<LineResult> lines;
        public final BigDecimal subtotal;
        public final BigDecimal gstAmount;
        public final BigDecimal itemsPayable;

        public Result(List<LineResult> lines, BigDecimal subtotal, BigDecimal gstAmount, BigDecimal itemsPayable) {
            this.lines = lines;
            this.subtotal = subtotal;
            this.gstAmount = gstAmount;
            this.itemsPayable = itemsPayable;
        }
    }

    private static BigDecimal scale(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static String normalizeType(String gstType) {
        return gstType == null || gstType.isBlank() ? "EXCLUSIVE" : gstType.trim().toUpperCase(Locale.ROOT);
    }
}
