// navNavigation.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const navItems = document.querySelectorAll('.sidebar-menu li a');
    const contentSections = {
        dashboard: document.getElementById('dashboardContent'),
        fundraising: document.getElementById('fileManagerContent'),
        donations: document.getElementById('donationsContent'),
        implementProject: document.getElementById('implementProjectContent'),
        directorDashboard: document.getElementById('directorDashboard')
    };
    
    // Check if elements exist
    if (!sidebarMenu || navItems.length === 0 || !contentSections.dashboard) {
        console.error('Required navigation elements not found');
        return;
    }
    
    // Set initial active state (dashboard)
    setActiveNavItem(document.querySelector('#dashboardLink'));
    contentSections.dashboard.style.display = 'block';
    loadProgramCards();
    
    // Handle navigation clicks
    sidebarMenu.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (!target) return;
        
        e.preventDefault();
        
        // Get the target section from the link's ID or href
        const targetSection = getTargetSection(target);
        
        if (targetSection) {
            // Hide all content sections
            Object.values(contentSections).forEach(section => {
                if (section) section.style.display = 'none';
            });
            
            // Show the target section
            if (contentSections[targetSection]) {
                contentSections[targetSection].style.display = 'block';
                
                // Special handling for dashboard to load program cards
                if (targetSection === 'dashboard') {
                    loadProgramCards();
                }
            }
            
            // Update active state
            setActiveNavItem(target);
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('show');
            }
        }
    });
    
    // Helper function to determine target section
    function getTargetSection(navLink) {
        if (navLink.id === 'dashboardLink') return 'dashboard';
        if (navLink.id === 'fundraisingLink') return 'fundraising';
        if (navLink.id === 'donationsLink') return 'donations';
        if (navLink.id === 'implementProjectLink') return 'implementProject';
        
        // Fallback for other links
        const href = navLink.getAttribute('href');
        if (href === '#') return 'dashboard'; // Default to dashboard
        return href.replace('#', '');
    }
    
    // Helper function to set active nav item
    function setActiveNavItem(activeItem) {
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }
    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.replace('#', '');
        if (hash && contentSections[hash]) {
            // Hide all content sections
            Object.values(contentSections).forEach(section => {
                if (section) section.style.display = 'none';
            });
            
            // Show the target section
            contentSections[hash].style.display = 'block';
            
            // Special handling for dashboard to load program cards
            if (hash === 'dashboard') {
                loadProgramCards();
            }
            
            // Update active state
            const correspondingNavItem = document.querySelector(`[href="#${hash}"]`);
            if (correspondingNavItem) {
                setActiveNavItem(correspondingNavItem);
            }
        }
    });
});

// Function to load program cards data
async function loadProgramCards() {
    try {
        console.log('Loading program cards...');
        
        // Fetch data from your dashboard-summary endpoint
        const response = await fetch('https://man-m681.onrender.com/dashboard-summary/');
        
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data);
        
        // Update the main account card
        const mainAccountElement = document.querySelector('.main-bank-card .bank-card-balance');
        if (mainAccountElement && data.main_account_balance !== undefined) {
            mainAccountElement.textContent = `UGX ${data.main_account_balance.toLocaleString()}`;
        }
        
        // Update program area cards
        const programCards = {
            'Women Empowerment': document.querySelector('.program-card-1 .bank-card-balance'),
            'Vocational Education': document.querySelector('.program-card-2 .bank-card-balance'),
            'Climate Change': document.querySelector('.program-card-3 .bank-card-balance'),
            'Reproductive Health': document.querySelector('.program-card-4 .bank-card-balance')
        };
        
        // Check if program_balances exists in the response
        if (data.program_balances) {
            for (const [programName, cardElement] of Object.entries(programCards)) {
                if (cardElement && data.program_balances[programName] !== undefined) {
                    cardElement.textContent = `UGX ${data.program_balances[programName].toLocaleString()}`;
                }
            }
        }
        
        // Update quick stats if available
        if (data.total_donations !== undefined) {
            const donationStatElement = document.querySelector('.stat-card .stat-value');
            if (donationStatElement) {
                donationStatElement.textContent = `UGX ${data.total_donations.toLocaleString()}`;
            }
        }
        
        console.log('Program cards updated successfully');
        
    } catch (error) {
        console.error('Error loading program cards:', error);
        // Show error to user if needed
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = 'Failed to load dashboard data. Please try again later.';
        document.querySelector('.dashboard-content').prepend(errorElement);
    }
}


