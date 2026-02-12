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

    private static final Map<Integer, Integer> GPA_RATE = Map.of(
            1, 32,
            2, 59,
            3, 86,
            4, 113,
            5, 140
    );

    private static final Map<Integer, Integer> EMI_RATE = Map.of(
            1, 108,
            2, 202,
            3, 294,
            4, 385,
            5, 479
    );

    public CalculatorResponse calculate(CalculatorRequest req) {

        CalculatorResponse res = new CalculatorResponse();

        if (req.products.contains(ProductType.GCI)) {
            res.gciPremium = calculateGci(req);
        }

        if (req.products.contains(ProductType.GPA)) {
            res.gpaPremium = calculateGpa(req);
        }

        if (req.products.contains(ProductType.EMI_PROTECT)) {
            res.emiProtectPremium = calculateEmi(req);
        }

        res.totalPremium = res.gciPremium + res.gpaPremium + res.emiProtectPremium;
        return res;
    }

    private double calculateGci(CalculatorRequest req) {
        // Annual income removed from flow; keep sum insured capped at 50L (as currently used)
        double si = Math.min(req.loanAmount, 50_00_000);
        return (si / 1000) * GCI_RATE.get(req.loanTenure);
    }

    private double calculateGpa(CalculatorRequest req) {
        double si = Math.min(req.loanAmount, 10_00_00_000);
        return (si / 100000) * GPA_RATE.get(req.loanTenure);
    }

    private double calculateEmi(CalculatorRequest req) {
        double si = Math.min(req.emiAmount, 5_00_000);
        return (si / 1000) * EMI_RATE.get(req.loanTenure);
    }
}
