package com.tms.calc.godigit;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/godigit/calculate")
@CrossOrigin
public class GoDigitController {

    private final GoDigitService service;

    public GoDigitController(GoDigitService service) {
        this.service = service;
    }

    @PostMapping
    public GoDigitResponse calculate(@RequestBody GoDigitRequest request) {
        return service.calculate(request);
    }
}


