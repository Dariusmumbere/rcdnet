// Update your submitDonation function to use the new endpoint
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
            ? `https://backend-jz65.onrender.com/donations/${donationId}`
            : 'https://backend-jz65.onrender.com/donations/with-stats/';
            
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

// Update the donor profile display to show the stats
async function loadDonorData(donorId) {
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/donors/${donorId}`);
        
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
        
        // Update stats in the modal
        if (donor.stats) {
            document.getElementById('totalDonations').textContent = `UGX ${donor.stats.total_donated?.toLocaleString() || '0'}`;
            document.getElementById('donationCount').textContent = donor.stats.donation_count || '0';
            document.getElementById('firstDonation').textContent = donor.stats.first_donation ? 
                new Date(donor.stats.first_donation).toLocaleDateString() : '-';
            document.getElementById('lastDonation').textContent = donor.stats.last_donation ? 
                new Date(donor.stats.last_donation).toLocaleDateString() : '-';
        } else {
            // Initialize empty stats if none exist
            document.getElementById('totalDonations').textContent = 'UGX 0';
            document.getElementById('donationCount').textContent = '0';
            document.getElementById('firstDonation').textContent = '-';
            document.getElementById('lastDonation').textContent = '-';
        }
        
        // Load donation history
        loadDonorDonations(donorId);
    } catch (error) {
        console.error('Error loading donor data:', error);
        alert(`Failed to load donor data: ${error.message}`);
    }
}
