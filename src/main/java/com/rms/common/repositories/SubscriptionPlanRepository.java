package com.rms.common.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.SubscriptionPlanEntity;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlanEntity, Long>, JpaSpecificationExecutor<SubscriptionPlanEntity> {

    Optional<SubscriptionPlanEntity> findByPlanIdAndIsDeletedFalse(Long planId);

    Page<SubscriptionPlanEntity> findByIsDeletedFalse(Pageable pageable);

    List<SubscriptionPlanEntity> findByIsDeletedFalseOrderBySortOrderAsc();

    Optional<SubscriptionPlanEntity> findFirstByPlanNameIgnoreCaseAndIsDeletedFalse(String planName);

    List<SubscriptionPlanEntity> findByIsDeletedFalseAndIsActiveTrue();
}
