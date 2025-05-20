// fundraisingDocuments.js - Comprehensive File Manager for Fundraising Documents

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentPath = [];
    let currentFolderId = 'root';
    let filesToUpload = [];
    let uploadProgress = 0;
    
    // DOM elements
    const fileManagerContent = document.getElementById('fileManagerContent');
    const breadcrumb = document.getElementById('breadcrumb');
    const fileManagerGrid = document.getElementById('fileManagerGrid');
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const uploadModal = document.getElementById('uploadModal');
    const folderCreateModal = document.getElementById('folderCreateModal');
    const filePreviewModal = document.getElementById('filePreviewModal');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const uploadArea = document.getElementById('uploadArea');
    const startUploadBtn = document.getElementById('startUploadBtn');
    const uploadProgressDiv = document.getElementById('uploadProgress');
    const progressBarFill = document.getElementById('progressBarFill');
    const newFolderNameInput = document.getElementById('newFolderName');
    const previewFileContent = document.getElementById('previewFileContent');
    const previewFileName = document.getElementById('previewFileName');
    
    // Initialize the file manager
    initFileManager();
    
    // Event listeners
    uploadFilesBtn.addEventListener('click', openUploadModal);
    createFolderBtn.addEventListener('click', openCreateFolderModal);
    fileUploadInput.addEventListener('change', handleFileSelection);
    startUploadBtn.addEventListener('click', startUpload);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Initialize with root folder
    loadFolderContents(currentFolderId);
    
    // Functions
    
    function initFileManager() {
        // Set up initial breadcrumb
        updateBreadcrumb();
    }
    
    function loadFolderContents(folderId) {
        currentFolderId = folderId || 'root';
        fileManagerGrid.innerHTML = '<div class="loading">Loading contents...</div>';
        
        fetch(`https://backend-jz65.onrender.com/folders/${currentFolderId}/contents`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load folder contents');
                }
                return response.json();
            })
            .then(data => {
                renderFolderContents(data);
                updateBreadcrumb();
            })
            .catch(error => {
                console.error('Error loading folder contents:', error);
                fileManagerGrid.innerHTML = '<div class="error">Failed to load folder contents</div>';
            });
    }
    
    function renderFolderContents(contents) {
        fileManagerGrid.innerHTML = '';
        
        // Add folders first
        contents.folders.forEach(folder => {
            const folderElement = createFolderElement(folder);
            fileManagerGrid.appendChild(folderElement);
        });
        
        // Then add files
        contents.files.forEach(file => {
            const fileElement = createFileElement(file);
            fileManagerGrid.appendChild(fileElement);
        });
        
        if (contents.folders.length === 0 && contents.files.length === 0) {
            fileManagerGrid.innerHTML = '<div class="empty-folder">This folder is empty</div>';
        }
    }
    
    function createFolderElement(folder) {
        const folderElement = document.createElement('div');
        folderElement.className = 'folder-item';
        folderElement.setAttribute('data-folder-id', folder.id);
        folderElement.setAttribute('data-folder-name', folder.name);
        
        folderElement.innerHTML = `
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
        
        folderElement.addEventListener('click', () => {
            navigateToFolder(folder.id, folder.name);
        });
        
        return folderElement;
    }
    
    function createFileElement(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.setAttribute('data-file-id', file.id);
        fileElement.setAttribute('data-file-name', file.name);
        
        // Get file icon based on type
        const fileIcon = getFileIcon(file.type, file.name);
        
        fileElement.innerHTML = `
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
        
        return fileElement;
    }
    
    function getFileIcon(fileType, fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Check by file type first
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fa-file-powerpoint';
        if (fileType.includes('image')) return 'fa-file-image';
        if (fileType.includes('audio')) return 'fa-file-audio';
        if (fileType.includes('video')) return 'fa-file-video';
        if (fileType.includes('zip') || fileType.includes('compressed')) return 'fa-file-archive';
        
        // Check by file extension
        if (['doc', 'docx'].includes(extension)) return 'fa-file-word';
        if (['xls', 'xlsx'].includes(extension)) return 'fa-file-excel';
        if (['ppt', 'pptx'].includes(extension)) return 'fa-file-powerpoint';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) return 'fa-file-image';
        if (['mp3', 'wav', 'ogg'].includes(extension)) return 'fa-file-audio';
        if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'fa-file-video';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'fa-file-archive';
        if (['pdf'].includes(extension)) return 'fa-file-pdf';
        if (['txt', 'csv'].includes(extension)) return 'fa-file-alt';
        
        // Default file icon
        return 'fa-file';
    }
    
    function navigateToFolder(folderId, folderName) {
        currentPath.push({ id: folderId, name: folderName });
        loadFolderContents(folderId);
    }
    
    function updateBreadcrumb() {
        breadcrumb.innerHTML = '';
        
        // Always include root
        const rootItem = document.createElement('span');
        rootItem.className = 'breadcrumb-item';
        rootItem.textContent = 'Fundraising Documents';
        rootItem.addEventListener('click', () => {
            currentPath = [];
            loadFolderContents('root');
        });
        breadcrumb.appendChild(rootItem);
        
        // Add current path items
        currentPath.forEach((item, index) => {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = ' / ';
            breadcrumb.appendChild(separator);
            
            const crumbItem = document.createElement('span');
            crumbItem.className = 'breadcrumb-item';
            crumbItem.textContent = item.name;
            crumbItem.addEventListener('click', () => {
                currentPath = currentPath.slice(0, index + 1);
                loadFolderContents(item.id);
            });
            breadcrumb.appendChild(crumbItem);
        });
    }
    
    function openUploadModal() {
        filesToUpload = [];
        uploadProgress = 0;
        progressBarFill.style.width = '0%';
        uploadProgressDiv.style.display = 'none';
        startUploadBtn.disabled = true;
        fileUploadInput.value = '';
        uploadModal.classList.add('show');
    }
    
    function closeUploadModal() {
        uploadModal.classList.remove('show');
    }
    
    function handleFileSelection(event) {
        filesToUpload = Array.from(event.target.files);
        updateUploadButton();
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.style.borderColor = '#3498db';
        uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = '';
    }
    
    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = '';
        
        if (event.dataTransfer.files.length > 0) {
            filesToUpload = Array.from(event.dataTransfer.files);
            updateUploadButton();
        }
    }
    
    function updateUploadButton() {
        if (filesToUpload.length > 0) {
            startUploadBtn.disabled = false;
        } else {
            startUploadBtn.disabled = true;
        }
    }
    
    function startUpload() {
        if (filesToUpload.length === 0) return;
        
        uploadProgressDiv.style.display = 'block';
        startUploadBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('folder_id', currentFolderId);
        
        filesToUpload.forEach(file => {
            formData.append('files', file);
        });
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', function(event) {
            if (event.lengthComputable) {
                uploadProgress = Math.round((event.loaded / event.total) * 100);
                progressBarFill.style.width = uploadProgress + '%';
            }
        });
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    alert('Files uploaded successfully!');
                    closeUploadModal();
                    loadFolderContents(currentFolderId);
                } else {
                    console.error('Upload failed:', xhr.statusText);
                    alert('Failed to upload files. Please try again.');
                    startUploadBtn.disabled = false;
                }
            }
        };
        
        xhr.open('POST', 'https://backend-jz65.onrender.com/upload/', true);
        xhr.send(formData);
    }
    
    function openCreateFolderModal() {
        newFolderNameInput.value = '';
        folderCreateModal.classList.add('show');
    }
    
    function closeCreateFolderModal() {
        folderCreateModal.classList.remove('show');
    }
    
    function createNewFolder() {
        const folderName = newFolderNameInput.value.trim();
        
        if (!folderName) {
            alert('Please enter a folder name');
            return;
        }
        
        fetch('https://backend-jz65.onrender.com/folders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: folderName,
                parent_id: currentFolderId === 'root' ? null : currentFolderId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create folder');
            }
            return response.json();
        })
        .then(data => {
            closeCreateFolderModal();
            loadFolderContents(currentFolderId);
        })
        .catch(error => {
            console.error('Error creating folder:', error);
            alert('Failed to create folder. Please try again.');
        });
    }
    
    function previewFile(fileId, fileName, fileType) {
        currentFileId = fileId;
        currentFileName = fileName;
        currentFileType = fileType;
        
        previewFileName.textContent = fileName;
        previewFileContent.innerHTML = '<div class="loading">Loading preview...</div>';
        
        // For images and PDFs, we can display them directly
        if (fileType.includes('image') || fileType.includes('pdf')) {
            fetch(`https://backend-jz65.onrender.com/files/${fileId}/preview`, {
                headers: {
                    'Accept': fileType
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load file');
                }
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                
                if (fileType.includes('image')) {
                    previewFileContent.innerHTML = `
                        <img src="${url}" alt="${fileName}" class="file-preview-image">
                    `;
                } else if (fileType.includes('pdf')) {
                    previewFileContent.innerHTML = `
                        <iframe src="${url}" class="file-preview-iframe"></iframe>
                    `;
                }
                
                filePreviewModal.classList.add('show');
            })
            .catch(error => {
                console.error('Error previewing file:', error);
                previewFileContent.innerHTML = '<div class="error">Failed to load preview</div>';
            });
        } else {
            // For other file types, show a message with download option
            previewFileContent.innerHTML = `
                <div class="no-preview">
                    <i class="fas fa-file-download"></i>
                    <p>Preview not available for this file type.</p>
                    <p>Please download the file to view it.</p>
                </div>
            `;
            filePreviewModal.classList.add('show');
        }
    }
    
    function closePreview() {
        filePreviewModal.classList.remove('show');
        
        // Clean up any object URLs
        const iframe = previewFileContent.querySelector('iframe');
        const img = previewFileContent.querySelector('img');
        
        if (iframe && iframe.src) {
            URL.revokeObjectURL(iframe.src);
        }
        if (img && img.src) {
            URL.revokeObjectURL(img.src);
        }
    }
    
    function downloadFile(fileId, fileName) {
        fetch(`https://backend-jz65.onrender.com/files/${fileId}/download`, {
            headers: {
                'Accept': 'application/octet-stream'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to download file');
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading file:', error);
            alert('Failed to download file. Please try again.');
        });
    }
    
    function downloadCurrentFile() {
        if (currentFileId && currentFileName) {
            downloadFile(currentFileId, currentFileName);
        }
    }
    
    function renameFile(fileId, currentName) {
        const newName = prompt('Enter new file name:', currentName);
        
        if (newName && newName !== currentName) {
            fetch(`https://backend-jz65.onrender.com/files/${fileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newName
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to rename file');
                }
                return response.json();
            })
            .then(data => {
                loadFolderContents(currentFolderId);
            })
            .catch(error => {
                console.error('Error renaming file:', error);
                alert('Failed to rename file. Please try again.');
            });
        }
    }
    
    function deleteFile(fileId, fileName) {
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            fetch(`https://backend-jz65.onrender.com/files/${fileId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete file');
                }
                return response.json();
            })
            .then(data => {
                loadFolderContents(currentFolderId);
            })
            .catch(error => {
                console.error('Error deleting file:', error);
                alert('Failed to delete file. Please try again.');
            });
        }
    }
    
    function renameFolder(folderId, currentName) {
        const newName = prompt('Enter new folder name:', currentName);
        
        if (newName && newName !== currentName) {
            fetch(`https://backend-jz65.onrender.com/folders/${folderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newName
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to rename folder');
                }
                return response.json();
            })
            .then(data => {
                loadFolderContents(currentFolderId);
            })
            .catch(error => {
                console.error('Error renaming folder:', error);
                alert('Failed to rename folder. Please try again.');
            });
        }
    }
    
    function deleteFolder(folderId) {
        if (confirm('Are you sure you want to delete this folder and all its contents?')) {
            fetch(`https://backend-jz65.onrender.com/folders/${folderId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete folder');
                }
                return response.json();
            })
            .then(data => {
                // If we deleted the current folder, go up one level
                if (folderId === currentFolderId) {
                    if (currentPath.length > 0) {
                        currentPath.pop();
                        const parentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : 'root';
                        loadFolderContents(parentFolderId);
                    } else {
                        loadFolderContents('root');
                    }
                } else {
                    // Otherwise just refresh current view
                    loadFolderContents(currentFolderId);
                }
            })
            .catch(error => {
                console.error('Error deleting folder:', error);
                alert('Failed to delete folder. Please try again.');
            });
        }
    }
    
    function toggleFileActions(event, fileId) {
        event.stopPropagation();
        const dropdown = document.getElementById(`file-actions-${fileId}`);
        dropdown.classList.toggle('show');
        
        // Close other dropdowns
        document.querySelectorAll('.file-actions-dropdown').forEach(d => {
            if (d.id !== `file-actions-${fileId}`) {
                d.classList.remove('show');
            }
        });
    }
    
    function toggleFolderActions(event, folderId) {
        event.stopPropagation();
        const dropdown = document.getElementById(`folder-actions-${folderId}`);
        dropdown.classList.toggle('show');
        
        // Close other dropdowns
        document.querySelectorAll('.file-actions-dropdown').forEach(d => {
            if (d.id !== `folder-actions-${folderId}`) {
                d.classList.remove('show');
            }
        });
    }
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', function() {
        document.querySelectorAll('.file-actions-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });
});

