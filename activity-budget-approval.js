// activity-budget-approval.js

// Global variables
let currentActivityId = null;
let currentApprovalStatus = null;

// Initialize the budget approval functionality
function initBudgetApproval() {
    // Load activities with their budget status
    loadActivities();
    
    // Set up event listeners for buttons in the activities table
    document.addEventListener('click', function(e) {
        // Handle submit button clicks
        if (e.target.closest('.action-btn.submit-btn')) {
            const activityId = e.target.closest('tr').dataset.activityId;
            submitActivityBudget(activityId);
        }
        
        // Handle budget management button clicks
        if (e.target.closest('.action-btn.budget-btn')) {
            const activityId = e.target.closest('tr').dataset.activityId;
            const activityName = e.target.closest('tr').querySelector('td:first-child').textContent;
            manageActivityBudget(activityId, activityName);
        }
    });
}

// Load activities with their budget status
async function loadActivities() {
    try {
        const response = await fetch('https://man-m681.onrender.com/activities/');
        const activities = await response.json();
        
        const tableBody = document.getElementById('activitiesTableBody');
        tableBody.innerHTML = '';
        
        for (const activity of activities) {
            // Get budget status for each activity
            const statusResponse = await fetch(`https://man-m681.onrender.com/activities/${activity.id}/budget-status/`);
            const budgetStatus = await statusResponse.json();
            
            // Determine status badge class and text
            const statusBadge = {
                'approved': 'status-badge approved',
                'rejected': 'status-badge rejected',
                'pending': 'status-badge pending',
                'not_submitted': 'status-badge draft'
            }[budgetStatus.status] || 'status-badge draft';
            
            const statusText = {
                'approved': 'Approved',
                'rejected': 'Rejected',
                'pending': 'Pending Approval',
                'not_submitted': 'Draft'
            }[budgetStatus.status] || 'Draft';
            
            // Create table row
            const row = document.createElement('tr');
            row.dataset.activityId = activity.id;
            row.innerHTML = `
                <td>${activity.name}</td>
                <td>${activity.project_name}</td>
                <td>${activity.start_date}</td>
                <td>${activity.end_date}</td>
                <td>UGX ${activity.budget.toLocaleString()}</td>
                <td><span class="${statusBadge}">${statusText}</span></td>
                <td>
                    <button class="action-btn submit-btn" onclick="submitActivityBudget(${activity.id})">
                        <i class="fas fa-paper-plane"></i> Submit
                    </button>
                    <button class="action-btn budget-btn" onclick="manageActivityBudget(${activity.id}, '${activity.name}')">
                        <i class="fas fa-coins"></i> Budget
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activitiesTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red;">
                    Failed to load activities: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Submit activity budget for approval
async function submitActivityBudget(activityId) {
    if (!confirm('Are you sure you want to submit this budget for approval?')) {
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = document.querySelector(`tr[data-activity-id="${activityId}"] .submit-btn`);
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/submit-budget/`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to submit budget');
        }
        
        const data = await response.json();
        showToast('Budget submitted for approval successfully!');
        
        // Update the status in the table
        const statusCell = document.querySelector(`tr[data-activity-id="${activityId}"] .status-badge`);
        if (statusCell) {
            statusCell.className = 'status-badge pending';
            statusCell.textContent = 'Pending Approval';
        }
        
    } catch (error) {
        console.error('Error submitting budget:', error);
        showToast(`Failed to submit budget: ${error.message}`, 'error');
    } finally {
        // Restore button state
        const submitBtn = document.querySelector(`tr[data-activity-id="${activityId}"] .submit-btn`);
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
            submitBtn.disabled = false;
        }
    }
}

// Manage activity budget (opens budget management modal)
function manageActivityBudget(activityId, activityName) {
    currentActivityId = activityId;
    
    // Show modal with activity name
    document.getElementById('budgetForActivityName').textContent = activityName;
    document.getElementById('createBudgetModal').classList.add('show');
    
    // Load budget items for this activity
    loadBudgetItems(activityId);
}

