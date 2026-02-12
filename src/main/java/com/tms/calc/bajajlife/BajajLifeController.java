package com.tms.calc.bajajlife;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bajajlife")
@CrossOrigin
public class BajajLifeController {
    
    private final BajajLifeService service;
    
    public BajajLifeController(BajajLifeService service) {
        this.service = service;
    }
    
    @PostMapping("/calculate")
    public BajajLifeResponse calculate(@RequestBody BajajLifeRequest request) {
        return service.calculate(request);
    }
}

