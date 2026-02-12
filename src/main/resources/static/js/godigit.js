class GoDigitCalculator {
    constructor() {
        // Same trick as before: if served from IDE (63342), point to Spring Boot (8080)
        const p = window.location.port;
        if (p && p !== '8080' && (p === '63342' || p === '63343')) {
            this.apiUrl = 'http://localhost:8080/api/godigit/calculate';
        } else {
            this.apiUrl = '/api/godigit/calculate';
        }

        this.form = document.getElementById('godigitForm');
        this.results = document.getElementById('results');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.onSubmit(e));

        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach((el) => {
            el.addEventListener('blur', () => {
                el.dataset.touched = 'true';
                this.validateField(el);
            });
            el.addEventListener('input', () => {
                this.clearFieldError(el);
            });
        });

        const covs = this.form.querySelectorAll('input[name="coverages"]');
        covs.forEach((c) => c.addEventListener('change', () => this.onCoverageChange()));
        this.onCoverageChange();
    }

    onCoverageChange() {
        const emiSelected = document.getElementById('covEMI').checked;
        const emiInput = document.getElementById('emiAmount');
        const emiLabel = emiInput.closest('.form-group').querySelector('label');
        const emiHelp = document.getElementById('emiHelpText');

        if (emiSelected) {
            emiInput.setAttribute('required', 'required');
            emiLabel.innerHTML = 'EMI Amount <span class="required">*</span>';
            if (emiHelp) {
                emiHelp.textContent = 'Mandatory when EMI cover is selected (18-50: max ₹50,000; 51-60: max ₹25,000)';
                emiHelp.style.color = '#dc2626';
            }
        } else {
            emiInput.removeAttribute('required');
            emiLabel.textContent = 'EMI Amount';
            if (emiHelp) {
                emiHelp.textContent = 'Mandatory when EMI cover is selected';
                emiHelp.style.color = '';
            }
            this.clearFieldError(emiInput);
        }
    }

    selectedCoverages() {
        return Array.from(this.form.querySelectorAll('input[name="coverages"]:checked')).map((x) => x.value);
    }

    validate() {
        const covs = this.selectedCoverages();
        if (covs.length === 0) {
            this.showError('Please select at least one cover (PA/CI/EMI).');
            return false;
        }

        const required = this.form.querySelectorAll('input[required], select[required]');
        let ok = true;
        required.forEach((el) => {
            if (!this.validateField(el)) ok = false;
        });

        const age = parseInt(document.getElementById('age').value);
        if (isNaN(age) || age < 18 || age > 60) {
            this.showFieldError(document.getElementById('age'), 'Age must be between 18 and 60');
            ok = false;
        }

        const year = parseInt(document.getElementById('policyYear').value);
        if (isNaN(year) || year < 1 || year > 3) {
            this.showFieldError(document.getElementById('policyYear'), 'Policy year must be 1, 2, or 3');
            ok = false;
        }

        const loan = parseFloat(document.getElementById('loanAmount').value);
        if (isNaN(loan) || loan <= 0) {
            this.showFieldError(document.getElementById('loanAmount'), 'Loan amount must be greater than 0');
            ok = false;
        }

        const emiSelected = covs.includes('EMI');
        const emi = parseFloat(document.getElementById('emiAmount').value || '0');
        if (emiSelected && (!emi || emi <= 0)) {
            this.showFieldError(document.getElementById('emiAmount'), 'EMI amount is mandatory when EMI cover is selected');
            ok = false;
        }

        if (!ok) this.showError('Please fix the errors and try again.');
        return ok;
    }

    validateField(field) {
        const v = (field.value || '').toString().trim();
        if (field.hasAttribute('required') && !v && field.dataset.touched === 'true') {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        return true;
    }

    payload() {
        const coverages = this.selectedCoverages();
        return {
            coverages,
            age: parseInt(document.getElementById('age').value),
            policyYear: parseInt(document.getElementById('policyYear').value),
            loanAmount: parseFloat(document.getElementById('loanAmount').value),
            emiAmount: parseFloat(document.getElementById('emiAmount').value || '0')
        };
    }

    async onSubmit(e) {
        e.preventDefault();
        this.hideError();
        if (!this.validate()) return;

        const body = this.payload();
        try {
            this.showLoading(true);
            const res = await this.callApi(body);
            this.render(res, body);
        } catch (err) {
            this.showError(err.message || 'Failed to calculate premium');
        } finally {
            this.showLoading(false);
        }
    }

    async callApi(body) {
        const resp = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!resp.ok) {
            if (resp.status === 404) throw new Error('API not found. Ensure Spring Boot is running on port 8080.');
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.message || `HTTP ${resp.status}`);
        }
        return resp.json();
    }

    render(data, form) {
        const paCard = document.getElementById('paCard');
        const ciCard = document.getElementById('ciCard');
        const emiCard = document.getElementById('emiCard');

        if (data.paPremium > 0) {
            paCard.style.display = 'block';
            document.getElementById('paPremium').textContent = this.money(data.paPremium);
            document.getElementById('paPremiumInclGst').textContent = `Incl. GST: ${this.money(data.paPremiumInclGst)}`;
        } else paCard.style.display = 'none';

        if (data.ciPremium > 0) {
            ciCard.style.display = 'block';
            document.getElementById('ciPremium').textContent = this.money(data.ciPremium);
            document.getElementById('ciPremiumInclGst').textContent = `Incl. GST: ${this.money(data.ciPremiumInclGst)}`;
        } else ciCard.style.display = 'none';

        if (data.emiPremium > 0) {
            emiCard.style.display = 'block';
            document.getElementById('emiPremium').textContent = this.money(data.emiPremium);
            document.getElementById('emiPremiumInclGst').textContent = `Incl. GST: ${this.money(data.emiPremiumInclGst)}`;
        } else emiCard.style.display = 'none';

        document.getElementById('totalPremium').textContent = this.money(data.totalPremium || 0);
        document.getElementById('totalPremiumInclGst').textContent = `Incl. GST: ${this.money(data.totalPremiumInclGst || 0)}`;

        this.renderBreakup(data, form);
        this.results.style.display = 'block';
        this.results.scrollIntoView({ behavior: 'smooth' });
    }

    renderBreakup(data, form) {
        const box = document.getElementById('breakup');
        box.innerHTML = '';

        const year = form.policyYear;
        const loan = form.loanAmount;
        const age = form.age;
        const emi = form.emiAmount;

        const paPct = { 1: 0.09, 2: 0.18, 3: 0.27 }[year];
        const emiPct = { 1: 0.05, 2: 0.10, 3: 0.15 }[year];
        const ciPct = this.ciPct(age, year);

        if (data.paPremium > 0) {
            const si = Math.min(loan, 50000000);
            box.appendChild(this.breakCard('PA', {
                'Sum Insured (min(loan, ₹5 Cr))': this.money(si),
                'Rate': `${paPct.toFixed(3)}%`,
                'Premium': this.money(data.paPremium)
            }));
        }

        if (data.ciPremium > 0) {
            const si = Math.min(loan, 10000000);
            box.appendChild(this.breakCard('CI', {
                'Age Band': this.ciBand(age),
                'Sum Insured (min(loan, ₹1 Cr))': this.money(si),
                'Rate': `${ciPct.toFixed(3)}%`,
                'Premium': this.money(data.ciPremium)
            }));
        }

        if (data.emiPremium > 0) {
            const cap = age <= 50 ? 50000 : 25000;
            const si = Math.min(emi, cap);
            box.appendChild(this.breakCard('EMI', {
                'Single EMI Cap': this.money(cap),
                'Sum Insured (min(EMI, cap))': this.money(si),
                'Rate': `${emiPct.toFixed(3)}%`,
                'Premium': this.money(data.emiPremium)
            }));
        }
    }

    ciBand(age) {
        if (age <= 25) return '18-25';
        if (age <= 30) return '26-30';
        if (age <= 35) return '31-35';
        if (age <= 40) return '36-40';
        if (age <= 45) return '41-45';
        if (age <= 50) return '46-50';
        if (age <= 55) return '51-55';
        return '56-60';
    }

    ciPct(age, year) {
        const table = {
            '18-25': { 1: 0.220, 2: 0.440, 3: 0.660 },
            '26-30': { 1: 0.250, 2: 0.500, 3: 0.750 },
            '31-35': { 1: 0.340, 2: 0.680, 3: 1.020 },
            '36-40': { 1: 0.400, 2: 0.800, 3: 1.200 },
            '41-45': { 1: 0.820, 2: 1.640, 3: 2.460 },
            '46-50': { 1: 1.660, 2: 3.320, 3: 4.980 },
            '51-55': { 1: 2.680, 2: 5.360, 3: 8.040 },
            '56-60': { 1: 3.610, 2: 7.220, 3: 10.830 }
        };
        return table[this.ciBand(age)][year];
    }

    breakCard(title, rows) {
        const card = document.createElement('div');
        card.className = 'breakup-card';
        const head = document.createElement('div');
        head.className = 'breakup-header';
        head.innerHTML = `<h4><i class="fas fa-list"></i> ${title}</h4>`;
        const body = document.createElement('div');
        body.className = 'breakup-body';
        Object.entries(rows).forEach(([k, v]) => {
            const r = document.createElement('div');
            r.className = 'breakup-row';
            r.innerHTML = `<span class="breakup-label">${k}</span><span class="breakup-value">${v}</span>`;
            body.appendChild(r);
        });
        card.appendChild(head);
        card.appendChild(body);
        return card;
    }

    money(x) {
        const n = Number(x || 0);
        return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
    }

    showError(msg) {
        this.errorText.textContent = msg;
        this.errorMessage.style.display = 'flex';
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showFieldError(field, msg) {
        field.style.borderColor = '#dc2626';
        field.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
        let err = field.parentNode.querySelector('.field-error');
        if (!err) {
            err = document.createElement('div');
            err.className = 'field-error';
            field.parentNode.appendChild(err);
        }
        err.textContent = msg;
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        const err = field.parentNode.querySelector('.field-error');
        if (err) err.remove();
    }

    reset() {
        this.form.reset();
        document.getElementById('covPA').checked = true;
        document.getElementById('covCI').checked = true;
        document.getElementById('covEMI').checked = true;
        this.onCoverageChange();
        this.results.style.display = 'none';
        document.getElementById('breakup').innerHTML = '';
        // reset premium subs
        const ids = ['paPremiumInclGst', 'ciPremiumInclGst', 'emiPremiumInclGst', 'totalPremiumInclGst'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Incl. GST: ₹0.00';
        });
        this.hideError();
    }
}

function resetGoDigitForm() {
    if (window.goDigit) window.goDigit.reset();
}

document.addEventListener('DOMContentLoaded', () => {
    window.goDigit = new GoDigitCalculator();
});


