package com.tms.calc;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InputRequest {
    @NotBlank
    // expected format dd/MM/yyyy
    private String dob;

    @Min(0)
    private Integer loanTenureYears;

    @Min(0)
    private Integer policyTenureYears;

    @NotNull
    @DecimalMin("0")
    private BigDecimal loanAmount;

    // percent of loan value, e.g. 100 means 100% => sum insured = loanAmount * 1.0
    @NotNull
    @DecimalMin("0")
    private BigDecimal sumInsuredPercent;

    // EMI add-on amount if any
    @DecimalMin("0")
    private BigDecimal emiAmount;

    // health indemnity values: "NIL", "1L", "2L", "3L" etc
    private String healthIndemnity;

    // cover for co-applicant: Yes/No
    private Boolean coApplicantCover;
}
