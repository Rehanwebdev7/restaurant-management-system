//
//package com.golddekho.configuration;
//
//import jakarta.servlet.Filter;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.FilterConfig;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.ServletRequest;
//import jakarta.servlet.ServletResponse;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import org.apache.logging.log4j.LogManager;
//import org.apache.logging.log4j.Logger;
//
//import java.io.BufferedReader;
//import java.io.IOException;
//import java.io.InputStreamReader;
//import java.util.Arrays;
//import java.util.List;
//
//public class CustomRequestFilter implements Filter {
//
//	private static final Logger logger = LogManager.getLogger(CustomRequestFilter.class);
//
//	@Override
//	public void init(FilterConfig filterConfig) throws ServletException {
//		// Initialization logic, if needed
//	}
//
//	@Override
//	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
//			throws IOException, ServletException {
//
//		HttpServletRequest httpRequest = (HttpServletRequest) request;
//		HttpServletResponse httpResponse = (HttpServletResponse) response;
//
//		String requestURI = httpRequest.getRequestURI();
//
//		// 1. Ignore favicon
//		if ("/favicon.ico".equals(requestURI)) {
//			chain.doFilter(request, response);
//			return;
//		}
//
//		// 2. Ignore HTML requests (like browser or Thymeleaf responses)
//		String acceptHeader = httpRequest.getHeader("Accept");
//		if (acceptHeader != null && acceptHeader.contains("text/html")) {
//			chain.doFilter(request, response);
//			return;
//		}
//
//		// 3. Skip multipart requests (like file uploads)
//		if (httpRequest.getContentType() != null && httpRequest.getContentType().startsWith("multipart/")) {
//			logger.info("Multipart request detected. Skipping wrapping.");
//			chain.doFilter(request, response);
//			return;
//		}
//
//		// 4. Skip OPTIONS requests (CORS preflight)
//		if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
//			chain.doFilter(request, response);
//			return;
//		}
//
//		// Wrap request for body reading
//		BufferedHttpServletRequestWrapper wrappedRequest = new BufferedHttpServletRequestWrapper(httpRequest);
//
//		// 5. Public API prefixes (no token required)
//		List<String> publicPrefixes = Arrays.asList("/login", "/sendOTP", "/register", "/api/customer/generate-link",
//				"/confirmation", "/update", "/generate_balance_link","/uploads");
//
//		// 6. Check if current URI matches any public prefix
//		boolean isPublic = publicPrefixes.stream().anyMatch(prefix -> requestURI.startsWith(prefix)
//				|| requestURI.equals(prefix) || requestURI.equals(prefix + "/"));
//
//		// 7. Enhanced Token validation for protected routes
//		if (!isPublic) {
//			// Check for token in multiple possible header names
//			String accessToken = httpRequest.getHeader("access_token");
//			if (accessToken == null) {
//				accessToken = httpRequest.getHeader("Authorization");
//				if (accessToken != null && accessToken.startsWith("Bearer ")) {
//					accessToken = accessToken.substring(7);
//				}
//			}
//
//			if (accessToken == null || accessToken.trim().isEmpty()) {
//				logger.warn("Missing access token for protected URI: " + requestURI);
//				logger.warn("Received headers:");
//				httpRequest.getHeaderNames().asIterator().forEachRemaining(headerName -> {
//					logger.warn("Header - " + headerName + ": " + httpRequest.getHeader(headerName));
//				});
//
//				httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 is more appropriate for auth
//																				// failures
//				httpResponse.setContentType("application/json");
//				httpResponse.getWriter().write("{ \"status\": \"FAILURE\", \"statusCode\": 401, "
//						+ "\"message\": \"Please login to continue. Token is missing in the request.\", \"data\": null }");
//				return;
//			}
//
//			// Optional: Add token validation logic here if needed
//			// For example: verify token signature, expiration, etc.
//		}
//
//		// Logging setup
//		logger.info("===== Request Details =====");
//		logger.info("Request URL: " + requestURI);
//		logger.info("Request Method: " + httpRequest.getMethod());
//
//		// Log all headers
//		logger.info("Request Headers:");
//		httpRequest.getHeaderNames().asIterator().forEachRemaining(headerName -> {
//			logger.info("  " + headerName + ": " + httpRequest.getHeader(headerName));
//		});
//
//		// Log request body for POST/PUT
//		if ("POST".equalsIgnoreCase(httpRequest.getMethod()) || "PUT".equalsIgnoreCase(httpRequest.getMethod())) {
//			StringBuilder bodyBuilder = new StringBuilder();
//			try (BufferedReader reader = new BufferedReader(new InputStreamReader(wrappedRequest.getInputStream()))) {
//				String line;
//				while ((line = reader.readLine()) != null) {
//					bodyBuilder.append(line);
//				}
//				if (bodyBuilder.length() > 0) {
//					logger.info("Request Body: " + bodyBuilder.toString());
//				}
//			}
//		}
//
//		// Wrap response for logging
//		CustomHttpServletResponseWrapper responseWrapper = new CustomHttpServletResponseWrapper(httpResponse);
//
//		// Process the request
//		chain.doFilter(wrappedRequest, responseWrapper);
//
//		// Log response details
//		logger.info("===== Response Details =====");
//		logger.info("Response Status: " + responseWrapper.getStatus());
//
//		String responseBody = responseWrapper.getResponseBody();
//		if (responseBody != null && !responseBody.isEmpty()) {
//			logger.info("Response Body:\n" + responseBody);
//		} else {
//			logger.info("Response Body is empty");
//		}
//
//		logger.info(
//				"===== End of Request/Response ===================================================================================================");
//	}
//}


