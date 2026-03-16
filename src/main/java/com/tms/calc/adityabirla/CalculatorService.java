//package com.tms.calc.adityabirla;
//
//
//import org.springframework.stereotype.Service;
//
//import java.util.Map;
//
//@Service
//public class CalculatorService {
//
//    private static final Map<Integer, Double> GCI_RATE = Map.of(
//            1, 3.00,
//            2, 5.58,
//            3, 8.16,
//            4, 10.70,
//            5, 13.31
//    );
//
//    private static final Map<Integer, Integer> GPA_RATE = Map.of(
//            1, 32,
//            2, 59,
//            3, 86,
//            4, 113,
//            5, 140
//    );
//
//    private static final Map<Integer, Integer> EMI_RATE = Map.of(
//            1, 108,
//            2, 202,
//            3, 294,
//            4, 385,
//            5, 479
//    );
//
//    public CalculatorResponse calculate(CalculatorRequest req) {
//
//        CalculatorResponse res = new CalculatorResponse();
//
//        if (req.products.contains(ProductType.GCI)) {
//            res.gciPremium = calculateGci(req);
//        }
//
//        if (req.products.contains(ProductType.GPA)) {
//            res.gpaPremium = calculateGpa(req);
//        }
//
//        if (req.products.contains(ProductType.EMI_PROTECT)) {
//            res.emiProtectPremium = calculateEmi(req);
//        }
//
//        res.totalPremium = res.gciPremium + res.gpaPremium + res.emiProtectPremium;
//        return res;
//    }
//
//    private double calculateGci(CalculatorRequest req) {
//        // Annual income removed from flow; keep sum insured capped at 50L (as currently used)
//        double si = Math.min(req.loanAmount, 50_00_000);
//        return (si / 1000) * GCI_RATE.get(req.loanTenure);
//    }
//
//    private double calculateGpa(CalculatorRequest req) {
//        double si = Math.min(req.loanAmount, 10_00_00_000);
//        return (si / 100000) * GPA_RATE.get(req.loanTenure);
//    }
//
//    private double calculateEmi(CalculatorRequest req) {
//        double si = Math.min(req.emiAmount, 5_00_000);
//        return (si / 1000) * EMI_RATE.get(req.loanTenure);
//    }
//}



