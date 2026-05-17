package com.rms.common.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;

@Repository
public interface OrdersRepository extends JpaRepository<OrdersEntity, Long> {
	Optional<OrdersEntity> findByOrderNumber(String order_number);
	Optional<OrdersEntity> findByIdempotencyKey(String idempotencyKey);

	@Query("SELECT o.orderType FROM OrdersEntity o WHERE o.id = :id")
	Optional<String> findOrderTypeValueById(@Param("id") Long id);

	@Query("SELECT o.tableBookingId.id FROM OrdersEntity o WHERE o.id = :id")
	Optional<Long> findTableBookingIdValueById(@Param("id") Long id);

	@Query("SELECT o.paymentStatus FROM OrdersEntity o WHERE o.id = :id")
	Optional<String> findPaymentStatusValueById(@Param("id") Long id);

	Page<OrdersEntity> findByCaptainId_Id(Long captainId, Pageable pageable);

	Optional<OrdersEntity> findByIdAndCaptainId_Id(Long id, Long captainId);

	List<OrdersEntity> findByTableBookingId_IdOrderByIdAsc(Long tableBookingId);

	List<OrdersEntity> findByBranchId_Id(Long branchId);

	Page<OrdersEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<OrdersEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<OrdersEntity> findByCreatedAt(LocalDateTime date);

	Page<OrdersEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<OrdersEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<OrdersEntity> findByUpdatedAt(LocalDateTime date);

	Page<OrdersEntity> findByCompletedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

	List<OrdersEntity> findByCompletedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

	List<OrdersEntity> findByCompletedAt(LocalDateTime date);

	// Safety-net lookup: most recent DINING order tied to a given dining table.
	OrdersEntity findTopByTableBookingId_TableId_IdAndOrderTypeInOrderByIdDesc(
			Long tableId, List<String> orderTypes);

	boolean existsByTableBookingId_Id(Long tableBookingId);

	// Customer-list stats helpers (count, total spend, latest order).
	@Query("""
			    SELECT COALESCE(COUNT(o), 0)
			    FROM OrdersEntity o
			    WHERE o.customerId.id = :customerId
			""")
	Long countByCustomerId(@Param("customerId") Long customerId);

	@Query("""
			    SELECT COALESCE(SUM(COALESCE(o.totalAmount, 0)), 0)
			    FROM OrdersEntity o
			    WHERE o.customerId.id = :customerId
			      AND (UPPER(o.paymentStatus) IN ('PAID','SUCCESS','COMPLETED')
			           OR UPPER(o.status) IN ('DELIVERED','COMPLETED','SERVED'))
			""")
	BigDecimal sumSpendByCustomerId(@Param("customerId") Long customerId);

	@Query("""
			    SELECT MAX(o.createdAt)
			    FROM OrdersEntity o
			    WHERE o.customerId.id = :customerId
			""")
	LocalDateTime findLastOrderAtByCustomerId(@Param("customerId") Long customerId);

	// Custom Methods
	Page<OrdersEntity> findAll(Pageable pageable);

	Page<OrdersEntity> findAll(Specification<OrdersEntity> spec, Pageable pageable);

	@Modifying
	@Transactional
	@Query(value = """
			UPDATE orders
			SET payment_status = COALESCE(CAST(:paymentStatus AS text), payment_status),
			    status = COALESCE(CAST(:status AS text), status),
			    payment_method = COALESCE(CAST(:paymentMethod AS text), payment_method),
			    payment_remarks = COALESCE(CAST(:paymentRemarks AS text), payment_remarks),
			    bank_ref_num = COALESCE(CAST(:bankRefNum AS text), bank_ref_num),
			    api_ref_num = COALESCE(CAST(:apiRefNum AS text), api_ref_num),
			    updated_at = CURRENT_TIMESTAMP,
			    completed_at = CASE
			        WHEN CAST(:status AS text) IS NOT NULL
			             AND UPPER(CAST(:status AS text)) IN ('COMPLETED', 'DELIVERED', 'SERVED')
			        THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
			        ELSE completed_at
			    END
			WHERE id = :id
			""", nativeQuery = true)
	int updateOrderPaymentSnapshot(
			@Param("id") Long id,
			@Param("paymentStatus") String paymentStatus,
			@Param("status") String status,
			@Param("paymentMethod") String paymentMethod,
			@Param("paymentRemarks") String paymentRemarks,
			@Param("bankRefNum") String bankRefNum,
			@Param("apiRefNum") String apiRefNum);

