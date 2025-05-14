// activity-budget-approval.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize budget approval functionality when the director dashboard is shown
    document.addEventListener('roleSelected', function(e) {
        if (e.detail.role === 'director') {
            loadPendingApprovals();
            setupApprovalEventListeners();
        }
    });

    // Load pending approvals for director
    async function loadPendingApprovals() {
        try {
            const tbody = document.getElementById('pendingApprovalsTable');
            if (!tbody) return;
            
            tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading pending approvals...</td></tr>';
            
            const response = await fetch('https://man-m681.onrender.com/activities/pending-budgets/');
            
            if (!response.ok) {
                throw new Error('Failed to fetch pending approvals');
            }
            
            const approvals = await response.json();
            tbody.innerHTML = '';
            
            if (approvals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No pending approvals</td></tr>';
                return;
            }
            
            approvals.forEach(approval => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${approval.activity_name}</td>
                    <td>${approval.project_name}</td>
                    <td>UGX ${approval.budget_amount.toLocaleString()}</td>
                    <td>${new Date(approval.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn approve-btn" data-activity-id="${approval.activity_id}" data-action="approve">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="action-btn reject-btn" data-activity-id="${approval.activity_id}" data-action="reject">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading pending approvals:', error);
            const tbody = document.getElementById('pendingApprovalsTable');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Failed to load approvals</td></tr>';
            }
        }
    }

    // Setup event listeners for approval buttons
    function setupApprovalEventListeners() {
        document.getElementById('refreshApprovalsBtn')?.addEventListener('click', loadPendingApprovals);
        
        // Use event delegation for dynamically created buttons
        document.getElementById('pendingApprovalsTable')?.addEventListener('click', function(e) {
            const btn = e.target.closest('.approve-btn, .reject-btn');
            if (!btn) return;
            
            const activityId = btn.dataset.activityId;
            const action = btn.dataset.action;
            const isApproval = action === 'approve';
            
            reviewBudgetApproval(activityId, isApproval);
        });
    }

    // Review and approve/reject budget
    async function reviewBudgetApproval(activityId, approve) {
        const remarks = prompt(`Enter remarks for ${approve ? 'approval' : 'rejection'}:`, '');
        if (remarks === null) return; // User cancelled
        
        try {
            const response = await fetch(`https://man-m681.onrender.com/activities/${activityId}/approve-budget/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    approved: approve,
                    remarks: remarks
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to process approval');
            }
            
            const data = await response.json();
            showToast(`Budget ${approve ? 'approved' : 'rejected'} successfully!`, 'success');
            
            // Refresh approvals list
            loadPendingApprovals();
            
            // Update program cards to reflect new balances
            updateProgramCards();
        } catch (error) {
            console.error('Error processing approval:', error);
            showToast(`Failed to process approval: ${error.message}`, 'error');
        }
    }

    // Update program cards with latest balances
    async function updateProgramCards() {
        try {
            const response = await fetch('https://man-m681.onrender.com/dashboard-summary/');
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            
            const data = await response.json();
            
            // Update program area cards
            const programCards = {
                'Women Empowerment': document.querySelector('.program-card-1 .bank-card-balance'),
                'Vocational Education': document.querySelector('.program-card-2 .bank-card-balance'),
                'Climate Change': document.querySelector('.program-card-3 .bank-card-balance'),
                'Reproductive Health': document.querySelector('.program-card-4 .bank-card-balance')
            };
            
            if (data.program_balances) {
                for (const [programName, cardElement] of Object.entries(programCards)) {
                    if (cardElement && data.program_balances[programName] !== undefined) {
                        cardElement.textContent = `UGX ${data.program_balances[programName].toLocaleString()}`;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating program cards:', error);
        }
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    // Check if we're on the director dashboard and initialize
    if (document.getElementById('directorDashboard')?.style.display !== 'none') {
        loadPendingApprovals();
        setupApprovalEventListeners();
    }
});
