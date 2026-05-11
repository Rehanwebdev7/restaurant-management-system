package com.rms.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;
@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "global_setting")
public class GlobalSettingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Size(max = 255)
    @Column(name = "cron_on_off")
    private String cronOnOff;

    @Size(max = 255)
    @Column(name = "lock_system")
    private String lockSystem;

    @Size(max = 255)
    @Column(name = "maintainance_mode")
    private String maintainanceMode;

    @Size(max = 255)
    @Column(name = "system_ip")
    private String systemIp;

    @Size(max = 255)
    @Column(name = "latest_version")
    private String latestVersion;

    @Size(max = 255)
    @Column(name = "force_update")
    private String forceUpdate;

    @Digits(integer = 10, fraction = 2)
	@Column(name = "min_amount")
	private BigDecimal minAmount;

}