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
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.OrdersEntity;
import com.rms.common.entities.UsersEntity;

@Repository
public interface OrdersRepository extends JpaRepository<OrdersEntity, Long> {
	Optional<OrdersEntity> findByOrderNumber(String order_number);

	Page<OrdersEntity> findByCaptainId_Id(Long captainId, Pageable pageable);

	Optional<OrdersEntity> findByIdAndCaptainId_Id(Long id, Long captainId);

	List<OrdersEntity> findByTableBookingId_IdOrderByIdAsc(Long tableBookingId);

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
			      AND o.paymentStatus = 'PAID'
			      AND o.status = 'COMPLETED'
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
			      AND o.paymentStatus = 'PAID'
			      AND o.status = 'COMPLETED'
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
		
		@Query("""
			    SELECT COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.status = :status
			      AND o.branchId.id = :branchId
			""")
			Long countByStatusAndBranchId_Id(
			        @Param("status") String status,
			        @Param("branchId") Long branchId
			);
		@Query("""
			    SELECT o.status, COUNT(o)
			    FROM OrdersEntity o
			    WHERE o.kitchenId.id = :kitchenId
			      AND o.status <> 'PENDING'
			    GROUP BY o.status
			""")
			List<Object[]> countByKitchenIdAndStatusNotPending(
			        @Param("kitchenId") Long kitchenId
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

}
