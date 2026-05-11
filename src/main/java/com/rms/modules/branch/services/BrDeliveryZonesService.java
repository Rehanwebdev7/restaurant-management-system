package com.rms.modules.branch.services;

import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.DeliveryZonesRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BrDeliveryZonesService {

    @Autowired
    private DeliveryZonesRepository deliveryZonesRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    public Map<String, Object> getFilter(String token, Integer pageNumber, Integer pageSize) throws Exception {
        Authorization.authorizeBranch(token);
        tokenUtil.decryptAndStoreToken(token);
        Long branchId = tokenUtil.getCurrentUserId().longValue();

        Specification<DeliveryZonesEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("branchId").get("id"), branchId));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<DeliveryZonesEntity> page = deliveryZonesRepository.findAll(spec, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Transactional(rollbackFor = Exception.class)
    public String bulkUpdate(List<DeliveryZonesEntity> list, String token) throws Exception {
        Authorization.authorizeBranch(token);
        tokenUtil.decryptAndStoreToken(token);
        Long branchId = tokenUtil.getCurrentUserId().longValue();

        if (list == null || list.isEmpty()) {
            throw new RuntimeException("Delivery zones list cannot be empty");
        }

        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        for (DeliveryZonesEntity input : list) {
            DeliveryZonesEntity entity;
            if (input.getId() != null) {
                entity = deliveryZonesRepository.findById(input.getId())
                        .orElseThrow(() -> new RuntimeException("Zone not found: " + input.getId()));
            } else {
                entity = new DeliveryZonesEntity();
                entity.setCreatedAt(LocalDateTime.now());
            }
            entity.setZoneName(input.getZoneName());
            entity.setDescription(input.getDescription());
            entity.setRadiusKmFrom(input.getRadiusKmFrom());
            entity.setRadiusKmTo(input.getRadiusKmTo());
            entity.setDeliveryCharge(input.getDeliveryCharge());
            entity.setDeliveryTimeMinutes(input.getDeliveryTimeMinutes());
            entity.setIsActive(input.getIsActive());
            entity.setBranchId(branch);
            deliveryZonesRepository.save(entity);
        }
        return "Delivery zones saved successfully";
    }
}
