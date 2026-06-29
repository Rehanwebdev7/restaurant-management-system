package com.rms.modules.customer.controllers;

import com.rms.common.entities.BusinessSettingEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.repositories.BusinessSettingRepository;
import com.rms.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Customer-facing branding endpoint — multi-tenant aware.
 *
 * The platform is multi-tenant SaaS: each restaurant maps to its own domain
 * via `business_settings.domain_url`. When a customer lands on
 * `spicegarden.com` the browser's Host header drives the lookup so the API
 * returns Spice Garden's branding + restaurantId. Same backend, same code,
 * different tenant — keyed entirely by the requesting domain.
 *
 * Resolution order:
 *   1. `X-Forwarded-Host` (set by Nginx / Cloudflare in front of the API).
 *   2. `Host` (raw direct hit).
 *   3. Strip leading `www.`, port, and protocol → match `business_settings.domain_url`.
 *   4. If still no match, fall back to the canonical `localhost` mapping
 *      (DataInitializer keeps it pointed at Spice Garden for dev).
 *   5. Last-resort: first row of business_settings — the legacy single-tenant
 *      behaviour. Logged so we can spot domains we forgot to onboard.
 *
 * Response carries `restaurantId` so the frontend can scope every other
 * customer-side fetch (branches, sliders, menu) to that tenant.
 */
@RestController
@RequestMapping("/api/customer/branding")
public class CustBrandingController {

	@Autowired
	private BusinessSettingRepository businessSettingRepository;

	@GetMapping("")
	public ResponseEntity<Object> getBranding(HttpServletRequest req) {
		return buildBrandingResponse(req);
	}

	@GetMapping("/public")
	public ResponseEntity<Object> getBrandingPublic(HttpServletRequest req) {
		return buildBrandingResponse(req);
	}

	private ResponseEntity<Object> buildBrandingResponse(HttpServletRequest req) {
		try {
			String host = resolveHost(req);
			BusinessSettingEntity setting = resolveTenant(host);
			boolean fallback = setting == null;

			Map<String, Object> data = new LinkedHashMap<>();
			if (setting != null) {
				UsersEntity restaurant = setting.getRestaurantId();
				data.put("restaurantId", restaurant != null ? restaurant.getId() : null);
				data.put("restaurantName", firstNonBlank(
						setting.getOrganisationName(),
						setting.getBusinessName(),
						restaurant != null ? restaurant.getName() : null,
						"Spice Garden"));
				data.put("tagline", "STEAKHOUSE");
				data.put("logoUrl", firstNonBlank(setting.getLogoUrl(), setting.getDriveLogoUrl(), null));
				data.put("primaryColor", firstNonBlank(setting.getPrimaryColor(), "#C9A96E"));
				data.put("domainResolved", true);
				data.put("matchedDomain", setting.getDomainUrl());
			} else {
				data.put("restaurantId", null);
				data.put("restaurantName", "Spice Garden");
				data.put("tagline", "STEAKHOUSE");
				data.put("logoUrl", null);
				data.put("primaryColor", "#C9A96E");
				data.put("domainResolved", false);
				data.put("matchedDomain", null);
			}
			data.put("requestHost", host);

			if (fallback) {
				System.out.println("[BRANDING] no domain match for host='" + host + "' — returning default tenant");
			}

			return ApiResponse.responseBuilder(data, "SUCCESS", HttpStatus.OK, "Branding retrieved successfully");
		} catch (Exception e) {
			e.printStackTrace();
			return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to fetch branding");
		}
	}

	/**
	 * Resolve the BusinessSettings row that owns the requesting host. Tries
	 * an exact match first, then strips `www.` so `www.spicegarden.com` and
	 * `spicegarden.com` resolve to the same tenant. If no match, falls back
	 * to whatever row maps to `localhost` (dev default), and finally to the
	 * first row in the table (legacy single-tenant).
	 */
	private BusinessSettingEntity resolveTenant(String host) {
		if (host != null && !host.isBlank()) {
			Optional<BusinessSettingEntity> exact = businessSettingRepository.findByDomainUrl(host);
			if (exact.isPresent()) return exact.get();

			String stripped = host.startsWith("www.") ? host.substring(4) : host;
			if (!stripped.equals(host)) {
				Optional<BusinessSettingEntity> noWww = businessSettingRepository.findByDomainUrl(stripped);
				if (noWww.isPresent()) return noWww.get();
			}
		}
		Optional<BusinessSettingEntity> localhostMapping = businessSettingRepository.findByDomainUrl("localhost");
		if (localhostMapping.isPresent()) return localhostMapping.get();

		List<BusinessSettingEntity> all = businessSettingRepository.findAll();
		return all.isEmpty() ? null : all.get(0);
	}

	/**
	 * Read the originating host. `X-Forwarded-Host` is set by every CDN /
	 * reverse proxy we run in front of the API in prod; in dev where the
	 * browser hits Spring Boot directly we fall back to `Host`.
	 */
	static String resolveHost(HttpServletRequest req) {
		if (req == null) return null;
		String fwd = req.getHeader("X-Forwarded-Host");
		String host = (fwd != null && !fwd.isBlank()) ? fwd : req.getHeader("Host");
		if (host == null || host.isBlank()) return null;
		// Strip protocol if anyone passes a full URL by mistake.
		int proto = host.indexOf("://");
		if (proto >= 0) host = host.substring(proto + 3);
		// Strip port — domain_url in business_settings is always bare hostname.
		int colon = host.indexOf(':');
		if (colon >= 0) host = host.substring(0, colon);
		// X-Forwarded-Host can be a comma-separated chain; first one is the
		// client's view.
		int comma = host.indexOf(',');
		if (comma >= 0) host = host.substring(0, comma).trim();
		return host.toLowerCase();
	}

	private static String firstNonBlank(String... candidates) {
		for (String c : candidates) {
			if (c != null && !c.isBlank()) {
				return c;
			}
		}
		return null;
	}
}
