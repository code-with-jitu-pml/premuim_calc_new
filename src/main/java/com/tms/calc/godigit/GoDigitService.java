package com.tms.calc.godigit;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class GoDigitService {

    private static final double GST_MULTIPLIER = 1.18;

    // Premium as % of Sum Insured (excl GST), derived from screenshots.
    private static final Map<Integer, Double> PA_RATE_PCT = Map.of(
            1, 0.09,
            2, 0.18,
            3, 0.27
    );

    private static final Map<Integer, Double> EMI_RATE_PCT = Map.of(
            1, 0.05,
            2, 0.10,
            3, 0.15
    );

    // CI rates depend on age band + year
    // Age bands: 18-25, 26-30, 31-35, 36-40, 41-45, 46-50, 51-55, 56-60
    private static final Map<String, Map<Integer, Double>> CI_RATE_PCT = Map.of(
            "18-25", Map.of(1, 0.220, 2, 0.440, 3, 0.660),
            "26-30", Map.of(1, 0.250, 2, 0.500, 3, 0.750),
            "31-35", Map.of(1, 0.340, 2, 0.680, 3, 1.020),
            "36-40", Map.of(1, 0.400, 2, 0.800, 3, 1.200),
            "41-45", Map.of(1, 0.820, 2, 1.640, 3, 2.460),
            "46-50", Map.of(1, 1.660, 2, 3.320, 3, 4.980),
            "51-55", Map.of(1, 2.680, 2, 5.360, 3, 8.040),
            "56-60", Map.of(1, 3.610, 2, 7.220, 3, 10.830)
    );

    public GoDigitResponse calculate(GoDigitRequest req) {
        validate(req);

        GoDigitResponse res = new GoDigitResponse();

        if (req.coverages.contains(CoverageType.PA)) {
            res.paPremium = calculatePa(req);
            res.paPremiumInclGst = round2(res.paPremium * GST_MULTIPLIER);
        }
        if (req.coverages.contains(CoverageType.CI)) {
            res.ciPremium = calculateCi(req);
            res.ciPremiumInclGst = round2(res.ciPremium * GST_MULTIPLIER);
        }
        if (req.coverages.contains(CoverageType.EMI)) {
            res.emiPremium = calculateEmi(req);
            res.emiPremiumInclGst = round2(res.emiPremium * GST_MULTIPLIER);
        }

        res.totalPremium = res.paPremium + res.ciPremium + res.emiPremium;
        res.totalPremiumInclGst = round2(res.totalPremium * GST_MULTIPLIER);
        return res;
    }

    private void validate(GoDigitRequest req) {
        if (req == null) throw new IllegalArgumentException("Request is required");
        if (req.coverages == null || req.coverages.isEmpty()) throw new IllegalArgumentException("Select at least one coverage");
        if (req.policyYear < 1 || req.policyYear > 3) throw new IllegalArgumentException("Policy year must be 1, 2, or 3");
        if (req.age < 18 || req.age > 60) throw new IllegalArgumentException("Age must be between 18 and 60");
        if (req.loanAmount <= 0) throw new IllegalArgumentException("Loan amount must be greater than 0");
        if (req.coverages.contains(CoverageType.EMI) && req.emiAmount <= 0) {
            throw new IllegalArgumentException("EMI amount is mandatory when EMI coverage is selected");
        }
    }

    private double calculatePa(GoDigitRequest req) {
        // SI: up to loan amount; max INR 5 Cr
        double si = Math.min(req.loanAmount, 5_00_00_000);
        double pct = PA_RATE_PCT.get(req.policyYear);
        return round2(si * pct / 100.0);
    }

    private double calculateCi(GoDigitRequest req) {
        // SI: up to loan amount; max INR 1 Cr
        double si = Math.min(req.loanAmount, 1_00_00_000);
        String band = ciBand(req.age);
        double pct = CI_RATE_PCT.get(band).get(req.policyYear);
        return round2(si * pct / 100.0);
    }

    private double calculateEmi(GoDigitRequest req) {
        // SI: up to EMI amount; max single EMI cap depends on age
        // 18-50: 50,000 ; 51-60: 25,000
        double singleCap = req.age <= 50 ? 50_000 : 25_000;
        double si = Math.min(req.emiAmount, singleCap);
        double pct = EMI_RATE_PCT.get(req.policyYear);
        return round2(si * pct / 100.0);
    }

    private String ciBand(int age) {
        if (age <= 25) return "18-25";
        if (age <= 30) return "26-30";
        if (age <= 35) return "31-35";
        if (age <= 40) return "36-40";
        if (age <= 45) return "41-45";
        if (age <= 50) return "46-50";
        if (age <= 55) return "51-55";
        return "56-60";
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}


