document.addEventListener('DOMContentLoaded', function() {
    // Initialize donations functionality
    initDonations();
});

function initDonations() {
    // Set up tab switching
    setupTabSwitching();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
    
    // Initialize donor form validation
    initDonorFormValidation();
}

function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Load content for the active tab
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

function setupEventListeners() {
    // Add Donation Button
    document.getElementById('addDonationBtn').addEventListener('click', function() {
        openDonationModal();
    });

    // Add Donor Button
    document.getElementById('addDonorBtn').addEventListener('click', function() {
        openDonorModal();
    });

    // Save Donor Form
    document.getElementById('donorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveDonor();
    });

    // Download History Button
    document.getElementById('downloadHistoryBtn').addEventListener('click', function() {
        if (currentDonorId) {
            downloadDonationHistory(currentDonorId);
        } else {
            alert('No donor selected');
        }
    });
}

function loadInitialData() {
    // Load donations if on donations tab
    if (document.getElementById('donationHistory').classList.contains('active')) {
        loadDonations();
    }
    
    // Load donor profiles if on donor profiles tab
    if (document.getElementById('donorProfiles').classList.contains('active')) {
        loadDonorProfiles();
    }
}

function initDonorFormValidation() {
    const form = document.getElementById('donorForm');
    
    form.addEventListener('input', function(e) {
        // Clear validation errors on input
        const errorElement = document.getElementById(`${e.target.id}Error`);
        if (errorElement) {
            errorElement.style.display = 'none';
            e.target.style.borderColor = '';
        }
    });
}

// Global variable to track current donor
let currentDonorId = null;

