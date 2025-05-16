// activity-budget-approval.js

// Global variables
let currentActivityId = null;

// Initialize the budget approval functionality
function initBudgetApproval() {
    // Load activities with their budget status
    loadActivities();
    
    // Set up event listeners for budget-related actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.submit-budget-btn')) {
            const activityId = e.target.closest('tr').dataset.activityId;
            submitActivityBudget(activityId);
        }
        
        if (e.target.closest('.approve-budget-btn')) {
            const approvalId = e.target.closest('tr').dataset.approvalId;
            approveBudget(approvalId);
        }
        
        if (e.target.closest('.reject-budget-btn')) {
            const approvalId = e.target.closest('tr').dataset.approvalId;
            rejectBudget(approvalId);
        }
    });
}

// Load activities with their budget status
async function loadActivities() {
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
            row.dataset.activityId = activity.id;
            
            // Determine status display
            const statusInfo = getStatusDisplay(budgetStatus.status);
            
            // Always include submit button in actions
            const submitButton = `
                <button class="action-btn submit-budget-btn" ${budgetStatus.status === 'draft' ? '' : 'disabled'}>
                    <i class="fas fa-paper-plane"></i> Submit
                </button>
            `;
            
            row.innerHTML = `
                <td>${activity.name}</td>
                <td>${activity.project_name}</td>
                <td>${activity.start_date}</td>
                <td>${activity.end_date}</td>
                <td>UGX ${activity.budget.toLocaleString()}</td>
                <td><span class="${statusInfo.class}">${statusInfo.text}</span></td>
                <td>
                    ${submitButton}
                    <button class="action-btn budget-btn" onclick="manageActivityBudget(${activity.id}, '${activity.name}')">
                        <i class="fas fa-coins"></i> Budget
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        showToast('Failed to load activities', 'error');
    }
}

// Helper function to determine status display
function getStatusDisplay(status) {
    const statusMap = {
        'draft': { class: 'status-badge draft', text: 'Draft' },
        'submitted': { class: 'status-badge submitted', text: 'Submitted' },
        'approved': { class: 'status-badge approved', text: 'Approved' },
        'rejected': { class: 'status-badge rejected', text: 'Rejected' }
    };
    
    return statusMap[status] || { class: 'status-badge draft', text: 'Draft' };
}

// Submit activity budget for approval
async function submitActivityBudget(activityId) {
    if (!confirm('Are you sure you want to submit this budget for approval?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/submit-budget/`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit budget');
        }
        
        showToast('Budget submitted for approval successfully');
        loadActivities(); // Refresh the activities list
    } catch (error) {
        console.error('Error submitting budget:', error);
        showToast(error.message, 'error');
    }
}

// Approve a budget
async function approveBudget(approvalId) {
    const remarks = prompt('Enter approval remarks (optional):');
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-approvals/${approvalId}/approve/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approved: true,
                remarks: remarks || ''
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to approve budget');
        }
        
        showToast('Budget approved successfully');
        loadPendingApprovals(); // Refresh the approvals list
    } catch (error) {
        console.error('Error approving budget:', error);
        showToast(error.message, 'error');
    }
}

// Reject a budget
async function rejectBudget(approvalId) {
    const remarks = prompt('Enter rejection reason (required):');
    if (!remarks) {
        alert('Please provide a reason for rejection');
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/budget-approvals/${approvalId}/approve/`, {
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
            const error = await response.json();
            throw new Error(error.detail || 'Failed to reject budget');
        }
        
        showToast('Budget rejected');
        loadPendingApprovals(); // Refresh the approvals list
    } catch (error) {
        console.error('Error rejecting budget:', error);
        showToast(error.message, 'error');
    }
}

// Load pending approvals (for director dashboard)
async function loadPendingApprovals() {
    try {
        const response = await fetch('https://man-m681.onrender.com/budget-approvals/pending/');
        if (!response.ok) throw new Error('Failed to fetch pending approvals');
        
        const approvals = await response.json();
        const tableBody = document.getElementById('pendingApprovalsTableBody');
        tableBody.innerHTML = '';
        
        approvals.forEach(approval => {
            const row = document.createElement('tr');
            row.dataset.approvalId = approval.id;
            row.innerHTML = `
                <td>${approval.activity_name}</td>
                <td>${approval.project_name}</td>
                <td>UGX ${approval.budget.toLocaleString()}</td>
                <td>${new Date(approval.submitted_at).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn approve-budget-btn">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-btn reject-budget-btn">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        showToast('Failed to load pending approvals', 'error');
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the activities page
    if (document.getElementById('activitiesTableBody')) {
        initBudgetApproval();
    }
    
    // Check if we're on the director dashboard with pending approvals
    if (document.getElementById('pendingApprovalsTableBody')) {
        loadPendingApprovals();
    }
});

// Make functions available globally
window.manageActivityBudget = function(activityId, activityName) {
    // Store the current activity being managed
    currentActivityId = activityId;
    
    // Show the budget management modal
    // You would implement this based on your UI
    alert(`Manage budget for ${activityName} (ID: ${activityId})`);
    // In a real implementation, you would open a modal here
    // and load the budget items for this activity
};

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initBudgetApproval,
        loadActivities,
        submitActivityBudget,
        approveBudget,
        rejectBudget,
        loadPendingApprovals,
        getStatusDisplay
    };
}
