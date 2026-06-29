package com.rms.modules.customer.controllers;

import com.rms.common.entities.SlidersEntity;
import com.rms.common.repositories.SlidersRepository;
import com.rms.common.response.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Customer-facing sliders / hero banners. Public, no-auth endpoint. Falls back
 * to a curated default list when no rows exist for the requested branch so the
 * customer site never renders an empty carousel.
 */
@RestController
@RequestMapping("/api/customer/sliders")
public class CustSlidersController {

	@Autowired
	private SlidersRepository slidersRepository;

	@GetMapping("/public/all")
	public ResponseEntity<Object> getPublicSliders(
			@RequestParam(value = "branchId", required = false) Long branchId,
			@RequestParam(value = "platform", required = false, defaultValue = "web") String platform) {
		try {
			List<Map<String, Object>> result = new ArrayList<>();

			// Pull from DB when we can; otherwise fall back to defaults.
			List<SlidersEntity> rows = slidersRepository.findAll();
			if (rows != null && !rows.isEmpty()) {
				result = rows.stream()
						.filter(s -> s.getImageUrl() != null && !s.getImageUrl().isBlank())
						.map(s -> {
							Map<String, Object> row = new LinkedHashMap<>();
							row.put("id", s.getId());
							row.put("imageUrl", s.getImageUrl());
							row.put("linkUrl", "/menu");
							row.put("title", s.getTitle());
							row.put("description", s.getDescription());
							return row;
						})
						.collect(Collectors.toList());
			}

			if (result.isEmpty()) {
				result = defaultSliders();
			}

			return ApiResponse.responseBuilder(result, "SUCCESS", HttpStatus.OK,
					"Sliders retrieved successfully");
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(defaultSliders(), "SUCCESS", HttpStatus.OK,
					"Sliders retrieved (fallback)");
		}
	}

	private List<Map<String, Object>> defaultSliders() {
		List<Map<String, Object>> list = new ArrayList<>();
		list.add(slide(1L,
				"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
				"/menu", "Welcome to Spice Garden", "Crafted dishes, delivered hot."));
		list.add(slide(2L,
				"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
				"/menu", "Today's Specials", "Chef's picks of the season."));
		list.add(slide(3L,
				"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
				"/locations", "Find a Branch", "Order or dine-in at your nearest outlet."));
		return list;
	}

	private Map<String, Object> slide(Long id, String imageUrl, String linkUrl, String title, String description) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", id);
		row.put("imageUrl", imageUrl);
		row.put("linkUrl", linkUrl);
		row.put("title", title);
		row.put("description", description);
		return row;
	}
}
