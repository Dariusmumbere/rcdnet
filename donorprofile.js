// activityBudgetApproval.js

// Global variables to track state
let currentActivityId = null;
let currentProgramArea = null;

// Initialize the budget approval system
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadActivities();
    loadProgramCards();
    
    // Set up event listeners
    setupBudgetApprovalListeners();
});

// Set up event listeners for budget approval workflow
function setupBudgetApprovalListeners() {
    // Budget button in activities table
    document.addEventListener('click', function(e) {
        if (e.target.closest('.budget-btn')) {
            const activityId = e.target.closest('tr').dataset.activityId;
            const activityName = e.target.closest('tr').querySelector('td:first-child').textContent;
            manageActivityBudget(activityId, activityName);
        }
    });
    
    // Create budget modal form submission
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createBudgetItem();
        });
    }
    
    // Approve budget button in director dashboard
    const approveBudgetBtn = document.getElementById('approveBudgetBtn');
    if (approveBudgetBtn) {
        approveBudgetBtn.addEventListener('click', function() {
            approveActivityBudget(currentActivityId, true);
        });
    }
    
    // Reject budget button in director dashboard
    const rejectBudgetBtn = document.getElementById('rejectBudgetBtn');
    if (rejectBudgetBtn) {
        rejectBudgetBtn.addEventListener('click', function() {
            approveActivityBudget(currentActivityId, false);
        });
    }
}

// Function to manage activity budget
async function manageActivityBudget(activityId, activityName) {
    currentActivityId = activityId;
    
    // Create or show the budget management modal
    if (!document.getElementById('createBudgetModal')) {
        createBudgetModal(activityName);
    } else {
        document.getElementById('budgetForActivityName').textContent = activityName;
    }
    
    // Load existing budget items
    await loadActivityBudgetItems(activityId);
    
    // Show the modal
    document.getElementById('createBudgetModal').classList.add('show');
}

// Create the budget modal dynamically
function createBudgetModal(activityName) {
    const modalHTML = `
        <div class="project-modal" id="createBudgetModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create Budget for <span id="budgetForActivityName">${activityName}</span></h3>
                    <button class="close-btn" onclick="closeModal('createBudgetModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="budgetForm">
                        <div class="form-group">
                            <label for="budgetItemName">Item Name*</label>
                            <input type="text" id="budgetItemName" required>
                        </div>
                        <div class="form-group">
                            <label for="budgetItemDescription">Description</label>
                            <textarea id="budgetItemDescription" rows="2"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="budgetItemQuantity">Quantity*</label>
                                <input type="number" id="budgetItemQuantity" value="1" min="1" required>
                            </div>
                            <div class="form-group">
                                <label for="budgetItemUnitPrice">Unit Price (UGX)*</label>
                                <input type="number" id="budgetItemUnitPrice" min="0" step="0.01" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="budgetItemCategory">Category*</label>
                            <select id="budgetItemCategory" required>
                                <option value="materials">Materials</option>
                                <option value="labor">Labor</option>
                                <option value="transport">Transport</option>
                                <option value="equipment">Equipment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </form>
                    
                    <div class="table-responsive" style="margin-top: 20px;">
                        <table class="modern-table" id="budgetItemsTable">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="budgetItemsTableBody">
                                <!-- Budget items will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="file-manager-btn secondary" onclick="closeModal('createBudgetModal')">
                        Close
                    </button>
                    <button class="file-manager-btn" onclick="submitBudgetForApproval(${currentActivityId})">
                        <i class="fas fa-paper-plane"></i> Submit for Approval
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Load budget items for an activity
async function loadActivityBudgetItems(activityId) {
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch budget items');
        }
        
        const budgetItems = await response.json();
        const tbody = document.getElementById('budgetItemsTableBody');
        tbody.innerHTML = '';
        
        if (budgetItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No budget items found</td></tr>';
            return;
        }
        
        let totalBudget = 0;
        
        budgetItems.forEach(item => {
            totalBudget += item.total;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.description || '-'}</td>
                <td>${item.quantity}</td>
                <td>UGX ${item.unit_price.toLocaleString()}</td>
                <td>UGX ${item.total.toLocaleString()}</td>
                <td>${item.category}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteBudgetItem(${item.id}, ${activityId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td colspan="4" style="text-align: right;"><strong>Total Budget:</strong></td>
            <td><strong>UGX ${totalBudget.toLocaleString()}</strong></td>
            <td colspan="2"></td>
        `;
        tbody.appendChild(totalRow);
        
    } catch (error) {
        console.error('Error loading budget items:', error);
        document.getElementById('budgetItemsTableBody').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load budget items</td></tr>';
    }
}

