// Budget Workflow Management Script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize budget workflow functionality
    initBudgetWorkflow();
});

function initBudgetWorkflow() {
    // Event listeners for budget-related actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.budget-btn')) {
            const activityId = e.target.closest('tr').dataset.activityId;
            const activityName = e.target.closest('tr').querySelector('td:first-child').textContent;
            manageActivityBudget(activityId, activityName);
        }
        
        if (e.target.closest('#submitBudgetBtn')) {
            const activityId = document.getElementById('budgetActivityId').value;
            submitBudgetForApproval(activityId);
        }
    });
    
    // Initialize the budget approval section if on director dashboard
    if (document.getElementById('pendingApprovalsContainer')) {
        loadPendingApprovals();
    }
}

// Function to manage activity budget
async function manageActivityBudget(activityId, activityName) {
    try {
        // First check approval status
        const approval = await checkApprovalStatus(activityId);
        
        if (approval) {
            if (approval.status === 'pending') {
                showToast(`Budget for "${activityName}" is pending approval by the Director`, 'info');
                return;
            } else if (approval.status === 'approved') {
                showToast(`Budget for "${activityName}" has been approved (UGX ${approval.approved_amount.toLocaleString()})`, 'success');
                showBudgetManagementModal(activityId, activityName);
                return;
            } else if (approval.status === 'rejected') {
                showToast(`Budget for "${activityName}" was rejected. Notes: ${approval.approver_notes || 'None'}`, 'error');
                return;
            }
        }
        
        // If no approval exists, prompt to create one
        if (confirm(`Before managing the budget for "${activityName}", you need to submit it for Director approval. Proceed?`)) {
            await createBudgetApproval(activityId, activityName);
        }
    } catch (error) {
        console.error('Error managing activity budget:', error);
        showToast('Failed to manage activity budget', 'error');
    }
}

// Function to show budget management modal
function showBudgetManagementModal(activityId, activityName) {
    // Reset form
    document.getElementById('budgetForm').reset();
    
    // Set activity info
    document.getElementById('budgetActivityId').value = activityId;
    document.getElementById('budgetActivityName').textContent = activityName;
    
    // Load budget items
    loadBudgetItems(activityId);
    
    // Show modal
    document.getElementById('budgetManagementModal').classList.add('show');
}

// Function to load budget items for an activity
async function loadBudgetItems(activityId) {
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-items`);
        if (!response.ok) throw new Error('Failed to fetch budget items');
        
        const budgetItems = await response.json();
        const tbody = document.getElementById('budgetItemsTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        let total = 0;
        
        budgetItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.description || '-'}</td>
                <td>${item.quantity}</td>
                <td>UGX ${item.unit_price.toLocaleString()}</td>
                <td>UGX ${(item.quantity * item.unit_price).toLocaleString()}</td>
                <td>${item.category}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editBudgetItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteBudgetItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            
            total += item.quantity * item.unit_price;
        });
        
        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td colspan="4"><strong>Total</strong></td>
            <td><strong>UGX ${total.toLocaleString()}</strong></td>
            <td colspan="2"></td>
        `;
        tbody.appendChild(totalRow);
        
    } catch (error) {
        console.error('Error loading budget items:', error);
        document.getElementById('budgetItemsTable').querySelector('tbody').innerHTML = `
            <tr><td colspan="7" style="text-align: center; color: red;">Failed to load budget items</td></tr>
        `;
    }
}

