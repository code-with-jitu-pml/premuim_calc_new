/**
 * Aditya Birla Premium Calculator – Product‑Wise with Summary Panel
 */
class AdityabirlaCalculator {
    constructor() {
        const port = window.location.port;
        this.apiUrl = (port && port !== '8080' && (port === '63342' || port === '63343'))
            ? 'http://localhost:8080/api/calculate'
            : '/api/calculate';

        this.loadingEl = document.getElementById('loading');
        this.errorEl = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.resultsContainer = document.getElementById('results');
        this.breakupContainer = document.getElementById('loanBreakup');

        // Store calculated premiums for total
        this.premiums = {
            GCI: 0,
            GPA: 0,
            EMI_PROTECT: 0,
            CANCER_SECURE: 0
        };

        this.attachListeners();
    }

    attachListeners() {
        // Product checkbox toggle sections
        document.querySelectorAll('input[name="products"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                this.toggleSection(e.target.value, e.target.checked);
            });
        });

        // Product calculate buttons
        document.querySelectorAll('.product-calc').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const product = e.target.closest('.product-calc').dataset.product;
                this.calculateProduct(product);
            });
        });

        // Global Calculate All button
        document.getElementById('globalCalculateBtn')?.addEventListener('click', () => {
            this.calculateAllSelected();
        });

        // Pre-checked sections
        document.querySelectorAll('input[name="products"]:checked').forEach(cb => {
            this.toggleSection(cb.value, true);
        });
    }

    toggleSection(productValue, show) {
        const map = {
            'GCI': 'gciSection',
            'GPA': 'gpaSection',
            'EMI_PROTECT': 'emiSection',
            'CANCER_SECURE': 'cancerSection'
        };
        const section = document.getElementById(map[productValue]);
        if (section) section.style.display = show ? 'block' : 'none';
    }

    // ---------- Product‑specific validation & request building ----------
    buildRequest(product) {
        let data = { products: [product] };
        let valid = true;

        const showError = (id, msg) => {
            const el = document.getElementById(id);
            this.showFieldError(el, msg);
            valid = false;
        };
        const clearError = (id) => {
            const el = document.getElementById(id);
            if (el) this.clearFieldError(el);
        };

        switch (product) {
            case 'GCI': {
                const age = document.getElementById('gciAge');
                const sum = document.getElementById('gciSumInsured');
                const tenure = document.getElementById('gciPolicyTenure');
                clearError('gciAge');
                clearError('gciSumInsured');
                clearError('gciPolicyTenure');

                const a = parseInt(age.value);
                const s = parseFloat(sum.value);
                const t = parseInt(tenure.value);

                if (isNaN(a) || a < 18 || a > 100) showError('gciAge', 'Age must be 18–100');
                else data.age = a;

                if (isNaN(s) || s <= 0) showError('gciSumInsured', 'Enter a valid sum insured');
                else data.loanAmount = s;

                if (isNaN(t) || t < 1 || t > 5) showError('gciPolicyTenure', 'Select 1–5 years');
                else data.loanTenure = t;
                break;
            }
            case 'GPA': {
                const age = document.getElementById('gpaAge');
                const sum = document.getElementById('gpaSumInsured');
                const tenure = document.getElementById('gpaPolicyTenure');
                clearError('gpaAge');
                clearError('gpaSumInsured');
                clearError('gpaPolicyTenure');

                const a = parseInt(age.value);
                const s = parseFloat(sum.value);
                const t = parseInt(tenure.value);

                if (isNaN(a) || a < 18 || a > 100) showError('gpaAge', 'Age must be 18–100');
                else data.age = a;

                if (isNaN(s) || s <= 0) showError('gpaSumInsured', 'Enter a valid sum insured');
                else data.loanAmount = s;

                if (isNaN(t) || t < 1 || t > 5) showError('gpaPolicyTenure', 'Select 1–5 years');
                else data.loanTenure = t;
                break;
            }
            case 'EMI_PROTECT': {
                const age = document.getElementById('emiAge');
                const emi = document.getElementById('emiEMIAmount');
                const tenure = document.getElementById('emiLoanTenure');
                clearError('emiAge');
                clearError('emiEMIAmount');
                clearError('emiLoanTenure');

                const a = parseInt(age.value);
                const e = parseFloat(emi.value);
                const t = parseInt(tenure.value);

                if (isNaN(a) || a < 18 || a > 100) showError('emiAge', 'Age must be 18–100');
                else data.age = a;

                if (isNaN(e) || e <= 0) showError('emiEMIAmount', 'Enter a valid EMI amount');
                else data.emiAmount = e;

                if (isNaN(t) || t < 1 || t > 5) showError('emiLoanTenure', 'Select 1–5 years');
                else data.loanTenure = t;
                break;
            }
            case 'CANCER_SECURE': {
                const age = document.getElementById('cancerAge');
                const term = document.getElementById('cancerPolicyTerm');
                clearError('cancerAge');
                clearError('cancerPolicyTerm');

                const a = parseInt(age.value);
                const t = parseInt(term.value);

                if (isNaN(a) || a < 18 || a > 60) showError('cancerAge', 'Age must be 18–60');
                else data.age = a;

                if (isNaN(t) || t < 1 || t > 5) showError('cancerPolicyTerm', 'Select 1–5 years');
                else data.policyTerm = t;
                break;
            }
            default:
                valid = false;
        }

        return valid ? data : null;
    }

    // ---------- Calculate a single product ----------
    async calculateProduct(product) {
        const data = this.buildRequest(product);
        if (!data) return;

        try {
            this.showLoading(true);
            this.hideError();
            const response = await this.callAPI(data);
            this.updateSummary(product, response, data);
        } catch (err) {
            this.showError(err.message);
        } finally {
            this.showLoading(false);
        }
    }

    // ---------- Calculate all selected products ----------
    async calculateAllSelected() {
        const checked = document.querySelectorAll('input[name="products"]:checked');
        if (checked.length === 0) {
            this.showError('Please select at least one product.');
            return;
        }

        // Build combined request
        const combined = { products: [], age: null, loanAmount: null, loanTenure: null, emiAmount: null, policyTerm: null };
        let valid = true;

        // For simplicity, we'll just loop and call individual calculations
        // But to avoid multiple API calls, we can combine, but we'll keep it simple:
        for (const cb of checked) {
            await this.calculateProduct(cb.value);
        }
        // This will trigger sequential calls; you can optimize but it works.
    }

    // ---------- API call ----------
    async callAPI(data) {
        const resp = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || `Server error (${resp.status})`);
        }
        return await resp.json();
    }

    // ---------- Update summary panel ----------
    updateSummary(product, response, request) {
        // Show results container
        this.resultsContainer.style.display = 'block';

        // Update premium card
        const cardId = this.getCardId(product);
        const premiumEl = document.getElementById(cardId);
        const cardContainer = document.getElementById(this.getCardContainerId(product));
        if (premiumEl && cardContainer) {
            let premium = 0;
            switch (product) {
                case 'GCI': premium = response.gciPremium || 0; break;
                case 'GPA': premium = response.gpaPremium || 0; break;
                case 'EMI_PROTECT': premium = response.emiProtectPremium || 0; break;
                case 'CANCER_SECURE': premium = response.cancerSecurePremium || 0; break;
            }
            this.premiums[product] = premium;
            premiumEl.textContent = this.formatCurrency(premium);
            cardContainer.style.display = 'block';
        }

        // Update breakdown
        this.addBreakdown(product, response, request);

        // Update total
        this.updateTotal();
    }

    getCardId(product) {
        const map = {
            'GCI': 'gciPremium',
            'GPA': 'gpaPremium',
            'EMI_PROTECT': 'emiProtectPremium',
            'CANCER_SECURE': 'cancerSecurePremium'
        };
        return map[product];
    }

    getCardContainerId(product) {
        const map = {
            'GCI': 'gciCard',
            'GPA': 'gpaCard',
            'EMI_PROTECT': 'emiCard',
            'CANCER_SECURE': 'cancerCard'
        };
        return map[product];
    }

    // ---------- Add breakdown card ----------
    addBreakdown(product, response, request) {
        let details = null;
        switch (product) {
            case 'GCI':
                details = this.buildGCIDetails(request);
                break;
            case 'GPA':
                details = this.buildGPADetails(request);
                break;
            case 'EMI_PROTECT':
                details = this.buildEMIDetails(request);
                break;
            case 'CANCER_SECURE':
                details = this.buildCancerDetails(request);
                break;
        }
        if (!details) return;

        // Remove existing breakdown card for this product if any
        const existing = this.breakupContainer.querySelector(`[data-product="${product}"]`);
        if (existing) existing.remove();

        const card = this.createBreakupCard(product, details);
        card.dataset.product = product;
        this.breakupContainer.appendChild(card);
    }

    // ---------- Breakdown detail builders (reuse your existing logic) ----------
    buildGCIDetails(request) {
        const GCI_RATE = { 1: 3.00, 2: 5.58, 3: 8.16, 4: 10.70, 5: 13.31 };
        const sumInsured = Math.min(request.loanAmount, 5000000);
        const rate = GCI_RATE[request.loanTenure];
        const premium = (sumInsured / 1000) * rate;
        return {
            'Sum Insured': this.formatCurrency(sumInsured),
            'Rate per ₹1000': `₹${rate.toFixed(2)}`,
            'Calculation': `(${this.formatNumber(sumInsured)} / 1000) × ${rate.toFixed(2)}`,
            'Premium': this.formatCurrency(premium)
        };
    }

    buildGPADetails(request) {
        const GPA_RATE = { 1: 32.0, 2: 59.0, 3: 86.0, 4: 113.0, 5: 140.0 };
        const sumInsured = Math.min(request.loanAmount, 100000000);
        const rate = GPA_RATE[request.loanTenure];
        const premium = (sumInsured / 100000) * rate;
        return {
            'Sum Insured': this.formatCurrency(sumInsured),
            'Rate per ₹1,00,000': `₹${rate.toFixed(2)}`,
            'Calculation': `(${this.formatNumber(sumInsured)} / 1,00,000) × ${rate.toFixed(2)}`,
            'Premium': this.formatCurrency(premium)
        };
    }

    buildEMIDetails(request) {
        const EMI_RATE = { 1: 108, 2: 202, 3: 294, 4: 385, 5: 479 };
        const sumInsured = Math.min(request.emiAmount, 500000);
        const rate = EMI_RATE[request.loanTenure];
        const premium = (sumInsured / 1000) * rate;
        return {
            'EMI Amount': this.formatCurrency(request.emiAmount),
            'Sum Insured (max ₹5L)': this.formatCurrency(sumInsured),
            'Rate per ₹1000': `₹${rate}`,
            'Calculation': `(${this.formatNumber(sumInsured)} / 1000) × ${rate}`,
            'Premium': this.formatCurrency(premium)
        };
    }

    buildCancerDetails(request) {
        const CANCER_RATES = {
            "18-25": { 1: 0.26432, 2: 0.550666666666667, 3: 0.852746666666667, 4: 1.14853333333333, 5: 1.46634666666667 },
            "26-30": { 1: 0.34928, 2: 0.723733333333333, 3: 1.10448, 4: 1.48522666666667, 5: 1.90058666666667 },
            "31-35": { 1: 0.446826666666667, 2: 0.93456, 3: 1.43173333333333, 4: 1.91946666666667, 5: 2.4544 },
            "36-40": { 1: 0.733173333333333, 2: 1.52298666666667, 3: 2.35370666666667, 4: 3.15925333333333, 5: 4.04032 },
            "41-45": { 1: 1.17370666666667, 2: 2.44810666666667, 3: 3.75712, 4: 5.04725333333333, 5: 6.46010666666667 },
            "46-50": { 1: 1.70549333333333, 2: 3.54944, 3: 5.46576, 4: 7.33488, 5: 9.3928 },
            "51-55": { 1: 2.51733333333333, 2: 5.2392, 3: 8.0712, 4: 10.8402666666667, 5: 13.8610666666667 },
            "56-60": { 1: 7.86981333333333, 2: 16.3752533333333, 3: 25.2016533333333, 4: 33.8581333333333, 5: 43.3044266666667 }
        };
        const age = request.age;
        const ageBand = (() => {
            if (age >= 18 && age <= 25) return "18-25";
            if (age >= 26 && age <= 30) return "26-30";
            if (age >= 31 && age <= 35) return "31-35";
            if (age >= 36 && age <= 40) return "36-40";
            if (age >= 41 && age <= 45) return "41-45";
            if (age >= 46 && age <= 50) return "46-50";
            if (age >= 51 && age <= 55) return "51-55";
            return "56-60";
        })();
        const sumInsured = 5000000;
        const rate = CANCER_RATES[ageBand][request.policyTerm];
        const premiumInclGst = (sumInsured / 1000) * rate;
        const premiumExclGst = premiumInclGst / 1.18;
        return {
            'Sum Insured': this.formatCurrency(sumInsured),
            'Age Band': ageBand,
            'Policy Term (Years)': request.policyTerm.toString(),
            'Rate per ₹1000': `₹${rate.toFixed(6)}`,
            'Calculation': `(${this.formatNumber(sumInsured)} / 1000) × ${rate.toFixed(6)}`,
            'Premium (Incl. GST)': this.formatCurrency(premiumInclGst),
            'Premium (Excl. GST)': this.formatCurrency(premiumExclGst)
        };
    }

    // ---------- Create a breakup card element ----------
    createBreakupCard(productName, details) {
        const card = document.createElement('div');
        card.className = 'breakup-card';

        const header = document.createElement('div');
        header.className = 'breakup-header';
        header.innerHTML = `<h4><i class="fas fa-calculator"></i> ${productName} Calculation Breakdown</h4>`;
        card.appendChild(header);

        const body = document.createElement('div');
        body.className = 'breakup-body';

        Object.entries(details).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'breakup-row';
            const label = document.createElement('span');
            label.className = 'breakup-label';
            label.textContent = key + ':';
            const val = document.createElement('span');
            val.className = key === 'Premium' || key.includes('Premium') ? 'breakup-value highlight-value' : 'breakup-value';
            val.textContent = value;
            row.appendChild(label);
            row.appendChild(val);
            body.appendChild(row);
        });

        card.appendChild(body);
        return card;
    }

    // ---------- Update total premium ----------
    updateTotal() {
        const total = Object.values(this.premiums).reduce((sum, p) => sum + p, 0);
        document.getElementById('totalPremium').textContent = this.formatCurrency(total);
        // Show total card if any premium > 0
        document.getElementById('totalCard').style.display = 'block';
    }

    // ---------- Helpers ----------
    formatNumber(num) {
        return parseFloat(num).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    formatCurrency(amount) {
        if (amount == null) return '₹0.00';
        return `₹${parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    showFieldError(input, msg) {
        input.classList.add('error');
        let err = input.parentNode.querySelector('.field-error');
        if (!err) {
            err = document.createElement('div');
            err.className = 'field-error';
            input.parentNode.appendChild(err);
        }
        err.textContent = msg;
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const err = input.parentNode.querySelector('.field-error');
        if (err) err.remove();
    }

    showLoading(show) {
        this.loadingEl.style.display = show ? 'block' : 'none';
    }

    showError(msg) {
        this.errorText.textContent = msg;
        this.errorEl.style.display = 'flex';
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        this.errorEl.style.display = 'none';
    }

    resetForm() {
        // Reset all fields in sections
        document.querySelectorAll('.product-section input, .product-section select').forEach(el => {
            if (el.tagName === 'INPUT') el.value = '';
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            this.clearFieldError(el);
        });
        // Reset premium cards
        document.querySelectorAll('.premium-card').forEach(card => card.style.display = 'none');
        document.getElementById('totalCard').style.display = 'none';
        // Reset breakup
        this.breakupContainer.innerHTML = '';
        // Hide results
        this.resultsContainer.style.display = 'none';
        // Reset stored premiums
        this.premiums = { GCI: 0, GPA: 0, EMI_PROTECT: 0, CANCER_SECURE: 0 };
        // Uncheck product checkboxes (optional)
        // document.querySelectorAll('input[name="products"]').forEach(cb => cb.checked = false);
        // Hide sections
        document.querySelectorAll('.product-section').forEach(s => s.style.display = 'none');
        this.hideError();
    }
}

// Global reset function
function resetAdityabirlaForm() {
    if (window.adityabirlaCalculator) {
        window.adityabirlaCalculator.resetForm();
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.adityabirlaCalculator = new AdityabirlaCalculator();
});