	@Query(value = """
			SELECT
			    o.id,
			    o.order_number,
			    o.order_type,
			    o.status,
			    o.payment_status,
			    o.payment_method,
			    o.customer_name,
			    o.customer_phone,
			    o.customer_email,
			    o.table_number,
			    o.coupon_code,
			    o.subtotal,
			    o.tax_amount,
			    o.discount_amount,
			    o.delivery_fee,
			    o.total_amount,
			    o.created_at,
			    o.updated_at,
			    o.completed_at,
			    o.estimated_time,
			    o.special_instructions,
			    o.delivery_status,
			    COALESCE((SELECT COUNT(1) FROM order_items oi WHERE oi.order_id = o.id), 0) AS order_items_count
			FROM orders o
			WHERE o.branch_id = :branchId
			  AND o.restaurant_id = :restaurantId
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = '' OR UPPER(o.status) = UPPER(CAST(:status AS text)))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.order_type, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.table_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.payment_method, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_email, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    CAST(o.total_amount AS TEXT) LIKE CONCAT('%', CAST(:searchValue AS text), '%')
			  )
			ORDER BY o.id DESC
			""", countQuery = """
			SELECT COUNT(*)
			FROM orders o
			WHERE o.branch_id = :branchId
			  AND o.restaurant_id = :restaurantId
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = '' OR UPPER(o.status) = UPPER(CAST(:status AS text)))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.order_type, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.table_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.payment_method, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_email, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    CAST(o.total_amount AS TEXT) LIKE CONCAT('%', CAST(:searchValue AS text), '%')
			  )
			""", nativeQuery = true)
	Page<Object[]> findBranchOrderSummaries(
			@Param("branchId") Long branchId,
			@Param("restaurantId") Long restaurantId,
			@Param("fromDate") LocalDateTime fromDate,
			@Param("toDate") LocalDateTime toDate,
			@Param("status") String status,
			@Param("searchValue") String searchValue,
			Pageable pageable);

	@Query(value = """
			SELECT
			    o.id,
			    o.order_number,
			    o.order_type,
			    o.status,
			    o.payment_status,
			    o.payment_method,
			    o.customer_name,
			    o.customer_phone,
			    o.customer_email,
			    o.table_number,
			    o.coupon_code,
			    o.subtotal,
			    o.tax_amount,
			    o.discount_amount,
			    o.delivery_fee,
			    o.total_amount,
			    o.created_at,
			    o.updated_at,
			    o.completed_at,
			    o.estimated_time,
			    o.special_instructions,
			    o.delivery_status,
			    COALESCE((SELECT COUNT(1) FROM order_items oi WHERE oi.order_id = o.id), 0) AS order_items_count
			FROM orders o
			WHERE o.branch_id = :branchId
			  AND o.restaurant_id = :restaurantId
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = '' OR UPPER(o.status) = UPPER(CAST(:status AS text)))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.order_type, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.table_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.payment_method, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_email, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    CAST(o.total_amount AS TEXT) LIKE CONCAT('%', CAST(:searchValue AS text), '%')
			  )
			ORDER BY o.id DESC
			""", nativeQuery = true)
	List<Object[]> findBranchOrderSummariesForExport(
			@Param("branchId") Long branchId,
			@Param("restaurantId") Long restaurantId,
			@Param("fromDate") LocalDateTime fromDate,
			@Param("toDate") LocalDateTime toDate,
			@Param("status") String status,
			@Param("searchValue") String searchValue);

