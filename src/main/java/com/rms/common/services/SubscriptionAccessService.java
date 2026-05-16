package com.rms.common.services;

import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class SubscriptionAccessService {
    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionAccessService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public boolean hasActiveAccess(UsersEntity restaurant) {
        if (restaurant == null || restaurant.getId() == null) {
            return false;
        }

        List<SubscriptionEntity> subscriptions = subscriptionRepository.findActiveSubscriptionsByUserId(restaurant.getId());
        if (subscriptions == null || subscriptions.isEmpty()) {
            // Preserve legacy installs that are running without subscription rows.
            return true;
        }

        LocalDate today = LocalDate.now();
        for (SubscriptionEntity subscription : subscriptions) {
            if (subscription == null || subscription.getStatus() == null) {
                continue;
            }

            String status = subscription.getStatus().trim().toLowerCase();
            if ("active".equals(status) && (subscription.getEndDate() == null || !subscription.getEndDate().isBefore(today))) {
                return true;
            }
            if ("grace".equals(status) && (subscription.getGraceEndDate() == null || !subscription.getGraceEndDate().isBefore(today))) {
                return true;
            }
        }
        return false;
    }
}