// Create a new budget item
async function createBudgetItem() {
    const activityId = currentActivityId;
    const itemData = {
        item_name: document.getElementById('budgetItemName').value.trim(),
        description: document.getElementById('budgetItemDescription').value.trim(),
        quantity: parseFloat(document.getElementById('budgetItemQuantity').value),
        unit_price: parseFloat(document.getElementById('budgetItemUnitPrice').value),
        category: document.getElementById('budgetItemCategory').value
    };
    
    // Validate required fields
    if (!itemData.item_name || isNaN(itemData.quantity) || isNaN(itemData.unit_price)) {
        alert('Please fill in all required fields with valid values');
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
            body: JSON.stringify(itemData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to add budget item');
        }
        
        // Refresh the budget items list
        await loadActivityBudgetItems(activityId);
        
        // Clear the form
        document.getElementById('budgetItemName').value = '';
        document.getElementById('budgetItemDescription').value = '';
        document.getElementById('budgetItemQuantity').value = '1';
        document.getElementById('budgetItemUnitPrice').value = '';
        
    } catch (error) {
        console.error('Error adding budget item:', error);
        alert(`Failed to add budget item: ${error.message}`);
    } finally {
        const submitBtn = document.querySelector('#createBudgetModal .modal-footer .file-manager-btn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Item';
            submitBtn.disabled = false;
        }
    }
}

// Delete a budget item
async function deleteBudgetItem(itemId, activityId) {
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
        
        // Refresh the budget items list
        await loadActivityBudgetItems(activityId);
        
    } catch (error) {
        console.error('Error deleting budget item:', error);
        alert('Failed to delete budget item');
    }
}

