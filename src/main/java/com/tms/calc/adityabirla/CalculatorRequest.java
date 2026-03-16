package com.tms.calc.adityabirla;

import java.util.Set;

public class CalculatorRequest {
    public double loanAmount;
    public int loanTenure;
    public int age;
    public double emiAmount;
    public Set<ProductType> products;
    public Integer policyTerm; // 1-5 years for Cancer Secure
}