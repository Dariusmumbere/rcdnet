// Global variable to track current donor
let currentDonorId = null;

// Function to open donor modal
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

// Function to close donor modal
function closeDonorModal() {
    document.getElementById('donorModal').classList.remove('show');
    currentDonorId = null;
}

// Function to load donor data
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

// Function to load donor's donations
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
                    <td>${donation.date}</td>
                    <td>UGX ${donation.amount.toLocaleString()}</td>
                    <td>${donation.project}</td>
                    <td><span class="status-badge completed">${donation.status}</span></td>
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

// Function to save donor
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

// Update your loadDonorProfiles function to prevent duplicates
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
        
        donors.forEach(donor => {
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
                            <span class="stat-value">UGX ${donor.stats.total_donated.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Donation Count:</span>
                            <span class="stat-value">${donor.stats.donation_count}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">First Donation:</span>
                            <span class="stat-value">${donor.stats.first_donation ? new Date(donor.stats.first_donation).toLocaleDateString() : '-'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Last Donation:</span>
                            <span class="stat-value">${donor.stats.last_donation ? new Date(donor.stats.last_donation).toLocaleDateString() : '-'}</span>
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

// Add the deleteDonor function
async function deleteDonor(donorId) {
    if (!confirm('Are you sure you want to delete this donor? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/donors/${dononst response = await fetch(`https://man-m681.onrender.com/donors/${donorId}`, {
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

// Function to view donor history (opens modal with donations)
function viewDonorHistory(donorId) {
    currentDonorId = donorId;
    openDonorModal(donorId);
}

// Function to load donation history for a donor
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

// Helper function to format payment method
function formatPaymentMethod(method) {
    if (!method) return 'Not specified';
    
    const methodMap = {
        'mobile_money': 'Mobile Money',
        'bank_transfer': 'Bank Transfer',
        'paypal': 'PayPal',
        'cash': 'Cash',
        'other': 'Other'
    };
    
    return methodMap[method.toLowerCase()] || method;
}

// Function to generate and download donation history PDF
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

// Initialize donor functionality when donations tab is shown
function showDonationsContent() {
    dashboardContent.style.display = 'none';
    fileManagerContent.style.display = 'none';
    donationsContent.style.display = 'block';
    setActiveNavItem(donationsLink);
    
    // Load donations when showing this content
    loadDonations();
    
    // Set the first tab as active
    const firstTabBtn = document.querySelector('.donations-tabs .tab-btn');
    firstTabBtn.classList.add('active');
    document.getElementById('donationHistory').classList.add('active');
    
    // Load donor profiles if on donor tab
    if (document.getElementById('donorProfiles').classList.contains('active')) {
        loadDonorProfiles();
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add donor button
    document.getElementById('addDonorBtn').addEventListener('click', function() {
        openDonorModal();
    });
    
    // Save donor form submission
    document.getElementById('donorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveDonor();
    });
    
    // Download history button
    document.getElementById('downloadHistoryBtn').addEventListener('click', function() {
        if (currentDonorId) {
            downloadDonationHistory(currentDonorId);
        } else {
            alert('No donor selected');
        }
    });
    
    // Initialize tab switching
    setupTabSwitching();
    
    // Load donor profiles if on donor tab
    if (document.getElementById('donorProfiles').classList.contains('active')) {
        loadDonorProfiles();
    }
});

// Expose functions to global scope
window.openDonorModal = openDonorModal;
window.closeDonorModal = closeDonorModal;
window.viewDonorHistory = viewDonorHistory;
window.saveDonor = saveDonor;
window.deleteDonor = deleteDonor;
window.downloadDonationHistory = downloadDonationHistory;
