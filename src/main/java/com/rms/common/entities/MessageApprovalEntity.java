package com.rms.common.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "message_approval")
public class MessageApprovalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "email")
    private Boolean email ;

    @Column(name = "name")
    private String name;

    @Column(name = "sms")
    private Boolean sms ;

    @Column(name = "whatsapp")
    private Boolean whatsapp ;
    
    @Column(name = "app")
    private Boolean app ;

}
