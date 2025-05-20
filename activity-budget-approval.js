// activity-budget-approval.js

// Global variables
let currentActivityId = null;

// Initialize the budget approval functionality
function initBudgetApproval() {
    // Add event listeners for budget-related buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.budget-btn')) {
            const activityId = e.target.closest('.budget-btn').dataset.activityId;
            manageActivityBudget(activityId);
        }
        
        if (e.target.closest('.submit-budget-btn')) {
            const activityId = e.target.closest('.submit-budget-btn').dataset.activityId;
            submitActivityBudget(activityId);
        }
    });
    
    // Load any pending approvals if on director dashboard
    if (document.getElementById('directorDashboard')) {
        loadPendingApprovals();
    }
}

// Manage activity budget
async function manageActivityBudget(activityId, activityName) {
    currentActivityId = activityId;
    
    try {
        // Show loading state
        showLoading('Loading budget items...');
        
        // Get budget items and status
        const [itemsResponse, statusResponse] = await Promise.all([
            fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-items/`),
            fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-status/`)
        ]);
        
        if (!itemsResponse.ok || !statusResponse.ok) {
            throw new Error('Failed to load budget data');
        }
        
        const budgetItems = await itemsResponse.json();
        const budgetStatus = await statusResponse.json();
        
        // Display budget management modal
        showBudgetManagementModal(activityName, budgetItems, budgetStatus);
    } catch (error) {
        console.error('Error managing budget:', error);
        showToast(`Failed to load budget: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Show budget management modal
function showBudgetManagementModal(activityName, budgetItems, budgetStatus) {
    const modalHTML = `
        <div class="project-modal show" id="budgetManagementModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Budget for ${activityName}</h3>
                    <span class="status-badge ${budgetStatus.status}">
                        ${formatBudgetStatus(budgetStatus.status)}
                    </span>
                    <button class="close-btn" onclick="closeModal('budgetManagementModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="budget-summary">
                        <div class="summary-item">
                            <span class="label">Total Budget:</span>
                            <span class="value">UGX ${calculateTotalBudget(budgetItems).toLocaleString()}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Status:</span>
                            <span class="value">${formatBudgetStatus(budgetStatus.status)}</span>
                        </div>
                        ${budgetStatus.remarks ? `
                        <div class="summary-item">
                            <span class="label">Remarks:</span>
                            <span class="value">${budgetStatus.remarks}</span>
                        </div>` : ''}
                    </div>
                    
                    <div class="budget-items-container">
                        <h4>Budget Items</h4>
                        <table class="budget-items-table">
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
                                ${budgetItems.map(item => `
                                    <tr>
                                        <td>${item.item_name}</td>
                                        <td>${item.description || '-'}</td>
                                        <td>${item.quantity}</td>
                                        <td>UGX ${item.unit_price.toLocaleString()}</td>
                                        <td>UGX ${(item.quantity * item.unit_price).toLocaleString()}</td>
                                        <td>${formatCategory(item.category)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="4">Total Budget</td>
                                    <td colspan="2">UGX ${calculateTotalBudget(budgetItems).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    ${budgetStatus.status === 'rejected' ? `
                    <div class="rejection-notice">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>This budget was rejected. Please review the remarks and resubmit.</p>
                    </div>` : ''}
                </div>
                <div class="modal-footer">
                    <button class="file-manager-btn secondary" onclick="closeModal('budgetManagementModal')">
                        Close
                    </button>
                    <button class="file-manager-btn" onclick="addBudgetItem(${currentActivityId}, '${activityName}')">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                    <button class="file-manager-btn submit-budget-btn" 
                            data-activity-id="${currentActivityId}"
                            ${budgetStatus.status === 'approved' ? 'disabled' : ''}>
                        <i class="fas fa-paper-plane"></i> Submit for Approval
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Submit activity budget for approval
async function submitActivityBudget(activityId) {
    if (!confirm('Are you sure you want to submit this budget for approval?')) {
        return;
    }
    
    try {
        showLoading('Submitting budget...');
        
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}/submit-budget/`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit budget');
        }
        
        const data = await response.json();
        showToast('Budget submitted for approval successfully!');
        
        // Refresh the activities table
        if (typeof loadActivities === 'function') {
            loadActivities();
        }
        
        // Close the budget management modal
        closeModal('budgetManagementModal');
    } catch (error) {
        console.error('Error submitting budget:', error);
        showToast(`Failed to submit budget: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Add a new budget item
function addBudgetItem(activityId, activityName) {
    const modalHTML = `
        <div class="project-modal show" id="addBudgetItemModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Budget Item for ${activityName}</h3>
                    <button class="close-btn" onclick="closeModal('addBudgetItemModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="budgetItemForm">
                        <div class="form-group">
                            <label for="itemName">Item Name*</label>
                            <input type="text" id="itemName" required>
                        </div>
                        <div class="form-group">
                            <label for="itemDescription">Description</label>
                            <textarea id="itemDescription" rows="2"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemQuantity">Quantity*</label>
                                <input type="number" id="itemQuantity" min="1" value="1" required>
                            </div>
                            <div class="form-group">
                                <label for="itemUnitPrice">Unit Price (UGX)*</label>
                                <input type="number" id="itemUnitPrice" min="0" step="0.01" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="itemCategory">Category*</label>
                            <select id="itemCategory" required>
                                <option value="materials">Materials</option>
                                <option value="labor">Labor</option>
                                <option value="transport">Transport</option>
                                <option value="equipment">Equipment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="file-manager-btn secondary" onclick="closeModal('addBudgetItemModal')">
                        Cancel
                    </button>
                    <button class="file-manager-btn" onclick="saveBudgetItem(${activityId})">
                        Save Item
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Save budget item
async function saveBudgetItem(activityId) {
    const itemData = {
        item_name: document.getElementById('itemName').value.trim(),
        description: document.getElementById('itemDescription').value.trim(),
        quantity: parseInt(document.getElementById('itemQuantity').value),
        unit_price: parseFloat(document.getElementById('itemUnitPrice').value),
        category: document.getElementById('itemCategory').value
    };
    
    // Validate input
    if (!itemData.item_name || isNaN(itemData.quantity) || isNaN(itemData.unit_price)) {
        showToast('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    if (itemData.quantity <= 0 || itemData.unit_price <= 0) {
        showToast('Quantity and unit price must be greater than 0', 'error');
        return;
    }
    
    try {
        showLoading('Saving budget item...');
        
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-items/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save budget item');
        }
        
        const data = await response.json();
        showToast('Budget item saved successfully!');
        
        // Close the add item modal
        closeModal('addBudgetItemModal');
        
        // If the budget management modal is open, refresh it
        if (document.getElementById('budgetManagementModal')) {
            // Get the activity name from the modal title
            const activityName = document.querySelector('#budgetManagementModal h3').textContent.replace('Budget for ', '');
            
            // Close the current modal
            closeModal('budgetManagementModal');
            
            // Reopen with fresh data
            manageActivityBudget(activityId, activityName);
        }
    } catch (error) {
        console.error('Error saving budget item:', error);
        showToast(`Failed to save budget item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Load pending approvals (for director dashboard)
async function loadPendingApprovals() {
    try {
        const response = await fetch('https://backend-jz65.onrender.com/budget-approvals/pending/');
        
        if (!response.ok) {
            throw new Error('Failed to fetch pending approvals');
        }
        
        const approvals = await response.json();
        const container = document.getElementById('pendingApprovalsContainer');
        
        if (approvals.length === 0) {
            container.innerHTML = '<p>No pending budget approvals</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="section-header">
                <h3 class="section-title">Pending Budget Approvals</h3>
            </div>
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Project</th>
                            <th>Amount (UGX)</th>
                            <th>Submitted By</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${approvals.map(approval => `
                            <tr>
                                <td>${approval.activity_name}</td>
                                <td>${approval.project_name}</td>
                                <td>${approval.total_amount.toLocaleString()}</td>
                                <td>${approval.submitted_by}</td>
                                <td>${new Date(approval.submitted_at).toLocaleDateString()}</td>
                                <td>
                                    <button class="action-btn view-btn" onclick="viewBudgetDetails(${approval.id})">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        document.getElementById('pendingApprovalsContainer').innerHTML = `
            <p class="error">Failed to load pending approvals: ${error.message}</p>
        `;
    }
}

// View budget details for approval
async function viewBudgetDetails(approvalId) {
    try {
        showLoading('Loading budget details...');
        
        const response = await fetch(`https://backend-jz65.onrender.com/budget-approvals/${approvalId}/`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch budget details');
        }
        
        const approval = await response.json();
        
        // Show approval modal
        const modalHTML = `
            <div class="project-modal show wide-modal" id="approvalModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Budget Approval: ${approval.activity_name}</h3>
                        <button class="close-btn" onclick="closeModal('approvalModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="approval-meta">
                            <div class="meta-item">
                                <span class="meta-label">Project:</span>
                                <span class="meta-value">${approval.project_name}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Total Amount:</span>
                                <span class="meta-value">UGX ${approval.total_amount.toLocaleString()}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Submitted By:</span>
                                <span class="meta-value">${approval.submitted_by}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Submitted On:</span>
                                <span class="meta-value">${new Date(approval.submitted_at).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div class="budget-items-container">
                            <h4>Budget Items</h4>
                            <table class="budget-items-table">
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
                                    ${approval.budget_items.map(item => `
                                        <tr>
                                            <td>${item.item_name}</td>
                                            <td>${item.description || '-'}</td>
                                            <td>${item.quantity}</td>
                                            <td>UGX ${item.unit_price.toLocaleString()}</td>
                                            <td>UGX ${(item.quantity * item.unit_price).toLocaleString()}</td>
                                            <td>${formatCategory(item.category)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="total-row">
                                        <td colspan="4">Total Budget</td>
                                        <td colspan="2">UGX ${approval.total_amount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <div class="approval-form">
                            <h4>Approval Decision</h4>
                            <div class="form-group">
                                <label for="approvalRemarks">Remarks</label>
                                <textarea id="approvalRemarks" rows="3" placeholder="Enter any remarks or comments"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="file-manager-btn secondary" onclick="closeModal('approvalModal')">
                            Cancel
                        </button>
                        <button class="file-manager-btn reject-btn" onclick="processApproval(${approvalId}, false)">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="file-manager-btn" onclick="processApproval(${approvalId}, true)">
                            <i class="fas fa-check"></i> Approve
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error viewing budget details:', error);
        showToast(`Failed to load budget details: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Process approval decision
async function processApproval(approvalId, isApproved) {
    const remarks = document.getElementById('approvalRemarks')?.value || '';
    
    if (!isApproved && !remarks) {
        showToast('Please provide remarks when rejecting a budget', 'error');
        return;
    }
    
    try {
        showLoading(isApproved ? 'Approving budget...' : 'Rejecting budget...');
        
        const response = await fetch(`https://backend-jz65.onrender.com/budget-approvals/${approvalId}/process/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approved: isApproved,
                remarks: remarks
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to process approval');
        }
        
        const data = await response.json();
        showToast(`Budget ${isApproved ? 'approved' : 'rejected'} successfully!`);
        
        // Close the modal
        closeModal('approvalModal');
        
        // Refresh the pending approvals list
        if (typeof loadPendingApprovals === 'function') {
            loadPendingApprovals();
        }
    } catch (error) {
        console.error('Error processing approval:', error);
        showToast(`Failed to process approval: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Helper functions
function formatBudgetStatus(status) {
    const statusMap = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'approved': 'Approved',
        'rejected': 'Rejected'
    };
    
    return statusMap[status] || status;
}

function formatCategory(category) {
    const categoryMap = {
        'materials': 'Materials',
        'labor': 'Labor',
        'transport': 'Transport',
        'equipment': 'Equipment',
        'other': 'Other'
    };
    
    return categoryMap[category] || category;
}

function calculateTotalBudget(items) {
    return items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

function showLoading(message) {
    // Implement your loading indicator
    console.log('Loading:', message);
}

function hideLoading() {
    // Implement hiding your loading indicator
}

function showToast(message, type = 'success') {
    // Implement your toast notification
    console.log(`${type.toUpperCase()}:`, message);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBudgetApproval);
