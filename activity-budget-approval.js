// budget-approval.js

// Global variables
let currentActivityId = null;

// Initialize the budget approval system
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for budget-related actions
    setupBudgetEventListeners();
    
    // Load initial data if on the activities page
    if (document.getElementById('activitiesTableBody')) {
        loadActivities();
    }
});

function setupBudgetEventListeners() {
    // Handle budget submission
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn.submit-btn')) {
            const activityId = e.target.closest('tr').dataset.activityId;
            if (activityId) {
                submitActivityBudget(parseInt(activityId));
            }
        }
        
        // Handle budget approval
        if (e.target.closest('.action-btn.approve-btn')) {
            const approvalId = e.target.closest('tr').dataset.approvalId;
            if (approvalId) {
                approveBudget(parseInt(approvalId));
            }
        }
        
        // Handle budget rejection
        if (e.target.closest('.action-btn.reject-btn')) {
            const approvalId = e.target.closest('tr').dataset.approvalId;
            if (approvalId) {
                rejectBudget(parseInt(approvalId));
            }
        }
    });
}

// Function to submit a budget for approval
async function submitActivityBudget(activityId) {
    try {
        const response = await fetch(`/activities/${activityId}/submit-budget/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to submit budget');
        }

        const data = await response.json();
        showToast('Budget submitted for approval successfully!');
        
        // Refresh the activities table to update the status
        if (document.getElementById('activitiesTableBody')) {
            loadActivities();
        }
        
        return data;
    } catch (error) {
        console.error('Error submitting budget:', error);
        showToast(`Failed to submit budget: ${error.message}`, 'error');
        throw error;
    }
}

// Function to approve a budget
async function approveBudget(approvalId, remarks = '') {
    try {
        const response = await fetch(`/budget-approvals/${approvalId}/approve/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approved: true,
                remarks: remarks
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to approve budget');
        }

        const data = await response.json();
        showToast('Budget approved successfully!');
        
        // Refresh the approvals list
        if (document.getElementById('pendingApprovalsTableBody')) {
            loadPendingApprovals();
        }
        
        return data;
    } catch (error) {
        console.error('Error approving budget:', error);
        showToast(`Failed to approve budget: ${error.message}`, 'error');
        throw error;
    }
}

