/**
 * Generates and downloads a PDF receipt for a donation
 * @param {number} donationId - The ID of the donation to generate receipt for
 */
function downloadReceipt(donationId) {
    // Get the receipt element
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

/**
 * Generates a receipt for a donation and adds it to the receipts grid
 * @param {object} donation - The donation object
 */
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

/**
 * Prints a donation receipt
 * @param {number} donationId - The ID of the donation to print receipt for
 */
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
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
            <head>
                <title>RCDNET Donation Receipt #${donationId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-card { max-width: 800px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
                    .receipt-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .receipt-org-info { flex: 1; }
                    .receipt-title { text-align: right; }
                    .receipt-logo { height: 60px; margin-bottom: 10px; }
                    .receipt-body { margin-top: 20px; }
                    .receipt-row { display: flex; margin-bottom: 10px; }
                    .receipt-label { font-weight: bold; min-width: 150px; }
                    .receipt-message { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
                    .receipt-contact-info { margin-top: 15px; font-size: 0.9rem; }
                    .receipt-footer { margin-top: 30px; text-align: center; font-style: italic; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .receipt-card { border: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${receiptClone.outerHTML}
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

/**
 * Emails a donation receipt
 * @param {number} donationId - The ID of the donation to email receipt for
 */
function emailReceipt(donationId) {
    const recipient = "rcdnetciuganda@gmail.com";
    const subject = encodeURIComponent("Donation Receipt #" + donationId);
    const body = encodeURIComponent(
        `Dear Donor,\n\nThank you for your generous donation. Please find attached your official donation receipt.\n\nWith kind regards,\nMrs. Muhindo Justine\nBoard Treasurer\nRwenzori Community Development Network`
    );

    const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
    window.open(gmailURL, '_blank');
}