// Global functions for inline event handlers
function toggleFileActions(event, fileId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`file-actions-${fileId}`);
    dropdown.classList.toggle('show');
    
    // Close other dropdowns
    document.querySelectorAll('.file-actions-dropdown').forEach(d => {
        if (d.id !== `file-actions-${fileId}`) {
            d.classList.remove('show');
        }
    });
}

function toggleFolderActions(event, folderId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`folder-actions-${folderId}`);
    dropdown.classList.toggle('show');
    
    // Close other dropdowns
    document.querySelectorAll('.file-actions-dropdown').forEach(d => {
        if (d.id !== `folder-actions-${folderId}`) {
            d.classList.remove('show');
        }
    });
}

function previewFile(fileId, fileName, fileType) {
    const filePreviewModal = document.getElementById('filePreviewModal');
    const previewFileContent = document.getElementById('previewFileContent');
    const previewFileName = document.getElementById('previewFileName');
    
    currentFileId = fileId;
    currentFileName = fileName;
    currentFileType = fileType;
    
    previewFileName.textContent = fileName;
    previewFileContent.innerHTML = '<div class="loading">Loading preview...</div>';
    
    // For images and PDFs, we can display them directly
    if (fileType.includes('image') || fileType.includes('pdf')) {
        fetch(`https://backend-jz65.onrender.com/files/${fileId}/preview`, {
            headers: {
                'Accept': fileType
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load file');
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            
            if (fileType.includes('image')) {
                previewFileContent.innerHTML = `
                    <img src="${url}" alt="${fileName}" class="file-preview-image">
                `;
            } else if (fileType.includes('pdf')) {
                previewFileContent.innerHTML = `
                    <iframe src="${url}" class="file-preview-iframe"></iframe>
                `;
            }
            
            filePreviewModal.classList.add('show');
        })
        .catch(error => {
            console.error('Error previewing file:', error);
            previewFileContent.innerHTML = '<div class="error">Failed to load preview</div>';
        });
    } else {
        // For other file types, show a message with download option
        previewFileContent.innerHTML = `
            <div class="no-preview">
                <i class="fas fa-file-download"></i>
                <p>Preview not available for this file type.</p>
                <p>Please download the file to view it.</p>
            </div>
        `;
        filePreviewModal.classList.add('show');
    }
}

function closePreview() {
    const filePreviewModal = document.getElementById('filePreviewModal');
    const previewFileContent = document.getElementById('previewFileContent');
    
    filePreviewModal.classList.remove('show');
    
    // Clean up any object URLs
    const iframe = previewFileContent.querySelector('iframe');
    const img = previewFileContent.querySelector('img');
    
    if (iframe && iframe.src) {
        URL.revokeObjectURL(iframe.src);
    }
    if (img && img.src) {
        URL.revokeObjectURL(img.src);
    }
}

function downloadFile(fileId, fileName) {
    fetch(`https://backend-jz65.onrender.com/files/${fileId}/download`, {
        headers: {
            'Accept': 'application/octet-stream'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to download file');
        }
        return response.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Error downloading file:', error);
        alert('Failed to download file. Please try again.');
    });
}

function downloadCurrentFile() {
    if (currentFileId && currentFileName) {
        downloadFile(currentFileId, currentFileName);
    }
}

function renameFile(fileId, currentName) {
    const newName = prompt('Enter new file name:', currentName);
    
    if (newName && newName !== currentName) {
        fetch(`https://backend-jz65.onrender.com/files/${fileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newName
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to rename file');
            }
            return response.json();
        })
        .then(data => {
            window.location.reload(); // Refresh the view
        })
        .catch(error => {
            console.error('Error renaming file:', error);
            alert('Failed to rename file. Please try again.');
        });
    }
}

function deleteFile(fileId, fileName) {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
        fetch(`https://backend-jz65.onrender.com/files/${fileId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete file');
            }
            return response.json();
        })
        .then(data => {
            window.location.reload(); // Refresh the view
        })
        .catch(error => {
            console.error('Error deleting file:', error);
            alert('Failed to delete file. Please try again.');
        });
    }
}

