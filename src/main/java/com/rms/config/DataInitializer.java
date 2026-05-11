package com.rms.config;

import com.rms.common.entities.SubscriptionPlanEntity;
import com.rms.common.repositories.SubscriptionPlanRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public void run(String... args) {
        System.out.println("🚀 [DATA INITIALIZER] Starting...");

        // Check if "Free" plan already exists — if not, create it
        subscriptionPlanRepository
            .findFirstByPlanNameIgnoreCaseAndIsDeletedFalse("Free")
            .ifPresentOrElse(
                plan -> System.out.println("✅ Free plan already exists: " + plan.getPlanId()),
                () -> {
                    SubscriptionPlanEntity freePlan = new SubscriptionPlanEntity();
                    freePlan.setPlanName("Free");
                    freePlan.setDescription("Default free trial plan - 30 days");
                    freePlan.setPrice(BigDecimal.ZERO);
                    freePlan.setDurationDays(30);
                    freePlan.setMaxBranch(1);
                    freePlan.setMaxKitchen(1);
                    freePlan.setMaxDeliveryBoy(1);
                    freePlan.setFeatures("1 Branch, 1 Kitchen, 1 Delivery Boy");
                    freePlan.setSortOrder(0);

                    subscriptionPlanRepository.save(freePlan);
                    System.out.println("✅ Free plan created successfully!");
                }
            );

        System.out.println("✅ [DATA INITIALIZER] Done");
    }
}
