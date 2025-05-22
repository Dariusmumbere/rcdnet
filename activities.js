// Function to handle the "Create New Activity" button click
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the director dashboard
    if (document.getElementById('directorDashboard')) {
        loadPendingApprovals();
        
        // Also load program cards and projects
        loadProgramCards();
        loadProjectsForDirector();
    }
});
function setupCreateActivityButton() {
    const createActivityBtn = document.getElementById('createActivityBtn');
    
    if (createActivityBtn) {
        createActivityBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Reset the form
            document.getElementById('activityForm').reset();
            
            // Load projects for the dropdown
            loadProjectsForActivities();
            
            // Show the modal
            document.getElementById('createActivityModal').classList.add('show');
        });
    }
}

// Function to load projects for the activities dropdown
async function loadProjectsForActivities() {
    try {
        const response = await fetch('https://backend-jz65.onrender.com/projects/');
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const data = await response.json();
        const projectSelect = document.getElementById('activityProject');
        projectSelect.innerHTML = '';
        
        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a project';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        projectSelect.appendChild(defaultOption);
        
        // Add projects to the dropdown
        data.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading projects for activities:', error);
        alert('Failed to load projects for activities dropdown');
    }
}

// Function to create a new activity
async function createActivity() {
    const activityData = {
        name: document.getElementById('activityName').value,
        project_id: document.getElementById('activityProject').value,
        description: document.getElementById('activityDescription').value,
        start_date: document.getElementById('activityStartDate').value,
        end_date: document.getElementById('activityEndDate').value,
        budget: parseFloat(document.getElementById('activityBudget').value),
        status: document.getElementById('activityStatus').value
    };
    
    // Validate required fields
    if (!activityData.name || !activityData.project_id || !activityData.start_date || 
        !activityData.end_date || isNaN(activityData.budget)) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    try {
        const submitBtn = document.querySelector('#createActivityModal .modal-footer .file-manager-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        const response = await fetch('https://backend-jz65.onrender.com/activities/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create activity');
        }
        
        const data = await response.json();
        alert('Activity created successfully');
        
        // Close the modal
        document.getElementById('createActivityModal').classList.remove('show');
        
        // Reload activities list
        await loadActivities();
        
        // Show budget creation modal for the new activity
        showBudgetCreationModal(data.id, data.name);
        
    } catch (error) {
        console.error('Error creating activity:', error);
        alert(`Failed to create activity: ${error.message}`);
    } finally {
        const submitBtn = document.querySelector('#createActivityModal .modal-footer .file-manager-btn');
        if (submitBtn) {
            submitBtn.innerHTML = 'Create Activity';
            submitBtn.disabled = false;
        }
    }
}

// Function to show budget creation modal
function showBudgetCreationModal(activityId, activityName) {
    if (confirm(`Would you like to create a budget for "${activityName}"?`)) {
        // Reset the budget form
        document.getElementById('budgetItemName').value = '';
        document.getElementById('budgetItemDescription').value = '';
        document.getElementById('budgetItemQuantity').value = '1';
        document.getElementById('budgetItemUnitPrice').value = '';
        document.getElementById('budgetItemCategory').value = 'materials';
        
        // Set the activity info
        document.getElementById('budgetForActivityName').textContent = activityName;
        document.getElementById('createBudgetModal').dataset.activityId = activityId;
        
        // Show the budget modal
        document.getElementById('createBudgetModal').classList.add('show');
    }
}

