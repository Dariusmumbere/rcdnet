// roleNavigation.js - Handles role selection and navigation

// Function to select a role
function selectRole(role) {
    // Hide all dashboards first
    document.getElementById('directorDashboard').style.display = 'none';
    document.getElementById('programOfficerDashboard').style.display = 'none';
    document.getElementById('roleSelection').style.display = 'none';
    document.getElementById('programAreaContent').style.display = 'none';
    
    if (role === 'director') {
        document.getElementById('directorDashboard').style.display = 'block';
        loadProjects();
        
        // Add event listener for create project button
        document.getElementById('createProjectBtn')?.addEventListener('click', function() {
            document.getElementById('projectForm').reset();
            document.getElementById('createProjectModal').classList.add('show');
        });
        
        // Initialize payment approvals
        initPaymentApprovals();
        
    } else if (role === 'program_officer') {
        document.getElementById('programOfficerDashboard').style.display = 'block';
        loadActivities();
        
        // Add event listener for create activity button
        document.getElementById('createActivityBtn')?.addEventListener('click', function() {
            document.getElementById('activityForm').reset();
            loadProjectsForActivities();
            document.getElementById('createActivityModal').classList.add('show');
        });
        
    } else if (role === 'human_resource') {
        // Redirect to HR page
        window.location.href = "https://dariusmumbere.github.io/ngo/roles.html";
        
    } else if (role === 'finance') {
        // Redirect to Finance page
        window.location.href = "https://dariusmumbere.github.io/ngo/finance.html";
        
    } else {
        alert(`${role.replace('_', ' ').toUpperCase()} functionality will be implemented later`);
    }
}

// Function to navigate to a specific program area
function navigateToProgramArea(programAreaId, programAreaName) {
    currentProgramAreaId = programAreaId;
    currentProgramAreaName = programAreaName;
    
    // Hide other content
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('fileManagerContent').style.display = 'none';
    document.getElementById('donationsContent').style.display = 'none';
    document.getElementById('implementProjectContent').style.display = 'none';
    
    // Show program area content
    const programAreaContent = document.getElementById('programAreaContent');
    programAreaContent.style.display = 'block';
    
    // Update title
    document.getElementById('programAreaName').textContent = programAreaName;
    
    // Load projects for this program area
    loadProgramAreaProjects(programAreaId);
}

// Initialize role navigation
document.addEventListener('DOMContentLoaded', function() {
    // Set up role card click events
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            const role = this.getAttribute('onclick').match(/selectRole\('(.+?)'\)/)[1];
            selectRole(role);
        });
    });
    
    // Set up program area navigation
    const programAreaCards = document.querySelectorAll('.role-card[onclick^="navigateToProgramArea"]');
    programAreaCards.forEach(card => {
        card.addEventListener('click', function() {
            const match = this.getAttribute('onclick').match(/navigateToProgramArea\((\d+), '(.+?)'\)/);
            if (match) {
                navigateToProgramArea(parseInt(match[1]), match[2]);
            }
        });
    });
    
    // Set up back button for program area view
    document.getElementById('backToRolesBtn')?.addEventListener('click', function() {
        document.getElementById('programAreaContent').style.display = 'none';
        document.getElementById('roleSelection').style.display = 'block';
    });
});

// Global variables for program area navigation
let currentProgramAreaId = null;
let currentProgramAreaName = null;

// Function to load projects for a specific program area
async function loadProgramAreaProjects(programAreaId) {
    try {
        const tableBody = document.getElementById('programAreaProjectsTableBody');
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading projects...</td></tr>';
        
        const response = await fetch(`https://backend-jz65.onrender.com/program_areas/${programAreaId}/projects/`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No projects found for this program area</td></tr>';
            return;
        }
        
        data.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${project.start_date}</td>
                <td>${project.end_date}</td>
                <td>UGX ${project.budget.toLocaleString()}</td>
                <td><span class="status-badge ${project.status}">${project.status}</span></td>
                <td>
                    <button class="action-btn view-btn" onclick="viewProject(${project.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editProject(${project.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProject(${project.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading program area projects:', error);
        document.getElementById('programAreaProjectsTableBody').innerHTML = 
            '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load projects</td></tr>';
    }
}

// Add project to program area
document.getElementById('addProjectToProgramBtn')?.addEventListener('click', function() {
    if (!currentProgramAreaId) return;
    
    // Reset form
    document.getElementById('projectForm').reset();
    
    // Set modal title
    document.querySelector('#createProjectModal .modal-header h3').textContent = 
        `Add Project to ${currentProgramAreaName}`;
    
    // Store that this is for a specific program area
    document.getElementById('createProjectModal').dataset.programAreaId = currentProgramAreaId;
    
    // Open modal
    document.getElementById('createProjectModal').classList.add('show');
});