// Submit budget for director approval
async function submitBudgetForApproval(activityId) {
    try {
        // First get the activity details to determine the program area
        const activityResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}`);
        if (!activityResponse.ok) throw new Error('Failed to fetch activity details');
        
        const activity = await activityResponse.json();
        
        // Get the project to determine the program area
        const projectResponse = await fetch(`https://man-m681.onrender.com/projects/${activity.project_id}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch project details');
        
        const project = await projectResponse.json();
        
        // The program area is stored in the project's funding_source in this example
        // You might need to adjust this based on your actual data structure
        const programArea = project.funding_source;
        currentProgramArea = programArea;
        
        // Calculate total budget
        const budgetItemsResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`);
        if (!budgetItemsResponse.ok) throw new Error('Failed to fetch budget items');
        
        const budgetItems = await budgetItemsResponse.json();
        const totalBudget = budgetItems.reduce((sum, item) => sum + item.total, 0);
        
        // Update activity status to "pending_approval"
        const updateResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...activity,
                status: 'pending_approval'
            })
        });
        
        if (!updateResponse.ok) throw new Error('Failed to update activity status');
        
        // Close the budget modal
        closeModal('createBudgetModal');
        
        // Show success message
        showToast('Budget submitted for director approval', 'success');
        
        // If director is viewing, refresh their view
        if (document.getElementById('directorDashboard').style.display === 'block') {
            loadPendingApprovals();
        }
        
    } catch (error) {
        console.error('Error submitting budget for approval:', error);
        showToast(`Failed to submit budget: ${error.message}`, 'error');
    }
}

// Load pending approvals for director
async function loadPendingApprovals() {
    try {
        const response = await fetch('https://man-m681.onrender.com/activities/?status=pending_approval');
        
        if (!response.ok) {
            throw new Error('Failed to fetch pending approvals');
        }
        
        const pendingActivities = await response.json();
        const container = document.getElementById('pendingApprovalsContainer');
        
        if (!container) {
            console.error('Pending approvals container not found');
            return;
        }
        
        container.innerHTML = '';
        
        if (pendingActivities.length === 0) {
            container.innerHTML = '<p>No pending approvals at this time.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'modern-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Activity Name</th>
                    <th>Project</th>
                    <th>Budget</th>
                    <th>Program Area</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="pendingApprovalsTableBody"></tbody>
        `;
        
        container.appendChild(table);
        const tbody = document.getElementById('pendingApprovalsTableBody');
        
        pendingActivities.forEach(activity => {
            const row = document.createElement('tr');
            row.dataset.activityId = activity.id;
            row.innerHTML = `
                <td>${activity.name}</td>
                <td>${activity.project_name}</td>
                <td>UGX ${activity.budget.toLocaleString()}</td>
                <td>${activity.project_name}</td> <!-- Using project name as program area in this example -->
                <td>
                    <button class="action-btn view-btn" onclick="viewBudgetDetails(${activity.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        showToast('Failed to load pending approvals', 'error');
    }
}

// View budget details for approval
async function viewBudgetDetails(activityId) {
    currentActivityId = activityId;
    
    try {
        // Get activity details
        const activityResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}`);
        if (!activityResponse.ok) throw new Error('Failed to fetch activity details');
        
        const activity = await activityResponse.json();
        
        // Get budget items
        const budgetItemsResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`);
        if (!budgetItemsResponse.ok) throw new Error('Failed to fetch budget items');
        
        const budgetItems = await budgetItemsResponse.json();
        const totalBudget = budgetItems.reduce((sum, item) => sum + item.total, 0);
        
        // Get project to determine program area
        const projectResponse = await fetch(`https://man-m681.onrender.com/projects/${activity.project_id}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch project details');
        
        const project = await projectResponse.json();
        currentProgramArea = project.funding_source;
        
        // Create or show the approval modal
        if (!document.getElementById('approvalModal')) {
            createApprovalModal(activity, budgetItems, totalBudget);
        } else {
            updateApprovalModal(activity, budgetItems, totalBudget);
        }
        
        document.getElementById('approvalModal').classList.add('show');
        
    } catch (error) {
        console.error('Error viewing budget details:', error);
        showToast('Failed to load budget details', 'error');
    }
}

