// activity-budget-approval.js

// Function to load activity budgets with their approval status
async function loadActivityBudgets() {
    try {
        const response = await fetch('https://man-m681.onrender.com/activities/');
        if (!response.ok) throw new Error('Failed to fetch activities');
        
        const activities = await response.json();
        const tableBody = document.getElementById('activitiesTableBody');
        tableBody.innerHTML = '';
        
        for (const activity of activities) {
            // Get budget status for each activity
            const statusResponse = await fetch(`https://man-m681.onrender.com/activities/${activity.id}/budget-status/`);
            const budgetStatus = await statusResponse.json();
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.name}</td>
                <td>${activity.project_name}</td>
                <td>${activity.start_date}</td>
                <td>${activity.end_date}</td>
                <td>UGX ${activity.budget.toLocaleString()}</td>
                <td>
                    <span class="status-badge ${budgetStatus.status}">
                        ${formatStatusText(budgetStatus.status)}
                    </span>
                </td>
                <td>
                    <button class="action-btn submit-btn" onclick="submitActivityBudget(${activity.id})">
                        <i class="fas fa-paper-plane"></i> Submit
                    </button>
                    <button class="action-btn budget-btn" onclick="manageActivityBudget(${activity.id}, '${activity.name}')">
                        <i class="fas fa-coins"></i> Budget
                    </button>
                    ${budgetStatus.status === 'approved' ? `
                    <button class="action-btn view-btn" onclick="viewApprovedBudget(${activity.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading activity budgets:', error);
        document.getElementById('activitiesTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red;">
                    Failed to load activities: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Format status text for display
function formatStatusText(status) {
    const statusMap = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'pending': 'Pending Approval'
    };
    return statusMap[status] || status;
}

// Submit activity budget for approval
async function submitActivityBudget(activityId) {
    if (!confirm('Are you sure you want to submit this budget for approval?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/submit-budget/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit budget');
        }
        
        const result = await response.json();
        showToast('Budget submitted for approval successfully!');
        loadActivityBudgets(); // Refresh the table
    } catch (error) {
        console.error('Error submitting budget:', error);
        showToast(`Failed to submit budget: ${error.message}`, 'error');
    }
}

// Manage activity budget (opens budget management modal)
function manageActivityBudget(activityId, activityName) {
    // Store activity info for the budget modal
    document.getElementById('budgetModalActivityId').value = activityId;
    document.getElementById('budgetModalActivityName').textContent = activityName;
    
    // Load budget items for this activity
    loadBudgetItems(activityId);
    
    // Show the modal
    document.getElementById('budgetManagementModal').classList.add('show');
}

// Load budget items for an activity
async function loadBudgetItems(activityId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`);
        if (!response.ok) throw new Error('Failed to fetch budget items');
        
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

// Add new budget item
async function addBudgetItem() {
    const activityId = document.getElementById('budgetModalActivityId').value;
    const form = document.getElementById('budgetItemForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add budget item');
        }
        
        const result = await response.json();
        showToast('Budget item added successfully!');
        form.reset();
        loadBudgetItems(activityId); // Refresh the list
    } catch (error) {
        console.error('Error adding budget item:', error);
        showToast(`Failed to add budget item: ${error.message}`, 'error');
    }
}

// View approved budget details
async function viewApprovedBudget(activityId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/approved-budget/`);
        if (!response.ok) throw new Error('Failed to fetch approved budget');
        
        const budget = await response.json();
        
        // Create a modal to display the approved budget
        const modalHTML = `
            <div class="modal show" id="approvedBudgetModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Approved Budget Details</h3>
                        <button class="close-btn" onclick="document.getElementById('approvedBudgetModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h4>${budget.activity_name}</h4>
                        <p>Project: ${budget.project_name}</p>
                        <p>Total Budget: UGX ${budget.total_amount.toLocaleString()}</p>
                        <p>Approved By: ${budget.approved_by}</p>
                        <p>Approval Date: ${new Date(budget.approval_date).toLocaleString()}</p>
                        
                        <h5>Budget Items:</h5>
                        <div class="table-responsive">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Description</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                        <th>Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${budget.items.map(item => `
                                        <tr>
                                            <td>${item.item_name}</td>
                                            <td>${item.description || '-'}</td>
                                            <td>${item.quantity}</td>
                                            <td>UGX ${item.unit_price.toLocaleString()}</td>
                                            <td>UGX ${(item.quantity * item.unit_price).toLocaleString()}</td>
                                            <td>${item.category}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="file-manager-btn" onclick="printBudget(${activityId})">
                            <i class="fas fa-print"></i> Print Budget
                        </button>
                        <button class="file-manager-btn secondary" onclick="document.getElementById('approvedBudgetModal').remove()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error viewing approved budget:', error);
        showToast(`Failed to view approved budget: ${error.message}`, 'error');
    }
}

// Show toast notification
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

// Initialize the budget approval workflow
document.addEventListener('DOMContentLoaded', function() {
    // Load budgets when the page loads if we're on the activities page
    if (document.getElementById('activitiesTableBody')) {
        loadActivityBudgets();
    }
    
    // Set up form submission for adding budget items
    const budgetItemForm = document.getElementById('budgetItemForm');
    if (budgetItemForm) {
        budgetItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addBudgetItem();
        });
    }
});

// Make functions available globally
window.submitActivityBudget = submitActivityBudget;
window.manageActivityBudget = manageActivityBudget;
window.viewApprovedBudget = viewApprovedBudget;
window.addBudgetItem = addBudgetItem;
