// Function to load donations into the table
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

// Helper function to format payment method
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
    
    // Convert to lowercase and replace underscores for matching
    const normalizedMethod = method.toLowerCase().replace(/\s+/g, '_');
    return methodMap[normalizedMethod] || method;
}

// Function to view donation details
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

// Function to edit a donation
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

// Function to delete a donation
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

// Helper function to close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Function to submit a donation (create or update)
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

// Function to generate a receipt for a donation
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
                    <p>RCDNET confirms your donation of UGX ${donation.amount.toLocaleString()} on ${new Date(donation.date).toLocaleDateString()} at ${new Date().toLocaleTimeString()}. Thank you so much for caring about ${donation.project || 'our cause'}. We are deeply grateful for your generous gift.</p>
                    
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

// Function to download a receipt as PDF
function downloadReceipt(donationId) {
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
        filename: `RCDNET_Donation_Receipt_${donationId}.pdf`,
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

// Function to email a receipt
function emailReceipt(donationId) {
    const recipient = "rcdnetciuganda@gmail.com";
    const subject = encodeURIComponent("Donation acknowledgement");
    const body = encodeURIComponent(
        `Dear Donor, we are thrilled to receive your generous support. Your donation has been well received. Kindly find the donation confirmation attached here in.With kind regards. Mrs. Muhindo Justine. Board treasurer`
    );

    const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
    window.open(gmailURL, '_blank'); // Opens in new tab
}

// Function to print a receipt
function printReceipt(donationId) {
    const receiptElement = document.getElementById(`receipt-${donationId}`);
    if (!receiptElement) {
        alert('Receipt not found');
        return;
    }

    // Create a clone of the receipt element
    const receiptClone = receiptElement.cloneNode(true);
    
    // Remove the action buttons from the clone
    const actions = receiptClone.querySelector('.receipt-actions');
    if (actions) actions.remove();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(`
        <html>
            <head>
                <title>RCDNET Donation Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-card { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
                    .receipt-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .receipt-org-info { flex: 1; }
                    .receipt-title { text-align: right; }
                    .receipt-row { display: flex; margin-bottom: 10px; }
                    .receipt-label { font-weight: bold; min-width: 150px; }
                    .receipt-message { margin-top: 20px; padding: 15px; background-color: #f9f9f9; }
                    @media print {
                        @page { size: auto; margin: 10mm; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${receiptClone.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Function to close the donation modal
function closeDonationModal() {
    document.getElementById('addDonationModal').classList.remove('show');
    document.getElementById('addDonationModal').dataset.donationId = '';
    document.getElementById('donationForm').reset();
}

// Initialize the donations functionality when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load donations when the donations tab is active
    if (document.getElementById('donationsContent').style.display === 'block') {
        loadDonations();
    }
    
    // Set up event listeners for the donation form
    document.getElementById('addDonationBtn').addEventListener('click', function() {
        document.getElementById('donationForm').reset();
        document.getElementById('addDonationModal').dataset.donationId = '';
        document.querySelector('#addDonationModal .modal-header h3').textContent = 'Add New Donation';
        document.querySelector('#addDonationModal .modal-footer .file-manager-btn').textContent = 'Save Donation';
        document.getElementById('addDonationModal').classList.add('show');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('addDonationModal')) {
            closeDonationModal();
        }
    });
});

// Expose functions to global scope
window.loadDonations = loadDonations;
window.viewDonation = viewDonation;
window.editDonation = editDonation;
window.deleteDonation = deleteDonation;
window.submitDonation = submitDonation;
window.closeDonationModal = closeDonationModal;
window.downloadReceipt = downloadReceipt;
window.emailReceipt = emailReceipt;
window.printReceipt = printReceipt;
