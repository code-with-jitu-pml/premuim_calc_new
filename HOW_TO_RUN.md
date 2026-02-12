# How to Run the Premium Calculator Project

## 📋 Prerequisites

Before running the project, ensure you have:

- **Java 17** or higher installed
  ```bash
  java -version
  ```
- **Maven 3.6+** installed
  ```bash
  mvn -version
  ```

## 🚀 Quick Start

### Step 1: Navigate to Project Directory
```bash
cd "/home/hp/Desktop/Premium Calculator/calc"
```

### Step 2: Build the Project
```bash
mvn clean install
```

This will:
- Download all dependencies
- Compile the Java code
- Run tests
- Package the application

### Step 3: Run the Application
```bash
mvn spring-boot:run
```

Or if you prefer to run the JAR directly:
```bash
mvn clean package
java -jar target/premium-calculator-1.0.0.jar
```

### Step 4: Access the Application

Once the server starts, you'll see:
```
Started PremiumCalculatorApplication in X.XXX seconds
```

Open your web browser and navigate to:

#### Main Calculator (Agricultural Insurance)
- **URL**: `http://localhost:8080/index.html`
- **Direct**: `http://localhost:8080/`

#### Aditya Birla Calculator
- **URL**: `http://localhost:8080/adityabirla.html`

## 🎯 Available Calculators

### 1. Main Premium Calculator (`index.html`)
- **Endpoint**: `POST /premium/calculate`
- **Features**: 
  - Date of birth based age calculation
  - Policy tenure selection
  - Health indemnity options
  - Co-applicant cover
  - GST calculation

### 2. Aditya Birla Calculator (`adityabirla.html`)
- **Endpoint**: `POST /api/calculate`
- **Features**:
  - Product selection (GCI, GPA, EMI Protect)
  - Age-based calculations
  - Loan-wise premium breakdown
  - Real-time validation
  - Detailed calculation breakdown

## 📡 API Endpoints

### Aditya Birla Calculator API

**Endpoint**: `POST http://localhost:8080/api/calculate`

**Request Body**:
```json
{
  "age": 35,
  "annualIncome": 500000,
  "loanAmount": 2000000,
  "loanTenure": 5,
  "emiAmount": 50000,
  "products": ["GCI", "GPA", "EMI_PROTECT"]
}
```

**Response**:
```json
{
  "gciPremium": 15000.00,
  "gpaPremium": 2800.00,
  "emiProtectPremium": 23950.00,
  "totalPremium": 41750.00
}
```

### Main Premium Calculator API

**Endpoint**: `POST http://localhost:8080/premium/calculate`

**Request Body**:
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

## 🛠️ Development Commands

### Run with Hot Reload (if using Spring Boot DevTools)
```bash
mvn spring-boot:run
```

### Run Tests
```bash
mvn test
```

### Clean Build
```bash
mvn clean install
```

### Skip Tests During Build
```bash
mvn clean install -DskipTests
```

## 🔧 Configuration

### Change Port
Edit `src/main/resources/application.yml`:
```yaml
server:
  port: 8080  # Change to your desired port
```

### CORS Configuration
CORS is already configured to allow all origins. To restrict:
Edit `src/main/java/com/tms/calc/config/CorsConfig.java`

## 📁 Project Structure

```
calc/
├── src/
│   ├── main/
│   │   ├── java/com/tms/calc/
│   │   │   ├── PremiumCalculatorApplication.java
│   │   │   ├── PremiumController.java
│   │   │   ├── PremiumService.java
│   │   │   └── adityabirla/
│   │   │       ├── CalculatorController.java
│   │   │       ├── CalculatorService.java
│   │   │       ├── CalculatorRequest.java
│   │   │       └── CalculatorResponse.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
├── static/
│   ├── index.html          # Main calculator
│   ├── adityabirla.html    # Aditya Birla calculator
│   ├── css/
│   │   ├── styles.css
│   │   └── adityabirla.css
│   └── js/
│       ├── script.js
│       └── adityabirla.js
└── pom.xml
```

## 🌐 Accessing the Calculators

### Option 1: Direct Browser Access
1. Start the server: `mvn spring-boot:run`
2. Open browser: `http://localhost:8080/adityabirla.html`

### Option 2: Using cURL (API Testing)
```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "annualIncome": 500000,
    "loanAmount": 2000000,
    "loanTenure": 5,
    "emiAmount": 50000,
    "products": ["GCI", "GPA"]
  }'
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080
# or
netstat -ano | findstr :8080

# Kill the process or change port in application.yml
```

### Maven Build Fails
```bash
# Clean and rebuild
mvn clean install -U
```

### Static Files Not Loading
- Ensure files are in `static/` directory
- Check browser console for 404 errors
- Clear browser cache

### CORS Errors
- CORS is configured to allow all origins
- Check `CorsConfig.java` if issues persist

## 📝 Example Usage

### Using Aditya Birla Calculator:

1. **Open**: `http://localhost:8080/adityabirla.html`

2. **Fill the form**:
   - Select products (GCI, GPA, or EMI Protect)
   - Enter age (18-100)
   - Enter annual income
   - Enter loan amount
   - Select loan tenure (1-5 years)
   - If EMI Protect selected, enter EMI amount (mandatory)

3. **Click "Calculate Premium"**

4. **View Results**:
   - Individual product premiums
   - Total premium
   - Detailed loan-wise breakdown with calculations

## 🎨 Features

### Aditya Birla Calculator Features:
- ✅ Product selection (GCI, GPA, EMI Protect)
- ✅ Age validation (18-100 years)
- ✅ Mandatory EMI when EMI Protect is selected
- ✅ Real-time form validation
- ✅ Loan-wise premium breakdown
- ✅ Detailed calculation formulas
- ✅ Responsive design

## 📞 Need Help?

- Check the console logs for errors
- Verify Java version: `java -version` (should be 17+)
- Verify Maven version: `mvn -version` (should be 3.6+)
- Check if port 8080 is available

## 🚀 Production Deployment

### Build JAR
```bash
mvn clean package
```

### Run JAR
```bash
java -jar target/premium-calculator-1.0.0.jar
```

### Run with Custom Port
```bash
java -jar target/premium-calculator-1.0.0.jar --server.port=9090
```