package com.rms.configuration;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;

public class CustomRequestFilter implements Filter {

    private static final Logger logger = LogManager.getLogger(CustomRequestFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization logic, if needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String requestURI = httpRequest.getRequestURI();
        logger.info("Request URI: " + requestURI);

        // 1️⃣ Add CORS headers FIRST for ALL requests (before any early returns)
        String origin = httpRequest.getHeader("Origin");
        if (origin != null) {
            httpResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            httpResponse.setHeader("Access-Control-Allow-Headers", "*");
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            httpResponse.setHeader("Access-Control-Max-Age", "3600");
        }

        // 2️⃣ Handle OPTIONS preflight — return immediately
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // 3️⃣ Ignore favicon requests
        if ("/favicon.ico".equals(requestURI)) {
            chain.doFilter(request, response);
            return;
        }

        // 4️⃣ Ignore HTML requests (like browser page loads)
        String acceptHeader = httpRequest.getHeader("Accept");
        if (acceptHeader != null && acceptHeader.contains("text/html")) {
            chain.doFilter(request, response);
            return;
        }

        // 5️⃣ Skip multipart requests (wrapping only, CORS already added above)
        if (httpRequest.getContentType() != null && httpRequest.getContentType().startsWith("multipart/")) {
            logger.info("Multipart request detected. Skipping wrapping.");
            chain.doFilter(request, response);
            return;
        }

        // 6️⃣ Wrap request for body reading
        BufferedHttpServletRequestWrapper wrappedRequest = new BufferedHttpServletRequestWrapper(httpRequest);

        // 7️⃣ Define public endpoints (no token required)
        List<String> publicEndpoints = Arrays.asList(
                "/sendOTP", 
                "/verifyOTP",
                "/login", 
                "/decrypt",
                "/register", 
                "/api/customer/generate-link",
                "/confirmation", 
                "/update", 
                "/generate_balance_link",
                "/verify_otp",
                "/send_otp",
                "/uploads",
                "/signup",
                "/api/public/customer",
                "/api/global/",
                "/api/ccavenue",
                "/api/admin/file-migration"
        );

        boolean isPublic = publicEndpoints.stream()
                .anyMatch(endpoint -> requestURI.endsWith(endpoint) || requestURI.contains(endpoint));

        // 8️⃣ Token validation for protected endpoints
        if (!isPublic) {
            String accessToken = httpRequest.getHeader("access_token");
            if (accessToken == null) {
                accessToken = httpRequest.getHeader("Authorization");
                if (accessToken != null && accessToken.startsWith("Bearer ")) {
                    accessToken = accessToken.substring(7);
                }
            }

            if (accessToken == null || accessToken.trim().isEmpty()) {
                logger.warn("Missing access token for protected URI: " + requestURI);
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"status\":\"FAILURE\",\"statusCode\":401," +
                        "\"message\":\"Please login to continue. Token is missing in the request.\",\"data\":null}");
                return;
            }

            // Optional: Token validation logic can be added here (JWT verify, expiry check, etc.)
        }

        // 9️⃣ Logging request details
        logger.info("===== Request Details =====");
        logger.info("Method: " + httpRequest.getMethod());
        logger.info("Request Headers:");
        httpRequest.getHeaderNames().asIterator().forEachRemaining(headerName -> 
            logger.info("  " + headerName + ": " + httpRequest.getHeader(headerName))
        );

        // Log request body for POST/PUT
        if ("POST".equalsIgnoreCase(httpRequest.getMethod()) || "PUT".equalsIgnoreCase(httpRequest.getMethod())) {
            StringBuilder bodyBuilder = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(wrappedRequest.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    bodyBuilder.append(line);
                }
            }
            if (bodyBuilder.length() > 0) {
                logger.info("Request Body: " + bodyBuilder.toString());
            }
        }

        // 🔟 Wrap response for logging
        //CustomHttpServletResponseWrapper responseWrapper = new CustomHttpServletResponseWrapper(httpResponse);

        // 1️⃣1️⃣ Continue filter chain
        chain.doFilter(wrappedRequest, httpResponse);

        // 1️⃣2️⃣ Logging response
        //logger.info("===== Response Details =====");
        //logger.info("Response Status: " + responseWrapper.getStatus());
        //String responseBody = responseWrapper.getResponseBody();
        //if (responseBody != null && !responseBody.isEmpty()) {
        //    logger.info("Response Body:\n" + responseBody);
        //} else {
        //    logger.info("Response Body is empty");
        //}
        logger.info("===== End of Request/Response ===================================================================");
    }

    @Override
    public void destroy() {
        // Cleanup logic, if needed
    }
}

