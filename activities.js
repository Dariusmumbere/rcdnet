// Function to handle the "Create New Activity" button click
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
        const response = await fetch('https://man-m681.onrender.com/projects/');
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
        
        const response = await fetch('https://man-m681.onrender.com/activities/', {
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
        
        const response = await fetch('https://man-m681.onrender.com/activities/');
        
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
                <td><span class="status-badge ${activity.status ? activity.status.replace(' ', '_') : 'planned'}">
                    ${activity.status || 'Planned'}
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
