package com.rms.modules.superadmin.services;

import com.rms.common.entities.SubscriptionPlanEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.SubscriptionPlanRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.util.AES256Util;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;

import jakarta.persistence.criteria.Predicate;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class SuperadminService {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private TokenUtil tokenUtil;

    // ==================== USER APPROVALS ====================

    public Map<String, Object> getUserApprovals(String search, String approvalStatus,
            Integer pageNumber, Integer pageSize, String token) throws Exception {

        Authorization.authorizeSupadmin(token);

        Specification<UsersEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only admin role users need approval
            predicates.add(cb.equal(cb.lower(root.get("role")), "admin"));
            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (approvalStatus != null && !approvalStatus.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("approvalStatus")), approvalStatus.toLowerCase()));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate searchPred = cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("mobile")), pattern));
                predicates.add(searchPred);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("id").descending());
        Page<UsersEntity> page = usersRepository.findAll(spec, pageable);

        List<Map<String, Object>> content = new ArrayList<>();
        for (UsersEntity user : page.getContent()) {
            content.add(mapUserToDto(user));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        return response;
    }

    public Map<String, Object> getUserApprovalById(Long id, String token) throws Exception {
        Authorization.authorizeSupadmin(token);
        UsersEntity user = usersRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapUserToDto(user);
    }

    public String updateUserApproval(Long id, Map<String, Object> data, String token) throws Exception {
        Authorization.authorizeSupadmin(token);
        UsersEntity user = usersRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (data.containsKey("approval_status")) {
            user.setApprovalStatus((String) data.get("approval_status"));
        }
        if (data.containsKey("approval_notes")) {
            user.setApprovalNotes((String) data.get("approval_notes"));
        }
        // Allow editing user profile fields
        if (data.containsKey("name")) user.setName((String) data.get("name"));
        if (data.containsKey("email")) user.setEmail((String) data.get("email"));
        if (data.containsKey("mobile")) user.setMobile((String) data.get("mobile"));
        if (data.containsKey("gst_number")) user.setGstNumber((String) data.get("gst_number"));
        if (data.containsKey("city")) user.setCity((String) data.get("city"));
        if (data.containsKey("state")) user.setState((String) data.get("state"));
        if (data.containsKey("pincode")) user.setPincode((String) data.get("pincode"));

        // If approving, also activate the user
        if ("approved".equalsIgnoreCase(user.getApprovalStatus())) {
            user.setIsActive(true);
        }

        user.setUpdatedAt(LocalDateTime.now());
        usersRepository.save(user);
        return "User updated successfully";
    }

    public Map<String, Object> impersonateUser(Long userId, String token) throws Exception {
        Authorization.authorizeSupadmin(token);
        UsersEntity user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create impersonation token (2hr session)
        String impersonationToken = tokenUtil.createAndEncryptSessionToken(user, null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", impersonationToken);
        result.put("userType", user.getRole());
        result.put("name", user.getName());
        result.put("userId", user.getId());
        return result;
    }

    // ==================== USER DIRECTORY ====================

    // Map frontend role_id (number) to backend role strings
    // Actual DB roles: supadmin, restaurant, branch, kitchen, delivery, cashier
    private List<String> mapRoleIdToRoles(String roleId) {
        if (roleId == null || roleId.trim().isEmpty()) return null;
        switch (roleId.trim()) {
            case "1": return Arrays.asList("restaurant");
            case "2": return Arrays.asList("branch");
            case "3": return Arrays.asList("kitchen");
            case "4": return Arrays.asList("delivery");
            case "5": return Arrays.asList("cashier");
            default: return Arrays.asList(roleId.toLowerCase());
        }
    }

    private int mapRoleToId(String role) {
        if (role == null) return 0;
        switch (role.toLowerCase()) {
            case "restaurant": return 1;
            case "branch": return 2;
            case "kitchen": return 3;
            case "delivery": return 4;
            case "cashier": return 5;
            case "supadmin": return 99;
            default: return 0;
        }
    }

    private Map<String, Object> mapUserToDto(UsersEntity u) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("user_id", u.getId());
        dto.put("id", u.getId());
        dto.put("name", u.getName());
        dto.put("full_name", u.getName());
        dto.put("email", u.getEmail());
        dto.put("mobile", u.getMobile());
        dto.put("mobile_number", u.getMobile());
        dto.put("role_id", mapRoleToId(u.getRole()));
        dto.put("role", u.getRole());
        dto.put("status", Boolean.TRUE.equals(u.getIsActive()) ? 1 : 0);
        dto.put("is_active", u.getIsActive());
        dto.put("approval_status", u.getApprovalStatus());
        dto.put("approval_notes", u.getApprovalNotes());
        dto.put("gst_number", u.getGstNumber());
        dto.put("city", u.getCity());
        dto.put("state", u.getState());
        dto.put("pincode", u.getPincode());
        dto.put("created_at", u.getCreatedAt());
        dto.put("updated_at", u.getUpdatedAt());
        return dto;
    }

    public Map<String, Object> getAllUsers(String roleId, String search,
            Integer pageNumber, Integer pageSize, String token) throws Exception {

        Authorization.authorizeSupadmin(token);

        List<String> roles = mapRoleIdToRoles(roleId);

        Specification<UsersEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (roles != null && !roles.isEmpty()) {
                predicates.add(cb.lower(root.get("role")).in(roles));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate searchPred = cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("mobile")), pattern));
                predicates.add(searchPred);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("id").descending());
        Page<UsersEntity> page = usersRepository.findAll(spec, pageable);

        // Map entities to DTOs with frontend-expected field names
        List<Map<String, Object>> data = new ArrayList<>();
        for (UsersEntity u : page.getContent()) {
            data.add(mapUserToDto(u));
        }

        // Build meta in the format frontend expects
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("total", page.getTotalElements());
        meta.put("per_page", pageSize);
        meta.put("current_page", pageNumber + 1); // Convert back to 1-based
        meta.put("last_page", page.getTotalPages());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", data);
        response.put("meta", meta);
        return response;
    }

    public List<Map<String, Object>> getUserTree(String search, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        // Get all restaurant-owner users
        Specification<UsersEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(cb.lower(root.get("role")), "restaurant"));
            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("mobile")), pattern)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<UsersEntity> admins = usersRepository.findAll(spec, Sort.by("id").descending());

        List<Map<String, Object>> tree = new ArrayList<>();
        for (UsersEntity admin : admins) {
            // Skip entries without name
            if (admin.getName() == null || admin.getName().trim().isEmpty()) continue;

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("user_id", admin.getId());
            node.put("full_name", admin.getName());
            node.put("email", admin.getEmail());
            node.put("mobile", admin.getMobile());
            node.put("approval_status", admin.getApprovalStatus());
            node.put("is_active", admin.getIsActive());
            node.put("created_at", admin.getCreatedAt());

            // Count child users by role
            List<UsersEntity> children = usersRepository.findByParentId_id(admin.getId());
            long branchCount = children.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "branch".equalsIgnoreCase(u.getRole())).count();
            long kitchenCount = children.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "kitchen".equalsIgnoreCase(u.getRole())).count();
            long deliveryCount = children.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "delivery".equalsIgnoreCase(u.getRole())).count();
            long cashierCount = children.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "cashier".equalsIgnoreCase(u.getRole())).count();

            // Also count grandchildren (branch -> kitchen/cashier/delivery)
            List<UsersEntity> branches = children.stream()
                    .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()) && "branch".equalsIgnoreCase(c.getRole()))
                    .collect(java.util.stream.Collectors.toList());
            for (UsersEntity branch : branches) {
                List<UsersEntity> branchChildren = usersRepository.findByParentId_id(branch.getId());
                kitchenCount += branchChildren.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "kitchen".equalsIgnoreCase(u.getRole())).count();
                deliveryCount += branchChildren.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "delivery".equalsIgnoreCase(u.getRole())).count();
                cashierCount += branchChildren.stream().filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && "cashier".equalsIgnoreCase(u.getRole())).count();
            }

            node.put("branch_count", branchCount);
            node.put("kitchen_count", kitchenCount);
            node.put("delivery_count", deliveryCount);
            node.put("cashier_count", cashierCount);
            tree.add(node);
        }

        return tree;
    }

    public List<Map<String, Object>> getTreeChildren(Long adminId, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        List<UsersEntity> children = usersRepository.findByParentId_id(adminId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (UsersEntity child : children) {
            if (Boolean.TRUE.equals(child.getIsDeleted())) continue;
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("user_id", child.getId());
            node.put("full_name", child.getName());
            node.put("role_id", mapRoleToId(child.getRole()));
            node.put("role", child.getRole());
            node.put("mobile_number", child.getMobile());
            node.put("email", child.getEmail());
            node.put("status", Boolean.TRUE.equals(child.getIsActive()) ? 1 : 0);
            result.add(node);
        }

        return result;
    }

    // ==================== RESTAURANT DETAIL (for drawer) ====================

    public Map<String, Object> getRestaurantDetail(Long adminId, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        UsersEntity admin = usersRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("user_id", admin.getId());
        detail.put("full_name", admin.getName());
        detail.put("email", admin.getEmail());
        detail.put("mobile", admin.getMobile());
        detail.put("role", admin.getRole());
        detail.put("city", admin.getCity());
        detail.put("state", admin.getState());
        detail.put("pincode", admin.getPincode());
        detail.put("gst_number", admin.getGstNumber());
        detail.put("approval_status", admin.getApprovalStatus());
        detail.put("is_active", admin.getIsActive());
        detail.put("created_at", admin.getCreatedAt());

        // Get all children grouped by role
        List<UsersEntity> children = usersRepository.findByParentId_id(adminId);

        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        grouped.put("restaurant", new ArrayList<>());
        grouped.put("branch", new ArrayList<>());
        grouped.put("kitchen", new ArrayList<>());
        grouped.put("delivery", new ArrayList<>());
        grouped.put("cashier", new ArrayList<>());

        for (UsersEntity child : children) {
            if (Boolean.TRUE.equals(child.getIsDeleted())) continue;
            String role = child.getRole() != null ? child.getRole().toLowerCase() : "other";

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("user_id", child.getId());
            node.put("full_name", child.getName());
            node.put("email", child.getEmail());
            node.put("mobile", child.getMobile());
            node.put("role", child.getRole());
            node.put("is_active", child.getIsActive());
            node.put("created_at", child.getCreatedAt());
            node.put("last_login", child.getLastLoginAt());

            if (grouped.containsKey(role)) {
                grouped.get(role).add(node);
            } else {
                // Put unknown roles into restaurant group
                grouped.get("restaurant").add(node);
            }
        }

        // Also get grandchildren (branch -> kitchen/cashier/delivery)
        List<UsersEntity> branches = children.stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()) && "branch".equalsIgnoreCase(c.getRole()))
                .collect(java.util.stream.Collectors.toList());

        for (UsersEntity branch : branches) {
            List<UsersEntity> branchChildren = usersRepository.findByParentId_id(branch.getId());
            for (UsersEntity gc : branchChildren) {
                if (Boolean.TRUE.equals(gc.getIsDeleted())) continue;
                String role = gc.getRole() != null ? gc.getRole().toLowerCase() : "other";

                Map<String, Object> node = new LinkedHashMap<>();
                node.put("user_id", gc.getId());
                node.put("full_name", gc.getName());
                node.put("email", gc.getEmail());
                node.put("mobile", gc.getMobile());
                node.put("role", gc.getRole());
                node.put("is_active", gc.getIsActive());
                node.put("created_at", gc.getCreatedAt());
                node.put("last_login", gc.getLastLoginAt());
                node.put("branch_name", branch.getName());
                node.put("branch_id", branch.getId());

                if (grouped.containsKey(role)) {
                    grouped.get(role).add(node);
                }
            }
        }

        detail.put("users", grouped);

        // Summary counts
        Map<String, Object> counts = new LinkedHashMap<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
            counts.put(entry.getKey(), entry.getValue().size());
        }
        detail.put("counts", counts);

        return detail;
    }

    public String updateUser(Long userId, Map<String, Object> data, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        UsersEntity user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (data.containsKey("name")) user.setName((String) data.get("name"));
        if (data.containsKey("email")) user.setEmail((String) data.get("email"));
        if (data.containsKey("mobile")) user.setMobile((String) data.get("mobile"));
        if (data.containsKey("city")) user.setCity((String) data.get("city"));
        if (data.containsKey("state")) user.setState((String) data.get("state"));
        if (data.containsKey("pincode")) user.setPincode((String) data.get("pincode"));
        if (data.containsKey("gst_number")) user.setGstNumber((String) data.get("gst_number"));
        if (data.containsKey("is_active")) {
            Object v = data.get("is_active");
            user.setIsActive(v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(v.toString()));
        }

        user.setUpdatedAt(LocalDateTime.now());
        usersRepository.save(user);
        return "User updated successfully";
    }

    // ==================== SUBSCRIPTION PLANS ====================

    public Map<String, Object> getAllPlans(String search, Integer pageNumber, Integer pageSize, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        Specification<SubscriptionPlanEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("planName")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("sortOrder").ascending().and(Sort.by("planId").descending()));
        Page<SubscriptionPlanEntity> page = subscriptionPlanRepository.findAll(spec, pageable);

        // Wrap each plan with active_subscribers count (placeholder)
        List<Map<String, Object>> content = new ArrayList<>();
        for (SubscriptionPlanEntity plan : page.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("plan", plan);
            item.put("active_subscribers", 0);
            content.add(item);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        return response;
    }

    public SubscriptionPlanEntity getPlanById(Long id, String token) throws Exception {
        Authorization.authorizeSupadmin(token);
        return subscriptionPlanRepository.findByPlanIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));
    }

    public String createPlan(Map<String, Object> data, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        SubscriptionPlanEntity plan = new SubscriptionPlanEntity();
        mapPlanFields(plan, data);
        subscriptionPlanRepository.save(plan);
        return "Plan created successfully";
    }

    public String updatePlan(Long id, Map<String, Object> data, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        SubscriptionPlanEntity plan = subscriptionPlanRepository.findByPlanIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));

        mapPlanFields(plan, data);
        subscriptionPlanRepository.save(plan);
        return "Plan updated successfully";
    }

    public String deletePlan(Long id, String token) throws Exception {
        Authorization.authorizeSupadmin(token);

        SubscriptionPlanEntity plan = subscriptionPlanRepository.findByPlanIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));

        plan.setIsDeleted(true);
        subscriptionPlanRepository.save(plan);
        return "Plan deleted successfully";
    }

    private void mapPlanFields(SubscriptionPlanEntity plan, Map<String, Object> data) {
        if (data.containsKey("planName")) plan.setPlanName((String) data.get("planName"));
        if (data.containsKey("description")) plan.setDescription((String) data.get("description"));
        if (data.containsKey("price")) {
            Object price = data.get("price");
            plan.setPrice(price instanceof Number ? BigDecimal.valueOf(((Number) price).doubleValue()) : new BigDecimal(price.toString()));
        }
        if (data.containsKey("durationDays")) {
            Object d = data.get("durationDays");
            plan.setDurationDays(d instanceof Number ? ((Number) d).intValue() : Integer.parseInt(d.toString()));
        }
        if (data.containsKey("maxBranch") && data.get("maxBranch") != null) {
            Object v = data.get("maxBranch");
            plan.setMaxBranch(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("maxKitchen") && data.get("maxKitchen") != null) {
            Object v = data.get("maxKitchen");
            plan.setMaxKitchen(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("maxDeliveryBoy") && data.get("maxDeliveryBoy") != null) {
            Object v = data.get("maxDeliveryBoy");
            plan.setMaxDeliveryBoy(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("features")) plan.setFeatures((String) data.get("features"));
        if (data.containsKey("isActive")) {
            Object v = data.get("isActive");
            plan.setIsActive(v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(v.toString()));
        }
        if (data.containsKey("sortOrder")) {
            Object v = data.get("sortOrder");
            plan.setSortOrder(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
        }
    }
}
