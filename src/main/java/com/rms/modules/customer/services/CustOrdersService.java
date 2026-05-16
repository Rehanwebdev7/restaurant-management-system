package com.rms.modules.customer.services;

import com.rms.common.Constant;
import com.rms.common.apis.GoogleMapsService;
import com.rms.common.entities.AddonsItemsEntity;
import com.rms.common.entities.CustomerDeliveryAddressesEntity;
import com.rms.common.entities.CustomersEntity;
import com.rms.common.entities.DeliveryZonesEntity;
import com.rms.common.entities.MenuItemsEntity;
import com.rms.common.entities.OrderAddonsItemsEntity;
import com.rms.common.entities.OrderItemsEntity;
import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.SectionEntity;
import com.rms.common.entities.TableBookingEntity;
import com.rms.common.entities.UsersEntity;
import com.rms.common.entities.UsersProfileEntity;
import com.rms.common.repositories.OrdersRepository;
import com.rms.common.serviceImplement.OrdersServiceIMP;
import com.rms.common.util.CacheData;
import com.rms.common.util.CouponManagementUtil;
import com.rms.common.util.DiningTableReleaseScheduler;
import com.rms.common.util.GstCalculator;
import com.rms.common.util.TokenUtil;
import com.rms.configuration.Authorization;
import com.rms.modules.customer.public_routes.CustPublicService;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import com.rms.common.repositories.CustomersRepository;
import com.rms.common.repositories.DeliveryZonesRepository;
import com.rms.common.repositories.MenuItemsRepository;
import com.rms.common.repositories.OrderAddonsItemsRepository;
import com.rms.common.repositories.OrderItemsRepository;
import com.rms.common.repositories.AddonsItemsRepository;
import com.rms.common.repositories.CustomerDeliveryAddressesRepository;
import com.rms.common.repositories.RestaurantBranchRepository;
import com.rms.common.repositories.ReferralContactsRepository;
import com.rms.common.repositories.SectionRepository;
import com.rms.common.repositories.TableBookingRepository;
import com.rms.common.repositories.DiningTablesRepository;
import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.repositories.UsersProfileRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;
import com.rms.common.repositories.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import org.springframework.data.domain.Sort;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Optional;
import java.time.LocalTime;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.Arrays;

@Service
@Qualifier("custOrdersService")
public class CustOrdersService implements OrdersServiceIMP {

	private final OrdersRepository ordersrepository;
	private final CustomersRepository customersrepository;
	private final CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository;
	private final RestaurantBranchRepository restaurantbranchrepository;
	private final UsersRepository usersrepository;

	@Autowired
	private UsersRepository usersRepository;

	@Autowired
	private OrdersRepository ordersRepository;

	@Autowired
	private OrderAddonsItemsRepository orderAddonsItemsRepository;

	@Autowired
	private OrderItemsRepository orderItemsRepository;

	@Autowired
	private TableBookingRepository tableBookingRepository;

	@Autowired
	private DiningTablesRepository diningtablesrepository;

	@Autowired
	private MenuItemsRepository menuItemsRepository;

	@Autowired
	private AddonsItemsRepository addonsItemsRepository;

	@Autowired
	private SectionRepository sectionRepository;

	@Autowired
	private CacheData cacheData;

	@Autowired
	private DiningTableReleaseScheduler diningTableReleaseScheduler;

	@Autowired
	private CustPublicService custPublicService;

	@Autowired
	@Qualifier("custCouponService")
	private CustCouponService custCouponService;

	@Autowired
	private CustReferralService referralService;

	@Autowired
	private ReferralContactsRepository referralContactsRepository;

	@Autowired
	private com.rms.common.repositories.WalletTransactionsRepository walletTransactionsRepository;

	@Autowired
	private com.rms.common.services.SubscriptionAccessService subscriptionAccessService;

	@Autowired
	private CustCustomerDeliveryAddressesService customerDeliveryAddressesService;
	@Autowired
	private DeliveryZonesRepository deliveryZonesRepository;

	@Autowired
	private GoogleMapsService gooleGoogleMapsService;
	@Autowired
	private Constant constant;

	public CustOrdersService(OrdersRepository ordersrepository, CustomersRepository customersrepository,
			CustomerDeliveryAddressesRepository customerdeliveryaddressesrepository,
			RestaurantBranchRepository restaurantbranchrepository, UsersRepository usersrepository) {
		this.ordersrepository = ordersrepository;
		this.customersrepository = customersrepository;
		this.customerdeliveryaddressesrepository = customerdeliveryaddressesrepository;
		this.restaurantbranchrepository = restaurantbranchrepository;
		this.usersrepository = usersrepository;
	}

	@Autowired
	private TokenUtil tokenUtil;

	@Autowired
	private UsersProfileRepository usersProfileRepository;

	public <T, ID> T fetchReferenceById(T inputRef, JpaRepository<T, ID> repo, String notFoundMessage) {
		if (inputRef != null) {
			try {
				Field idField = inputRef.getClass().getDeclaredField("id");
				idField.setAccessible(true);
				Object idValue = idField.get(inputRef);
				if (idValue != null) {
					return repo.findById((ID) idValue).orElseThrow(() -> new RuntimeException(notFoundMessage));
				} else {
					throw new RuntimeException("Foreign key ID is null");
				}
			} catch (NoSuchFieldException | IllegalAccessException e) {
				throw new RuntimeException("Invalid reference structure: " + e.getMessage());
			}
		}
		return null;
	}

//	***********************************
	public Map<String, Object> getDeliveryLocation(Integer deliveryId, Long branchId, Long addressid) {

		Double originLat = null;
		Double originLng = null;
		Double destLat;
		Double destLng;

		// ================= DESTINATION =================
		CustomerDeliveryAddressesEntity existingEntity = customerdeliveryaddressesrepository.findById(addressid)
				.orElseThrow(() -> new RuntimeException("Address not found"));

		destLat = existingEntity.getLatitude();
		destLng = existingEntity.getLongitude();

		// ================= FIRST PRIORITY → DELIVERY =================
		Map<String, Object> data = cacheData.getLocation(deliveryId);

		if (data != null && data.get("lat") != null && data.get("long") != null) {

			originLat = parseDouble(data.get("lat"));
			originLng = parseDouble(data.get("long"));

			System.out.println("📍 Using DELIVERY location");

		} else {

			// ================= FALLBACK → BRANCH =================
			System.out.println("⚠️ Delivery location not found, using BRANCH location");

			UsersProfileEntity branchRecord = usersProfileRepository.findByRestaurantId_id(branchId);

			if (branchRecord == null || branchRecord.getLatitude() == null || branchRecord.getLongitude() == null) {

				throw new RuntimeException("Branch location not found");
			}

			originLat = branchRecord.getLatitude();
			originLng = branchRecord.getLongitude();
		}

		// ================= GOOGLE MAPS =================
		return gooleGoogleMapsService.getRoadDistanceAndTime(originLat, originLng, destLat, destLng);
	}

	private Double parseDouble(Object value) {
		if (value == null)
			return null;

		if (value instanceof Number) {
			return ((Number) value).doubleValue();
		}

		if (value instanceof String) {
			return Double.parseDouble((String) value);
		}

		throw new RuntimeException("Invalid latitude/longitude value: " + value);
	}

	private LocalDateTime resolveBookingDateTime(TableBookingEntity booking, LocalDateTime now) {
		LocalDate date = booking.getBookingDate() != null ? booking.getBookingDate() : now.toLocalDate();
		LocalTime time = booking.getBookingTime() != null
				? booking.getBookingTime().withSecond(0).withNano(0)
				: now.toLocalTime().withSecond(0).withNano(0);
		return LocalDateTime.of(date, time);
	}

	private int parseMinutes(String value, int fallback) {
		if (value == null || value.isBlank()) return fallback;
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException e) {
			return fallback;
		}
	}

	private UsersProfileEntity getProfileForBooking(TableBookingEntity booking) {
		if (booking == null || booking.getTableId() == null || booking.getTableId().getRestaurantId() == null) {
			return null;
		}
		Long restaurantId = booking.getTableId().getRestaurantId().getId();
		if (restaurantId == null) return null;
		return usersProfileRepository.findFirstByRestaurantId_id(restaurantId);
	}

//	public Map<String, Object> getOrdersWithFiltersForCustomer(String token) throws Exception {
//
//	    System.out.println("\n================= CUSTOMER ORDER LIST START =================");
//
//	    // 🔐 CUSTOMER AUTH
//	    Authorization.authorizeCustomer(token);
//	    System.out.println("[AUTH] ✔ Customer authorized");
//
//	    // 🔓 TOKEN → CUSTOMER
//	    tokenUtil.decryptAndStoreToken(token);
//	    Long customerId = tokenUtil.getCurrentUserId().longValue();
//	    Long restaurantId = tokenUtil.getPatentId() != null
//	            ? tokenUtil.getPatentId().longValue()
//	            : null;
//	    tokenUtil.clearTokenData();
//
//	    if (restaurantId == null) {
//	        throw new RuntimeException("Restaurant not found in token");
//	    }
//
//	    System.out.println("[TOKEN] Customer ID   : " + customerId);
//	    System.out.println("[TOKEN] Restaurant ID : " + restaurantId);
//
//	    CustomersEntity customer = customersrepository.findById(customerId)
//	            .orElseThrow(() -> new RuntimeException("Customer not found"));
//
//	    UsersEntity restaurant = usersRepository.findById(restaurantId)
//	            .orElseThrow(() -> new RuntimeException("Restaurant not found"));
//
//	    // ================= SPECIFICATION (ONLY REQUIRED LOGIC) =================
//	    Specification<OrdersEntity> spec = (root, query, cb) -> {
//
//	        List<Predicate> predicates = new ArrayList<>();
//
//	        Join<OrdersEntity, CustomersEntity> customerJoin =
//	                root.join("customerId", JoinType.INNER);
//
//	        Join<OrdersEntity, UsersEntity> restaurantJoin =
//	                root.join("restaurantId", JoinType.INNER);
//
//	        // ✔️ customer filter
//	        predicates.add(cb.equal(customerJoin.get("id"), customer.getId()));
//
//	        // ✔️ restaurant filter
//	        predicates.add(cb.equal(restaurantJoin.get("id"), restaurant.getId()));
//
//	        // 🔥 GROUP BY menuItemId
//	        query.groupBy(root.get("menuItemId"));
//
//	        System.out.println("[QUERY] GROUP BY menuItemId applied");
//
//	        return cb.and(predicates.toArray(new Predicate[0]));
//	    };
//
//	    // ================= FETCH DATA =================
//	    List<OrdersEntity> orders = ordersRepository.findAll(spec);
//
//	    System.out.println("[DB] Unique menu item orders found : " + orders.size());
//
//	    // ================= RESPONSE =================
//	    Map<String, Object> response = new LinkedHashMap<>();
//	    response.put("totalRecords", orders.size());
//	    response.put("records", orders);
//
//	    System.out.println("=============== CUSTOMER ORDER LIST END ===============\n");
//
//	    return response;
//	}