package com.tms.calc.adityabirla;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class CalculatorService {

    private static final Map<Integer, Double> GCI_RATE = Map.of(
            1, 3.00,
            2, 5.58,
            3, 8.16,
            4, 10.70,
            5, 13.31
    );

    // Update GPA_RATE to use correct values (divide by 100)
    private static final Map<Integer, Double> GPA_RATE = Map.of(
            1, 0.32,   // 32/100
            2, 0.59,   // 59/100
            3, 0.86,   // 86/100
            4, 1.13,   // 113/100
            5, 1.40    // 140/100
    );

    private static final Map<Integer, Integer> EMI_RATE = Map.of(
            1, 108,
            2, 202,
            3, 294,
            4, 385,
            5, 479
    );

    // Cancer Secure rates based on age band and policy term
    private static final Map<String, Map<Integer, Double>> CANCER_RATES = Map.of(
            "18-25", Map.of(
                    1, 0.26432,
                    2, 0.550666666666667,
                    3, 0.852746666666667,
                    4, 1.14853333333333,
                    5, 1.46634666666667
            ),
            "26-30", Map.of(
                    1, 0.34928,
                    2, 0.723733333333333,
                    3, 1.10448,
                    4, 1.48522666666667,
                    5, 1.90058666666667
            ),
            "31-35", Map.of(
                    1, 0.446826666666667,
                    2, 0.93456,
                    3, 1.43173333333333,
                    4, 1.91946666666667,
                    5, 2.4544
            ),
            "36-40", Map.of(
                    1, 0.733173333333333,
                    2, 1.52298666666667,
                    3, 2.35370666666667,
                    4, 3.15925333333333,
                    5, 4.04032
            ),
            "41-45", Map.of(
                    1, 1.17370666666667,
                    2, 2.44810666666667,
                    3, 3.75712,
                    4, 5.04725333333333,
                    5, 6.46010666666667
            ),
            "46-50", Map.of(
                    1, 1.70549333333333,
                    2, 3.54944,
                    3, 5.46576,
                    4, 7.33488,
                    5, 9.3928
            ),
            "51-55", Map.of(
                    1, 2.51733333333333,
                    2, 5.2392,
                    3, 8.0712,
                    4, 10.8402666666667,
                    5, 13.8610666666667
            ),
            "56-60", Map.of(
                    1, 7.86981333333333,
                    2, 16.3752533333333,
                    3, 25.2016533333333,
                    4, 33.8581333333333,
                    5, 43.3044266666667
            )
    );

    public CalculatorResponse calculate(CalculatorRequest req) {
        CalculatorResponse res = new CalculatorResponse();

        // Initialize all fields to 0
        res.gciPremium = 0.0;
        res.gpaPremium = 0.0;
        res.emiProtectPremium = 0.0;
        res.cancerSecurePremium = 0.0;

        if (req.products != null) {
            if (req.products.contains(ProductType.GCI)) {
                res.gciPremium = calculateGci(req);
            }

            if (req.products.contains(ProductType.GPA)) {
                res.gpaPremium = calculateGpa(req);
            }

            if (req.products.contains(ProductType.EMI_PROTECT)) {
                res.emiProtectPremium = calculateEmi(req);
            }

            if (req.products.contains(ProductType.CANCER_SECURE)) {
                res.cancerSecurePremium = calculateCancerSecure(req);
            }
        }

        res.totalPremium = res.gciPremium + res.gpaPremium +
                res.emiProtectPremium + res.cancerSecurePremium;
        return res;
    }

    private double calculateGci(CalculatorRequest req) {
        double si = Math.min(req.loanAmount, 50_00_000);
        return roundToTwoDecimals((si / 1000) * GCI_RATE.get(req.loanTenure));
    }

    // Update calculateGpa method
    private double calculateGpa(CalculatorRequest req) {
        double si = Math.min(req.loanAmount, 10_00_00_000);
        return roundToTwoDecimals((si / 100000) * GPA_RATE.get(req.loanTenure));
    }

    private double calculateEmi(CalculatorRequest req) {
        double si = Math.min(req.emiAmount, 5_00_000);
        return roundToTwoDecimals((si / 1000) * EMI_RATE.get(req.loanTenure));
    }

    private double calculateCancerSecure(CalculatorRequest req) {
        // Validate age
        if (req.age < 18 || req.age > 60) {
            throw new IllegalArgumentException("Age must be between 18 and 60 years for Cancer Secure cover");
        }

        // Validate policy term
        int term = req.policyTerm != null ? req.policyTerm : 1;
        if (term < 1 || term > 5) {
            throw new IllegalArgumentException("Policy term must be between 1 and 5 years");
        }

        // Get age band and rate
        String ageBand = getAgeBand(req.age);
        Double rate = CANCER_RATES.get(ageBand).get(term);

        if (rate == null) {
            throw new IllegalArgumentException("Invalid age band or policy term combination");
        }

        // Sum insured fixed at 50 Lakhs as per quote
        double si = 5_000_000;
        return roundToTwoDecimals((si / 1000) * rate);
    }

    private String getAgeBand(int age) {
        if (age >= 18 && age <= 25) return "18-25";
        if (age >= 26 && age <= 30) return "26-30";
        if (age >= 31 && age <= 35) return "31-35";
        if (age >= 36 && age <= 40) return "36-40";
        if (age >= 41 && age <= 45) return "41-45";
        if (age >= 46 && age <= 50) return "46-50";
        if (age >= 51 && age <= 55) return "51-55";
        if (age >= 56 && age <= 60) return "56-60";
        throw new IllegalArgumentException("Age out of supported range (18-60)");
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}