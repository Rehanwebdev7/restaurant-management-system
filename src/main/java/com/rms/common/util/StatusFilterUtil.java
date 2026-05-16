package com.rms.common.util;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

import java.util.Set;

public final class StatusFilterUtil {
    private StatusFilterUtil() {
    }

    public static Predicate buildStatusPredicate(CriteriaBuilder cb, Expression<String> statusField, String status) {
        if (status == null || status.isBlank()) {
            return cb.conjunction();
        }

        Set<String> statuses = OrderStatusVocab.splitAndNormalize(status);
        if (statuses.isEmpty()) {
            return cb.conjunction();
        }

        return cb.upper(statusField).in(statuses);
    }
}
