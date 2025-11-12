package com.tms.calc;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OutputResponse {
    private Integer age;
    private Integer policyTenureYears;
    private BigDecimal sumInsured;
    private BigDecimal emiAmount;
    private String healthIndemnity;
    private Boolean coApplicantCover;

    // example computed fields
    private BigDecimal premiumExclGst;
    private BigDecimal premiumInclGst;
}
