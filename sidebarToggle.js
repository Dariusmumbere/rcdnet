// sidebarToggle.js
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    // Check if elements exist
    if (!menuToggle || !sidebar || !mainContent) {
        console.error('Required elements for sidebar toggle not found');
        return;
    }
    
    // Toggle sidebar collapse/expand
    menuToggle.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            // Mobile view - toggle show/hide
            sidebar.classList.toggle('show');
        } else {
            // Desktop view - toggle collapsed/expanded
            sidebar.classList.toggle('collapsed');
            
            // Update menu toggle icon
            const icon = menuToggle.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-indent');
            } else {
                icon.classList.remove('fa-indent');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('show') && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('.menu-toggle')) {
            sidebar.classList.remove('show');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // On desktop, ensure sidebar is visible (not hidden)
            sidebar.classList.remove('show');
        }
    });
    
    // Set initial state based on screen size
    if (window.innerWidth > 768) {
        // Desktop - start with expanded sidebar
        sidebar.classList.remove('collapsed');
        menuToggle.querySelector('i').classList.add('fa-bars');
    } else {
        // Mobile - start with hidden sidebar
        sidebar.classList.remove('collapsed', 'show');
    }
});
