// donations.js - Handles all donation-related functionality

// Global variables
let currentDonorId = null;
let currentDonationId = null;

// Initialize donations functionality
document.addEventListener('DOMContentLoaded', function() {
    setupDonationsPage();
});

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
    
    // Load dashboard summary to update cards
    loadDashboardSummary();
}
function setupDonationsPage() {
    // Initialize tab switching
    setupTabSwitching();
    
    // Set up event listeners
    document.getElementById('addDonationBtn').addEventListener('click', openAddDonationModal);
    document.getElementById('addDonorBtn').addEventListener('click', openAddDonorModal);
    
    // Set up form submissions
    document.getElementById('donationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitDonation();
    });
    
    document.getElementById('donorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveDonor();
    });
    
    // Load initial data if on donations page
    if (document.getElementById('donationsContent').style.display === 'block') {
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

// Tab switching functionality
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

// Donation CRUD operations
async function loadDonations() {
    try {
        const donationsTable = document.querySelector('.donations-table tbody');
        donationsTable.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading donations...</td></tr>';
        
        const response = await fetch('https://man-m681.onrender.com/donations/');
        
        if (!response.ok) {
            throw new Error('Failed to fetch donations');
        }
        
        const data = await response.json();
        donationsTable.innerHTML = '';
        
        // Sort donations by date (newest first)
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display only the most recent donations (e.g., last 10)
        const recentDonations = data.slice(0, 10);
        
        recentDonations.forEach(donation => {
            const row = document.createElement('tr');
            row.setAttribute('data-donation-id', donation.id);
            row.innerHTML = `
                <td>${new Date(donation.date).toLocaleDateString()}</td>
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
    } catch (error) {
        console.error('Error loading donations:', error);
        donationsTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load donations</td></tr>';
    }
}

async function viewDonation(donationId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/donations/${donationId}`);
        if (!response.ok) throw new Error('Failed to fetch donation');
        
        const donation = await response.json();
        
        // Create a modal to display donation details
        const modalHTML = `
            <div class="donation-modal show" id="viewDonationModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Donation Details</h3>
                        <button class="close-btn" onclick="closeModal('viewDonationModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="donor-stats">
                            <div class="stat-item">
                                <span class="stat-label">Donor Name:</span>
                                <span class="stat-value">${donation.donor_name}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Amount:</span>
                                <span class="stat-value">UGX ${donation.amount.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Date:</span>
                                <span class="stat-value">${new Date(donation.date).toLocaleDateString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Payment Method:</span>
                                <span class="stat-value">${formatPaymentMethod(donation.payment_method)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Project:</span>
                                <span class="stat-value">${donation.project || 'General Fund'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Status:</span>
                                <span class="stat-value">${donation.status}</span>
                            </div>
                            ${donation.notes ? `
                            <div class="stat-item">
                                <span class="stat-label">Notes:</span>
                                <span class="stat-value">${donation.notes}</span>
                            </div>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="file-manager-btn" onclick="editDonation(${donation.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="file-manager-btn secondary" onclick="closeModal('viewDonationModal')">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error viewing donation:', error);
        alert('Failed to view donation details. Please try again.');
    }
}

async function editDonation(donationId) {
    try {
        // Close any open modals
        closeModal('viewDonationModal');
        
        const response = await fetch(`https://man-m681.onrender.com/donations/${donationId}`);
        if (!response.ok) throw new Error('Failed to fetch donation');
        
        const donation = await response.json();
        
        // Populate the donation form with existing data
        document.getElementById('donorName').value = donation.donor_name;
        document.getElementById('donationAmount').value = donation.amount;
        document.getElementById('paymentMethod').value = donation.payment_method;
        document.getElementById('donationDate').value = donation.date.split('T')[0]; // Format date for input
        document.getElementById('donationProject').value = donation.project || '';
        document.getElementById('donationNotes').value = donation.notes || '';
        
        // Change modal title and button text
        document.querySelector('#addDonationModal .modal-header h3').textContent = 'Edit Donation';
        document.querySelector('#addDonationModal .modal-footer .file-manager-btn').textContent = 'Update Donation';
        
        // Store donation ID for update
        document.getElementById('addDonationModal').dataset.donationId = donationId;
        
        // Open modal
        document.getElementById('addDonationModal').classList.add('show');
    } catch (error) {
        console.error('Error editing donation:', error);
        alert('Failed to load donation for editing. Please try again.');
    }
}

async function deleteDonation(donationId) {
    if (!confirm('Are you sure you want to delete this donation record?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/donations/${donationId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete donation');
        }
        
        // Remove the donation row from the table
        document.querySelector(`.donations-table tbody tr[data-donation-id="${donationId}"]`)?.remove();
        
        // Remove the corresponding receipt
        document.getElementById(`receipt-${donationId}`)?.remove();
        
        alert('Donation deleted successfully');
        
        // Refresh the donations list
        loadDonations();
    } catch (error) {
        console.error('Error deleting donation:', error);
        alert('Failed to delete donation. Please try again.');
    }
}

async function submitDonation() {
    const donationId = document.getElementById('addDonationModal').dataset.donationId;
    const isEdit = !!donationId;
    
    const donorName = document.getElementById('donorName').value;
    const donationAmount = parseFloat(document.getElementById('donationAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const donationDate = document.getElementById('donationDate').value;
    const donationProject = document.getElementById('donationProject').value;
    const donationNotes = document.getElementById('donationNotes').value;

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
        
        // Refresh dashboard data
        await loadDashboardSummary();
        
        // Refresh donations table
        await loadDonations();
        
        if (isEdit) {
            // Update existing receipt
            const receiptElement = document.getElementById(`receipt-${donationId}`);
            if (receiptElement) {
                receiptElement.remove();
            }
        }
        
        // Generate receipt for the new/updated donation
        generateReceipt(data);
        
        // Show success message
        alert(`Donation ${isEdit ? 'updated' : 'submitted'} successfully!`);
        closeDonationModal();
        document.getElementById('donationForm').reset();
        
    } catch (error) {
        console.error('Error submitting donation:', error);
        alert(`Failed to ${isEdit ? 'update' : 'submit'} donation. Please try again.`);
    } finally {
        // Restore button state
        const submitBtn = document.querySelector('#addDonationModal .modal-footer .file-manager-btn');
        submitBtn.innerHTML = isEdit ? 'Update Donation' : 'Save Donation';
        submitBtn.disabled = false;
    }
}

function closeDonationModal() {
    document.getElementById('addDonationModal').classList.remove('show');
    document.getElementById('addDonationModal').dataset.donationId = '';
    document.getElementById('donationForm').reset();
}

// Receipts functionality
async function loadReceipts() {
    try {
        const response = await fetch('https://man-m681.onrender.com/donations/');
        if (!response.ok) throw new Error('Failed to fetch donations');
        
        const donations = await response.json();
        const receiptsGrid = document.getElementById('receiptsGrid');
        receiptsGrid.innerHTML = '';
        
        // Sort donations by date (newest first)
        donations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate receipts for all donations
        donations.forEach(donation => {
            generateReceipt(donation);
        });
        
        if (donations.length === 0) {
            receiptsGrid.innerHTML = '<p class="no-receipts">No receipts available. Add a donation to generate receipts.</p>';
        }
    } catch (error) {
        console.error('Error loading receipts:', error);
        document.getElementById('receiptsGrid').innerHTML = 
            '<p class="error">Failed to load receipts. Please try again.</p>';
    }
}

function generateReceipt(donation) {
    // Create receipt HTML with the enhanced format
    const receiptHTML = `
        <div class="receipt-card" id="receipt-${donation.id}">
            <div class="receipt-header">
                <div class="receipt-org-info">
                    <img src="logo.jpg" alt="RCDNET Logo" class="receipt-logo">
                    <h2>RWENZORI COMMUNITY DEVELOPMENT NETWORK (RCDNET)</h2>
                </div>
                <div class="receipt-title">
                    <h3>DONATION CONFIRMATION</h3>
                    <p>Receipt issued at RCDNET</p>
                    <p>P.O.Box 558, Kasese, Western Uganda</p>
                    <p>Tax ID No. 1027222682</p>
                    <p>Registration No: 808593</p>
                    <p>Community Registration No. CE/CBS/008</p>
                </div>
            </div>
            
            <div class="receipt-body">
                <div class="receipt-donor-info">
                    <div class="receipt-row">
                        <span class="receipt-label">To:</span>
                        <span class="receipt-value">${donation.donor_name}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">Date:</span>
                        <span class="receipt-value">${new Date(donation.date).toLocaleDateString()}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">Amount:</span>
                        <span class="receipt-value">UGX ${donation.amount.toLocaleString()}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">Payment Method:</span>
                        <span class="receipt-value">${donation.payment_method}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">Program Supported:</span>
                        <span class="receipt-value">${donation.project || 'General Fund'}</span>
                    </div>
                </div>
                
                <div class="receipt-message">
                    <p>Dear ${donation.donor_name},</p>
                    <p>RCDNET confirms your donation of UGX ${donation.amount.toLocaleString()} on ${new Date(donation.date).toLocaleDateString()} at ${new Date().toLocaleTimeString()}. Thank you so much for caring about ${donation.project.toLocaleString()}. We are deeply grateful for your generous gift.</p>
                    
                    <div class="receipt-contact-info">
                        <p>For enquiries call +256 704240309 or email to info@rwenzori-development.org</p>
                        <p>Website: www.rwenzori-development.org</p>
                        <p>YouTube: https://youtube.com/@rwenzoricommunitydevelopme7810?si=zYLqI2Iajh0iQuAq</p>
                        <p>Instagram: https://www.instagram.com/rwenzoridevelopment_rcdnet</p>
                        <p>Facebook: https://www.facebook.com/profile.php?id=100066779636297</p>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <p>This receipt serves as official confirmation of your donation to RCDNET.</p>
                    <p>Thank you for your support!</p>
                </div>
            </div>
            
            <div class="receipt-actions">
                <button class="file-manager-btn" onclick="downloadReceipt(${donation.id})">
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <button class="file-manager-btn secondary" onclick="emailReceipt(${donation.id})">
                    <i class="fas fa-envelope"></i> Email Receipt
                </button>
                <button class="file-manager-btn secondary" onclick="printReceipt(${donation.id})">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </div>
        </div>
    `;

    // Add receipt to the receipts grid
    const receiptsGrid = document.querySelector('.receipts-grid');
    if (receiptsGrid) {
        receiptsGrid.insertAdjacentHTML('afterbegin', receiptHTML);
    }
}

async function downloadReceipt(donationId) {
    const receiptElement = document.getElementById(`receipt-${donationId}`);
    if (!receiptElement) {
        alert('Receipt not found');
        return;
    }

    // Create a clone of the receipt element to avoid modifying the original
    const receiptClone = receiptElement.cloneNode(true);
    
    // Remove the action buttons from the clone
    const actions = receiptClone.querySelector('.receipt-actions');
    if (actions) actions.remove();

    // Options for PDF generation
    const opt = {
        margin: [10, 10, 10, 10], // [top, left, bottom, right]
        filename: `RCDNET_Donation_Receipt_${donation.donor_name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, // Increase scale for better quality
            logging: true,
            useCORS: true,
            scrollY: 0, // Important to start from top
            windowHeight: receiptClone.scrollHeight // Set window height to content height
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            hotfixes: ["px_scaling"] 
        }
    };

    // Generate PDF
    html2pdf().set(opt).from(receiptClone).save();
}

function printReceipt(donationId) {
    const receiptElement = document.getElementById(`receipt-${donationId}`);
    if (!receiptElement) {
        alert('Receipt not found');
        return;
    }

    // Create a clone of the receipt element to avoid modifying the original
    const receiptClone = receiptElement.cloneNode(true);
    
    // Remove the action buttons from the clone
    const actions = receiptClone.querySelector('.receipt-actions');
    if (actions) actions.remove();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Receipt</title>');
    printWindow.document.write('<style>body { font-family: Arial; margin: 0; padding: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptClone.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
        printWindow.print();
    };
}

function emailReceipt(donationId) {
    const recipient = "rcdnetciuganda@gmail.com";
    const subject = encodeURIComponent("Donation acknowledgement");
    const body = encodeURIComponent(
        `Dear Donor, we are thrilled to receive your generous support. Your donation has been well received. Kindly find the donation confirmation attached here in.With kind regards. Mrs. Muhindo Justine. Board treasurer`
    );

    const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
    window.open(gmailURL, '_blank'); // Opens in new tab
}

// Donor management functionality
async function loadDonorProfiles(search = '') {
    try {
        const container = document.querySelector('.donor-cards');
        container.innerHTML = '<div class="loading">Loading donors...</div>';
        
        // Fetch donors and their stats in parallel
        const [donorsResponse, statsResponse] = await Promise.all([
            fetch(`https://man-m681.onrender.com/donors/?search=${encodeURIComponent(search)}`),
            fetch('https://man-m681.onrender.com/donors/stats/')
        ]);
        
        if (!donorsResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to fetch donor data');
        }
        
        const donors = await donorsResponse.json();
        const statsData = await statsResponse.json();
        const stats = statsData.donor_stats;
        
        container.innerHTML = '';
        
        if (donors.length === 0) {
            container.innerHTML = '<p>No donors found. Add a new donor to get started.</p>';
            return;
        }
        
        // Create donor cards
        donors.forEach(donor => {
            const donorStats = stats[donor.id] || {
                name: donor.name,
                donation_count: 0,
                total_donated: 0,
                first_donation: null,
                last_donation: null
            };
            
            const donorCard = document.createElement('div');
            donorCard.className = 'donor-card';
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
                            <span class="stat-value">UGX ${donorStats.total_donated.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Donation Count:</span>
                            <span class="stat-value">${donorStats.donation_count}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">First Donation:</span>
                            <span class="stat-value">${donorStats.first_donation || '-'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Last Donation:</span>
                            <span class="stat-value">${donorStats.last_donation || '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="donor-actions">
                    <button class="file-manager-btn secondary" onclick="openDonorModal(${donor.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="file-manager-btn" onclick="viewDonorHistory(${donor.id})">
                        <i class="fas fa-history"></i> View History
                    </button>
                    <button class="file-manager-btn delete-btn" onclick="deleteDonor(${donor.id})">
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
        saveBtn.textContent = 'Update Donor';
        loadDonorData(donorId);
    } else {
        title.textContent = 'Add New Donor';
        saveBtn.textContent = 'Add Donor';
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
        const tbody = document.getElementById('donorDonationsTable')?.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (data.donations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No donation history available</td></tr>';
        } else {
            data.donations.forEach(donation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(donation.date)}</td>
                    <td>UGX ${donation.amount.toLocaleString()}</td>
                    <td>${donation.project || 'General Fund'}</td>
                    <td><span class="status-badge completed">${donation.status || 'Completed'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // Update stats
        document.getElementById('totalDonations').textContent = `UGX ${data.total_donations?.toLocaleString() || '0'}`;
        document.getElementById('donationCount').textContent = data.donation_count || '0';
        
        if (data.donations.length > 0) {
            const dates = data.donations.map(d => new Date(d.date));
            dates.sort((a, b) => a - b);
            document.getElementById('firstDonation').textContent = formatDate(dates[0]);
            document.getElementById('lastDonation').textContent = formatDate(dates[dates.length - 1]);
        } else {
            document.getElementById('firstDonation').textContent = '-';
            document.getElementById('lastDonation').textContent = '-';
        }
    } catch (error) {
        console.error('Error loading donor donations:', error);
        showToast('Failed to load donation history. Please try again.', 'error');
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
        saveBtn.innerHTML = currentDonorId ? 'Update Donor' : 'Add Donor';
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

async function deleteDonor(donorId) {
    if (!confirm('Are you sure you want to delete this donor? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/donors/${donorId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete donor');
        
        alert('Donor deleted successfully');
        loadDonorProfiles();
    } catch (error) {
        console.error('Error deleting donor:', error);
        alert('Failed to delete donor. Please try again.');
    }
}

function viewDonorHistory(donorId) {
    currentDonorId = donorId;
    openDonorModal(donorId);
    loadDonationHistory(donorId);
}

async function loadDonationHistory(donorId) {
    try {
        const [donorResponse, historyResponse] = await Promise.all([
            fetch(`https://man-m681.onrender.com/donors/${donorId}`),
            fetch(`https://man-m681.onrender.com/donors/${donorId}/donations`)
        ]);

        if (!donorResponse.ok || !historyResponse.ok) {
            throw new Error('Failed to fetch donor data');
        }

        const donor = await donorResponse.json();
        const history = await historyResponse.json();

        // Update donor details
        document.getElementById('historyProjectName').textContent = 
            history.donations[0]?.project || 'Various Projects';
        document.getElementById('historyDonorCategory').textContent = 
            donor.category || 'Regular Donor';
        document.getElementById('historyDonorAddress').textContent = 
            donor.address || 'Not specified';
        document.getElementById('historyDonorId').textContent = donor.id;
        
        // Calculate time period
        if (history.donations.length > 0) {
            const dates = history.donations.map(d => new Date(d.date));
            dates.sort((a, b) => a - b);
            const firstDate = dates[0].toLocaleDateString();
            const lastDate = dates[dates.length - 1].toLocaleDateString();
            document.getElementById('historyTimePeriod').textContent = 
                `${firstDate} - ${lastDate}`;
        } else {
            document.getElementById('historyTimePeriod').textContent = 'No donations yet';
        }

        // Populate donation history table
        const tbody = document.getElementById('donationHistoryTableBody');
        tbody.innerHTML = '';
        
        let totalAmount = 0;
        
        history.donations.forEach(donation => {
            totalAmount += donation.amount;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(donation.date).toLocaleDateString()}</td>
                <td class="amount-cell">${donation.amount.toLocaleString()}</td>
                <td>${formatPaymentMethod(donation.payment_method)}</td>
                <td>${donation.project || 'General Fund'}</td>
                <td>${donation.status || 'Completed'}</td>
            `;
            tbody.appendChild(row);
        });

        // Update totals
        document.getElementById('historyTotalAmount').textContent = 
            totalAmount.toLocaleString();
        document.getElementById('historyTableTotal').textContent = 
            `UGX ${totalAmount.toLocaleString()}`;
        
        return { donor, history };
    } catch (error) {
        console.error('Error loading donation history:', error);
        alert('Failed to load donation history. Please try again.');
    }
}

async function downloadDonationHistory(donorId) {
    try {
        const btn = document.getElementById('downloadHistoryBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        btn.disabled = true;

        // Load the latest data
        const { donor, history } = await loadDonationHistory(donorId);
        
        // Create a printable element
        const element = document.createElement('div');
        element.innerHTML = `
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #3498db; text-align: center; margin-bottom: 20px; }
                .donor-info { margin-bottom: 30px; }
                .info-grid { 
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .info-box { 
                    padding: 12px 15px;
                    border-left: 3px solid #3498db;
                    background: #f9f9f9;
                    border-radius: 4px;
                }
                .info-label { 
                    font-weight: bold; 
                    color: #555; 
                    font-size: 0.9em;
                    margin-bottom: 5px;
                }
                .info-value { font-size: 1em; }
                table { 
                    width: 100%; 
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .info-value{
                    font-family: 'Courier New', monospace;
                    font-weight: bold; 
                }
                th { 
                    background-color: #f8f9fa; 
                    text-align: left; 
                    padding: 10px;
                    color: #555;
                    border-bottom: 2px solid #eee;
                }
                td { 
                    padding: 10px; 
                    border-bottom: 1px solid #f0f0f0; 
                }
                .total-row { 
                    font-weight: bold; 
                    background-color: #f1f8fe; 
                }
                .amount-cell { text-align: center; }
                .footer { 
                    margin-top: 30px; 
                    text-align: right; 
                    font-size: 0.8em;
                    color: #777;
                    padding-right: 22px;
                }
                .logo-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .logo-header img {
                    height: 50px;
                    margin-right: 15px;
                }
            </style>
            <div class="logo-header">
                <img src="logo.jpg" alt="Rwenzori Community Development Network">
                <div>
                    <h2>Rwenzori Community Development Network</h2>
                    <p>Donation History Report</p>
                </div>
            </div>
            
            <div class="donor-info">
                <h3>Donor Information</h3>
                <div class="info-grid">
                    <div class="info-box">
                        <div class="info-label">Donor Name</div>
                        <div class="info-value">${donor.name}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Donor ID</div>
                        <div class="info-value">${donor.id}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Donor Category</div>
                        <div class="info-value">${donor.category || 'Not specified'}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Address</div>
                        <div class="info-value">${donor.address || 'Not specified'}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Time Period</div>
                        <div class="info-value">${document.getElementById('historyTimePeriod').textContent}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Total Donations</div>
                        <div class="info-value">UGX ${history.donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>
            
            <h3>Donation History</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount (UGX)</th>
                        <th>Payment Method</th>
                        <th colspan="2">Project Name</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.donations.map(donation => `
                        <tr>
                            <td>${new Date(donation.date).toLocaleDateString()}</td>
                            <td class="amount-cell">${donation.amount.toLocaleString()}</td>
                            <td>${donation.payment_method || 'Not specified'}</td>
                            <td colspan="2">${donation.project || 'General Fund'}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="4">Total</td>
                        <td class="amount-cell">UGX ${history.donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
            <center><h2>Thank you, We are deeply grateful for your generous gift.</h2></center>
            <br>
            <center><p>For enquiries call +256 704240309 or email to info@rwenzori-development.org</p></center>
            <center><p>Website: www.rwenzori-development.org</p></center>
        `;

        // PDF generation options
        const opt = {
            margin: 10,
            filename: `Donation_History_${donor.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF
        await html2pdf().set(opt).from(element).save();

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        const btn = document.getElementById('downloadHistoryBtn');
        btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
        btn.disabled = false;
    }
}

// Helper functions
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

async function loadDashboardSummary() {
    try {
        const response = await fetch('https://man-m681.onrender.com/dashboard-summary/');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading dashboard summary:', error);
        return null;
    }
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
