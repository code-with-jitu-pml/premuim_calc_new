package com.tms.calc.godigitlife;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/godigitlife")
@CrossOrigin
public class GoDigitLifeController {
    
    private final GoDigitLifeService service;
    
    public GoDigitLifeController(GoDigitLifeService service) {
        this.service = service;
    }
    
    @PostMapping("/calculate")
    public GoDigitLifeResponse calculate(@RequestBody GoDigitLifeRequest request) {
        return service.calculate(request);
    }
}

