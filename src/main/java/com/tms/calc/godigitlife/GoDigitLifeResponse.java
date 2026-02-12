package com.tms.calc.godigitlife;

public class GoDigitLifeResponse {
    public double premiumExclGst;
    public double premiumInclGst;
    
    // For Joint Life - breakdown
    public Double firstLifePremium;
    public Double secondLifePremium;
    public Double jointLifeDiscount; // 5% discount amount
    
    // Calculation details
    public double ratePerThousand;
    public String ageBand;
    public int coverTermMonths;
    public double sumAssured;
    public LifeType lifeType;
    public String nmlStatus; // Non-Medical Limits status
}

