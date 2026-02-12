package com.tms.calc.adityabirla;


import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calculate")
@CrossOrigin
public class CalculatorController {

    private final CalculatorService service;

    public CalculatorController(CalculatorService service) {
        this.service = service;
    }

    @PostMapping
    public CalculatorResponse calculate(@RequestBody CalculatorRequest request) {
        return service.calculate(request);
    }
}
