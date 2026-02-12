// Go Digit Life Insurance Calculator JavaScript
class GoDigitLifeCalculator {
    constructor() {
        // Determine API URL based on current host
        const currentPort = window.location.port;
        if (currentPort && currentPort !== '8080' && (currentPort === '63342' || currentPort === '63343')) {
            this.apiUrl = 'http://localhost:8080/api/godigitlife/calculate';
        } else {
            this.apiUrl = '/api/godigitlife/calculate';
        }
        
        this.form = document.getElementById('godigitlifeForm');
        this.resultsContainer = document.getElementById('results');
        this.loadingSpinner = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Life type change - show/hide second life age
        const lifeTypeRadios = this.form.querySelectorAll('input[name="lifeType"]');
        lifeTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleLifeTypeChange());
        });
        
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

        // Age validation
        const ageInput = document.getElementById('entryAge');
        ageInput.addEventListener('input', (e) => this.validateAge(e));
        ageInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        const secondAgeInput = document.getElementById('secondLifeAge');
        secondAgeInput.addEventListener('input', (e) => this.validateAge(e));
        secondAgeInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));

        // Sum Assured validation
        const sumAssuredInput = document.getElementById('sumAssured');
        sumAssuredInput.addEventListener('input', (e) => this.validateSumAssured(e));
        sumAssuredInput.addEventListener('keypress', (e) => this.preventNegativeInput(e));
    }

    handleLifeTypeChange() {
        const lifeType = this.form.querySelector('input[name="lifeType"]:checked').value;
        const secondLifeGroup = document.getElementById('secondLifeGroup');
        const secondLifeAgeInput = document.getElementById('secondLifeAge');
        
        if (lifeType === 'JOINT') {
            secondLifeGroup.style.display = 'block';
            secondLifeAgeInput.setAttribute('required', 'required');
        } else {
            secondLifeGroup.style.display = 'none';
            secondLifeAgeInput.removeAttribute('required');
            secondLifeAgeInput.value = '';
            this.clearFieldError(secondLifeAgeInput);
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
                this.showFieldError(e.target, 'Age must be at least 18 years');
            } else if (value > 79) {
                e.target.value = '79';
                this.showFieldError(e.target, 'Age cannot exceed 79 years');
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid age');
        } else {
            this.clearFieldError(e.target);
        }
    }

    validateSumAssured(e) {
        const value = parseFloat(e.target.value);
        const min = 10_00_000;
        const max = 20_00_00_000;
        
        if (e.target.value.includes('-')) {
            e.target.value = e.target.value.replace(/-/g, '');
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
        if (!isNaN(value)) {
            if (value < min) {
                e.target.value = min.toString();
                this.showFieldError(e.target, `Sum Assured must be at least ₹10,00,000`);
            } else if (value > max) {
                e.target.value = max.toString();
                this.showFieldError(e.target, `Sum Assured cannot exceed ₹20,00,00,000`);
            } else {
                this.clearFieldError(e.target);
            }
        } else if (e.target.value !== '') {
            e.target.value = '';
            this.showFieldError(e.target, 'Please enter a valid sum assured');
        } else {
            this.clearFieldError(e.target);
        }
    }

    preventNegativeInput(e) {
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            (e.keyCode >= 35 && e.keyCode <= 40)) {
            return;
        }
        
        if (e.keyCode === 189 || e.keyCode === 109) {
            e.preventDefault();
            this.showFieldError(e.target, 'Negative numbers are not allowed');
            return;
        }
        
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

        if (field.hasAttribute('required') && !value && field.dataset.touched === 'true') {
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
            isValid = false;
        }

        if (fieldName === 'entryAge' || fieldName === 'secondLifeAge') {
            if (value) {
                const ageValue = parseInt(value);
                if (isNaN(ageValue) || ageValue < 18 || ageValue > 79) {
                    errorMessage = 'Age must be between 18 and 79 years';
                    isValid = false;
                }
            }
        }

        if (fieldName === 'sumAssured' && value) {
            const sumValue = parseFloat(value);
            if (isNaN(sumValue) || sumValue < 10_00_000 || sumValue > 20_00_00_000) {
                errorMessage = 'Sum Assured must be between ₹10,00,000 and ₹20,00,00,000';
                isValid = false;
            }
        }

        if (fieldName === 'coverTermMonths' && value) {
            const termValue = parseInt(value);
            if (isNaN(termValue) || ![12, 24, 36].includes(termValue)) {
                errorMessage = 'Cover term must be 12, 24, or 36 months';
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
            'entryAge': 'Entry Age',
            'secondLifeAge': 'Second Life Age',
            'sumAssured': 'Sum Assured',
            'coverTermMonths': 'Cover Term',
            'lifeType': 'Life Type'
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
        
        // Validate all required fields
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        // Check Joint Life second age
        const lifeType = this.form.querySelector('input[name="lifeType"]:checked').value;
        if (lifeType === 'JOINT') {
            const secondAge = document.getElementById('secondLifeAge').value;
            if (!secondAge || parseInt(secondAge) < 18 || parseInt(secondAge) > 79) {
                this.showFieldError(document.getElementById('secondLifeAge'), 'Second life age is required and must be 18-79 years');
                isFormValid = false;
            }
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
        
        for (let [key, value] of formData.entries()) {
            if (value && value.trim() !== '') {
                if (key === 'sumAssured') {
                    data[key] = parseFloat(value);
                } else if (key === 'entryAge' || key === 'secondLifeAge' || key === 'coverTermMonths') {
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
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to the server. Please ensure the Spring Boot application is running on port 8080.');
            }
            throw error;
        }
    }

    displayResults(data) {
        // Update premium amounts
        document.getElementById('premiumExclGst').textContent = this.formatCurrency(data.premiumExclGst);
        document.getElementById('premiumInclGst').textContent = this.formatCurrency(data.premiumInclGst);
        
        // Display breakdown
        this.displayBreakup(data);
        
        // Show results container
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.classList.add('fade-in');
        
        // Scroll to results
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    displayBreakup(data) {
        const breakupContainer = document.getElementById('loanBreakup');
        if (!breakupContainer) return;
        
        breakupContainer.innerHTML = '';
        
        const details = {
            'Life Type': data.lifeType === 'SINGLE' ? 'Single Life' : 'Joint Life',
            'Entry Age': data.lifeType === 'SINGLE' ? 
                `${this.getFormData().entryAge} years` : 
                `${this.getFormData().entryAge} & ${this.getFormData().secondLifeAge} years`,
            'Age Band': data.ageBand || '-',
            'Sum Assured': this.formatCurrency(data.sumAssured),
            'Cover Term': `${data.coverTermMonths} months`,
            'Rate per ₹1000': `₹${data.ratePerThousand.toFixed(2)}`
        };
        
        if (data.lifeType === 'JOINT') {
            details['First Life Premium'] = this.formatCurrency(data.firstLifePremium);
            details['Second Life Premium'] = this.formatCurrency(data.secondLifePremium);
            details['Joint Life Discount (5%)'] = this.formatCurrency(data.jointLifeDiscount);
        }
        
        details['Premium (Excl. GST)'] = this.formatCurrency(data.premiumExclGst);
        details['GST (18%)'] = this.formatCurrency(data.premiumExclGst * 0.18);
        details['Premium (Incl. GST)'] = this.formatCurrency(data.premiumInclGst);
        
        breakupContainer.appendChild(this.createBreakupCard('Premium Calculation', details));
    }

    createBreakupCard(title, details) {
        const card = document.createElement('div');
        card.className = 'breakup-card';
        
        const header = document.createElement('div');
        header.className = 'breakup-header';
        header.innerHTML = `<h4><i class="fas fa-calculator"></i> ${title}</h4>`;
        
        const body = document.createElement('div');
        body.className = 'breakup-body';
        
        Object.entries(details).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'breakup-row';
            
            const label = document.createElement('span');
            label.className = 'breakup-label';
            label.textContent = key + ':';
            
            const val = document.createElement('span');
            const isPremium = key.includes('Premium') || key.includes('GST');
            val.className = isPremium ? 'breakup-value highlight-value' : 'breakup-value';
            val.textContent = value;
            
            row.appendChild(label);
            row.appendChild(val);
            body.appendChild(row);
        });
        
        card.appendChild(header);
        card.appendChild(body);
        
        return card;
    }

    getFormData() {
        return {
            entryAge: parseInt(document.getElementById('entryAge').value),
            secondLifeAge: document.getElementById('secondLifeAge').value ? parseInt(document.getElementById('secondLifeAge').value) : null
        };
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
        
        document.getElementById('premiumExclGst').textContent = '₹0.00';
        document.getElementById('premiumInclGst').textContent = '₹0.00';
        
        const breakupContainer = document.getElementById('loanBreakup');
        if (breakupContainer) {
            breakupContainer.innerHTML = '';
        }
    }

    resetForm() {
        this.form.reset();
        this.handleLifeTypeChange(); // Reset second life visibility
        this.hideResults();
        this.hideError();
        
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => this.clearFieldError(input));
    }
}

// Utility function for form reset
function resetGoDigitLifeForm() {
    if (window.goDigitLifeCalculator) {
        window.goDigitLifeCalculator.resetForm();
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.goDigitLifeCalculator = new GoDigitLifeCalculator();
    
    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
        section.classList.add('fade-in');
    });
    
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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('godigitlifeForm').dispatchEvent(new Event('submit'));
    }
    
    if (e.key === 'Escape') {
        resetGoDigitLifeForm();
    }
});

