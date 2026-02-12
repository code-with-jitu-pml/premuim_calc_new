# Premium Calculator - Knowledge Transfer (KT) Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [For Java Developer](#for-java-developer)
4. [For React Developer](#for-react-developer)
5. [API Endpoints](#api-endpoints)
6. [Business Logic](#business-logic)
7. [How to Run](#how-to-run)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## Project Overview

### What is this Project?
A **Premium Calculator** web application that calculates insurance premiums for multiple insurance providers:
- **Aditya Birla** (General Insurance - GCI, GPA, EMI Protect)
- **Bajaj Life** (Life Insurance)
- **Go Digit** (General Insurance - PA, CI, EMI)
- **Go Digit Life** (Life Insurance - Single/Joint Life)
- **Main Premium Calculator** (Agricultural Insurance)

### Technology Stack
- **Backend**: Java 17, Spring Boot 3.2.0, Maven
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Server**: Embedded Tomcat (Port 8080)
- **Build Tool**: Maven

### Project Structure
```
calc/
├── src/main/java/com/tms/calc/
│   ├── PremiumCalculatorApplication.java    # Main Spring Boot App
│   ├── PremiumController.java               # Main API Controller
│   ├── PremiumService.java                  # Main Business Logic
│   ├── InputRequest.java                    # Request DTO
│   ├── OutputResponse.java                  # Response DTO
│   ├── adityabirla/                         # Aditya Birla Module
│   ├── bajajlife/                           # Bajaj Life Module
│   ├── godigit/                             # Go Digit General Module
│   ├── godigitlife/                         # Go Digit Life Module
│   └── config/
│       └── CorsConfig.java                  # CORS Configuration
├── src/main/resources/
│   └── application.yml                      # Application Config
├── static/                                  # Frontend Files
│   ├── index.html                           # Main Calculator
│   ├── adityabirla.html                     # Aditya Birla Calculator
│   ├── bajajlife.html                       # Bajaj Life Calculator
│   ├── godigit.html                         # Go Digit Calculator
│   ├── godigitlife.html                     # Go Digit Life Calculator
│   ├── comparison.html                      # Comparison Page
│   ├── css/                                 # Stylesheets
│   └── js/                                  # JavaScript Files
└── pom.xml                                  # Maven Configuration
```

---

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐
│   Browser       │
│  (Frontend)     │
│  HTML/CSS/JS    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Spring Boot    │
│  (Backend)      │
│  Port: 8080     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Business Logic │
│  (Services)     │
└─────────────────┘
```

### Request Flow
1. User fills form in browser
2. JavaScript sends POST request to Spring Boot API
3. Controller receives request
4. Service calculates premium using business rules
5. Response sent back to frontend
6. Frontend displays results

---

## For Java Developer

### Step 1: Understanding the Backend Structure

#### Main Application Entry Point
**File**: `PremiumCalculatorApplication.java`
```java
@SpringBootApplication
public class PremiumCalculatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(PremiumCalculatorApplication.class, args);
    }
}
```
- This is the entry point
- Spring Boot auto-configures everything
- Starts embedded Tomcat on port 8080

#### Configuration
**File**: `src/main/resources/application.yml`
```yaml
server:
  port: 8080

spring:
  application:
    name: premium-calculator
  web:
    cors:
      allowed-origins: "*"
      allowed-methods: "GET,POST,PUT,DELETE,OPTIONS"
      allowed-headers: "*"
      allow-credentials: true
```
- Port: 8080
- CORS enabled for all origins (for development)

### Step 2: Understanding Controllers

#### Main Premium Controller
**File**: `PremiumController.java`
```java
@RestController
@RequestMapping("/premium")
public class PremiumController {
    @PostMapping("/calculate")
    public ResponseEntity<OutputResponse> calculate(@Valid @RequestBody InputRequest req) {
        OutputResponse resp = premiumService.calculate(req);
        return ResponseEntity.ok(resp);
    }
}
```
- **Endpoint**: `POST /premium/calculate`
- **Input**: `InputRequest` (validated with `@Valid`)
- **Output**: `OutputResponse`

#### Aditya Birla Controller
**File**: `adityabirla/CalculatorController.java`
```java
@RestController
@RequestMapping("/api/calculate")
@CrossOrigin
public class CalculatorController {
    @PostMapping
    public CalculatorResponse calculate(@RequestBody CalculatorRequest request) {
        return service.calculate(request);
    }
}
```
- **Endpoint**: `POST /api/calculate`
- Handles Aditya Birla products (GCI, GPA, EMI_PROTECT)

#### Bajaj Life Controller
**File**: `bajajlife/BajajLifeController.java`
```java
@RestController
@RequestMapping("/api/bajajlife")
@CrossOrigin
public class BajajLifeController {
    @PostMapping("/calculate")
    public BajajLifeResponse calculate(@RequestBody BajajLifeRequest request) {
        return service.calculate(request);
    }
}
```
- **Endpoint**: `POST /api/bajajlife/calculate`
- Handles Bajaj Life insurance calculations

#### Go Digit Controllers
- **General Insurance**: `POST /api/godigit/calculate`
- **Life Insurance**: `POST /api/godigitlife/calculate`

### Step 3: Understanding Services (Business Logic)

#### Main Premium Service
**File**: `PremiumService.java`

**Key Components**:
1. **Rate Tables** (stored as static Maps):
   ```java
   private static final Map<Integer, BigDecimal> RATE_PER_1000 = Map.of(
       1, new BigDecimal("15.4"),
       2, new BigDecimal("22"),
       3, new BigDecimal("23.14"),
       4, new BigDecimal("24.28"),
       5, new BigDecimal("25.42")
   );
   ```

2. **Calculation Steps**:
   - Parse date of birth → Calculate age
   - Calculate Sum Insured = Loan Amount × Sum Insured %
   - Base Premium = (Sum Insured / 1000) × Rate per 1000
   - EMI Component = (EMI Amount × Multiplier) / 1000 (if age ≤ 55)
   - Health Component = Lookup from HEALTH_TABLE
   - Total = Base + EMI + Health
   - GST = Total × 18%

#### Aditya Birla Service
**File**: `adityabirla/CalculatorService.java`

**Products**:
- **GCI** (Group Credit Insurance): Fixed Sum Insured of ₹50L
- **GPA** (Group Personal Accident): Based on loan amount (max ₹10 Cr)
- **EMI_PROTECT**: Based on EMI amount (max ₹5L)

**Calculation**:
```java
// GCI: (Sum Insured / 1000) × Rate
double si = 50_00_000;
return (si / 1000) * GCI_RATE.get(loanTenure);

// GPA: (Sum Insured / 1,00,000) × Rate
double si = Math.min(loanAmount, 10_00_00_000);
return (si / 100000) * GPA_RATE.get(loanTenure);

// EMI: (Sum Insured / 1000) × Rate
double si = Math.min(emiAmount, 5_00_000);
return (si / 1000) * EMI_RATE.get(loanTenure);
```

#### Bajaj Life Service
**File**: `bajajlife/BajajLifeService.java`

**Key Features**:
- Age-based rate table (18-60 years)
- Term-based rates (1-15 years)
- NML (Non-Medical Limit) grid
- GST: 18%

**Calculation**:
```java
// Get rate from table based on age and term
double rate = getRate(entryAge, coverTermMonths);
// Premium = (Sum Assured / 1000) × Rate
premiumExclGst = (sumAssured / 1000) * rate;
premiumInclGst = premiumExclGst * 1.18;
```

#### Go Digit Services
- **General**: Percentage-based rates for PA, CI, EMI
- **Life**: Age and term-based rates, supports Single/Joint Life

### Step 4: Understanding DTOs (Data Transfer Objects)

#### Request DTOs
- `InputRequest.java`: Main calculator input
- `CalculatorRequest.java`: Aditya Birla input
- `BajajLifeRequest.java`: Bajaj Life input
- `GoDigitRequest.java`: Go Digit General input
- `GoDigitLifeRequest.java`: Go Digit Life input

#### Response DTOs
- `OutputResponse.java`: Main calculator output
- `CalculatorResponse.java`: Aditya Birla output
- `BajajLifeResponse.java`: Bajaj Life output
- `GoDigitResponse.java`: Go Digit General output
- `GoDigitLifeResponse.java`: Go Digit Life output

### Step 5: CORS Configuration

**File**: `config/CorsConfig.java`
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        // ...
    }
}
```
- Allows all origins (for development)
- In production, restrict to specific domains

### Step 6: How to Add a New Insurance Provider

1. **Create Package**: `com.tms.calc.{providername}/`
2. **Create Request DTO**: `{Provider}Request.java`
3. **Create Response DTO**: `{Provider}Response.java`
4. **Create Service**: `{Provider}Service.java` (with calculation logic)
5. **Create Controller**: `{Provider}Controller.java` (with `@RestController` and `@RequestMapping`)
6. **Add Frontend**: Create HTML/JS files in `static/` folder

### Step 7: Testing the Backend

#### Using cURL
```bash
# Main Premium Calculator
curl -X POST http://localhost:8080/premium/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "dob": "15/06/1985",
    "loanAmount": 500000,
    "sumInsuredPercent": 100,
    "policyTenureYears": 3,
    "emiAmount": 12000,
    "healthIndemnity": "2 LAC"
  }'

# Aditya Birla
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "loanAmount": 2000000,
    "loanTenure": 5,
    "emiAmount": 50000,
    "products": ["GCI", "GPA"]
  }'
```

---

## For React Developer

### Step 1: Understanding the Frontend Structure

#### Main Files
- `static/index.html`: Main premium calculator
- `static/adityabirla.html`: Aditya Birla calculator
- `static/comparison.html`: Comparison page (multi-provider)
- `static/js/script.js`: Main JavaScript logic
- `static/js/adityabirla.js`: Aditya Birla JavaScript
- `static/js/comparison.js`: Comparison JavaScript
- `static/css/styles.css`: Main stylesheet

### Step 2: Understanding the JavaScript Architecture

#### Main Calculator (`script.js`)
**Class**: `PremiumCalculator`

**Key Methods**:
```javascript
class PremiumCalculator {
    constructor() {
        this.apiUrl = '/premium/calculate';
        // Initialize event listeners
    }
    
    async handleFormSubmit(e) {
        // Validate form
        // Prepare data
        // Call API
        // Display results
    }
    
    async calculatePremium(data) {
        // Fetch API call
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
    
    displayResults(data) {
        // Update DOM with results
    }
}
```

#### Aditya Birla Calculator (`adityabirla.js`)
**Class**: `AdityabirlaCalculator`

**Key Features**:
- Product selection (checkboxes)
- Dynamic EMI field requirement
- Loan-wise breakdown display
- Real-time validation

#### Comparison Page (`comparison.js`)
**Class**: `PremiumComparison`

**Key Features**:
- Multi-member support
- Multiple insurance providers
- Product selection with radio/checkboxes
- Real-time calculation
- Selected items sidebar
- Total calculation with GST

### Step 3: API Integration Pattern

#### Standard Pattern
```javascript
// 1. Prepare data from form
const formData = {
    age: parseInt(document.getElementById('age').value),
    loanAmount: parseFloat(document.getElementById('loanAmount').value),
    // ... other fields
};

// 2. Make API call
const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
});

// 3. Handle response
if (!response.ok) {
    throw new Error('API call failed');
}
const data = await response.json();

// 4. Display results
displayResults(data);
```

### Step 4: Form Validation

#### Client-Side Validation
```javascript
validateField(field) {
    const value = field.value.trim();
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
        this.showFieldError(field, 'Field is required');
        return false;
    }
    
    // Number validation
    if (field.type === 'number' && value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            this.showFieldError(field, 'Please enter a valid positive number');
            return false;
        }
    }
    
    return true;
}
```

### Step 5: Error Handling

#### Error Display Pattern
```javascript
showError(message) {
    this.errorText.textContent = message;
    this.errorMessage.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        this.hideError();
    }, 5000);
}

// In try-catch
try {
    const response = await this.calculatePremium(data);
    this.displayResults(response);
} catch (error) {
    console.error('Error:', error);
    this.showError('Failed to calculate premium. Please try again.');
}
```

### Step 6: Converting to React

#### Current Structure (Vanilla JS)
```javascript
class PremiumCalculator {
    constructor() {
        this.apiUrl = '/premium/calculate';
        this.form = document.getElementById('premiumForm');
        this.initializeEventListeners();
    }
}
```

#### React Equivalent
```jsx
import { useState } from 'react';

function PremiumCalculator() {
    const [formData, setFormData] = useState({
        dob: '',
        loanAmount: '',
        // ...
    });
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/premium/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Calculation failed');
            
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            {error && <div className="error">{error}</div>}
            {loading && <div>Calculating...</div>}
            {results && <ResultsDisplay data={results} />}
        </form>
    );
}
```

### Step 7: State Management

#### Current: Local Storage
```javascript
// Save form data
form.addEventListener('input', (e) => {
    formData[e.target.name] = e.target.value;
    localStorage.setItem('premiumCalculatorData', JSON.stringify(formData));
});

// Load on page load
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('premiumCalculatorData');
    if (savedData) {
        // Populate form
    }
});
```

#### React: useState/useEffect
```jsx
useEffect(() => {
    const saved = localStorage.getItem('premiumCalculatorData');
    if (saved) {
        setFormData(JSON.parse(saved));
    }
}, []);

useEffect(() => {
    localStorage.setItem('premiumCalculatorData', JSON.stringify(formData));
}, [formData]);
```

---

## API Endpoints

### 1. Main Premium Calculator
- **Endpoint**: `POST /premium/calculate`
- **Request**:
```json
{
  "dob": "15/06/1985",
  "loanTenureYears": 5,
  "policyTenureYears": 3,
  "loanAmount": 500000.00,
  "sumInsuredPercent": 100.00,
  "emiAmount": 12000.00,
  "healthIndemnity": "2 LAC",
  "coApplicantCover": true
}
```
- **Response**:
```json
{
  "age": 38,
  "policyTenureYears": 3,
  "sumInsured": 500000.00,
  "emiAmount": 12000.00,
  "healthIndemnity": "2 LAC",
  "coApplicantCover": true,
  "premiumExclGst": 1250.00,
  "premiumInclGst": 1475.00
}
```

### 2. Aditya Birla Calculator
- **Endpoint**: `POST /api/calculate`
- **Request**:
```json
{
  "age": 35,
  "loanAmount": 2000000,
  "loanTenure": 5,
  "emiAmount": 50000,
  "products": ["GCI", "GPA", "EMI_PROTECT"]
}
```
- **Response**:
```json
{
  "gciPremium": 15000.00,
  "gpaPremium": 2800.00,
  "emiProtectPremium": 23950.00,
  "totalPremium": 41750.00
}
```

### 3. Bajaj Life
- **Endpoint**: `POST /api/bajajlife/calculate`
- **Request**:
```json
{
  "entryAge": 35,
  "sumAssured": 5000000,
  "coverTermMonths": 60
}
```
- **Response**:
```json
{
  "sumAssured": 5000000,
  "coverTermMonths": 60,
  "ratePerThousand": 2.4265,
  "premiumExclGst": 12132.50,
  "premiumInclGst": 14316.35,
  "nmlStatus": "NM (Non-Medical)"
}
```

### 4. Go Digit General
- **Endpoint**: `POST /api/godigit/calculate`
- **Request**:
```json
{
  "age": 35,
  "loanAmount": 2000000,
  "policyYear": 1,
  "emiAmount": 50000,
  "coverages": ["PA", "CI", "EMI"]
}
```

### 5. Go Digit Life
- **Endpoint**: `POST /api/godigitlife/calculate`
- **Request**:
```json
{
  "entryAge": 35,
  "sumAssured": 5000000,
  "coverTermMonths": 36,
  "lifeType": "SINGLE"
}
```

---

## Business Logic

### Main Premium Calculator Logic

1. **Age Calculation**:
   ```java
   LocalDate dob = LocalDate.parse(req.getDob(), DOB_FORMAT);
   int age = Period.between(dob, LocalDate.now()).getYears();
   ```

2. **Sum Insured**:
   ```java
   sumInsured = loanAmount × (sumInsuredPercent / 100)
   ```

3. **Base Premium**:
   ```java
   basePremium = (sumInsured / 1000) × ratePer1000[policyTenure]
   ```

4. **EMI Component** (if age ≤ 55):
   ```java
   emiComponent = (emiAmount × multiplier[tenure]) / 1000
   ```

5. **Health Component**:
   ```java
   healthComponent = HEALTH_TABLE.get(healthIndemnity)
   ```

6. **Total & GST**:
   ```java
   premiumExclGst = basePremium + emiComponent + healthComponent
   premiumInclGst = premiumExclGst × 1.18
   ```

### Aditya Birla Logic

- **GCI**: Fixed ₹50L Sum Insured
- **GPA**: Loan Amount (max ₹10 Cr)
- **EMI_PROTECT**: EMI Amount (max ₹5L)

### Bajaj Life Logic

- Age-based rate table (18-60)
- Term-based rates (1-15 years)
- NML (Non-Medical Limit) based on age and sum assured

### Go Digit Logic

- **General**: Percentage-based rates
- **Life**: Age and term-based rates, supports Single/Joint Life

---

## How to Run

### Prerequisites
- Java 17+
- Maven 3.6+

### Step-by-Step

1. **Navigate to Project**:
   ```bash
   cd "/home/hp/Desktop/Premium Calculator/calc"
   ```

2. **Build Project**:
   ```bash
   mvn clean install
   ```

3. **Run Application**:
   ```bash
   mvn spring-boot:run
   ```

4. **Access Application**:
   - Main Calculator: `http://localhost:8080/index.html`
   - Aditya Birla: `http://localhost:8080/adityabirla.html`
   - Comparison: `http://localhost:8080/comparison.html`

### Alternative: Run JAR
```bash
mvn clean package
java -jar target/premium-calculator-1.0.0.jar
```

---

## Common Issues & Solutions

### Issue 1: Port 8080 Already in Use
**Solution**:
```bash
# Find process
lsof -i :8080
# Kill process or change port in application.yml
```

### Issue 2: CORS Errors
**Solution**: CORS is already configured. Check `CorsConfig.java` if issues persist.

### Issue 3: Static Files Not Loading
**Solution**:
- Ensure files are in `static/` directory
- Clear browser cache
- Check browser console for 404 errors

### Issue 4: Maven Build Fails
**Solution**:
```bash
mvn clean install -U
```

### Issue 5: Date Format Issues
**Solution**: Backend expects `DD/MM/YYYY` format. Frontend converts from `YYYY-MM-DD`.

### Issue 6: API Not Responding
**Solution**:
- Check if Spring Boot is running
- Check console logs for errors
- Verify endpoint URLs in JavaScript

---

## Key Points for Java Developer

1. **All services are stateless** - no session management
2. **Rate tables are static** - stored in memory as Maps
3. **Validation** - Use `@Valid` annotation on controllers
4. **Error handling** - Services throw `IllegalArgumentException` for invalid inputs
5. **GST calculation** - Always 18% (hardcoded)
6. **Date parsing** - Uses `DD/MM/YYYY` format

## Key Points for React Developer

1. **No build step** - Pure HTML/CSS/JS
2. **API calls** - Use `fetch()` API
3. **Form validation** - Client-side validation before API call
4. **Error handling** - Try-catch with user-friendly messages
5. **State management** - LocalStorage for form persistence
6. **No framework** - Vanilla JavaScript (can be converted to React)

---

## Next Steps

### For Java Developer:
1. Review all service classes
2. Understand rate tables and business rules
3. Test each API endpoint
4. Review validation logic

### For React Developer:
1. Review JavaScript classes
2. Understand API integration
3. Review form validation
4. Plan React conversion (if needed)

---

## Support & Contact

- Check console logs for errors
- Review API responses in browser DevTools
- Test endpoints with Postman/cURL
- Refer to this document for architecture details

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