	@Query(value = """
			SELECT
			    o.id,
			    o.order_number,
			    o.order_type,
			    o.status,
			    o.payment_status,
			    o.payment_method,
			    o.customer_name,
			    o.customer_phone,
			    o.customer_email,
			    o.table_number,
			    o.coupon_code,
			    o.subtotal,
			    o.tax_amount,
			    o.discount_amount,
			    o.delivery_fee,
			    o.total_amount,
			    o.created_at,
			    o.updated_at,
			    o.completed_at,
			    o.estimated_time,
			    o.special_instructions,
			    o.delivery_status,
			    COALESCE((SELECT COUNT(1) FROM order_items oi WHERE oi.order_id = o.id), 0) AS order_items_count
			FROM orders o
			WHERE o.kitchen_id = :kitchenId
			  AND o.branch_id = :branchId
			  AND o.restaurant_id = :restaurantId
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = '' OR UPPER(o.status) = UPPER(CAST(:status AS text)))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.order_type, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.table_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.payment_method, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_email, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    CAST(o.total_amount AS TEXT) LIKE CONCAT('%', CAST(:searchValue AS text), '%')
			  )
			ORDER BY o.id DESC
			""", countQuery = """
			SELECT COUNT(*)
			FROM orders o
			WHERE o.kitchen_id = :kitchenId
			  AND o.branch_id = :branchId
			  AND o.restaurant_id = :restaurantId
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = '' OR UPPER(o.status) = UPPER(CAST(:status AS text)))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.order_type, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.table_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.payment_method, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_email, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    CAST(o.total_amount AS TEXT) LIKE CONCAT('%', CAST(:searchValue AS text), '%')
			  )
			""", nativeQuery = true)
	Page<Object[]> findKitchenOrderSummaries(
			@Param("kitchenId") Long kitchenId,
			@Param("branchId") Long branchId,
			@Param("restaurantId") Long restaurantId,
			@Param("fromDate") LocalDateTime fromDate,
			@Param("toDate") LocalDateTime toDate,
			@Param("status") String status,
			@Param("searchValue") String searchValue,
			Pageable pageable);

	@Query(value = """
			SELECT
			    o.id,
			    o.order_number,
			    o.order_type,
			    o.status,
			    o.payment_status,
			    o.payment_method,
			    o.customer_name,
			    o.customer_phone,
			    o.customer_email,
			    o.table_number,
			    o.coupon_code,
			    o.subtotal,
			    o.tax_amount,
			    o.discount_amount,
			    o.delivery_fee,
			    o.total_amount,
			    o.created_at,
			    o.updated_at,
			    o.completed_at,
			    o.estimated_time,
			    o.special_instructions,
			    o.delivery_status,
			    COALESCE((SELECT COUNT(1) FROM order_items oi WHERE oi.order_id = o.id), 0) AS order_items_count
			FROM orders o
			WHERE o.branch_id = :branchId
			  AND LOWER(o.order_type) = 'delivery'
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = ''
			       OR UPPER(o.delivery_status) = ANY(STRING_TO_ARRAY(UPPER(CAST(:status AS text)), ',')))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%'))
			  )
			ORDER BY o.id DESC
			""", countQuery = """
			SELECT COUNT(*)
			FROM orders o
			WHERE o.branch_id = :branchId
			  AND LOWER(o.order_type) = 'delivery'
			  AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			  AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = ''
			       OR UPPER(o.delivery_status) = ANY(STRING_TO_ARRAY(UPPER(CAST(:status AS text)), ',')))
			  AND (
			    CAST(:searchValue AS text) IS NULL OR CAST(:searchValue AS text) = '' OR
			    LOWER(COALESCE(o.order_number, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_name, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%')) OR
			    LOWER(COALESCE(o.customer_phone, '')) LIKE LOWER(CONCAT('%', CAST(:searchValue AS text), '%'))
			  )
			""", nativeQuery = true)
	Page<Object[]> findDeliveryOrderSummaries(
			@Param("branchId") Long branchId,
			@Param("fromDate") LocalDateTime fromDate,
			@Param("toDate") LocalDateTime toDate,
			@Param("status") String status,
			@Param("searchValue") String searchValue,
			Pageable pageable);

