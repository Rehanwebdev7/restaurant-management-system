package com.rms.common.util;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class OrderStatusVocab {
    private static final Map<String, Set<String>> STATUS_EQUIVALENTS = Map.of(
            "CONFIRMED", Set.of("CONFIRMED", "ACCEPTED_ORDER"),
            "READY", Set.of("READY", "READY_FOR_ORDER"),
            "PENDING", Set.of("PENDING"),
            "PREPARING", Set.of("PREPARING"),
            "ONWAY", Set.of("ONWAY", "ON_THE_WAY"),
            "DELIVERED", Set.of("DELIVERED", "COMPLETED"),
            "CANCELLED", Set.of("CANCELLED")
    );

    private OrderStatusVocab() {
    }

    public static Set<String> equivalents(String status) {
        String normalized = normalize(status);
        if (normalized.isEmpty()) {
            return Set.of();
        }
        return STATUS_EQUIVALENTS.getOrDefault(normalized, Set.of(normalized));
    }

    public static String canonical(String status) {
        String normalized = normalize(status);
        if (normalized.isEmpty()) {
            return normalized;
        }
        for (Map.Entry<String, Set<String>> entry : STATUS_EQUIVALENTS.entrySet()) {
            if (entry.getValue().contains(normalized)) {
                return entry.getKey();
            }
        }
        return normalized;
    }

    public static Set<String> splitAndNormalize(String csvStatuses) {
        Set<String> values = new LinkedHashSet<>();
        if (csvStatuses == null || csvStatuses.isBlank()) {
            return values;
        }
        for (String raw : csvStatuses.split(",")) {
            values.addAll(equivalents(raw));
        }
        return values;
    }

    private static String normalize(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }
}
