// File Manager Functions
function toggleFileActions(event, fileId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`file-actions-${fileId}`);
    dropdown.classList.toggle('show');
}

function toggleFolderActions(event, folderId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`folder-actions-${folderId}`);
    dropdown.classList.toggle('show');
}

async function previewFile(fileId, fileName, fileType) {
    try {
        // Close any open dropdowns
        document.querySelectorAll('.file-actions-dropdown.show').forEach(d => d.classList.remove('show'));
        
        // Show loading state
        const previewContent = document.getElementById('previewFileContent');
        previewContent.innerHTML = '<div class="loading">Loading preview...</div>';
        
        // Set file info
        document.getElementById('previewFileName').textContent = fileName;
        currentFileId = fileId;
        currentFileName = fileName;
        currentFileType = fileType;
        
        // Show modal
        document.getElementById('filePreviewModal').classList.add('show');
        
        // Get file preview from server
        const response = await fetch(`https://man-m681.onrender.com/files/${fileId}/preview`);
        
        if (!response.ok) {
            throw new Error('Failed to get file preview');
        }
        
        // Handle different file types
        if (fileType === 'pdf') {
            previewContent.innerHTML = `
                <iframe class="file-preview-iframe" src="${response.url}" frameborder="0"></iframe>
            `;
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase())) {
            previewContent.innerHTML = `
                <img class="file-preview-image" src="${response.url}" alt="${fileName}">
            `;
        } else {
            previewContent.innerHTML = `
                <div class="unsupported-preview">
                    <i class="fas fa-file-alt"></i>
                    <p>No preview available for this file type</p>
                    <p>Please download the file to view it</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error previewing file:', error);
        previewContent.innerHTML = `
            <div class="error">
                <p>Failed to load file preview</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function downloadFile(fileId, fileName) {
    try {
        // Close dropdown if open
        document.querySelectorAll('.file-actions-dropdown.show').forEach(d => d.classList.remove('show'));
        
        // Create a temporary link and trigger download
        const response = await fetch(`https://man-m681.onrender.com/files/${fileId}/download`);
        
        if (!response.ok) {
            throw new Error('Failed to download file');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        showToast('File download started');
    } catch (error) {
        console.error('Error downloading file:', error);
        showToast('Failed to download file', 'error');
    }
}

async function renameFile(fileId, currentName) {
    const newName = prompt('Enter new file name:', currentName);
    if (!newName || newName.trim() === '' || newName === currentName) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/files/${fileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newName })
        });
        
        if (!response.ok) {
            throw new Error('Failed to rename file');
        }
        
        // Update the file name in the UI
        const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.querySelector('.file-name').textContent = newName;
            fileItem.setAttribute('data-file-name', newName);
        }
        
        showToast('File renamed successfully');
    } catch (error) {
        console.error('Error renaming file:', error);
        showToast('Failed to rename file', 'error');
    }
}

async function deleteFile(fileId, fileName) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete file');
        }
        
        // Remove the file from the UI
        const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.remove();
        }
        
        showToast('File deleted successfully');
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast('Failed to delete file', 'error');
    }
}

async function renameFolder(folderId, currentName) {
    const newName = prompt('Enter new folder name:', currentName);
    if (!newName || newName.trim() === '' || newName === currentName) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/folders/${folderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newName })
        });
        
        if (!response.ok) {
            throw new Error('Failed to rename folder');
        }
        
        // Update the folder name in the UI
        const folderItem = document.querySelector(`.folder-item[data-folder-id="${folderId}"]`);
        if (folderItem) {
            folderItem.querySelector('.folder-name').textContent = newName;
            folderItem.setAttribute('data-folder-name', newName);
        }
        
        showToast('Folder renamed successfully');
    } catch (error) {
        console.error('Error renaming folder:', error);
        showToast('Failed to rename folder', 'error');
    }
}

async function deleteFolder(folderId) {
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://man-m681.onrender.com/folders/${folderId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete folder');
        }
        
        // Remove the folder from the UI
        const folderItem = document.querySelector(`.folder-item[data-folder-id="${folderId}"]`);
        if (folderItem) {
            folderItem.remove();
        }
        
        showToast('Folder deleted successfully');
    } catch (error) {
        console.error('Error deleting folder:', error);
        showToast('Failed to delete folder', 'error');
    }
}

function closePreview() {
    document.getElementById('filePreviewModal').classList.remove('show');
    currentFileId = null;
    currentFileName = null;
    currentFileType = null;
}

