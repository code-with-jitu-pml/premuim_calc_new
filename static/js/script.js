// Premium Calculator JavaScript
class PremiumCalculator {
    constructor() {
        this.apiUrl = '/premium/calculate';
        this.form = document.getElementById('premiumForm');
        this.resultsContainer = document.getElementById('results');
        this.loadingSpinner = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                input.dataset.touched = 'true';
                this.validateField(input);
            });
            input.addEventListener('input', () => {
                this.clearFieldError(input);
                // Clear any existing error styling
                input.style.borderColor = '';
                input.style.boxShadow = '';
            });
            input.addEventListener('focus', () => {
                this.clearFieldError(input);
                // Clear error styling immediately on focus
                input.style.borderColor = '';
                input.style.boxShadow = '';
                // Clear all other field errors when focusing on any field
                this.clearAllFieldErrors();
            });
            input.addEventListener('click', () => {
                this.clearFieldError(input);
                // Clear error styling immediately on click
                input.style.borderColor = '';
                input.style.boxShadow = '';
            });
        });

        // Date of birth formatting
        let dobInput = document.getElementById('dob');
        dobInput.addEventListener('change', (e) => this.handleDateChange(e));

        // EMI Amount real-time validation
        const emiInput = document.getElementById('emiAmount');
        emiInput.addEventListener('input', (e) => this.validateEmiAmount(e));
        emiInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        // Loan Amount real-time validation
        const loanInput = document.getElementById('loanAmount');
        loanInput.addEventListener('input', (e) => this.validateLoanAmount(e));
        loanInput.addEventListener('keypress', (e) => this.preventLargeNumberInput(e, 30000000));

        // Sum Insured Percentage real-time validation
        const sumInsuredInput = document.getElementById('sumInsuredPercent');
        sumInsuredInput.addEventListener('input', (e) => this.validateSumInsuredPercent(e));

        // Loan Tenure real-time validation
        const loanTenureInput = document.getElementById('loanTenureYears');
        loanTenureInput.addEventListener('input', (e) => this.validateLoanTenure(e));
        loanTenureInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        // Set maximum date for Date of Birth to today
        dobInput = document.getElementById('dob');
        const today = new Date().toISOString().split('T')[0];
        dobInput.setAttribute('max', today);
        
        // Date of Birth real-time validation
        dobInput.addEventListener('change', (e) => this.validateDateOfBirth(e));
    }

    handleDateChange(e) {
        const dateValue = e.target.value;
        if (dateValue) {
            // Convert from YYYY-MM-DD to DD/MM/YYYY format for backend
            const date = new Date(dateValue);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            
            // Store the formatted date in a hidden field or data attribute
            e.target.setAttribute('data-formatted-date', formattedDate);
            
            // Clear any previous errors
            this.clearFieldError(e.target);
        }
    }

    validateEmiAmount(e) {
        const value = parseFloat(e.target.value);
        
        // Remove any negative signs immediately
        if (e.target.value.includes('-')) {
            e.target.value = e.target.value.replace(/-/g, '');
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        if (!isNaN(value)) {
            if (value < 0) {
                e.target.value = '0';
                this.showFieldError(e.target, 'EMI Amount cannot be negative');
            } else if (value > 100000) {
                e.target.value = '100000';
                this.showFieldError(e.target, 'EMI Amount cannot exceed ₹1,00,000');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            // If it's not a valid number and not empty, clear it
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid EMI amount');
        } else {
            this.clearFieldError(e.target);
        }
    }

    preventLargeNumberInput(e, maxValue) {
        // Allow: backspace, delete, tab, escape, enter, decimal point
        if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Allow: home, end, left, right, down, up
            (e.keyCode >= 35 && e.keyCode <= 40)) {
            return;
        }
        
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
            return;
        }
        
        // Check if the resulting value would exceed the maximum
        const currentValue = e.target.value;
        const newValue = currentValue + e.key;
        const numericValue = parseFloat(newValue);
        
        if (!isNaN(numericValue) && numericValue > maxValue) {
            e.preventDefault();
            this.showFieldError(e.target, `Value cannot exceed ₹${(maxValue/10000000).toFixed(1)} Crores`);
        }
    }

    validateLoanAmount(e) {
        const value = parseFloat(e.target.value);
        const maxValue = 30000000; // ₹3 Crores

        if (!isNaN(value)) {
            if (value > maxValue) {

                e.target.value = maxValue.toString();
                this.showFieldError(e.target, 'Loan Amount cannot exceed ₹3 Crores (₹3,00,00,000)');
            } else if (value < 0) {
                e.target.value = '0';
                this.showFieldError(e.target, 'Loan Amount cannot be negative');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            // If it's not a valid number and not empty, clear it
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid loan amount');
        } else {
            this.clearFieldError(e.target);
        }
    }

    validateSumInsuredPercent(e) {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            if (value < 1) {
                e.target.value = '1';
                this.showFieldError(e.target, 'Sum Insured Percentage must be at least 1%');
            } else if (value > 100) {
                e.target.value = '100';
                this.showFieldError(e.target, 'Sum Insured Percentage cannot exceed 100%');
            } else {
                this.clearFieldError(e.target);
            }
        } else {
            this.clearFieldError(e.target);
        }
    }

    preventNegativeInput(e) {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Allow: home, end, left, right, down, up
            (e.keyCode >= 35 && e.keyCode <= 40)) {
            return;
        }
        
        // Prevent minus sign (-) from being typed
        if (e.keyCode === 189 || e.keyCode === 109) { // minus key
            e.preventDefault();
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
            return;
        }
    }

    validateLoanTenure(e) {
        const value = parseFloat(e.target.value);
        
        // Remove any negative signs immediately
        if (e.target.value.includes('-')) {
            e.target.value = e.target.value.replace(/-/g, '');
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        if (!isNaN(value)) {
            if (value < 0) {
                e.target.value = '0';
                this.showFieldError(e.target, 'Loan Tenure cannot be negative');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            // If it's not a valid number and not empty, clear it
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid number of years');
        } else {
            this.clearFieldError(e.target);
        }
    }

    validateDateOfBirth(e) {
        const selectedDate = new Date(e.target.value);
        const today = new Date();
        
        if (isNaN(selectedDate.getTime())) {
            this.showFieldError(e.target, 'Please select a valid date');
        } else if (selectedDate >= today) {
            this.showFieldError(e.target, 'Date of birth cannot be today or in the future');
        } else {
            this.clearFieldError(e.target);
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearFieldError(field);

        // Only show required field validation if the field has been touched and is empty
        if (field.hasAttribute('required') && !value && field.dataset.touched === 'true') {
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
            isValid = false;
        }

        // Date validation
        if (fieldName === 'dob' && value) {
            const dateValue = new Date(value);
            const today = new Date();
            if (isNaN(dateValue.getTime()) ||dateValue.length >1 || dateValue >= today) {
                errorMessage = 'Please select a valid past date';
                isValid = false;
            }
        }

        // Number validation
        if (field.type === 'number' && value ) {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0 ) {
                errorMessage = 'Please enter a valid positive number';
                isValid = false;
            }
        }

        // EMI Amount validation (max 100,000)
        if (fieldName === 'emiAmount' && value) {
            const emiValue = parseFloat(value);
            if (emiValue > 100000) {
                errorMessage = 'EMI Amount cannot exceed ₹1,00,000';
                isValid = false;
            }
        }

        // Loan Amount validation (max 3 crores)
        if (fieldName === 'loanAmount' && value) {
            const loanValue = parseFloat(value);
            if (loanValue > 30000000) {
                errorMessage = 'Loan Amount cannot exceed ₹3 Crores';
                isValid = false;
            }
        }

        // Sum Insured Percentage validation (max 100%)
        if (fieldName === 'sumInsuredPercent' && value) {
            const percentValue = parseFloat(value);
            if (percentValue > 100) {
                errorMessage = 'Sum Insured Percentage cannot exceed 100%';
                isValid = false;
            }
        }

        // Policy tenure validation (1-5 years only)
        if (fieldName === 'policyTenureYears' && value) {
            const tenureValue = parseInt(value);
            if (isNaN(tenureValue) || tenureValue < 1 || tenureValue > 5) {
                errorMessage = 'Policy tenure must be between 1 and 5 years';
                isValid = false;
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    isValidDate(dateString) {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateString.match(regex);
        
        if (!match) return false;
        
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        
        const date = new Date(year, month - 1, day);
        
        return date.getDate() === day && 
               date.getMonth() === month - 1 && 
               date.getFullYear() === year &&
               date < new Date();
    }

    getFieldLabel(fieldName) {
        const labels = {
            'dob': 'Date of Birth',
            'loanAmount': 'Loan Amount',
            'loanTenureYears': 'Loan Tenure',
            'policyTenureYears': 'Policy Tenure',
            'sumInsuredPercent': 'Sum Insured Percentage',
            'emiAmount': 'EMI Amount',
            'healthIndemnity': 'Health Indemnity'
        };
        return labels[fieldName] || fieldName;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#dc2626';
        field.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
        
        // Create or update error message
        let errorDiv = field.parentNode.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    clearFieldError(field) {
        // Clear all error styling
        field.style.borderColor = '';
        field.style.boxShadow = '';
        field.style.backgroundColor = '';
        
        // Remove error class if it exists
        field.classList.remove('error');
        
        // Find and remove error message
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        // Also check for any error messages in the parent form-group
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            const groupErrorDiv = formGroup.querySelector('.field-error');
            if (groupErrorDiv) {
                groupErrorDiv.remove();
            }
        }
    }

    clearAllFieldErrors() {
        // Clear all field errors and styling
        const allInputs = this.form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            this.clearFieldError(input);
            input.style.borderColor = '';
            input.style.boxShadow = '';
            input.style.backgroundColor = '';
        });
        
        // Remove all error messages from the form
        const allErrorDivs = this.form.querySelectorAll('.field-error');
        allErrorDivs.forEach(errorDiv => {
            errorDiv.remove();
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showError('Please fix the errors in the form before submitting.');
            return;
        }

        // Prepare form data
        const formData = this.prepareFormData();
        
        try {
            this.showLoading(true);
            this.hideError();
            
            const response = await this.calculatePremium(formData);
            this.displayResults(response);
            
        } catch (error) {
            console.error('Error calculating premium:', error);
            this.showError('Failed to calculate premium. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    prepareFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Convert form data to object
        for (let [key, value] of formData.entries()) {
            if (key === 'coApplicantCover') {
                data[key] = value === 'true';
            } else if (key === 'dob') {
                // Convert date from YYYY-MM-DD to DD/MM/YYYY format
                if (value) {
                    const date = new Date(value);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    data[key] = `${day}/${month}/${year}`;
                }
            } else if (value && value.trim() !== '') {
                if (key === 'loanAmount' || key === 'sumInsuredPercent' || key === 'emiAmount') {
                    data[key] = parseFloat(value);
                } else if (key === 'loanTenureYears' || key === 'policyTenureYears') {
                    data[key] = parseInt(value);
                } else {
                    data[key] = value.trim();
                }
            }
        }
        
        // Ensure policy tenure is within valid range (1-5)
        if (data.policyTenureYears) {
            data.policyTenureYears = Math.max(1, Math.min(5, data.policyTenureYears));
        }
        
        return data;
    }

    async calculatePremium(data) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    displayResults(data) {
        // Update result fields
        document.getElementById('resultAge').textContent = data.age || '-';
        document.getElementById('resultPolicyTenure').textContent = data.policyTenureYears || '-';
        document.getElementById('resultSumInsured').textContent = this.formatCurrency(data.sumInsured);
        document.getElementById('resultEmiAmount').textContent = this.formatCurrency(data.emiAmount);
        document.getElementById('resultHealthIndemnity').textContent = data.healthIndemnity || 'NIL';
        document.getElementById('resultCoApplicantCover').textContent = data.coApplicantCover ? 'Yes' : 'No';
        
        // Update premium amounts
        document.getElementById('premiumExclGst').textContent = this.formatCurrency(data.premiumExclGst);
        document.getElementById('premiumInclGst').textContent = this.formatCurrency(data.premiumInclGst);
        
        // Add animation to results
        this.resultsContainer.classList.add('fade-in');
        
        // Scroll to results
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '₹0.00';
        return `₹${parseFloat(amount).toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }

    showLoading(show) {
        this.loadingSpinner.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    hideResults() {
        // Reset results to default values
        document.getElementById('resultAge').textContent = '-';
        document.getElementById('resultPolicyTenure').textContent = '-';
        document.getElementById('resultSumInsured').textContent = '₹0.00';
        document.getElementById('resultEmiAmount').textContent = '₹0.00';
        document.getElementById('resultHealthIndemnity').textContent = '-';
        document.getElementById('resultCoApplicantCover').textContent = '-';
        document.getElementById('premiumExclGst').textContent = '₹0.00';
        document.getElementById('premiumInclGst').textContent = '₹0.00';
        this.resultsContainer.classList.remove('fade-in');
    }

    resetForm() {
        this.form.reset();
        this.hideResults();
        this.hideError();
        
        // Clear all field errors
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => this.clearFieldError(input));
        
        // Reset form styling
        const formSections = document.querySelectorAll('.form-section');
        formSections.forEach(section => {
            section.style.borderColor = '#e8f5e8';
            section.style.boxShadow = 'none';
        });
    }
}

// Utility function for form reset
function resetForm() {
    if (window.premiumCalculator) {
        window.premiumCalculator.resetForm();
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.premiumCalculator = new PremiumCalculator();
    
    // Add some interactive animations
    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
        section.classList.add('fade-in');
    });
    
    // Add hover effects to premium cards
    const premiumCards = document.querySelectorAll('.premium-card');
    premiumCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('premiumForm').dispatchEvent(new Event('submit'));
    }
    
    // Escape to reset form
    if (e.key === 'Escape') {
        resetForm();
    }
});

// Add form auto-save functionality
let formData = {};
const form = document.getElementById('premiumForm');

// Save form data to localStorage on input
form.addEventListener('input', (e) => {
    if (e.target.type === 'checkbox') {
        formData[e.target.name] = e.target.checked;
    } else {
        formData[e.target.name] = e.target.value;
    }
    localStorage.setItem('premiumCalculatorData', JSON.stringify(formData));
});

// Load saved form data on page load
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('premiumCalculatorData');
    if (savedData) {
        try {
            formData = JSON.parse(savedData);
            Object.keys(formData).forEach(key => {
                const element = form.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = formData[key];
                    } else {
                        element.value = formData[key];
                    }
                }
            });
        } catch (error) {
            console.warn('Could not load saved form data:', error);
        }
    }
});

// Clear saved data on successful calculation
const originalDisplayResults = PremiumCalculator.prototype.displayResults;
PremiumCalculator.prototype.displayResults = function(data) {
    originalDisplayResults.call(this, data);
    localStorage.removeItem('premiumCalculatorData');
    formData = {};
};