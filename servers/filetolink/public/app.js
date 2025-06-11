document.addEventListener("DOMContentLoaded", function () {
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("file-input");
  const selectFileBtn = document.getElementById("select-file-btn");
  const uploadProgress = document.getElementById("upload-progress");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const uploadResult = document.getElementById("upload-result");
  const fileUrl = document.getElementById("file-url");
  const copyBtn = document.getElementById("copy-btn");
  const viewBtn = document.getElementById("view-btn");
  const uploadAnotherBtn = document.getElementById("upload-another-btn");
  const fileInfo = document.getElementById("file-info");

  // Xử lý sự kiện chọn file
  selectFileBtn.addEventListener("click", () => {
    fileInput.click();
  });

  // Xử lý sự kiện kéo và thả
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.add("active");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.remove("active");
    });
  });

  dropArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      uploadFile(files[0]);
    }
  });

  // Xử lý sự kiện khi chọn file
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      uploadFile(fileInput.files[0]);
    }
  });

  // Hàm upload file
  function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    // Hiển thị thanh tiến trình
    dropArea.style.display = "none";
    uploadProgress.style.display = "block";
    uploadResult.style.display = "none";

    const xhr = new XMLHttpRequest();

    // Xử lý sự kiện tiến trình
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percentComplete + "%";
        progressText.textContent = `Đang tải lên... ${percentComplete}%`;
      }
    });

    // Xử lý sự kiện hoàn thành
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);

        // Hiển thị kết quả
        uploadProgress.style.display = "none";
        uploadResult.style.display = "block";

        // Thiết lập URL
        fileUrl.value = response.fullUrl;
        viewBtn.href = response.url;

        // Hiển thị thông tin file
        displayFileInfo(response);
      } else {
        handleUploadError(xhr);
      }
    });

    // Xử lý sự kiện lỗi
    xhr.addEventListener("error", () => {
      handleUploadError(xhr);
    });

    // Gửi request
    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  }

  // Hàm xử lý lỗi
  function handleUploadError(xhr) {
    let errorMessage = "Đã xảy ra lỗi khi tải lên file";

    if (xhr.responseText) {
      try {
        const response = JSON.parse(xhr.responseText);
        errorMessage = response.error || errorMessage;
      } catch (e) {
        console.error("Không thể phân tích phản hồi:", e);
      }
    }

    uploadProgress.style.display = "none";
    dropArea.style.display = "block";
    alert(errorMessage);
  }

  // Hàm hiển thị thông tin file
  function displayFileInfo(fileData) {
    const fileSize = formatFileSize(fileData.fileSize);
    const fileTypeIcon = getFileTypeIcon(fileData.fileType);

    fileInfo.innerHTML = `
        <p>Tên file: <span>${fileData.fileName}</span></p>
        <p>Loại file: <span>${fileTypeIcon} ${fileData.fileType}</span></p>
        <p>Kích thước: <span>${fileSize}</span></p>
      `;
  }

  // Hàm định dạng kích thước file
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Hàm lấy icon cho loại file
  function getFileTypeIcon(mimeType) {
    let icon = '<i class="fas fa-file"></i>';

    if (mimeType.startsWith("image/")) {
      icon = '<i class="fas fa-file-image"></i>';
    } else if (mimeType.startsWith("video/")) {
      icon = '<i class="fas fa-file-video"></i>';
    } else if (mimeType.startsWith("audio/")) {
      icon = '<i class="fas fa-file-audio"></i>';
    } else if (mimeType === "application/pdf") {
      icon = '<i class="fas fa-file-pdf"></i>';
    } else if (
      mimeType.includes("word") ||
      mimeType === "application/rtf" ||
      mimeType === "text/plain"
    ) {
      icon = '<i class="fas fa-file-word"></i>';
    } else if (mimeType.includes("excel") || mimeType === "text/csv") {
      icon = '<i class="fas fa-file-excel"></i>';
    } else if (mimeType.includes("powerpoint")) {
      icon = '<i class="fas fa-file-powerpoint"></i>';
    } else if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar") ||
      mimeType.includes("7z")
    ) {
      icon = '<i class="fas fa-file-archive"></i>';
    } else if (
      mimeType.includes("html") ||
      mimeType.includes("javascript") ||
      mimeType.includes("css") ||
      mimeType.includes("json")
    ) {
      icon = '<i class="fas fa-file-code"></i>';
    }

    return icon;
  }

  // Xử lý sự kiện sao chép URL
  copyBtn.addEventListener("click", () => {
    fileUrl.select();
    document.execCommand("copy");

    // Hiển thị thông báo
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Đã sao chép';

    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });

  // Xử lý sự kiện tải lên file khác
  uploadAnotherBtn.addEventListener("click", () => {
    // Reset form
    fileInput.value = "";
    uploadResult.style.display = "none";
    dropArea.style.display = "block";
    progressBar.style.width = "0%";
  });
});
