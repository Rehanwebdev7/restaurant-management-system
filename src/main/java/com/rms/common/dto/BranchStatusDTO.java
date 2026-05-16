package com.rms.common.dto;

import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BranchStatusDTO {
    private Long branchId;
    private String branchName;
    private Boolean adminStopped;
    private String orderStoppedAt;
    private String orderStoppedBy;
}
