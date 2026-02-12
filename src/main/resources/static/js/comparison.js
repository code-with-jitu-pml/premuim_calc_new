// Premium Calculator Comparison JavaScript - New 3-Column Layout
class PremiumComparison {
    constructor() {
        // Determine API URLs based on current host
        const currentPort = window.location.port;
        const baseUrl = (currentPort && currentPort !== '8080' && (currentPort === '63342' || currentPort === '63343')) 
            ? 'http://localhost:8080' 
            : '';
        
        this.apiUrls = {
            adityabirla: `${baseUrl}/api/calculate`,
            godigit: `${baseUrl}/api/godigit/calculate`,
            godigitlife: `${baseUrl}/api/godigitlife/calculate`,
            bajajlife: `${baseUrl}/api/bajajlife/calculate`
        };
        
        this.selectedItems = new Map(); // Map<itemId, itemData>
        this.currentSection = 'life';
        this.memberCount = 1;
        this.activeMemberId = 'member-1';
        this.pendingGeneralInsuranceProduct = null; // Store pending General Insurance product selection (legacy, for modal)
        this.selectedGeneralInsuranceProduct = null; // Store selected General Insurance product from dropdown
        // Global member cap: Personal Information supports Member 1..3 only
        // (The Add Member button is only available in Life/General sections, but it adds Personal Info blocks.)
        this.maxMembers = {
            life: 3,
            general: 3,
            mayaa: 10,
            property: 10
        };
        this.loadingSpinner = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        this.initializeEventListeners();
        this.loadProductsForSection('life');
        this.updateAddMemberButtonVisibility();
        // Initialize: Show life insurance fields since we start with 'life' section
        this.toggleLifeInsuranceFields(true);
        // Initialize member selection checkboxes (show for life section)
        this.toggleMemberSelectionCheckboxes(true);
        // Initialize General Insurance dropdown (even though it's hidden initially)
        this.initializeGeneralInsuranceDropdown();
    }

