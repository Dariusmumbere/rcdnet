document.addEventListener('DOMContentLoaded', function() {
    const projectForm = document.getElementById('projectForm');
    
    // Load projects when page loads
    loadProjects();
    
    // Handle form submission
    projectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createProject();
    });
});

async function loadProjects() {
    try {
        const response = await fetch('/api/women-empowerment/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const projects = await response.json();
        const tableBody = document.getElementById('projectsTableBody');
        tableBody.innerHTML = '';
        
        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${project.start_date}</td>
                <td>${project.end_date}</td>
                <td>UGX ${project.budget.toLocaleString()}</td>
                <td>
                    <button onclick="editProject(${project.id})">Edit</button>
                    <button onclick="deleteProject(${project.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        alert('Failed to load projects');
    }
}

async function createProject() {
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        start_date: document.getElementById('projectStartDate').value,
        end_date: document.getElementById('projectEndDate').value,
        budget: parseFloat(document.getElementById('projectBudget').value),
        program_area: 'women_empowerment' // This identifies the program area
    };
    
    try {
        const response = await fetch('/api/women-empowerment/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) throw new Error('Failed to create project');
        
        alert('Project created successfully');
        document.getElementById('projectForm').reset();
        loadProjects();
    } catch (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project');
    }
}

// Implement edit and delete functions similarly...
