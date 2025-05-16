// budget-workflow.js - Handles all budget-related functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize budget workflow if on relevant pages
    if (document.getElementById('directorDashboard') || 
        document.getElementById('programOfficerDashboard')) {
        initBudgetWorkflow();
    }
});

function initBudgetWorkflow() {
    // Load initial data
    loadBudgetData();
    
    // Set up event listeners
    setupBudgetEventListeners();
}

function setupBudgetEventListeners() {
    // Budget creation and management
    document.getElementById('createBudgetBtn')?.addEventListener('click', showBudgetCreationModal);
    document.getElementById('submitBudgetBtn')?.addEventListener('click', submitBudgetForApproval);
    
    // Budget approval (director)
    document.getElementById('approveBudgetBtn')?.addEventListener('click', () => processBudgetApproval(true));
    document.getElementById('rejectBudgetBtn')?.addEventListener('click', () => processBudgetApproval(false));
    
    // Budget items management
    document.getElementById('addBudgetItemBtn')?.addEventListener('click', addBudgetItem);
    document.getElementById('saveBudgetBtn')?.addEventListener('click', saveBudget);
}

async function loadBudgetData() {
    try {
        // Load budget summary for dashboard
        const response = await fetch('https://man-m681.onrender.com/budget-summary');
        if (!response.ok) throw new Error('Failed to load budget data');
        
        const data = await response.json();
        
        // Update UI with budget data
        updateBudgetUI(data);
        
        // Load pending approvals if director
        if (document.getElementById('directorDashboard')) {
            loadPendingApprovals();
        }
        
    } catch (error) {
        console.error('Error loading budget data:', error);
        showToast('Failed to load budget data', 'error');
    }
}

function updateBudgetUI(data) {
    // Update program area balances
    if (data.program_balances) {
        for (const [program, balance] of Object.entries(data.program_balances)) {
            const element = document.querySelector(`.program-card[data-program="${program}"] .bank-card-balance`);
            if (element) {
                element.textContent = `UGX ${balance.toLocaleString()}`;
            }
        }
    }
    
    // Update main account balance
    if (data.main_account_balance !== undefined) {
        const mainBalanceElement = document.querySelector('.main-bank-card .bank-card-balance');
        if (mainBalanceElement) {
            mainBalanceElement.textContent = `UGX ${data.main_account_balance.toLocaleString()}`;
        }
    }
}

// PROGRAM OFFICER FUNCTIONS