//	*****************************

	public Map<String, Object> getOrdersWithFiltersForCustomer(LocalDate fromDate, LocalDate toDate, String status,
			String searchValue, Integer pageNumber, Integer pageSize, String token) throws Exception {

		System.out.println("\n================= CUSTOMER ORDER SEARCH START =================");

		// 🔐 CUSTOMER AUTH
		System.out.println("[STEP 1] Authorizing customer...");
		Authorization.authorizeCustomer(token);
		System.out.println("[AUTH] ✔ Customer authorized");

		// 🔓 TOKEN → CUSTOMER
		System.out.println("[STEP 2] Decrypting token...");
		tokenUtil.decryptAndStoreToken(token);
		Long customerId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("[TOKEN] Customer ID : " + customerId);

		// ================= CUSTOMER ENTITY =================
		System.out.println("[STEP 3] Fetching customer entity...");
		CustomersEntity customer = customersrepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found from token"));
		System.out.println("[DB] ✔ Customer loaded");

		// ================= RESTAURANT FROM TOKEN =================
		System.out.println("[STEP 4] Extracting restaurant from token...");
		Long restaurantId = tokenUtil.getPatentId() != null ? tokenUtil.getPatentId().longValue() : null;
		if (restaurantId == null && customer.getUserId() != null) {
			restaurantId = customer.getUserId().getId();
		}

		if (restaurantId == null) {
			throw new RuntimeException("Restaurant not found in token");
		}

		UsersEntity restaurant = usersRepository.findById(restaurantId)
				.orElseThrow(() -> new RuntimeException("Restaurant not found"));

		System.out.println("[TOKEN] Restaurant ID : " + restaurantId);

		// ================= SPECIFICATION =================
		System.out.println("[STEP 5] Building search specification...");

		Specification<OrdersEntity> spec = (root, query, cb) -> {

			List<Predicate> predicates = new ArrayList<>();

			// ================= JOINS =================
			Join<OrdersEntity, CustomersEntity> customerJoin = root.join("customerId", JoinType.INNER);

			Join<OrdersEntity, UsersEntity> restaurantJoin = root.join("restaurantId", JoinType.INNER);

			Join<OrdersEntity, UsersEntity> branchJoin = root.join("branchId", JoinType.LEFT);

			// ================= CUSTOMER FILTER =================
			predicates.add(cb.equal(customerJoin.get("id"), customer.getId()));

			// ================= RESTAURANT FILTER =================
			predicates.add(cb.equal(restaurantJoin.get("id"), restaurant.getId()));

			// ================= DATE FILTER =================
			if (fromDate != null && toDate != null) {
				System.out.println("[FILTER] Date range applied : " + fromDate + " → " + toDate);

				predicates
						.add(cb.between(root.get("createdAt"), fromDate.atStartOfDay(), toDate.atTime(LocalTime.MAX)));
			} else {
				System.out.println("[FILTER] Date filter skipped");
			}

			// ================= STATUS FILTER =================
			if (status != null && !status.trim().isEmpty()) {
				System.out.println("[FILTER] Status = " + status);
				predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
			} else {
				System.out.println("[FILTER] Status filter skipped");
			}

			// ================= SEARCH FILTER =================
			if (searchValue != null && !searchValue.trim().isEmpty()) {

				System.out.println("[FILTER] Search keyword = " + searchValue);

				String pattern = "%" + searchValue.toLowerCase() + "%";
				List<Predicate> searchPredicates = new ArrayList<>();

				searchPredicates.add(cb.like(cb.lower(root.get("orderNumber")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("orderType")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentStatus")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("paymentMethod")), pattern));

				searchPredicates.add(cb.like(cb.lower(root.get("customerName")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerPhone")), pattern));
				searchPredicates.add(cb.like(cb.lower(root.get("customerEmail")), pattern));

				try {
					BigDecimal amount = new BigDecimal(searchValue);
					searchPredicates.add(cb.equal(root.get("totalAmount"), amount));
					System.out.println("[FILTER] Amount search applied : ₹" + amount);
				} catch (Exception ignored) {
				}

				searchPredicates.add(cb.like(cb.lower(branchJoin.get("name")), pattern));

				predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));

			} else {
				System.out.println("[FILTER] Search filter skipped");
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		// ================= PAGINATION =================
		System.out.println("[STEP 6] Applying pagination...");
//		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize);
		Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), pageSize, Sort.by(Sort.Direction.DESC, "id"));

		Page<OrdersEntity> page = ordersRepository.findAll(spec, pageable);

		System.out.println("[DB] Orders fetched : " + page.getTotalElements());

		// ================= RESPONSE =================
		System.out.println("[STEP 7] Preparing response...");

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());

		System.out.println("=============== CUSTOMER ORDER SEARCH END ===============\n");

		return response;
	}

//	@Transactional(rollbackFor = Exception.class)
//	public String addOrderss(Map<String, Object> payload, String token) throws Exception {
//
//		System.out.println("\n==================== ORDER CREATION START ====================");
//
//		// 🔐 AUTHENTICATION
//		Authorization.authorizeCustomer(token);
//		System.out.println("AUTH ✔ Cashier Authorized");
//
//		// 🔓 TOKEN DATA EXTRACTION
//		tokenUtil.decryptAndStoreToken(token);
//		Long cashierId = tokenUtil.getCurrentUserId().longValue();
////	    Long branchId = tokenUtil.getBranchId().longValue();
//
//		System.out.println("Cashier ID       : " + cashierId);
////	    System.out.println("Branch ID (TOKEN): " + branchId);
//
//		// 🔍 FETCH CASHIER DETAILS
//		CustomersEntity customer = customersrepository.findById(cashierId)
//				.orElseThrow(() -> new RuntimeException("Cashier not found"));
//
////	    // 🔍 FETCH BRANCH DETAILS
////	    UsersEntity branch = cashier.getUserId();
////	    if (branch == null)
////	        throw new RuntimeException("Branch not mapped with cashier");
//
//		// 🔍 FETCH RESTAURANT DETAILS
//		UsersEntity restaurant = customer.getUserId();
//		if (restaurant == null)
//			throw new RuntimeException("Restaurant not mapped with customer");
//
////	    System.out.println("Branch ID        : " + branch.getId());
//		System.out.println("Restaurant ID    : " + restaurant.getId());
//
//		// ============================================================
//		// 🔥 RESTAURANT TIMING VALIDATION
//		// ============================================================
//		System.out.println("\n---------------- RESTAURANT TIMING CHECK ----------------");
//
//		// Uncomment when timing validation is needed
//		// boolean isOrderAllowed = constant.isOrderAllowedNow(restaurant.getId(),
//		// branch.getId());
//		// if (!isOrderAllowed) {
//		// throw new RuntimeException("Order cannot be placed at this time. Restaurant
//		// is currently closed.");
//		// }
//
//		System.out.println("✔ Restaurant is open. Order placement allowed");
//
//		// ============================================================
//		// 🔥 ORDER TYPE VALIDATION & PROCESSING
//		// ============================================================
//		System.out.println("\n---------------- ORDER TYPE VALIDATION ----------------");
//
//		// Validate and set order type
//		String orderType = payload.get("orderType") != null && !payload.get("orderType").toString().trim().isEmpty()
//				? payload.get("orderType").toString().trim().toUpperCase()
//				: "DINING"; // Default to DINING if not provided
//
//		System.out.println("Order Type Received: " + orderType);
//
//		String paymentMethod = payload.get("paymentMethod") != null
//				&& !payload.get("paymentMethod").toString().trim().isEmpty()
//						? payload.get("paymentMethod").toString().trim().toUpperCase()
//						: "COD";
//
//		// Validate order type
//		if (!Arrays.asList("DELIVERY", "TAKEAWAY", "DINING").contains(orderType)) {
//			throw new RuntimeException("Invalid order type. Allowed values: DELIVERY, TAKEAWAY, DINING");
//		}
//
//		// ================== CUSTOMER DETAILS EXTRACTION ==================
//		Map<String, Object> branchIdMap = (Map<String, Object>) payload.get("branchId");
//		Map<String, Object> sectionMap = (Map<String, Object>) payload.get("sectionId");
//
//		UsersEntity branch = null;
//		if (branchIdMap != null && branchIdMap.get("id") != null) {
//			Long customerId = Long.parseLong(branchIdMap.get("id").toString());
//			branch = usersrepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
//			System.out.println("Customer Found    : " + branch.getId() + " - " + branch.getName());
//		}
//		// ✅ VALIDATION 1: CUSTOMER MANDATORY FOR DELIVERY
//		if (branch == null) {
//			throw new RuntimeException("Branch is mandatory for DELIVERY order");
//		}
//
//		// ================== INITIALIZE VARIABLES ==================
//		CustomerDeliveryAddressesEntity addressExist = null;
//		Double distance = null;
//		DeliveryZonesEntity matchedZone = null;
//		BigDecimal deliveryCharge = BigDecimal.ZERO;
//		TableBookingEntity tableBooking = null;
//
//		// ============================================================
//		// 🔥 CONDITION 1: DELIVERY ORDER PROCESSING
//		// ============================================================
//		if ("DELIVERY".equals(orderType)) {
//			System.out.println("\n---------------- DELIVERY ORDER PROCESSING ----------------");
//
////	        // ✅ VALIDATION 1: CUSTOMER MANDATORY FOR DELIVERY
////	        if (branch == null) {
////	            throw new RuntimeException("Branch is mandatory for DELIVERY order");
////	        }
//
//			// ✅ VALIDATION 2: CUSTOMER ADDRESS MANDATORY
//			Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
//
//			if (custAddressMap == null || custAddressMap.get("id") == null) {
//				throw new RuntimeException("custAddressId is mandatory for DELIVERY order");
//			}
//
//			Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());
//
//			// ✅ FETCH ADDRESS DETAILS
//			addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
//					.orElseThrow(() -> new RuntimeException("Customer delivery address not found"));
//
//			// ✅ VALIDATE ADDRESS BELONGS TO CUSTOMER
//			if (!addressExist.getCustomerId().getId().equals(customer.getId())) {
//				throw new RuntimeException("Address does not belong to the specified customer");
//			}
//
//			System.out.println("Address Found     : " + addressExist.getId() + " - " + addressExist.getAddressLine1());
//
//			// ✅ UPDATE ADDRESS AS DEFAULT
//			CustomerDeliveryAddressesEntity addressUpdatePayload = new CustomerDeliveryAddressesEntity();
//			addressUpdatePayload.setId(custAddressId);
//			addressUpdatePayload.setCustomerId(customer);
//			addressUpdatePayload.setIsDefault(true);
//			addressUpdatePayload.setIsActive(true);
//
//			// Uncomment when service is available
//			// cashCustomerDeliveryAddressesService.updateCustomerDeliveryAddresses(addressUpdatePayload,
//			// token);
//
//			System.out.println("✔ Customer address validated and updated");
//
//			// ✅ VALIDATION 3: DISTANCE MANDATORY
//			if (payload.get("distance") == null) {
//				throw new RuntimeException("Distance is required for DELIVERY order");
//			}
//
//			// ✅ EXTRACT AND VALIDATE DISTANCE
//			distance = Double.parseDouble(payload.get("distance").toString());
//
//			if (distance == null || distance <= 0) {
//				throw new RuntimeException("Invalid distance value for DELIVERY order");
//			}
//
//			System.out.println("Delivery Distance : " + distance + " KM");
//
//			// ✅ FIND MATCHING DELIVERY ZONE
//			matchedZone = findMatchingDeliveryZone(distance, branch.getId());
//
//			if (matchedZone == null) {
//				throw new RuntimeException("No matching delivery zone found for distance: " + distance + " KM");
//			}
//
//			deliveryCharge = matchedZone.getDeliveryCharge() != null ? matchedZone.getDeliveryCharge()
//					: BigDecimal.ZERO;
//
//			System.out.println("Matched Zone     : " + matchedZone.getZoneName());
//			System.out.println("Delivery Charge  : " + deliveryCharge);
//		}
//
//		// ============================================================
//		// 🔥 CONDITION 3: DINING ORDER PROCESSING
//		// ============================================================
//		if ("DINING".equals(orderType)) {
//			System.out.println("\n---------------- DINING ORDER PROCESSING ----------------");
//
//			// ✅ VALIDATION: TABLE BOOKING ID MANDATORY
//			Map<String, Object> tableBookingMap = (Map<String, Object>) payload.get("tableBookingId");
//
//			if (tableBookingMap == null || tableBookingMap.get("id") == null) {
//				throw new RuntimeException("tableBookingId is mandatory for DINING order");
//			}
//
//			Long tableBookingId = Long.parseLong(tableBookingMap.get("id").toString());
//
//			// ✅ FETCH TABLE BOOKING DETAILS
//			tableBooking = tableBookingRepository.findById(tableBookingId)
//					.orElseThrow(() -> new RuntimeException("Table booking not found"));
//
//			// ✅ VALIDATE TABLE BOOKING BELONGS TO BRANCH
////	        if (!tableBooking.getBranchId().getId().equals(branch.getId())) {
////	            throw new RuntimeException("Table booking does not belong to this branch");
////	        }
//
//			System.out.println("Table Booking ID : " + tableBookingId);
//			System.out.println("Table Number     : " + tableBooking.getTableId().getTableNumber());
//			System.out.println("✔ Table booking validated successfully");
//		}
//
//		// ============================================================
//		// 🔥 CONDITION 2: TAKEAWAY ORDER PROCESSING
//		// ============================================================
//		if ("TAKEAWAY".equals(orderType)) {
//			System.out.println("\n---------------- TAKEAWAY ORDER PROCESSING ----------------");
//			System.out.println("✔ Takeaway order - No address, distance, or table booking required");
//		}
//
//		// ================== CREATE ORDER ENTITY ==================
//		OrdersEntity order = new OrdersEntity();
//
//		// ✅ SET COMMON FIELDS FOR ALL ORDER TYPES
//		order.setRestaurantId(restaurant);
//		order.setBranchId(branch);
//		order.setCustomerId(customer);
////	    order.setCustomerId(customer);
//		order.setPaymentMethod(paymentMethod);
//
//		// ✅ SET ADDRESS ONLY FOR DELIVERY ORDERS
//		if (addressExist != null && "DELIVERY".equals(orderType)) {
//			order.setCustomerDeliveryAddressesId(addressExist);
//		}
//
//		// ✅ SET TABLE BOOKING ONLY FOR DINING ORDERS
//		SectionEntity sectionRecord = null;
//
//		if ("DINING".equals(orderType) && tableBooking != null) {
//
//			order.setTableBookingId(tableBooking);
//
//			if (tableBooking.getTableId() != null && tableBooking.getTableId().getSectionId() != null) {
//
//				sectionRecord = tableBooking.getTableId().getSectionId();
//				order.setSectionId(sectionRecord);
//
//				System.out.println("Section auto-fetched from table booking: " + sectionRecord.getName());
//
//			} else {
//				System.out.println("⚠️ Section not mapped with table. Skipping section assignment.");
//			}
//		}
//		// ✅ SET CUSTOMER DETAILS
//		order.setCustomerName((String) payload.get("customerName"));
//		order.setCustomerEmail((String) payload.get("cutomerEmail"));
//		order.setCustomerPhone((String) payload.get("customerPhone"));

//		// ✅ SET ORDER TYPE AND STATUS
//		order.setOrderType(orderType);
//		System.out.println("Order Type Final → " + orderType);
//
//		order.setStatus("PENDING");
//		order.setPaymentStatus("PENDING");
//		order.setSubtotal(BigDecimal.ZERO);
//		order.setTotalAmount(BigDecimal.ZERO);
//		order.setDeliveryFee(deliveryCharge); // Will be zero for non-delivery orders
//
//		// ✅ SAVE INITIAL ORDER
//		OrdersEntity savedOrder = ordersrepository.save(order);
//		String orderGenerated_id = Constant.generateOrderId(savedOrder.getId());
//
//		System.out.println("\nORDER CREATED → Order ID : " + savedOrder.getId());
//		System.out.println("Order Number    : " + orderGenerated_id);
//
//		// ================== ORDER ITEMS PROCESSING ==================
//		BigDecimal orderItemsTotal = BigDecimal.ZERO;
//		BigDecimal orderAddonsTotal = BigDecimal.ZERO;
//
//		List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
//
//		if (items == null || items.isEmpty()) {
//			throw new RuntimeException("Order items cannot be empty");
//		}
//
//		System.out.println("\n---------------- ORDER ITEMS PROCESSING ----------------");
//		System.out.println("Total Items Found: " + items.size());
//
//		int itemCounter = 1;
//		for (Map<String, Object> itemMap : items) {
//			System.out.println("\nProcessing Item " + itemCounter + " of " + items.size());
//
//			// ✅ CREATE ORDER ITEM ENTITY
//			OrderItemsEntity orderItem = new OrderItemsEntity();
//			orderItem.setOrderId(savedOrder);
//
//			// ✅ VALIDATE AND FETCH MENU ITEM
//			if (itemMap.get("menu_item_id") == null) {
//				throw new RuntimeException("menu_item_id is required for all items");
//			}
//
//			Long menuItemId = Long.parseLong(itemMap.get("menu_item_id").toString());
//			MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
//					.orElseThrow(() -> new RuntimeException("Menu item not found with ID: " + menuItemId));
//
//			// ✅ CALCULATE ITEM PRICE
//			BigDecimal price = menuItem.getPrice();
//
//			if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
//				throw new RuntimeException("Invalid price for menu item: " + menuItem.getName());
//			}
//
//			// ✅ VALIDATE QUANTITY
//			if (itemMap.get("quantity") == null) {
//				throw new RuntimeException("Quantity is required for menu item: " + menuItem.getName());
//			}
//
//			Integer quantity = Integer.parseInt(itemMap.get("quantity").toString());
//
//			if (quantity <= 0) {
//				throw new RuntimeException("Quantity must be greater than 0 for menu item: " + menuItem.getName());
//			}
//
//			BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(quantity));
//
//			// ✅ SET ORDER ITEM DETAILS
//			orderItem.setMenuItemId(menuItem);
//			orderItem.setMenuItemName(menuItem.getName());
//			orderItem.setPrice(itemTotal);
//			orderItem.setQuantity(quantity);
//			orderItem.setAddonsTotal(BigDecimal.ZERO);
//			orderItem.setSpecialInstructions((String) itemMap.get("special_instructions"));
//
//			// ✅ SAVE ORDER ITEM
//			OrderItemsEntity savedOrderItem = orderItemsRepository.save(orderItem);
//			orderItemsTotal = orderItemsTotal.add(itemTotal);
//
//			System.out.println("  Item: " + menuItem.getName() + " | Qty: " + quantity + " | Price: " + itemTotal);
//
//			// ================== ADDONS PROCESSING ==================
//			BigDecimal addonTotalForItem = BigDecimal.ZERO;
//			List<Map<String, Object>> addonItems = (List<Map<String, Object>>) itemMap.get("addonItems");
//
//			if (addonItems != null && !addonItems.isEmpty()) {
//				System.out.println("  Addons Found: " + addonItems.size());
//
//				int addonCounter = 1;
//				for (Map<String, Object> addonMap : addonItems) {
//
//					// ✅ VALIDATE ADDON ITEM ID
//					if (addonMap.get("addonItemId") == null) {
//						throw new RuntimeException("addonItemId is required for addons");
//					}
//
//					Long addonItemId = Long.parseLong(addonMap.get("addonItemId").toString());
//
//					// ✅ VALIDATE ADDON QUANTITY
//					if (addonMap.get("quantity") == null) {
//						throw new RuntimeException("Quantity is required for addon item ID: " + addonItemId);
//					}
//
//					Integer addonQty = Integer.parseInt(addonMap.get("quantity").toString());
//
//					if (addonQty <= 0) {
//						throw new RuntimeException(
//								"Addon quantity must be greater than 0 for addon ID: " + addonItemId);
//					}
//
//					// ✅ FETCH ADDON ITEM
//					AddonsItemsEntity addonItem = addonsItemsRepository.findById(addonItemId)
//							.orElseThrow(() -> new RuntimeException("Addon Item not found with ID: " + addonItemId));
//
//					// ✅ CALCULATE ADDON PRICE
//					BigDecimal addonPrice = addonItem.getPrice().multiply(BigDecimal.valueOf(addonQty));
//
//					// ✅ CREATE ORDER ADDON ENTITY
//					OrderAddonsItemsEntity orderAddon = new OrderAddonsItemsEntity();
//					orderAddon.setOrderItemId(savedOrderItem);
//					orderAddon.setName(addonItem.getName());
//					orderAddon.setQuantity(addonQty.toString());
//					orderAddon.setPrice(addonPrice);
//
//					// ✅ SAVE ORDER ADDON
//					orderAddonsItemsRepository.save(orderAddon);
//					addonTotalForItem = addonTotalForItem.add(addonPrice);
//
//					System.out.println("    Addon " + addonCounter + ": " + addonItem.getName() + " | Qty: " + addonQty
//							+ " | Price: " + addonPrice);
//					addonCounter++;
//				}
//			}
//
//			// ✅ UPDATE ORDER ITEM WITH ADDON TOTAL
//			savedOrderItem.setAddonsTotal(addonTotalForItem);
//			savedOrderItem.setItemTotal(itemTotal.add(addonTotalForItem));
//			orderItemsRepository.save(savedOrderItem);
//
//			orderAddonsTotal = orderAddonsTotal.add(addonTotalForItem);
//			itemCounter++;
//		}
//
//		System.out.println("\n---------------- ORDER TOTALS CALCULATION ----------------");
//		System.out.println("Items Total      : " + orderItemsTotal);
//		System.out.println("Addons Total     : " + orderAddonsTotal);
//
//		// ================== TAX & SERVICE CHARGE CALCULATION ==================
//		// Note: As per requirement, tax calculation only for DINING orders
//		BigDecimal gstAmount = BigDecimal.ZERO;
//		BigDecimal serviceChargeAmount = BigDecimal.ZERO;
//
//		if ("DINING".equals(orderType) && sectionRecord != null) {
//			System.out.println("\n---------------- DINING ORDER TAX CALCULATION ----------------");
//
//			BigDecimal gstPercentage = sectionRecord.getTaxPercentage() != null ? sectionRecord.getTaxPercentage()
//					: BigDecimal.ZERO;
//
//			BigDecimal serviceChargePercentage = sectionRecord.getServiceChargePercentage() != null
//					? sectionRecord.getServiceChargePercentage()
//					: BigDecimal.ZERO;
//
//			BigDecimal finalSubtotal = orderItemsTotal.add(orderAddonsTotal);
//
//			gstAmount = finalSubtotal.multiply(gstPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
//			serviceChargeAmount = finalSubtotal.multiply(serviceChargePercentage).divide(BigDecimal.valueOf(100), 2,
//					RoundingMode.HALF_UP);
//
//			System.out.println("GST Percentage          : " + gstPercentage + "%");
//			System.out.println("Service Charge Percentage: " + serviceChargePercentage + "%");
//			System.out.println("GST Amount              : " + gstAmount);
//			System.out.println("Service Charge Amount   : " + serviceChargeAmount);
//		} else {
//			System.out.println("\n---------------- TAX CALCULATION SKIPPED ----------------");
//			System.out.println("Tax calculation only applies to DINING orders with valid section");
//		}
//
//		// ================== FINAL AMOUNT CALCULATION ==================
//		BigDecimal finalSubtotal = orderItemsTotal.add(orderAddonsTotal);
//		BigDecimal netAmount = finalSubtotal.add(gstAmount).add(serviceChargeAmount).add(deliveryCharge);
//
//		System.out.println("\n---------------- FINAL AMOUNT CALCULATION ----------------");
//		System.out.println("Subtotal              : " + finalSubtotal);
//		System.out.println("+ GST Amount          : " + gstAmount);
//		System.out.println("+ Service Charge      : " + serviceChargeAmount);
//		System.out.println("+ Delivery Charge     : " + deliveryCharge);
//		System.out.println("= Total Amount        : " + netAmount);
//
//		// ✅ UPDATE ORDER WITH FINAL AMOUNTS
//		savedOrder.setSubtotal(finalSubtotal);
//		savedOrder.setTotalAmount(netAmount);
//		savedOrder.setOrderNumber(orderGenerated_id);
//		savedOrder.setDeliveryFee(deliveryCharge);
//		savedOrder.setTaxAmount(gstAmount);
//
//		// ✅ SET ESTIMATED TIME BASED ON ORDER TYPE
//		if ("DELIVERY".equals(orderType)) {
//			savedOrder.setEstimatedTime(30); // 30 minutes for delivery
//		} else {
//			savedOrder.setEstimatedTime(20); // 20 minutes for takeaway/dining
//		}
//
//		// ✅ SAVE FINAL ORDER
//		ordersrepository.save(savedOrder);
//
//		// ================== FINAL SUMMARY ==================
//		System.out.println("\n==================== ORDER SUMMARY ====================");
//		System.out.println("Order ID              : " + savedOrder.getId());
//		System.out.println("Order Number          : " + orderGenerated_id);
//		System.out.println("Order Type            : " + orderType);
//		System.out.println("Customer Name         : "
//				+ (savedOrder.getCustomerName() != null ? savedOrder.getCustomerName() : "N/A"));
//		System.out.println("Customer Phone        : "
//				+ (savedOrder.getCustomerPhone() != null ? savedOrder.getCustomerPhone() : "N/A"));
//		System.out.println("Subtotal              : " + finalSubtotal);
//		System.out.println("GST Amount            : " + gstAmount);
//		System.out.println("Service Charge        : " + serviceChargeAmount);
//		System.out.println("Delivery Charge       : " + deliveryCharge);
//		System.out.println("Total Amount          : " + netAmount);
//		System.out.println("Estimated Time        : " + savedOrder.getEstimatedTime() + " minutes");
//
//		if ("DINING".equals(orderType) && tableBooking != null) {
//			System.out.println("Table Booking ID      : " + tableBooking.getId());
//			System.out.println("Table Number          : " + tableBooking.getTableId().getTableNumber());
//		}
//
//		if ("DELIVERY".equals(orderType) && addressExist != null) {
//			System.out.println("Delivery Address      : " + addressExist.getAddressLine1());
//			System.out.println("Delivery Distance     : " + distance + " KM");
//		}
//
//		System.out.println("✅ ORDER CREATED SUCCESSFULLY");
//		System.out.println("\n==================== ORDER CREATION END ====================");
////	    
////	    Map<String, Object> data = new LinkedHashMap<>();
////	    data.put("type", "PAYMENT_SUCCESS");
////	    data.put("orderId", "ORD12345");
////	    data.put("amount", 1500);
////	    System.out.println(" notify");
//		Map<String, Object> data = new LinkedHashMap<>();
//		data.put("type", "NEW_ORDER");
//		data.put("orderId", orderGenerated_id);
//		data.put("orderType", orderType);
//		data.put("amount", netAmount);
//		data.put("paymentMethod", paymentMethod);
//		data.put("branchId", branch.getId());
//		data.put("restaurantId", restaurant.getId());
//
//		constant.sendNotificationByBranchAndRole(branch.getId(), "KITCHEN", "🍽️ New Order Received!",
//				"Order #" + orderGenerated_id + " has arrived. Please start preparing.", data);
//		
//		 System.out.println("✅ Kitchen notification sent for Order: " + orderGenerated_id);
//
//		// ================= ADD ORDER TO KITCHEN CACHE =================
//		Map<String, Object> cachePayload = new LinkedHashMap<>();
//		cachePayload.put("orderId", savedOrder.getId());
//		cachePayload.put("branchId", savedOrder.getBranchId().getId());
//		cachePayload.put("orderType", savedOrder.getOrderType());
//		cachePayload.put("amount", savedOrder.getTotalAmount());
//		cachePayload.put("status", savedOrder.getStatus());
//		cachePayload.put("createdAt", savedOrder.getCreatedAt());
//		System.out.println("enter cache");
//		cacheData.addKitchenPendingOrder(cachePayload);
//		System.out.println("enter cache 2");
//
//		System.out.println(" notify2");
//		return "Order Created Successfully - Order ID: " + orderGenerated_id;
//	}

	@Transactional(rollbackFor = Exception.class)
	public Object addOrderss(Map<String, Object> payload, String token) throws Exception {

		System.out.println("\n=================================================");
		System.out.println("🧾           ORDER CREATION STARTED              ");
		System.out.println("=================================================");

		// 🔐 AUTHENTICATION
		Authorization.authorizeCustomer(token);
		System.out.println("🔐 Authentication : SUCCESS");

		// 🛡️ IDEMPOTENCY — if the client supplied a key and we already created an
		// order for it, return the prior result instead of inserting a duplicate.
		// Guards against rapid double-taps, network retries, and page reloads.
		String idempotencyKey = payload.get("idempotencyKey") != null
				? payload.get("idempotencyKey").toString().trim()
				: null;
		if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
			Optional<OrdersEntity> existing = ordersrepository.findByIdempotencyKey(idempotencyKey);
			if (existing.isPresent()) {
				OrdersEntity prior = existing.get();
				Map<String, Object> replay = new java.util.LinkedHashMap<>();
				replay.put("order", prior);
				replay.put("orderId", prior.getId());
				replay.put("orderNumber", prior.getOrderNumber());
				replay.put("totalAmount", prior.getTotalAmount());
				replay.put("idempotent", true);
				return replay;
			}
		}

		// 🔓 TOKEN DATA EXTRACTION
		tokenUtil.decryptAndStoreToken(token);
		Long cashierId = tokenUtil.getCurrentUserId().longValue();
		System.out.println("👤 Cashier ID     : " + cashierId);

		// 🔍 FETCH CASHIER DETAILS
		CustomersEntity customer = customersrepository.findById(cashierId)
				.orElseThrow(() -> new RuntimeException("Cashier not found"));

		// 🔍 FETCH RESTAURANT DETAILS
		UsersEntity restaurant = customer.getUserId();
		if (restaurant == null)
			throw new RuntimeException("Restaurant not mapped with customer");

		System.out.println("🏪 Restaurant ID  : " + restaurant.getId());

		// 🚫 SUBSCRIPTION GATE — refuse new orders when the target restaurant's
		// subscription has expired. Kitchen/cashier apps are locked at this point
		// so the order would otherwise go into a black hole.
		if (!subscriptionAccessService.hasActiveAccess(restaurant)) {
			throw new RuntimeException("This restaurant is temporarily unavailable. Please try again later.");
		}

		// ============================================================
		// 🔥 ORDER TYPE VALIDATION
		// ============================================================
		String orderType = payload.get("orderType") != null && !payload.get("orderType").toString().trim().isEmpty()
				? payload.get("orderType").toString().trim().toUpperCase()
				: "DINING";

		// Accept client aliases while keeping the existing backend flow unchanged.
		if ("DINE_IN".equals(orderType)) {
			orderType = "DINING";
		}

		String paymentMethod = payload.get("paymentMethod") != null
				? payload.get("paymentMethod").toString().trim().toUpperCase()
				: "COD";

		System.out.println("📦 Order Type     : " + orderType);
		System.out.println("💳 Payment Mode  : " + paymentMethod);

		if (!Arrays.asList("DELIVERY", "TAKEAWAY", "DINING").contains(orderType)) {
			throw new RuntimeException("Invalid order type");
		}

		// ================== BRANCH ==================
		Map<String, Object> branchIdMap = (Map<String, Object>) payload.get("branchId");
		UsersEntity branch = null;

		if (branchIdMap != null && branchIdMap.get("id") != null) {
			Long branchId = Long.parseLong(branchIdMap.get("id").toString());
			branch = usersrepository.findById(branchId).orElseThrow(() -> new RuntimeException("Branch not found"));
		}

		if (branch == null) {
			throw new RuntimeException("Branch is mandatory");
		}

		System.out.println("🏬 Branch ID      : " + branch.getId());

		// ============================================================
		// 🔒 PER-BRANCH ORDER TYPE ALLOWLIST
		// Admin-configured toggles on the branch user row decide which
		// channels this branch is currently accepting. Dine-in is split
		// into "order now" vs "table reservation" — distinguished by
		// whether the booking is for a future time past the grace buffer.
		// ============================================================
		if ("TAKEAWAY".equals(orderType) && Boolean.FALSE.equals(branch.getAcceptsTakeaway())) {
			throw new RuntimeException("Takeaway orders are not accepted at this branch.");
		}
		if ("DELIVERY".equals(orderType) && Boolean.FALSE.equals(branch.getAcceptsDelivery())) {
			throw new RuntimeException("Delivery orders are not accepted at this branch.");
		}
		if ("DINING".equals(orderType)) {
			boolean isFutureReservation = false;
			Map<String, Object> tbMap = (Map<String, Object>) payload.get("tableBookingId");
			if (tbMap != null && tbMap.get("id") != null) {
				try {
					Long tbId = Long.parseLong(tbMap.get("id").toString());
					TableBookingEntity tb = tableBookingRepository.findById(tbId).orElse(null);
					if (tb != null) {
						LocalDateTime nowIst = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
						LocalDateTime bookingAt = resolveBookingDateTime(tb, nowIst);
						UsersProfileEntity prof = getProfileForBooking(tb);
						int buffer = parseMinutes(prof != null ? prof.getBookingBufferMinutes() : null, 0);
						isFutureReservation = bookingAt.isAfter(nowIst.plusMinutes(buffer));
					}
				} catch (NumberFormatException ignored) {}
			}
			if (isFutureReservation && Boolean.FALSE.equals(branch.getAcceptsDineInReserve())) {
				throw new RuntimeException("Table reservations are not accepted at this branch.");
			}
			if (!isFutureReservation && Boolean.FALSE.equals(branch.getAcceptsDineInNow())) {
				throw new RuntimeException("Dine-in orders are not accepted at this branch.");
			}
		}

		// ================== VARIABLES ==================
		CustomerDeliveryAddressesEntity addressExist = null;
		Double distance = null;
		DeliveryZonesEntity matchedZone = null;
		BigDecimal deliveryCharge = BigDecimal.ZERO;
		TableBookingEntity tableBooking = null;
		SectionEntity sectionRecord = null;
		boolean isFirstOrderCoupon = false;
		boolean isReferralFirstOrder = customer.getIsFirstOrder() != null && customer.getIsFirstOrder();
		Map<String, Object> distanceInfo;
		// ============================================================
		// 🚚 DELIVERY
		// ============================================================
		if ("DELIVERY".equals(orderType)) {

			System.out.println("\n🚚 DELIVERY DETAILS");
			System.out.println("-------------------------------------------------");

			Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
			if (custAddressMap == null || custAddressMap.get("id") == null)
				throw new RuntimeException("custAddressId required");

			Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());

			addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
					.orElseThrow(() -> new RuntimeException("Address not found"));

			if (!addressExist.getCustomerId().getId().equals(customer.getId()))
				throw new RuntimeException("Address does not belong to customer");

			// ================= CUSTOMER LAT/LNG =================
			if (addressExist.getLatitude() == null || addressExist.getLongitude() == null) {
				throw new RuntimeException("Customer address latitude/longitude missing");
			}

			Double customerLat = addressExist.getLatitude();
			Double customerLng = addressExist.getLongitude();

			System.out.println("📍 Customer Lat : " + customerLat);
			System.out.println("📍 Customer Lng : " + customerLng);
			distanceInfo = constant.findSingleBranchDistanceUsingGoogleMaps(branch.getId(), customerLat, customerLng);
			// // ================= FIND NEAREST BRANCH =================
//			System.out.println("➡ Finding nearest branch");
//
//			List<Map<String, Object>> nearestBranches = custPublicService.getNearestBranchesByRestaurant(
//					restaurant.getId(), // 👈 restaurantId
//					customerLat, customerLng);
//
//			if (nearestBranches.isEmpty()) {
//				throw new RuntimeException("No nearest branch found");
//			}
//
//			// ================= PICK 0th INDEX =================
//			Map<String, Object> nearestBranch = nearestBranches.get(0);

			distance = Double.parseDouble(distanceInfo.get("distance_km").toString());

			System.out.println("📏 Nearest Branch Distance : " + distance + " KM");

			// ================= DELIVERY ZONE =================
			matchedZone = findMatchingDeliveryZone(distance, branch.getId());

			deliveryCharge = matchedZone != null && matchedZone.getDeliveryCharge() != null
					? matchedZone.getDeliveryCharge()
					: BigDecimal.ZERO;

			System.out.println("💰 Delivery Fee : ₹" + deliveryCharge);
		}

//	    if ("DELIVERY".equals(orderType)) {
//
//	        System.out.println("\n🚚 DELIVERY DETAILS");
//	        System.out.println("-------------------------------------------------");
//
//	        Map<String, Object> custAddressMap = (Map<String, Object>) payload.get("custAddressId");
//	        if (custAddressMap == null || custAddressMap.get("id") == null)
//	            throw new RuntimeException("custAddressId required");
//
//	        Long custAddressId = Long.parseLong(custAddressMap.get("id").toString());
//
//	        addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
//	                .orElseThrow(() -> new RuntimeException("Address not found"));
//
//	        if (!addressExist.getCustomerId().getId().equals(customer.getId()))
//	            throw new RuntimeException("Address does not belong to customer");
//
//	        if (payload.get("distance") == null)
//	            throw new RuntimeException("Distance required");
//
//	        distance = Double.parseDouble(payload.get("distance").toString());
//	        matchedZone = findMatchingDeliveryZone(distance, branch.getId());
//
//	        deliveryCharge = matchedZone.getDeliveryCharge() != null
//	                ? matchedZone.getDeliveryCharge()
//	                : BigDecimal.ZERO;
//
//	        System.out.println("📍 Address        : " + addressExist.getAddressLine1());
//	        System.out.println("📏 Distance       : " + distance + " KM");
//	        System.out.println("💰 Delivery Fee  : ₹" + deliveryCharge);
//	    }

		// ============================================================
		// 🍽️ DINING
		// ============================================================
		if ("DINING".equals(orderType)) {

			System.out.println("\n🍽️ DINING DETAILS");
			System.out.println("-------------------------------------------------");

			Map<String, Object> tableBookingMap = (Map<String, Object>) payload.get("tableBookingId");
			if (tableBookingMap == null || tableBookingMap.get("id") == null)
				throw new RuntimeException("tableBookingId required");

			Long tableBookingId = Long.parseLong(tableBookingMap.get("id").toString());

			tableBooking = tableBookingRepository.findById(tableBookingId)
					.orElseThrow(() -> new RuntimeException("Table booking not found"));

			String bookingStatus = tableBooking.getStatus() != null ? tableBooking.getStatus().toUpperCase() : "";
			if (Arrays.asList("NO_SHOW", "CANCELLED", "EXPIRED").contains(bookingStatus)) {
				throw new RuntimeException("Table reservation has expired. Please book again.");
			}

			LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
			LocalDateTime bookingAt = resolveBookingDateTime(tableBooking, now);
			UsersProfileEntity profile = getProfileForBooking(tableBooking);
			int bufferMinutes = parseMinutes(profile != null ? profile.getBookingBufferMinutes() : null, 0);

			if ("HELD".equalsIgnoreCase(bookingStatus)) {
				LocalDateTime holdExpiresAt = tableBooking.getHoldExpiresAt();
				if (holdExpiresAt == null || !holdExpiresAt.isAfter(now)) {
					tableBooking.setStatus("EXPIRED");
					tableBooking.setPaymentStatus("EXPIRED");
					tableBookingRepository.save(tableBooking);
					if (tableBooking.getTableId() != null && tableBooking.getTableId().getStatus() != null
							&& tableBooking.getTableId().getStatus() == 3) {
						DiningTablesEntity expiredHoldTable = tableBooking.getTableId();
						expiredHoldTable.setStatus(1);
						expiredHoldTable.setUpdatedAt(now);
						diningtablesrepository.save(expiredHoldTable);
					}
					throw new RuntimeException("Your table hold has expired. Please select the table again.");
				}
			}

			if ("RESERVED".equalsIgnoreCase(bookingStatus) && bookingAt.isAfter(now.plusMinutes(bufferMinutes))) {
				throw new RuntimeException("Your reservation is scheduled for later. Please order at the reserved time.");
			}

			if (tableBooking.getTableId() != null && tableBooking.getTableId().getSectionId() != null) {

				sectionRecord = tableBooking.getTableId().getSectionId();
			}

			System.out.println("🪑 Table No       : " + tableBooking.getTableId().getTableNumber());
			System.out.println("📍 Section       : " + (sectionRecord != null ? sectionRecord.getName() : "N/A"));

			// ================= PROXIMITY CHECK =================
			// Dine-in orders must originate from within the branch-configured radius.
			// Backend remains the source of truth so a tampered client cannot bypass it.
			Object dineLatObj = payload.get("customerLat");
			Object dineLngObj = payload.get("customerLng");
			if (dineLatObj == null || dineLngObj == null) {
				throw new RuntimeException("Location required for dine-in orders. Please allow location access.");
			}
			double dineCustomerLat;
			double dineCustomerLng;
			try {
				dineCustomerLat = Double.parseDouble(dineLatObj.toString());
				dineCustomerLng = Double.parseDouble(dineLngObj.toString());
			} catch (NumberFormatException nfe) {
				throw new RuntimeException("Invalid location data for dine-in order.");
			}

			UsersProfileEntity branchProfile = usersProfileRepository.findByRestaurantId_id(branch.getId());
			if (branchProfile == null
					|| branchProfile.getLatitude() == null || branchProfile.getLongitude() == null
					|| branchProfile.getLatitude() == 0.0 || branchProfile.getLongitude() == 0.0) {
				throw new RuntimeException("Restaurant location not configured. Please contact the restaurant.");
			}

			double dineDistMeters = haversineMeters(
					dineCustomerLat, dineCustomerLng,
					branchProfile.getLatitude(), branchProfile.getLongitude());
			int maxDineInMeters = branch.getDineInProximityMeters() != null ? branch.getDineInProximityMeters() : 200;
			if (dineDistMeters > maxDineInMeters) {
				throw new RuntimeException(String.format(
						"You must be within %dm of the restaurant to place a dine-in order. You are %dm away.",
						maxDineInMeters, Math.round(dineDistMeters)));
			}
			System.out.println("📍 Proximity OK  : " + Math.round(dineDistMeters) + "m from branch (limit "
					+ maxDineInMeters + "m)");
		}

		// ============================================================
		// 🧾 CREATE ORDER
		// ============================================================
		OrdersEntity order = new OrdersEntity();
		order.setRestaurantId(restaurant);
		order.setBranchId(branch);
		order.setCustomerId(customer);
		order.setPaymentMethod(paymentMethod);
		order.setOrderType(orderType);
		order.setStatus("PENDING");
		order.setPaymentStatus("PENDING");
		order.setDeliveryFee(deliveryCharge);
		// ✅ SET CUSTOMER DETAILS
		order.setCustomerName((String) payload.get("customerName"));
		order.setCustomerEmail((String) payload.get("cutomerEmail"));
		order.setCustomerPhone((String) payload.get("customerPhone"));

		if (addressExist != null)
			order.setCustomerDeliveryAddressesId(addressExist);

		if (tableBooking != null)
			order.setTableBookingId(tableBooking);

		if (sectionRecord != null)
			order.setSectionId(sectionRecord);

		if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
			order.setIdempotencyKey(idempotencyKey);
		}
		OrdersEntity savedOrder = ordersrepository.save(order);
		String orderGenerated_id = Constant.generateOrderId(savedOrder.getId());

		// If this order is tied to a reservation, mark the table as occupied and confirm the booking.
		if (tableBooking != null && tableBooking.getTableId() != null) {
			DiningTablesEntity diningTable = tableBooking.getTableId();
			if (diningTable.getStatus() == null || diningTable.getStatus() != 2) {
				diningTable.setStatus(2); // occupied
				diningTable.setUpdatedAt(java.time.LocalDateTime.now());
				diningtablesrepository.save(diningTable);
			}
			if ("RESERVED".equalsIgnoreCase(tableBooking.getStatus()) || "HELD".equalsIgnoreCase(tableBooking.getStatus())) {
				tableBooking.setStatus("CONFIRMED");
				tableBooking.setHoldExpiresAt(null);
				tableBookingRepository.save(tableBooking);
			}
		}

		System.out.println("\n🧾 ORDER NUMBER   : " + orderGenerated_id);
		System.out.println("-------------------------------------------------");

		// ============================================================
		// 🧺 ITEM TOTALS
		// ============================================================
		BigDecimal orderItemsTotal = BigDecimal.ZERO;
		BigDecimal orderAddonsTotal = BigDecimal.ZERO;

		List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
		if (items == null || items.isEmpty())
			throw new RuntimeException("Order items empty");

		System.out.println("\n🛒 ORDER ITEMS");
		System.out.println("-------------------------------------------------");

		// 🚀 Batch-fetch all menu items + addons once instead of N+1 lookups
		java.util.Set<Long> menuItemIdSet = new java.util.HashSet<>();
		java.util.Set<Long> addonIdSet = new java.util.HashSet<>();
		for (Map<String, Object> itemMap : items) {
			if (itemMap.get("menu_item_id") != null) {
				menuItemIdSet.add(Long.parseLong(itemMap.get("menu_item_id").toString()));
			}
			List<Map<String, Object>> addonItemsPrefetch =
					(List<Map<String, Object>>) itemMap.get("addonItems");
			if (addonItemsPrefetch != null) {
				for (Map<String, Object> a : addonItemsPrefetch) {
					if (a.get("addonItemId") != null) {
						addonIdSet.add(Long.parseLong(a.get("addonItemId").toString()));
					}
				}
			}
		}

		java.util.Map<Long, MenuItemsEntity> menuItemCache = new java.util.HashMap<>();
		if (!menuItemIdSet.isEmpty()) {
			for (MenuItemsEntity mi : menuItemsRepository.findAllById(menuItemIdSet)) {
				menuItemCache.put(mi.getId(), mi);
			}
		}
		java.util.Map<Long, AddonsItemsEntity> addonCache = new java.util.HashMap<>();
		if (!addonIdSet.isEmpty()) {
			for (AddonsItemsEntity a : addonsItemsRepository.findAllById(addonIdSet)) {
				addonCache.put(a.getId(), a);
			}
		}

		// Track each saved line so per-item GST can be computed once after coupon scaling.
		java.util.List<OrderItemsEntity> orderedSavedItems = new java.util.ArrayList<>();
		java.util.List<MenuItemsEntity>  orderedMenuItems  = new java.util.ArrayList<>();

		int itemCounter = 1;
		for (Map<String, Object> itemMap : items) {
			System.out.println("\nProcessing Item " + itemCounter + " of " + items.size());

			// ✅ CREATE ORDER ITEM ENTITY
			OrderItemsEntity orderItem = new OrderItemsEntity();
			orderItem.setOrderId(savedOrder);

			// ✅ VALIDATE AND FETCH MENU ITEM
			if (itemMap.get("menu_item_id") == null) {
				throw new RuntimeException("menu_item_id is required for all items");
			}

			Long menuItemId = Long.parseLong(itemMap.get("menu_item_id").toString());
			MenuItemsEntity menuItem = menuItemCache.get(menuItemId);
			if (menuItem == null) {
				throw new RuntimeException("Menu item not found with ID: " + menuItemId);
			}

			// ✅ CALCULATE ITEM PRICE (support half/quarter portions)
			String portion = itemMap.get("portion") != null ? itemMap.get("portion").toString() : "full";
			BigDecimal price;
			if ("half".equalsIgnoreCase(portion) && menuItem.getHalfPrice() != null && menuItem.getHalfPrice().compareTo(BigDecimal.ZERO) > 0) {
				price = menuItem.getHalfPrice();
			} else if ("quarter".equalsIgnoreCase(portion) && menuItem.getQtrPrice() != null && menuItem.getQtrPrice().compareTo(BigDecimal.ZERO) > 0) {
				price = menuItem.getQtrPrice();
			} else if (itemMap.get("price") != null) {
				BigDecimal clientPrice = new BigDecimal(itemMap.get("price").toString());
				price = clientPrice.compareTo(BigDecimal.ZERO) > 0 ? clientPrice : menuItem.getPrice();
			} else {
				price = menuItem.getPrice();
			}

			if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
				throw new RuntimeException("Invalid price for menu item: " + menuItem.getName());
			}

			// ✅ VALIDATE QUANTITY
			if (itemMap.get("quantity") == null) {
				throw new RuntimeException("Quantity is required for menu item: " + menuItem.getName());
			}

			Integer quantity = Integer.parseInt(itemMap.get("quantity").toString());

			if (quantity <= 0) {
				throw new RuntimeException("Quantity must be greater than 0 for menu item: " + menuItem.getName());
			}

			BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(quantity));

			String itemName = menuItem.getName();
			if ("half".equalsIgnoreCase(portion)) itemName += " (Half)";
			else if ("quarter".equalsIgnoreCase(portion)) itemName += " (Quarter)";

			// ✅ SET ORDER ITEM DETAILS
			orderItem.setMenuItemId(menuItem);
			orderItem.setMenuItemName(itemName);
			orderItem.setPrice(itemTotal);
			orderItem.setQuantity(quantity);
			orderItem.setAddonsTotal(BigDecimal.ZERO);
			orderItem.setSpecialInstructions((String) itemMap.get("special_instructions"));

			// ✅ SAVE ORDER ITEM
			OrderItemsEntity savedOrderItem = orderItemsRepository.save(orderItem);
			orderItemsTotal = orderItemsTotal.add(itemTotal);

			System.out.println("  Item: " + menuItem.getName() + " | Qty: " + quantity + " | Price: " + itemTotal);

			// ================== ADDONS PROCESSING ==================
			BigDecimal addonTotalForItem = BigDecimal.ZERO;
			List<Map<String, Object>> addonItems = (List<Map<String, Object>>) itemMap.get("addonItems");

			if (addonItems != null && !addonItems.isEmpty()) {
				System.out.println("  Addons Found: " + addonItems.size());

				int addonCounter = 1;
				for (Map<String, Object> addonMap : addonItems) {

					// ✅ VALIDATE ADDON ITEM ID
					if (addonMap.get("addonItemId") == null) {
						throw new RuntimeException("addonItemId is required for addons");
					}

					Long addonItemId = Long.parseLong(addonMap.get("addonItemId").toString());

					// ✅ VALIDATE ADDON QUANTITY
					if (addonMap.get("quantity") == null) {
						throw new RuntimeException("Quantity is required for addon item ID: " + addonItemId);
					}

					Integer addonQty = Integer.parseInt(addonMap.get("quantity").toString());

					if (addonQty <= 0) {
						throw new RuntimeException(
								"Addon quantity must be greater than 0 for addon ID: " + addonItemId);
					}

					// ✅ FETCH ADDON ITEM (from pre-batched cache)
					AddonsItemsEntity addonItem = addonCache.get(addonItemId);
					if (addonItem == null) {
						throw new RuntimeException("Addon Item not found with ID: " + addonItemId);
					}

					// ✅ CALCULATE ADDON PRICE
					BigDecimal addonPrice = addonItem.getPrice().multiply(BigDecimal.valueOf(addonQty));

					// ✅ CREATE ORDER ADDON ENTITY
					OrderAddonsItemsEntity orderAddon = new OrderAddonsItemsEntity();
					orderAddon.setOrderItemId(savedOrderItem);
					orderAddon.setName(addonItem.getName());
					orderAddon.setQuantity(addonQty.toString());
					orderAddon.setPrice(addonPrice);

					// ✅ SAVE ORDER ADDON
					orderAddonsItemsRepository.save(orderAddon);
					addonTotalForItem = addonTotalForItem.add(addonPrice);

					System.out.println("    Addon " + addonCounter + ": " + addonItem.getName() + " | Qty: " + addonQty
							+ " | Price: " + addonPrice);
					addonCounter++;
				}
			}

			// ✅ UPDATE ORDER ITEM WITH ADDON TOTAL
			savedOrderItem.setAddonsTotal(addonTotalForItem);
			savedOrderItem.setItemTotal(itemTotal.add(addonTotalForItem));
			orderItemsRepository.save(savedOrderItem);

			orderAddonsTotal = orderAddonsTotal.add(addonTotalForItem);

			orderedSavedItems.add(savedOrderItem);
			orderedMenuItems.add(menuItem);

			itemCounter++;
		}

		// ============================================================
		// 🎟️ COUPON DISCOUNT
		// ============================================================
		System.out.println("\n================= COUPON CHECK START =================");

		BigDecimal originalItemsTotal = orderItemsTotal;

		String couponCode = payload.get("couponCode") != null
		        ? payload.get("couponCode").toString().trim()
		        : null;

		System.out.println("📦 Received Coupon Code : " + couponCode);

		if (couponCode != null && !couponCode.isEmpty()) {

		    System.out.println("🔍 Extracting Menu Item IDs with Quantity for Coupon...");
		    Map<Integer, Integer> itemQtyMapForCoupon = CouponManagementUtil.extractMenuItemIdsWithQty(payload);
		    System.out.println("🧾 Item Qty Map        : " + itemQtyMapForCoupon);

		    System.out.println("🚀 Calling applyCoupon()...");
		    Map<String, Object> couponResult =
		            custCouponService.applyCoupon(couponCode, itemQtyMapForCoupon, cashierId);

		    System.out.println("📊 Coupon Response      : " + couponResult);

		    BigDecimal paybleAmount =
		            new BigDecimal(couponResult.get("paybleAmount").toString());

		    if (couponResult.get("isFirstOrder") != null) {
		    	isFirstOrderCoupon = Boolean.parseBoolean(
		                couponResult.get("isFirstOrder").toString()
		        );
		    }
		    System.out.println("💰 Items Total Before Discount : ₹" + orderItemsTotal);

		    orderItemsTotal = paybleAmount;
		    savedOrder.setCouponCode(couponCode);
		    System.out.println("🎟️ Coupon Applied Successfully!");
		    System.out.println("💸 Discounted Items Total       : ₹" + orderItemsTotal);

		} else {
		    System.out.println("ℹ️ No Coupon Provided");
		}

		System.out.println("================= COUPON CHECK END =================\n");


		// ============================================================
		// 🧮 TAX SECTION
		// ============================================================
		SectionEntity taxSection = null;

		if ("DINING".equals(orderType)) {
			taxSection = sectionRecord;
		} else if ("DELIVERY".equals(orderType) || "TAKEAWAY".equals(orderType)) {
			taxSection = sectionRepository.findByBranchId_IdAndType(branch.getId(), "ONLINE").orElse(null);
			// Fallback to DINING section if ONLINE section not found
			if (taxSection == null) {
				taxSection = sectionRecord;
			}
		}

		// ============================================================
		// 🧾 PER-ITEM GST CALCULATION
		// Each line's rate/type comes from the menu item; section tax is a fallback
		// for items that have no gst_percentage set. Coupon discount is scaled
		// across items (addons stay at full price, matching legacy coupon semantics).
		// ============================================================
		BigDecimal fallbackRate = (taxSection != null && taxSection.getTaxPercentage() != null)
				? taxSection.getTaxPercentage()
				: BigDecimal.ZERO;

		BigDecimal itemScale = originalItemsTotal.compareTo(BigDecimal.ZERO) > 0
				? orderItemsTotal.divide(originalItemsTotal, 10, RoundingMode.HALF_UP)
				: BigDecimal.ONE;

		java.util.List<GstCalculator.Line> gstLines = new java.util.ArrayList<>(orderedSavedItems.size());
		for (int i = 0; i < orderedSavedItems.size(); i++) {
			OrderItemsEntity oi = orderedSavedItems.get(i);
			MenuItemsEntity  mi = orderedMenuItems.get(i);

			BigDecimal itemPortion   = oi.getPrice()       != null ? oi.getPrice()       : BigDecimal.ZERO;
			BigDecimal addonsPortion = oi.getAddonsTotal() != null ? oi.getAddonsTotal() : BigDecimal.ZERO;

			BigDecimal scaledLine = itemPortion.multiply(itemScale).add(addonsPortion);
			gstLines.add(new GstCalculator.Line(scaledLine, mi.getGstPercentage(), mi.getGstType()));
		}

		GstCalculator.Result gstResult =
				GstCalculator.compute(gstLines, fallbackRate, BigDecimal.ZERO);

		// Persist the per-line GST snapshot so historical bills stay accurate.
		for (int i = 0; i < orderedSavedItems.size(); i++) {
			OrderItemsEntity oi = orderedSavedItems.get(i);
			GstCalculator.LineResult lr = gstResult.lines.get(i);
			oi.setGstRate(lr.effectiveRate);
			oi.setGstType(lr.effectiveType);
			oi.setTaxableAmount(lr.taxableAmount);
			oi.setGstAmount(lr.gstAmount);
			orderItemsRepository.save(oi);
		}

		BigDecimal gstAmount = gstResult.gstAmount;

		BigDecimal serviceChargeAmount = BigDecimal.ZERO;
		if (taxSection != null && taxSection.getServiceChargePercentage() != null) {
			BigDecimal afterDiscountGross = orderItemsTotal.add(orderAddonsTotal);
			serviceChargeAmount = afterDiscountGross
					.multiply(taxSection.getServiceChargePercentage())
					.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
		}

		// ============================================================
		// 💰 FINAL BILL
		// subtotal persisted = pre-tax portion (matches frontend baseSubtotal
		// display, and keeps subtotal + tax + service + delivery = total).
		// ============================================================
		BigDecimal finalSubtotal = gstResult.subtotal;

		// Free-delivery rule: if the matched zone has a "free above" threshold
		// and the food subtotal meets it, waive the delivery fee. The order
		// row was set with the original deliveryCharge earlier — overwrite it
		// here so the final saved order reflects the waiver.
		if (matchedZone != null
				&& matchedZone.getFreeDeliveryAbove() != null
				&& matchedZone.getFreeDeliveryAbove().compareTo(BigDecimal.ZERO) > 0
				&& finalSubtotal.compareTo(matchedZone.getFreeDeliveryAbove()) >= 0) {
			System.out.println("🎁 Free-delivery threshold met (subtotal ₹" + finalSubtotal
					+ " ≥ ₹" + matchedZone.getFreeDeliveryAbove() + ") — waiving ₹" + deliveryCharge);
			deliveryCharge = BigDecimal.ZERO;
			savedOrder.setDeliveryFee(BigDecimal.ZERO);
		}

		BigDecimal netAmount     = gstResult.itemsPayable.add(serviceChargeAmount).add(deliveryCharge);

		// ============================================================
		// 💳 WALLET DEDUCTION
		// ============================================================
		BigDecimal walletAmountUsed = BigDecimal.ZERO;
		Boolean useWallet = payload.get("useWallet") != null && Boolean.parseBoolean(payload.get("useWallet").toString());

		if (useWallet) {
			System.out.println("\n💳 WALLET PAYMENT PROCESSING");
			System.out.println("-------------------------------------------------");

			BigDecimal customerWalletBalance = customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO;
			System.out.println("Customer Wallet Balance : ₹" + customerWalletBalance);

			// Determine wallet amount to use
			BigDecimal requestedWalletAmount = payload.get("walletAmount") != null
				? new BigDecimal(payload.get("walletAmount").toString())
				: customerWalletBalance; // Default to full wallet balance

			// Ensure we don't use more than available balance or order total
			walletAmountUsed = requestedWalletAmount.min(customerWalletBalance).min(netAmount);

			if (walletAmountUsed.compareTo(BigDecimal.ZERO) > 0) {
				// Deduct from customer wallet
				BigDecimal newWalletBalance = customerWalletBalance.subtract(walletAmountUsed);
				customer.setWalletBalance(newWalletBalance);
				customersrepository.save(customer);

				// Create wallet transaction record for debit
				com.rms.common.entities.WalletTransactionsEntity walletTransaction = new com.rms.common.entities.WalletTransactionsEntity();
				walletTransaction.setCustomerId(customer);
				walletTransaction.setOpBal(customerWalletBalance);
				walletTransaction.setAmount(walletAmountUsed.negate()); // Negative for debit
				walletTransaction.setClosingBal(newWalletBalance);
				walletTransaction.setMessage("Order payment - " + savedOrder.getOrderNumber());
				walletTransaction.setStatus("SUCCESS");
				walletTransaction.setMode(2); // 2 = Debit
				walletTransaction.setOrderId(savedOrder);
				walletTransactionsRepository.save(walletTransaction);

				// Reduce net amount by wallet amount used
				netAmount = netAmount.subtract(walletAmountUsed);

				System.out.println("Wallet Amount Used    : ₹" + walletAmountUsed);
				System.out.println("New Wallet Balance    : ₹" + newWalletBalance);
				System.out.println("Remaining Payable     : ₹" + netAmount);
			}
		}

		System.out.println("\n==================== BILL SUMMARY ====================");
		System.out.println("Subtotal            : ₹" + finalSubtotal);
		System.out.println("GST                 : ₹" + gstAmount);
		System.out.println("Service Charge      : ₹" + serviceChargeAmount);
		System.out.println("Delivery Charge     : ₹" + deliveryCharge);
		if (walletAmountUsed.compareTo(BigDecimal.ZERO) > 0) {
			System.out.println("Wallet Used         : -₹" + walletAmountUsed);
		}
		System.out.println("-------------------------------------------------");
		System.out.println("TOTAL PAYABLE       : ₹" + netAmount);
		System.out.println("=================================================");


		savedOrder.setSubtotal(finalSubtotal);
		savedOrder.setTotalAmount(netAmount);
		savedOrder.setTaxAmount(gstAmount);
		savedOrder.setSerChargeAmount(serviceChargeAmount);
		savedOrder.setWalletAmountUsed(walletAmountUsed);
		savedOrder.setOrderNumber(orderGenerated_id);

		ordersrepository.save(savedOrder);

		// Auto-link referral from saved contact list if not already referred
		if (customer.getReferredById() == null) {
			String normalizedPhone = normalizePhone(customer.getMobileNumber());
			if (!normalizedPhone.isEmpty()) {
				referralContactsRepository.findFirstByNormalizedPhone(normalizedPhone).ifPresent(contact -> {
					if (contact.getReferrerCustomerId() != null
							&& !contact.getReferrerCustomerId().getId().equals(customer.getId())) {
						customer.setReferredById(contact.getReferrerCustomerId().getId());
						customersrepository.save(customer);
						contact.setMappedCustomerId(customer.getId());
						referralContactsRepository.save(contact);
					}
				});
			}
		}

		// Credit referral rewards: signup bonus (on first order only) + recurring bonus (every order).
		// Both bonuses come from the referrer's own customer record.
		if (customer.getReferredById() != null) {
		    System.out.println("🎁 Processing referral rewards for referrer ID: " + customer.getReferredById()
		            + " | firstOrder=" + isReferralFirstOrder);
		    referralService.creditReferralRewards(customer.getId(), savedOrder, isReferralFirstOrder);
		}

		if (isReferralFirstOrder) {
		    customer.setIsFirstOrder(false);
		    customersrepository.save(customer);
		}

		System.out.println("✅ ORDER CREATED SUCCESSFULLY");
		System.out.println("=================================================\n");

		System.out.println("✅ ORDER CREATED SUCCESSFULLY");
		System.out.println("\n==================== ORDER CREATION END ====================");
