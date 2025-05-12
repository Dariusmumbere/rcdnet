// fileManager.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentPath = [];
    let filesToUpload = [];
    
    // DOM elements
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const browseFilesBtn = document.getElementById('browseFilesBtn');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const startUploadBtn = document.getElementById('startUploadBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBarFill = document.getElementById('progressBarFill');
    const fileManagerGrid = document.getElementById('fileManagerGrid');
    const breadcrumb = document.getElementById('breadcrumb');
    
    // Event listeners
    if (uploadFilesBtn) uploadFilesBtn.addEventListener('click', openUploadModal);
    if (createFolderBtn) createFolderBtn.addEventListener('click', openCreateFolderModal);
    if (browseFilesBtn) browseFilesBtn.addEventListener('click', triggerFileInput);
    if (fileUploadInput) fileUploadInput.addEventListener('change', handleFileSelection);
    if (startUploadBtn) startUploadBtn.addEventListener('click', startFileUpload);
    
    // Initialize file manager with root folder
    loadFolderContents('');
    
    // Function to load folder contents
    function loadFolderContents(folderId) {
        // In a real implementation, you would fetch this from your backend
        // For now, we'll use mock data
        const mockFolders = [
            { id: '1', name: 'Proposals' },
            { id: '2', name: 'Reports' }
        ];
        
        const mockFiles = [
            { id: '1', name: 'Annual_Report_2023.pdf', type: 'pdf' },
            { id: '2', name: 'Budget_2024.xlsx', type: 'xlsx' }
        ];
        
        // Clear current grid
        fileManagerGrid.innerHTML = '';
        
        // Add folders
        mockFolders.forEach(folder => {
            const folderItem = createFolderElement(folder);
            fileManagerGrid.appendChild(folderItem);
        });
        
        // Add files
        mockFiles.forEach(file => {
            const fileItem = createFileElement(file);
            fileManagerGrid.appendChild(fileItem);
        });
        
        // Update breadcrumb
        updateBreadcrumb();
    }
    
    // Function to create folder element
    function createFolderElement(folder) {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.setAttribute('data-folder-id', folder.id);
        folderItem.setAttribute('data-folder-name', folder.name);
        
        folderItem.innerHTML = `
            <div class="folder-icon">
                <i class="fas fa-folder"></i>
            </div>
            <div class="folder-name">${folder.name}</div>
            <div class="file-actions-menu" onclick="event.stopPropagation(); toggleFolderActions(event, '${folder.id}')">
                <i class="fas fa-ellipsis-v"></i>
            </div>
            <div class="file-actions-dropdown" id="folder-actions-${folder.id}">
                <div class="file-action-item" onclick="renameFolder('${folder.id}', '${folder.name}')">
                    <i class="fas fa-pencil-alt"></i> Rename
                </div>
                <div class="file-action-item" onclick="deleteFolder('${folder.id}')">
                    <i class="fas fa-trash"></i> Delete
                </div>
            </div>
        `;
        
        // Add click event to navigate into folder
        folderItem.addEventListener('click', function() {
            currentPath.push({ id: folder.id, name: folder.name });
            loadFolderContents(folder.id);
        });
        
        return folderItem;
    }
    
    // Function to create file element
    function createFileElement(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.setAttribute('data-file-id', file.id);
        fileItem.setAttribute('data-file-name', file.name);
        
        // Determine icon based on file type
        let fileIcon;
        switch(file.type) {
            case 'pdf':
                fileIcon = 'fa-file-pdf';
                break;
            case 'xlsx':
            case 'xls':
                fileIcon = 'fa-file-excel';
                break;
            case 'docx':
            case 'doc':
                fileIcon = 'fa-file-word';
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                fileIcon = 'fa-file-image';
                break;
            default:
                fileIcon = 'fa-file';
        }
        
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="fas ${fileIcon}"></i>
            </div>
            <div class="file-name">${file.name}</div>
            <div class="file-actions-menu" onclick="event.stopPropagation(); toggleFileActions(event, '${file.id}')">
                <i class="fas fa-ellipsis-v"></i>
            </div>
            <div class="file-actions-dropdown" id="file-actions-${file.id}">
                <div class="file-action-item" onclick="previewFile('${file.id}', '${file.name}', '${file.type}')">
                    <i class="fas fa-eye"></i> Preview
                </div>
                <div class="file-action-item" onclick="downloadFile('${file.id}', '${file.name}')">
                    <i class="fas fa-download"></i> Download
                </div>
                <div class="file-action-item" onclick="renameFile('${file.id}', '${file.name}')">
                    <i class="fas fa-pencil-alt"></i> Rename
                </div>
                <div class="file-action-item" onclick="deleteFile('${file.id}', '${file.name}')">
                    <i class="fas fa-trash"></i> Delete
                </div>
            </div>
        `;
        
        // Add click event to preview file
        fileItem.addEventListener('click', function() {
            previewFile(file.id, file.name, file.type);
        });
        
        return fileItem;
    }
    
    // Function to update breadcrumb navigation
    function updateBreadcrumb() {
        breadcrumb.innerHTML = '<span class="breadcrumb-item" data-path="">Fundraising Documents</span>';
        
        currentPath.forEach((item, index) => {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '&nbsp;/&nbsp;';
            breadcrumb.appendChild(separator);
            
            const crumb = document.createElement('span');
            crumb.className = 'breadcrumb-item';
            crumb.textContent = item.name;
            crumb.setAttribute('data-path', JSON.stringify(currentPath.slice(0, index + 1)));
            
            crumb.addEventListener('click', function() {
                const path = JSON.parse(this.getAttribute('data-path'));
                currentPath = path;
                loadFolderContents(path[path.length - 1].id);
            });
            
            breadcrumb.appendChild(crumb);
        });
    }
    
    // Function to open upload modal
    function openUploadModal() {
        document.getElementById('uploadModal').classList.add('show');
    }
    
    // Function to close upload modal
    function closeUploadModal() {
        document.getElementById('uploadModal').classList.remove('show');
        resetUploadForm();
    }
    
    // Function to reset upload form
    function resetUploadForm() {
        fileUploadInput.value = '';
        filesToUpload = [];
        startUploadBtn.disabled = true;
        uploadProgress.style.display = 'none';
        progressBarFill.style.width = '0%';
    }
    
    // Function to trigger file input
    function triggerFileInput() {
        fileUploadInput.click();
    }
    
    // Function to handle file selection
    function handleFileSelection(event) {
        filesToUpload = Array.from(event.target.files);
        startUploadBtn.disabled = filesToUpload.length === 0;
    }
    
    // Function to start file upload
    function startFileUpload() {
        if (filesToUpload.length === 0) return;
        
        uploadProgress.style.display = 'block';
        startUploadBtn.disabled = true;
        
        // Simulate upload progress (in a real app, you would use XMLHttpRequest or Fetch API)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBarFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    alert('Files uploaded successfully!');
                    closeUploadModal();
                    // Refresh the file list
                    loadFolderContents(currentPath.length > 0 ? currentPath[currentPath.length - 1].id : '');
                }, 500);
            }
        }, 300);
    }
    
    // Function to open create folder modal
    function openCreateFolderModal() {
        document.getElementById('folderCreateModal').classList.add('show');
        document.getElementById('newFolderName').focus();
    }
    
    // Function to close create folder modal
    function closeCreateFolderModal() {
        document.getElementById('folderCreateModal').classList.remove('show');
        document.getElementById('newFolderName').value = '';
    }
    
    // Function to create new folder
    function createNewFolder() {
        const folderName = document.getElementById('newFolderName').value.trim();
        
        if (!folderName) {
            alert('Please enter a folder name');
            return;
        }
        
        // In a real implementation, you would send this to your backend
        alert(`Folder "${folderName}" created successfully!`);
        closeCreateFolderModal();
        
        // Refresh the file list
        loadFolderContents(currentPath.length > 0 ? currentPath[currentPath.length - 1].id : '');
    }
    
    // Function to toggle file actions dropdown
    window.toggleFileActions = function(event, fileId) {
        event.stopPropagation();
        const dropdown = document.getElementById(`file-actions-${fileId}`);
        dropdown.classList.toggle('show');
        
        // Close other dropdowns
        document.querySelectorAll('.file-actions-dropdown').forEach(dd => {
            if (dd.id !== `file-actions-${fileId}`) {
                dd.classList.remove('show');
            }
        });
    };
    
    // Function to toggle folder actions dropdown
    window.toggleFolderActions = function(event, folderId) {
        event.stopPropagation();
        const dropdown = document.getElementById(`folder-actions-${folderId}`);
        dropdown.classList.toggle('show');
        
        // Close other dropdowns
        document.querySelectorAll('.file-actions-dropdown').forEach(dd => {
            if (dd.id !== `folder-actions-${folderId}`) {
                dd.classList.remove('show');
            }
        });
    };
    
    // Function to preview file
    window.previewFile = function(fileId, fileName, fileType) {
        const modal = document.getElementById('filePreviewModal');
        const previewContent = document.getElementById('previewFileContent');
        
        document.getElementById('previewFileName').textContent = fileName;
        
        // Clear previous content
        previewContent.innerHTML = '';
        
        // Create appropriate preview based on file type
        if (fileType === 'pdf') {
            const iframe = document.createElement('iframe');
            iframe.className = 'file-preview-iframe';
            iframe.src = `path/to/files/${fileName}`; // Replace with actual file path
            previewContent.appendChild(iframe);
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
            const img = document.createElement('img');
            img.className = 'file-preview-image';
            img.src = `path/to/files/${fileName}`; // Replace with actual file path
            previewContent.appendChild(img);
        } else {
            previewContent.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-file" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <p>Preview not available for this file type</p>
                    <p>Please download the file to view it</p>
                </div>
            `;
        }
        
        modal.classList.add('show');
    };
    
    // Function to close preview
    window.closePreview = function() {
        document.getElementById('filePreviewModal').classList.remove('show');
    };
    
    // Function to download current file
    window.downloadCurrentFile = function() {
        const fileName = document.getElementById('previewFileName').textContent;
        downloadFile(null, fileName);
    };
    
    // Function to download file
    window.downloadFile = function(fileId, fileName) {
        // In a real implementation, this would initiate a download from your server
        alert(`Downloading file: ${fileName}`);
        closePreview();
    };
    
    // Function to rename file
    window.renameFile = function(fileId, currentName) {
        const newName = prompt('Enter new file name:', currentName);
        if (newName && newName !== currentName) {
            // In a real implementation, you would send this to your backend
            alert(`File renamed to: ${newName}`);
            
            // Update the file name in the UI
            const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
            if (fileItem) {
                fileItem.setAttribute('data-file-name', newName);
                fileItem.querySelector('.file-name').textContent = newName;
            }
        }
    };
    
    // Function to delete file
    window.deleteFile = function(fileId, fileName) {
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            // In a real implementation, you would send this to your backend
            alert(`File "${fileName}" deleted successfully!`);
            
            // Remove the file from the UI
            const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
            if (fileItem) {
                fileItem.remove();
            }
        }
    };
    
    // Function to rename folder
    window.renameFolder = function(folderId, currentName) {
        const newName = prompt('Enter new folder name:', currentName);
        if (newName && newName !== currentName) {
            // In a real implementation, you would send this to your backend
            alert(`Folder renamed to: ${newName}`);
            
            // Update the folder name in the UI
            const folderItem = document.querySelector(`.folder-item[data-folder-id="${folderId}"]`);
            if (folderItem) {
                folderItem.setAttribute('data-folder-name', newName);
                folderItem.querySelector('.folder-name').textContent = newName;
                
                // Update the name in currentPath if this folder is in the path
                currentPath = currentPath.map(item => {
                    if (item.id === folderId) {
                        return { ...item, name: newName };
                    }
                    return item;
                });
                
                // Update breadcrumb
                updateBreadcrumb();
            }
        }
    };
    
    // Function to delete folder
    window.deleteFolder = function(folderId) {
        const folderItem = document.querySelector(`.folder-item[data-folder-id="${folderId}"]`);
        const folderName = folderItem ? folderItem.getAttribute('data-folder-name') : 'this folder';
        
        if (confirm(`Are you sure you want to delete "${folderName}" and all its contents?`)) {
            // In a real implementation, you would send this to your backend
            alert(`Folder "${folderName}" deleted successfully!`);
            
            // Remove the folder from the UI
            if (folderItem) {
                folderItem.remove();
            }
        }
    };
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.file-actions-dropdown').forEach(dd => {
            dd.classList.remove('show');
        });
    });
});
