# Premium Calculator - Agricultural Insurance

A beautiful, farmer-themed premium calculator web application built with Spring Boot backend and modern frontend technologies.

## 🌾 Project Overview

This application provides a comprehensive premium calculation system for agricultural insurance, featuring:
- **Farmer-themed UI** with agricultural colors and animations
- **Spring Boot REST API** for premium calculations
- **Responsive frontend** with modern JavaScript
- **Real-time validation** and user experience enhancements

## 📁 Project Structure

```
premium-calculator/
├── src/
│   ├── main/
│   │   ├── java/com/tms/calc/
│   │   │   ├── PremiumCalculatorApplication.java    # Main Spring Boot application
│   │   │   ├── InputRequest.java                  # Request DTO
│   │   │   ├── OutputResponse.java                # Response DTO
│   │   │   ├── PremiumController.java             # REST Controller
│   │   │   ├── PremiumService.java                # Business logic
│   │   │   └── config/
│   │   │       └── CorsConfig.java                # CORS configuration
│   │   └── resources/
│   │       └── application.yml                    # Application configuration
│   └── test/
│       └── java/com/tms/calc/                    # Test classes
├── static/                                       # Frontend files
│   ├── index.html                                # Main HTML file
│   ├── css/
│   │   └── styles.css                            # CSS styling
│   ├── js/
│   │   └── script.js                             # JavaScript functionality
│   └── images/                                   # Static images
├── docs/                                         # Documentation
│   └── README.md                                 # This file
├── pom.xml                                       # Maven configuration
└── .gitignore                                    # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6 or higher
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd premium-calculator
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:8080`
   - The application will serve the frontend automatically

## 🎨 Features

### Frontend Features
- **Farmer Theme**: Agricultural color scheme with wheat decorations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Validation**: Instant feedback on form inputs
- **Auto-save**: Form data persists across page reloads
- **Loading Animations**: Beautiful loading states
- **Error Handling**: User-friendly error messages
- **Keyboard Shortcuts**: Ctrl+Enter to submit, Escape to reset

### Backend Features
- **RESTful API**: Clean REST endpoints
- **Input Validation**: Server-side validation with Bean Validation
- **CORS Support**: Cross-origin resource sharing enabled
- **Comprehensive Logging**: Detailed logging configuration
- **Error Handling**: Proper error responses

## 📋 API Documentation

### Endpoint
```
POST /premium/calculate
```

### Request Body (InputRequest)
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

### Response (OutputResponse)
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

## 🛠️ Development

### Running in Development Mode
```bash
mvn spring-boot:run
```

### Building for Production
```bash
mvn clean package
java -jar target/premium-calculator-1.0.0.jar
```

### Testing
```bash
mvn test
```

## 🎯 Configuration

### Application Properties
The application uses `application.yml` for configuration:

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

logging:
  level:
    com.tms.calc: DEBUG
```

### Customization
- **API URL**: Modify the `apiUrl` in `static/js/script.js`
- **Styling**: Update `static/css/styles.css`
- **Backend Logic**: Modify `PremiumService.java`

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is properly configured in `CorsConfig.java`
   - Check that the frontend is served from the same origin

2. **API Connection Issues**
   - Verify the backend is running on port 8080
   - Check browser console for network errors

3. **Form Validation Issues**
   - Ensure all required fields are filled
   - Check date format (DD/MM/YYYY)

4. **Styling Issues**
   - Clear browser cache
   - Ensure CSS files are loaded properly

## 📊 Business Logic

The premium calculation follows these steps:

1. **Age Calculation**: Computed from date of birth
2. **Base Premium**: Calculated using rate per 1000 based on policy tenure
3. **EMI Component**: Added for ages ≤ 55 using tenure-specific multipliers
4. **Health Component**: Added based on health indemnity selection
5. **GST**: 18% GST added to the final premium

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the code comments for implementation details

## 🔄 Version History

- **v1.0.0**: Initial release with basic premium calculation functionality
- **v1.0.1**: Added farmer theme and improved UI
- **v1.0.2**: Enhanced form validation and error handling