function downloadCurrentFile() {
    if (currentFileId && currentFileName) {
        downloadFile(currentFileId, currentFileName);
    }
}

function closeCreateFolderModal() {
    document.getElementById('folderCreateModal').classList.remove('show');
    document.getElementById('newFolderName').value = '';
}

async function createNewFolder() {
    const folderName = document.getElementById('newFolderName').value.trim();
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    try {
        // Get current folder ID from breadcrumb
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
        const currentFolderId = breadcrumbItems.length > 0 ? 
            breadcrumbItems[breadcrumbItems.length - 1].getAttribute('data-path') || null : null;
        
        const requestData = {
            name: folderName
        };
        
        if (currentFolderId) {
            requestData.parent_id = currentFolderId;
        }
        
        const response = await fetch('https://man-m681.onrender.com/folders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create folder');
        }
        
        const folder = await response.json();
        
        // Add the new folder to the UI
        const fileManagerGrid = document.getElementById('fileManagerGrid');
        const folderHTML = `
            <div class="folder-item" data-folder-id="${folder.id}" data-folder-name="${folder.name}">
                <div class="folder-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="folder-name">${folder.name}</div>
                <div class="file-actions-menu" onclick="toggleFolderActions(event, '${folder.id}')">
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
            </div>
        `;
        
        fileManagerGrid.insertAdjacentHTML('beforeend', folderHTML);
        closeCreateFolderModal();
        showToast('Folder created successfully');
    } catch (error) {
        console.error('Error creating folder:', error);
        showToast(`Failed to create folder: ${error.message}`, 'error');
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('show');
    document.getElementById('fileUploadInput').value = '';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('progressBarFill').style.width = '0%';
    filesToUpload = [];
    document.getElementById('startUploadBtn').disabled = true;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Handle clicks outside dropdowns to close them
document.addEventListener('click', function() {
    document.querySelectorAll('.file-actions-dropdown.show').forEach(d => d.classList.remove('show'));
});

// Initialize file manager when the fundraising link is clicked
fundraisingLink.addEventListener('click', function(e) {
    e.preventDefault();
    dashboardContent.style.display = 'none';
    fileManagerContent.style.display = 'block';
    donationsContent.style.display = 'none';
    setActiveNavItem(fundraisingLink);
    
    // Load root folder contents
    loadFolderContents();
});

// Load folder contents
async function loadFolderContents(folderId = null) {
    try {
        const fileManagerGrid = document.getElementById('fileManagerGrid');
        fileManagerGrid.innerHTML = '<div class="loading">Loading folder contents...</div>';
        
        const url = folderId ? 
            `https://man-m681.onrender.com/folders/${folderId}/contents` :
            'https://man-m681.onrender.com/folders/root/contents';
            
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to load folder contents');
        }
        
        const data = await response.json();
        fileManagerGrid.innerHTML = '';
        
        if (data.folders.length === 0 && data.files.length === 0) {
            fileManagerGrid.innerHTML = '<div class="empty-folder">This folder is empty</div>';
            return;
        }
        
        // Add folders
        data.folders.forEach(folder => {
            const folderHTML = `
                <div class="folder-item" data-folder-id="${folder.id}" data-folder-name="${folder.name}">
                    <div class="folder-icon">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="folder-name">${folder.name}</div>
                    <div class="file-actions-menu" onclick="toggleFolderActions(event, '${folder.id}')">
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
                </div>
            `;
            fileManagerGrid.insertAdjacentHTML('beforeend', folderHTML);
        });
        
        // Add files
        data.files.forEach(file => {
            const fileExt = file.name.split('.').pop().toLowerCase();
            let fileIcon = 'fa-file';
            
            // Set appropriate icon based on file type
            if (['pdf'].includes(fileExt)) fileIcon = 'fa-file-pdf';
            else if (['doc', 'docx'].includes(fileExt)) fileIcon = 'fa-file-word';
            else if (['xls', 'xlsx'].includes(fileExt)) fileIcon = 'fa-file-excel';
            else if (['ppt', 'pptx'].includes(fileExt)) fileIcon = 'fa-file-powerpoint';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) fileIcon = 'fa-file-image';
            else if (['zip', 'rar'].includes(fileExt)) fileIcon = 'fa-file-archive';
            
            const fileHTML = `
                <div class="file-item" data-file-id="${file.id}" data-file-name="${file.name}">
                    <div class="file-icon">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-actions-menu" onclick="toggleFileActions(event, '${file.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="file-actions-dropdown" id="file-actions-${file.id}">
                        <div class="file-action-item" onclick="previewFile('${file.id}', '${file.name}', '${fileExt}')">
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
                </div>
            `;
            fileManagerGrid.insertAdjacentHTML('beforeend', fileHTML);
        });
        
        // Update breadcrumb
        updateBreadcrumb(folderId);
    } catch (error) {
        console.error('Error loading folder contents:', error);
        document.getElementById('fileManagerGrid').innerHTML = `
            <div class="error">
                <p>Failed to load folder contents</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Update breadcrumb navigation
async function updateBreadcrumb(folderId = null) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '<span class="breadcrumb-item" data-path="">Fundraising Documents</span>';
    
    if (!folderId) return;
    
    try {
        // Get folder path
        const response = await fetch(`https://man-m681.onrender.com/folders/${folderId}/path`);
        
        if (!response.ok) {
            throw new Error('Failed to get folder path');
        }
        
        const pathData = await response.json();
        
        // Add each folder to breadcrumb
        pathData.forEach(folder => {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '&nbsp;/&nbsp;';
            breadcrumb.appendChild(separator);
            
            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = folder.name;
            item.setAttribute('data-path', folder.id);
            breadcrumb.appendChild(item);
        });
        
        // Make breadcrumb items clickable
        document.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', function() {
                const pathId = this.getAttribute('data-path') || null;
                loadFolderContents(pathId);
            });
        });
    } catch (error) {
        console.error('Error updating breadcrumb:', error);
    }
}

