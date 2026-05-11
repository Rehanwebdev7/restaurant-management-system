package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "table_release_schedule",
        indexes = {
                @Index(name = "idx_trs_processed_release_at", columnList = "processed,release_at"),
                @Index(name = "idx_trs_dining_table_id", columnList = "dining_table_id")
        })
public class TableReleaseScheduleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "dining_table_id", nullable = false)
    private Long diningTableId;

    @Column(name = "release_at", nullable = false)
    private LocalDateTime releaseAt;

    @Column(name = "processed", nullable = false)
    private Boolean processed;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.processed == null) this.processed = false;
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}
