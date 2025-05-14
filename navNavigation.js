// navNavigation.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const navItems = document.querySelectorAll('.sidebar-menu li a');
    const contentSections = {
        dashboard: document.getElementById('dashboardContent'),
        fundraising: document.getElementById('fileManagerContent'),
        donations: document.getElementById('donationsContent'),
        implementProject: document.getElementById('implementProjectContent')
    };
    
    // Check if elements exist
    if (!sidebarMenu || navItems.length === 0 || !contentSections.dashboard) {
        console.error('Required navigation elements not found');
        return;
    }
    
    // Set initial active state (dashboard)
    setActiveNavItem(document.querySelector('#dashboardLink'));
    contentSections.dashboard.style.display = 'block';
    loadDashboardSummary();
    
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
            
            // Update active state
            const correspondingNavItem = document.querySelector(`[href="#${hash}"]`);
            if (correspondingNavItem) {
                setActiveNavItem(correspondingNavItem);
            }
        }
    });
});
