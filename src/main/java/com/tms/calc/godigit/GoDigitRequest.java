package com.tms.calc.godigit;

import java.util.Set;

public class GoDigitRequest {
    public double loanAmount;
    public int policyYear; // 1..3
    public int age; // 18..60
    public double emiAmount; // required if EMI selected
    public Set<CoverageType> coverages;
}


