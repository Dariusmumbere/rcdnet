// donations.js - Handles all donation-related functionality

// Global variables
let currentDonorId = null;
let currentDonationId = null;

// Initialize donations functionality
document.addEventListener('DOMContentLoaded', function() {
    setupDonationsPage();
});

function setupDonationsPage() {
    // Initialize tab switching
    setupTabSwitching();
    
    // Set up event listeners
    document.getElementById('addDonationBtn')?.addEventListener('click', openAddDonationModal);
    document.getElementById('addDonorBtn')?.addEventListener('click', openAddDonorModal);
    
    // Set up form submissions
    document.getElementById('donationForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        submitDonation();
    });
    
    document.getElementById('donorForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveDonor();
    });
    
    // Load initial data if on donations page
    if (document.getElementById('donationsContent')?.style.display === 'block') {
        loadInitialDonationsData();
    }
}

function loadInitialDonationsData() {
    // Load data based on active tab
    const activeTab = document.querySelector('.donations-tabs .tab-btn.active');
    if (!activeTab) return;
    
    const tabId = activeTab.getAttribute('data-tab');
    switch(tabId) {
        case 'donationHistory':
            loadDonations();
            break;
        case 'receipts':
            loadReceipts();
            break;
        case 'donorProfiles':
            loadDonorProfiles();
            break;
    }
}

function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            switch(tabId) {
                case 'donationHistory':
                    loadDonations();
                    break;
                case 'receipts':
                    loadReceipts();
                    break;
                case 'donorProfiles':
                    loadDonorProfiles();
                    break;
            }
        });
    });
}

async function loadDonations() {
    try {
        const donationsTable = document.querySelector('.donations-table tbody');
        if (!donationsTable) return;
        
        donationsTable.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading donations...</td></tr>';
        
        const response = await fetch('https://man-m681.onrender.com/donations/');
        if (!response.ok) throw new Error('Failed to fetch donations');
        
        const data = await response.json();
        donationsTable.innerHTML = '';
        
        if (data.length === 0) {
            donationsTable.innerHTML = '<tr><td colspan="7" style="text-align: center;">No donations found</td></tr>';
            return;
        }
        
        // Sort donations by date (newest first)
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        data.forEach(donation => {
            const row = document.createElement('tr');
            row.setAttribute('data-donation-id', donation.id);
            row.innerHTML = `
                <td>${formatDate(donation.date)}</td>
                <td>${donation.donor_name}</td>
                <td>UGX ${donation.amount.toLocaleString()}</td>
                <td>${formatPaymentMethod(donation.payment_method)}</td>
                <td>${donation.project || 'General Fund'}</td>
                <td><span class="status-badge completed">Completed</span></td>
                <td>
                    <button class="action-btn view-btn" onclick="viewDonation(${donation.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editDonation(${donation.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteDonation(${donation.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            donationsTable.appendChild(row);
        });
        
        // Update dashboard cards after loading donations
        updateDashboardCards(data);
    } catch (error) {
        console.error('Error loading donations:', error);
        const donationsTable = document.querySelector('.donations-table tbody');
        if (donationsTable) {
            donationsTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load donations</td></tr>';
        }
    }
}

function updateDashboardCards(donations) {
    // Calculate total donations
    const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
    
    // Update the total donations card
    const totalDonationsElement = document.querySelector('.stat-card .stat-value');
    if (totalDonationsElement) {
        totalDonationsElement.textContent = `UGX ${totalDonations.toLocaleString()}`;
    }
    
    // Update program area cards
    const programAreas = {
        'Women Empowerment': document.querySelector('.program-card-1 .bank-card-balance'),
        'Vocational Education': document.querySelector('.program-card-2 .bank-card-balance'),
        'Climate Change': document.querySelector('.program-card-3 .bank-card-balance'),
        'Reproductive Health': document.querySelector('.program-card-4 .bank-card-balance')
    };
    
    // Calculate totals by program area
    const programTotals = {};
    donations.forEach(donation => {
        const program = donation.project || 'General Fund';
        programTotals[program] = (programTotals[program] || 0) + donation.amount;
    });
    
    // Update each program card
    Object.entries(programAreas).forEach(([program, element]) => {
        if (element) {
            const total = programTotals[program] || 0;
            element.textContent = `UGX ${total.toLocaleString()}`;
        }
    });
}

async function submitDonation() {
    const donationId = document.getElementById('addDonationModal')?.dataset.donationId;
    const isEdit = !!donationId;
    
    const donorName = document.getElementById('donorName')?.value;
    const donationAmount = parseFloat(document.getElementById('donationAmount')?.value);
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const donationDate = document.getElementById('donationDate')?.value;
    const donationProject = document.getElementById('donationProject')?.value;
    const donationNotes = document.getElementById('donationNotes')?.value;

    if (!donorName || !donationAmount || !paymentMethod || !donationDate) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const submitBtn = document.querySelector('#addDonationModal .modal-footer .file-manager-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        const url = isEdit 
            ? `https://man-m681.onrender.com/donations/${donationId}`
            : 'https://man-m681.onrender.com/donations/';
            
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                donor_name: donorName,
                amount: donationAmount,
                payment_method: paymentMethod,
                date: donationDate,
                project: donationProject,
                notes: donationNotes,
                status: "completed"
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit donation');
        }

        const data = await response.json();
        
        // Refresh the donations table
        await loadDonations();
        
        // Generate receipt
        generateReceipt(data);
        
        // Show success message
        showToast(`Donation ${isEdit ? 'updated' : 'submitted'} successfully!`, 'success');
        closeDonationModal();
    } catch (error) {
        console.error('Error submitting donation:', error);
        showToast(`Failed to ${isEdit ? 'update' : 'submit'} donation. Please try again.`, 'error');
    } finally {
        const submitBtn = document.querySelector('#addDonationModal .modal-footer .file-manager-btn');
        if (submitBtn) {
            submitBtn.innerHTML = isEdit ? 'Update Donation' : 'Save Donation';
            submitBtn.disabled = false;
        }
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }, 100);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatPaymentMethod(method) {
    if (!method) return 'Not specified';
    
    const methodMap = {
        'mobile_money': 'Mobile Money',
        'bank_transfer': 'Bank Transfer',
        'western_union': 'Western Union',
        'paypal': 'PayPal',
        'cash': 'Cash',
        'other': 'Other'
    };
    
    return methodMap[method.toLowerCase()] || method;
}

// Expose functions to global scope
window.openDonorModal = openDonorModal;
window.closeDonorModal = closeDonorModal;
window.viewDonorHistory = viewDonorHistory;
window.saveDonor = saveDonor;
window.deleteDonor = deleteDonor;
window.downloadDonationHistory = downloadDonationHistory;
window.viewDonation = viewDonation;
window.editDonation = editDonation;
window.deleteDonation = deleteDonation;
window.submitDonation = submitDonation;
window.closeDonationModal = closeDonationModal;
window.downloadReceipt = downloadReceipt;
window.printReceipt = printReceipt;
window.emailReceipt = emailReceipt;