// Function to load activities list
async function loadActivities() {
    try {
        const tableBody = document.getElementById('activitiesTableBody');
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading activities...</td></tr>';
        
        const response = await fetch('https://backend-jz65.onrender.com/activities/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const activities = Array.isArray(data) ? data : (data.activities || []);
        
        tableBody.innerHTML = '';
        
        if (activities.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No activities found</td></tr>';
            return;
        }
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.name || 'N/A'}</td>
                <td>${activity.project_name || activity.project_id || 'N/A'}</td>
                <td>${activity.start_date || 'N/A'}</td>
                <td>${activity.end_date || 'N/A'}</td>
                <td>UGX ${activity.budget ? activity.budget.toLocaleString() : '0'}</td>
                <td><span class="status-badge ${activity.status ? activity.status.replace(' ', '_') : 'pending'}">
                    ${activity.status || 'pending'}
                </span></td>
                <td>
                    <button class="action-btn view-btn" onclick="viewActivity(${activity.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editActivity(${activity.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn budget-btn" onclick="manageActivityBudget(${activity.id}, '${activity.name}')">
                        <i class="fas fa-coins"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteActivity(${activity.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading activities:', error);
        const tableBody = document.getElementById('activitiesTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red;">
                    Failed to load activities: ${error.message}
                </td>
            </tr>
        `;
    }
}
// Initialize the button when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupCreateActivityButton();
    
    // Also set up the form submission
    const activityForm = document.getElementById('activityForm');
    if (activityForm) {
        activityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createActivity();
        });
    }
});

// Make functions available globally for inline event handlers
window.createActivity = createActivity;

// Add these functions to your existing JavaScript

// View activity details
async function viewActivity(activityId) {
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}`);
        if (!response.ok) throw new Error('Failed to fetch activity');
        
        const activity = await response.json();
        
        // Create a modal to display activity details
        const modalHTML = `
            <div class="project-modal show" id="viewActivityModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Activity Details</h3>
                        <button class="close-btn" onclick="closeModal('viewActivityModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-row">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${activity.name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Project:</span>
                            <span class="detail-value">${activity.project_name || activity.project_id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Description:</span>
                            <span class="detail-value">${activity.description || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Start Date:</span>
                            <span class="detail-value">${activity.start_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">End Date:</span>
                            <span class="detail-value">${activity.end_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Budget:</span>
                            <span class="detail-value">UGX ${activity.budget ? activity.budget.toLocaleString() : '0'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value"><span class="status-badge ${activity.status ? activity.status.replace(' ', '_') : 'planned'}">
                                ${activity.status || 'Planned'}
                            </span></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="file-manager-btn" onclick="editActivity(${activity.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="file-manager-btn secondary" onclick="closeModal('viewActivityModal')">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error viewing activity:', error);
        alert('Failed to view activity details. Please try again.');
    }
}

// Edit activity
async function editActivity(activityId) {
    try {
        // Close view modal if open
        if (document.getElementById('viewActivityModal')) {
            closeModal('viewActivityModal');
        }
        
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}`);
        if (!response.ok) throw new Error('Failed to fetch activity');
        
        const activity = await response.json();
        
        // Populate the activity form with existing data
        document.getElementById('activityName').value = activity.name;
        document.getElementById('activityDescription').value = activity.description || '';
        document.getElementById('activityStartDate').value = activity.start_date.split('T')[0]; // Format date for input
        document.getElementById('activityEndDate').value = activity.end_date.split('T')[0];
        document.getElementById('activityBudget').value = activity.budget || '';
        document.getElementById('activityStatus').value = activity.status || 'planned';
        
        // Load projects and select the current one
        await loadProjectsForActivities();
        document.getElementById('activityProject').value = activity.project_id;
        
        // Change modal title and button text
        document.querySelector('#createActivityModal .modal-header h3').textContent = 'Edit Activity';
        document.querySelector('#createActivityModal .modal-footer .file-manager-btn').textContent = 'Update Activity';
        
        // Store activity ID for update
        document.getElementById('createActivityModal').dataset.activityId = activityId;
        
        // Open modal
        document.getElementById('createActivityModal').classList.add('show');
    } catch (error) {
        console.error('Error editing activity:', error);
        alert('Failed to load activity for editing. Please try again.');
    }
}

// Manage activity budget
async function manageActivityBudget(activityId, activityName) {
    // Create or show the budget management modal
    if (!document.getElementById('budgetManagementModal')) {
        createBudgetManagementModal();
    }
    
    // Set the activity info
    document.getElementById('budgetForActivityName').textContent = activityName;
    document.getElementById('budgetManagementModal').dataset.activityId = activityId;
    
    // Load existing budget items
    await loadActivityBudgetItems(activityId);
    
    // Show the modal
    document.getElementById('budgetManagementModal').classList.add('show');
}

// Delete activity
async function deleteActivity(activityId) {
    if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete activity');
        }
        
        alert('Activity deleted successfully');
        loadActivities();
    } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity. Please try again.');
    }
}

// Helper function to load projects for activities dropdown
async function loadProjectsForActivities() {
    try {
        const response = await fetch('https://backend-jz65.onrender.com/projects/');
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const data = await response.json();
        const projectSelect = document.getElementById('activityProject');
        projectSelect.innerHTML = '';
        
        data.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading projects for activities:', error);
        alert('Failed to load projects for activities dropdown');
    }
}

