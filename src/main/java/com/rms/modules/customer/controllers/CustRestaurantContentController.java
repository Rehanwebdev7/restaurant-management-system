package com.rms.modules.customer.controllers;

import com.rms.common.entities.RestaurantContentBlockEntity;
import com.rms.common.response.ApiResponse;
import com.rms.modules.customer.services.CustRestaurantContentService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public content-block endpoint for the customer website.
 *
 * ONE endpoint powers 12+ frontend sections (testimonials, team, awards,
 * facilities, events, FAQs, departments, hours notes, reach info, help
 * categories, Instagram posts, stats) via the `page` path segment plus an
 * optional `section` query filter.
 *
 * Tenant resolution: reuses the same Host-header lookup pattern as
 * `CustBrandingController` — no auth required, tenant inferred from domain.
 *
 * Example:
 *   GET /api/customer/content/page/HOME?section=TESTIMONIAL
 *   → returns all active TESTIMONIAL blocks for the tenant that owns this domain
 */
@RestController
@RequestMapping("/api/customer/content")
public class CustRestaurantContentController {

    @Autowired
    private CustRestaurantContentService contentService;

    @GetMapping("/page/{page}")
    public ResponseEntity<Object> getContent(
            @PathVariable String page,
            @RequestParam(value = "section", required = false) String section,
            HttpServletRequest req) {
        try {
            String host = CustBrandingController.resolveHost(req);
            List<RestaurantContentBlockEntity> blocks =
                    contentService.getContentForHost(host, page.toUpperCase(),
                            section != null ? section.toUpperCase() : null);
            return ApiResponse.responseBuilder(blocks, "SUCCESS", HttpStatus.OK,
                    "Content blocks retrieved");
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.responseBuilder(null, "FAILURE",
                    HttpStatus.INTERNAL_SERVER_ERROR, "Unable to fetch content");
        }
    }
}
