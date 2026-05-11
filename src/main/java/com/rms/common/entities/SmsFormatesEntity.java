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
@Table(name = "sms_formates")
public class SmsFormatesEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "message")
    private String message;

    @Column(name = "sender_id")
    private String senderId;

    @Column(name = "service")
    private String service;

    @Column(name = "template_id")
    private String templateId;

    @Column(name = "user_id")
    private Integer userId;

}
