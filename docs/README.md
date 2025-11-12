# Premium Calculator - Agricultural Insurance

A beautiful, farmer-themed premium calculator web application that integrates with your Spring Boot backend.

## Features

🌾 **Farmer-Themed Design**
- Agricultural color scheme with green gradients
- Wheat and seedling icons
- Smooth animations and transitions
- Responsive design for all devices

📱 **User Experience**
- Real-time form validation
- Auto-save form data
- Loading animations
- Error handling with user-friendly messages
- Keyboard shortcuts (Ctrl+Enter to submit, Escape to reset)

🔧 **Technical Features**
- Clean, modern HTML5 structure
- CSS3 animations and transitions
- Vanilla JavaScript (no dependencies)
- RESTful API integration
- Form validation and error handling

## How to Use

1. **Start your Spring Boot backend** on `http://localhost:8080`
2. **Open `index.html`** in your web browser
3. **Fill in the form** with the required information:
   - Personal Information (Date of Birth)
   - Loan Information (Amount, Tenure, EMI, etc.)
   - Policy Information (Tenure, Health Indemnity, Co-applicant)
4. **Click "Calculate Premium"** to get your results
5. **View the results** with detailed breakdown

## Form Fields

### Required Fields
- **Date of Birth**: Format DD/MM/YYYY
- **Loan Amount**: Positive number

### Optional Fields
- **Loan Tenure**: Years
- **Policy Tenure**: Years (1-5)
- **Sum Insured Percentage**: Percentage of loan value
- **EMI Amount**: Monthly EMI amount
- **Health Indemnity**: NIL, 1 LAC, 2 LAC, or 3 LAC
- **Co-Applicant Cover**: Checkbox

## API Integration

The frontend integrates with your Spring Boot backend:

- **Endpoint**: `POST /premium/calculate`
- **Request**: Matches your `InputRequest` class
- **Response**: Matches your `OutputResponse` class

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## File Structure

```
calc/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── README.md           # This file
└── [Your Java files]
    ├── InputRequest.java
    ├── OutputResponse.java
    ├── PremiumController.java
    └── PremiumService.java
```

## Customization

### Changing API URL
Edit the `apiUrl` in `script.js`:
```javascript
this.apiUrl = 'http://your-server:port/premium/calculate';
```

### Styling
All styles are in `styles.css`. Key sections:
- `.header` - Header styling
- `.form-section` - Form sections
- `.premium-card` - Results display
- Animations and transitions

### Adding Features
The JavaScript is modular and easy to extend. Key classes:
- `PremiumCalculator` - Main application class
- Form validation methods
- API integration methods
- Result display methods

## Troubleshooting

1. **CORS Issues**: Make sure your Spring Boot app has CORS enabled
2. **API Connection**: Verify the backend is running on the correct port
3. **Form Validation**: Check browser console for validation errors
4. **Styling Issues**: Ensure all CSS files are loaded properly

## Development

To modify the application:

1. Edit HTML structure in `index.html`
2. Update styles in `styles.css`
3. Modify functionality in `script.js`
4. Test with your Spring Boot backend

## Support

The application is designed to work seamlessly with your existing Spring Boot backend. All form fields map directly to your `InputRequest` class properties.