	// ================= TOTAL ORDERS =================
	@Query("""
			    SELECT COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.createdAt BETWEEN :from AND :to
			""")
	Long countTotalOrders(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	// ================= TOTAL REVENUE =================
	@Query("""
			    SELECT COALESCE(SUM(COALESCE(o.totalAmount, 0)), 0)
			    FROM OrdersEntity o
			    WHERE o.createdAt BETWEEN :from AND :to
			      AND o.paymentStatus = 'PAID'
			      AND o.status = 'COMPLETED'
			""")
	BigDecimal getTotalRevenue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	// ================= ORDER COUNT BY STATUS =================
	@Query("""
			    SELECT
			        COALESCE(UPPER(o.status), 'UNKNOWN'),
			        COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.createdAt BETWEEN :from AND :to
			    GROUP BY COALESCE(UPPER(o.status), 'UNKNOWN')
			""")
	List<Object[]> countOrdersByStatus(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	// ================= MONTHLY REVENUE TREND =================
	@Query(nativeQuery = true, value = """
			    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS date,
			           COALESCE(SUM(total_amount), 0) AS revenue,
			           COUNT(*) AS order_count
			    FROM orders
			    WHERE created_at BETWEEN :from AND :to
			      AND payment_status = 'PAID'
			      AND status = 'COMPLETED'
			    GROUP BY DATE_TRUNC('month', created_at)
			    ORDER BY DATE_TRUNC('month', created_at)
			""")
	List<Object[]> getMonthlyRevenueTrend(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	// ================= DAILY ORDER TREND (7 days) =================
	@Query(nativeQuery = true, value = """
			    SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date,
			           COUNT(*) AS order_count
			    FROM orders
			    WHERE created_at BETWEEN :from AND :to
			    GROUP BY DATE_TRUNC('day', created_at)
			    ORDER BY DATE_TRUNC('day', created_at)
			""")
	List<Object[]> getDailyOrderTrend(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	List<OrdersEntity> findByRestaurantIdAndCreatedAtBetween(UsersEntity restaurant, LocalDateTime fromDateTime,
			LocalDateTime toDateTime);

	List<OrdersEntity> findByBranchIdAndCreatedAtBetween(UsersEntity branch, LocalDateTime fromDateTime,
			LocalDateTime toDateTime);

//	List<OrdersEntity> findAllByOrdersId_Id(Long ordersId);
	
//	***************************  restaurant  ******************************
	@Query("""
		    SELECT COUNT(o)
		    FROM OrdersEntity o
		    WHERE o.restaurantId = :restaurant
		      AND o.createdAt BETWEEN :from AND :to
		""")
		Long countTotalOrders(
		        @Param("restaurant") UsersEntity restaurant,
		        @Param("from") LocalDateTime from,
		        @Param("to") LocalDateTime to
		);

	
	@Query("""
		    SELECT COALESCE(SUM(COALESCE(o.totalAmount, 0)), 0)
		    FROM OrdersEntity o
		    WHERE o.restaurantId = :restaurant
		      AND o.createdAt BETWEEN :from AND :to
		      AND o.paymentStatus = 'PAID'
		      AND o.status = 'COMPLETED'
		""")
		BigDecimal getTotalRevenue(
		        @Param("restaurant") UsersEntity restaurant,
		        @Param("from") LocalDateTime from,
		        @Param("to") LocalDateTime to
		);

	
	@Query("""
		    SELECT
		        COALESCE(UPPER(o.status), 'UNKNOWN'),
		        COUNT(o)
		    FROM OrdersEntity o
		    WHERE o.restaurantId = :restaurant
		      AND o.createdAt BETWEEN :from AND :to
		    GROUP BY COALESCE(UPPER(o.status), 'UNKNOWN')
		""")
		List<Object[]> countOrdersByStatus(
		        @Param("restaurant") UsersEntity restaurant,
		        @Param("from") LocalDateTime from,
		        @Param("to") LocalDateTime to
		);
//		************* branch _++++++++++++++++++++++++++++++++++++++++++++
		
		@Query("""
			    SELECT COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			""")
			Long countTotalOrdersByBranch(
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT COALESCE(SUM(COALESCE(o.totalAmount, 0)), 0)
			    FROM OrdersEntity o
			    WHERE o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			      AND o.paymentStatus = 'PAID'
			      AND o.status = 'COMPLETED'
			""")
			BigDecimal getTotalRevenueByBranch(
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT
			        COALESCE(UPPER(o.status), 'UNKNOWN'),
			        COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			    GROUP BY COALESCE(UPPER(o.status), 'UNKNOWN')
			""")
			List<Object[]> countOrdersByStatusByBranch(
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		List<OrdersEntity> findByKitchenIdAndStatusAndCreatedAtBetween(UsersEntity kitchenUser, String status,
				LocalDateTime fromDateTime, LocalDateTime toDateTime);

		List<OrdersEntity> findByKitchenIdAndCreatedAtBetween(UsersEntity kitchenUser, LocalDateTime fromDateTime,
				LocalDateTime toDateTime);

		List<OrdersEntity> findAll(Specification<OrdersEntity> spec);
		@Query("""
			    SELECT COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.cashierId = :cashier
			      AND o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			""")
			Long countTotalOrdersByCashier(
			        @Param("cashier") UsersEntity cashier,
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT COALESCE(SUM(COALESCE(o.totalAmount, 0)), 0)
			    FROM OrdersEntity o
			    WHERE o.cashierId = :cashier
			      AND o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			      AND UPPER(COALESCE(o.paymentStatus, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
			""")
			BigDecimal getTotalRevenueByCashier(
			        @Param("cashier") UsersEntity cashier,
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT
			        COALESCE(UPPER(o.status), 'UNKNOWN'),
			        COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.cashierId = :cashier
			      AND o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			    GROUP BY COALESCE(UPPER(o.status), 'UNKNOWN')
			""")
			List<Object[]> countOrdersByStatusByCashier(
			        @Param("cashier") UsersEntity cashier,
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.captainId = :captain
			      AND o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			""")
			Long countTotalOrdersByCaptain(
			        @Param("captain") UsersEntity captain,
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT COALESCE(SUM(COALESCE(o.totalAmount, 0)), 0)
			    FROM OrdersEntity o
			    WHERE o.captainId = :captain
			      AND o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			      AND UPPER(COALESCE(o.paymentStatus, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
			""")
			BigDecimal getTotalRevenueByCaptain(
			        @Param("captain") UsersEntity captain,
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		@Query("""
			    SELECT
			        COALESCE(UPPER(o.status), 'UNKNOWN'),
			        COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.captainId = :captain
			      AND o.branchId = :branch
			      AND o.createdAt BETWEEN :from AND :to
			    GROUP BY COALESCE(UPPER(o.status), 'UNKNOWN')
			""")
			List<Object[]> countOrdersByStatusByCaptain(
			        @Param("captain") UsersEntity captain,
			        @Param("branch") UsersEntity branch,
			        @Param("from") LocalDateTime from,
			        @Param("to") LocalDateTime to
			);

		List<OrdersEntity> findByCashierIdAndCreatedAtBetween(UsersEntity branch, LocalDateTime fromDateTime,
				LocalDateTime toDateTime);

		List<OrdersEntity> findByCaptainIdAndCreatedAtBetween(UsersEntity captain, LocalDateTime fromDateTime,
				LocalDateTime toDateTime);

		List<OrdersEntity> findByDeliveryIdAndCreatedAtBetween(UsersEntity branch, LocalDateTime fromDateTime,
				LocalDateTime toDateTime);
		
		@Query(value = """
			    SELECT COUNT(*)
			    FROM orders o
			    WHERE o.status = :status
			      AND o.branch_id = :branchId
			      AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			      AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			""", nativeQuery = true)
			Long countPendingByBranchIdAndDate(
			        @Param("status") String status,
			        @Param("branchId") Long branchId,
			        @Param("fromDate") LocalDateTime fromDate,
			        @Param("toDate") LocalDateTime toDate
			);
		@Query(value = """
			    SELECT o.status, COUNT(*)
			    FROM orders o
			    WHERE o.kitchen_id = :kitchenId
			      AND o.status <> 'PENDING'
			      AND (CAST(:fromDate AS timestamp) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp))
			      AND (CAST(:toDate AS timestamp) IS NULL OR o.created_at <= CAST(:toDate AS timestamp))
			    GROUP BY o.status
			""", nativeQuery = true)
			List<Object[]> countByKitchenIdAndStatusNotPendingAndDate(
			        @Param("kitchenId") Long kitchenId,
			        @Param("fromDate") LocalDateTime fromDate,
			        @Param("toDate") LocalDateTime toDate
			);

	Long countByCustomerId_Id(Long customerId);

	@Query("""
		    SELECT o.restaurantId.id, o.restaurantId.name, COUNT(o),
		           COALESCE(SUM(CASE WHEN UPPER(o.paymentStatus) = 'PAID' AND UPPER(o.status) = 'COMPLETED' THEN o.totalAmount ELSE 0 END), 0),
		           SUM(CASE WHEN UPPER(o.status) = 'PENDING' THEN 1 ELSE 0 END),
		           SUM(CASE WHEN UPPER(o.status) = 'COMPLETED' THEN 1 ELSE 0 END),
		           SUM(CASE WHEN UPPER(o.status) = 'CANCELLED' THEN 1 ELSE 0 END)
		    FROM OrdersEntity o
		    WHERE o.createdAt BETWEEN :from AND :to
		    GROUP BY o.restaurantId.id, o.restaurantId.name
		""")
	List<Object[]> getRestaurantOrderStats(
		        @Param("from") LocalDateTime from,
		        @Param("to") LocalDateTime to
		);

	// ================= DASHBOARD METHODS (RESTAURANT-SCOPED) =================

	@Query("""
		    SELECT COUNT(o)
		    FROM OrdersEntity o
		    WHERE o.restaurantId = :restaurant
		      AND o.createdAt BETWEEN :from AND :to
		""")
	Long countTodayOrders(@Param("restaurant") UsersEntity restaurant,
	                       @Param("from") LocalDateTime from,
	                       @Param("to") LocalDateTime to);

	@Query("""
		    SELECT COALESCE(SUM(o.totalAmount), 0)
		    FROM OrdersEntity o
		    WHERE o.restaurantId = :restaurant
		      AND o.createdAt BETWEEN :from AND :to
		      AND o.paymentStatus = 'PAID'
		""")
	BigDecimal getTodayRevenue(@Param("restaurant") UsersEntity restaurant,
	                            @Param("from") LocalDateTime from,
	                            @Param("to") LocalDateTime to);

	@Query("""
		    SELECT COUNT(DISTINCT o.customerId.id)
		    FROM OrdersEntity o
		    WHERE o.restaurantId = :restaurant
		""")
	Long countDistinctCustomers(@Param("restaurant") UsersEntity restaurant);

	@Query(nativeQuery = true, value = """
		    SELECT TO_CHAR(DATE_TRUNC('day', o.created_at), 'YYYY-MM-DD') as date,
		           COALESCE(SUM(o.total_amount), 0) as revenue
		    FROM orders o
		    WHERE o.restaurant_id = :restaurantId
		      AND o.created_at >= :from
		      AND o.payment_status = 'PAID'
		    GROUP BY DATE_TRUNC('day', o.created_at)
		    ORDER BY DATE_TRUNC('day', o.created_at)
		""")
	List<Object[]> getDailyRevenueTrend(@Param("restaurantId") Long restaurantId,
	                                     @Param("from") LocalDateTime from);

	List<OrdersEntity> findTop5ByRestaurantIdOrderByCreatedAtDesc(UsersEntity restaurant);

	@Query(value = "SELECT COUNT(*) FROM orders WHERE kitchen_id = :kitchenId AND created_at::date = CURRENT_DATE", nativeQuery = true)
	Long countTodayOrdersByKitchen(@Param("kitchenId") Long kitchenId);

	@Modifying
	@Transactional
	@Query(value = """
		UPDATE orders SET
		    status     = :status,
		    kitchen_id = :kitchenId,
		    kitchen_accept_at = CASE
		        WHEN :status IN ('ACCEPTED_ORDER','CONFIRMED')
		        THEN COALESCE(kitchen_accept_at, NOW())
		        ELSE kitchen_accept_at
		    END,
		    kitchen_ready_at = CASE
		        WHEN :status IN ('READY_FOR_ORDER','READY')
		        THEN COALESCE(kitchen_ready_at, NOW())
		        ELSE kitchen_ready_at
		    END,
		    updated_at = NOW()
		WHERE id = :orderId
	""", nativeQuery = true)
	int updateOrderStatusByKitchen(
		@Param("orderId") Long orderId,
		@Param("status") String status,
		@Param("kitchenId") Long kitchenId
	);

}