// Function to create a new budget item
async function createBudgetItem() {
    const activityId = document.getElementById('budgetActivityId').value;
    const form = document.getElementById('budgetItemForm');
    
    const budgetData = {
        item_name: form.itemName.value.trim(),
        description: form.description.value.trim(),
        quantity: parseFloat(form.quantity.value),
        unit_price: parseFloat(form.unitPrice.value),
        category: form.category.value
    };
    
    // Validate required fields
    if (!budgetData.item_name || isNaN(budgetData.quantity) || isNaN(budgetData.unit_price)) {
        showToast('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    if (budgetData.quantity <= 0 || budgetData.unit_price <= 0) {
        showToast('Quantity and unit price must be greater than 0', 'error');
        return;
    }
    
    try {
        const submitBtn = document.getElementById('saveBudgetItemBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(budgetData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create budget item');
        }
        
        showToast('Budget item created successfully', 'success');
        form.reset();
        loadBudgetItems(activityId);
        
    } catch (error) {
        console.error('Error creating budget item:', error);
        showToast(`Failed to create budget item: ${error.message}`, 'error');
    } finally {
        const submitBtn = document.getElementById('saveBudgetItemBtn');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Function to submit budget for approval
async function submitBudgetForApproval(activityId) {
    try {
        const activityName = document.getElementById('budgetActivityName').textContent;
        
        // First check if there's already an approval request
        const response = await fetch(`https://backend-jz65.onrender.com/budget-approvals/activity/${activityId}`);
        
        if (response.ok) {
            const existingApproval = await response.json();
            if (existingApproval.status === 'pending') {
                showToast(`There's already a pending approval request for "${activityName}"`, 'info');
                return;
            }
        }
        
        // Get activity details to know the requested amount
        const activityResponse = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}`);
        if (!activityResponse.ok) throw new Error('Failed to fetch activity details');
        
        const activity = await activityResponse.json();
        
        // Create approval request
        const approvalResponse = await fetch('https://backend-jz65.onrender.com/budget-approvals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity_id: activityId,
                approved_amount: activity.budget, // Initially same as requested
                status: 'pending'
            })
        });
        
        if (!approvalResponse.ok) throw new Error('Failed to create approval request');
        
        showToast(`Budget approval request for "${activityName}" has been submitted to the Director`, 'success');
        document.getElementById('budgetManagementModal').classList.remove('show');
        
    } catch (error) {
        console.error('Error submitting budget for approval:', error);
        showToast(`Failed to submit budget for approval: ${error.message}`, 'error');
    }
}

// Function to load pending approvals for director
async function loadPendingApprovals() {
    try {
        const container = document.getElementById('pendingApprovalsContainer');
        container.innerHTML = '<div class="loading">Loading pending approvals...</div>';
        
        const response = await fetch('https://backend-jz65.onrender.com/budget-approvals/pending');
        if (!response.ok) throw new Error('Failed to fetch pending approvals');
        
        const approvals = await response.json();
        container.innerHTML = '';
        
        if (approvals.length === 0) {
            container.innerHTML = '<p class="empty-state">No pending budget approvals</p>';
            return;
        }
        
        approvals.forEach(approval => {
            const approvalCard = document.createElement('div');
            approvalCard.className = 'approval-card';
            approvalCard.innerHTML = `
                <div class="approval-header">
                    <h4>${approval.activity_name}</h4>
                    <span class="status-badge pending">Pending</span>
                </div>
                <div class="approval-details">
                    <p><strong>Project:</strong> ${approval.project_name}</p>
                    <p><strong>Requested Amount:</strong> UGX ${approval.requested_amount.toLocaleString()}</p>
                    <div class="approval-actions">
                        <div class="form-group">
                            <label for="approvedAmount-${approval.id}">Approved Amount (UGX)</label>
                            <input type="number" id="approvedAmount-${approval.id}" 
                                   value="${approval.requested_amount}" min="0" 
                                   step="0.01" placeholder="Approved amount">
                        </div>
                        <div class="form-group">
                            <label for="approvalNotes-${approval.id}">Notes</label>
                            <textarea id="approvalNotes-${approval.id}" 
                                      placeholder="Approval notes (optional)"></textarea>
                        </div>
                        <div class="button-group">
                            <button class="file-manager-btn" onclick="approveBudget(${approval.id}, true)">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="file-manager-btn delete-btn" onclick="approveBudget(${approval.id}, false)">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(approvalCard);
        });
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        document.getElementById('pendingApprovalsContainer').innerHTML = `
            <p class="error">Failed to load approvals: ${error.message}</p>
        `;
    }
}

// Function to approve/reject a budget
async function approveBudget(approvalId, isApproved) {
    try {
        const amountInput = document.getElementById(`approvedAmount-${approvalId}`);
        const notesInput = document.getElementById(`approvalNotes-${approvalId}`);
        
        const approvedAmount = isApproved ? parseFloat(amountInput.value) : 0;
        const approverNotes = notesInput.value;
        
        if (isApproved && (isNaN(approvedAmount) || approvedAmount <= 0)) {
            showToast('Please enter a valid approved amount', 'error');
            return;
        }
        
        const response = await fetch(`https://backend-jz65.onrender.com/budget-approvals/${approvalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approved_amount: approvedAmount,
                approver_notes: approverNotes,
                status: isApproved ? 'approved' : 'rejected'
            })
        });
        
        if (!response.ok) throw new Error('Failed to update approval');
        
        showToast(`Budget ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
        loadPendingApprovals(); // Refresh the list
        
    } catch (error) {
        console.error('Error approving budget:', error);
        showToast(`Failed to ${isApproved ? 'approve' : 'reject'} budget: ${error.message}`, 'error');
    }
}

// Function to check approval status for an activity
async function checkApprovalStatus(activityId) {
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/budget-approvals/activity/${activityId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // No approval request exists
            }
            throw new Error('Failed to check approval status');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error checking approval status:', error);
        return null;
    }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Close modal with close button
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-btn') || e.target.closest('.close-btn')) {
        e.target.closest('.modal').classList.remove('show');
    }
});

// Expose functions to global scope
window.manageActivityBudget = manageActivityBudget;
window.createBudgetItem = createBudgetItem;
window.submitBudgetForApproval = submitBudgetForApproval;
window.approveBudget = approveBudget;
window.loadPendingApprovals = loadPendingApprovals;
