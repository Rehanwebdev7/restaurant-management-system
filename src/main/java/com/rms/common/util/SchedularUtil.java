package com.rms.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.rms.common.Constant;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.RestaurantBranchEntity;
import com.rms.common.entities.SubscriptionEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.DeviceTokenRepository;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.SubscriptionRepository;
import com.rms.common.repositories.UsersRepository;

import jakarta.transaction.Transactional;

@Component
@EnableScheduling
public class SchedularUtil {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    @Autowired
    private FCMUtil fcmUtil;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private Constant constant;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private RestaurantBranchRepository restaurantBranchRepository;

    // ================= 🔁 SCHEDULER =================
    @Scheduled(fixedDelay = 30000) // 30 sec
    public void kitchenPendingOrderReminder() {
        // Redis/Cache disabled - scheduler stub
    }

    // Runs every day at midnight — handles subscription lifecycle
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void processSubscriptionLifecycle() {
        System.out.println("🕛 [SUBSCRIPTION SCHEDULER] Running at: " + LocalDateTime.now());

        // 1. Expire active subscriptions whose endDate has passed
        List<SubscriptionEntity> expired = subscriptionRepository.findExpiredActiveSubscriptions();
        for (SubscriptionEntity sub : expired) {
            sub.setStatus("expired");
            subscriptionRepository.save(sub);
            System.out.println("⏰ Expired subscription ID: " + sub.getSubscriptionId() + " for user: " + sub.getUser().getId());

            // Check if there's a pending plan to activate
            List<SubscriptionEntity> pendingPlans = subscriptionRepository.findPendingSubscriptionsByUserId(sub.getUser().getId());
            if (!pendingPlans.isEmpty()) {
                // Activate the pending plan
                SubscriptionEntity nextPlan = pendingPlans.get(0);
                nextPlan.setStatus("active");
                subscriptionRepository.save(nextPlan);
                System.out.println("✅ Activated pending plan ID: " + nextPlan.getSubscriptionId() + " for user: " + sub.getUser().getId());

                // Handle downgrade: deactivate extra branches if new plan allows fewer
                Integer newMaxBranch = nextPlan.getPlan().getMaxBranch();
                if (newMaxBranch != null) {
                    deactivateExtraBranches(sub.getUser().getId(), newMaxBranch);
                }

                // Handle kitchen downgrade
                Integer newMaxKitchen = nextPlan.getPlan().getMaxKitchen();
                if (newMaxKitchen != null) {
                    deactivateExtraUsers(sub.getUser().getId(), "kitchen", newMaxKitchen);
                }

                // Handle delivery downgrade
                Integer newMaxDelivery = nextPlan.getPlan().getMaxDeliveryBoy();
                if (newMaxDelivery != null) {
                    deactivateExtraUsers(sub.getUser().getId(), "delivery", newMaxDelivery);
                }

            } else {
                // No next plan — stop all restaurant operations
                UsersEntity restaurant = sub.getUser();
                restaurant.setIsOrderStopped(true);
                restaurant.setOrderStoppedAt(LocalDateTime.now());
                usersRepository.save(restaurant);

                // Deactivate all branches
                List<RestaurantBranchEntity> branches = restaurantBranchRepository.findByRestaurantId_IdAndIsDeletedFalse(restaurant.getId());
                for (RestaurantBranchEntity branch : branches) {
                    branch.setIsActive(false);
                    restaurantBranchRepository.save(branch);
                }
                System.out.println("🚫 Restaurant " + restaurant.getId() + " stopped — no renewal plan found");
            }
        }

        // 2. Activate pending plans whose startDate has arrived (in case missed above)
        List<SubscriptionEntity> toActivate = subscriptionRepository.findPendingSubscriptionsToActivate();
        for (SubscriptionEntity pending : toActivate) {
            // Check if there's already an active sub for this user
            List<SubscriptionEntity> activeSubs = subscriptionRepository.findActiveSubscriptionsByUserId(pending.getUser().getId());
            if (activeSubs.isEmpty()) {
                pending.setStatus("active");
                subscriptionRepository.save(pending);
                System.out.println("✅ Activated queued plan for user: " + pending.getUser().getId());

                // Re-enable restaurant if it was stopped
                UsersEntity restaurant = pending.getUser();
                if (Boolean.TRUE.equals(restaurant.getIsOrderStopped())) {
                    restaurant.setIsOrderStopped(false);
                    restaurant.setOrderStoppedAt(null);
                    usersRepository.save(restaurant);

                    // Re-enable branches up to new plan limit
                    Integer newMaxBranch = pending.getPlan().getMaxBranch();
                    List<RestaurantBranchEntity> branches = restaurantBranchRepository.findByRestaurantId_IdAndIsDeletedFalse(restaurant.getId());
                    int reactivated = 0;
                    for (RestaurantBranchEntity branch : branches) {
                        if (newMaxBranch == null || reactivated < newMaxBranch) {
                            branch.setIsActive(true);
                            restaurantBranchRepository.save(branch);
                            reactivated++;
                        }
                    }
                    System.out.println("✅ Restaurant " + restaurant.getId() + " re-enabled with " + reactivated + " branches");
                }
            }
        }

        System.out.println("✅ [SUBSCRIPTION SCHEDULER] Done");
    }

    private void deactivateExtraBranches(Long restaurantId, int maxAllowed) {
        List<RestaurantBranchEntity> branches = restaurantBranchRepository.findByRestaurantId_IdAndIsDeletedFalse(restaurantId);
        for (int i = maxAllowed; i < branches.size(); i++) {
            branches.get(i).setIsActive(false);
            restaurantBranchRepository.save(branches.get(i));
            System.out.println("🔴 Deactivated extra branch: " + branches.get(i).getId());
        }
    }

    private void deactivateExtraUsers(Long restaurantId, String role, int maxAllowed) {
        List<UsersEntity> users = usersRepository.findByParentId_idAndRoleIgnoreCase(restaurantId, role);
        for (int i = maxAllowed; i < users.size(); i++) {
            users.get(i).setIsActive(false);
            usersRepository.save(users.get(i));
            System.out.println("🔴 Deactivated extra " + role + " user: " + users.get(i).getId());
        }
    }

}