async function loadDonorProfiles(search = '') {
    try {
        const container = document.querySelector('.donor-cards');
        container.innerHTML = '<div class="loading">Loading donors...</div>';
        
        const response = await fetch(`https://man-m681.onrender.com/donors/?search=${encodeURIComponent(search)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch donors');
        }
        
        const donors = await response.json();
        container.innerHTML = '';
        
        if (donors.length === 0) {
            container.innerHTML = '<p>No donors found. Add a new donor to get started.</p>';
            return;
        }
        
        // Create a map to track unique donors by ID
        const uniqueDonors = new Map();
        
        donors.forEach(donor => {
            // Skip if we've already processed this donor
            if (uniqueDonors.has(donor.id)) {
                return;
            }
            
            uniqueDonors.set(donor.id, donor);
            
            const donorCard = document.createElement('div');
            donorCard.className = 'donor-card';
            donorCard.setAttribute('data-donor-id', donor.id);
            donorCard.innerHTML = `
                <div class="donor-avatar">
                    <i class="fas ${donor.donor_type === 'corporate' ? 'fa-building' : 'fa-user'}"></i>
                </div>
                <div class="donor-info">
                    <h3 class="donor-name">${donor.name}</h3>
                    <div class="donor-contact">
                        ${donor.email ? `<span><i class="fas fa-envelope"></i> ${donor.email}</span>` : ''}
                        ${donor.phone ? `<span><i class="fas fa-phone"></i> ${donor.phone}</span>` : ''}
                    </div>
                    <div class="donor-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total Donations:</span>
                            <span class="stat-value">UGX ${donor.stats?.total_donated?.toLocaleString() || '0'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Donation Count:</span>
                            <span class="stat-value">${donor.stats?.donation_count || '0'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">First Donation:</span>
                            <span class="stat-value">${donor.stats?.first_donation ? new Date(donor.stats.first_donation).toLocaleDateString() : '-'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Last Donation:</span>
                            <span class="stat-value">${donor.stats?.last_donation ? new Date(donor.stats.last_donation).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="donor-actions">
                    <button class="file-manager-btn secondary" onclick="editDonor(${donor.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="file-manager-btn" onclick="viewDonorHistory(${donor.id})">
                        <i class="fas fa-history"></i> View History
                    </button>
                    <button class="file-manager-btn delete-btn" onclick="confirmDeleteDonor(${donor.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(donorCard);
        });
    } catch (error) {
        console.error('Error loading donors:', error);
        document.querySelector('.donor-cards').innerHTML = 
            `<p class="error">Failed to load donors: ${error.message}</p>`;
    }
}

function openDonorModal(donorId = null) {
    currentDonorId = donorId;
    const modal = document.getElementById('donorModal');
    const title = document.getElementById('donorModalTitle');
    const saveBtn = document.getElementById('saveDonorBtn');
    
    if (donorId) {
        title.textContent = 'Edit Donor Profile';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Donor';
        loadDonorData(donorId);
    } else {
        title.textContent = 'Add New Donor';
        saveBtn.innerHTML = '<i class="fas fa-plus"></i> Add Donor';
        document.getElementById('donorForm').reset();
        document.getElementById('donorDonationsTable').querySelector('tbody').innerHTML = 
            '<tr><td colspan="4" style="text-align: center;">No donation history available</td></tr>';
        document.getElementById('totalDonations').textContent = 'UGX 0';
        document.getElementById('donationCount').textContent = '0';
        document.getElementById('firstDonation').textContent = '-';
        document.getElementById('lastDonation').textContent = '-';
    }
    
    modal.classList.add('show');
}

function closeDonorModal() {
    document.getElementById('donorModal').classList.remove('show');
    currentDonorId = null;
}

async function loadDonorData(donorId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/donors/${donorId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch donor data');
        }
        
        const donor = await response.json();
        
        // Populate form
        document.getElementById('donorId').value = donor.id;
        document.getElementById('donorProfileName').value = donor.name;
        document.getElementById('donorEmail').value = donor.email || '';
        document.getElementById('donorPhone').value = donor.phone || '';
        document.getElementById('donorAddress').value = donor.address || '';
        document.getElementById('donorType').value = donor.donor_type || 'individual';
        document.getElementById('donorCategory').value = donor.category || 'one-time';
        document.getElementById('donorNotes').value = donor.notes || '';
        
        // Load donation history
        loadDonorDonations(donorId);
        
        // Load donation history summary
        loadDonationHistory(donorId);
    } catch (error) {
        console.error('Error loading donor data:', error);
        alert(`Failed to load donor data: ${error.message}`);
    }
}

async function loadDonorDonations(donorId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/donors/${donorId}/donations`);
        if (!response.ok) throw new Error('Failed to fetch donor donations');
        
        const data = await response.json();
        const tbody = document.getElementById('donorDonationsTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (data.donations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No donation history available</td></tr>';
        } else {
            data.donations.forEach(donation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(donation.date).toLocaleDateString()}</td>
                    <td>UGX ${donation.amount.toLocaleString()}</td>
                    <td>${donation.project || 'General Fund'}</td>
                    <td><span class="status-badge completed">${donation.status || 'Completed'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // Update stats
        document.getElementById('totalDonations').textContent = `UGX ${data.total_donations.toLocaleString()}`;
        document.getElementById('donationCount').textContent = data.donation_count;
        
        if (data.donations.length > 0) {
            const dates = data.donations.map(d => new Date(d.date));
            dates.sort((a, b) => a - b);
            document.getElementById('firstDonation').textContent = dates[0].toLocaleDateString();
            document.getElementById('lastDonation').textContent = dates[dates.length - 1].toLocaleDateString();
        } else {
            document.getElementById('firstDonation').textContent = '-';
            document.getElementById('lastDonation').textContent = '-';
        }
    } catch (error) {
        console.error('Error loading donor donations:', error);
        alert('Failed to load donation history. Please try again.');
    }
}

async function saveDonor() {
    // Validate form before proceeding
    if (!validateDonorForm()) {
        return;
    }
    
    // Get form data
    const donorData = {
        name: document.getElementById('donorProfileName').value.trim(),
        email: document.getElementById('donorEmail').value.trim(),
        phone: document.getElementById('donorPhone').value.trim(),
        address: document.getElementById('donorAddress').value.trim(),
        donor_type: document.getElementById('donorType').value,
        category: document.getElementById('donorCategory').value,
        notes: document.getElementById('donorNotes').value.trim()
    };
    
    try {
        const isEdit = !!currentDonorId;
        const url = isEdit 
            ? `https://man-m681.onrender.com/donors/${currentDonorId}`
            : 'https://man-m681.onrender.com/donors/';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Show loading state
        const saveBtn = document.getElementById('saveDonorBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(donorData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save donor');
        }
        
        // Success - reload donor list and close modal
        await loadDonorProfiles();
        closeDonorModal();
        
    } catch (error) {
        console.error('Save donor error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        // Restore button state
        const saveBtn = document.getElementById('saveDonorBtn');
        saveBtn.innerHTML = isEdit ? '<i class="fas fa-save"></i> Update Donor' : '<i class="fas fa-plus"></i> Add Donor';
        saveBtn.disabled = false;
    }
}

function validateDonorForm() {
    let isValid = true;
    const nameInput = document.getElementById('donorProfileName');
    const emailInput = document.getElementById('donorEmail');
    const phoneInput = document.getElementById('donorPhone');
    
    // Reset all errors
    document.querySelectorAll('.validation-error').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
        el.style.borderColor = '';
    });

    // Validate name (required)
    if (!nameInput.value.trim()) {
        document.getElementById('nameError').style.display = 'block';
        nameInput.style.borderColor = 'red';
        isValid = false;
    }

    // Validate email format if provided
    if (emailInput.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address';
        document.getElementById('emailError').style.display = 'block';
        emailInput.style.borderColor = 'red';
        isValid = false;
    }

    // Validate phone format if provided
    if (phoneInput.value.trim() && !/^[\d\s+-]+$/.test(phoneInput.value)) {
        document.getElementById('phoneError').textContent = 'Please enter a valid phone number';
        document.getElementById('phoneError').style.display = 'block';
        phoneInput.style.borderColor = 'red';
        isValid = false;
    }

    if (!isValid) {
        // Focus on first invalid field
        const firstInvalid = document.querySelector('.validation-error[style*="display: block"]');
        if (firstInvalid) {
            firstInvalid.previousElementSibling.focus();
        }
    }

    return isValid;
}

function confirmDeleteDonor(donorId) {
    if (confirm('Are you sure you want to delete this donor? This action cannot be undone.')) {
        deleteDonor(donorId);
    }
}

async function deleteDonor(donorId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/donors/${donorId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete donor');
        
        // Remove the donor card from the UI
        document.querySelector(`.donor-card[data-donor-id="${donorId}"]`)?.remove();
        
        // Show success message
        showToast('Donor deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting donor:', error);
        showToast('Failed to delete donor', 'error');
    }
}

function viewDonorHistory(donorId) {
    currentDonorId = donorId;
    openDonorModal(donorId);
    loadDonationHistory(donorId);
}

function editDonor(donorId) {
    openDonorModal(donorId);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions available globally
window.openDonorModal = openDonorModal;
window.closeDonorModal = closeDonorModal;
window.viewDonorHistory = viewDonorHistory;
window.editDonor = editDonor;
window.confirmDeleteDonor = confirmDeleteDonor;
window.saveDonor = saveDonor;