// Handle folder clicks
document.addEventListener('click', function(e) {
    const folderItem = e.target.closest('.folder-item');
    if (folderItem && !e.target.closest('.file-actions-menu')) {
        const folderId = folderItem.getAttribute('data-folder-id');
        loadFolderContents(folderId);
    }
});

// Handle file upload
document.getElementById('uploadFilesBtn').addEventListener('click', function() {
    document.getElementById('uploadModal').classList.add('show');
});

document.getElementById('browseFilesBtn').addEventListener('click', function() {
    document.getElementById('fileUploadInput').click();
});

document.getElementById('fileUploadInput').addEventListener('change', function(e) {
    filesToUpload = Array.from(e.target.files);
    document.getElementById('startUploadBtn').disabled = filesToUpload.length === 0;
});

document.getElementById('startUploadBtn').addEventListener('click', async function() {
    if (filesToUpload.length === 0) return;
    
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBarFill');
    const startUploadBtn = document.getElementById('startUploadBtn');
    
    uploadProgress.style.display = 'block';
    startUploadBtn.disabled = true;
    
    // Get current folder ID from breadcrumb
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
    const currentFolderId = breadcrumbItems.length > 0 ? 
        breadcrumbItems[breadcrumbItems.length - 1].getAttribute('data-path') : null;
    
    try {
        const formData = new FormData();
        filesToUpload.forEach(file => {
            formData.append('files', file);
        });
        
        if (currentFolderId) {
            formData.append('folder_id', currentFolderId);
        }
        
        const response = await fetch('https://man-m681.onrender.com/upload/', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload files');
        }
        
        const data = await response.json();
        
        // Update progress bar
        progressBar.style.width = '100%';
        
        // Add uploaded files to the UI
        data.uploadedFiles.forEach(file => {
            const fileExt = file.name.split('.').pop().toLowerCase();
            let fileIcon = 'fa-file';
            
            if (['pdf'].includes(fileExt)) fileIcon = 'fa-file-pdf';
            else if (['doc', 'docx'].includes(fileExt)) fileIcon = 'fa-file-word';
            else if (['xls', 'xlsx'].includes(fileExt)) fileIcon = 'fa-file-excel';
            else if (['ppt', 'pptx'].includes(fileExt)) fileIcon = 'fa-file-powerpoint';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) fileIcon = 'fa-file-image';
            else if (['zip', 'rar'].includes(fileExt)) fileIcon = 'fa-file-archive';
            
            const fileHTML = `
                <div class="file-item" data-file-id="${file.id}" data-file-name="${file.name}">
                    <div class="file-icon">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-actions-menu" onclick="toggleFileActions(event, '${file.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="file-actions-dropdown" id="file-actions-${file.id}">
                        <div class="file-action-item" onclick="previewFile('${file.id}', '${file.name}', '${fileExt}')">
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
                </div>
            `;
            document.getElementById('fileManagerGrid').insertAdjacentHTML('beforeend', fileHTML);
        });
        
        showToast('Files uploaded successfully');
        setTimeout(() => {
            closeUploadModal();
        }, 1000);
    } catch (error) {
        console.error('Error uploading files:', error);
        showToast('Failed to upload files', 'error');
        startUploadBtn.disabled = false;
    }
});