function renameFolder(folderId, currentName) {
    const newName = prompt('Enter new folder name:', currentName);
    
    if (newName && newName !== currentName) {
        fetch(`https://backend-jz65.onrender.com/folders/${folderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newName
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to rename folder');
            }
            return response.json();
        })
        .then(data => {
            window.location.reload(); // Refresh the view
        })
        .catch(error => {
            console.error('Error renaming folder:', error);
            alert('Failed to rename folder. Please try again.');
        });
    }
}

function deleteFolder(folderId) {
    if (confirm('Are you sure you want to delete this folder and all its contents?')) {
        fetch(`https://backend-jz65.onrender.com/folders/${folderId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete folder');
            }
            return response.json();
        })
        .then(data => {
            window.location.reload(); // Refresh the view
        })
        .catch(error => {
            console.error('Error deleting folder:', error);
            alert('Failed to delete folder. Please try again.');
        });
    }
}

function closeCreateFolderModal() {
    document.getElementById('folderCreateModal').classList.remove('show');
}

function createNewFolder() {
    const newFolderNameInput = document.getElementById('newFolderName');
    const folderName = newFolderNameInput.value.trim();
    const currentFolderId = document.querySelector('.file-manager-container').dataset.currentFolderId || 'root';
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    fetch('https://backend-jz65.onrender.com/folders/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: folderName,
            parent_id: currentFolderId === 'root' ? null : currentFolderId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create folder');
        }
        return response.json();
    })
    .then(data => {
        closeCreateFolderModal();
        window.location.reload(); // Refresh the view
    })
    .catch(error => {
        console.error('Error creating folder:', error);
        alert('Failed to create folder. Please try again.');
    });
}
