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
@Table(name = "app_version")
public class AppVersionEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	private Long id;

	@Column(name = "platform")
	private String platform;

	@Column(name = "version_name")
	private String versionName;
	
	@Column(name = "latest_version")
	private String latestVersion;

	@Column(name = "minimum_version")
	private String minimumVersion;

	@Column(name = "is_force_update")
	private String isForceUpdate;

	@Column(name = "playstore_url")
	private String playstoreUrl;

	
	@Column(name = "app_store_url")
	private String appStoreUrl;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {		
		if (this.createdAt == null)
			this.createdAt = LocalDateTime.now();
		if (this.updatedAt == null)
			this.updatedAt = LocalDateTime.now();
	}


}
