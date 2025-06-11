document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  const uploadBtn = document.getElementById('upload-btn');
  const clearBtn = document.getElementById('clear-btn');
  const uploadActions = document.getElementById('upload-actions');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress');
  const progressText = document.getElementById('progress-text');
  const resultsContainer = document.getElementById('results-container');
  const resultList = document.getElementById('result-list');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const uploadMoreBtn = document.getElementById('upload-more-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // File storage
  let files = [];

  // Event Listeners
  dropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  dropArea.addEventListener('dragover', handleDragOver);
  dropArea.addEventListener('dragleave', handleDragLeave);
  dropArea.addEventListener('drop', handleDrop);
  uploadBtn.addEventListener('click', uploadFiles);
  clearBtn.addEventListener('click', clearFiles);
  copyAllBtn.addEventListener('click', copyAllLinks);
  uploadMoreBtn.addEventListener('click', resetUploadForm);

  // Drag and Drop Handlers
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('highlight');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('highlight');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('highlight');
    
    const dt = e.dataTransfer;
    const newFiles = dt.files;
    
    if (newFiles.length > 0) {
      handleFiles(newFiles);
    }
  }

  // File Selection Handler
  function handleFileSelect(e) {
    const newFiles = e.target.files;
    if (newFiles.length > 0) {
      handleFiles(newFiles);
    }
  }

  // Process Files
  function handleFiles(newFiles) {
    for (const file of newFiles) {
      // Kiểm tra nếu file đã tồn tại trong danh sách
      if (!files.some(f => f.name === file.name && f.size === file.size)) {
        files.push(file);
        addFileToList(file);
      }
    }
    
    if (files.length > 0) {
      uploadActions.classList.remove('hidden');
    }
  }

  // Add File to List
  function addFileToList(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    // Xác định icon cho loại file
    const fileIcon = getFileIcon(file.name);
    
    // Format file size
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
      <div class="file-icon"><i class="${fileIcon}"></i></div>
      <div class="file-details">
        <div class="file-name">${file.name}</div>
        <div class="file-meta">${fileSize}</div>
      </div>
      <div class="file-remove" data-name="${file.name}"><i class="fas fa-times"></i></div>
    `;
    
    fileList.appendChild(fileItem);
    
    // Add remove event
    fileItem.querySelector('.file-remove').addEventListener('click', function() {
      const fileName = this.getAttribute('data-name');
      removeFile(fileName);
    });
  }

  // Remove File
  function removeFile(fileName) {
    files = files.filter(file => file.name !== fileName);
    renderFileList();
    
    if (files.length === 0) {
      uploadActions.classList.add('hidden');
    }
  }

  // Re-render File List
  function renderFileList() {
    fileList.innerHTML = '';
    files.forEach(file => addFileToList(file));
  }

  // Clear All Files
  function clearFiles() {
    files = [];
    fileList.innerHTML = '';
    uploadActions.classList.add('hidden');
  }

  // Upload Files
  function uploadFiles() {
    if (files.length === 0) return;
    
    // Hiển thị progress
    uploadActions.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Tạo upload request
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percentComplete + '%';
        progressText.textContent = `Đang tải lên... ${percentComplete}%`;
      }
    });
    
    xhr.addEventListener('load', function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          showResults(response.files);
        } else {
          showError('Lỗi khi tải lên: ' + response.message);
        }
      } else {
        showError('Lỗi máy chủ: ' + xhr.status);
      }
    });
    
    xhr.addEventListener('error', function() {
      showError('Lỗi kết nối đến máy chủ');
    });
    
    xhr.open('POST', '/upload', true);
    xhr.send(formData);
  }

  // Show Upload Results
  function showResults(uploadedFiles) {
    progressContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultList.innerHTML = '';
    
    uploadedFiles.forEach(file => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      const fileIcon = getFileIcon(file.originalName);
      
      resultItem.innerHTML = `
        <div class="file-icon"><i class="${fileIcon}"></i></div>
        <div class="result-details">
          <div class="result-name">${file.originalName}</div>
          <div class="result-url">${file.url}</div>
          <div class="result-meta">${formatFileSize(file.size)}</div>
        </div>
        <div class="result-actions">
          <div class="result-icon copy-link" data-url="${file.url}" title="Sao chép đường dẫn">
            <i class="fas fa-link"></i>
          </div>
          <div class="result-icon open-link" data-url="${file.url}" title="Mở liên kết">
            <i class="fas fa-external-link-alt"></i>
          </div>
        </div>
      `;
      
      resultList.appendChild(resultItem);
    });
    
    // Add event listeners to copy and open buttons
    document.querySelectorAll('.copy-link').forEach(button => {
      button.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        copyToClipboard(url);
        showToast('Đã sao chép đường dẫn!');
      });
    });
    
    document.querySelectorAll('.open-link').forEach(button => {
      button.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        window.open(url, '_blank');
      });
    });
  }

  // Copy All Links
  function copyAllLinks() {
    const links = Array.from(document.querySelectorAll('.result-url'))
      .map(el => el.textContent)
      .join('\n');
    
    copyToClipboard(links);
    showToast('Đã sao chép tất cả đường dẫn!');
  }

  // Reset Upload Form
  function resetUploadForm() {
    resultsContainer.classList.add('hidden');
    files = [];
    fileList.innerHTML = '';
    fileInput.value = '';
  }

  // Show Error
  function showError(message) {
    progressContainer.classList.add('hidden');
    uploadActions.classList.remove('hidden');
    showToast(message, 'error');
  }

  // Helper Functions
  function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Mapping file extensions to Font Awesome icons
    const iconMap = {
      // Văn bản
      'txt': 'fas fa-file-alt',
      'doc': 'fas fa-file-word',
      'docx': 'fas fa-file-word',
      'odt': 'fas fa-file-alt',
      'pdf': 'fas fa-file-pdf',
      'rtf': 'fas fa-file-alt',
      
      // Bảng tính
      'xls': 'fas fa-file-excel',
      'xlsx': 'fas fa-file-excel',
      'csv': 'fas fa-file-csv',
      'ods': 'fas fa-file-excel',
      
      // Thuyết trình
      'ppt': 'fas fa-file-powerpoint',
      'pptx': 'fas fa-file-powerpoint',
      'odp': 'fas fa-file-powerpoint',
      
      // Hình ảnh
      'jpg': 'fas fa-file-image',
      'jpeg': 'fas fa-file-image',
      'png': 'fas fa-file-image',
      'gif': 'fas fa-file-image',
      'bmp': 'fas fa-file-image',
      'svg': 'fas fa-file-image',
      
      // Âm thanh
      'mp3': 'fas fa-file-audio',
      'wav': 'fas fa-file-audio',
      'flac': 'fas fa-file-audio',
      'aac': 'fas fa-file-audio',
      
      // Video
      'mp4': 'fas fa-file-video',
      'avi': 'fas fa-file-video',
      'mkv': 'fas fa-file-video',
      'mov': 'fas fa-file-video',
      
      // Nén
      'zip': 'fas fa-file-archive',
      'rar': 'fas fa-file-archive',
      '7z': 'fas fa-file-archive',
      'tar': 'fas fa-file-archive',
      'gz': 'fas fa-file-archive',
      
      // Mã nguồn
      'html': 'fas fa-file-code',
      'css': 'fas fa-file-code',
      'js': 'fas fa-file-code',
      'py': 'fas fa-file-code',
      'java': 'fas fa-file-code',
      'c': 'fas fa-file-code',
      'cpp': 'fas fa-file-code',
      'php': 'fas fa-file-code',
      'json': 'fas fa-file-code',
      'xml': 'fas fa-file-code',
      
      // Hệ thống
      'exe': 'fas fa-file-code',
      'bat': 'fas fa-file-code',
      'sh': 'fas fa-file-code',
      'dll': 'fas fa-file-code',
      'sys': 'fas fa-file-code',
    };
    
    return iconMap[extension] || 'fas fa-file';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Add appropriate icon based on type
    if (type === 'error') {
      toast.querySelector('i').className = 'fas fa-exclamation-circle';
      toast.style.backgroundColor = '#dc3545';
    } else {
      toast.querySelector('i').className = 'fas fa-check-circle';
      toast.style.backgroundColor = '#343a40';
    }
    
    toast.classList.remove('hidden');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
});