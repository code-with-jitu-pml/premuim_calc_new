// Aditya Birla Premium Calculator JavaScript
class AdityabirlaCalculator {
    constructor() {
        // Determine API URL based on current host
        // If running on IDE server (port 63342), use absolute URL to Spring Boot (port 8080)
        // Otherwise, use relative URL (when served by Spring Boot)
        const currentPort = window.location.port;
        if (currentPort && currentPort !== '8080' && (currentPort === '63342' || currentPort === '63343')) {
            // Running on IDE web server, use absolute URL to Spring Boot
            this.apiUrl = 'http://localhost:8080/api/calculate';
        } else {
            // Running on Spring Boot server, use relative URL
            this.apiUrl = '/api/calculate';
        }
        
        this.form = document.getElementById('adityabirlaForm');
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
                input.style.borderColor = '';
                input.style.boxShadow = '';
            });
            input.addEventListener('focus', () => {
                this.clearFieldError(input);
                input.style.borderColor = '';
                input.style.boxShadow = '';
            });
        });

        // Product checkbox validation
        const productCheckboxes = this.form.querySelectorAll('input[name="products"]');
        productCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.validateProductSelection();
                this.handleProductSelectionChange(checkbox);
            });
        });

        // EMI Amount validation - required if EMI_PROTECT is selected
        const emiInput = document.getElementById('emiAmount');
        emiInput.addEventListener('input', (e) => this.validateEmiAmount(e));
        emiInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        // Age validation
        const ageInput = document.getElementById('age');
        ageInput.addEventListener('input', (e) => this.validateAge(e));
        ageInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        // Loan Amount validation
        const loanInput = document.getElementById('loanAmount');
        loanInput.addEventListener('input', (e) => this.validateLoanAmount(e));
        loanInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        // Annual Income removed from UI
    }

    validateProductSelection() {
        const selectedProducts = this.form.querySelectorAll('input[name="products"]:checked');
        if (selectedProducts.length === 0) {
            this.showError('Please select at least one product');
            return false;
        }
        this.hideError();
        return true;
    }

    handleProductSelectionChange(checkbox) {
        // When EMI Protect is selected/unselected, update EMI field requirement
        if (checkbox.id === 'productEMI') {
            const emiInput = document.getElementById('emiAmount');
            const emiLabel = emiInput.closest('.form-group').querySelector('label');
            const emiHelpText = document.getElementById('emiHelpText');
            
            if (checkbox.checked) {
                emiInput.setAttribute('required', 'required');
                emiLabel.innerHTML = 'EMI Amount <span class="required">*</span>';
                if (emiHelpText) {
                    emiHelpText.textContent = 'Mandatory when EMI Protect product is selected';
                    emiHelpText.style.color = '#dc2626';
                }
                // Validate EMI if it's already filled
                if (emiInput.value) {
                    this.validateEmiAmount({ target: emiInput });
                } else {
                    // Show validation error if empty
                    this.showFieldError(emiInput, 'EMI Amount is mandatory when EMI Protect product is selected');
                }
            } else {
                emiInput.removeAttribute('required');
                emiLabel.innerHTML = 'EMI Amount';
                if (emiHelpText) {
                    emiHelpText.textContent = 'Required when EMI Protect product is selected';
                    emiHelpText.style.color = '';
                }
                this.clearFieldError(emiInput);
            }
        }
    }

    validateAge(e) {
        const value = parseInt(e.target.value);
        
        if (e.target.value.includes('-')) {
            e.target.value = e.target.value.replace(/-/g, '');
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        if (!isNaN(value)) {
            if (value < 18) {
                e.target.value = '18';
                this.showFieldError(e.target, 'Age must be at least 18 years. Minimum age limit is 18 years.');
            } else if (value > 100) {
                e.target.value = '100';
                this.showFieldError(e.target, 'Age cannot exceed 100 years. Maximum age limit is 100 years.');
            } else if (value < 1) {
                e.target.value = '18';
                this.showFieldError(e.target, 'Age must be at least 18 years');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid age (18-100 years)');
        } else {
            this.clearFieldError(e.target);
        }
    }

    validateLoanAmount(e) {
        const value = parseFloat(e.target.value);
        
        if (e.target.value.includes('-')) {
            e.target.value = e.target.value.replace(/-/g, '');
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        if (!isNaN(value)) {
            if (value < 0) {
                e.target.value = '0';
                this.showFieldError(e.target, 'Loan Amount cannot be negative');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid loan amount');
        } else {
            this.clearFieldError(e.target);
        }
    }

    validateEmiAmount(e) {
        const value = parseFloat(e.target.value);
        const emiProtectSelected = document.getElementById('productEMI').checked;
        
        if (e.target.value.includes('-')) {
            e.target.value = e.target.value.replace(/-/g, '');
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        if (!isNaN(value)) {
            if (value < 0) {
                e.target.value = '0';
                this.showFieldError(e.target, 'EMI Amount cannot be negative');
            } else if (emiProtectSelected && (!value || value === 0)) {
                this.showFieldError(e.target, 'EMI Amount is mandatory when EMI Protect product is selected');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid EMI amount');
        } else if (emiProtectSelected && !e.target.value) {
            this.showFieldError(e.target, 'EMI Amount is mandatory when EMI Protect product is selected');
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
        if (e.keyCode === 189 || e.keyCode === 109) {
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

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value && field.dataset.touched === 'true') {
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
            isValid = false;
        }

        // Age validation with strict limits
        if (fieldName === 'age' && value) {
            const ageValue = parseInt(value);
            if (isNaN(ageValue) || ageValue < 18 || ageValue > 100) {
                errorMessage = 'Age must be between 18 and 100 years (inclusive)';
                isValid = false;
            }
        }
        
        // EMI Amount validation - mandatory if EMI Protect is selected
        if (fieldName === 'emiAmount') {
            const emiProtectSelected = document.getElementById('productEMI').checked;
            if (emiProtectSelected && (!value || parseFloat(value) <= 0)) {
                errorMessage = 'EMI Amount is mandatory when EMI Protect product is selected';
                isValid = false;
            }
        }

        // Number validation
        if (field.type === 'number' && value) {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                errorMessage = 'Please enter a valid positive number';
                isValid = false;
            }
        }

        // Loan Tenure validation
        if (fieldName === 'loanTenure' && value) {
            const tenureValue = parseInt(value);
            if (isNaN(tenureValue) || tenureValue < 1 || tenureValue > 5) {
                errorMessage = 'Loan tenure must be between 1 and 5 years';
                isValid = false;
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    getFieldLabel(fieldName) {
        const labels = {
            'age': 'Age',
            'loanAmount': 'Loan Amount',
            'loanTenure': 'Loan Tenure',
            'emiAmount': 'EMI Amount',
            'products': 'Products'
        };
        return labels[fieldName] || fieldName;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#dc2626';
        field.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
        
        let errorDiv = field.parentNode.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        field.style.backgroundColor = '';
        field.classList.remove('error');
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            const groupErrorDiv = formGroup.querySelector('.field-error');
            if (groupErrorDiv) {
                groupErrorDiv.remove();
            }
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate product selection
        if (!this.validateProductSelection()) {
            return;
        }

        // Validate all required fields
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        // Check if EMI Protect is selected and EMI amount is provided
        const emiProtectSelected = document.getElementById('productEMI').checked;
        const emiAmount = document.getElementById('emiAmount').value;
        const emiInput = document.getElementById('emiAmount');
        if (emiProtectSelected && (!emiAmount || parseFloat(emiAmount) <= 0)) {
            this.showFieldError(emiInput, 'EMI Amount is mandatory when EMI Protect product is selected');
            this.showError('EMI Amount is mandatory when EMI Protect product is selected');
            isFormValid = false;
        }

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
            this.showError(error.message || 'Failed to calculate premium. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    prepareFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Get selected products
        const selectedProducts = [];
        const productCheckboxes = this.form.querySelectorAll('input[name="products"]:checked');
        productCheckboxes.forEach(checkbox => {
            selectedProducts.push(checkbox.value);
        });
        data.products = selectedProducts;
        
        // Convert form data to object
        for (let [key, value] of formData.entries()) {
            if (key !== 'products' && value && value.trim() !== '') {
                if (key === 'loanAmount' || key === 'emiAmount') {
                    data[key] = parseFloat(value);
                } else if (key === 'age' || key === 'loanTenure') {
                    data[key] = parseInt(value);
                } else {
                    data[key] = value.trim();
                }
            }
        }
        
        return data;
    }

    async calculatePremium(data) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('API endpoint not found. Please ensure the Spring Boot server is running on port 8080.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Handle network errors (backend not running, CORS issues, etc.)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to the server. Please ensure the Spring Boot application is running on port 8080.');
            }
            throw error;
        }
    }

    displayResults(data) {
        // Get form data for calculation breakdown
        const formData = this.prepareFormData();
        
        // Show/hide product premium cards based on response
        const gciCard = document.getElementById('gciCard');
        const gpaCard = document.getElementById('gpaCard');
        const emiCard = document.getElementById('emiCard');
        
        if (data.gciPremium && data.gciPremium > 0) {
            document.getElementById('gciPremium').textContent = this.formatCurrency(data.gciPremium);
            gciCard.style.display = 'block';
        } else {
            gciCard.style.display = 'none';
        }
        
        if (data.gpaPremium && data.gpaPremium > 0) {
            document.getElementById('gpaPremium').textContent = this.formatCurrency(data.gpaPremium);
            gpaCard.style.display = 'block';
        } else {
            gpaCard.style.display = 'none';
        }
        
        if (data.emiProtectPremium && data.emiProtectPremium > 0) {
            document.getElementById('emiProtectPremium').textContent = this.formatCurrency(data.emiProtectPremium);
            emiCard.style.display = 'block';
        } else {
            emiCard.style.display = 'none';
        }
        
        // Update total premium
        document.getElementById('totalPremium').textContent = this.formatCurrency(data.totalPremium || 0);
        
        // Display loan-wise breakup
        this.displayLoanBreakup(data, formData);
        
        // Show results container
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.classList.add('fade-in');
        
        // Scroll to results
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    displayLoanBreakup(data, formData) {
        const breakupContainer = document.getElementById('loanBreakup');
        if (!breakupContainer) return;
        
        breakupContainer.innerHTML = '';
        
        // Rate maps (matching backend)
        const GCI_RATE = { 1: 3.00, 2: 5.58, 3: 8.16, 4: 10.70, 5: 13.31 };
        const GPA_RATE = { 1: 32, 2: 59, 3: 86, 4: 113, 5: 140 };
        const EMI_RATE = { 1: 108, 2: 202, 3: 294, 4: 385, 5: 479 };
        
        const age = formData.age;
        const loanAmount = formData.loanAmount;
        const loanTenure = formData.loanTenure;
        const emiAmount = formData.emiAmount || 0;
        
        // GCI Breakdown
        if (data.gciPremium && data.gciPremium > 0) {
            // Annual income removed; backend uses flat SI of 50L for GCI
            const sumInsured = 5000000;
            const rate = GCI_RATE[loanTenure];
            const premium = (sumInsured / 1000) * rate;
            
            breakupContainer.appendChild(this.createBreakupCard('GCI', {
                'Sum Insured': this.formatCurrency(sumInsured),
                'Rate per ₹1000': `₹${rate.toFixed(2)}`,
                'Calculation': `(${this.formatNumber(sumInsured)} / 1000) × ${rate.toFixed(2)}`,
                'Premium': this.formatCurrency(premium)
            }));
        }
        
        // GPA Breakdown
        if (data.gpaPremium && data.gpaPremium > 0) {
            const sumInsured = Math.min(loanAmount, 100000000);
            const rate = GPA_RATE[loanTenure];
            const premium = (sumInsured / 100000) * rate;
            
            breakupContainer.appendChild(this.createBreakupCard('GPA', {
                'Sum Insured': this.formatCurrency(sumInsured),
                'Rate per ₹1,00,000': `₹${rate}`,
                'Calculation': `(${this.formatNumber(sumInsured)} / 1,00,000) × ${rate}`,
                'Premium': this.formatCurrency(premium)
            }));
        }
        
        // EMI Protect Breakdown
        if (data.emiProtectPremium && data.emiProtectPremium > 0) {
            const sumInsured = Math.min(emiAmount * 3, 500000);
            const rate = EMI_RATE[loanTenure];
            const premium = (sumInsured / 1000) * rate;
            
            breakupContainer.appendChild(this.createBreakupCard('EMI Protect', {
                'EMI Amount': this.formatCurrency(emiAmount),
                'Sum Insured (EMI × 3, max ₹5L)': this.formatCurrency(sumInsured),
                'Rate per ₹1000': `₹${rate}`,
                'Calculation': `(${this.formatNumber(sumInsured)} / 1000) × ${rate}`,
                'Premium': this.formatCurrency(premium)
            }));
        }
    }

    createBreakupCard(productName, details) {
        const card = document.createElement('div');
        card.className = 'breakup-card';
        
        const header = document.createElement('div');
        header.className = 'breakup-header';
        header.innerHTML = `<h4><i class="fas fa-calculator"></i> ${productName} Calculation Breakdown</h4>`;
        
        const body = document.createElement('div');
        body.className = 'breakup-body';
        
        Object.entries(details).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'breakup-row';
            
            const label = document.createElement('span');
            label.className = 'breakup-label';
            label.textContent = key + ':';
            
            const val = document.createElement('span');
            val.className = key === 'Premium' ? 'breakup-value highlight-value' : 'breakup-value';
            val.textContent = value;
            
            row.appendChild(label);
            row.appendChild(val);
            body.appendChild(row);
        });
        
        card.appendChild(header);
        card.appendChild(body);
        
        return card;
    }

    formatNumber(num) {
        return parseFloat(num).toLocaleString('en-IN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
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
        this.resultsContainer.style.display = 'none';
        this.resultsContainer.classList.remove('fade-in');
        
        // Reset premium amounts
        document.getElementById('gciPremium').textContent = '₹0.00';
        document.getElementById('gpaPremium').textContent = '₹0.00';
        document.getElementById('emiProtectPremium').textContent = '₹0.00';
        document.getElementById('totalPremium').textContent = '₹0.00';
        
        // Clear breakup
        const breakupContainer = document.getElementById('loanBreakup');
        if (breakupContainer) {
            breakupContainer.innerHTML = '';
        }
    }

    resetForm() {
        this.form.reset();
        this.hideResults();
        this.hideError();
        
        // Clear all field errors
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => this.clearFieldError(input));
        
        // Hide all product cards
        document.getElementById('gciCard').style.display = 'none';
        document.getElementById('gpaCard').style.display = 'none';
        document.getElementById('emiCard').style.display = 'none';
    }
}

// Utility function for form reset
function resetAdityabirlaForm() {
    if (window.adityabirlaCalculator) {
        window.adityabirlaCalculator.resetForm();
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adityabirlaCalculator = new AdityabirlaCalculator();
    
    // Add interactive animations
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

    // Add hover effects to product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('adityabirlaForm').dispatchEvent(new Event('submit'));
    }
    
    // Escape to reset form
    if (e.key === 'Escape') {
        resetAdityabirlaForm();
    }
});

