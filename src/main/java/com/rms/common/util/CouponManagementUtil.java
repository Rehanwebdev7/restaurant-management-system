package com.rms.common.util;

import com.rms.common.entities.CouponEntity;
import com.rms.common.entities.CouponMappingEntity;
import com.rms.common.entities.MenuItemsEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public final class CouponManagementUtil {
    private CouponManagementUtil() {
    }

    public static Map<Integer, Integer> extractMenuItemIdsWithQty(Map<String, Object> requestBody) {
        Map<Integer, Integer> result = new LinkedHashMap<>();
        if (requestBody == null) {
            return result;
        }

        Object itemsObj = requestBody.get("items");
        if (itemsObj instanceof List<?> items) {
            for (Object itemObj : items) {
                if (!(itemObj instanceof Map<?, ?> itemMap)) {
                    continue;
                }

                Integer itemId = parseInteger(firstPresent(itemMap,
                        "menuItemId", "menu_item_id", "id", "menuItem"));
                Integer qty = parseInteger(firstPresent(itemMap, "quantity", "qty"));
                if (itemId != null) {
                    result.merge(itemId, qty != null && qty > 0 ? qty : 1, Integer::sum);
                }
            }
        }

        if (result.isEmpty() && requestBody.get("itemQtyMap") instanceof Map<?, ?> itemQtyMap) {
            for (Map.Entry<?, ?> entry : itemQtyMap.entrySet()) {
                Integer itemId = parseInteger(entry.getKey());
                Integer qty = parseInteger(entry.getValue());
                if (itemId != null) {
                    result.put(itemId, qty != null && qty > 0 ? qty : 1);
                }
            }
        }

        return result;
    }

    public static void validateCoupon(CouponEntity coupon) {
        if (coupon == null) {
            throw new RuntimeException("Coupon not found");
        }
        if (Boolean.TRUE.equals(coupon.getIsDelete())) {
            throw new RuntimeException("Coupon is deleted");
        }
        if (coupon.getValidity() != null && coupon.getValidity().isBefore(LocalDate.now())) {
            throw new RuntimeException("Coupon has expired");
        }
        if (coupon.getDiscountAmount() == null || coupon.getDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid coupon discount");
        }
    }

    public static BigDecimal calculateMenuTotalWithQty(List<MenuItemsEntity> menuItems, Map<Long, Integer> qtyMap) {
        BigDecimal total = BigDecimal.ZERO;
        if (menuItems == null || qtyMap == null) {
            return total;
        }
        for (MenuItemsEntity item : menuItems) {
            if (item == null || item.getId() == null) {
                continue;
            }
            int qty = Math.max(0, qtyMap.getOrDefault(item.getId(), 0));
            total = total.add(priceOf(item).multiply(BigDecimal.valueOf(qty)));
        }
        return scale(total);
    }

    public static BigDecimal calculateEligibleTotal(List<MenuItemsEntity> menuItems, Map<Long, Integer> qtyMap, Integer couponQty) {
        return calculateMatchedEligibleTotal(menuItems,
                menuItems == null ? List.of() : menuItems.stream().map(MenuItemsEntity::getId).filter(Objects::nonNull).toList(),
                qtyMap,
                couponQty);
    }

    public static BigDecimal calculateMatchedEligibleTotal(List<MenuItemsEntity> menuItems, List<Long> matchedItemIds,
                                                           Map<Long, Integer> qtyMap, Integer couponQty) {
        if (menuItems == null || matchedItemIds == null || qtyMap == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        Set<Long> matched = matchedItemIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        BigDecimal total = BigDecimal.ZERO;
        for (MenuItemsEntity item : menuItems) {
            if (item == null || item.getId() == null || !matched.contains(item.getId())) {
                continue;
            }
            int qty = qtyMap.getOrDefault(item.getId(), 0);
            if (couponQty != null && couponQty > 0) {
                qty = Math.min(qty, couponQty);
            }
            total = total.add(priceOf(item).multiply(BigDecimal.valueOf(Math.max(qty, 0))));
        }
        return scale(total);
    }

    public static BigDecimal calculateDiscount(BigDecimal eligibleTotal, BigDecimal discountAmount, boolean isPercent) {
        BigDecimal eligible = scale(eligibleTotal);
        BigDecimal discountValue = scale(discountAmount);
        if (eligible.compareTo(BigDecimal.ZERO) <= 0 || discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal discount = isPercent
                ? eligible.multiply(discountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : discountValue;
        if (discount.compareTo(eligible) > 0) {
            discount = eligible;
        }
        return scale(discount);
    }

    public static BigDecimal calculatePayable(BigDecimal menuTotal, BigDecimal discount) {
        BigDecimal payable = scale(menuTotal).subtract(scale(discount));
        if (payable.compareTo(BigDecimal.ZERO) < 0) {
            payable = BigDecimal.ZERO;
        }
        return scale(payable);
    }

    public static Map<String, Object> buildCouponApplyResponse(BigDecimal menuTotal,
                                                               BigDecimal eligibleTotal,
                                                               BigDecimal discount,
                                                               BigDecimal paybleAmount,
                                                               BigDecimal discountAmount,
                                                               boolean isPercent,
                                                               boolean isFirstOrder) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("menuTotal", scale(menuTotal));
        response.put("eligibleTotal", scale(eligibleTotal));
        response.put("discount", scale(discount));
        response.put("paybleAmount", scale(paybleAmount));
        response.put("discountAmount", scale(discountAmount));
        response.put("isPercent", isPercent);
        response.put("isFirstOrder", isFirstOrder);
        return response;
    }

    public static List<Long> getMatchedItemIds(List<Long> menuItemIds, List<CouponMappingEntity> couponMappings) {
        if (menuItemIds == null || couponMappings == null) {
            return List.of();
        }
        Set<Long> availableIds = menuItemIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        List<Long> matched = new ArrayList<>();
        for (CouponMappingEntity mapping : couponMappings) {
            if (mapping == null || mapping.getMenuItemId() == null || mapping.getMenuItemId().getId() == null) {
                continue;
            }
            Long itemId = mapping.getMenuItemId().getId();
            if (availableIds.contains(itemId)) {
                matched.add(itemId);
            }
        }
        return matched;
    }

    private static Object firstPresent(Map<?, ?> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key)) {
                Object value = map.get(key);
                if (value instanceof Map<?, ?> nested && nested.containsKey("id")) {
                    return nested.get("id");
                }
                return value;
            }
        }
        return null;
    }

    private static Integer parseInteger(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal priceOf(MenuItemsEntity item) {
        return item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
    }

    private static BigDecimal scale(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