//	    
//	    Map<String, Object> data = new LinkedHashMap<>();
//	    data.put("type", "PAYMENT_SUCCESS");
//	    data.put("orderId", "ORD12345");
//	    data.put("amount", 1500);
//	    System.out.println(" notify");
		// PG orders: kitchen notification + cache add payment SUCCESS ke baad hoga (CustCCAvenuePaymentService me)
		if (!"PG".equalsIgnoreCase(paymentMethod)) {
			Map<String, Object> data = new LinkedHashMap<>();
			data.put("type", "NEW_ORDER");
			data.put("orderId", orderGenerated_id);
			data.put("orderType", orderType);
			data.put("amount", netAmount);
			data.put("paymentMethod", paymentMethod);
			data.put("branchId", branch.getId());
			data.put("restaurantId", restaurant.getId());

			constant.sendNotificationByBranchAndRole(branch.getId(), "KITCHEN", "🍽️ New Order Received!",
					"Order #" + orderGenerated_id + " has arrived. Please start preparing.", data);

			System.out.println("✅ Kitchen notification sent for Order: " + orderGenerated_id);

			// ================= ADD ORDER TO KITCHEN CACHE =================
			Map<String, Object> cachePayload = new LinkedHashMap<>();
			cachePayload.put("orderId", savedOrder.getId());
			cachePayload.put("branchId", savedOrder.getBranchId().getId());
			cachePayload.put("orderType", savedOrder.getOrderType());
			cachePayload.put("amount", savedOrder.getTotalAmount());
			cachePayload.put("status", savedOrder.getStatus());
			cachePayload.put("createdAt", savedOrder.getCreatedAt());
			cacheData.addKitchenPendingOrder(cachePayload);
			System.out.println("✅ Kitchen cache updated for Order: " + orderGenerated_id);
		}

		// Return a map with order details instead of just string
		// This allows the controller to access the order ID directly without another DB query
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("message", "Order Created Successfully - Order ID: " + orderGenerated_id);
		result.put("orderId", savedOrder.getId());
		result.put("orderNumber", orderGenerated_id);
		result.put("order", savedOrder);

		return result;
	}

	public DeliveryZonesEntity findMatchingDeliveryZone(Double distance, Long branchId) {

		System.out.println("\n=== DELIVERY ZONE MATCHING START ===");
		System.out.println("Branch ID  : " + branchId);
		System.out.println("Distance   : " + distance + " KM");

		List<DeliveryZonesEntity> zones = deliveryZonesRepository.findByBranchId_id(branchId);

		if (zones == null || zones.isEmpty()) {
			throw new RuntimeException("No delivery zones configured for this branch");
		}

		// Filter only active zones (treat NULL isActive as active for backward compatibility)
		List<DeliveryZonesEntity> activeZones = zones.stream()
				.filter(z -> z.getIsActive() == null || z.getIsActive())
				.collect(java.util.stream.Collectors.toList());

		if (activeZones.isEmpty()) {
			throw new RuntimeException("No active delivery zones configured for this branch");
		}

		Double maxZoneRadius = 0.0;

		for (DeliveryZonesEntity zone : activeZones) {

			Double from = zone.getRadiusKmFrom();
			Double to = zone.getRadiusKmTo();

			System.out.println("Checking Zone → " + zone.getZoneName() + " | From: " + from + " | To: " + to);

			if (from == null || to == null) {
				continue;
			}

			if (to > maxZoneRadius) {
				maxZoneRadius = to;
			}

			if (distance >= from && distance <= to) {
				System.out.println("✅ MATCH FOUND → Zone ID: " + zone.getId());
				return zone;
			}
		}

		System.out.println("❌ NO MATCHING DELIVERY ZONE FOUND");
		throw new RuntimeException(
				"Your location is " + String.format("%.1f", distance) + " km away. We deliver up to " + String.format("%.1f", maxZoneRadius) + " km. Please select a closer address.");
	}

	public DeliveryZonesEntity isZoneAllow(Long custAddressId, Long branchId) {

		CustomerDeliveryAddressesEntity addressExist = customerdeliveryaddressesrepository.findById(custAddressId)
				.orElseThrow(() -> new RuntimeException("Address not found"));

//		if (!addressExist.getCustomerId().getId().equals(customer.getId()))
//			throw new RuntimeException("Address does not belong to customer");

		// ================= CUSTOMER LAT/LNG =================
		if (addressExist.getLatitude() == null || addressExist.getLongitude() == null) {
			throw new RuntimeException("Please update your address with location pin to enable delivery verification");
		}

		Double customerLat = addressExist.getLatitude();
		Double customerLng = addressExist.getLongitude();

		System.out.println("📍 Customer Lat : " + customerLat);
		System.out.println("📍 Customer Lng : " + customerLng);
		Map<String, Object> distanceInfo = constant.findSingleBranchDistanceUsingGoogleMaps(branchId, customerLat,
				customerLng);

		Double distance = Double.parseDouble(distanceInfo.get("distance_km").toString());

		System.out.println("📏 Nearest Branch Distance : " + distance + " KM");

		// ================= DELIVERY ZONE =================
		DeliveryZonesEntity matchedZone = findMatchingDeliveryZone(distance, branchId);
		return matchedZone;
	}

	@Override
	public List<OrdersEntity> getAllRecordOrders(String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return ordersrepository.findAll();
	}

	@Override
	public Map<String, Object> getAllOrders(Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		Page page = ordersrepository.findAll(pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1);
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public OrdersEntity getOneOrders(Long id, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		return ordersrepository.findById(id).orElseThrow(() -> new RuntimeException("Orders not found"));
	}

	@Override
	public String addOrders(OrdersEntity ordersEntity, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		OrdersEntity newEntity = new OrdersEntity();

		// Copy non-foreign fields using reflection
		for (Field field : OrdersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(ordersEntity);
			if (value != null && !field.getName().endsWith("Id")) {
				field.set(newEntity, value);
			}
		}

		// Handle customer_id foreign key
		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
			newEntity.setCustomerId(
					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
		}

		// Handle customer_delivery_addresses_id foreign key
		if (ordersEntity.getCustomerDeliveryAddressesId() != null
				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {
			newEntity.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
					customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
		}

		// Handle branch_id foreign key
		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
			newEntity.setBranchId(
					fetchReferenceById(ordersEntity.getBranchId(), usersRepository, "Restaurant_branch not found"));
		}

		// Handle captain_id foreign key
		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
			newEntity.setCaptainId(fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Users not found"));
		}

		// Handle delivery_id foreign key
		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
			newEntity.setDeliveryId(
					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Users not found"));
		}

		// Handle restaurant_id foreign key
		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
			newEntity.setRestaurantId(
					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Users not found"));
		}

		ordersrepository.save(newEntity);
		return "Added Successfully";
	}

	// ============================================================
	// 🍽️ ADD ITEMS TO EXISTING DINING ORDER (same bill)
	// ============================================================
	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> addItemsToExistingOrder(Long orderId, Map<String, Object> payload, String token) throws Exception {
		Authorization.authorizeCustomerOrCaptain(token);

		// 🛡️ IDEMPOTENCY — replay safe response if this submission was already
		// processed (rapid double-tap, retry on flaky network, page reload).
		String idempotencyKey = payload.get("idempotencyKey") != null
				? payload.get("idempotencyKey").toString().trim()
				: null;
		if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
			Optional<OrdersEntity> prior = ordersrepository.findByIdempotencyKey(idempotencyKey);
			if (prior.isPresent() && prior.get().getId().equals(orderId)) {
				OrdersEntity p = prior.get();
				Map<String, Object> replay = new java.util.LinkedHashMap<>();
				replay.put("orderId", p.getId());
				replay.put("orderNumber", p.getOrderNumber());
				replay.put("totalAmount", p.getTotalAmount());
				replay.put("idempotent", true);
				return replay;
			}
		}

		OrdersEntity order = ordersrepository.findById(orderId)
				.orElseThrow(() -> new RuntimeException("Order not found"));

		if (!"DINING".equalsIgnoreCase(order.getOrderType())) {
			throw new RuntimeException("Can only add items to dine-in orders");
		}

		// Only allow adding to active orders
		String status = order.getStatus();
		if ("CANCELLED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
			throw new RuntimeException("Cannot add items to a " + status + " order");
		}

		List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
		if (items == null || items.isEmpty()) throw new RuntimeException("No items provided");

		BigDecimal newItemsTotal = BigDecimal.ZERO;
		BigDecimal newAddonsTotal = BigDecimal.ZERO;

		for (Map<String, Object> itemMap : items) {
			Long menuItemId = Long.parseLong(itemMap.get("menu_item_id").toString());
			MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
					.orElseThrow(() -> new RuntimeException("Menu item not found: " + menuItemId));

			Integer quantity = Integer.parseInt(itemMap.get("quantity").toString());
			String portion = itemMap.get("portion") != null ? itemMap.get("portion").toString() : "full";
			BigDecimal price;
			if ("half".equalsIgnoreCase(portion) && menuItem.getHalfPrice() != null && menuItem.getHalfPrice().compareTo(BigDecimal.ZERO) > 0) {
				price = menuItem.getHalfPrice();
			} else if ("quarter".equalsIgnoreCase(portion) && menuItem.getQtrPrice() != null && menuItem.getQtrPrice().compareTo(BigDecimal.ZERO) > 0) {
				price = menuItem.getQtrPrice();
			} else if (itemMap.get("price") != null) {
				BigDecimal clientPrice = new BigDecimal(itemMap.get("price").toString());
				price = clientPrice.compareTo(BigDecimal.ZERO) > 0 ? clientPrice : menuItem.getPrice();
			} else {
				price = menuItem.getPrice();
			}
			BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(quantity));

			String itemName = menuItem.getName();
			if ("half".equalsIgnoreCase(portion)) itemName += " (Half)";
			else if ("quarter".equalsIgnoreCase(portion)) itemName += " (Quarter)";

			OrderItemsEntity orderItem = new OrderItemsEntity();
			orderItem.setOrderId(order);
			orderItem.setMenuItemId(menuItem);
			orderItem.setMenuItemName(itemName);
			orderItem.setPrice(itemTotal);
			orderItem.setQuantity(quantity);
			orderItem.setAddonsTotal(BigDecimal.ZERO);
			orderItem.setSpecialInstructions((String) itemMap.get("special_instructions"));
			orderItem.setStatus("PENDING");

			OrderItemsEntity savedItem = orderItemsRepository.save(orderItem);
			newItemsTotal = newItemsTotal.add(itemTotal);

			// Process addons
			BigDecimal addonTotalForItem = BigDecimal.ZERO;
			List<Map<String, Object>> addonItems = (List<Map<String, Object>>) itemMap.get("addonItems");
			if (addonItems != null && !addonItems.isEmpty()) {
				for (Map<String, Object> addonMap : addonItems) {
					Long addonItemId = Long.parseLong(addonMap.get("addonItemId").toString());
					Integer addonQty = Integer.parseInt(addonMap.get("quantity").toString());
					AddonsItemsEntity addonItem = addonsItemsRepository.findById(addonItemId)
							.orElseThrow(() -> new RuntimeException("Addon not found: " + addonItemId));

					BigDecimal addonPrice = addonItem.getPrice().multiply(BigDecimal.valueOf(addonQty));
					OrderAddonsItemsEntity orderAddon = new OrderAddonsItemsEntity();
					orderAddon.setOrderItemId(savedItem);
					orderAddon.setName(addonItem.getName());
					orderAddon.setQuantity(addonQty.toString());
					orderAddon.setPrice(addonPrice);
					orderAddonsItemsRepository.save(orderAddon);
					addonTotalForItem = addonTotalForItem.add(addonPrice);
				}
			}

			savedItem.setAddonsTotal(addonTotalForItem);
			savedItem.setItemTotal(itemTotal.add(addonTotalForItem));
			orderItemsRepository.save(savedItem);
			newAddonsTotal = newAddonsTotal.add(addonTotalForItem);
		}

		// Recalculate order totals from the authoritative DB state (sum of
		// item.itemTotal across all order items) instead of `prev + new`. The
		// additive form silently doubles the bill if this method ever runs
		// twice for the same submission, even when idempotency catches the
		// duplicate writes elsewhere.
		List<OrderItemsEntity> allItems = orderItemsRepository.findByOrderId_Id(order.getId());
		BigDecimal updatedSubtotal = BigDecimal.ZERO;
		for (OrderItemsEntity it : allItems) {
			BigDecimal itTotal = it.getItemTotal();
			if (itTotal == null) {
				BigDecimal base = it.getPrice() != null ? it.getPrice() : BigDecimal.ZERO;
				BigDecimal addons = it.getAddonsTotal() != null ? it.getAddonsTotal() : BigDecimal.ZERO;
				itTotal = base.add(addons);
			}
			updatedSubtotal = updatedSubtotal.add(itTotal);
		}
		order.setSubtotal(updatedSubtotal);

		// Recalculate tax
		SectionEntity taxSection = order.getSectionId();
		BigDecimal gstAmount = BigDecimal.ZERO;
		BigDecimal serviceChargeAmount = BigDecimal.ZERO;
		if (taxSection != null) {
			BigDecimal gstPct = taxSection.getTaxPercentage() != null ? taxSection.getTaxPercentage() : BigDecimal.ZERO;
			BigDecimal scPct = taxSection.getServiceChargePercentage() != null ? taxSection.getServiceChargePercentage() : BigDecimal.ZERO;
			gstAmount = updatedSubtotal.multiply(gstPct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
			serviceChargeAmount = updatedSubtotal.multiply(scPct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
		}

		order.setTaxAmount(gstAmount);
		order.setSerChargeAmount(serviceChargeAmount);
		BigDecimal total = updatedSubtotal.add(gstAmount).add(serviceChargeAmount);
		order.setTotalAmount(total);

		// Reset status to PENDING so kitchen sees new items
		order.setStatus("PENDING");

		if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
			order.setIdempotencyKey(idempotencyKey);
		}
		ordersrepository.save(order);

		// Notify kitchen
		if (order.getBranchId() != null) {
			Map<String, Object> data = new java.util.LinkedHashMap<>();
			data.put("type", "ORDER_ITEMS_ADDED");
			data.put("orderId", order.getOrderNumber());
			data.put("orderType", order.getOrderType());
			data.put("newItems", items.size());
			constant.sendNotificationByBranchAndRole(order.getBranchId().getId(), "KITCHEN",
					"🍽️ Items Added to Order!", "New items added to order #" + order.getOrderNumber(), data);
		}

		Map<String, Object> result = new java.util.LinkedHashMap<>();
		result.put("orderId", order.getId());
		result.put("orderNumber", order.getOrderNumber());
		result.put("totalAmount", order.getTotalAmount());
		result.put("itemsAdded", items.size());
		return result;
	}

	@Override
	@Transactional(rollbackFor = Exception.class)
	public String updateOrders(OrdersEntity ordersEntity, String token) throws Exception {

		// 🔐 AUTH
		Authorization.authorizeCustomer(token);

		OrdersEntity existingEntity = ordersrepository.findById(ordersEntity.getId())
				.orElseThrow(() -> new RuntimeException("Orders not found"));

		String previousPaymentStatus = existingEntity.getPaymentStatus();

		// ================= FK HANDLING =================
		if (ordersEntity.getCustomerId() != null && ordersEntity.getCustomerId().getId() != null) {
			existingEntity.setCustomerId(
					fetchReferenceById(ordersEntity.getCustomerId(), customersrepository, "Customers not found"));
		}

		if (ordersEntity.getCustomerDeliveryAddressesId() != null
				&& ordersEntity.getCustomerDeliveryAddressesId().getId() != null) {

			existingEntity
					.setCustomerDeliveryAddressesId(fetchReferenceById(ordersEntity.getCustomerDeliveryAddressesId(),
							customerdeliveryaddressesrepository, "Customer delivery address not found"));
		}

		if (ordersEntity.getBranchId() != null && ordersEntity.getBranchId().getId() != null) {
			existingEntity.setBranchId(
					fetchReferenceById(ordersEntity.getBranchId(), usersRepository, "Restaurant branch not found"));
		}

		if (ordersEntity.getCaptainId() != null && ordersEntity.getCaptainId().getId() != null) {
			existingEntity.setCaptainId(
					fetchReferenceById(ordersEntity.getCaptainId(), usersrepository, "Captain not found"));
		}

		if (ordersEntity.getDeliveryId() != null && ordersEntity.getDeliveryId().getId() != null) {
			existingEntity.setDeliveryId(
					fetchReferenceById(ordersEntity.getDeliveryId(), usersrepository, "Delivery user not found"));
		}

		if (ordersEntity.getRestaurantId() != null && ordersEntity.getRestaurantId().getId() != null) {
			existingEntity.setRestaurantId(
					fetchReferenceById(ordersEntity.getRestaurantId(), usersrepository, "Restaurant not found"));
		}

		// ================= CANCELLED CASCADE LOGIC =================
		if (ordersEntity.getStatus() != null && "CANCELLED".equalsIgnoreCase(ordersEntity.getStatus())) {

			System.out.println("Cancel order logic start" + existingEntity.getStatus());
			if (!"PENDING".equalsIgnoreCase(existingEntity.getStatus())) {
				throw new RuntimeException(
						"Cancellation is not permitted because the order is already under processing.");
			}
			System.out.println("⚠ Order cancellation triggered");

			existingEntity.setStatus("CANCELLED");
			existingEntity.setPaymentStatus("CANCELLED");
			existingEntity.setCompletedAt(LocalDateTime.now());

			List<OrderItemsEntity> orderItems = existingEntity.getOrderItems();

			if (orderItems != null && !orderItems.isEmpty()) {

				for (OrderItemsEntity item : orderItems) {

					item.setStatus("CANCELLED");

					// Addons are optional — no action needed
					// Item status is enough to represent cancellation
					if (item.getAddonItems() != null) {
						System.out
								.println("Addon count for item " + item.getId() + " : " + item.getAddonItems().size());
					}
				}
			} else {
				System.out.println("No order items found for cancellation");
			}

			// Remove from kitchen pending cache
			cacheData.removeKitchenOrderByOrderId(existingEntity.getId());

			// Release dining table on cancellation
			if ("DINING".equalsIgnoreCase(existingEntity.getOrderType())) {
				TableBookingEntity tableBooking = existingEntity.getTableBookingId();
				if (tableBooking != null && tableBooking.getTableId() != null) {
					DiningTablesEntity diningTable = tableBooking.getTableId();
					diningTable.setStatus(1); // 1 = available
					diningTable.setUpdatedAt(java.time.LocalDateTime.now());
					diningtablesrepository.save(diningTable);
					System.out.println("✅ Table T-" + diningTable.getTableNumber() + " released on cancellation");
				}
			}
		}

		// ================= UPDATE NON-FK FIELDS =================
		for (Field field : OrdersEntity.class.getDeclaredFields()) {
			field.setAccessible(true);
			Object value = field.get(ordersEntity);

			if (value != null && !field.getName().endsWith("Id")) {
				field.set(existingEntity, value);
			}
		}

		// ================= SCHEDULE 5-MIN TABLE AUTO-RELEASE (DINING) =================
		String newPaymentStatus = existingEntity.getPaymentStatus();
		boolean isNowPaid = newPaymentStatus != null
				&& ("SUCCESS".equalsIgnoreCase(newPaymentStatus) || "PAID".equalsIgnoreCase(newPaymentStatus));
		boolean wasPreviouslyPaid = previousPaymentStatus != null
				&& ("SUCCESS".equalsIgnoreCase(previousPaymentStatus) || "PAID".equalsIgnoreCase(previousPaymentStatus));
		if (isNowPaid && !wasPreviouslyPaid && "DINING".equalsIgnoreCase(existingEntity.getOrderType())) {
			TableBookingEntity tb = existingEntity.getTableBookingId();
			if (tb != null && tb.getTableId() != null) {
				diningTableReleaseScheduler.scheduleRelease(tb.getTableId().getId());
			}
		}

		ordersrepository.save(existingEntity);

		if (ordersEntity.getRawItems() != null && !ordersEntity.getRawItems().isEmpty()) {
			orderItemsRepository.deleteByOrderId_Id(existingEntity.getId());
			List<OrderItemsEntity> newItems = new ArrayList<>();
			for (Map<String, Object> rawItem : ordersEntity.getRawItems()) {
				OrderItemsEntity item = new OrderItemsEntity();
				Object menuItemIdRaw = rawItem.get("menu_item_id");
				if (menuItemIdRaw != null) {
					Long menuItemId = Long.parseLong(menuItemIdRaw.toString());
					MenuItemsEntity menuItem = menuItemsRepository.findById(menuItemId)
						.orElseThrow(() -> new RuntimeException("MenuItem not found: " + menuItemId));
					item.setMenuItemId(menuItem);
					item.setMenuItemName(menuItem.getName());
				}
				if (rawItem.get("quantity") != null)
					item.setQuantity(Integer.parseInt(rawItem.get("quantity").toString()));
				if (rawItem.get("price") != null)
					item.setPrice(new java.math.BigDecimal(rawItem.get("price").toString()));
				if (rawItem.get("special_instructions") != null)
					item.setSpecialInstructions(rawItem.get("special_instructions").toString());
				if (item.getPrice() != null && item.getQuantity() != null)
					item.setItemTotal(item.getPrice().multiply(new java.math.BigDecimal(item.getQuantity())));
				item.setOrderId(existingEntity);
				newItems.add(item);
			}
			orderItemsRepository.saveAll(newItems);
		}

		return "Order updated successfully";
	}

	@Override
	public String deleteOrders(Long id, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		if (!ordersrepository.existsById(id)) {
			throw new RuntimeException("Orders not found");
		}
		ordersrepository.deleteById(id);
		return "Deleted Successfully";
	}

	@Override
	public String addMultipleOrders(List<OrdersEntity> ordersEntitys, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		List<OrdersEntity> entitiesToSave = new ArrayList<>();

		for (OrdersEntity entity : ordersEntitys) {
			OrdersEntity newEntity = new OrdersEntity();

			// Copy non-foreign fields using reflection
			for (Field field : OrdersEntity.class.getDeclaredFields()) {
				field.setAccessible(true);
				Object value = field.get(entity);
				if (value != null && !field.getName().endsWith("Id")) {
					field.set(newEntity, value);
				}
			}

			// Handle customer_id foreign key
			if (entity.getCustomerId() != null && entity.getCustomerId().getId() != null) {
				newEntity.setCustomerId(
						fetchReferenceById(entity.getCustomerId(), customersrepository, "Customers not found"));
			}

			// Handle customer_delivery_addresses_id foreign key
			if (entity.getCustomerDeliveryAddressesId() != null
					&& entity.getCustomerDeliveryAddressesId().getId() != null) {
				newEntity.setCustomerDeliveryAddressesId(fetchReferenceById(entity.getCustomerDeliveryAddressesId(),
						customerdeliveryaddressesrepository, "Customer_delivery_addresses not found"));
			}

			// Handle branch_id foreign key
			if (entity.getBranchId() != null && entity.getBranchId().getId() != null) {
				newEntity.setBranchId(
						fetchReferenceById(entity.getBranchId(), usersRepository, "Restaurant_branch not found"));
			}

			// Handle captain_id foreign key
			if (entity.getCaptainId() != null && entity.getCaptainId().getId() != null) {
				newEntity.setCaptainId(fetchReferenceById(entity.getCaptainId(), usersrepository, "Users not found"));
			}

			// Handle delivery_id foreign key
			if (entity.getDeliveryId() != null && entity.getDeliveryId().getId() != null) {
				newEntity.setDeliveryId(fetchReferenceById(entity.getDeliveryId(), usersrepository, "Users not found"));
			}

			// Handle restaurant_id foreign key
			if (entity.getRestaurantId() != null && entity.getRestaurantId().getId() != null) {
				newEntity.setRestaurantId(
						fetchReferenceById(entity.getRestaurantId(), usersrepository, "Users not found"));
			}

			entitiesToSave.add(newEntity);
		}

		ordersrepository.saveAll(entitiesToSave);
		return "Added Successfully";
	}

	@Override
	public List<OrdersEntity> getOrdersByCreatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCreatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = ordersrepository.findByCreatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrdersEntity> getOrdersByCreatedat(LocalDate createdat, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = createdat.atStartOfDay();
		return ordersrepository.findByCreatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByUpdatedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = ordersrepository.findByUpdatedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrdersEntity> getOrdersByUpdatedat(LocalDate updatedat, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = updatedat.atStartOfDay();
		return ordersrepository.findByUpdatedAt(dateTime);
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedatBetween(LocalDate fromDate, LocalDate toDate, String token)
			throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		return ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime);
	}

	@Override
	public Map<String, Object> getOrdersByCompletedatBetweenPagination(LocalDate fromDate, LocalDate toDate,
			Integer pageNumber, Integer pageSize, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
		LocalDateTime fromDateTime = fromDate.atStartOfDay();
		LocalDateTime toDateTime = toDate.atTime(23, 59, 59);
		Page page = ordersrepository.findByCompletedAtBetween(fromDateTime, toDateTime, pageable);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("totalRecords", page.getTotalElements());
		response.put("pageSize", page.getSize());
		response.put("currentPage", page.getNumber() + 1); // Page numbers are zero-based in Pageable
		response.put("totalPages", page.getTotalPages());
		response.put("records", page.getContent());
		return response;
	}

	@Override
	public List<OrdersEntity> getOrdersByCompletedat(LocalDate completedat, String token) throws Exception {
		Authorization.authorizeCustomer(token);
		LocalDateTime dateTime = completedat.atStartOfDay();
		return ordersrepository.findByCompletedAt(dateTime);
	}

	public ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException {
		try {
			Authorization.authorizeAdmin(token);
		} catch (Exception e) {
			throw new IllegalArgumentException(e.getMessage());
		}
		Pageable pageable = PageRequest.of(pageNumber, pageSize);
		Page<OrdersEntity> page = ordersrepository.findAll(pageable);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
		DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("Orderss");
			Row header = sheet.createRow(0);
			header.createCell(0).setCellValue("Id");
			header.createCell(1).setCellValue("Restaurant_id");
			header.createCell(2).setCellValue("Captain_id");
			header.createCell(3).setCellValue("Branch_id");
			header.createCell(4).setCellValue("Delivery_id");
			header.createCell(5).setCellValue("Order_number");
			header.createCell(6).setCellValue("Order_type");
			header.createCell(7).setCellValue("Customer_id");
			header.createCell(8).setCellValue("Customer_delivery_addresses_id");
			header.createCell(9).setCellValue("Table_number");
			header.createCell(10).setCellValue("Status");
			header.createCell(11).setCellValue("Payment_status");
			header.createCell(12).setCellValue("Payment_method");
			header.createCell(13).setCellValue("Subtotal");
			header.createCell(14).setCellValue("Tax_amount");
			header.createCell(15).setCellValue("Discount_amount");
			header.createCell(16).setCellValue("Delivery_fee");
			header.createCell(17).setCellValue("Total_amount");
			header.createCell(18).setCellValue("Special_instructions");
			header.createCell(19).setCellValue("Estimated_time");
			header.createCell(20).setCellValue("Created_at");
			header.createCell(21).setCellValue("Updated_at");
			header.createCell(22).setCellValue("Customer_name");
			header.createCell(23).setCellValue("Customer_phone");
			header.createCell(24).setCellValue("Customer_email");
			header.createCell(25).setCellValue("Completed_at");

			int rowNum = 1;
			for (OrdersEntity ordersEntity : page.getContent()) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(ordersEntity.getId() != null ? ordersEntity.getId() : 0);
				row.createCell(1).setCellValue(
						ordersEntity.getRestaurantId() != null ? ordersEntity.getRestaurantId().toString() : "N/A");
				row.createCell(2).setCellValue(
						ordersEntity.getCaptainId() != null ? ordersEntity.getCaptainId().toString() : "N/A");
				row.createCell(3).setCellValue(
						ordersEntity.getBranchId() != null ? ordersEntity.getBranchId().toString() : "N/A");
				row.createCell(4).setCellValue(
						ordersEntity.getDeliveryId() != null ? ordersEntity.getDeliveryId().toString() : "N/A");
				row.createCell(5)
						.setCellValue(ordersEntity.getOrderNumber() != null ? ordersEntity.getOrderNumber() : "N/A");
				row.createCell(6)
						.setCellValue(ordersEntity.getOrderType() != null ? ordersEntity.getOrderType() : "N/A");
				row.createCell(7).setCellValue(
						ordersEntity.getCustomerId() != null ? ordersEntity.getCustomerId().toString() : "N/A");
				row.createCell(8)
						.setCellValue(ordersEntity.getCustomerDeliveryAddressesId() != null
								? ordersEntity.getCustomerDeliveryAddressesId().toString()
								: "N/A");
				row.createCell(9)
						.setCellValue(ordersEntity.getTableNumber() != null ? ordersEntity.getTableNumber() : "N/A");
				row.createCell(10).setCellValue(ordersEntity.getStatus() != null ? ordersEntity.getStatus() : "N/A");
				row.createCell(11).setCellValue(
						ordersEntity.getPaymentStatus() != null ? ordersEntity.getPaymentStatus() : "N/A");
				row.createCell(12).setCellValue(
						ordersEntity.getPaymentMethod() != null ? ordersEntity.getPaymentMethod() : "N/A");
				row.createCell(13).setCellValue(
						ordersEntity.getSubtotal() != null ? ordersEntity.getSubtotal().doubleValue() : 0.0);
				row.createCell(14).setCellValue(
						ordersEntity.getTaxAmount() != null ? ordersEntity.getTaxAmount().doubleValue() : 0.0);
				row.createCell(15)
						.setCellValue(ordersEntity.getDiscountAmount() != null
								? ordersEntity.getDiscountAmount().doubleValue()
								: 0.0);
				row.createCell(16).setCellValue(
						ordersEntity.getDeliveryFee() != null ? ordersEntity.getDeliveryFee().doubleValue() : 0.0);
				row.createCell(17).setCellValue(
						ordersEntity.getTotalAmount() != null ? ordersEntity.getTotalAmount().doubleValue() : 0.0);
				row.createCell(18).setCellValue(
						ordersEntity.getSpecialInstructions() != null ? ordersEntity.getSpecialInstructions() : "N/A");
				row.createCell(19)
						.setCellValue(ordersEntity.getEstimatedTime() != null ? ordersEntity.getEstimatedTime() : 0);
				LocalDateTime createdAt = ordersEntity.getCreatedAt();
				String formattedCreatedAt = (createdAt != null) ? createdAt.format(dateTimeFormat) : "";
				row.createCell(20).setCellValue(formattedCreatedAt);
				LocalDateTime updatedAt = ordersEntity.getUpdatedAt();
				String formattedUpdatedAt = (updatedAt != null) ? updatedAt.format(dateTimeFormat) : "";
				row.createCell(21).setCellValue(formattedUpdatedAt);
				row.createCell(22)
						.setCellValue(ordersEntity.getCustomerName() != null ? ordersEntity.getCustomerName() : "N/A");
				row.createCell(23).setCellValue(
						ordersEntity.getCustomerPhone() != null ? ordersEntity.getCustomerPhone() : "N/A");
				row.createCell(24).setCellValue(
						ordersEntity.getCustomerEmail() != null ? ordersEntity.getCustomerEmail() : "N/A");
				LocalDateTime completedAt = ordersEntity.getCompletedAt();
				String formattedCompletedAt = (completedAt != null) ? completedAt.format(dateTimeFormat) : "";
				row.createCell(25).setCellValue(formattedCompletedAt);

			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		}
	}

	private String normalizePhone(String phone) {
		if (phone == null) return "";
		String digits = phone.replaceAll("\\D+", "");
		if (digits.length() > 10) {
			digits = digits.substring(digits.length() - 10);
		}
		return digits;
	}

	private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
		double R = 6371000.0;
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);
		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
				* Math.sin(dLon / 2) * Math.sin(dLon / 2);
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}
}