// Create the approval modal
function createApprovalModal(activity, budgetItems, totalBudget) {
    const modalHTML = `
        <div class="project-modal" id="approvalModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Budget Approval: ${activity.name}</h3>
                    <button class="close-btn" onclick="closeModal('approvalModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="approval-details">
                        <div class="detail-row">
                            <span class="detail-label">Project:</span>
                            <span class="detail-value">${activity.project_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Program Area:</span>
                            <span class="detail-value">${currentProgramArea}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Total Budget:</span>
                            <span class="detail-value">UGX ${totalBudget.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="table-responsive" style="margin-top: 20px;">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Category</th>
                                </tr>
                            </thead>
                            <tbody id="approvalBudgetItemsTableBody">
                                ${budgetItems.map(item => `
                                    <tr>
                                        <td>${item.item_name}</td>
                                        <td>${item.description || '-'}</td>
                                        <td>${item.quantity}</td>
                                        <td>UGX ${item.unit_price.toLocaleString()}</td>
                                        <td>UGX ${item.total.toLocaleString()}</td>
                                        <td>${item.category}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="4" style="text-align: right;">Total Budget:</td>
                                    <td>UGX ${totalBudget.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <label for="approvalRemarks">Remarks (Optional)</label>
                        <textarea id="approvalRemarks" rows="3" placeholder="Add any remarks about this approval"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="file-manager-btn delete-btn" id="rejectBudgetBtn">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="file-manager-btn" id="approveBudgetBtn">
                        <i class="fas fa-check"></i> Approve
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Update the approval modal with new data
function updateApprovalModal(activity, budgetItems, totalBudget) {
    document.getElementById('approvalModal').querySelector('.modal-header h3').textContent = 
        `Budget Approval: ${activity.name}`;
    
    const details = document.querySelector('.approval-details');
    details.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Project:</span>
            <span class="detail-value">${activity.project_name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Program Area:</span>
            <span class="detail-value">${currentProgramArea}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Budget:</span>
            <span class="detail-value">UGX ${totalBudget.toLocaleString()}</span>
        </div>
    `;
    
    const tbody = document.getElementById('approvalBudgetItemsTableBody');
    tbody.innerHTML = budgetItems.map(item => `
        <tr>
            <td>${item.item_name}</td>
            <td>${item.description || '-'}</td>
            <td>${item.quantity}</td>
            <td>UGX ${item.unit_price.toLocaleString()}</td>
            <td>UGX ${item.total.toLocaleString()}</td>
            <td>${item.category}</td>
        </tr>
    `).join('');
    
    document.querySelector('#approvalModal tfoot .total-row td:nth-child(2)').textContent = 
        `UGX ${totalBudget.toLocaleString()}`;
}

// Approve or reject a budget
async function approveActivityBudget(activityId, approved) {
    try {
        const remarks = document.getElementById('approvalRemarks')?.value || '';
        
        // Update activity status
        const status = approved ? 'approved' : 'rejected';
        const activityResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: status
            })
        });
        
        if (!activityResponse.ok) throw new Error('Failed to update activity status');
        
        if (approved) {
            // Deduct funds from program area and main account
            // First get the total budget
            const budgetItemsResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items/`);
            if (!budgetItemsResponse.ok) throw new Error('Failed to fetch budget items');
            
            const budgetItems = await budgetItemsResponse.json();
            const totalBudget = budgetItems.reduce((sum, item) => sum + item.total, 0);
            
            // Deduct from program area
            const programResponse = await fetch(`https://man-m681.onrender.com/program_areas/${currentProgramArea}/deduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: totalBudget
                })
            });
            
            if (!programResponse.ok) throw new Error('Failed to deduct from program area');
            
            // Deduct from main account
            const mainAccountResponse = await fetch(`https://man-m681.onrender.com/bank_accounts/main/deduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: totalBudget
                })
            });
            
            if (!mainAccountResponse.ok) throw new Error('Failed to deduct from main account');
        }
        
        // Close the modal
        closeModal('approvalModal');
        
        // Show success message
        showToast(`Budget ${approved ? 'approved' : 'rejected'} successfully`, 'success');
        
        // Refresh views
        loadPendingApprovals();
        loadProgramCards();
        
        // Notify Head of Programs
        notifyBudgetApproval(activityId, approved, remarks);
        
    } catch (error) {
        console.error(`Error ${approved ? 'approving' : 'rejecting'} budget:`, error);
        showToast(`Failed to ${approved ? 'approve' : 'reject'} budget: ${error.message}`, 'error');
    }
}

// Notify Head of Programs about budget approval status
async function notifyBudgetApproval(activityId, approved, remarks) {
    try {
        // In a real app, this would send a notification to the Head of Programs
        // For this demo, we'll just log it and show a toast
        console.log(`Budget ${activityId} ${approved ? 'approved' : 'rejected'}. Remarks: ${remarks}`);
        
        showToast(`Head of Programs notified about budget ${approved ? 'approval' : 'rejection'}`, 'info');
        
    } catch (error) {
        console.error('Error notifying Head of Programs:', error);
    }
}

// Load program cards with current balances
async function loadProgramCards() {
    try {
        const response = await fetch('https://man-m681.onrender.com/dashboard-summary/');
        
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        // Update the main account card
        const mainAccountElement = document.querySelector('.main-bank-card .bank-card-balance');
        if (mainAccountElement) {
            mainAccountElement.textContent = `UGX ${(data.main_account_balance || 0).toLocaleString()}`;
        }
        
        // Update program area cards
        const programCards = {
            'Women Empowerment': document.querySelector('.program-card-1 .bank-card-balance'),
            'Vocational Education': document.querySelector('.program-card-2 .bank-card-balance'),
            'Climate Change': document.querySelector('.program-card-3 .bank-card-balance'),
            'Reproductive Health': document.querySelector('.program-card-4 .bank-card-balance')
        };
        
        for (const [programName, cardElement] of Object.entries(programCards)) {
            if (cardElement) {
                const balance = data.program_balances?.[programName] || 0;
                cardElement.textContent = `UGX ${balance.toLocaleString()}`;
            }
        }
        
    } catch (error) {
        console.error('Error loading program cards:', error);
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
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Helper function to close modals
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}
