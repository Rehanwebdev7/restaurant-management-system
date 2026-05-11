package com.rms.common.dto;

import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BranchStatusDTO {
    private Long branchId;
    private String status;
}
