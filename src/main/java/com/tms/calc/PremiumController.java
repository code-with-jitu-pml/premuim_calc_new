package com.tms.calc;


import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/premium")
public class PremiumController {

    private final PremiumService premiumService;

    public PremiumController(PremiumService premiumService) {
        this.premiumService = premiumService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<OutputResponse> calculate(@Valid @RequestBody InputRequest req) {
        OutputResponse resp = premiumService.calculate(req);
        return ResponseEntity.ok(resp);
    }
}
