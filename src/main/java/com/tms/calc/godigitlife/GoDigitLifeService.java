package com.tms.calc.godigitlife;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class GoDigitLifeService {
    
    private static final double GST_MULTIPLIER = 1.18;
    private static final double JOINT_LIFE_MULTIPLIER = 0.95; // 95% of sum of both lives
    
    // Non-Medical Limits (NML) by age band
    private static final Map<String, Double> NML_LIMITS = Map.of(
            "18-45", 1_50_00_000.0,
            "46-50", 1_00_00_000.0,
            "51-55", 50_00_000.0,
            "56-60", 20_00_000.0,
            "61-65", 0.0 // Medical underwriting required
    );
    
    // Rate table: Premium per 1000 of Sum Assured
    // Map<Age, Map<TermMonths, Rate>>
    private static final Map<Integer, Map<Integer, Double>> RATE_TABLE = initializeRateTable();
    
    private static Map<Integer, Map<Integer, Double>> initializeRateTable() {
        Map<Integer, Map<Integer, Double>> table = new HashMap<>();
        
        // Age 18-45
        table.put(18, Map.of(12, 1.76, 24, 3.18, 36, 4.66));
        table.put(19, Map.of(12, 1.80, 24, 3.27, 36, 4.77));
        table.put(20, Map.of(12, 1.84, 24, 3.32, 36, 4.84));
        table.put(21, Map.of(12, 1.85, 24, 3.34, 36, 4.87));
        table.put(22, Map.of(12, 1.86, 24, 3.35, 36, 4.87));
        table.put(23, Map.of(12, 1.85, 24, 3.35, 36, 4.87));
        table.put(24, Map.of(12, 1.85, 24, 3.34, 36, 4.85));
        table.put(25, Map.of(12, 1.85, 24, 3.33, 36, 4.85));
        table.put(26, Map.of(12, 1.85, 24, 3.33, 36, 4.86));
        table.put(27, Map.of(12, 1.85, 24, 3.35, 36, 4.89));
        table.put(28, Map.of(12, 1.86, 24, 3.38, 36, 4.94));
        table.put(29, Map.of(12, 1.89, 24, 3.43, 36, 5.03));
        table.put(30, Map.of(12, 1.92, 24, 3.50, 36, 5.15));
        table.put(31, Map.of(12, 1.97, 24, 3.60, 36, 5.30));
        table.put(32, Map.of(12, 2.03, 24, 3.72, 36, 5.50));
        table.put(33, Map.of(12, 2.10, 24, 3.86, 36, 5.73));
        table.put(34, Map.of(12, 2.18, 24, 4.04, 36, 6.01));
        table.put(35, Map.of(12, 2.28, 24, 4.24, 36, 6.33));
        table.put(36, Map.of(12, 2.40, 24, 4.48, 36, 6.70));
        table.put(37, Map.of(12, 2.53, 24, 4.75, 36, 7.12));
        table.put(38, Map.of(12, 2.69, 24, 5.06, 36, 7.60));
        table.put(39, Map.of(12, 2.86, 24, 5.41, 36, 8.14));
        table.put(40, Map.of(12, 3.05, 24, 5.79, 36, 8.75));
        table.put(41, Map.of(12, 3.27, 24, 6.23, 36, 9.43));
        table.put(42, Map.of(12, 3.52, 24, 6.73, 36, 10.21));
        table.put(43, Map.of(12, 3.80, 24, 7.30, 36, 11.11));
        table.put(44, Map.of(12, 4.12, 24, 7.96, 36, 12.14));
        table.put(45, Map.of(12, 4.50, 24, 8.72, 36, 13.34));
        
        // Age 46-50
        table.put(46, Map.of(12, 4.93, 24, 9.61, 36, 14.74));
        table.put(47, Map.of(12, 5.44, 24, 10.64, 36, 16.35));
        table.put(48, Map.of(12, 6.03, 24, 11.83, 36, 18.21));
        table.put(49, Map.of(12, 6.71, 24, 13.19, 36, 20.32));
        table.put(50, Map.of(12, 7.47, 24, 14.72, 36, 22.68));
        
        // Age 51-55
        table.put(51, Map.of(12, 8.33, 24, 16.42, 36, 25.27));
        table.put(52, Map.of(12, 9.26, 24, 18.25, 36, 28.06));
        table.put(53, Map.of(12, 10.26, 24, 20.21, 36, 31.01));
        table.put(54, Map.of(12, 11.31, 24, 22.26, 36, 34.08));
        table.put(55, Map.of(12, 12.39, 24, 24.38, 36, 37.24));
        
        // Age 56-60
        table.put(56, Map.of(12, 13.51, 24, 26.54, 36, 40.46));
        table.put(57, Map.of(12, 14.64, 24, 28.74, 36, 43.74));
        table.put(58, Map.of(12, 15.80, 24, 30.98, 36, 47.08));
        table.put(59, Map.of(12, 16.98, 24, 33.27, 36, 50.50));
        table.put(60, Map.of(12, 18.20, 24, 35.65, 36, 54.07));
        
        // Age 61-65
        table.put(61, Map.of(12, 19.48, 24, 38.15, 36, 57.84));
        table.put(62, Map.of(12, 20.85, 24, 40.83, 36, 61.89));
        table.put(63, Map.of(12, 22.33, 24, 43.74, 36, 66.30));
        table.put(64, Map.of(12, 23.95, 24, 46.93, 36, 71.15));
        table.put(65, Map.of(12, 25.75, 24, 50.47, 36, 76.53));
        
        // Age 66-70
        table.put(66, Map.of(12, 27.76, 24, 54.42, 36, 82.52));
        table.put(67, Map.of(12, 30.01, 24, 58.84, 36, 89.20));
        table.put(68, Map.of(12, 32.53, 24, 63.77, 36, 96.64));
        table.put(69, Map.of(12, 35.36, 24, 69.28, 36, 104.92));
        table.put(70, Map.of(12, 38.51, 24, 75.41, 36, 114.11));
        
        // Age 71-75
        table.put(71, Map.of(12, 42.03, 24, 82.23, 36, 124.27));
        table.put(72, Map.of(12, 45.94, 24, 89.78, 36, 135.47));
        table.put(73, Map.of(12, 50.29, 24, 98.12, 36, 147.79));
        table.put(74, Map.of(12, 55.10, 24, 107.31, 36, 161.28));
        table.put(75, Map.of(12, 60.43, 24, 117.42, 36, 176.04));
        
        // Age 76-79
        table.put(76, Map.of(12, 66.30, 24, 128.51, 36, 192.12));
        table.put(77, Map.of(12, 72.77, 24, 140.66, 36, 209.60));
        table.put(78, Map.of(12, 79.89, 24, 153.92));
        table.put(79, Map.of(12, 87.72));
        
        return table;
    }
    
    public GoDigitLifeResponse calculate(GoDigitLifeRequest req) {
        validate(req);
        
        GoDigitLifeResponse res = new GoDigitLifeResponse();
        res.sumAssured = req.sumAssured;
        res.coverTermMonths = req.coverTermMonths;
        res.lifeType = req.lifeType;
        
        // Determine NML status based on entry age (use first life age for joint life)
        res.nmlStatus = getNMLStatus(req.entryAge, req.sumAssured);
        
        if (req.lifeType == LifeType.SINGLE) {
            double rate = getRate(req.entryAge, req.coverTermMonths);
            res.ratePerThousand = rate;
            res.ageBand = getAgeBand(req.entryAge);
            res.premiumExclGst = (req.sumAssured / 1000) * rate;
            res.premiumInclGst = round2(res.premiumExclGst * GST_MULTIPLIER);
        } else {
            // Joint Life: 95% of (Premium1 + Premium2)
            double rate1 = getRate(req.entryAge, req.coverTermMonths);
            double rate2 = getRate(req.secondLifeAge, req.coverTermMonths);
            
            res.firstLifePremium = (req.sumAssured / 1000) * rate1;
            res.secondLifePremium = (req.sumAssured / 1000) * rate2;
            
            double sumPremiums = res.firstLifePremium + res.secondLifePremium;
            res.jointLifeDiscount = sumPremiums * 0.05; // 5% discount
            res.premiumExclGst = round2(sumPremiums * JOINT_LIFE_MULTIPLIER);
            res.premiumInclGst = round2(res.premiumExclGst * GST_MULTIPLIER);
            
            res.ratePerThousand = (rate1 + rate2) / 2; // Average for display
            res.ageBand = getAgeBand(req.entryAge) + " & " + getAgeBand(req.secondLifeAge);
        }
        
        return res;
    }
    
    private double getRate(int age, int termMonths) {
        Map<Integer, Double> ageRates = RATE_TABLE.get(age);
        if (ageRates == null) {
            throw new IllegalArgumentException("Invalid age: " + age + ". Age must be between 18-79.");
        }
        
        Double rate = ageRates.get(termMonths);
        if (rate == null) {
            throw new IllegalArgumentException("Invalid cover term: " + termMonths + ". Term must be 12, 24, or 36 months.");
        }
        
        return rate;
    }
    
    private String getAgeBand(int age) {
        if (age >= 18 && age <= 45) return "18-45";
        if (age >= 46 && age <= 50) return "46-50";
        if (age >= 51 && age <= 55) return "51-55";
        if (age >= 56 && age <= 60) return "56-60";
        if (age >= 61 && age <= 65) return "61-65";
        return "66+";
    }
    
    private void validate(GoDigitLifeRequest req) {
        if (req.entryAge < 18 || req.entryAge > 79) {
            throw new IllegalArgumentException("Entry age must be between 18-79 years.");
        }
        
        if (req.sumAssured < 10_00_000 || req.sumAssured > 20_00_00_000) {
            throw new IllegalArgumentException("Sum Assured must be between INR 10,00,000 and INR 20,00,00,000.");
        }
        
        if (req.coverTermMonths != 12 && req.coverTermMonths != 24 && req.coverTermMonths != 36) {
            throw new IllegalArgumentException("Cover term must be 12, 24, or 36 months.");
        }
        
        if (req.lifeType == LifeType.JOINT) {
            if (req.secondLifeAge == null) {
                throw new IllegalArgumentException("Second life age is required for Joint Life.");
            }
            if (req.secondLifeAge < 18 || req.secondLifeAge > 79) {
                throw new IllegalArgumentException("Second life age must be between 18-79 years.");
            }
        }
        
        // Check NML limits
        String ageBand = getAgeBand(req.entryAge);
        Double nmlLimit = NML_LIMITS.get(ageBand);
        if (nmlLimit != null && req.sumAssured > nmlLimit && nmlLimit > 0) {
            // Warning: Above NML, medical underwriting may be required
            // We'll allow it but could add a warning flag
        }
    }
    
    private String getNMLStatus(int age, double sumAssured) {
        String ageBand = getAgeBand(age);
        Double nmlLimit = NML_LIMITS.get(ageBand);
        
        if (nmlLimit == null) {
            return "N/A";
        }
        
        if (nmlLimit == 0.0) {
            return "Medical Underwriting Required";
        }
        
        if (sumAssured <= nmlLimit) {
            return "NM (Non-Medical)";
        } else {
            return "Medical Underwriting Required (Above NML: " + formatCurrency(nmlLimit) + ")";
        }
    }
    
    private String formatCurrency(double amount) {
        if (amount >= 1_00_00_000) {
            return String.format("₹%.2f Cr", amount / 1_00_00_000);
        } else if (amount >= 1_00_000) {
            return String.format("₹%.2f L", amount / 1_00_000);
        } else {
            return String.format("₹%.0f", amount);
        }
    }
    
    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}

