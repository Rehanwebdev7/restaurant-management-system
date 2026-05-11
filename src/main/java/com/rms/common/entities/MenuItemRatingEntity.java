package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(
    name = "menu_item_ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"menu_item_id", "mobile_number"})
)
public class MenuItemRatingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItemsEntity menuItem;

    /** Customer identified by mobile number (works for guests too) */
    @Column(name = "mobile_number", length = 20)
    private String mobileNumber;

    /** Rating value: 1 to 5 */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