// Handle drag and drop for file upload
const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#3498db';
    this.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
});

uploadArea.addEventListener('dragleave', function() {
    this.style.borderColor = '#ccc';
    this.style.backgroundColor = '';
});

uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '#ccc';
    this.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length > 0) {
        filesToUpload = Array.from(e.dataTransfer.files);
        document.getElementById('startUploadBtn').disabled = false;
    }
});

// Handle file upload
document.getElementById('uploadFilesBtn').addEventListener('click', function() {
    document.getElementById('uploadModal').classList.add('show');
});

document.getElementById('browseFilesBtn').addEventListener('click', function() {
    document.getElementById('fileUploadInput').click();
});

document.getElementById('fileUploadInput').addEventListener('change', function(e) {
    filesToUpload = Array.from(e.target.files);
    document.getElementById('startUploadBtn').disabled = filesToUpload.length === 0;
    
    // Show file names in upload area
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Ready to upload ${filesToUpload.length} file(s)</p>
        <div id="fileUploadList"></div>
    `;
    
    const fileList = document.getElementById('fileUploadList');
    filesToUpload.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-upload-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <span>${(file.size / 1024).toFixed(2)} KB</span>
        `;
        fileList.appendChild(fileItem);
    });
});

document.getElementById('startUploadBtn').addEventListener('click', async function() {
    if (filesToUpload.length === 0) return;
    
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBarFill');
    const startUploadBtn = document.getElementById('startUploadBtn');
    
    uploadProgress.style.display = 'block';
    startUploadBtn.disabled = true;
    progressBar.style.width = '0%';
    
    // Get current folder ID from breadcrumb
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
    const currentFolderId = breadcrumbItems.length > 0 ? 
        breadcrumbItems[breadcrumbItems.length - 1].getAttribute('data-path') || null : null;
    
    try {
        const formData = new FormData();
        filesToUpload.forEach(file => {
            formData.append('files', file);
        });
        
        if (currentFolderId) {
            formData.append('folder_id', currentFolderId);
        }
        
        const response = await fetch('https://man-m681.onrender.com/upload/', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload files');
        }
        
        const data = await response.json();
        
        // Update progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 100);
        
        // Add uploaded files to the UI
        data.uploadedFiles.forEach(file => {
            const fileExt = file.name.split('.').pop().toLowerCase();
            let fileIcon = 'fa-file';
            
            if (['pdf'].includes(fileExt)) fileIcon = 'fa-file-pdf';
            else if (['doc', 'docx'].includes(fileExt)) fileIcon = 'fa-file-word';
            else if (['xls', 'xlsx'].includes(fileExt)) fileIcon = 'fa-file-excel';
            else if (['ppt', 'pptx'].includes(fileExt)) fileIcon = 'fa-file-powerpoint';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) fileIcon = 'fa-file-image';
            else if (['zip', 'rar'].includes(fileExt)) fileIcon = 'fa-file-archive';
            
            const fileHTML = `
                <div class="file-item" data-file-id="${file.id}" data-file-name="${file.name}">
                    <div class="file-icon">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-actions-menu" onclick="toggleFileActions(event, '${file.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="file-actions-dropdown" id="file-actions-${file.id}">
                        <div class="file-action-item" onclick="previewFile('${file.id}', '${file.name}', '${fileExt}')">
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
                </div>
            `;
            document.getElementById('fileManagerGrid').insertAdjacentHTML('beforeend', fileHTML);
        });
        
        showToast('Files uploaded successfully');
        setTimeout(() => {
            closeUploadModal();
            // Force reload of current folder to ensure consistency
            loadFolderContents(currentFolderId);
        }, 1000);
    } catch (error) {
        console.error('Error uploading files:', error);
        showToast('Failed to upload files', 'error');
        startUploadBtn.disabled = false;
    }
});

// Fix for New Folder button
document.getElementById('createFolderBtn').addEventListener('click', function() {
    document.getElementById('folderCreateModal').classList.add('show');
    document.getElementById('newFolderName').value = '';
    document.getElementById('newFolderName').focus();
});
loadFolderContents();
