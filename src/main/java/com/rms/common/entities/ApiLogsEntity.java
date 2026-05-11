package com.rms.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.rms.common.converter.JsonNodeConverter;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "api_logs")
public class ApiLogsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer id;

	@Column(name = "service_type")
	private String serviceType;

	@Size(max = 255)
	@Column(name = "txn_id")
	private String txnId;

//    
	@Convert(converter = JsonNodeConverter.class)
	@Column(name = "request", columnDefinition = "Text")
	private JsonNode request;
//    @Column(name = "request",columnDefinition = "Text")
//    private String request;

	@Convert(converter = JsonNodeConverter.class)
	@Column(name = "response", columnDefinition = "json")
	private JsonNode response;
//    @Column(name = "response")
//    private String response;

	@Column(name = "date")
	private LocalDate date;

	@Column(name = "time")
	private LocalTime time;

	@Size(max = 50)
	@Column(name = "operator_no")
	private String operatorNo;

	@Size(max = 50)
	@Column(name = "api_ref_id")
	private String apiRefId;

//    @Column(name = "operator_id")
//    private Integer operatorId;
//	@ManyToOne
//	@JoinColumn(name = "operator_id")
////   	@JsonIgnoreProperties({ "hibernateLazyInitializer","password" })
////   	private OperatorEntity operatorId;

	@Column(name = "latency")
	private Integer latency;

	@PrePersist
	protected void onCreate() {
		ZoneId zoneId = ZoneId.of("Asia/Kolkata");
		ZonedDateTime nowInKolkata = ZonedDateTime.now(zoneId);

		this.date = nowInKolkata.toLocalDate(); // LocalDate in Asia/Kolkata
		this.time = nowInKolkata.toLocalTime(); // LocalTime in Asia/Kolkata
	}

}
