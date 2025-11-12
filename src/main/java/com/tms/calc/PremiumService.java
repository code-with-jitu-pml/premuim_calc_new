package com.tms.calc;


import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class PremiumService {

    private static final DateTimeFormatter DOB_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final BigDecimal GST = new BigDecimal("0.18");

    // rate per 1000 by policy tenure (years) -- taken directly from your workbook (Sheet5 column O)
    private static final Map<Integer, BigDecimal> RATE_PER_1000 = Map.of(
            1, new BigDecimal("15.4"),
            2, new BigDecimal("22"),
            3, new BigDecimal("23.14"),
            4, new BigDecimal("24.28"),
            5, new BigDecimal("25.42")
    );

    // multipliers used in EMI/job component (from Sheet5, column Q / M as extracted)
    private static final Map<Integer, BigDecimal> MULTIPLIER = Map.of(
            1, new BigDecimal("135"),
            2, new BigDecimal("251.23956"),
            3, new BigDecimal("311.454"),
            4, new BigDecimal("415.272"),
            5, new BigDecimal("429")
    );

    // health indemnity lookup (Sheet5 D11:F11)
    private static final Map<String, BigDecimal> HEALTH_TABLE = Map.of(
            "1 LAC", new BigDecimal("14850"),
            "2 LAC", new BigDecimal("21903"),
            "3 LAC", new BigDecimal("33026"),
            "NIL", BigDecimal.ZERO
    );

    public OutputResponse calculate(InputRequest req) {
        // parse dob and compute age
        LocalDate dob = LocalDate.parse(req.getDob(), DOB_FORMAT);
        int age = Period.between(dob, LocalDate.now()).getYears();

        // normalize policy tenure to integer 1..5 (cap to available table)
        int tenure = req.getPolicyTenureYears() == null ? 1 : req.getPolicyTenureYears();
        tenure = Math.max(1, Math.min(5, tenure));

        BigDecimal loanAmount = safe(req.getLoanAmount());
        BigDecimal sumInsuredPercent = safe(req.getSumInsuredPercent());
        BigDecimal sumInsured = loanAmount.multiply(sumInsuredPercent)
                                          .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        // base component (no GST)
        BigDecimal rate = RATE_PER_1000.get(tenure);
        BigDecimal
                baseNoGst = sumInsured.multiply(rate)
                                         .divide(new BigDecimal("1000"), 2, RoundingMode.HALF_UP);

        // job/EMI component (no GST); Excel sets this to zero if age>55
        BigDecimal emi = safe(req.getEmiAmount());
        BigDecimal multiplier = MULTIPLIER.get(tenure);
        BigDecimal jobNoGst = (age > 55) ? BigDecimal.ZERO
                : emi.multiply(multiplier).divide(new BigDecimal("1000"), 2, RoundingMode.HALF_UP);

        // health component (no GST)
        String hKey = (req.getHealthIndemnity() == null) ? "NIL" : req.getHealthIndemnity().trim().toUpperCase();
        // normalize common variants
        if (!HEALTH_TABLE.containsKey(hKey)) {
            hKey = hKey.replaceAll("\\s+", " ");
            if (!HEALTH_TABLE.containsKey(hKey)) {
                if (hKey.matches("^1\\s*LAC$|^1LAC$|^100000$")) hKey = "1 LAC";
                else if (hKey.matches("^2\\s*LAC$|^2LAC$|^200000$")) hKey = "2 LAC";
                else if (hKey.matches("^3\\s*LAC$|^3LAC$|^300000$")) hKey = "3 LAC";
                else hKey = "NIL";
            }
        }
        BigDecimal healthNoGst = HEALTH_TABLE.getOrDefault(hKey, BigDecimal.ZERO);

        // sum up
        BigDecimal premiumExclGst = baseNoGst.add(jobNoGst).add(healthNoGst).setScale(2, RoundingMode.HALF_UP);
        BigDecimal premiumInclGst = premiumExclGst.multiply(BigDecimal.ONE.add(GST)).setScale(2, RoundingMode.HALF_UP);

        OutputResponse out = new OutputResponse();
        out.setAge(age);
        out.setPolicyTenureYears(tenure);
        out.setSumInsured(sumInsured);
        out.setEmiAmount(emi);
        out.setHealthIndemnity(req.getHealthIndemnity());
        out.setCoApplicantCover(req.getCoApplicantCover());
        out.setPremiumExclGst(premiumExclGst);
        out.setPremiumInclGst(premiumInclGst);

        return out;
    }

    private BigDecimal safe(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