    initializeEventListeners() {
        // Sidebar navigation - use event delegation for better reliability
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.addEventListener('click', (e) => {
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    e.preventDefault();
                    e.stopPropagation();
                    const section = navItem.dataset.section;
                    if (section) {
                        this.switchSection(section);
                    }
                }
            });
        }
        
        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.handleClearClick();
            });
        }
        
        // Proceed button
        const proceedBtn = document.getElementById('proceedBtn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                this.handleProceedClick();
            });
        }
        
        // Print PDF button - use event delegation since it's in a modal
        document.addEventListener('click', (e) => {
            const printBtn = e.target.closest('#nomineePrintBtn');
            if (printBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Print PDF button clicked');
                try {
                    // Hide nominee modal first
                    this.hideNomineeModal();
                    // Then generate and show PDF
                    this.generatePDF();
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    this.showError('Error generating PDF. Please check the console for details.');
                }
            }
        });
        
        // Modal close buttons - use event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            // Close confirmation modal
            if (e.target.id === 'closeModalBtn' || e.target.id === 'modalCancelBtn') {
                this.hideConfirmationModal();
            }
            
            // Close coming soon modal
            if (e.target.id === 'closeComingSoonBtn' || e.target.id === 'comingSoonOkBtn') {
                this.hideComingSoonModal();
            }
            
            // Nominee modal buttons
            if (e.target.id === 'nomineeBackBtn' || e.target.closest('#nomineeBackBtn')) {
                this.hideNomineeModal();
            }
            
            // PDF Viewer modal buttons
            if (e.target.id === 'closePdfViewerBtn' || e.target.id === 'pdfViewerBackBtn') {
                this.hidePdfViewer();
            }
            if (e.target.id === 'pdfViewerDownloadBtn') {
                this.downloadPDF();
            }
            
            // Close modal on overlay click
            if (e.target.classList.contains('modal-overlay')) {
                const confirmationModal = document.getElementById('confirmationModal');
                const comingSoonModal = document.getElementById('comingSoonModal');
                const nomineeModal = document.getElementById('nomineeModal');
                
                if (confirmationModal && confirmationModal.style.display === 'flex') {
                    this.hideConfirmationModal();
                }
                if (comingSoonModal && comingSoonModal.style.display === 'flex') {
                    this.hideComingSoonModal();
                }
                if (nomineeModal && nomineeModal.style.display === 'flex') {
                    this.hideNomineeModal();
                }
                const pdfViewerModal = document.getElementById('pdfViewerModal');
                if (pdfViewerModal && pdfViewerModal.style.display === 'flex') {
                    this.hidePdfViewer();
                }
            }
        });

        // Personal info inputs - trigger recalculation on change (using event delegation)
        document.getElementById('membersContainer').addEventListener('input', (e) => {
            if (e.target.classList.contains('member-input')) {
                const field = e.target.dataset.field;
                const memberId = e.target.dataset.member;
                
                // Validate age range (18-75)
                if (field === 'age' && memberId) {
                    const ageValue = parseInt(e.target.value);
                    if (e.target.value && (isNaN(ageValue) || ageValue < 18 || ageValue > 75)) {
                        e.target.setCustomValidity('Age must be between 18 and 75 years');
                        e.target.reportValidity();
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                
                // Update member label when name is entered
                if (field === 'name' && memberId) {
                    this.updateMemberLabel(memberId, e.target.value);
                }

                // Force uppercase for "Other loan type" input
                if (field === 'loanTypeOther') {
                    const current = e.target.value || '';
                    const upper = current.toUpperCase();
                    if (current !== upper) {
                        const start = e.target.selectionStart;
                        const end = e.target.selectionEnd;
                        e.target.value = upper;
                        if (typeof start === 'number' && typeof end === 'number') {
                            e.target.setSelectionRange(start, end);
                        }
                    }
                }
                
                // If General Insurance field changed and we're on General Insurance section, trigger General Insurance recalculation
                if (field && field.startsWith('general') && this.currentSection === 'general') {
                    console.log('General Insurance field changed (input):', field);
                    this.recalculateGeneralInsuranceIfReady();
                } else if (field && field.startsWith('property') && this.currentSection === 'property') {
                    // Property Insurance field changed - trigger recalculation
                    console.log('Property Insurance field changed (input):', field);
                    this.recalculateSelectedItems();
                } else if (field && !field.startsWith('general') && !field.startsWith('property')) {
                    this.recalculateSelectedItems();
                }
            }
        });
        
        document.getElementById('membersContainer').addEventListener('change', (e) => {
            if (e.target.classList.contains('member-input')) {
                const field = e.target.dataset.field;
                const memberId = e.target.dataset.member;
                const productType = e.target.dataset.productType;
                
                // Handle Life Type change
                if (field === 'lifeType') {
                    this.toggleSecondLifeAge(memberId, e.target.value);
                    // Reload life products if we're on the life section
                    if (this.currentSection === 'life') {
                        this.loadLifeProducts();
                    }
                }

                // Handle Loan Type change (show/hide "Specify Loan Type" when Other is selected)
                if (field === 'loanType' && memberId) {
                    this.toggleOtherLoanType(memberId, e.target.value);
                }
                
                // Handle Policy Tenure change for Life Insurance - filter products
                if (field === 'policyTenure' && this.currentSection === 'life') {
                    const selectedTenure = parseInt(e.target.value) || 0;
                    this.filterLifeInsuranceProducts(selectedTenure);
                }
                
                // If General Insurance field changed and we're on General Insurance section, trigger General Insurance recalculation
                if (field && field.startsWith('general') && this.currentSection === 'general') {
                    console.log('General Insurance field changed (change):', field);
                    
                    // Go Digit supports CI/PA/EMI only for policy tenure 1-3. Toggle provider option visibility accordingly.
                    if (field === 'generalPolicyTenure' && (productType === 'CI' || productType === 'PA' || productType === 'EMI_PROTECT')) {
                        this.updateGoDigitGeneralInsuranceVisibility(productType);
                    }
                    
                    this.recalculateGeneralInsuranceIfReady();
                } else if (field && field.startsWith('property') && this.currentSection === 'property') {
                    // Property Insurance field changed - trigger recalculation
                    console.log('Property Insurance field changed (change):', field);
                    this.recalculateSelectedItems();
                } else if (field && !field.startsWith('general') && !field.startsWith('property')) {
                    this.recalculateSelectedItems();
                }
            }
        });

        // Add Member button
        document.getElementById('addMemberBtn').addEventListener('click', () => {
            this.addNewMember();
        });
        
        // Update Add Member button visibility based on current section
        this.updateAddMemberButtonVisibility();
        
        // Allow clicking on member sections to make them active
        document.getElementById('membersContainer').addEventListener('click', (e) => {
            const memberSection = e.target.closest('.member-section');
            // Ignore clicks on action buttons (remove/collapse)
            if (memberSection && !e.target.closest('.remove-member-btn') && !e.target.closest('.collapse-member-btn')) {
                const memberId = memberSection.dataset.memberId;
                if (memberId) {
                    this.setActiveMember(memberId);
                }
            }
        });

        // Collapse/expand Personal Information member cards
        document.getElementById('membersContainer').addEventListener('click', (e) => {
            const collapseBtn = e.target.closest('.collapse-member-btn');
            if (!collapseBtn) return;
            const memberSection = collapseBtn.closest('.member-section');
            if (!memberSection) return;
            memberSection.classList.toggle('collapsed');
        });
        
        // Initialize first member's Life Type handler
        this.initializeMemberLifeType('member-1');

        // Initialize first member's "Other loan type" field visibility/required state
        this.toggleOtherLoanType('member-1', document.getElementById('member-1-loanType')?.value || '');
        
        // Initialize member labels to show names if already entered
        this.updateMemberLabels();
        
        // General Insurance Modal event listeners
        this.initializeGeneralInsuranceModal();
    }
    
    initializeGeneralInsuranceModal() {
        const modal = document.getElementById('generalInsuranceModal');
        const closeBtn = document.getElementById('closeGeneralInsuranceModalBtn');
        const cancelBtn = document.getElementById('cancelGeneralInsuranceBtn');
        const calculateBtn = document.getElementById('calculateGeneralInsuranceBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideGeneralInsuranceModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideGeneralInsuranceModal());
        }
        
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.handleGeneralInsuranceCalculate());
        }
        
        // Close modal on overlay click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.hideGeneralInsuranceModal();
                }
            });
        }
    }
    
    showGeneralInsuranceModal(productId, productItem) {
        const modal = document.getElementById('generalInsuranceModal');
        const modalTitle = document.getElementById('generalInsuranceModalTitle');
        const emiField = document.getElementById('generalInsuranceEmiField');
        const emiInput = document.getElementById('generalInsuranceEmiAmount');
        
        if (!modal) return;
        
        // Store pending product info
        const productType = productItem.dataset.productType || productItem.dataset.product || productItem.dataset.coverage;
        this.pendingGeneralInsuranceProduct = {
            productId: productId,
            productItem: productItem,
            provider: productItem.dataset.provider,
            product: productItem.dataset.product,
            coverage: productItem.dataset.coverage,
            productType: productType // CI, PA, or EMI_PROTECT
        };
        
        // Update modal title with product name
        const productName = productType === 'CI' ? 'CI (Critical Illness)' : 
                           productType === 'PA' ? 'PA (Personal Accident)' : 
                           'EMI Protect';
        if (modalTitle) {
            modalTitle.textContent = productName;
        }
        
        // Show/hide EMI field based on product
        const isEmiProduct = (productType === 'EMI_PROTECT');
        if (emiField) {
            emiField.style.display = isEmiProduct ? 'block' : 'none';
        }
        if (emiInput) {
            emiInput.required = isEmiProduct;
            if (!isEmiProduct) {
                emiInput.value = '';
            }
        }
        
        // Clear form
        document.getElementById('generalInsuranceSumInsured').value = '';
        document.getElementById('generalInsurancePolicyTenure').value = '';
        if (emiInput) emiInput.value = '';
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('generalInsuranceSumInsured').focus();
        }, 100);
    }
    
    hideGeneralInsuranceModal() {
        const modal = document.getElementById('generalInsuranceModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Uncheck the product if modal is cancelled
        if (this.pendingGeneralInsuranceProduct) {
            const input = this.pendingGeneralInsuranceProduct.productItem.querySelector('input[type="checkbox"]');
            if (input) {
                input.checked = false;
                this.pendingGeneralInsuranceProduct.productItem.classList.remove('checked');
            }
        }
        
        this.pendingGeneralInsuranceProduct = null;
    }
    
    getProductTypeFromId(productId) {
        // Extract product type from product ID
        // Examples: "general-ci" -> "CI", "general-pa" -> "PA", "general-emi-protect" -> "EMI_PROTECT"
        if (productId.includes('ci')) return 'CI';
        if (productId.includes('pa')) return 'PA';
        if (productId.includes('emi')) return 'EMI_PROTECT';
        return null;
    }
    
    async handleGeneralInsuranceCalculate() {
        if (!this.selectedGeneralInsuranceProduct) return;
        
        // Get product info at the start
        const productId = this.selectedGeneralInsuranceProduct.productId;
        const productType = this.selectedGeneralInsuranceProduct.productType;
        const provider = this.selectedGeneralInsuranceProduct.provider;
        
        // Get all members
        const allMembers = document.querySelectorAll('.member-section');
        const validMembers = [];
        
        allMembers.forEach(memberSection => {
            const memberId = memberSection.dataset.memberId;
            if (memberId) {
                // Respect member selection checkbox (same behaviour as Life / Mayaa)
                const selectCheckbox = document.getElementById(`${memberId}-select`);
                const isSelected = selectCheckbox ? selectCheckbox.checked : true; // default true if checkbox missing
                if (!isSelected) {
                    console.log(`Skipping ${memberId} for General Insurance - not selected`);
                    return;
                }

                const memberData = this.getMemberData(memberId);
                const { age, generalSumInsured, generalPolicyTenure, generalEmiAmount, loanAmount, loanTenure } = memberData;
                
                // Validation - Age must be between 18 and 75
                if (!age || age < 18 || age > 75) {
                    return; // Skip members without valid age (18-75)
                }
                
                if (!generalPolicyTenure || generalPolicyTenure < 1 || generalPolicyTenure > 5) {
                    return; // Skip members without valid policy tenure (allowed: 1-5 years)
                }
                
                const isEmiProduct = (productType === 'EMI_PROTECT');
                if (isEmiProduct) {
                    // EMI Protect: only needs EMI amount (sum insured is calculated by backend from EMI amount)
                    if (!generalEmiAmount || generalEmiAmount <= 0) {
                        return; // Skip members without EMI amount for EMI products
                    }
                } else {
                    // CI/PA: need sum insured
                    if (!generalSumInsured || generalSumInsured <= 0) {
                        return; // Skip members without sum insured
                    }
                }
                
                validMembers.push({ memberId, memberData });
            }
        });
        
        if (validMembers.length === 0) {
            const isEmiProduct = (productType === 'EMI_PROTECT');
            const errorMsg = isEmiProduct 
                ? 'Please select at least one member and enter Age (18-75), Policy Tenure, and EMI Amount for that member.'
                : 'Please select at least one member and enter Age (18-75), Sum Insured, and Policy Tenure for that member.';
            this.showError(errorMsg);
            return;
        }
        
        try {
            this.showLoading(true);
            this.hideError();
            
            const calculations = [];
            const errors = [];
            
            for (const { memberId, memberData } of validMembers) {
                const { age, generalSumInsured, generalPolicyTenure, generalEmiAmount, loanAmount, loanTenure } = memberData;
                
                try {
                    if (productType === 'CI') {
                        // CI: Calculate only for the selected provider
                        if (provider === 'godigit') {
                            // Go Digit CI calculation
                            try {
                                const goDigitPremiumData = await this.calculateGoDigit(age, generalSumInsured, generalPolicyTenure, 'CI', 0);
                                goDigitPremiumData.productName = `CI - Critical Illness - Go Digit (Member ${memberId.replace('member-', '')})`;
                                goDigitPremiumData.memberId = memberId;
                                goDigitPremiumData.baseProductId = productId;
                                goDigitPremiumData.sumInsured = generalSumInsured;
                                goDigitPremiumData.policyTenure = generalPolicyTenure;
                                goDigitPremiumData.provider = 'Go Digit';
                                const goDigitProductId = `${productId}-godigit-${memberId}`;
                                calculations.push({ memberProductId: goDigitProductId, premiumData: goDigitPremiumData });
                            } catch (error) {
                                console.error(`Error calculating Go Digit CI for ${memberId}:`, error);
                                errors.push(`${memberId} (Go Digit): ${error.message || 'Calculation failed'}`);
                            }
                        } else if (provider === 'adityabirla') {
                            // Aditya Birla GCI calculation
                            try {
                                // For CI/PA, user enters Sum Insured. Backend expects it in the "loanAmount" field.
                                const siAsLoanAmount = generalSumInsured;
                                if (!siAsLoanAmount || siAsLoanAmount <= 0) {
                                    errors.push(`${memberId} (Aditya Birla): Please enter Sum Insured for GCI calculation`);
                                } else if (!loanTenure || loanTenure <= 0) {
                                    errors.push(`${memberId} (Aditya Birla): Please enter Loan Tenure for GCI calculation`);
                                } else {
                                    const adityaBirlaPremiumData = await this.calculateAdityaBirla(age, siAsLoanAmount, loanTenure, 'GCI', 0);
                                    adityaBirlaPremiumData.productName = `CI - Critical Illness - Aditya Birla (Member ${memberId.replace('member-', '')})`;
                                    adityaBirlaPremiumData.memberId = memberId;
                                    adityaBirlaPremiumData.baseProductId = productId;
                                    adityaBirlaPremiumData.sumInsured = siAsLoanAmount; // Using sum insured as loanAmount for Aditya Birla
                                    adityaBirlaPremiumData.policyTenure = loanTenure; // Using loanTenure for Aditya Birla
                                    adityaBirlaPremiumData.provider = 'Aditya Birla';
                                    const adityaBirlaProductId = `${productId}-adityabirla-${memberId}`;
                                    calculations.push({ memberProductId: adityaBirlaProductId, premiumData: adityaBirlaPremiumData });
                                }
                            } catch (error) {
                                console.error(`Error calculating Aditya Birla GCI for ${memberId}:`, error);
                                errors.push(`${memberId} (Aditya Birla): ${error.message || 'Calculation failed'}`);
                            }
                        }
                    } else if (productType === 'PA') {
                        // PA: Calculate only for the selected provider
                        if (provider === 'godigit') {
                            // Go Digit PA calculation
                            const premiumData = await this.calculateGoDigit(age, generalSumInsured, generalPolicyTenure, 'PA', 0);
                            premiumData.productName = `PA - Personal Accident - Go Digit (Member ${memberId.replace('member-', '')})`;
                            premiumData.memberId = memberId;
                            premiumData.baseProductId = productId;
                            premiumData.sumInsured = generalSumInsured;
                            premiumData.policyTenure = generalPolicyTenure;
                            premiumData.provider = 'Go Digit';
                            const memberProductId = `${productId}-godigit-${memberId}`;
                            calculations.push({ memberProductId, premiumData });
                        } else if (provider === 'adityabirla') {
                            // Aditya Birla GPA calculation
                            try {
                                // For CI/PA, user enters Sum Insured. Backend expects it in the "loanAmount" field.
                                const siAsLoanAmount = generalSumInsured;
                                if (!siAsLoanAmount || siAsLoanAmount <= 0) {
                                    errors.push(`${memberId} (Aditya Birla): Please enter Sum Insured for GPA calculation`);
                                } else if (!loanTenure || loanTenure <= 0) {
                                    errors.push(`${memberId} (Aditya Birla): Please enter Loan Tenure for GPA calculation`);
                                } else {
                                    const premiumData = await this.calculateAdityaBirla(age, siAsLoanAmount, loanTenure, 'GPA', 0);
                                    premiumData.productName = `PA - Personal Accident - Aditya Birla (Member ${memberId.replace('member-', '')})`;
                                    premiumData.memberId = memberId;
                                    premiumData.baseProductId = productId;
                                    premiumData.sumInsured = siAsLoanAmount; // Using sum insured as loanAmount for Aditya Birla
                                    premiumData.policyTenure = loanTenure; // Using loanTenure for Aditya Birla
                                    premiumData.provider = 'Aditya Birla';
                                    const memberProductId = `${productId}-adityabirla-${memberId}`;
                                    calculations.push({ memberProductId, premiumData });
                                }
                            } catch (error) {
                                console.error(`Error calculating Aditya Birla GPA for ${memberId}:`, error);
                                errors.push(`${memberId} (Aditya Birla): ${error.message || 'Calculation failed'}`);
                            }
                        }
                    } else if (productType === 'EMI_PROTECT') {
                        // EMI Protect: Calculate only for the selected provider
                        // Note: Backend calculates sum insured from EMI amount, so we pass 0 for loanAmount
                        if (provider === 'adityabirla') {
                            // Aditya Birla EMI Protect calculation
                            const premiumData = await this.calculateAdityaBirla(age, 0, generalPolicyTenure, 'EMI_PROTECT', generalEmiAmount);
                            premiumData.productName = `EMI Protect - Aditya Birla (Member ${memberId.replace('member-', '')})`;
                            premiumData.memberId = memberId;
                            premiumData.baseProductId = productId;
                            // Sum insured is calculated by backend from EMI amount (min(emiAmount, 500000))
                            premiumData.sumInsured = Math.min(generalEmiAmount, 500000);
                            premiumData.policyTenure = generalPolicyTenure;
                            premiumData.provider = 'Aditya Birla';
                            const memberProductId = `${productId}-adityabirla-${memberId}`;
                            calculations.push({ memberProductId, premiumData });
                        } else if (provider === 'godigit') {
                            // Go Digit EMI calculation
                            try {
                                if (!generalEmiAmount || generalEmiAmount <= 0) {
                                    errors.push(`${memberId} (Go Digit): Please enter EMI Amount for EMI calculation`);
                                } else {
                                    const premiumData = await this.calculateGoDigit(age, 0, generalPolicyTenure, 'EMI', generalEmiAmount);
                                    premiumData.productName = `EMI Protect - Go Digit (Member ${memberId.replace('member-', '')})`;
                                    premiumData.memberId = memberId;
                                    premiumData.baseProductId = productId;
                                    // Sum insured is calculated by backend from EMI amount (age-based cap: 50k for <=50, 25k for >50)
                                    const singleCap = age <= 50 ? 50000 : 25000;
                                    premiumData.sumInsured = Math.min(generalEmiAmount, singleCap);
                                    premiumData.policyTenure = generalPolicyTenure;
                                    premiumData.provider = 'Go Digit';
                                    const memberProductId = `${productId}-godigit-${memberId}`;
                                    calculations.push({ memberProductId, premiumData });
                                }
                            } catch (error) {
                                console.error(`Error calculating Go Digit EMI for ${memberId}:`, error);
                                errors.push(`${memberId} (Go Digit): ${error.message || 'Calculation failed'}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error calculating for ${memberId}:`, error);
                    errors.push(`${memberId}: ${error.message || 'Calculation failed'}`);
                }
            }
            
            // Remove existing items for this specific provider and base product
            const itemsToRemove = [];
            this.selectedItems.forEach((item, itemId) => {
                // Check if this item belongs to the same provider and base product
                if (itemId.startsWith(productId) && itemId.includes(provider)) {
                    itemsToRemove.push(itemId);
                } else if (item.baseProductId === productId && item.provider === provider) {
                    itemsToRemove.push(itemId);
                }
            });
            
            itemsToRemove.forEach(itemId => {
                this.removeProduct(itemId);
            });
            
            // Add all new calculations
            calculations.forEach(({ memberProductId, premiumData }) => {
                this.selectedItems.set(memberProductId, premiumData);
            });
            
            // Update price display on provider checkboxes
            if (calculations.length > 0) {
                const providerProductId = this.selectedGeneralInsuranceProduct.providerProductId;
                const checkbox = document.querySelector(`input[data-product-id="${providerProductId}"]`);
                if (checkbox) {
                    const productItem = checkbox.closest('.product-item');
                    if (productItem) {
                        const priceSpan = productItem.querySelector('.product-price');
                        if (priceSpan) {
                            // Calculate total for all members for this provider
                            const providerTotal = calculations.reduce((sum, c) => sum + (c.premiumData.premiumInclGst || 0), 0);
                            const uniqueMembers = new Set(calculations.map(c => c.premiumData.memberId));
                            if (uniqueMembers.size > 1) {
                                priceSpan.textContent = `${uniqueMembers.size} members`;
                            } else {
                                priceSpan.textContent = this.formatCurrency(providerTotal);
                            }
                        }
                        productItem.classList.add('checked');
                    }
                }
            }
            
            // Update UI
            this.updateSelectedItemsDisplay();
            this.updateTotal();
            
            // Show errors only if there are errors AND no successful calculations
            if (errors.length > 0) {
                if (calculations.length === 0) {
                    // No successful calculations, show error
                    this.showError(`Calculation failed:\n${errors.join('\n')}`);
                } else {
                    // Some calculations succeeded, show warning but don't block UI
                    console.warn('Some calculations failed:', errors);
                    // Show a less intrusive message
                    setTimeout(() => {
                        this.showError(`Some calculations failed:\n${errors.join('\n')}`);
                    }, 500);
                }
            } else if (calculations.length > 0) {
                console.log(`Successfully calculated ${calculations.length} premium(s) for General Insurance`);
            }
            
        } catch (error) {
            console.error('Error in General Insurance calculation:', error);
            this.showError('Failed to calculate premiums. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }
    
    setActiveMember(memberId) {
        // Remove active class from all members
        document.querySelectorAll('.member-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to selected member
        const memberSection = document.querySelector(`[data-member-id="${memberId}"]`);
        if (memberSection) {
            memberSection.classList.add('active');
            this.activeMemberId = memberId;
            
            // Scroll to member if needed
            memberSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    initializeMemberLifeType(memberId) {
        const lifeTypeSelect = document.getElementById(`${memberId}-lifeType`);
        if (lifeTypeSelect) {
            this.toggleSecondLifeAge(memberId, lifeTypeSelect.value);
        }
    }
    
    toggleSecondLifeAge(memberId, lifeType) {
        const secondLifeAgeField = document.querySelector(`.member-second-life-age[data-member="${memberId}"]`);
        const secondLifeAgeInput = document.getElementById(`${memberId}-secondLifeAge`);
        
        if (lifeType === 'JOINT') {
            if (secondLifeAgeField) secondLifeAgeField.style.display = 'block';
            if (secondLifeAgeInput) secondLifeAgeInput.setAttribute('required', 'required');
        } else {
            if (secondLifeAgeField) secondLifeAgeField.style.display = 'none';
            if (secondLifeAgeInput) {
                secondLifeAgeInput.removeAttribute('required');
                secondLifeAgeInput.value = '';
            }
        }
    }
    
    addNewMember() {
        // Allow adding members for Life Insurance and General Insurance sections
        if (this.currentSection !== 'life' && this.currentSection !== 'general') {
            this.showError('You can only add members when Life Insurance or General Insurance section is active.');
            return;
        }
        
        // Check maximum member limit based on current section
        const maxMembers = this.getMaxMembersForSection();
        
        if (this.memberCount >= maxMembers) {
            this.showError(`Maximum ${maxMembers} member${maxMembers > 1 ? 's' : ''} allowed for ${this.getSectionDisplayName()}.`);
            return;
        }
        
        this.memberCount++;
        const memberId = `member-${this.memberCount}`;
        const membersContainer = document.getElementById('membersContainer');
        
        const memberHTML = `
            <div class="personal-info-section member-section" data-member-id="${memberId}">
                <div class="member-header">
                    <div class="member-header-left">
                        <label class="member-select-checkbox-label" for="${memberId}-select" style="display: none;">
                            <input type="checkbox" class="member-select-checkbox" id="${memberId}-select" data-member="${memberId}" checked>
                            <span class="checkbox-custom"></span>
                        </label>
                        <i class="fas fa-user-circle member-icon"></i>
                        <h3 class="section-title">Personal Information: <span class="member-label">Member ${this.memberCount}</span></h3>
                    </div>
                    <div class="member-header-actions">
                        <button class="collapse-member-btn" type="button" aria-label="Collapse/Expand member">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="remove-member-btn" onclick="window.premiumComparison.removeMember('${memberId}')">
                            <i class="fas fa-times"></i> Remove
                        </button>
                    </div>
                </div>
                
                <!-- Common Personal Information Fields -->
                <div class="personal-info-form common-fields">
                    <div class="form-row">
                        <div class="info-field">
                            <label for="${memberId}-name">
                                <i class="fas fa-user"></i> Name <span class="required">*</span>
                            </label>
                            <input type="text" class="member-input" data-field="name" data-member="${memberId}" id="${memberId}-name" placeholder="Enter full name" required>
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-age">
                                <i class="fas fa-birthday-cake"></i> Age <span class="required">*</span>
                            </label>
                            <input type="number" class="member-input" data-field="age" data-member="${memberId}" id="${memberId}-age" placeholder="Enter age (18-75)" min="18" max="75" required>
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-gender">
                                <i class="fas fa-venus-mars"></i> Gender <span class="required">*</span>
                            </label>
                            <select class="member-input" data-field="gender" data-member="${memberId}" id="${memberId}-gender" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-loanAmount">
                                <i class="fas fa-rupee-sign"></i> Loan Amount <span class="required">*</span>
                            </label>
                            <input type="number" class="member-input" data-field="loanAmount" data-member="${memberId}" id="${memberId}-loanAmount" placeholder="Enter loan amount" min="0" step="0.01" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="info-field">
                            <label for="${memberId}-loanType">
                                <i class="fas fa-file-invoice-dollar"></i> Type of Loan <span class="required">*</span>
                            </label>
                            <select class="member-input" data-field="loanType" data-member="${memberId}" id="${memberId}-loanType" required>
                                <option value="">Select Loan Type</option>
                                <option value="Property Loan" selected>Property Loan</option>
                                <option value="Home Loan">Home Loan</option>
                                <option value="Personal Loan">Personal Loan</option>
                                <option value="Car Loan">Car Loan</option>
                                <option value="Education Loan">Education Loan</option>
                                <option value="Business Loan">Business Loan</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="info-field full-width" id="${memberId}-loanTypeOtherField" style="display: none;">
                            <label for="${memberId}-loanTypeOther">
                                <i class="fas fa-pen"></i> Specify Loan Type <span class="required">*</span>
                            </label>
                            <input type="text" class="member-input uppercase-input" data-field="loanTypeOther" data-member="${memberId}" id="${memberId}-loanTypeOther" placeholder="Enter loan type" autocomplete="off">
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-loanTenure">
                                <i class="fas fa-calendar-alt"></i> Loan Tenure (Years) <span class="required">*</span>
                            </label>
                            <input type="number" class="member-input" data-field="loanTenure" data-member="${memberId}" id="${memberId}-loanTenure" placeholder="Enter loan tenure" min="1" max="30" required>
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-email">
                                <i class="fas fa-envelope"></i> Email <span class="required">*</span>
                            </label>
                            <input type="email" class="member-input" data-field="email" data-member="${memberId}" id="${memberId}-email" placeholder="Enter email address" required>
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-mobile">
                                <i class="fas fa-phone"></i> Mobile <span class="required">*</span>
                            </label>
                            <input type="tel" class="member-input" data-field="mobile" data-member="${memberId}" id="${memberId}-mobile" placeholder="Enter mobile number" pattern="[0-9]{10}" maxlength="10" required>
                        </div>
                    </div>
                </div>

                <!-- Life Insurance Specific Fields -->
                <div class="life-insurance-fields" id="lifeInsuranceFields-${memberId}">
                    <div class="life-insurance-header">
                        <i class="fas fa-heart"></i>
                        <h4>Life Insurance Details</h4>
                    </div>
                    <div class="form-row">
                        <div class="info-field">
                            <label for="${memberId}-sumInsured">
                                <i class="fas fa-shield-alt"></i> Sum Insured <span class="required">*</span>
                            </label>
                            <input type="number" class="member-input" data-field="sumInsured" data-member="${memberId}" id="${memberId}-sumInsured" placeholder="Enter sum insured" min="0" step="1000">
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-policyTenure">
                                <i class="fas fa-calendar-check"></i> Policy Tenure <span class="required">*</span>
                            </label>
                            <select class="member-input" data-field="policyTenure" data-member="${memberId}" id="${memberId}-policyTenure">
                                <option value="">Select Tenure</option>
                                <option value="1">1 Year</option>
                                <option value="2">2 Years</option>
                                <option value="3">3 Years</option>
                                <option value="4">4 Years</option>
                                <option value="5">5 Years</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- General Insurance Specific Fields -->
                <div class="general-insurance-fields" id="generalInsuranceFields-${memberId}" style="display: none;">
                    <!-- CI (Critical Illness) Fields -->
                    <div class="general-insurance-product-section" id="${memberId}-ciFields" style="display: none;">
                        <div class="general-insurance-header">
                            <i class="fas fa-heartbeat"></i>
                            <h4>CI (Critical Illness) Details</h4>
                        </div>
                        <div class="form-row">
                            <div class="info-field">
                                <label for="${memberId}-ciSumInsured">
                                    <i class="fas fa-shield-alt"></i> Sum Insured <span class="required">*</span>
                                </label>
                                <input type="number" class="member-input" data-field="generalSumInsured" data-member="${memberId}" data-product-type="CI" id="${memberId}-ciSumInsured" placeholder="Enter sum insured" min="0" step="1000">
                            </div>
                            <div class="info-field">
                                <label for="${memberId}-ciPolicyTenure">
                                    <i class="fas fa-calendar-check"></i> Policy Tenure <span class="required">*</span>
                                </label>
                                <select class="member-input" data-field="generalPolicyTenure" data-member="${memberId}" data-product-type="CI" id="${memberId}-ciPolicyTenure">
                                    <option value="">Select Tenure</option>
                                    <option value="1">1 Year</option>
                                    <option value="2">2 Years</option>
                                    <option value="3">3 Years</option>
                                    <option value="4">4 Years</option>
                                    <option value="5">5 Years</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- PA (Personal Accident) Fields -->
                    <div class="general-insurance-product-section" id="${memberId}-paFields" style="display: none;">
                        <div class="general-insurance-header">
                            <i class="fas fa-user-shield"></i>
                            <h4>PA (Personal Accident) Details</h4>
                        </div>
                        <div class="form-row">
                            <div class="info-field">
                                <label for="${memberId}-paSumInsured">
                                    <i class="fas fa-shield-alt"></i> Sum Insured <span class="required">*</span>
                                </label>
                                <input type="number" class="member-input" data-field="generalSumInsured" data-member="${memberId}" data-product-type="PA" id="${memberId}-paSumInsured" placeholder="Enter sum insured" min="0" step="1000">
                            </div>
                            <div class="info-field">
                                <label for="${memberId}-paPolicyTenure">
                                    <i class="fas fa-calendar-check"></i> Policy Tenure <span class="required">*</span>
                                </label>
                                <select class="member-input" data-field="generalPolicyTenure" data-member="${memberId}" data-product-type="PA" id="${memberId}-paPolicyTenure">
                                    <option value="">Select Tenure</option>
                                    <option value="1">1 Year</option>
                                    <option value="2">2 Years</option>
                                    <option value="3">3 Years</option>
                                    <option value="4">4 Years</option>
                                    <option value="5">5 Years</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- EMI Protect Fields -->
                    <div class="general-insurance-product-section" id="${memberId}-emiFields" style="display: none;">
                        <div class="general-insurance-header">
                            <i class="fas fa-credit-card"></i>
                            <h4>EMI Protect Details</h4>
                        </div>
                        <div class="form-row">
                            <div class="info-field">
                                <label for="${memberId}-emiAmount">
                                    <i class="fas fa-credit-card"></i> EMI Amount <span class="required">*</span>
                                </label>
                                <input type="number" class="member-input" data-field="generalEmiAmount" data-member="${memberId}" data-product-type="EMI_PROTECT" id="${memberId}-emiAmount" placeholder="Enter EMI amount" min="0" step="0.01">
                            </div>
                            <div class="info-field">
                                <label for="${memberId}-emiPolicyTenure">
                                    <i class="fas fa-calendar-check"></i> Policy Tenure <span class="required">*</span>
                                </label>
                                <select class="member-input" data-field="generalPolicyTenure" data-member="${memberId}" data-product-type="EMI_PROTECT" id="${memberId}-emiPolicyTenure">
                                    <option value="">Select Tenure</option>
                                    <option value="1">1 Year</option>
                                    <option value="2">2 Years</option>
                                    <option value="3">3 Years</option>
                                    <option value="4">4 Years</option>
                                    <option value="5">5 Years</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Property Insurance Specific Fields -->
                <div class="property-insurance-fields" id="propertyInsuranceFields-${memberId}" style="display: none;">
                    <div class="property-insurance-header">
                        <i class="fas fa-home"></i>
                        <h4>Property Insurance Details</h4>
                    </div>
                    <div class="form-row">
                        <div class="info-field">
                            <label for="${memberId}-propertySumInsured">
                                <i class="fas fa-shield-alt"></i> Sum Insured <span class="required">*</span>
                            </label>
                            <input type="number" class="member-input" data-field="propertySumInsured" data-member="${memberId}" id="${memberId}-propertySumInsured" placeholder="Enter sum insured" min="0" step="1000">
                        </div>
                        <div class="info-field">
                            <label for="${memberId}-propertyPolicyTenure">
                                <i class="fas fa-calendar-check"></i> Policy Tenure <span class="required">*</span>
                            </label>
                            <select class="member-input" data-field="propertyPolicyTenure" data-member="${memberId}" id="${memberId}-propertyPolicyTenure">
                                <option value="">Select Tenure</option>
                                <option value="1">1 Year</option>
                                <option value="2">2 Years</option>
                                <option value="3">3 Years</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        `;
        
        membersContainer.insertAdjacentHTML('beforeend', memberHTML);
        
        // Get the new member section
        const newMemberSection = document.querySelector(`[data-member-id="${memberId}"]`);
        if (newMemberSection) {
            // Set as active member
            this.setActiveMember(memberId);
            
            // Add fade-in animation
            newMemberSection.style.opacity = '0';
            newMemberSection.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                newMemberSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                newMemberSection.style.opacity = '1';
                newMemberSection.style.transform = 'translateY(0)';
            }, 50);
            
            // Scroll to new member with better positioning and focus on first field
            setTimeout(() => {
                newMemberSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Focus on the first required field (Name) after scroll
                setTimeout(() => {
                    const nameInput = document.getElementById(`${memberId}-name`);
                    if (nameInput) {
                        nameInput.focus();
                        // Highlight the input briefly to draw attention
                        nameInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.3)';
                        setTimeout(() => {
                            nameInput.style.boxShadow = '';
                        }, 1000);
                    }
                }, 400);
            }, 100);
        }
        
        // Initialize "Other loan type" visibility/required state for the new member
        this.toggleOtherLoanType(memberId, document.getElementById(`${memberId}-loanType`)?.value || '');

        // Show/hide member selection checkbox based on current section
        const checkboxLabel = document.querySelector(`#${memberId}-select`)?.closest('.member-select-checkbox-label');
        if (checkboxLabel) {
            const shouldShow = this.currentSection === 'life' || this.currentSection === 'general' || this.currentSection === 'mayaa';
            checkboxLabel.style.display = shouldShow ? 'flex' : 'none';
        }

        // Update Add Member button visibility after adding member
        this.updateAddMemberButtonVisibility();
    }
    
    removeMember(memberId) {
        if (this.memberCount === 1) {
            this.showError('Cannot remove the last member. At least one member is required.');
            return;
        }
        
        const memberSection = document.querySelector(`[data-member-id="${memberId}"]`);
        if (memberSection) {
            memberSection.remove();
            this.memberCount--;
            
            // Remove any selected items associated with this member
            const itemsToRemove = [];
            this.selectedItems.forEach((item, itemId) => {
                if (item.memberId === memberId) {
                    itemsToRemove.push(itemId);
                }
            });
            itemsToRemove.forEach(itemId => {
                this.removeSelectedItem(itemId);
            });
            
            // Update member labels
            this.updateMemberLabels();
            
            // Update Add Member button visibility after removing member
            this.updateAddMemberButtonVisibility();
        }
    }
    
    updateMemberLabel(memberId, name) {
        const memberSection = document.querySelector(`[data-member-id="${memberId}"]`);
        if (memberSection) {
            const label = memberSection.querySelector('.member-label');
            if (label) {
                if (name && name.trim()) {
                    label.textContent = name.trim();
                } else {
                    // Get member number from memberId
                    const memberNum = memberId.replace('member-', '');
                    label.textContent = `Member ${memberNum}`;
                }
            }
        }
    }
    
    updateMemberLabels() {
        const members = document.querySelectorAll('.member-section');
        members.forEach((member, index) => {
            const memberId = member.dataset.memberId;
            if (memberId) {
                // Get the name from the input field
                const nameInput = document.getElementById(`${memberId}-name`);
                const name = nameInput ? nameInput.value.trim() : '';
                const label = member.querySelector('.member-label');
                if (label) {
                    if (name) {
                        label.textContent = name;
                    } else {
                        label.textContent = `Member ${index + 1}`;
                    }
                }
            }
        });
    }
    
    getMemberData(memberId) {
        const memberIdPrefix = memberId || this.activeMemberId;
        
        // Get General Insurance fields from product-specific sections
        // Check which product section is currently visible
        let generalSumInsured = 0;
        let generalPolicyTenure = 0;
        let generalEmiAmount = 0;

        // Track product-wise General Insurance values separately for PDF and other displays
        let ciSumInsured = 0;
        let ciPolicyTenure = 0;
        let paSumInsured = 0;
        let paPolicyTenure = 0;
        let emiPolicyTenure = 0;
        let emiAmount = 0;
        
        const ciFields = document.getElementById(`${memberIdPrefix}-ciFields`);
        const paFields = document.getElementById(`${memberIdPrefix}-paFields`);
        const emiFields = document.getElementById(`${memberIdPrefix}-emiFields`);
        
        // Read from the visible product section
        if (ciFields && ciFields.style.display !== 'none') {
            ciSumInsured = parseFloat(document.getElementById(`${memberIdPrefix}-ciSumInsured`)?.value) || 0;
            ciPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-ciPolicyTenure`)?.value) || 0;
            generalSumInsured = ciSumInsured;
            generalPolicyTenure = ciPolicyTenure;
        } else if (paFields && paFields.style.display !== 'none') {
            paSumInsured = parseFloat(document.getElementById(`${memberIdPrefix}-paSumInsured`)?.value) || 0;
            paPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-paPolicyTenure`)?.value) || 0;
            generalSumInsured = paSumInsured;
            generalPolicyTenure = paPolicyTenure;
        } else if (emiFields && emiFields.style.display !== 'none') {
            emiPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-emiPolicyTenure`)?.value) || 0;
            emiAmount = parseFloat(document.getElementById(`${memberIdPrefix}-emiAmount`)?.value) || 0;
            // EMI Protect doesn't use sum insured - backend calculates it from EMI amount
            generalSumInsured = 0;
            generalPolicyTenure = emiPolicyTenure;
            generalEmiAmount = emiAmount;
        } else {
            // Fallback: try to read from any product-specific field that has a value
            ciSumInsured = parseFloat(document.getElementById(`${memberIdPrefix}-ciSumInsured`)?.value) || 0;
            ciPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-ciPolicyTenure`)?.value) || 0;
            paSumInsured = parseFloat(document.getElementById(`${memberIdPrefix}-paSumInsured`)?.value) || 0;
            paPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-paPolicyTenure`)?.value) || 0;
            emiPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-emiPolicyTenure`)?.value) || 0;
            emiAmount = parseFloat(document.getElementById(`${memberIdPrefix}-emiAmount`)?.value) || 0;
            
            // Use the first non-zero values found (priority: EMI > PA > CI)
            if (emiPolicyTenure > 0 || emiAmount > 0) {
                // EMI Protect doesn't use sum insured - backend calculates it from EMI amount
                generalSumInsured = 0;
                generalPolicyTenure = emiPolicyTenure;
                generalEmiAmount = emiAmount;
            } else if (paSumInsured > 0 || paPolicyTenure > 0) {
                generalSumInsured = paSumInsured;
                generalPolicyTenure = paPolicyTenure;
            } else if (ciSumInsured > 0 || ciPolicyTenure > 0) {
                generalSumInsured = ciSumInsured;
                generalPolicyTenure = ciPolicyTenure;
            } else {
                // Final fallback to old field names if product-specific fields don't exist
                generalSumInsured = parseFloat(document.getElementById(`${memberIdPrefix}-generalSumInsured`)?.value) || 0;
                generalPolicyTenure = parseInt(document.getElementById(`${memberIdPrefix}-generalPolicyTenure`)?.value) || 0;
                generalEmiAmount = parseFloat(document.getElementById(`${memberIdPrefix}-generalEmiAmount`)?.value) || 0;
            }
        }
        
        return {
            name: document.getElementById(`${memberIdPrefix}-name`)?.value || '',
            age: parseInt(document.getElementById(`${memberIdPrefix}-age`)?.value) || 0,
            gender: document.getElementById(`${memberIdPrefix}-gender`)?.value || '',
            loanAmount: parseFloat(document.getElementById(`${memberIdPrefix}-loanAmount`)?.value) || 0,
            loanType: document.getElementById(`${memberIdPrefix}-loanType`)?.value || '',
            loanTypeOther: (document.getElementById(`${memberIdPrefix}-loanTypeOther`)?.value || '').toUpperCase(),
            email: document.getElementById(`${memberIdPrefix}-email`)?.value || '',
            mobile: document.getElementById(`${memberIdPrefix}-mobile`)?.value || '',
            sumInsured: parseFloat(document.getElementById(`${memberIdPrefix}-sumInsured`)?.value) || 0,
            policyTenure: parseInt(document.getElementById(`${memberIdPrefix}-policyTenure`)?.value) || 0,
            // General Insurance fields (from product-specific sections)
            generalSumInsured: generalSumInsured,
            generalPolicyTenure: generalPolicyTenure,
            generalEmiAmount: generalEmiAmount,
            // Product-wise General Insurance fields (for PDF and detailed views)
            ciSumInsured,
            ciPolicyTenure,
            paSumInsured,
            paPolicyTenure,
            emiPolicyTenure,
            emiAmount,
            // Property Insurance fields
            propertySumInsured: parseFloat(document.getElementById(`${memberIdPrefix}-propertySumInsured`)?.value) || 0,
            propertyPolicyTenure: parseInt(document.getElementById(`${memberIdPrefix}-propertyPolicyTenure`)?.value) || 0,
            // Legacy fields for other sections
            loanTenure: parseInt(document.getElementById(`${memberIdPrefix}-loanTenure`)?.value) || 0,
            policyYear: parseInt(document.getElementById(`${memberIdPrefix}-policyYear`)?.value) || 1,
            emiAmount: parseFloat(document.getElementById(`${memberIdPrefix}-emiAmount`)?.value) || 0,
            coverTermMonths: parseInt(document.getElementById(`${memberIdPrefix}-coverTermMonths`)?.value) || 0,
            coverTermYears: parseInt(document.getElementById(`${memberIdPrefix}-coverTermYears`)?.value) || 0,
            lifeType: document.getElementById(`${memberIdPrefix}-lifeType`)?.value || 'SINGLE',
            secondLifeAge: parseInt(document.getElementById(`${memberIdPrefix}-secondLifeAge`)?.value) || 0
        };
    }

    toggleOtherLoanType(memberId, loanTypeValue) {
        if (!memberId) return;
        const fieldWrap = document.getElementById(`${memberId}-loanTypeOtherField`);
        const input = document.getElementById(`${memberId}-loanTypeOther`);
        if (!fieldWrap || !input) return;

        const isOther = (loanTypeValue || '').trim() === 'Other';
        fieldWrap.style.display = isOther ? 'block' : 'none';
        if (isOther) {
            input.setAttribute('required', 'required');
        } else {
            input.removeAttribute('required');
            input.value = '';
        }
    }

    switchSection(section) {
        // Property section temporarily disabled
        if (section === 'property') {
            this.showError('Property section is disabled for now.');
            return;
        }

        this.currentSection = section;
        
        // Check if current member count exceeds limit for this section
        const maxMembers = this.getMaxMembersForSection();
        if (this.memberCount > maxMembers) {
            // Remove excess members
            const excessCount = this.memberCount - maxMembers;
            for (let i = 0; i < excessCount; i++) {
                const lastMemberId = `member-${this.memberCount}`;
                this.removeMember(lastMemberId);
            }
            this.showError(`Maximum ${maxMembers} member${maxMembers > 1 ? 's' : ''} allowed for ${this.getSectionDisplayName()}. Excess members have been removed.`);
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Show/hide product containers
        document.querySelectorAll('.products-container').forEach(container => {
            container.classList.remove('active');
        });
        
        const containerId = `${section}Products`;
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('active');
        }

        // Show/hide Life Insurance fields and Add Member button
        this.toggleLifeInsuranceFields(section === 'life');
        
        // Show/hide General Insurance fields
        this.toggleGeneralInsuranceFields(section === 'general');
        
        // Show/hide member selection checkboxes based on section
        this.toggleMemberSelectionCheckboxes(section === 'life' || section === 'general' || section === 'mayaa');
        
        // Show/hide Property Insurance fields
        this.togglePropertyInsuranceFields(section === 'property');
        
        // Show/hide General Insurance dropdown in sidebar
        const dropdownContainer = document.getElementById('generalInsuranceDropdownContainer');
        if (dropdownContainer) {
            dropdownContainer.style.display = (section === 'general') ? 'block' : 'none';
        }

        // Load products for this section
        this.loadProductsForSection(section);
        
        // Restore checked state for selected items in this section
        this.restoreSelectedProductsState();
        
        // Update Add Member button visibility
        this.updateAddMemberButtonVisibility();
    }
    
    toggleMemberSelectionCheckboxes(show) {
        // Show/hide member selection checkboxes for all members
        document.querySelectorAll('.member-select-checkbox-label').forEach(label => {
            label.style.display = show ? 'flex' : 'none';
        });
    }
    
    toggleLifeInsuranceFields(show) {
        // Show/hide life insurance fields for all members
        document.querySelectorAll('.life-insurance-fields').forEach(field => {
            field.style.display = show ? 'block' : 'none';
        });
    }
    
    toggleGeneralInsuranceFields(show) {
        // Show/hide general insurance fields container for all members
        document.querySelectorAll('.general-insurance-fields').forEach(field => {
            field.style.display = show ? 'block' : 'none';
        });
        
        // When hiding, also hide all product-specific sections
        if (!show) {
            document.querySelectorAll('.general-insurance-product-section').forEach(section => {
                section.style.display = 'none';
            });
        }
    }
    
    togglePropertyInsuranceFields(show) {
        // Show/hide property insurance fields for all members
        document.querySelectorAll('.property-insurance-fields').forEach(field => {
            field.style.display = show ? 'block' : 'none';
        });
    }
    
    
    getMaxMembersForSection() {
        return this.maxMembers[this.currentSection] || 10;
    }
    
    getSectionDisplayName() {
        const sectionNames = {
            life: 'Life Insurance',
            general: 'General Insurance',
            mayaa: 'Mayaa',
            property: 'Property Insurance'
        };
        return sectionNames[this.currentSection] || this.currentSection;
    }
    
    updateAddMemberButtonVisibility() {
        const addMemberContainer = document.getElementById('addMemberContainer');
        if (!addMemberContainer) return;
        
        // Show Add Member button for Life Insurance and General Insurance sections
        if (this.currentSection !== 'life' && this.currentSection !== 'general') {
            addMemberContainer.style.display = 'none';
            return;
        }
        
        const maxMembers = this.getMaxMembersForSection();
        
        if (this.memberCount >= maxMembers) {
            addMemberContainer.style.display = 'none';
        } else {
            addMemberContainer.style.display = 'flex';
        }
    }
    
    restoreSelectedProductsState() {
        // Restore input states and UI for selected items
        // For Life Insurance, General Insurance, and Mayaa, we need to check base product IDs
        const baseProductIdsChecked = new Set();
        
        this.selectedItems.forEach((item, productId) => {
            // For sections with member-specific IDs, find base product ID
            let baseProductId = productId;
            if ((this.currentSection === 'life' || this.currentSection === 'general' || this.currentSection === 'mayaa') && item.baseProductId) {
                baseProductId = item.baseProductId;
            } else if (productId.includes('-member-')) {
                baseProductId = productId.split('-member-')[0];
            }
            
            baseProductIdsChecked.add(baseProductId);
            
            // Check the base product's radio/checkbox button if not already checked
            const input = document.querySelector(`input[data-product-id="${baseProductId}"]`);
            if (input) {
                input.checked = true;
                const productItem = input.closest('.product-item');
                if (productItem) {
                    productItem.classList.add('checked');
                    // For Life Insurance, General Insurance, and Mayaa, show count of members if multiple
                    const priceSpan = productItem.querySelector('.product-price');
                    if (priceSpan) {
                        if (this.currentSection === 'life' || this.currentSection === 'general' || this.currentSection === 'mayaa') {
                            // Count items with this base product ID
                            const memberCount = Array.from(this.selectedItems.keys())
                                .filter(id => {
                                    const item = this.selectedItems.get(id);
                                    return (item && item.baseProductId === baseProductId) || 
                                           (id.startsWith(baseProductId) && id.includes('-member-'));
                                })
                                .length;
                            
                            if (memberCount > 1) {
                                priceSpan.textContent = `${memberCount} members`;
                            } else if (memberCount === 1) {
                                // Show single member's price
                                const singleItem = Array.from(this.selectedItems.entries())
                                    .find(([id, data]) => 
                                        (data && data.baseProductId === baseProductId) || 
                                        (id.startsWith(baseProductId) && id.includes('-member-'))
                                    );
                                if (singleItem && singleItem[1].premiumInclGst) {
                                    priceSpan.textContent = this.formatCurrency(singleItem[1].premiumInclGst);
                                }
                            }
                        } else {
                            // Property Insurance and other single-member sections
                            if (item.premiumInclGst) {
                                priceSpan.textContent = this.formatCurrency(item.premiumInclGst);
                            }
                        }
                    }
                }
            }
        });
    }

    loadProductsForSection(section) {
        if (section === 'life') {
            this.loadLifeProducts();
        } else if (section === 'general') {
            this.loadGeneralProducts();
        } else if (section === 'mayaa') {
            this.loadMayaaProducts();
        } else if (section === 'property') {
            this.loadPropertyProducts();
        }
    }

    loadLifeProducts() {
        const bajajContainer = document.getElementById('bajajLifeProducts');
        const godigitContainer = document.getElementById('godigitLifeProducts');
        
        // Bajaj Life products - Show 1..5 year options (matching Policy Tenure)
        const bajajTerms = [1, 2, 3, 4, 5];
        bajajContainer.innerHTML = bajajTerms.map(term => `
            <div class="product-item" data-provider="bajajlife" data-term="${term}">
                <input type="radio" id="bajaj-${term}" data-product-id="bajajlife-${term}" name="bajajlife-group">
                <label for="bajaj-${term}">Bajaj Life - ${term} Year${term > 1 ? 's' : ''}</label>
                <span class="product-price" data-price="0">-</span>
            </div>
        `).join('');

        // Go Digit Life products - Convert years to months (1yr=12mo, 2yr=24mo, 3yr=36mo)
        const godigitTerms = [12, 24, 36]; // 1, 2, 3 years in months
        godigitContainer.innerHTML = godigitTerms.map(term => {
            const years = term / 12;
            return `
                <div class="product-item" data-provider="godigitlife" data-term="${term}">
                    <input type="radio" id="godigitlife-${term}" data-product-id="godigitlife-${term}" name="godigitlife-group">
                    <label for="godigitlife-${term}">Go Digit Life - ${years} Year${years > 1 ? 's' : ''} (${term} Months)</label>
                    <span class="product-price" data-price="0">-</span>
                </div>
            `;
        }).join('');

        // Attach event listeners
        this.attachProductListeners();
        
        // Filter products based on selected Policy Tenure (if any member has selected tenure)
        this.filterLifeInsuranceProductsBySelectedTenure();
    }
    
    filterLifeInsuranceProductsBySelectedTenure() {
        // Get Policy Tenure from the first member (or active member)
        const activeMemberId = this.activeMemberId || 'member-1';
        const policyTenureInput = document.getElementById(`${activeMemberId}-policyTenure`);
        const selectedTenure = policyTenureInput ? parseInt(policyTenureInput.value) || 0 : 0;
        
        // If no tenure selected, check all members for any selected tenure
        if (selectedTenure === 0) {
            const allMembers = document.querySelectorAll('.member-section');
            for (const memberSection of allMembers) {
                const memberId = memberSection.dataset.memberId;
                if (memberId) {
                    const tenureInput = document.getElementById(`${memberId}-policyTenure`);
                    if (tenureInput && tenureInput.value) {
                        const tenure = parseInt(tenureInput.value) || 0;
                        if (tenure > 0) {
                            this.filterLifeInsuranceProducts(tenure);
                            return;
                        }
                    }
                }
            }
        }
        
        // Filter based on selected tenure (or show all if none selected)
        this.filterLifeInsuranceProducts(selectedTenure);
    }
    
    filterLifeInsuranceProducts(selectedTenure) {
        const bajajContainer = document.getElementById('bajajLifeProducts');
        const godigitContainer = document.getElementById('godigitLifeProducts');
        
        if (!bajajContainer || !godigitContainer) return;
        
        // Filter Bajaj Life products - show only the matching tenure
        const bajajProducts = bajajContainer.querySelectorAll('.product-item');
        bajajProducts.forEach(productItem => {
            const term = parseInt(productItem.dataset.term) || 0;
            const radioInput = productItem.querySelector('input[type="radio"]');
            
            if (selectedTenure > 0) {
                // Show only the product matching the selected tenure
                const shouldShow = (term === selectedTenure);
                productItem.style.display = shouldShow ? 'block' : 'none';
                
                // Uncheck products that don't match the selected tenure
                if (!shouldShow && radioInput && radioInput.checked) {
                    radioInput.checked = false;
                    productItem.classList.remove('checked');
                    // Remove from selected items
                    const productId = radioInput.dataset.productId;
                    if (productId) {
                        const itemsToRemove = [];
                        this.selectedItems.forEach((item, itemId) => {
                            if (itemId.startsWith(productId) || item.baseProductId === productId) {
                                itemsToRemove.push(itemId);
                            }
                        });
                        itemsToRemove.forEach(itemId => {
                            this.removeProduct(itemId);
                        });
                    }
                }
            } else {
                // If no tenure selected, show all products
                productItem.style.display = 'block';
            }
        });
        
        // Filter Go Digit Life products - show only matching tenure (but only for 1-3 years)
        const godigitProducts = godigitContainer.querySelectorAll('.product-item');
        godigitProducts.forEach(productItem => {
            const termMonths = parseInt(productItem.dataset.term) || 0;
            const termYears = termMonths / 12;
            const radioInput = productItem.querySelector('input[type="radio"]');
            
            if (selectedTenure > 0) {
                // Go Digit only supports 1-3 years, so hide if tenure is 4 or 5
                if (selectedTenure > 3) {
                    productItem.style.display = 'none';
                    // Uncheck if selected
                    if (radioInput && radioInput.checked) {
                        radioInput.checked = false;
                        productItem.classList.remove('checked');
                        // Remove from selected items
                        const productId = radioInput.dataset.productId;
                        if (productId) {
                            const itemsToRemove = [];
                            this.selectedItems.forEach((item, itemId) => {
                                if (itemId.startsWith(productId) || item.baseProductId === productId) {
                                    itemsToRemove.push(itemId);
                                }
                            });
                            itemsToRemove.forEach(itemId => {
                                this.removeProduct(itemId);
                            });
                        }
                    }
                } else {
                    // Show only the product matching the selected tenure
                    const shouldShow = (termYears === selectedTenure);
                    productItem.style.display = shouldShow ? 'block' : 'none';
                    
                    // Uncheck products that don't match the selected tenure
                    if (!shouldShow && radioInput && radioInput.checked) {
                        radioInput.checked = false;
                        productItem.classList.remove('checked');
                        // Remove from selected items
                        const productId = radioInput.dataset.productId;
                        if (productId) {
                            const itemsToRemove = [];
                            this.selectedItems.forEach((item, itemId) => {
                                if (itemId.startsWith(productId) || item.baseProductId === productId) {
                                    itemsToRemove.push(itemId);
                                }
                            });
                            itemsToRemove.forEach(itemId => {
                                this.removeProduct(itemId);
                            });
                        }
                    }
                }
            } else {
                // If no tenure selected, show all products
                productItem.style.display = 'block';
            }
        });
        
        // Update UI after filtering
        this.updateSelectedItemsDisplay();
        this.updateTotal();
    }

    loadGeneralProducts() {
        // General Insurance dropdown is now in the sidebar, so we just need to initialize the event listener
        // The dropdown HTML is already in the HTML file
        this.initializeGeneralInsuranceDropdown();
        
        // Clear any existing provider options
        const providerOptions = document.getElementById('generalInsuranceProviderOptions');
        if (providerOptions) {
            providerOptions.style.display = 'none';
        }
    }
    
    initializeGeneralInsuranceDropdown() {
        // Attach dropdown change listener
        const dropdown = document.getElementById('generalInsuranceProductSelect');
        if (dropdown) {
            // Remove existing listener if any
            dropdown.removeEventListener('change', this.boundGeneralInsuranceDropdownChange);
            
            // Create bound handler
            this.boundGeneralInsuranceDropdownChange = (e) => {
                const selectedValue = e.target.value;
                if (selectedValue) {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    const productId = selectedValue;
                    const productItem = {
                        dataset: {
                            provider: selectedOption.dataset.provider,
                            productType: selectedOption.dataset.productType,
                            coverage: selectedOption.dataset.coverage,
                            product: selectedOption.dataset.product
                        }
                    };
                    this.handleGeneralInsuranceDropdownChange(productId, productItem);
                } else {
                    // Clear selection
                    this.clearGeneralInsuranceSelection();
                }
            };
            
            dropdown.addEventListener('change', this.boundGeneralInsuranceDropdownChange);
        }
    }

    loadMayaaProducts() {
        const container = document.getElementById('mayaaPlansList');
        const plans = [
            { id: 'mayaa-plana', name: 'PlanA', price: 2000 },
            { id: 'mayaa-planb', name: 'PlanB', price: 3000 },
            { id: 'mayaa-planc', name: 'PlanC', price: 4000 },
            { id: 'mayaa-pland', name: 'PlanD', price: 5000 }
        ];
        
        // Use radio buttons for Mayaa Plans - only one can be selected at a time
        container.innerHTML = plans.map(plan => `
            <div class="product-item" data-provider="mayaa" data-plan="${plan.name}">
                <input type="radio" id="${plan.id}" data-product-id="${plan.id}" name="mayaa-group">
                <label for="${plan.id}">${plan.name}</label>
                <span class="product-price">₹${this.formatNumber(plan.price)}</span>
            </div>
        `).join('');

        console.log('Mayaa products loaded, attaching listeners');
        this.attachProductListeners();
    }

    loadPropertyProducts() {
        const container = document.getElementById('propertyProductsList');
        const years = [1, 2, 3];
        
        // Use radio buttons for Property Insurance - only one can be selected at a time
        container.innerHTML = years.map(year => `
            <div class="product-item" data-provider="property" data-year="${year}">
                <input type="radio" id="property-${year}" data-product-id="property-${year}" name="property-group">
                <label for="property-${year}">Property Insurance - Year ${year}</label>
                <span class="product-price" data-price="0">-</span>
            </div>
        `).join('');

        console.log('Property products loaded, attaching listeners');
        this.attachProductListeners();
    }

    attachProductListeners() {
        // Use event delegation for better performance and to handle dynamically added elements
        const productsContainer = document.querySelector('.insurance-premium-section');
        if (!productsContainer) return;
        
        // Remove existing listener if any
        productsContainer.removeEventListener('change', this.boundHandleProductChange);
        
        // Bind the handler to maintain 'this' context
        this.boundHandleProductChange = (e) => {
            console.log('Change event captured:', e.target.type, e.target);
            if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.closest('.product-item')) {
                console.log('Event matches criteria, calling handleProductChange');
                this.handleProductChange(e);
            } else {
                console.log('Event does not match criteria', {
                    type: e.target.type,
                    hasProductItem: !!e.target.closest('.product-item')
                });
            }
        };
        
        // Bind click handler for radio buttons and labels
        // This ensures calculation happens immediately when user clicks anywhere on the product item
        this.boundHandleProductClick = (e) => {
            console.log('Click event captured:', e.target.tagName, e.target.type, e.target);
            
            // Find the closest product item
            const productItem = e.target.closest('.product-item');
            if (!productItem) return;
            
            // Find the input (radio or checkbox) within this product item
            const input = productItem.querySelector('input[type="radio"], input[type="checkbox"]');
            if (!input) return;
            
            // If clicking on label or product item, programmatically click the input
            if (e.target.tagName === 'LABEL' || e.target.tagName === 'SPAN' || e.target === productItem) {
                e.preventDefault();
                e.stopPropagation();
                
                // Click the input to change its state
                input.click();
                return; // The input's click will trigger change event
            }
            
            // If clicking directly on the input
            if ((e.target.type === 'checkbox' || e.target.type === 'radio')) {
                console.log('Direct input click detected');
                // Use a slight delay for radio buttons to ensure checked state is updated
                if (e.target.type === 'radio') {
                    setTimeout(() => {
                        this.handleProductChange(e);
                    }, 50);
                } else {
                    // For checkboxes, handle immediately
                    setTimeout(() => {
                        this.handleProductChange(e);
                    }, 10);
                }
            }
        };
        
        // Attach both change and click event listeners to container
        productsContainer.addEventListener('change', this.boundHandleProductChange);
        productsContainer.addEventListener('click', this.boundHandleProductClick);
        console.log('Event listeners (change & click) attached to productsContainer:', productsContainer);
    }

    handleProductChange(e) {
        console.log('handleProductChange called', e.target);
        
        // Get the input element - it could be from change event or click event
        let input = e.target;
        if (input.tagName !== 'INPUT') {
            // If event target is not the input, find it
            const productItem = input.closest('.product-item');
            if (productItem) {
                input = productItem.querySelector('input[type="radio"], input[type="checkbox"]');
            }
        }
        
        if (!input) {
            console.log('No input element found, returning');
            return;
        }
        
        const productId = input.dataset.productId;
        
        if (!productId) {
            console.log('No productId found, returning');
            return;
        }
        
        console.log('Product ID:', productId);
        
        const productItem = input.closest('.product-item');
        if (!productItem) {
            console.log('No productItem found, returning');
            return;
        }
        
        const isChecked = input.checked;
        const provider = productItem.dataset.provider;
        
        console.log('Product change:', { productId, provider, isChecked, currentSection: this.currentSection });

        if (isChecked) {
            console.log('Product checked, proceeding with calculation');
            
            // For Life Insurance, General Insurance, and Mayaa: calculate for ALL members at once
            if (this.currentSection === 'life') {
                this.handleLifeInsuranceSelection(provider, productId);
                // Calculate for all members
                console.log('Life Insurance selected - calculating for all members');
                this.calculateForAllMembers(productId, productItem);
            } 
            // For General Insurance section: handle provider selection (Go Digit, Aditya Birla)
            else if (this.currentSection === 'general') {
                // Check if this is a provider option (has data-base-product-id)
                const baseProductId = productItem.dataset.baseProductId;
                if (baseProductId) {
                    // This is a provider option selection
                    console.log('General Insurance provider selected:', { productId, baseProductId, provider: productItem.dataset.provider });
                    this.handleGeneralInsuranceProviderSelection(productId, productItem, isChecked);
                } else {
                    console.log('General Insurance selection - not a provider option');
                }
            } 
            // For Mayaa section: calculate for ALL members at once
            else if (this.currentSection === 'mayaa') {
                this.uncheckOtherProductsInProviderGroup(provider, productId);
                // Calculate for all members
                console.log('Mayaa selected - calculating for all members');
                this.calculateForAllMembers(productId, productItem);
            }
            // For Property Insurance: single member only
            else {
                this.uncheckOtherProductsInProviderGroup(provider, productId);
                // Calculate for single active member
                this.calculateAndAddProduct(productId, productItem);
            }
        } else {
            console.log('Product unchecked, removing from selection');
            
            // For Life Insurance, General Insurance, and Mayaa: remove all member-specific items for this product
            if (this.currentSection === 'life' || this.currentSection === 'general' || this.currentSection === 'mayaa') {
                const itemsToRemove = [];
                this.selectedItems.forEach((item, itemId) => {
                    // Check if this item belongs to the unchecked product
                    if (item.baseProductId === productId || itemId.startsWith(productId)) {
                        itemsToRemove.push(itemId);
                    }
                });
                itemsToRemove.forEach(itemId => {
                    this.removeProduct(itemId);
                });
            } else {
                // For Property Insurance and other sections, remove single item
                this.removeProduct(productId);
            }
            
            // Update UI immediately
            productItem.classList.remove('checked');
            this.updateSelectedItemsDisplay();
            this.updateTotal();
        }
    }
    
    handleLifeInsuranceSelection(selectedProvider, currentProductId) {
        // If Bajaj Life is selected, uncheck all Go Digit Life products
        if (selectedProvider === 'bajajlife') {
            this.uncheckAllProductsInProvider('godigitlife');
        }
        // If Go Digit Life is selected, uncheck all Bajaj Life products
        else if (selectedProvider === 'godigitlife') {
            this.uncheckAllProductsInProvider('bajajlife');
        }
        
        // Also uncheck other products within the same provider group
        this.uncheckOtherProductsInProviderGroup(selectedProvider, currentProductId);
    }
    
    async calculateForAllMembers(productId, productItem) {
        console.log(`calculateForAllMembers called for ${this.currentSection}`, { productId, productItem });
        
        const provider = productItem.dataset.provider;
        const input = productItem.querySelector('input[type="checkbox"], input[type="radio"]');
        
        // Get all members
        const allMembers = document.querySelectorAll('.member-section');
        const validMembers = [];
        
        // Collect valid members with required data based on section type
        // Only include members that are selected (checkbox checked)
        allMembers.forEach(memberSection => {
            const memberId = memberSection.dataset.memberId;
            if (memberId) {
                // Check if member is selected (checkbox checked)
                const selectCheckbox = document.getElementById(`${memberId}-select`);
                const isSelected = selectCheckbox ? selectCheckbox.checked : true; // Default to true if checkbox doesn't exist
                
                if (!isSelected) {
                    console.log(`Skipping ${memberId} - not selected`);
                    return; // Skip this member
                }
                
                const memberData = this.getMemberData(memberId);
                const { age, sumInsured, loanAmount, loanTenure, emiAmount } = memberData;
                
                let isValid = false;
                
                // Validation based on section type
                // Age must be between 18 and 75
                const isAgeValid = age && age >= 18 && age <= 75;
                
                if (this.currentSection === 'life') {
                    // Life Insurance requires age, sumInsured, and policyTenure
                    const policyTenure = memberData.policyTenure || 0;
                    isValid = isAgeValid && sumInsured && policyTenure && sumInsured > 0 && policyTenure > 0;
                } else if (this.currentSection === 'general') {
                    // General Insurance validation is handled in modal, so all members with valid age are valid
                    isValid = isAgeValid;
                } else if (this.currentSection === 'mayaa') {
                    // Mayaa has fixed prices, but age must still be valid
                    isValid = isAgeValid;
                }
                
                if (isValid) {
                    validMembers.push({ memberId, memberData });
                } else {
                    console.log(`Skipping ${memberId} - missing required data`, memberData);
                }
            }
        });
        
            // Error messages based on section type
            if (validMembers.length === 0) {
                let errorMsg = '';
                // Check if any members are selected
                const selectedMembers = Array.from(allMembers).filter(memberSection => {
                    const memberId = memberSection.dataset.memberId;
                    if (!memberId) return false;
                    const selectCheckbox = document.getElementById(`${memberId}-select`);
                    return selectCheckbox ? selectCheckbox.checked : true;
                });
                
                if (selectedMembers.length === 0) {
                    errorMsg = 'Please select at least one member to calculate premiums.';
                } else if (this.currentSection === 'life') {
                    errorMsg = 'Please enter Age (18-75), Sum Insured, and Policy Tenure for at least one selected member to calculate Life Insurance premiums.';
                } else if (this.currentSection === 'general') {
                    errorMsg = 'Please enter Age (18-75) for at least one selected member to calculate General Insurance premiums.';
                } else if (this.currentSection === 'mayaa') {
                    errorMsg = 'Please ensure at least one member with valid Age (18-75) is selected to calculate Mayaa premiums.';
            }
            this.showError(errorMsg);
            if (input) input.checked = false;
            return;
        }
        
        console.log(`Calculating for ${validMembers.length} member(s):`, validMembers.map(m => m.memberId));
        
        try {
            this.showLoading(true);
            const calculations = [];
            const errors = [];
            
            // Calculate premium for each valid member
            for (const { memberId, memberData } of validMembers) {
                const { age, sumInsured, policyTenure, loanAmount, loanTenure, policyYear, emiAmount, coverTermMonths, coverTermYears, lifeType, secondLifeAge } = memberData;
                
                try {
                    // Create unique product ID for each member
                    const memberProductId = `${productId}-${memberId}`;
                    
                    let premiumData = null;
                    
                    if (provider === 'bajajlife') {
                        // Use individual member's policyTenure first, then fall back to product item term
                        // Each member should have their own Sum Insured and Policy Tenure
                        const term = policyTenure || parseInt(productItem.dataset.term) || 1;
                        premiumData = await this.calculateBajajLife(age, sumInsured, term);
                        premiumData.productName = `Bajaj Life - ${term} Year${term > 1 ? 's' : ''} (Member ${memberId.replace('member-', '')})`;
                    } else if (provider === 'godigitlife') {
                        // Use individual member's policyTenure (convert years to months) or coverTermMonths
                        // Each member should have their own Sum Insured and Policy Tenure
                        let term = null;
                        
                        // Prioritize individual member's coverTermMonths (if exists), otherwise convert policyTenure to months
                        if (coverTermMonths && coverTermMonths > 0) {
                            term = coverTermMonths;
                        } else if (policyTenure && policyTenure > 0) {
                            // Convert policyTenure (years) to months for Go Digit Life
                            // Go Digit Life accepts 12, 24, or 36 months (1, 2, or 3 years)
                            term = policyTenure * 12;
                            // Validate: only allow 1, 2, or 3 years (12, 24, 36 months)
                            if (term !== 12 && term !== 24 && term !== 36) {
                                errors.push(`${memberId}: Policy Tenure must be 1, 2, or 3 years for Go Digit Life`);
                                continue;
                            }
                        } else if (productItem && productItem.dataset && productItem.dataset.term) {
                            term = parseInt(productItem.dataset.term);
                        } else if (productId) {
                            const parts = productId.split('-');
                            if (parts.length >= 2 && !isNaN(parts[1])) {
                                term = parseInt(parts[1]);
                            }
                        }
                        
                        if (!term || isNaN(term)) {
                            term = 12; // Default fallback
                        }
                        
                        if (lifeType === 'JOINT' && !secondLifeAge) {
                            errors.push(`${memberId}: Please enter Second Life Age for Joint Life`);
                            continue;
                        }
                        
                        // Use individual member's sumInsured and term
                        premiumData = await this.calculateGoDigitLife(age, sumInsured, term, lifeType, secondLifeAge);
                        premiumData.productName = `Go Digit Life - ${term} Months (${lifeType === 'SINGLE' ? 'Single' : 'Joint'}) (Member ${memberId.replace('member-', '')})`;
                    } else if (provider === 'adityabirla') {
                        // This should not be reached for General Insurance as it uses modal
                        // But keeping for backward compatibility
                        const product = productItem.dataset.product;
                        const selectedLoanTenure = loanTenure || 1;
                        if (!loanAmount || loanAmount <= 0) {
                            errors.push(`${memberId}: Please enter Loan Amount for General Insurance`);
                            continue;
                        }
                        if (product === 'EMI_PROTECT' && !emiAmount) {
                            errors.push(`${memberId}: Please enter EMI Amount for EMI Protect`);
                            continue;
                        }
                        premiumData = await this.calculateAdityaBirla(age, loanAmount, selectedLoanTenure, product, emiAmount);
                        premiumData.productName = `${product} (Member ${memberId.replace('member-', '')})`;
                    } else if (provider === 'godigit') {
                        // This should not be reached for General Insurance as it uses modal
                        // But keeping for backward compatibility
                        const coverage = productItem.dataset.coverage;
                        const selectedPolicyYear = policyYear || Math.min(loanTenure || 1, 3);
                        if (!loanAmount || loanAmount <= 0) {
                            errors.push(`${memberId}: Please enter Loan Amount for General Insurance`);
                            continue;
                        }
                        if (coverage === 'EMI' && !emiAmount) {
                            errors.push(`${memberId}: Please enter EMI Amount for EMI coverage`);
                            continue;
                        }
                        premiumData = await this.calculateGoDigit(age, loanAmount, selectedPolicyYear, coverage, emiAmount);
                        premiumData.productName = `Go Digit ${coverage} (Member ${memberId.replace('member-', '')})`;
                    } else if (provider === 'mayaa') {
                        // Mayaa has fixed prices - no API call needed
                        const planName = productItem.dataset.plan;
                        const prices = { PlanA: 2000, PlanB: 3000, PlanC: 4000, PlanD: 5000 };
                        
                        premiumData = {
                            // Mayaa plan prices are already GST inclusive.
                            // Treat the configured price as premiumInclGst and back-calculate excl. GST for display only.
                            premiumInclGst: prices[planName],
                            premiumExclGst: prices[planName] / 1.18,
                            provider: 'Mayaa',
                            productName: planName
                        };
                    }
                    
                    if (premiumData) {
                        premiumData.memberId = memberId;
                        premiumData.baseProductId = productId; // Store base product ID for reference
                        calculations.push({ memberProductId, premiumData });
                        console.log(`Calculated premium for ${memberId}:`, premiumData);
                    }
                } catch (error) {
                    console.error(`Error calculating for ${memberId}:`, error);
                    errors.push(`${memberId}: ${error.message || 'Calculation failed'}`);
                }
            }
            
            // Remove all existing products from this provider for all members
            // When selecting a new product in the same provider, remove ALL previous products from that provider
            const itemsToRemove = [];
            this.selectedItems.forEach((item, itemId) => {
                // Check if this item belongs to the same provider
                // For member-specific IDs, extract the base product ID and check provider
                let itemBaseProductId = itemId;
                if (item.baseProductId) {
                    itemBaseProductId = item.baseProductId;
                } else if (itemId.includes('-member-')) {
                    itemBaseProductId = itemId.split('-member-')[0];
                }
                
                // Extract provider from base product ID (e.g., "bajajlife-3" -> "bajajlife")
                const itemProvider = itemBaseProductId.split('-')[0];
                const currentProvider = productId.split('-')[0];
                
                // Remove all items from the same provider
                if (itemProvider === currentProvider) {
                    itemsToRemove.push(itemId);
                }
            });
            
            itemsToRemove.forEach(itemId => {
                this.removeProduct(itemId);
            });
            
            // Add all new calculations
            calculations.forEach(({ memberProductId, premiumData }) => {
                this.selectedItems.set(memberProductId, premiumData);
            });
            
            // Update UI
            const priceSpan = productItem.querySelector('.product-price');
            if (priceSpan && calculations.length > 0) {
                // Show count of members if multiple, or single price if one
                if (calculations.length > 1) {
                    priceSpan.textContent = `${calculations.length} members`;
                } else {
                    priceSpan.textContent = this.formatCurrency(calculations[0].premiumData.premiumInclGst);
                }
            }
            
            productItem.classList.add('checked');
            this.updateSelectedItemsDisplay();
            this.updateTotal();
            
            // Show any errors
            if (errors.length > 0) {
                this.showError(`Some calculations failed:\n${errors.join('\n')}`);
            } else if (calculations.length > 0) {
                console.log(`Successfully calculated premiums for ${calculations.length} member(s)`);
            }
            
        } catch (error) {
            console.error('Error in calculateForAllMembers:', error);
            this.showError('Failed to calculate premiums. Please check your inputs.');
            if (input) {
                input.checked = false;
                productItem.classList.remove('checked');
            }
        } finally {
            this.showLoading(false);
        }
    }
    
    handleGeneralInsuranceSelection(selectedProvider, currentProductId) {
        console.log('General Insurance selection:', { selectedProvider, currentProductId });
        
        // For unified General Insurance, we allow multiple selections
        // No need to uncheck other products - user can select CI, PA, and EMI PROTECT together
    }
    
    handleGeneralInsuranceDropdownChange(productId, productItem) {
        console.log('General Insurance dropdown changed:', { productId, productItem });
        
        // Get product type
        const productType = productItem.dataset.productType;
        
        // Show/hide appropriate field sections for all members based on product type
        document.querySelectorAll('.member-section').forEach(memberSection => {
            const memberId = memberSection.dataset.memberId;
            if (!memberId) return;
            
            // Hide all product-specific sections first
            const ciFields = document.getElementById(`${memberId}-ciFields`);
            const paFields = document.getElementById(`${memberId}-paFields`);
            const emiFields = document.getElementById(`${memberId}-emiFields`);
            
            if (ciFields) ciFields.style.display = 'none';
            if (paFields) paFields.style.display = 'none';
            if (emiFields) emiFields.style.display = 'none';
            
            // Show the appropriate section based on product type
            if (productType === 'CI' && ciFields) {
                ciFields.style.display = 'block';
            } else if (productType === 'PA' && paFields) {
                paFields.style.display = 'block';
            } else if (productType === 'EMI_PROTECT' && emiFields) {
                emiFields.style.display = 'block';
            }
        });
        
        // Show provider options in middle section based on product type
        this.showGeneralInsuranceProviderOptions(productId, productType);
    }
    
    showGeneralInsuranceProviderOptions(productId, productType) {
        const container = document.getElementById('generalInsuranceProducts');
        const providerOptions = document.getElementById('generalInsuranceProviderOptions');
        const productTitle = document.getElementById('generalInsuranceProductTitle');
        
        if (!container || !providerOptions) return;
        
        // Note: Do NOT remove previously selected CI/PA/EMI products when switching the
        // dropdown. General Insurance is designed to allow CI, PA and EMI PROTECT
        // to coexist in the Selected Items panel at the same time. We only clear
        // the UI selection in the middle column, not the already calculated items.
        
        this.selectedGeneralInsuranceProduct = null;
        
        let optionsHTML = '';
        let titleText = '';
        
        if (productType === 'CI') {
            // CI: Show both Aditya Birla and Go Digit options (radio buttons - only one can be selected)
            titleText = 'CI (Critical Illness) - Select Provider';
            optionsHTML = `
                <div class="product-item" data-provider="godigit" data-product-type="CI" data-coverage="CI" data-base-product-id="${productId}">
                    <input type="radio" id="general-ci-godigit" data-product-id="${productId}-godigit" name="general-ci-providers">
                    <label for="general-ci-godigit">
                        <i class="fas fa-heartbeat"></i> Go Digit - CI (Critical Illness)
                    </label>
                    <span class="product-price" data-price="0">-</span>
                </div>
                <div class="product-item" data-provider="adityabirla" data-product-type="CI" data-product="GCI" data-base-product-id="${productId}">
                    <input type="radio" id="general-ci-adityabirla" data-product-id="${productId}-adityabirla" name="general-ci-providers">
                    <label for="general-ci-adityabirla">
                        <i class="fas fa-shield-alt"></i> Aditya Birla - GCI (Group Critical Illness)
                    </label>
                    <span class="product-price" data-price="0">-</span>
                </div>
            `;
        } else if (productType === 'PA') {
            // PA: Show both Go Digit and Aditya Birla options (radio buttons - only one can be selected)
            titleText = 'PA (Personal Accident) - Select Provider';
            optionsHTML = `
                <div class="product-item" data-provider="godigit" data-product-type="PA" data-coverage="PA" data-base-product-id="${productId}">
                    <input type="radio" id="general-pa-godigit" data-product-id="${productId}-godigit" name="general-pa-providers">
                    <label for="general-pa-godigit">
                        <i class="fas fa-user-shield"></i> Go Digit - PA (Personal Accident)
                    </label>
                    <span class="product-price" data-price="0">-</span>
                </div>
                <div class="product-item" data-provider="adityabirla" data-product-type="PA" data-product="GPA" data-base-product-id="${productId}">
                    <input type="radio" id="general-pa-adityabirla" data-product-id="${productId}-adityabirla" name="general-pa-providers">
                    <label for="general-pa-adityabirla">
                        <i class="fas fa-user-shield"></i> Aditya Birla - GPA (Group Personal Accident)
                    </label>
                    <span class="product-price" data-price="0">-</span>
                </div>
            `;
        } else if (productType === 'EMI_PROTECT') {
            // EMI Protect: Show both Aditya Birla and Go Digit options (radio buttons - only one can be selected)
            titleText = 'EMI Protect - Select Provider';
            optionsHTML = `
                <div class="product-item" data-provider="adityabirla" data-product-type="EMI_PROTECT" data-product="EMI_PROTECT" data-base-product-id="${productId}">
                    <input type="radio" id="general-emi-adityabirla" data-product-id="${productId}-adityabirla" name="general-emi-providers">
                    <label for="general-emi-adityabirla">
                        <i class="fas fa-credit-card"></i> Aditya Birla - EMI Protect
                    </label>
                    <span class="product-price" data-price="0">-</span>
                </div>
                <div class="product-item" data-provider="godigit" data-product-type="EMI_PROTECT" data-coverage="EMI" data-base-product-id="${productId}">
                    <input type="radio" id="general-emi-godigit" data-product-id="${productId}-godigit" name="general-emi-providers">
                    <label for="general-emi-godigit">
                        <i class="fas fa-credit-card"></i> Go Digit - EMI Protect
                    </label>
                    <span class="product-price" data-price="0">-</span>
                </div>
            `;
        }
        
        if (optionsHTML) {
            container.innerHTML = optionsHTML;
            if (productTitle) {
                productTitle.textContent = titleText;
            }
            providerOptions.style.display = 'block';
            
            // Attach event listeners to the new checkboxes
            this.attachProductListeners();
            
            // Apply Go Digit availability rule for CI/PA/EMI (policy tenure 1-3 only)
            if (productType === 'CI' || productType === 'PA' || productType === 'EMI_PROTECT') {
                this.updateGoDigitGeneralInsuranceVisibility(productType);
            }
        } else {
            providerOptions.style.display = 'none';
        }
    }

    updateGoDigitGeneralInsuranceVisibility(productType) {
        try {
            const container = document.getElementById('generalInsuranceProducts');
            if (!container) return;

            const goDigitItem = container.querySelector(`.product-item[data-provider="godigit"][data-product-type="${productType}"]`);
            if (!goDigitItem) return;

            // If any member has selected tenure > 3 for this product type, hide Go Digit option
            const allMembers = document.querySelectorAll('.member-section');
            let hasTenureOver3 = false;
            let hasAnyTenure = false;

            allMembers.forEach(memberSection => {
                const memberId = memberSection.dataset.memberId;
                if (!memberId) return;

                const tenureElId =
                    productType === 'CI'
                        ? `${memberId}-ciPolicyTenure`
                        : productType === 'PA'
                            ? `${memberId}-paPolicyTenure`
                            : `${memberId}-emiPolicyTenure`;

                const tenureVal = parseInt(document.getElementById(tenureElId)?.value) || 0;
                if (tenureVal > 0) hasAnyTenure = true;
                if (tenureVal > 3) hasTenureOver3 = true;
            });

            const shouldShowGoDigit = (!hasAnyTenure) || (!hasTenureOver3);
            goDigitItem.style.display = shouldShowGoDigit ? '' : 'none';

            // If Go Digit was selected and is now hidden, switch to Aditya Birla automatically
            const goDigitInput = goDigitItem.querySelector('input[type="radio"]');
            if (!shouldShowGoDigit && goDigitInput && goDigitInput.checked) {
                const adityaItem = container.querySelector(`.product-item[data-provider="adityabirla"][data-product-type="${productType}"]`);
                const adityaInput = adityaItem?.querySelector('input[type="radio"]');
                if (adityaInput) {
                    adityaInput.click();
                } else {
                    goDigitInput.checked = false;
                    goDigitItem.classList.remove('checked');
                    this.selectedGeneralInsuranceProduct = null;
                }
            }
        } catch (e) {
            console.error('Failed to update Go Digit General Insurance visibility:', e);
        }
    }
    
    handleGeneralInsuranceProviderSelection(productId, productItem, isChecked) {
        const baseProductId = productItem.dataset.baseProductId;
        const provider = productItem.dataset.provider;
        const productType = productItem.dataset.productType;
        
        if (isChecked) {
            // For radio buttons (CI, PA, EMI_PROTECT), uncheck other options in the same group first
            if (productType === 'CI' || productType === 'PA' || productType === 'EMI_PROTECT') {
                // Determine the radio group name based on product type
                let radioGroupName = '';
                if (productType === 'CI') {
                    radioGroupName = 'general-ci-providers';
                } else if (productType === 'PA') {
                    radioGroupName = 'general-pa-providers';
                } else if (productType === 'EMI_PROTECT') {
                    radioGroupName = 'general-emi-providers';
                }
                
                // Find all radio buttons in the same group and uncheck others
                const allRadioButtons = document.querySelectorAll(`input[name="${radioGroupName}"]`);
                allRadioButtons.forEach(radio => {
                    if (radio !== productItem.querySelector('input[type="radio"]')) {
                        radio.checked = false;
                        const otherProductItem = radio.closest('.product-item');
                        if (otherProductItem) {
                            otherProductItem.classList.remove('checked');
                            // Remove calculations for the unselected provider
                            const otherProvider = otherProductItem.dataset.provider;
                            const itemsToRemove = [];
                            this.selectedItems.forEach((item, itemId) => {
                                if (itemId.startsWith(baseProductId) && itemId.includes(otherProvider)) {
                                    itemsToRemove.push(itemId);
                                } else if (item.baseProductId === baseProductId && item.provider === otherProvider) {
                                    itemsToRemove.push(itemId);
                                }
                            });
                            itemsToRemove.forEach(itemId => {
                                this.removeProduct(itemId);
                            });
                        }
                    }
                });
            }
            
            // Store selected provider for calculation
            this.selectedGeneralInsuranceProduct = {
                productId: baseProductId, // Use base product ID (e.g., "general-ci")
                providerProductId: productId, // Use provider-specific ID (e.g., "general-ci-godigit")
                productItem: productItem,
                provider: provider,
                product: productItem.dataset.product,
                coverage: productItem.dataset.coverage,
                productType: productType
            };
            
            // Trigger calculation if form fields are filled
            this.recalculateGeneralInsuranceIfReady();
        } else {
            // Unchecked - remove this provider's calculations
            // Remove items for this specific provider
            const itemsToRemove = [];
            this.selectedItems.forEach((item, itemId) => {
                // Check if this item belongs to this provider and base product
                if (itemId.startsWith(baseProductId) && itemId.includes(provider)) {
                    itemsToRemove.push(itemId);
                } else if (item.baseProductId === baseProductId && item.provider === provider) {
                    itemsToRemove.push(itemId);
                }
            });
            
            itemsToRemove.forEach(itemId => {
                this.removeProduct(itemId);
            });
            
            // Clear selection if this was the only selected provider
            const remainingProviders = document.querySelectorAll(`input[data-product-id^="${baseProductId}"]:checked`);
            if (remainingProviders.length === 0) {
                this.selectedGeneralInsuranceProduct = null;
            }
            
            // Update UI
            this.updateSelectedItemsDisplay();
            this.updateTotal();
        }
    }
    
    clearGeneralInsuranceSelection() {
        this.selectedGeneralInsuranceProduct = null;
        const dropdown = document.getElementById('generalInsuranceProductSelect');
        if (dropdown) {
            dropdown.value = '';
        }
        
        // Hide provider options
        const providerOptions = document.getElementById('generalInsuranceProviderOptions');
        if (providerOptions) {
            providerOptions.style.display = 'none';
        }
        
        // Hide all product-specific field sections for all members
        document.querySelectorAll('.member-section').forEach(memberSection => {
            const memberId = memberSection.dataset.memberId;
            if (!memberId) return;
            
            const ciFields = document.getElementById(`${memberId}-ciFields`);
            const paFields = document.getElementById(`${memberId}-paFields`);
            const emiFields = document.getElementById(`${memberId}-emiFields`);
            
            if (ciFields) ciFields.style.display = 'none';
            if (paFields) paFields.style.display = 'none';
            if (emiFields) emiFields.style.display = 'none';
        });
        
        // Uncheck all provider checkboxes and radio buttons
        document.querySelectorAll('#generalInsuranceProducts input[type="checkbox"], #generalInsuranceProducts input[type="radio"]').forEach(input => {
            input.checked = false;
            const productItem = input.closest('.product-item');
            if (productItem) {
                productItem.classList.remove('checked');
            }
        });
        
        // Hide EMI fields
        document.querySelectorAll('.general-insurance-fields').forEach(field => {
            const emiField = field.querySelector('.form-row[id$="-generalEmiField"]');
            if (emiField) {
                emiField.style.display = 'none';
            }
        });
        
        // Remove all General Insurance items from selected items
        const itemsToRemove = [];
        this.selectedItems.forEach((item, itemId) => {
            if (itemId.startsWith('general-')) {
                itemsToRemove.push(itemId);
            }
        });
        itemsToRemove.forEach(itemId => {
            this.removeProduct(itemId);
        });
        
        // Update UI
        this.updateSelectedItemsDisplay();
        this.updateTotal();
    }
    
    recalculateGeneralInsuranceIfReady() {
        if (!this.selectedGeneralInsuranceProduct) return;
        
        // Check if at least one member has required fields filled
        const allMembers = document.querySelectorAll('.member-section');
        let hasValidMember = false;
        
        allMembers.forEach(memberSection => {
            const memberId = memberSection.dataset.memberId;
            if (memberId) {
                const memberData = this.getMemberData(memberId);
                const { age, generalSumInsured, generalPolicyTenure, generalEmiAmount } = memberData;
                const productType = this.selectedGeneralInsuranceProduct.productType;
                
                const isEmiProduct = (productType === 'EMI_PROTECT');
                if (isEmiProduct) {
                    // EMI Protect: only needs age, policy tenure, and EMI amount (no sum insured)
                    if (age && age > 0 && generalPolicyTenure && generalPolicyTenure > 0 && generalEmiAmount && generalEmiAmount > 0) {
                        hasValidMember = true;
                    }
                } else {
                    // CI/PA: need age, sum insured, and policy tenure
                    if (age && age > 0 && generalSumInsured && generalSumInsured > 0 && generalPolicyTenure && generalPolicyTenure > 0) {
                        hasValidMember = true;
                    }
                }
            }
        });
        
        if (hasValidMember) {
            // Trigger calculation
            console.log('Triggering General Insurance calculation...');
            this.handleGeneralInsuranceCalculate();
        } else {
            console.log('General Insurance fields not complete yet');
        }
    }
    
    uncheckAllProductsInProvider(provider) {
        // Find all product items with the specified provider
        const allProductsInProvider = document.querySelectorAll(`.product-item[data-provider="${provider}"]`);
        
        // Get base product IDs from the provider's products
        const baseProductIds = [];
        allProductsInProvider.forEach(item => {
            const itemInput = item.querySelector('input[type="radio"], input[type="checkbox"]');
            if (itemInput && itemInput.dataset.productId) {
                baseProductIds.push(itemInput.dataset.productId);
            }
        });
        
        // Remove all selected items from this provider from selectedItems
        // This includes items with member-specific IDs (e.g., bajajlife-5-member-1)
        const itemsToRemove = [];
        this.selectedItems.forEach((item, itemId) => {
            // Check if item belongs to this provider by checking baseProductId or itemId prefix
            const belongsToProvider = item.baseProductId && baseProductIds.includes(item.baseProductId) ||
                                    baseProductIds.some(baseId => itemId.startsWith(baseId));
            
            if (belongsToProvider) {
                itemsToRemove.push(itemId);
            }
        });
        
        // Remove items from selectedItems
        itemsToRemove.forEach(itemId => {
            this.removeProduct(itemId);
        });
        
        // Uncheck all inputs in this provider group
        allProductsInProvider.forEach(item => {
            const itemInput = item.querySelector('input[type="radio"], input[type="checkbox"]');
            if (itemInput) {
                itemInput.checked = false;
                item.classList.remove('checked');
                
                // Reset price display
                const priceSpan = item.querySelector('.product-price');
                if (priceSpan) {
                    priceSpan.textContent = '-';
                    priceSpan.dataset.price = '0';
                }
            }
        });
        
        // Update display if items were removed
        if (itemsToRemove.length > 0) {
            this.updateSelectedItemsDisplay();
            this.updateTotal();
        }
    }
    
    uncheckOtherProductsInProviderGroup(provider, currentProductId) {
        // Find all product items with the same provider
        const allProductsInGroup = document.querySelectorAll(`.product-item[data-provider="${provider}"]`);
        
        // Remove previously selected items from the same provider from selectedItems
        // For sections with multiple members (life, general, mayaa), we need to remove member-specific items too
        const itemsToRemove = [];
        this.selectedItems.forEach((item, itemId) => {
            // Check if this item belongs to the same provider
            // For member-specific IDs, extract the base product ID and check provider
            let itemBaseProductId = itemId;
            if (item.baseProductId) {
                itemBaseProductId = item.baseProductId;
            } else if (itemId.includes('-member-')) {
                itemBaseProductId = itemId.split('-member-')[0];
            }
            
            // Extract provider from base product ID (e.g., "bajajlife-3-member-1" -> "bajajlife")
            const itemProvider = itemBaseProductId.split('-')[0];
            const currentProvider = currentProductId.split('-')[0];
            
            // Remove all items from the same provider (except the current one)
            if (itemProvider === currentProvider && itemBaseProductId !== currentProductId) {
                itemsToRemove.push(itemId);
            }
        });
        
        // Remove items from selectedItems
        itemsToRemove.forEach(itemId => {
            this.removeProduct(itemId);
        });
        
        // Uncheck all other inputs in the same provider group
        allProductsInGroup.forEach(item => {
            const itemInput = item.querySelector('input[type="checkbox"], input[type="radio"]');
            const itemProductId = itemInput?.dataset.productId;
            
            if (itemProductId && itemProductId !== currentProductId) {
                itemInput.checked = false;
                item.classList.remove('checked');
                
                // Reset price display
                const priceSpan = item.querySelector('.product-price');
                if (priceSpan) {
                    // Check if it has a data-price attribute set to 0 (meaning it was calculated)
                    if (priceSpan.dataset.price === '0' || priceSpan.textContent !== '-') {
                        priceSpan.textContent = '-';
                        priceSpan.dataset.price = '0';
                    }
                }
            }
        });
        
        // Update display if items were removed
        if (itemsToRemove.length > 0) {
            this.updateSelectedItemsDisplay();
            this.updateTotal();
        }
    }

    async calculateAndAddProduct(productId, productItem) {
        console.log('calculateAndAddProduct called', { productId, productItem });
        
        const provider = productItem.dataset.provider;
        const input = productItem.querySelector('input[type="checkbox"], input[type="radio"]');
        
        console.log('Provider:', provider, 'Input:', input);
        
        // Get data from active member
        // The active member is set when user clicks on a member section
        // For Life Insurance with max 2 members, calculations use the active member's data
        const memberData = this.getMemberData(this.activeMemberId);
        const { age, sumInsured, loanAmount, loanTenure, policyYear, emiAmount, coverTermMonths, coverTermYears, lifeType, secondLifeAge, propertySumInsured, propertyPolicyTenure, policyTenure } = memberData;
        
        console.log('Calculating premium for:', {
            activeMemberId: this.activeMemberId,
            memberData: memberData,
            provider: provider,
            productId: productId
        });
        
        // Debug: Log product item info
        console.log('calculateAndAddProduct - productId:', productId, 'provider:', provider, 'productItem:', productItem, 'data-term:', productItem.dataset.term);
        
        // Validation: 
        // - Mayaa has fixed prices, no validation needed
        // - Property Insurance only requires Sum Insured
        // - Other insurance types require both Age and Sum Insured
        if (provider === 'mayaa') {
            // Mayaa has fixed prices, no validation needed
            console.log('Mayaa plan selected, no validation required (fixed prices)');
        } else if (provider === 'property') {
            // Property Insurance uses its own fields (propertySumInsured, propertyPolicyTenure)
            console.log('Property Insurance validation:', { 
                propertySumInsured, 
                propertyPolicyTenure, 
                memberData: memberData,
                activeMemberId: this.activeMemberId
            });
            
            if (!propertySumInsured || propertySumInsured <= 0) {
                console.log('Validation failed: Property Sum Insured missing or invalid', { propertySumInsured, memberData });
                this.showError('Please enter valid Sum Insured in Property Insurance Details');
                if (input) input.checked = false;
                return;
            }
            
            if (!propertyPolicyTenure || propertyPolicyTenure < 1 || propertyPolicyTenure > 3) {
                console.log('Validation failed: Property Policy Tenure missing or invalid', { propertyPolicyTenure, memberData });
                this.showError('Please select Policy Tenure (1, 2, or 3 years) in Property Insurance Details');
                if (input) input.checked = false;
                return;
            }
        } else {
            if (!age || !sumInsured || age <= 0 || sumInsured <= 0) {
                console.log('Validation failed: Age or Sum Insured missing or invalid', { age, sumInsured });
                this.showError('Please enter valid Age and Sum Insured in Personal Information');
                if (input) input.checked = false;
                return;
            }
        }

        try {
            console.log('Starting premium calculation...');
            this.showLoading(true);
            let premiumData = null;

            if (provider === 'mayaa') {
                // Mayaa has fixed prices - no API call needed
                const planName = productItem.dataset.plan;
                const prices = { PlanA: 2000, PlanB: 3000, PlanC: 4000, PlanD: 5000 };
                
                console.log('Mayaa Plan Calculation:', {
                    productId: productId,
                    planName: planName,
                    price: prices[planName]
                });
                
                premiumData = {
                    premiumExclGst: prices[planName],
                    premiumInclGst: prices[planName] * 1.18,
                    provider: 'Mayaa',
                    productName: planName
                };
                
                console.log('Mayaa premium calculated:', premiumData);
            } else if (provider === 'bajajlife') {
                // Prioritize individual member's policyTenure/coverTermYears, then fall back to product item term
                // Each member should have their own Sum Insured and Policy Tenure
                const term = coverTermYears || parseInt(productItem.dataset.term) || 1;
                premiumData = await this.calculateBajajLife(age, sumInsured, term);
                premiumData.productName = `Bajaj Life - ${term} Year${term > 1 ? 's' : ''}`;
            } else if (provider === 'godigitlife') {
                // Prioritize individual member's policyTenure (convert years to months) or coverTermMonths
                // Each member should have their own Sum Insured and Policy Tenure
                let term = null;
                
                // First, prioritize individual member's coverTermMonths (if exists), otherwise convert policyTenure to months
                if (coverTermMonths && coverTermMonths > 0) {
                    term = coverTermMonths;
                } else if (policyTenure && policyTenure > 0) {
                    // Convert policyTenure (years) to months for Go Digit Life
                    // Go Digit Life accepts 12, 24, or 36 months (1, 2, or 3 years)
                    term = policyTenure * 12;
                    // Validate: only allow 1, 2, or 3 years (12, 24, 36 months)
                    if (term !== 12 && term !== 24 && term !== 36) {
                        this.showError('Policy Tenure must be 1, 2, or 3 years for Go Digit Life');
                        if (input) {
                            input.checked = false;
                            productItem.classList.remove('checked');
                        }
                        return;
                    }
                } else if (productItem && productItem.dataset && productItem.dataset.term) {
                    term = parseInt(productItem.dataset.term);
                } else if (productId) {
                // If not found, try to extract from productId (format: godigitlife-{term}-{lifetype})
                // Example: godigitlife-12-single, godigitlife-24-single, godigitlife-36-single
                    const parts = productId.split('-');
                    if (parts.length >= 2 && !isNaN(parts[1])) {
                        term = parseInt(parts[1]);
                    }
                }
                
                // Fallback to default
                if (!term || isNaN(term)) {
                    term = 12;
                }
                
                // Debug: Log the term being used
                console.log('Go Digit Life Calculation:', {
                    productId: productId,
                    productItemDataSetTerm: productItem?.dataset?.term,
                    extractedTerm: term,
                    age: age,
                    sumInsured: sumInsured
                });
                
                const selectedLifeType = lifeType;
                if (selectedLifeType === 'JOINT' && !secondLifeAge) {
                    this.showError('Please enter Second Life Age for Joint Life');
                    if (input) {
                        input.checked = false;
                        productItem.classList.remove('checked');
                    }
                    return;
                }
                premiumData = await this.calculateGoDigitLife(age, sumInsured, term, selectedLifeType, secondLifeAge);
                premiumData.productName = `Go Digit Life - ${term} Months (${selectedLifeType === 'SINGLE' ? 'Single' : 'Joint'})`;
            } else if (provider === 'adityabirla') {
                const product = productItem.dataset.product;
                if (!loanTenure) {
                    this.showError('Please enter Loan Tenure for General Insurance');
                    if (input) {
                        input.checked = false;
                        productItem.classList.remove('checked');
                    }
                    return;
                }
                if (product === 'EMI_PROTECT' && !emiAmount) {
                    this.showError('Please enter EMI Amount for EMI Protect');
                    if (input) {
                        input.checked = false;
                        productItem.classList.remove('checked');
                    }
                    return;
                }
                premiumData = await this.calculateAdityaBirla(age, loanAmount, loanTenure, product, emiAmount);
                premiumData.productName = product;
            } else if (provider === 'godigit') {
                const coverage = productItem.dataset.coverage;
                const selectedPolicyYear = policyYear || Math.min(loanTenure || 1, 3);
                if (!loanTenure) {
                    this.showError('Please enter Loan Tenure for General Insurance');
                    if (input) {
                        input.checked = false;
                        productItem.classList.remove('checked');
                    }
                    return;
                }
                if (coverage === 'EMI' && !emiAmount) {
                    this.showError('Please enter EMI Amount for EMI coverage');
                    if (input) {
                        input.checked = false;
                        productItem.classList.remove('checked');
                    }
                    return;
                }
                premiumData = await this.calculateGoDigit(age, loanAmount, selectedPolicyYear, coverage, emiAmount);
                premiumData.productName = `Go Digit ${coverage}`;
            } else if (provider === 'property') {
                // Use Property Insurance specific fields
                // Use the year from the selected product item, or use propertyPolicyTenure
                let year = null;
                
                // First, try to get year from the productItem div's data-year attribute
                if (productItem && productItem.dataset && productItem.dataset.year) {
                    year = parseInt(productItem.dataset.year);
                }
                
                // If not found, try to extract from productId (format: property-{year})
                if ((!year || isNaN(year)) && productId) {
                    const parts = productId.split('-');
                    if (parts.length >= 2 && !isNaN(parts[1])) {
                        year = parseInt(parts[1]);
                    }
                }
                
                // Fallback to propertyPolicyTenure from form field
                if (!year || isNaN(year)) {
                    year = propertyPolicyTenure || 1;
                }
                
                console.log('Property Insurance Calculation:', {
                    productId: productId,
                    productItemDataSetYear: productItem?.dataset?.year,
                    extractedYear: year,
                    propertySumInsured: propertySumInsured,
                    propertyPolicyTenure: propertyPolicyTenure
                });
                
                premiumData = this.calculateProperty(propertySumInsured, year);
                premiumData.productName = `Property Insurance - Year ${year}`;
            }

            if (premiumData) {
                premiumData.memberId = this.activeMemberId; // Store which member this belongs to
                this.selectedItems.set(productId, premiumData);
                // Update price display
                const priceSpan = productItem.querySelector('.product-price');
                if (priceSpan) {
                    priceSpan.textContent = this.formatCurrency(premiumData.premiumInclGst);
                }
                // Update UI
                productItem.classList.add('checked');
                this.updateSelectedItemsDisplay();
                this.updateTotal();
            } else {
                // If calculation failed, uncheck the input
                if (input) {
                    input.checked = false;
                    productItem.classList.remove('checked');
                }
            }
        } catch (error) {
            console.error('Error calculating premium:', error);
            this.showError('Failed to calculate premium. Please check your inputs.');
            if (input) {
                input.checked = false;
                const productItem = input.closest('.product-item');
                if (productItem) {
                    productItem.classList.remove('checked');
                }
            }
        } finally {
            this.showLoading(false);
        }
    }

    removeProduct(productId) {
        this.selectedItems.delete(productId);
    }

    updateSelectedItemsDisplay() {
        const container = document.getElementById('selectedItemsList');
        
        if (this.selectedItems.size === 0) {
            container.innerHTML = '<p class="empty-message">No items selected</p>';
            return;
        }

        container.innerHTML = Array.from(this.selectedItems.entries()).map(([id, data]) => {
            // Get member name instead of member number
            let memberDisplayName = '';
            if (data.memberId) {
                const memberData = this.getMemberData(data.memberId);
                const memberName = memberData.name && memberData.name.trim() ? memberData.name.trim() : '';
                if (memberName) {
                    memberDisplayName = memberName;
                } else {
                    // Fallback to member number if name is not available
                    const memberNum = data.memberId.replace('member-', '');
                    memberDisplayName = `Member ${memberNum}`;
                }
            } else {
                memberDisplayName = 'Member 1';
            }
            
            return `
            <div class="selected-item">
                <div class="selected-item-info">
                    <div class="selected-item-name">${data.productName || id}</div>
                    <div class="selected-item-details">${data.provider || ''} - ${memberDisplayName}</div>
                </div>
                <div class="selected-item-price">${this.formatCurrency(data.premiumInclGst)}</div>
                <button class="remove-item-btn" onclick="window.premiumComparison.removeSelectedItem('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        }).join('');
    }

    removeSelectedItem(productId) {
        this.selectedItems.delete(productId);
        
        // Check if this is a member-specific product ID (format: baseProductId-member-X)
        const baseProductId = productId.includes('-member-') ? productId.split('-member-')[0] : productId;
        
        // For Life Insurance, General Insurance, and Mayaa: check if we need to uncheck the base product when all member items are removed
        if ((this.currentSection === 'life' || this.currentSection === 'general' || this.currentSection === 'mayaa') && productId.includes('-member-')) {
            // Count remaining items with the same base product ID
            const remainingItems = Array.from(this.selectedItems.keys()).filter(id => {
                const item = this.selectedItems.get(id);
                return (id.startsWith(baseProductId) && id.includes('-member-')) || 
                       (item && item.baseProductId === baseProductId);
            });
            
            // If no items remain for this base product, uncheck the radio button
            if (remainingItems.length === 0) {
                const checkbox = document.querySelector(`input[data-product-id="${baseProductId}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                    const productItem = checkbox.closest('.product-item');
                    if (productItem) {
                        productItem.classList.remove('checked');
                        // Reset price display
                        const priceSpan = productItem.querySelector('.product-price');
                        if (priceSpan) {
                            priceSpan.textContent = '-';
                            priceSpan.dataset.price = '0';
                        }
                    }
                }
            } else {
                // Update price display to show remaining member count
                const checkbox = document.querySelector(`input[data-product-id="${baseProductId}"]`);
                if (checkbox) {
                    const productItem = checkbox.closest('.product-item');
                    if (productItem) {
                        const priceSpan = productItem.querySelector('.product-price');
                        if (priceSpan && remainingItems.length > 1) {
                            priceSpan.textContent = `${remainingItems.length} members`;
                        }
                    }
                }
            }
        } else {
            // For other sections, uncheck normally
            const checkbox = document.querySelector(`input[data-product-id="${productId}"]`);
            if (checkbox) {
                checkbox.checked = false;
                const productItem = checkbox.closest('.product-item');
                if (productItem) {
                    productItem.classList.remove('checked');
                    // Reset price display
                    const priceSpan = productItem.querySelector('.product-price');
                    if (priceSpan && priceSpan.dataset.price === '0') {
                        priceSpan.textContent = '-';
                    }
                }
            }
        }
        
        this.updateSelectedItemsDisplay();
        this.updateTotal();
    }

    updateTotal() {
        let subtotal = 0;
        
        this.selectedItems.forEach(item => {
            subtotal += item.premiumExclGst || 0;
        });

        const gst = subtotal * 0.18;
        const total = subtotal + gst;

        document.getElementById('subtotalExclGst').textContent = this.formatCurrency(subtotal);
        document.getElementById('gstAmount').textContent = this.formatCurrency(gst);
        document.getElementById('totalInclGst').textContent = this.formatCurrency(total);
    }

    recalculateSelectedItems() {
        // Recalculate all selected items
        const selectedIds = Array.from(this.selectedItems.keys());
        selectedIds.forEach(id => {
            const input = document.querySelector(`input[data-product-id="${id}"]`);
            if (input && input.checked) {
                const productItem = input.closest('.product-item');
                this.calculateAndAddProduct(id, productItem);
            }
        });
    }

    // API Calculation Methods
    async calculateBajajLife(age, sumInsured, termYears) {
        // Note: Despite the field name "coverTermMonths", the backend rate table
        // uses keys 1-15 which represent years, not months
        const request = {
            entryAge: age,
            sumAssured: sumInsured,
            coverTermMonths: termYears  // Send years directly (1, 2, or 3)
        };

        const response = await fetch(this.apiUrls.bajajlife, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) throw new Error('Bajaj Life calculation failed');
        const data = await response.json();
        
        return {
            premiumExclGst: data.premiumExclGst,
            premiumInclGst: data.premiumInclGst,
            provider: 'Bajaj Life'
        };
    }

    async calculateGoDigitLife(age, sumInsured, termMonths, lifeType, secondLifeAge = null) {
        const request = {
            entryAge: age,
            sumAssured: sumInsured,
            coverTermMonths: termMonths,
            lifeType: lifeType
        };
        
        if (lifeType === 'JOINT' && secondLifeAge) {
            request.secondLifeAge = secondLifeAge;
        }

        console.log('Calling Go Digit Life API:', {
            url: this.apiUrls.godigitlife,
            request: request
        });

        const response = await fetch(this.apiUrls.godigitlife, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        console.log('API Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error('Go Digit Life calculation failed: ' + errorText);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        return {
            premiumExclGst: data.premiumExclGst,
            premiumInclGst: data.premiumInclGst,
            provider: 'Go Digit Life'
        };
    }

    async calculateAdityaBirla(age, loanAmount, loanTenure, product, emiAmount = 0) {
        const request = {
            age: age,
            loanAmount: loanAmount,
            loanTenure: loanTenure,
            emiAmount: emiAmount,
            products: [product]
        };

        const response = await fetch(this.apiUrls.adityabirla, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) throw new Error('Aditya Birla calculation failed');
        const data = await response.json();
        
        // Get the specific premium for the requested product, or use totalPremium
        let premiumInclGst = data.totalPremium;
        if (product === 'GCI' && data.gciPremium) {
            premiumInclGst = data.gciPremium;
        } else if (product === 'GPA' && data.gpaPremium) {
            premiumInclGst = data.gpaPremium;
        } else if (product === 'EMI_PROTECT' && data.emiProtectPremium) {
            premiumInclGst = data.emiProtectPremium;
        }
        
        // Calculate premium excl GST from incl GST
        const premiumExclGst = premiumInclGst / 1.18;
        
        return {
            premiumExclGst: premiumExclGst,
            premiumInclGst: premiumInclGst,
            provider: 'Aditya Birla'
        };
    }

    async calculateGoDigit(age, loanAmount, policyYear, coverage, emiAmount = 0) {
        const request = {
            age: age,
            loanAmount: loanAmount,
            policyYear: policyYear,
            emiAmount: emiAmount,
            coverages: [coverage]
        };

        const response = await fetch(this.apiUrls.godigit, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) throw new Error('Go Digit calculation failed');
        const data = await response.json();
        
        return {
            premiumExclGst: data.totalPremium,
            premiumInclGst: data.totalPremiumInclGst,
            provider: 'Go Digit'
        };
    }

    calculateProperty(sumInsured, year) {
        const RATE_PER_MILLE = { 1: 0.58, 2: 1.16, 3: 1.74 };
        const rate = RATE_PER_MILLE[year];
        const premiumExclGst = (sumInsured / 1000) * rate;
        const premiumInclGst = premiumExclGst * 1.18;
        
        return {
            premiumExclGst: Math.round(premiumExclGst * 100) / 100,
            premiumInclGst: Math.round(premiumInclGst * 100) / 100,
            provider: 'Digit Flexi Griha'
        };
    }

    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
        return `₹${parseFloat(amount).toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }

    formatNumber(num) {
        return parseFloat(num).toLocaleString('en-IN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    }

    showLoading(show) {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        if (this.errorText) {
            this.errorText.textContent = message;
            if (this.errorMessage) {
                this.errorMessage.style.display = 'flex';
                setTimeout(() => {
                    this.hideError();
                }, 5000);
            }
        }
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }
    
    handleClearClick() {
        // Show confirmation modal
        this.showConfirmationModal(
            'Clear All Selections',
            'Are you sure you want to clear all selected items? This action cannot be undone.',
            () => {
                // User confirmed - clear all selections
                this.clearAllSelections();
                this.hideConfirmationModal();
            }
        );
    }
    
    handleProceedClick() {
        // Check if there are any selected items
        if (this.selectedItems.size === 0) {
            this.showError('Please select at least one insurance product before proceeding.');
            return;
        }
        
        // Show nominee form modal
        this.showNomineeModal();
    }
    
    clearAllSelections() {
        // Clear all selected items
        this.selectedItems.clear();
        
        // Uncheck all product inputs
        document.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').forEach(input => {
            input.checked = false;
            const productItem = input.closest('.product-item');
            if (productItem) {
                productItem.classList.remove('checked');
                // Reset price display
                const priceSpan = productItem.querySelector('.product-price');
                if (priceSpan) {
                    priceSpan.textContent = '-';
                    priceSpan.dataset.price = '0';
                }
            }
        });
        
        // Update UI
        this.updateSelectedItemsDisplay();
        this.updateTotal();
        
        console.log('All selections cleared');
    }
    
    showConfirmationModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        
        if (modal && modalTitle && modalMessage && confirmBtn) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            
            // Store the onConfirm callback in the modal's dataset for later use
            modal.dataset.onConfirm = 'pending';
            
            // Remove any existing event listener and add new one
            const handleConfirm = () => {
                if (onConfirm) {
                    onConfirm();
                }
                confirmBtn.removeEventListener('click', handleConfirm);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    hideConfirmationModal() {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    showComingSoonModal() {
        const modal = document.getElementById('comingSoonModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    hideComingSoonModal() {
        const modal = document.getElementById('comingSoonModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    showNomineeModal() {
        const modal = document.getElementById('nomineeModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            // Reset form if needed
            const form = document.getElementById('nomineeForm');
            if (form) {
                form.reset();
            }
        }
    }
    
    hideNomineeModal() {
        const modal = document.getElementById('nomineeModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    generatePDF() {
        // Check if jsPDF is loaded
        if (!window.jspdf) {
            this.showError('PDF library not loaded. Please refresh the page and try again.');
            console.error('jsPDF library not found');
            return;
        }
        
        // Validate nominee form
        const form = document.getElementById('nomineeForm');
        if (!form) {
            this.showError('Nominee form not found.');
            console.error('Nominee form element not found');
            return;
        }
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        try {
            console.log('Starting PDF generation...');
        
        // Get nominee data
        const nomineeData = {
            name: document.getElementById('nomineeName').value,
            relationship: document.getElementById('nomineeRelationship').value,
            dob: document.getElementById('nomineeDob').value
        };
        
        // Get all member data
        const allMembersData = [];
        const memberSections = document.querySelectorAll('.member-section');
        memberSections.forEach(section => {
            const memberId = section.dataset.memberId;
            if (memberId) {
                const memberData = this.getMemberData(memberId);
                allMembersData.push({
                    memberId: memberId,
                    ...memberData
                });
            }
        });
        
        // Get selected items grouped by member
        const selectedItemsByMember = new Map();
        this.selectedItems.forEach((item, productId) => {
            const memberId = item.memberId || 'member-1';
            if (!selectedItemsByMember.has(memberId)) {
                selectedItemsByMember.set(memberId, []);
            }
            selectedItemsByMember.get(memberId).push({
                productId: productId,
                ...item
            });
        });
        
        // Get totals - extract numeric values
        const subtotalText = document.getElementById('subtotalExclGst')?.textContent || '₹0.00';
        const gstText = document.getElementById('gstAmount')?.textContent || '₹0.00';
        const totalText = document.getElementById('totalInclGst')?.textContent || '₹0.00';
        
        // Extract numeric values from currency strings
        const extractNumber = (str) => {
            return parseFloat(str.replace(/[₹,\s]/g, '')) || 0;
        };
        
        const subtotalExclGst = extractNumber(subtotalText);
        const gstAmount = extractNumber(gstText);
        const totalInclGst = extractNumber(totalText);
        
        // Generate PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        const primaryColor = [102, 126, 234]; // Purple-blue
        const secondaryColor = [59, 130, 246]; // Blue
        const accentColor = [16, 185, 129]; // Green
        const textColor = [31, 41, 55]; // Dark gray
        const lightGray = [243, 244, 246];
        const darkGray = [107, 114, 128];
        
        // Track page numbers for sections
        const sectionPages = {
            cover: 1,
            personalInfo: 0,
            insuranceProducts: 0,
            totalCalculation: 0,
            nomineeInfo: 0
        };
        
        let currentPage = 1;
        let yPos = 0;
        
        // Helper: Add new page
        const addPage = () => {
            doc.addPage();
            currentPage++;
            addHeaderFooter();
            // Start content below header with proper spacing (header line at 15, add gap of 20)
            yPos = 35; // Header line at 15 + 20px gap = 35
        };
        
        // Helper: Add header and footer
        const addHeaderFooter = () => {
            const pageNum = currentPage;
            const totalPages = doc.internal.pages.length - 1;
            
            // Header line
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.5);
            doc.line(margin, 15, pageWidth - margin, 15);
            
            // Footer line
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
            
            // Page number
            doc.setFontSize(9);
            doc.setTextColor(...darkGray);
            doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Document title in header
            doc.setFontSize(8);
            doc.setTextColor(...primaryColor);
            doc.setFont(undefined, 'bold');
            doc.text('Insurance Premium Calculation Summary', margin, 12);
            
            // Date in header
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...darkGray);
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            doc.text(dateStr, pageWidth - margin, 12, { align: 'right' });
        };
        
        // Helper: Add text with proper formatting
        const addText = (text, x, y, options = {}) => {
            const fontSize = options.fontSize || 10;
            const fontStyle = options.fontStyle || 'normal';
            const color = options.color || textColor;
            const align = options.align || 'left';
            const maxWidth = options.maxWidth || contentWidth;
            
            doc.setFontSize(fontSize);
            doc.setFont(undefined, fontStyle);
            doc.setTextColor(...color);
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y, { align: align });
            return lines.length * (fontSize * 0.35 + 2);
        };
        
        // Helper: Add section header with gradient effect
        const addSectionHeader = (title, y) => {
            // Background rectangle
            doc.setFillColor(...primaryColor);
            doc.roundedRect(margin, y - 8, contentWidth, 12, 2, 2, 'F');
            
            // Title text
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(title, margin + 8, y + 2);
            
            // Reset text color
            doc.setTextColor(...textColor);
            
            return y + 10;
        };
        
        // Helper: Add table row
        const addTableRow = (label, value, y, options = {}) => {
            const labelWidth = options.labelWidth || 70;
            const valueWidth = contentWidth - labelWidth - 10;
            const fontSize = options.fontSize || 10;
            const boldLabel = options.boldLabel !== false;
            
            // Label
            doc.setFontSize(fontSize);
            doc.setFont(undefined, boldLabel ? 'bold' : 'normal');
            doc.setTextColor(...darkGray);
            doc.text(label + ':', margin, y);
            
            // Value
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textColor);
            const valueLines = doc.splitTextToSize(value, valueWidth);
            doc.text(valueLines, margin + labelWidth, y);
            
            return valueLines.length * (fontSize * 0.35 + 2);
        };
        
        // Helper: Add divider line
        const addDivider = (y) => {
            doc.setDrawColor(...lightGray);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            return y + 5;
        };
        
        // Helper: Create a professional table
        const createTable = (headers, rows, startY, options = {}) => {
            const colWidths = options.colWidths || [];
            const tableWidth = options.tableWidth || contentWidth;
            const headerHeight = 10;
            const rowHeight = 8;
            const fontSize = options.fontSize || 10;
            const cellPadding = 6; // Padding inside cells
            
            let currentY = startY;
            const numCols = headers.length;
            const defaultColWidth = tableWidth / numCols;
            
            // Calculate column widths
            const actualColWidths = colWidths.length === numCols 
                ? colWidths 
                : Array(numCols).fill(defaultColWidth);
            
            // Draw header - adjusted positioning to reduce top spacing
            doc.setFillColor(...primaryColor);
            doc.roundedRect(margin, currentY - headerHeight + 1, tableWidth, headerHeight, 3, 3, 'F');
            
            doc.setFontSize(fontSize);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            
            let xPos = margin;
            headers.forEach((header, idx) => {
                doc.text(header, xPos + actualColWidths[idx] / 2, currentY, { align: 'center' });
                xPos += actualColWidths[idx];
            });
            
            currentY += 2; // Reduced spacing from 3 to 2
            
            // Draw rows with better padding and alignment
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textColor);
            
            rows.forEach((row, rowIdx) => {
                // Alternate row background
                if (rowIdx % 2 === 0) {
                    doc.setFillColor(...lightGray);
                    doc.rect(margin, currentY - rowHeight + 2, tableWidth, rowHeight, 'F');
                }
                
                xPos = margin;
                row.forEach((cell, colIdx) => {
                    const cellX = xPos + cellPadding;
                    const cellWidth = actualColWidths[colIdx] - (cellPadding * 2);
                    
                    doc.setTextColor(...textColor);
                    if (colIdx === 0) {
                        // First column (Field) - bold and left aligned
                        doc.setFont(undefined, 'bold');
                        doc.setFontSize(fontSize);
                        doc.setTextColor(...darkGray);
                        const cellText = doc.splitTextToSize(cell, cellWidth);
                        doc.text(cellText, cellX, currentY);
                    } else {
                        // Second column (Value) - normal and left aligned
                        doc.setFont(undefined, 'normal');
                        doc.setFontSize(fontSize);
                        doc.setTextColor(...textColor);
                        const cellText = doc.splitTextToSize(cell, cellWidth);
                        doc.text(cellText, cellX, currentY);
                    }
                    xPos += actualColWidths[colIdx];
                });
                
                currentY += rowHeight;
                
                // Draw row border
                doc.setDrawColor(...lightGray);
                doc.setLineWidth(0.3);
                doc.line(margin, currentY - 2, margin + tableWidth, currentY - 2);
            });
            
            // Draw table border with rounded corners - adjusted to match header positioning
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(1);
            doc.roundedRect(margin, startY - headerHeight + 1, tableWidth, currentY - startY + headerHeight - 1, 3, 3);
            
            return currentY + 3; // Reduced spacing after table from 8 to 3
        };
        
        // ========== COVER PAGE ==========
        doc.setPage(1);
        yPos = pageHeight / 2 - 60;
        
        // Main title
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('INSURANCE PREMIUM', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;
        doc.text('CALCULATION SUMMARY', pageWidth / 2, yPos, { align: 'center' });
        
        // Decorative line
        yPos += 15;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
        
        // Subtitle
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...darkGray);
        doc.text('Comprehensive Premium Analysis Report', pageWidth / 2, yPos, { align: 'center' });
        
        // Date
        yPos += 25;
        doc.setFontSize(11);
        const genDate = new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Generated on: ${genDate}`, pageWidth / 2, yPos, { align: 'center' });
        
        // Footer note
        yPos = pageHeight - 40;
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.text('This document contains confidential information', pageWidth / 2, yPos, { align: 'center' });
        doc.text('Please keep it secure', pageWidth / 2, yPos + 5, { align: 'center' });
        
        addHeaderFooter();
        
        // ========== PERSONAL INFORMATION SECTION ==========
        addPage();
        sectionPages.personalInfo = currentPage;
        // yPos is already set to 35 from addPage (below header with gap)
        
        yPos = addSectionHeader('1. PERSONAL INFORMATION', yPos);
        yPos += 5;
        
        allMembersData.forEach((member, index) => {
            if (index > 0) {
                yPos += 15; // Add space between members
            }
            
            // Member header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text(`Member ${member.memberId.replace('member-', '')}`, margin, yPos);
            yPos += 10;
            
            // Build table data for personal information
            const tableRows = [];
            
            // Basic personal details
            tableRows.push(['Name', member.name || 'N/A']);
            tableRows.push(['Age', member.age ? `${member.age} years` : 'N/A']);
            tableRows.push(['Gender', member.gender || 'N/A']);
            tableRows.push(['Email', member.email || 'N/A']);
            tableRows.push(['Mobile', member.mobile || 'N/A']);
            tableRows.push(['Loan Amount', `₹${this.formatNumber(member.loanAmount) || '0'}`]);
            tableRows.push([
                'Loan Type',
                (member.loanType === 'Other' ? (member.loanTypeOther || 'OTHER') : (member.loanType || 'N/A'))
            ]);
            tableRows.push(['Loan Tenure', member.loanTenure ? `${member.loanTenure} years` : 'N/A']);
            
            // Life Insurance details if available
            if (member.sumInsured > 0) {
                tableRows.push(['Life Insurance - Sum Insured', `₹${this.formatNumber(member.sumInsured)}`]);
                tableRows.push(['Life Insurance - Policy Tenure', `${member.policyTenure || 'N/A'} years`]);
            }
            
            // General Insurance details if available
            if (member.generalSumInsured > 0) {
                tableRows.push(['General Insurance - Sum Insured', `₹${this.formatNumber(member.generalSumInsured)}`]);
                tableRows.push(['General Insurance - Policy Tenure', `${member.generalPolicyTenure || 'N/A'} years`]);
                if (member.generalEmiAmount > 0) {
                    tableRows.push(['General Insurance - EMI Amount', `₹${this.formatNumber(member.generalEmiAmount)}`]);
                }
            }

            // Product-wise General Insurance breakdown (CI / PA / EMI), if available
            if (member.ciSumInsured > 0 || member.ciPolicyTenure > 0) {
                tableRows.push(['CI (Critical Illness) - Sum Insured', `₹${this.formatNumber(member.ciSumInsured)}`]);
                tableRows.push(['CI (Critical Illness) - Policy Tenure', `${member.ciPolicyTenure || 'N/A'} years`]);
            }

            if (member.paSumInsured > 0 || member.paPolicyTenure > 0) {
                tableRows.push(['PA (Personal Accident) - Sum Insured', `₹${this.formatNumber(member.paSumInsured)}`]);
                tableRows.push(['PA (Personal Accident) - Policy Tenure', `${member.paPolicyTenure || 'N/A'} years`]);
            }

            if (member.emiPolicyTenure > 0 || member.emiAmount > 0) {
                tableRows.push(['EMI Protect - Policy Tenure', `${member.emiPolicyTenure || 'N/A'} years`]);
                if (member.emiAmount > 0) {
                    tableRows.push(['EMI Protect - EMI Amount', `₹${this.formatNumber(member.emiAmount)}`]);
                }
            }
            
            // Property Insurance details if available
            if (member.propertySumInsured > 0) {
                tableRows.push(['Property Insurance - Sum Insured', `₹${this.formatNumber(member.propertySumInsured)}`]);
                tableRows.push(['Property Insurance - Policy Tenure', `${member.propertyPolicyTenure || 'N/A'} years`]);
            }
            
            // Create table with proper headers and formatting
            const tableHeaders = ['Field', 'Value'];
            const colWidths = [90, 100]; // Field column and Value column widths
            yPos = createTable(tableHeaders, tableRows, yPos, { 
                colWidths: colWidths, 
                fontSize: 10,
                tableWidth: contentWidth
            });
            
            yPos += 10;
            
            if (yPos > pageHeight - 40) {
                addPage();
            }
        });
        
        // ========== SELECTED INSURANCE PRODUCTS SECTION ==========
        // Check if we need a new page (need at least 70px for section header + spacing + some content)
        if (yPos > pageHeight - 110) {
            addPage();
        } else {
            // Add spacing between sections if continuing on same page
            yPos += 15;
        }
        sectionPages.insuranceProducts = currentPage;
        
        yPos = addSectionHeader('2. SELECTED INSURANCE PRODUCTS', yPos);
        yPos += 5;
        
        selectedItemsByMember.forEach((items, memberId) => {
            const memberNum = memberId.replace('member-', '');
            
            // Member header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text(`Member ${memberNum} - Selected Products`, margin, yPos);
            yPos += 10;
            
            // Create table for products
            const tableHeaders = ['Product Name', 'Provider', 'Premium (Excl. GST)', 'Premium (Incl. GST)'];
            const tableRows = items.map(item => {
                const premiumExclGst = item.premium || (item.premiumInclGst ? (item.premiumInclGst / 1.18) : 0);
                const premiumInclGst = item.premiumInclGst || item.totalPremium || 0;
                return [
                    item.productName || item.productId,
                    item.provider || 'N/A',
                    `₹${this.formatNumber(premiumExclGst)}`,
                    `₹${this.formatNumber(premiumInclGst)}`
                ];
            });
            
            const colWidths = [80, 50, 60, 60];
            yPos = createTable(tableHeaders, tableRows, yPos, { colWidths: colWidths, fontSize: 9 });
            
            yPos += 10;
            
            if (yPos > pageHeight - 50) {
                addPage();
            }
        });
        
        // ========== TOTAL CALCULATION SECTION ==========
        // Check if we need a new page (need at least 120px for section header + spacing + calculation box)
        if (yPos > pageHeight - 120) {
            addPage();
        } else {
            // Add spacing between sections if continuing on same page
            yPos += 15;
        }
        sectionPages.totalCalculation = currentPage;
        
        yPos = addSectionHeader('3. PREMIUM CALCULATION SUMMARY', yPos);
        yPos += 15;
        
        // Calculation box - calculate height based on content
        const boxX = margin + 5; // Reduced left margin for wider box
        const boxY = yPos;
        const boxWidth = contentWidth - 10; // Increased width by reducing side margins
        // Height: top padding (12) + subtotal (8) + GST (8) + divider line (8) + total line (12) + bottom padding (10) = 58
        // Increased to 70 to ensure everything fits comfortably
        const boxHeight = 70;
        
        // Box background
        doc.setFillColor(...lightGray);
        doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
        
        // Box border
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3);
        
        // Calculation details - reduced padding to keep amounts inside box
        let calcY = boxY + 10; // Reduced top padding from 12 to 10
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...textColor);
        
        const formattedSubtotal = `₹${this.formatNumber(subtotalExclGst)}`;
        const formattedGst = `₹${this.formatNumber(gstAmount)}`;
        const formattedTotal = `₹${this.formatNumber(totalInclGst)}`;
        
        // Increased right padding to ensure amounts stay well inside the box
        const rightPadding = 16; // Set to 16px to keep amounts well inside box
        doc.text('Subtotal (Excl. GST):', boxX + 8, calcY);
        doc.setFont(undefined, 'bold');
        doc.text(formattedSubtotal, boxX + boxWidth - rightPadding, calcY, { align: 'right' });
        calcY += 8;
        
        doc.setFont(undefined, 'normal');
        doc.text('GST (18%):', boxX + 8, calcY);
        doc.setFont(undefined, 'bold');
        doc.text(formattedGst, boxX + boxWidth - rightPadding, calcY, { align: 'right' });
        calcY += 8;
        
        // Total line - increased right padding
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(boxX + 8, calcY, boxX + boxWidth - rightPadding, calcY);
        calcY += 8;
        
        // Total - ensure it fits within box
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...accentColor);
        doc.text('Total (Incl. GST):', boxX + 8, calcY);
        doc.text(formattedTotal, boxX + boxWidth - rightPadding, calcY, { align: 'right' });
        
        // Verify total is within box bounds
        const totalBottom = calcY + 5; // Add some space for font height
        if (totalBottom > boxY + boxHeight) {
            console.warn('Total text exceeds box, but box height should accommodate it');
        }
        
        // Update yPos to after the calculation box
        yPos = boxY + boxHeight + 10;
        
        // ========== NOMINEE INFORMATION SECTION ==========
        // Check if we need a new page (need at least 100px for section header + spacing + nominee info)
        if (yPos > pageHeight - 100) {
            addPage();
        } else {
            // Add spacing between sections if continuing on same page
            yPos += 15;
        }
        sectionPages.nomineeInfo = currentPage;
        
        yPos = addSectionHeader('4. NOMINEE INFORMATION', yPos);
        yPos += 8; // Add a small gap so the table doesn't touch the section header
        
        // Format DOB
        const dobDate = new Date(nomineeData.dob);
        const formattedDob = dobDate.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Build table data for nominee information
        const nomineeTableRows = [
            ['Name', nomineeData.name || 'N/A'],
            ['Relationship', nomineeData.relationship || 'N/A'],
            ['Date of Birth', formattedDob || 'N/A']
        ];
        
        // Create table with proper headers and formatting
        const tableHeaders = ['Field', 'Value'];
        const colWidths = [90, 100]; // Field column and Value column widths
        yPos = createTable(tableHeaders, nomineeTableRows, yPos, { 
            colWidths: colWidths, 
            fontSize: 10,
            tableWidth: contentWidth
        });
        
        // ========== DISPLAY PDF ON SAME PAGE ==========
        // Generate PDF as blob for better iframe compatibility
        const pdfBlob = doc.output('blob');
        this.generatedPdfFileName = `Insurance_Premium_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Create blob URL for iframe
        if (this.generatedPdfBlobUrl) {
            URL.revokeObjectURL(this.generatedPdfBlobUrl);
        }
        this.generatedPdfBlobUrl = URL.createObjectURL(pdfBlob);
        
        // Also store as data URI for download
        this.generatedPdfData = doc.output('datauristring');
        
        // Display PDF in modal
        console.log('PDF generated, showing viewer...');
        this.showPdfViewer();
        console.log('PDF generated successfully');
        } catch (error) {
            console.error('Error in PDF generation:', error);
            this.showError('Error generating PDF: ' + (error.message || 'Unknown error'));
        }
    }
    
    showPdfViewer() {
        // First, ensure nominee modal is hidden
        this.hideNomineeModal();
        
        const modal = document.getElementById('pdfViewerModal');
        const iframe = document.getElementById('pdfViewer');
        
        console.log('showPdfViewer called', {
            modal: !!modal,
            iframe: !!iframe,
            hasBlobUrl: !!this.generatedPdfBlobUrl,
            hasDataUri: !!this.generatedPdfData
        });
        
        if (!modal) {
            console.error('PDF viewer modal not found');
            this.showError('PDF viewer modal not found. Please refresh the page.');
            return;
        }
        
        if (!iframe) {
            console.error('PDF viewer iframe not found');
            this.showError('PDF viewer iframe not found. Please refresh the page.');
            return;
        }
        
        if (!this.generatedPdfBlobUrl && !this.generatedPdfData) {
            console.error('No PDF data available');
            this.showError('PDF data not available. Please try generating again.');
            return;
        }
        
        // Use blob URL if available (more reliable), otherwise fall back to data URI
        const pdfUrl = this.generatedPdfBlobUrl || this.generatedPdfData;
        
        // Ensure iframe has proper dimensions
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.minHeight = '500px';
        
        // Set iframe source
        iframe.src = pdfUrl;
        
        // Add load event to verify PDF loaded
        iframe.onload = () => {
            console.log('PDF loaded successfully in iframe');
        };
        
        // Add error handler for iframe
        iframe.onerror = () => {
            console.error('Error loading PDF in iframe');
            // Fallback: open in new window
            window.open(pdfUrl, '_blank');
            this.showError('PDF preview unavailable. Opened PDF in new window. You can also download it using the Download button.');
        };
        
        // Show modal - ensure it's on top
        modal.style.display = 'flex';
        modal.style.zIndex = '10001';
        document.body.style.overflow = 'hidden';
        
        console.log('PDF viewer modal displayed with URL:', pdfUrl.substring(0, 50) + '...');
        
        // Fallback: If iframe doesn't load after 2 seconds, open in new window
        setTimeout(() => {
            try {
                // Check if iframe has content (some browsers block this, so we just try)
                if (iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.innerHTML.trim() === '') {
                    console.warn('Iframe appears empty, opening PDF in new window as fallback');
                    window.open(pdfUrl, '_blank');
                }
            } catch (e) {
                // Cross-origin or other error - this is expected in some cases
                console.log('Cannot check iframe content (expected in some browsers)');
            }
        }, 2000);
    }
    
    hidePdfViewer() {
        const modal = document.getElementById('pdfViewerModal');
        const iframe = document.getElementById('pdfViewer');
        
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        if (iframe) {
            iframe.src = '';
        }
        
        // Clean up blob URL
        if (this.generatedPdfBlobUrl) {
            URL.revokeObjectURL(this.generatedPdfBlobUrl);
            this.generatedPdfBlobUrl = null;
        }
    }
    
    downloadPDF() {
        if (!this.generatedPdfData && !this.generatedPdfBlobUrl) {
            this.showError('PDF data not available. Please generate the PDF again.');
            return;
        }
        
        try {
            const link = document.createElement('a');
            // Use blob URL if available, otherwise use data URI
            link.href = this.generatedPdfBlobUrl || this.generatedPdfData;
            link.download = this.generatedPdfFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('PDF download initiated');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showError('Error downloading PDF. Please try again.');
        }
    }
    
    formatNumber(num) {
        if (!num) return '0';
        return parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM Content Loaded, initializing PremiumComparison...');
        window.premiumComparison = new PremiumComparison();
        console.log('Premium Comparison initialized successfully', window.premiumComparison);
        
        // Verify event listeners are attached
        const productsContainer = document.querySelector('.insurance-premium-section');
        if (productsContainer) {
            console.log('Products container found:', productsContainer);
        } else {
            console.error('Products container NOT found!');
        }
    } catch (error) {
        console.error('Error initializing Premium Comparison:', error);
        console.error('Error stack:', error.stack);
        alert('Error initializing application. Please refresh the page. Error: ' + error.message);
    }
});