async function showBudgetCreationModal(activityId, activityName) {
    try {
        // Reset form
        document.getElementById('budgetForm').reset();
        
        // Set activity info
        document.getElementById('budgetActivityId').value = activityId;
        document.getElementById('budgetActivityName').textContent = activityName;
        
        // Load existing budget items if any
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items`);
        if (response.ok) {
            const items = await response.json();
            populateBudgetItemsTable(items);
        }
        
        // Show modal
        document.getElementById('budgetModal').classList.add('show');
        
    } catch (error) {
        console.error('Error opening budget modal:', error);
        showToast('Failed to load budget data', 'error');
    }
}

function populateBudgetItemsTable(items) {
    const tbody = document.getElementById('budgetItemsTableBody');
    tbody.innerHTML = '';
    
    let total = 0;
    
    items.forEach(item => {
        const row = document.createElement('tr');
        const itemTotal = item.quantity * item.unit_price;
        total += itemTotal;
        
        row.innerHTML = `
            <td>${item.item_name}</td>
            <td>${item.description || '-'}</td>
            <td>${item.quantity}</td>
            <td>UGX ${item.unit_price.toLocaleString()}</td>
            <td>UGX ${itemTotal.toLocaleString()}</td>
            <td>${item.category}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editBudgetItem('${item.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteBudgetItem('${item.id}')">
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
        <td colspan="4"><strong>Total Budget</strong></td>
        <td><strong>UGX ${total.toLocaleString()}</strong></td>
        <td colspan="2"></td>
    `;
    tbody.appendChild(totalRow);
    
    // Update activity budget field
    document.getElementById('activityBudget').value = total;
}

async function addBudgetItem() {
    const form = document.getElementById('budgetItemForm');
    const activityId = document.getElementById('budgetActivityId').value;
    
    // Validate form
    if (!validateBudgetItemForm()) return;
    
    try {
        const formData = new FormData(form);
        const itemData = Object.fromEntries(formData.entries());
        
        // Convert numeric fields
        itemData.quantity = parseFloat(itemData.quantity);
        itemData.unit_price = parseFloat(itemData.unit_price);
        
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });
        
        if (!response.ok) throw new Error('Failed to add budget item');
        
        const newItem = await response.json();
        
        // Refresh budget items table
        const itemsResponse = await fetch(`https://man-m681.onrender.com/activities/${activityId}/budget-items`);
        if (itemsResponse.ok) {
            const items = await itemsResponse.json();
            populateBudgetItemsTable(items);
        }
        
        // Reset form
        form.reset();
        showToast('Budget item added successfully', 'success');
        
    } catch (error) {
        console.error('Error adding budget item:', error);
        showToast('Failed to add budget item', 'error');
    }
}

function validateBudgetItemForm() {
    const name = document.getElementById('budgetItemName').value.trim();
    const quantity = parseFloat(document.getElementById('budgetItemQuantity').value);
    const unitPrice = parseFloat(document.getElementById('budgetItemUnitPrice').value);
    
    // Reset error states
    document.querySelectorAll('.validation-error').forEach(el => el.style.display = 'none');
    
    let isValid = true;
    
    if (!name) {
        document.getElementById('itemNameError').style.display = 'block';
        isValid = false;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        document.getElementById('quantityError').style.display = 'block';
        isValid = false;
    }
    
    if (isNaN(unitPrice) || unitPrice <= 0) {
        document.getElementById('unitPriceError').style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

async function submitBudgetForApproval() {
    const activityId = document.getElementById('budgetActivityId').value;
    const activityName = document.getElementById('budgetActivityName').textContent;
    const totalBudget = document.getElementById('activityBudget').value;
    
    if (!activityId || !totalBudget || totalBudget <= 0) {
        showToast('Please create a valid budget before submitting', 'error');
        return;
    }
    
    if (confirm(`Submit budget of UGX ${totalBudget.toLocaleString()} for "${activityName}" for approval?`)) {
        try {
            const response = await fetch('https://man-m681.onrender.com/budget-approvals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activity_id: activityId,
                    requested_amount: parseFloat(totalBudget),
                    status: 'pending'
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit budget for approval');
            
            showToast('Budget submitted for approval successfully', 'success');
            document.getElementById('budgetModal').classList.remove('show');
            
            // Refresh activities list to show new status
            if (document.getElementById('activitiesTableBody')) {
                loadActivities();
            }
            
        } catch (error) {
            console.error('Error submitting budget:', error);
            showToast('Failed to submit budget for approval', 'error');
        }
    }
}

// DIRECTOR FUNCTIONS

async function loadPendingApprovals() {
    try {
        const response = await fetch('https://man-m681.onrender.com/budget-approvals/pending');
        if (!response.ok) throw new Error('Failed to load pending approvals');
        
        const approvals = await response.json();
        const container = document.getElementById('pendingApprovalsContainer');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (approvals.length === 0) {
            container.innerHTML = '<p class="no-approvals">No pending budget approvals</p>';
            return;
        }
        
        approvals.forEach(approval => {
            const card = document.createElement('div');
            card.className = 'approval-card';
            card.innerHTML = `
                <div class="approval-header">
                    <h4>${approval.activity_name}</h4>
                    <span class="status-badge pending">Pending</span>
                </div>
                <div class="approval-details">
                    <p><strong>Project:</strong> ${approval.project_name}</p>
                    <p><strong>Requested Amount:</strong> UGX ${approval.requested_amount.toLocaleString()}</p>
                    <p><strong>Submitted By:</strong> ${approval.submitted_by}</p>
                    <p><strong>Submitted On:</strong> ${new Date(approval.submitted_at).toLocaleString()}</p>
                    
                    <div class="approval-actions">
                        <div class="form-group">
                            <label for="approvedAmount-${approval.id}">Approved Amount (UGX)</label>
                            <input type="number" id="approvedAmount-${approval.id}" 
                                   value="${approval.requested_amount}" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="approvalNotes-${approval.id}">Notes</label>
                            <textarea id="approvalNotes-${approval.id}" rows="3"></textarea>
                        </div>
                        <div class="action-buttons">
                            <button class="file-manager-btn" onclick="processBudgetApproval('${approval.id}', true)">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="file-manager-btn delete-btn" onclick="processBudgetApproval('${approval.id}', false)">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        const container = document.getElementById('pendingApprovalsContainer');
        if (container) {
            container.innerHTML = '<p class="error">Failed to load pending approvals</p>';
        }
    }
}

async function processBudgetApproval(approvalId, isApproved) {
    try {
        const amountInput = document.getElementById(`approvedAmount-${approvalId}`);
        const notesInput = document.getElementById(`approvalNotes-${approvalId}`);
        
        const approvedAmount = isApproved ? parseFloat(amountInput.value) : 0;
        const notes = notesInput.value.trim();
        
        if (isApproved && (isNaN(approvedAmount) || approvedAmount <= 0)) {
            showToast('Please enter a valid approved amount', 'error');
            return;
        }
        
        const response = await fetch(`https://man-m681.onrender.com/budget-approvals/${approvalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approved_amount: approvedAmount,
                approver_notes: notes,
                status: isApproved ? 'approved' : 'rejected'
            })
        });
        
        if (!response.ok) throw new Error('Failed to process approval');
        
        showToast(`Budget ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
        
        // Refresh approvals list and budget data
        loadPendingApprovals();
        loadBudgetData();
        
    } catch (error) {
        console.error('Error processing budget approval:', error);
        showToast(`Failed to ${isApproved ? 'approve' : 'reject'} budget`, 'error');
    }
}

// HELPER FUNCTIONS

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
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Expose functions to global scope
window.showBudgetCreationModal = showBudgetCreationModal;
window.addBudgetItem = addBudgetItem;
window.editBudgetItem = function(id) {
    // Implementation for editing a budget item
    console.log('Edit budget item:', id);
};
window.deleteBudgetItem = function(id) {
    if (confirm('Are you sure you want to delete this budget item?')) {
        console.log('Delete budget item:', id);
        // Implement actual deletion logic
    }
};
window.processBudgetApproval = processBudgetApproval;
window.submitBudgetForApproval = submitBudgetForApproval;
