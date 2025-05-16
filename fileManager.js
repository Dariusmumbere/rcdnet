function downloadFile(fileId, fileName) {
    // Create a download link
    const downloadLink = document.createElement('a');
    
    // Set the file URL (you'll need to replace this with your actual file endpoint)
    // This is a placeholder - you'll need to implement the actual file download endpoint
    const fileUrl = `https://your-api-endpoint.com/files/${fileId}/download`;
    
    // Set the download attributes
    downloadLink.href = fileUrl;
    downloadLink.download = fileName;
    downloadLink.target = '_blank';
    
    // Append to the body, click it, then remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Show download confirmation
    showToastMessage(`Downloading ${fileName}...`);
}

// Function to show toast messages
function showToastMessage(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Function to preview a file (if needed)
function previewFile(fileId, fileName, fileType) {
    // This would open a preview modal - you can implement this if needed
    console.log(`Previewing file ${fileName} (ID: ${fileId}, Type: ${fileType})`);
    showToastMessage(`Opening preview for ${fileName}...`);
}

// Function to handle file actions menu
function toggleFileActions(event, fileId) {
    event.stopPropagation();
    
    // Hide all other dropdowns first
    document.querySelectorAll('.file-actions-dropdown').forEach(dropdown => {
        if (dropdown.id !== `file-actions-${fileId}`) {
            dropdown.classList.remove('show');
        }
    });
    
    // Toggle the clicked dropdown
    const dropdown = document.getElementById(`file-actions-${fileId}`);
    dropdown.classList.toggle('show');
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target.className !== 'file-actions-menu') {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

// Expose functions to global scope for HTML onclick handlers
window.downloadFile = downloadFile;
window.previewFile = previewFile;
window.toggleFileActions = toggleFileActions;
