package com.tms.calc;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PremiumServiceTest {

    private PremiumService premiumService;

    @BeforeEach
    void setUp() {
        premiumService = new PremiumService();
    }

    @Test
    void testCalculatePremium_BasicScenario() {
        // Given
        InputRequest request = new InputRequest();
        request.setDob("15/06/1985");
        request.setLoanAmount(new BigDecimal("500000"));
        request.setSumInsuredPercent(new BigDecimal("100"));
        request.setPolicyTenureYears(3);
        request.setEmiAmount(new BigDecimal("12000"));
        request.setHealthIndemnity("2 LAC");
        request.setCoApplicantCover(true);

        // When
        OutputResponse response = premiumService.calculate(request);

        // Then
        assertNotNull(response);
        assertEquals(38, response.getAge());
        assertEquals(3, response.getPolicyTenureYears());
        assertEquals(new BigDecimal("500000.00"), response.getSumInsured());
        assertEquals(new BigDecimal("12000"), response.getEmiAmount());
        assertEquals("2 LAC", response.getHealthIndemnity());
        assertTrue(response.getCoApplicantCover());
        assertNotNull(response.getPremiumExclGst());
        assertNotNull(response.getPremiumInclGst());
    }

    @Test
    void testCalculatePremium_MinimalData() {
        // Given
        InputRequest request = new InputRequest();
        request.setDob("01/01/1990");
        request.setLoanAmount(new BigDecimal("100000"));
        request.setSumInsuredPercent(new BigDecimal("100"));

        // When
        OutputResponse response = premiumService.calculate(request);

        // Then
        assertNotNull(response);
        assertTrue(response.getPremiumExclGst().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(response.getPremiumInclGst().compareTo(response.getPremiumExclGst()) > 0);
    }

    @Test
    void testCalculatePremium_AgeOver55() {
        // Given
        InputRequest request = new InputRequest();
        request.setDob("01/01/1960"); // Age > 55
        request.setLoanAmount(new BigDecimal("500000"));
        request.setSumInsuredPercent(new BigDecimal("100"));
        request.setEmiAmount(new BigDecimal("15000"));

        // When
        OutputResponse response = premiumService.calculate(request);

        // Then
        assertNotNull(response);
        assertTrue(response.getAge() > 55);
        // EMI component should be zero for age > 55
        assertTrue(response.getPremiumExclGst().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testCalculatePremium_HealthIndemnityVariations() {
        // Given
        InputRequest request = new InputRequest();
        request.setDob("01/01/1985");
        request.setLoanAmount(new BigDecimal("300000"));
        request.setSumInsuredPercent(new BigDecimal("100"));
        request.setHealthIndemnity("3 LAC");

        // When
        OutputResponse response = premiumService.calculate(request);

        // Then
        assertNotNull(response);
        assertEquals("3 LAC", response.getHealthIndemnity());
        assertTrue(response.getPremiumExclGst().compareTo(BigDecimal.ZERO) > 0);
    }
}
