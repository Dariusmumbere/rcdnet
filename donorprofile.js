// Budget Management Functions
async function loadBudgetItems(status = 'draft') {
    try {
        const tableBody = document.getElementById('budgetItemsTableBody');
        tableBody.innerHTML = '<tr><td colspan="9" class="loading">Loading budget items...</td></tr>';
        
        let url = `https://man-m681.onrender.com/activities/${currentActivityId}/budget-items/`;
        if (status === 'submitted') {
            url = 'https://man-m681.onrender.com/budget-items/pending-approval';
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch budget items');
        
        const items = await response.json();
        tableBody.innerHTML = '';
        
        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No budget items found</td></tr>';
            return;
        }
        
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.activity_name || 'N/A'}</td>
                <td>${item.project_name || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>UGX ${item.unit_price.toLocaleString()}</td>
                <td>UGX ${item.total.toLocaleString()}</td>
                <td>${item.category}</td>
                <td><span class="status-badge ${item.status}">${item.status}</span></td>
                <td>
                    ${item.status === 'draft' ? `
                    <button class="action-btn edit-btn" onclick="editBudgetItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn submit-btn" onclick="submitBudgetItem(${item.id})">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteBudgetItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                    ${item.status === 'submitted' ? `
                    <button class="action-btn view-btn" onclick="viewBudgetItem(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ` : ''}
                    ${item.status === 'approved' ? `
                    <button class="action-btn view-btn" onclick="viewBudgetItem(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ` : ''}
                    ${item.status === 'rejected' ? `
                    <button class="action-btn edit-btn" onclick="editBudgetItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn submit-btn" onclick="submitBudgetItem(${item.id})">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading budget items:', error);
        document.getElementById('budgetItemsTableBody').innerHTML = 
            '<tr><td colspan="9" style="text-align: center; color: red;">Failed to load budget items</td></tr>';
    }
}

async function submitBudgetItem(itemId) {
    if (!confirm('Are you sure you want to submit this budget item for approval?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-items/${itemId}/submit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user_id': currentUserId // Assuming you have current user ID
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit budget item');
        }
        
        const result = await response.json();
        alert('Budget item submitted for approval successfully!');
        loadBudgetItems();
        
        // If in director view, refresh approvals
        if (document.getElementById('approvalItemsTableBody')) {
            loadPendingApprovals();
        }
    } catch (error) {
        console.error('Error submitting budget item:', error);
        alert('Failed to submit budget item: ' + error.message);
    }
}

// Director Approval Functions
async function loadPendingApprovals() {
    try {
        const tableBody = document.getElementById('approvalItemsTableBody');
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading approvals...</td></tr>';
        
        const response = await fetch('https://man-m681.onrender.com/budget-items/pending-approval');
        if (!response.ok) throw new Error('Failed to fetch pending approvals');
        
        const items = await response.json();
        tableBody.innerHTML = '';
        
        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No pending approvals</td></tr>';
            return;
        }
        
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.activity_name || 'N/A'}</td>
                <td>${item.project_name || 'N/A'}</td>
                <td>UGX ${item.total.toLocaleString()}</td>
                <td>${item.submitted_by || 'System'}</td>
                <td>${new Date(item.submitted_at).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn approve-btn" onclick="approveBudgetItem(${item.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-btn reject-btn" onclick="rejectBudgetItem(${item.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="action-btn view-btn" onclick="viewBudgetItem(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        document.getElementById('approvalItemsTableBody').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load approvals</td></tr>';
    }
}

async function approveBudgetItem(itemId) {
    if (!confirm('Are you sure you want to approve this budget item? This will deduct funds from the program and main accounts.')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-items/${itemId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user_id': currentUserId // Assuming you have current user ID
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to approve budget item');
        }
        
        const result = await response.json();
        alert('Budget item approved successfully! Funds have been deducted.');
        loadPendingApprovals();
        
        // Refresh account balances
        loadProgramCards();
    } catch (error) {
        console.error('Error approving budget item:', error);
        alert('Failed to approve budget item: ' + error.message);
    }
}

async function rejectBudgetItem(itemId) {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason === null) return;
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-items/${itemId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user_id': currentUserId // Assuming you have current user ID
            },
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
            throw new Error('Failed to reject budget item');
        }
        
        const result = await response.json();
        alert('Budget item rejected successfully!');
        loadPendingApprovals();
    } catch (error) {
        console.error('Error rejecting budget item:', error);
        alert('Failed to reject budget item: ' + error.message);
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Budget tab switching
    document.querySelectorAll('.budget-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.budget-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tab = this.getAttribute('data-tab');
            if (tab === 'draftBudgets') {
                loadBudgetItems('draft');
            } else if (tab === 'submittedBudgets') {
                loadBudgetItems('submitted');
            } else if (tab === 'approvedBudgets') {
                loadBudgetItems('approved');
            }
        });
    });
    
    // Refresh buttons
    document.getElementById('refreshBudgetsBtn')?.addEventListener('click', function() {
        const activeTab = document.querySelector('.budget-tabs .tab-btn.active');
        if (activeTab) {
            const tab = activeTab.getAttribute('data-tab');
            if (tab === 'draftBudgets') {
                loadBudgetItems('draft');
            } else if (tab === 'submittedBudgets') {
                loadBudgetItems('submitted');
            } else if (tab === 'approvedBudgets') {
                loadBudgetItems('approved');
            }
        }
    });
    
    document.getElementById('refreshApprovalsBtn')?.addEventListener('click', loadPendingApprovals);
    
    // Create budget button
    document.getElementById('createBudgetBtn')?.addEventListener('click', function() {
        // Open budget creation modal
        document.getElementById('createBudgetModal').classList.add('show');
    });
});
