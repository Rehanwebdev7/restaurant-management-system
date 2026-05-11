package com.rms.modules.branch.services;

import com.rms.common.entities.RestaurantHoursEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.RestaurantHoursRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BrRestaurantHoursService {

    @Autowired
    private RestaurantHoursRepository restaurantHoursRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    public Map<String, Object> getFilter(String token, Integer pageNumber, Integer pageSize) throws Exception {
        Authorization.authorizeBranch(token);
        tokenUtil.decryptAndStoreToken(token);
        Long branchId = tokenUtil.getCurrentUserId().longValue();

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<RestaurantHoursEntity> page = restaurantHoursRepository.findAllByBranchId_Id(branchId, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Transactional(rollbackFor = Exception.class)
    public String bulkAdd(String token, List<RestaurantHoursEntity> hoursList) throws Exception {
        Authorization.authorizeBranch(token);
        tokenUtil.decryptAndStoreToken(token);
        Long branchId = tokenUtil.getCurrentUserId().longValue();

        if (hoursList == null || hoursList.isEmpty()) {
            throw new RuntimeException("Restaurant hours list cannot be empty");
        }

        UsersEntity branch = usersRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        // Get restaurantId from branch's parent
        UsersEntity restaurant = branch.getParentId();
        if (restaurant == null) {
            throw new RuntimeException("Restaurant not found for this branch");
        }
        Long restaurantId = restaurant.getId();

        List<RestaurantHoursEntity> entitiesToSave = new ArrayList<>();

        for (RestaurantHoursEntity incoming : hoursList) {
            RestaurantHoursEntity entity = null;

            if (incoming.getSpecialDate() != null) {
                entity = restaurantHoursRepository
                        .findBySpecialDateAndRestaurantId_IdAndBranchId_Id(
                                incoming.getSpecialDate(), restaurantId, branchId)
                        .orElse(null);
            } else if (incoming.getDayOfWeek() != null) {
                entity = restaurantHoursRepository
                        .findByDayOfWeekIgnoreCaseAndRestaurantId_IdAndBranchId_Id(
                                incoming.getDayOfWeek().trim(), restaurantId, branchId)
                        .orElse(null);
            }

            if (entity == null) {
                entity = new RestaurantHoursEntity();
                entity.setRestaurantId(usersRepository.getReferenceById(restaurantId));
                entity.setBranchId(branch);
                entity.setDayOfWeek(incoming.getDayOfWeek() != null ? incoming.getDayOfWeek().trim() : null);
                entity.setSpecialDate(incoming.getSpecialDate());
                entity.setCreatedAt(LocalDateTime.now());
            }

            if (incoming.getId() != null) {
                entity = restaurantHoursRepository.findById(incoming.getId()).orElse(entity);
            }

            entity.setOpeningTime(incoming.getOpeningTime());
            entity.setClosingTime(incoming.getClosingTime());
            entity.setIsClosed(incoming.getIsClosed() != null ? incoming.getIsClosed() : false);
            if (incoming.getOccasionName() != null) entity.setOccasionName(incoming.getOccasionName());
            entity.setUpdatedAt(LocalDateTime.now());

            entitiesToSave.add(entity);
        }

        restaurantHoursRepository.saveAll(entitiesToSave);
        return "Restaurant hours saved successfully";
    }
}