// Function to reject a budget
async function rejectBudget(approvalId, remarks = '') {
    if (!remarks) {
        remarks = prompt('Please enter the reason for rejection:');
        if (!remarks) {
            showToast('Rejection reason is required', 'error');
            return;
        }
    }

    try {
        const response = await fetch(`/budget-approvals/${approvalId}/approve/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approved: false,
                remarks: remarks
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to reject budget');
        }

        const data = await response.json();
        showToast('Budget rejected successfully!');
        
        // Refresh the approvals list
        if (document.getElementById('pendingApprovalsTableBody')) {
            loadPendingApprovals();
        }
        
        return data;
    } catch (error) {
        console.error('Error rejecting budget:', error);
        showToast(`Failed to reject budget: ${error.message}`, 'error');
        throw error;
    }
}

// Function to load pending approvals (for directors)
async function loadPendingApprovals() {
    try {
        const response = await fetch('/budget-approvals/pending/');
        
        if (!response.ok) {
            throw new Error('Failed to fetch pending approvals');
        }
        
        const approvals = await response.json();
        const tableBody = document.getElementById('pendingApprovalsTableBody');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (approvals.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No pending budget approvals</td></tr>';
            return;
        }
        
        approvals.forEach(approval => {
            const row = document.createElement('tr');
            row.dataset.approvalId = approval.id;
            row.innerHTML = `
                <td>${approval.activity_name}</td>
                <td>${approval.project_name}</td>
                <td>UGX ${approval.budget_amount.toLocaleString()}</td>
                <td>${new Date(approval.submitted_at).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn approve-btn">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-btn reject-btn">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        if (document.getElementById('pendingApprovalsTableBody')) {
            document.getElementById('pendingApprovalsTableBody').innerHTML = 
                '<tr><td colspan="5" style="color: red;">Failed to load pending approvals</td></tr>';
        }
    }
}

// Function to load activities with budget status
async function loadActivities() {
    try {
        const response = await fetch('/activities/');
        
        if (!response.ok) {
            throw new Error('Failed to fetch activities');
        }
        
        const activities = await response.json();
        const tableBody = document.getElementById('activitiesTableBody');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.dataset.activityId = activity.id;
            
            // Determine status badge and text
            let statusBadge = '';
            let statusText = '';
            let submitButton = '';
            
            if (activity.budget_status === 'approved') {
                statusBadge = 'status-badge approved';
                statusText = 'Approved';
            } else if (activity.budget_status === 'rejected') {
                statusBadge = 'status-badge rejected';
                statusText = 'Rejected';
            } else if (activity.budget_status === 'pending') {
                statusBadge = 'status-badge pending';
                statusText = 'Pending Approval';
            } else {
                statusBadge = 'status-badge draft';
                statusText = 'Draft';
                submitButton = `
                    <button class="action-btn submit-btn">
                        <i class="fas fa-paper-plane"></i> Submit
                    </button>
                `;
            }
            
            row.innerHTML = `
                <td>${activity.name}</td>
                <td>${activity.project_name}</td>
                <td>${activity.start_date}</td>
                <td>${activity.end_date}</td>
                <td>UGX ${activity.budget.toLocaleString()}</td>
                <td><span class="${statusBadge}">${statusText}</span></td>
                <td>
                    ${submitButton}
                    <button class="action-btn budget-btn" onclick="manageActivityBudget(${activity.id}, '${activity.name}')">
                        <i class="fas fa-coins"></i> Budget
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading activities:', error);
        if (document.getElementById('activitiesTableBody')) {
            document.getElementById('activitiesTableBody').innerHTML = 
                '<tr><td colspan="7" style="color: red;">Failed to load activities</td></tr>';
        }
    }
}

// Helper function to show toast messages
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

// Function to manage activity budget (opens budget management modal)
function manageActivityBudget(activityId, activityName) {
    currentActivityId = activityId;
    
    // Set the activity name in the modal
    document.getElementById('budgetForActivityName').textContent = activityName;
    
    // Load budget items for this activity
    loadBudgetItems(activityId);
    
    // Show the modal
    document.getElementById('createBudgetModal').classList.add('show');
}

// Function to load budget items for an activity
async function loadBudgetItems(activityId) {
    try {
        const response = await fetch(`/activities/${activityId}/budget-items/`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch budget items');
        }
        
        const budgetItems = await response.json();
        const tableBody = document.getElementById('budgetItemsTableBody');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        let totalAmount = 0;
        
        budgetItems.forEach(item => {
            totalAmount += item.quantity * item.unit_price;
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
            tableBody.appendChild(row);
        });
        
        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td colspan="4">Total Budget</td>
            <td>UGX ${totalAmount.toLocaleString()}</td>
            <td colspan="2"></td>
        `;
        tableBody.appendChild(totalRow);
    } catch (error) {
        console.error('Error loading budget items:', error);
        if (document.getElementById('budgetItemsTableBody')) {
            document.getElementById('budgetItemsTableBody').innerHTML = 
                '<tr><td colspan="7" style="color: red;">Failed to load budget items</td></tr>';
        }
    }
}

// Function to create a new budget item
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
        showToast('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/activities/${activityId}/budget-items/`, {
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
        
        // Refresh budget items list
        loadBudgetItems(activityId);
    } catch (error) {
        console.error('Error creating budget item:', error);
        showToast(`Failed to create budget item: ${error.message}`, 'error');
    }
}

// Expose functions to global scope
window.manageActivityBudget = manageActivityBudget;
window.createBudgetItem = createBudgetItem;
window.submitActivityBudget = submitActivityBudget;
window.approveBudget = approveBudget;
window.rejectBudget = rejectBudget;
