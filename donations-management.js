// donations-management.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize donations management functionality
    initDonationsManagement();
});

function initDonationsManagement() {
    // Get references to the buttons
    const addDonationBtn = document.getElementById('addDonationBtn');
    const addDonorBtn = document.getElementById('addDonorBtn');
    const quickAddDonationBtn = document.getElementById('quickAddDonation');

    // Add event listeners if buttons exist
    if (addDonationBtn) {
        addDonationBtn.addEventListener('click', openAddDonationModal);
    }

    if (addDonorBtn) {
        addDonorBtn.addEventListener('click', openAddDonorModal);
    }

    if (quickAddDonationBtn) {
        quickAddDonationBtn.addEventListener('click', openAddDonationModal);
    }

    // Initialize form submission handlers
    initDonationForm();
    initDonorForm();
}

function openAddDonationModal() {
    // Reset form and set default values
    const form = document.getElementById('donationForm');
    if (form) {
        form.reset();
        document.getElementById('donationDate').valueAsDate = new Date();
    }

    // Set modal title and button text for adding
    const modalHeader = document.querySelector('#addDonationModal .modal-header h3');
    const modalSubmitBtn = document.querySelector('#addDonationModal .modal-footer .file-manager-btn');
    
    if (modalHeader) modalHeader.textContent = 'Add New Donation';
    if (modalSubmitBtn) modalSubmitBtn.textContent = 'Save Donation';

    // Remove any stored donation ID (for edits)
    const modal = document.getElementById('addDonationModal');
    if (modal) {
        modal.dataset.donationId = '';
        modal.classList.add('show');
    }

    // Populate donor dropdown
    populateDonorDropdown();
}

function openAddDonorModal() {
    // Reset form
    const form = document.getElementById('donorForm');
    if (form) {
        form.reset();
    }

    // Set modal title and button text for adding
    const modalHeader = document.getElementById('donorModalTitle');
    const modalSubmitBtn = document.getElementById('saveDonorBtn');
    
    if (modalHeader) modalHeader.textContent = 'Add New Donor';
    if (modalSubmitBtn) modalSubmitBtn.textContent = 'Add Donor';

    // Clear any existing donor ID
    document.getElementById('donorId').value = '';

    // Clear donation history table
    const tbody = document.getElementById('donorDonationsTable').querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No donation history available</td></tr>';
    }

    // Reset stats
    document.getElementById('totalDonations').textContent = 'UGX 0';
    document.getElementById('donationCount').textContent = '0';
    document.getElementById('firstDonation').textContent = '-';
    document.getElementById('lastDonation').textContent = '-';

    // Open modal
    const modal = document.getElementById('donorModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function initDonationForm() {
    const form = document.getElementById('donationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitDonation();
        });
    }
}

function initDonorForm() {
    const form = document.getElementById('donorForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveDonor();
        });
    }
}

async function populateDonorDropdown() {
    try {
        const response = await fetch('https://man-m681.onrender.com/donors/');
        if (!response.ok) throw new Error('Failed to fetch donors');
        
        const donors = await response.json();
        const donorNameInput = document.getElementById('donorName');
        
        // Create datalist if it doesn't exist
        if (!document.getElementById('donorNamesList')) {
            const datalist = document.createElement('datalist');
            datalist.id = 'donorNamesList';
            donorNameInput.setAttribute('list', 'donorNamesList');
            document.body.appendChild(datalist);
        }
        
        const datalist = document.getElementById('donorNamesList');
        datalist.innerHTML = '';
        
        donors.forEach(donor => {
            const option = document.createElement('option');
            option.value = donor.name;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating donor dropdown:', error);
    }
}

// Add this script to your HTML file by including:
// <script src="donations-management.js"></script>
