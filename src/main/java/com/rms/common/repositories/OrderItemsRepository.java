package com.rms.common.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.OrderItemsEntity;

import org.springframework.data.repository.query.Param;

@Repository
public interface OrderItemsRepository extends JpaRepository<OrderItemsEntity, Long> {
    Page<OrderItemsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderItemsEntity> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderItemsEntity> findByCreatedAt(LocalDateTime date);

    Page<OrderItemsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
    List<OrderItemsEntity> findByUpdatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);
    List<OrderItemsEntity> findByUpdatedAt(LocalDateTime date);

    // Custom Methods
    Page<OrderItemsEntity> findAll(Pageable pageable);
	void deleteByOrderId_Id(Long orderId);
	List<OrderItemsEntity> findByOrderId_Id(Long orderId);
	

	
	@Query("""
		    SELECT oi
		    FROM OrderItemsEntity oi
		    WHERE oi.id IN (
		        SELECT MIN(oi2.id)
		        FROM OrderItemsEntity oi2
		        JOIN oi2.orderId o2
		        WHERE o2.customerId.id = :customerId
		        GROUP BY oi2.menuItemId.id
		    )
		""")
		List<OrderItemsEntity> findUniqueOrderItemsByCustomerId(
		        @Param("customerId") Long customerId
		);
//	@Query(
//		    value = """
//		        SELECT oi
//		        FROM OrderItemsEntity oi
//		        WHERE oi.id IN (
//		            SELECT MIN(oi2.id)
//		            FROM OrderItemsEntity oi2
//		            JOIN oi2.orderId o2
//		            WHERE o2.customerId.id = :customerId
//		            GROUP BY oi2.menuItemId.id
//		        )
//		        ORDER BY oi.createdAt DESC
//		    """,
//		    countQuery = """
//		        SELECT COUNT(DISTINCT oi2.menuItemId.id)
//		        FROM OrderItemsEntity oi2
//		        JOIN oi2.orderId o2
//		        WHERE o2.customerId.id = :customerId
//		    """
//		)
//		Page<OrderItemsEntity> findUniqueOrderItemsByCustomerId(
//		        @Param("customerId") Long customerId,
//		        Pageable pageable
//		);


	
//	@Query("""
//		    SELECT oi
//		    FROM OrderItemsEntity oi
//		    WHERE oi.id IN (
//		        SELECT MIN(oi2.id)
//		        FROM OrderItemsEntity oi2
//		        JOIN oi2.orderId o2
//		        WHERE o2.customerId.id = :customerId
//		        GROUP BY oi2.menuItemId.id
//		    )
//		    ORDER BY oi.createdAt DESC
//		""")
//		Page<OrderItemsEntity> findUniqueOrderItemsByCustomerId(
//		        @Param("customerId") Long customerId,
//		        Pageable pageable
//		);

	@Query(nativeQuery = true, value = """
		    SELECT oi.menu_item_name, COUNT(*) as order_count, COALESCE(SUM(oi.item_total), 0) as revenue
		    FROM order_items oi
		    JOIN orders o ON oi.order_id = o.id
		    WHERE o.restaurant_id = :restaurantId
		      AND o.created_at BETWEEN :from AND :to
		    GROUP BY oi.menu_item_name
		    ORDER BY order_count DESC
		    LIMIT 5
		""")
	List<Object[]> findTopMenuItems(@Param("restaurantId") Long restaurantId,
	                                 @Param("from") LocalDateTime from,
	                                 @Param("to") LocalDateTime to);

}