// Helper function to close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Function to create budget management modal
function createBudgetManagementModal() {
    const modalHTML = `
        <div class="project-modal" id="budgetManagementModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Budget Items for <span id="budgetForActivityName"></span></h3>
                    <button class="close-btn" onclick="closeModal('budgetManagementModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="table-responsive">
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
                    
                    <div class="section-header" style="margin-top: 20px;">
                        <h4>Add New Budget Item</h4>
                    </div>
                    <form id="newBudgetItemForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newItemName">Item Name*</label>
                                <input type="text" id="newItemName" required>
                            </div>
                            <div class="form-group">
                                <label for="newItemDescription">Description</label>
                                <input type="text" id="newItemDescription">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newItemQuantity">Quantity*</label>
                                <input type="number" id="newItemQuantity" value="1" min="1" required>
                            </div>
                            <div class="form-group">
                                <label for="newItemUnitPrice">Unit Price (UGX)*</label>
                                <input type="number" id="newItemUnitPrice" min="0" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="newItemCategory">Category*</label>
                                <select id="newItemCategory" required>
                                    <option value="materials">Materials</option>
                                    <option value="labor">Labor</option>
                                    <option value="transport">Transport</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="file-manager-btn secondary" onclick="closeModal('budgetManagementModal')">
                        Close
                    </button>
                    <button class="file-manager-btn" onclick="addBudgetItem()">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Function to load budget items for an activity
async function loadActivityBudgetItems(activityId) {
    try {
        const tbody = document.getElementById('budgetItemsTableBody');
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading budget items...</td></tr>';
        
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-items/`);
        if (!response.ok) throw new Error('Failed to fetch budget items');
        
        const budgetItems = await response.json();
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