// Load budget items for an activity
async function loadBudgetItems(activityId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch budget items');
        }
        
        const budgetItems = await response.json();
        const tableBody = document.getElementById('budgetItemsTableBody');
        tableBody.innerHTML = '';
        
        let totalAmount = 0;
        
        budgetItems.forEach(item => {
            const itemTotal = item.quantity * item.unit_price;
            totalAmount += itemTotal;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.description || '-'}</td>
                <td>${item.quantity}</td>
                <td>UGX ${item.unit_price.toLocaleString()}</td>
                <td>UGX ${itemTotal.toLocaleString()}</td>
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
            tableBody.appendChild(row);
        });
        
        // Update total row
        document.getElementById('budgetTotalAmount').textContent = `UGX ${totalAmount.toLocaleString()}`;
        
    } catch (error) {
        console.error('Error loading budget items:', error);
        document.getElementById('budgetItemsTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red;">
                    Failed to load budget items: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Create a new budget item
async function createBudgetItem() {
    const activityId = currentActivityId;
    const budgetData = {
        item_name: document.getElementById('budgetItemName').value.trim(),
        description: document.getElementById('budgetItemDescription').value.trim(),
        quantity: parseFloat(document.getElementById('budgetItemQuantity').value),
        unit_price: parseFloat(document.getElementById('budgetItemUnitPrice').value),
        category: document.getElementById('budgetItemCategory').value
    };
    
    // Validate required fields
    if (!budgetData.item_name || isNaN(budgetData.quantity) || isNaN(budgetData.unit_price)) {
        showToast('Please fill in all required budget fields with valid values', 'error');
        return;
    }
    
    // Additional validation
    if (budgetData.quantity <= 0 || budgetData.unit_price <= 0) {
        showToast('Quantity and unit price must be greater than 0', 'error');
        return;
    }
    
    try {
        const submitBtn = document.querySelector('#createBudgetModal .modal-footer .file-manager-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`, {
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
        
        const data = await response.json();
        showToast('Budget item created successfully!');
        
        // Reset form
        document.getElementById('budgetItemName').value = '';
        document.getElementById('budgetItemDescription').value = '';
        document.getElementById('budgetItemQuantity').value = '1';
        document.getElementById('budgetItemUnitPrice').value = '';
        
        // Reload budget items
        loadBudgetItems(activityId);
        
    } catch (error) {
        console.error('Error creating budget item:', error);
        showToast(`Failed to create budget item: ${error.message}`, 'error');
    } finally {
        const submitBtn = document.querySelector('#createBudgetModal .modal-footer .file-manager-btn');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Edit a budget item
async function editBudgetItem(itemId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-items/${itemId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch budget item');
        }
        
        const item = await response.json();
        
        // Populate the form
        document.getElementById('budgetItemName').value = item.item_name;
        document.getElementById('budgetItemDescription').value = item.description || '';
        document.getElementById('budgetItemQuantity').value = item.quantity;
        document.getElementById('budgetItemUnitPrice').value = item.unit_price;
        document.getElementById('budgetItemCategory').value = item.category;
        
        // Change the modal title and button text
        document.querySelector('#createBudgetModal .modal-header h3').textContent = 'Edit Budget Item';
        document.querySelector('#createBudgetModal .modal-footer .file-manager-btn').textContent = 'Update Item';
        
        // Store the item ID for update
        document.getElementById('createBudgetModal').dataset.itemId = itemId;
        
    } catch (error) {
        console.error('Error editing budget item:', error);
        showToast(`Failed to load budget item for editing: ${error.message}`, 'error');
    }
}

// Delete a budget item
async function deleteBudgetItem(itemId) {
    if (!confirm('Are you sure you want to delete this budget item?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete budget item');
        }
        
        showToast('Budget item deleted successfully!');
        loadBudgetItems(currentActivityId);
        
    } catch (error) {
        console.error('Error deleting budget item:', error);
        showToast(`Failed to delete budget item: ${error.message}`, 'error');
    }
}

// Show toast notifications
function showToast(message, type = 'success') {
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
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBudgetApproval();
});

// Expose functions to global scope
window.submitActivityBudget = submitActivityBudget;
window.manageActivityBudget = manageActivityBudget;
window.createBudgetItem = createBudgetItem;
window.editBudgetItem = editBudgetItem;
window.deleteBudgetItem = deleteBudgetItem;
