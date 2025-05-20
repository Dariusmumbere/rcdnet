/**
 * Function to delete a donation record
 * @param {number} donationId - The ID of the donation to delete
 */
async function deleteDonation(donationId) {
    // Confirm with the user before deletion
    if (!confirm('Are you sure you want to delete this donation record? This action cannot be undone.')) {
        return;
    }

    try {
        // Show loading state
        const deleteBtn = document.querySelector(`.action-btn.delete-btn[onclick="deleteDonation(${donationId})"]`);
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            deleteBtn.disabled = true;
        }

        // Call the delete endpoint
        const response = await fetch(`https://backend-jz65.onrender.com/donations/${donationId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete donation');
        }

        // Remove the donation row from the table
        const row = document.querySelector(`tr[data-donation-id="${donationId}"]`);
        if (row) {
            row.remove();
        }

        // Remove the corresponding receipt if exists
        const receipt = document.getElementById(`receipt-${donationId}`);
        if (receipt) {
            receipt.remove();
        }

        // Show success message
        showToast('Donation deleted successfully', 'success');

        // Refresh the dashboard summary to update totals
        await loadDashboardSummary();

    } catch (error) {
        console.error('Error deleting donation:', error);
        showToast(`Failed to delete donation: ${error.message}`, 'error');
    } finally {
        // Restore button state
        const deleteBtn = document.querySelector(`.action-btn.delete-btn[onclick="deleteDonation(${donationId})"]`);
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.disabled = false;
        }
    }
}

/**
 * Helper function to show toast notifications
 * @param {string} message - The message to display
 * @param {string} type - Type of notification ('success', 'error', etc.)
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Make the function available globally
window.deleteDonation = deleteDonation;