// Function to add a new budget item
async function addBudgetItem() {
    const activityId = document.getElementById('budgetManagementModal').dataset.activityId;
    const itemData = {
        item_name: document.getElementById('newItemName').value.trim(),
        description: document.getElementById('newItemDescription').value.trim(),
        quantity: parseFloat(document.getElementById('newItemQuantity').value),
        unit_price: parseFloat(document.getElementById('newItemUnitPrice').value),
        category: document.getElementById('newItemCategory').value
    };
    
    // Validate required fields
    if (!itemData.item_name || isNaN(itemData.quantity) || isNaN(itemData.unit_price)) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    try {
        const submitBtn = document.querySelector('#budgetManagementModal .modal-footer .file-manager-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;
        
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}/budget-items/`, {
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
        document.getElementById('newItemName').value = '';
        document.getElementById('newItemDescription').value = '';
        document.getElementById('newItemQuantity').value = '1';
        document.getElementById('newItemUnitPrice').value = '';
        
    } catch (error) {
        console.error('Error adding budget item:', error);
        alert(`Failed to add budget item: ${error.message}`);
    } finally {
        const submitBtn = document.querySelector('#budgetManagementModal .modal-footer .file-manager-btn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Item';
            submitBtn.disabled = false;
        }
    }
}

// Function to delete a budget item
async function deleteBudgetItem(itemId, activityId) {
    if (!confirm('Are you sure you want to delete this budget item?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/budget-items/${itemId}`, {
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
function openBudgetApprovalModal(activityId, activityName) {
    document.getElementById('approvalActivityName').textContent = activityName;
    document.getElementById('approvalActivityId').value = activityId;
    document.getElementById('approvalRemarks').value = '';
    document.getElementById('approvalModal').classList.add('show');
}

// Function to submit budget approval
async function submitBudgetApproval(approved) {
    const activityId = document.getElementById('approvalActivityId').value;
    const remarks = document.getElementById('approvalRemarks').value;
    
    try {
        const response = await fetch('https://backend-jz65.onrender.com/budget-approvals/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity_id: parseInt(activityId),
                approved: approved,
                remarks: remarks
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit approval');
        }
        
        const data = await response.json();
        alert(data.message);
        
        // Close modal and refresh activities
        closeModal('approvalModal');
        loadActivities();
        
        // Refresh program cards to show updated balances
        loadProgramCards();
        
    } catch (error) {
        console.error('Error submitting approval:', error);
        alert(`Error: ${error.message}`);
    }
}

// Function to check if user is director
function isDirector() {
    // In a real app, you would check the user's role from their profile
    const userRole = document.querySelector('.user-role').textContent;
    return userRole.toLowerCase().includes('director');
}

// Function to show appropriate buttons based on user role
function updateActivityActions() {
    document.querySelectorAll('.activities-table tr').forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        if (!statusCell) return;
        
        const status = statusCell.textContent.toLowerCase();
        const actionCell = row.querySelector('td:last-child');
        
        if (status === 'pending approval' && isDirector()) {
            // Show approve/reject buttons for director
            actionCell.innerHTML = `
                <button class="action-btn approve-btn" onclick="openBudgetApprovalModal(${row.dataset.activityId}, '${row.cells[0].textContent}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="action-btn reject-btn" onclick="submitBudgetApproval(false)">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        } else if (status === 'planned') {
            // Show submit for approval button for program officers
            actionCell.innerHTML += `
                <button class="action-btn submit-btn" onclick="submitForApproval(${row.dataset.activityId})">
                    <i class="fas fa-paper-plane"></i> Submit
                </button>
            `;
        }
    });
}

// Function to submit activity for approval
async function submitForApproval(activityId) {
    if (!confirm('Submit this activity budget for director approval?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'pending approval'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit for approval');
        }
        
        alert('Activity submitted for approval successfully');
        loadActivities();
    } catch (error) {
        console.error('Error submitting for approval:', error);
        alert(`Error: ${error.message}`);
    }
}
async function requestActivityApproval(activityId, activityName) {
    const amount = parseFloat(prompt(`Enter the budget amount you're requesting for "${activityName}":`));
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const comments = prompt('Enter any comments for the Director:') || '';
    
    try {
        const response = await fetch('https://backend-jz65.onrender.com/activity-approvals/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity_id: activityId,
                requested_by: 'Head of Programs', // Replace with actual user
                requested_amount: amount,
                comments: comments
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit approval request');
        }
        
        const data = await response.json();
        alert('Approval request submitted successfully!');
        loadActivities(); // Refresh the activities list
    } catch (error) {
        console.error('Error requesting approval:', error);
        alert('Failed to submit approval request. Please try again.');
    }
}

// Function to approve/reject an activity (for Director)
// Function to approve/reject an activity (for Director)
async function reviewActivityApproval(approvalId, decision) {
    const responseComments = prompt(`Enter your comments for ${decision === 'approved' ? 'approval' : 'rejection'}:`) || '';
    
    if (decision === 'approved' && !confirm(`Are you sure you want to approve this activity? This will deduct the budget from the program area and main account.`)) {
        return;
    }
    
    try {
        const response = await fetch(`https://backend-jz65.onrender.com/activity-approvals/${approvalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                decision: decision,
                approved_by: 'Director', // Replace with actual user
                response_comments: responseComments
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit decision');
        }
        
        const data = await response.json();
        alert(`Activity ${decision} successfully!`);
        
        // Refresh both approvals list and program cards
        loadPendingApprovals();
        loadProgramCards();
        
    } catch (error) {
        console.error('Error reviewing approval:', error);
        alert(`Failed to submit decision: ${error.message}`);
    }
}
// Helper function to check if element contains text (for jQuery-like :contains selector)
function containsText(selector, text) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).filter(el => 
        el.textContent.toLowerCase().includes(text.toLowerCase())
    );
}

// Function to load pending approvals (for Director)
async function loadPendingApprovals() {
    try {
        const response = await fetch('https://backend-jz65.onrender.com/activity-approvals/?status=pending');
        if (!response.ok) throw new Error('Failed to fetch pending approvals');
        
        const approvals = await response.json();
        const container = document.getElementById('approvalsContainer');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (approvals.length === 0) {
            container.innerHTML = '<p>No pending approvals</p>';
            return;
        }
        
        approvals.forEach(approval => {
            const card = document.createElement('div');
            card.className = 'approval-card';
            
            // Create budget items HTML
            let budgetItemsHTML = '';
            if (approval.budget_items && approval.budget_items.length > 0) {
                budgetItemsHTML = `
                    <div class="budget-items">
                        <h4>Budget Items:</h4>
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${approval.budget_items.map(item => `
                                    <tr>
                                        <td>${item.item_name}</td>
                                        <td>${item.description || '-'}</td>
                                        <td>${item.quantity}</td>
                                        <td>UGX ${item.unit_price.toLocaleString()}</td>
                                        <td>UGX ${item.total.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            card.innerHTML = `
                <h3>${approval.activity_name}</h3>
                <p><strong>Requested By:</strong> ${approval.requested_by}</p>
                <p><strong>Amount:</strong> UGX ${approval.requested_amount.toLocaleString()}</p>
                <p><strong>Comments:</strong> ${approval.comments || 'None'}</p>
                <p><strong>Requested On:</strong> ${new Date(approval.created_at).toLocaleString()}</p>
                ${budgetItemsHTML}
                <div class="approval-actions">
                    <button class="file-manager-btn" onclick="reviewActivityApproval(${approval.id}, 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="file-manager-btn secondary" onclick="reviewActivityApproval(${approval.id}, 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading approvals:', error);
        document.getElementById('approvalsContainer').innerHTML = 
            '<p class="error">Failed to load approvals</p>';
    }
}
