package com.rms.modules.restaurant.services;

import com.rms.common.entities.RestaurantGalleryEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.RestaurantGalleryRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.FileUploadService;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RestRestaurantGalleryService {

    @Autowired
    private RestaurantGalleryRepository restaurantGalleryRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private TokenUtil tokenUtil;

    private UsersEntity resolveCurrentRestaurant(String token) throws Exception {
        Authorization.authorizeRestaurant(token);
        tokenUtil.decryptAndStoreToken(token);
        Integer currentUserId = tokenUtil.getCurrentUserId();
        tokenUtil.clearTokenData();

        if (currentUserId == null) {
            throw new RuntimeException("Invalid token: user not found");
        }

        UsersEntity restaurant = usersRepository.findById(currentUserId.longValue())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!"RESTAURANT".equalsIgnoreCase(restaurant.getRole())) {
            throw new IllegalArgumentException("Logged-in user is not a restaurant");
        }

        return restaurant;
    }

    private String normalizePlatform(String platform) {
        return (platform == null || platform.isBlank()) ? "Web" : platform.trim();
    }

    private String normalizeCategory(String category) {
        return (category == null || category.isBlank()) ? "GENERAL" : category.trim().toUpperCase();
    }

    @Transactional
    public String addGalleryWithImage(
            MultipartFile image,
            String title,
            String category,
            String platform,
            String description,
            Integer displayOrder,
            Boolean isActive,
            String token
    ) throws Exception {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("image is required");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }

        UsersEntity restaurant = resolveCurrentRestaurant(token);

        RestaurantGalleryEntity entity = new RestaurantGalleryEntity();
        entity.setTitle(title.trim());
        entity.setCategory(normalizeCategory(category));
        entity.setPlatform(normalizePlatform(platform));
        entity.setDescription(description != null ? description.trim() : null);
        entity.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        entity.setIsActive(isActive != null ? isActive : true);
        entity.setRestaurantId(restaurant);

        RestaurantGalleryEntity savedEntity = restaurantGalleryRepository.save(entity);

        String fileName = "gallery_" + savedEntity.getId();
        String imageUrl = fileUploadService.uploadFile(
                image,
                fileName,
                "Restaurant_Gallery",
                driveUrl -> restaurantGalleryRepository.updateDriveImageUrl(savedEntity.getId(), driveUrl)
        );
        savedEntity.setImageUrl(imageUrl);
        restaurantGalleryRepository.save(savedEntity);

        return "Gallery image added successfully";
    }

    @Transactional
    public String updateGallery(
            MultipartFile image,
            Long galleryId,
            String title,
            String category,
            String platform,
            String description,
            Integer displayOrder,
            Boolean isActive,
            String token
    ) throws Exception {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }
        if (galleryId == null) {
            throw new IllegalArgumentException("galleryId is required");
        }

        UsersEntity restaurant = resolveCurrentRestaurant(token);

        RestaurantGalleryEntity gallery = restaurantGalleryRepository.findById(galleryId)
                .orElseThrow(() -> new RuntimeException("Gallery image not found"));

        if (gallery.getRestaurantId() == null || !gallery.getRestaurantId().getId().equals(restaurant.getId())) {
            throw new SecurityException("You are not allowed to update this gallery image");
        }

        if (title != null && !title.isBlank()) {
            gallery.setTitle(title.trim());
        }
        if (category != null && !category.isBlank()) {
            gallery.setCategory(normalizeCategory(category));
        }
        if (platform != null && !platform.isBlank()) {
            gallery.setPlatform(normalizePlatform(platform));
        }
        if (description != null) {
            gallery.setDescription(description.trim());
        }
        if (displayOrder != null) {
            gallery.setDisplayOrder(displayOrder);
        }
        if (isActive != null) {
            gallery.setIsActive(isActive);
        }

        if (image != null && !image.isEmpty()) {
            String fileName = "gallery_" + gallery.getId();
            String imageUrl = fileUploadService.uploadFile(
                    image,
                    fileName,
                    "Restaurant_Gallery",
                    driveUrl -> restaurantGalleryRepository.updateDriveImageUrl(gallery.getId(), driveUrl)
            );
            gallery.setImageUrl(imageUrl);
        }

        restaurantGalleryRepository.save(gallery);
        return "Gallery image updated successfully";
    }

    @Transactional
    public String deleteGallery(Long id, String token) throws Exception {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Access token is missing");
        }
        if (id == null) {
            throw new IllegalArgumentException("id is required");
        }

        UsersEntity restaurant = resolveCurrentRestaurant(token);
        RestaurantGalleryEntity gallery = restaurantGalleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gallery image not found"));

        if (gallery.getRestaurantId() == null || !gallery.getRestaurantId().getId().equals(restaurant.getId())) {
            throw new SecurityException("You are not allowed to delete this gallery image");
        }

        restaurantGalleryRepository.delete(gallery);
        return "Gallery image deleted successfully";
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllGallery(Integer pageNumber, Integer pageSize, String token) throws Exception {
        UsersEntity restaurant = resolveCurrentRestaurant(token);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<RestaurantGalleryEntity> page = restaurantGalleryRepository.findByRestaurantId_Id(restaurant.getId(), pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", page.getTotalElements());
        response.put("pageSize", page.getSize());
        response.put("currentPage", page.getNumber() + 1);
        response.put("totalPages", page.getTotalPages());
        response.put("records", page.getContent());
        return response;
    }

    @Transactional(readOnly = true)
    public RestaurantGalleryEntity getOneGallery(Long id, String token) throws Exception {
        UsersEntity restaurant = resolveCurrentRestaurant(token);
        RestaurantGalleryEntity gallery = restaurantGalleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gallery image not found"));
        if (gallery.getRestaurantId() == null || !gallery.getRestaurantId().getId().equals(restaurant.getId())) {
            throw new SecurityException("You are not allowed to view this gallery image");
        }
        return gallery;
    }

    @Transactional(readOnly = true)
    public List<RestaurantGalleryEntity> getGalleryByRestaurantAndPlatform(Long restaurantId, String platform) {
        if (restaurantId == null) {
            throw new IllegalArgumentException("restaurantId is required");
        }
        String resolvedPlatform = normalizePlatform(platform);
        List<RestaurantGalleryEntity> gallery =
                restaurantGalleryRepository.findByRestaurantId_IdAndPlatformIgnoreCaseAndIsActiveTrueOrderByDisplayOrderAscIdAsc(
                        restaurantId,
                        resolvedPlatform
                );
        if (gallery.isEmpty()) {
            return restaurantGalleryRepository.findByRestaurantId_IdAndIsActiveTrueOrderByDisplayOrderAscIdAsc(restaurantId);
        }
        return gallery;
    }
}
