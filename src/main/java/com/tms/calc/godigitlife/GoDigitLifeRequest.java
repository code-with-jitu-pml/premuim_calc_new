package com.tms.calc.godigitlife;

public class GoDigitLifeRequest {
    public int entryAge; // Age as on last birthday (18-79)
    public double sumAssured; // Min 10L, Max 20Cr
    public int coverTermMonths; // 12, 24, or 36 months
    public LifeType lifeType; // SINGLE or JOINT
    
    // For Joint Life
    public Integer secondLifeAge; // Required if lifeType is JOINT
    
    // Optional: Loan amount for validation
    public Double loanAmount;
}

