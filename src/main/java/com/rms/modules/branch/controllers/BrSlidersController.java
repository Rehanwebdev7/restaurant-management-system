package com.rms.modules.branch.controllers;

import com.rms.common.entities.SlidersEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SlidersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.response.ApiResponse;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Branch-side read-only sliders endpoint.
 * Sliders are owned by the parent restaurant; a branch sees its restaurant's sliders.
 * GET /api/branch/sliders/all
 */
@RestController
@RequestMapping("api/branch/sliders")
public class BrSlidersController {

    @Autowired
    private SlidersRepository slidersRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private TokenUtil tokenUtil;

    @GetMapping("/all")
    public ResponseEntity<Object> getAllSliders(@RequestHeader("access_token") String token,
            @RequestParam(value = "platform", required = false) String platform) {
        try {
            Authorization.authorizeBranch(token);
            tokenUtil.decryptAndStoreToken(token);
            Long branchUserId = tokenUtil.getCurrentUserId().longValue();

            UsersEntity branchUser = usersRepository.findById(branchUserId)
                    .orElseThrow(() -> new RuntimeException("Branch user not found"));

            UsersEntity restaurant = branchUser.getParentId();
            if (restaurant == null || restaurant.getId() == null) {
                return ApiResponse.responseBuilder(Collections.emptyList(), "SUCCESS", HttpStatus.OK,
                        "No sliders configured");
            }

            List<SlidersEntity> result;
            if (platform != null && !platform.isBlank()) {
                result = slidersRepository.findByRestaurantId_IdAndPlatformIgnoreCase(restaurant.getId(), platform);
            } else {
                result = slidersRepository
                        .findByRestaurantId_Id(restaurant.getId(),
                                org.springframework.data.domain.Pageable.unpaged())
                        .getContent();
            }

            return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
                    "Sliders fetched successfully");
        } catch (SecurityException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error");
        } finally {
            tokenUtil.clearTokenData();
        }
    }
}
