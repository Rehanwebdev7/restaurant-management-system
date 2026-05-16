package com.rms.common.util;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.repositories.TableBookingRepository;

public final class OrderLifecycleUtil {
    private OrderLifecycleUtil() {
    }

    public static void normalizeBeforeSave(OrdersEntity order) {
        if (order == null) {
            return;
        }
        if (order.getStatus() != null) {
            order.setStatus(order.getStatus().trim().toUpperCase());
        }
        if (order.getDeliveryStatus() != null) {
            order.setDeliveryStatus(order.getDeliveryStatus().trim().toUpperCase());
        }
        if (order.getPaymentStatus() != null) {
            order.setPaymentStatus(order.getPaymentStatus().trim().toUpperCase());
        }
        if (order.getPaymentMethod() != null) {
            order.setPaymentMethod(order.getPaymentMethod().trim().toUpperCase());
        }
    }

    public static void applyClosedSideEffects(OrdersEntity order,
                                              DiningTablesRepository diningTablesRepository,
                                              TableBookingRepository tableBookingRepository) {
        // Intentionally lightweight compatibility hook.
    }
}
