package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "menu_item_addons")
public class MenuItemAddonsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private MenuItemsEntity menuItemId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "addon_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AddonsEntity addonId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
    }
}
