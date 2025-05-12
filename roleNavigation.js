
document.addEventListener('DOMContentLoaded', function() {
    const roleCards = document.querySelectorAll('.role-card');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    
    if (!roleCards.length || !sidebar || !menuToggle) {
        console.error('Required elements for role navigation not found');
        return;
    }

    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            // On mobile devices, ensure sidebar is properly toggled
            if (window.innerWidth <= 768) {
                // Close sidebar completely
                sidebar.classList.remove('show');
                // Reset to default state (non-collapsed)
                sidebar.classList.remove('collapsed');
                // Reset menu icon
                menuToggle.querySelector('i').className = 'fas fa-bars';
            } else {
                // On desktop, ensure sidebar is expanded
                sidebar.classList.remove('collapsed');
                // Update menu icon
                menuToggle.querySelector('i').className = 'fas fa-bars';
            }
            
            // Additional check after a short delay to ensure visibility
            setTimeout(() => {
                const navItems = document.querySelectorAll('.sidebar-menu li a span');
                navItems.forEach(item => {
                    item.style.display = 'inline';
                    item.style.opacity = '1';
                });
            }, 100);
        });
    });

    // Handle window resize to maintain proper state
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // On desktop, ensure sidebar is expanded
            sidebar.classList.remove('collapsed', 'show');
            menuToggle.querySelector('i').className = 'fas fa-bars';
            
            // Ensure all nav items are visible
            const navItems = document.querySelectorAll('.sidebar-menu li a span');
            navItems.forEach(item => {
                item.style.display = 'inline';
                item.style.opacity = '1';
            });
        }
    });
});
