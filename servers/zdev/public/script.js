// Global variables
let currentUser = null;
let apps = [];

// DOM elements
const loadingScreen = document.getElementById("loadingScreen");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const userMenu = document.getElementById("userMenu");
const username = document.getElementById("username");
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const appModal = document.getElementById("appModal");
const toastContainer = document.getElementById("toastContainer");

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  // Hide loading screen after 2 seconds
  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }, 2000);

  // Check if user is logged in
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (token && userData) {
    currentUser = JSON.parse(userData);
    updateAuthUI();
  }

  // Load apps
  loadApps();

  // Setup event listeners
  setupEventListeners();

  // Setup animations
  setupAnimations();
});

// Event listeners setup
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = this.getAttribute("href").substring(1);
      scrollToSection(target);

      // Update active nav link
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Auth buttons
  loginBtn.addEventListener("click", () => openModal("loginModal"));
  registerBtn.addEventListener("click", () => openModal("registerModal"));

  // Modal close buttons
  document.querySelectorAll(".close").forEach((btn) => {
    btn.addEventListener("click", function () {
      closeModal(this.closest(".modal").id);
    });
  });

  // Click outside modal to close
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });

  // Forms
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document
    .getElementById("registerForm")
    .addEventListener("submit", handleRegister);

  // User menu
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("myAppsBtn").addEventListener("click", showMyApps);

  // Search and filter
  document.getElementById("searchInput").addEventListener("input", filterApps);
  document
    .getElementById("categoryFilter")
    .addEventListener("change", filterApps);

  // Smooth scrolling for CTA button
  document.querySelector(".cta-button").addEventListener("click", function () {
    scrollToSection("apps");
  });
}

// Authentication functions
async function handleLogin(e) {
  e.preventDefault();

  const loginData = {
    username: document.getElementById("loginUsername").value,
    password: document.getElementById("loginPassword").value,
  };

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;

      closeModal("loginModal");
      updateAuthUI();
      showToast("Đăng nhập thành công!", "success");
      document.getElementById("loginForm").reset();
    } else {
      showToast(data.error || "Đăng nhập thất bại!", "error");
    }
  } catch (error) {
    showToast("Lỗi kết nối!", "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const registerData = {
    username: document.getElementById("regUsername").value,
    email: document.getElementById("regEmail").value,
    password: document.getElementById("regPassword").value,
  };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal("registerModal");
      showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
      document.getElementById("registerForm").reset();
      openModal("loginModal");
    } else {
      showToast(data.error || "Đăng ký thất bại!", "error");
    }
  } catch (error) {
    showToast("Lỗi kết nối!", "error");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  updateAuthUI();
  showToast("Đã đăng xuất!", "info");
}

function updateAuthUI() {
  if (currentUser) {
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    userMenu.style.display = "flex";
    username.textContent = currentUser.username;

    // Show admin button if user is admin
    if (currentUser.role === "admin") {
      document.getElementById("adminBtn").style.display = "block";
    }
  } else {
    loginBtn.style.display = "block";
    registerBtn.style.display = "block";
    userMenu.style.display = "none";
    document.getElementById("adminBtn").style.display = "none";
  }
}

// Apps functions
async function loadApps() {
  try {
    const response = await fetch("/api/apps");
    const data = await response.json();

    if (response.ok) {
      apps = data;
      displayApps(apps);
      updateStats();
    } else {
      showToast("Không thể tải danh sách ứng dụng!", "error");
    }
  } catch (error) {
    showToast("Lỗi kết nối!", "error");
  }
}

function displayApps(appsToShow) {
  const appsGrid = document.getElementById("appsGrid");

  if (appsToShow.length === 0) {
    appsGrid.innerHTML = `
            <div class="no-apps">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy ứng dụng nào</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
        `;
    return;
  }

  appsGrid.innerHTML = appsToShow
    .map(
      (app) => `
        <div class="app-card" data-aos="fade-up">
            <div class="app-icon">
                <i class="fas fa-mobile-alt"></i>
            </div>
            <div class="app-info">
                <h3 class="app-name">${app.name}</h3>
                <p class="app-description">${app.description.substring(
                  0,
                  100
                )}${app.description.length > 100 ? "..." : ""}</p>
                <div class="app-meta">
                    <span class="app-category">${app.category}</span>
                    <span class="app-downloads"><i class="fas fa-download"></i> ${
                      app.downloads || 0
                    }</span>
                </div>
                <div class="app-actions">
                    <button class="btn-primary" onclick="showAppDetail('${
                      app.id
                    }')">
                        <i class="fas fa-info-circle"></i> Chi tiết
                    </button>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function showAppDetail(appId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  document.getElementById("appTitle").textContent = app.name;
  document.getElementById("appCategory").textContent = app.category;
  document.getElementById("appAuthor").textContent = app.author;
  document.getElementById("appDownloads").textContent = app.downloads || 0;
  document.getElementById("appVersion").textContent = app.version;
  document.getElementById("appDescription").textContent = app.description;

  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.onclick = () => downloadApp(app.id);

  openModal("appModal");
}

async function downloadApp(appId) {
  try {
    showToast("Đang chuẩn bị tải xuống...", "info");

    const response = await fetch(`/api/download/${appId}`);

    if (response.ok) {
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("Tải xuống thành công!", "success");
      closeModal("appModal");

      // Refresh apps to update download count
      setTimeout(() => loadApps(), 1000);
    } else {
      const errorData = await response.json();
      showToast(errorData.error || "Tải xuống thất bại!", "error");
    }
  } catch (error) {
    showToast("Lỗi kết nối!", "error");
  }
}

function filterApps() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const selectedCategory = document.getElementById("categoryFilter").value;

  let filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm) ||
      app.description.toLowerCase().includes(searchTerm) ||
      app.author.toLowerCase().includes(searchTerm);

    const matchesCategory =
      !selectedCategory || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  displayApps(filteredApps);
}

async function showMyApps() {
  if (!currentUser) {
    showToast("Vui lòng đăng nhập!", "warning");
    return;
  }

  try {
    const response = await fetch("/api/apps/user", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      displayUserApps(data);
    } else {
      showToast(data.error || "Không thể tải ứng dụng của bạn!", "error");
    }
  } catch (error) {
    showToast("Lỗi kết nối!", "error");
  }
}

function displayUserApps(userApps) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Ứng dụng của tôi</h2>
            <div class="user-apps-list">
                ${
                  userApps.length === 0
                    ? '<p class="no-apps-text">Bạn chưa đăng tải ứng dụng nào.</p>'
                    : userApps
                        .map(
                          (app) => `
                        <div class="user-app-item">
                            <div class="app-info">
                                <h4>${app.name}</h4>
                                <p>${app.description.substring(0, 80)}${
                            app.description.length > 80 ? "..." : ""
                          }</p>
                                <div class="app-status status-${app.status}">
                                    <i class="fas fa-circle"></i>
                                    ${
                                      app.status === "pending"
                                        ? "Chờ duyệt"
                                        : app.status === "approved"
                                        ? "Đã duyệt"
                                        : "Bị từ chối"
                                    }
                                </div>
                            </div>
                            <div class="app-actions">
                                <button class="btn-secondary btn-sm" onclick="editApp('${
                                  app.id
                                }')">
                                    <i class="fas fa-edit"></i> Sửa
                                </button>
                                <button class="btn-danger btn-sm" onclick="deleteApp('${
                                  app.id
                                }')">
                                    <i class="fas fa-trash"></i> Xóa
                                </button>
                            </div>
                        </div>
                    `
                        )
                        .join("")
                }
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  modal.style.display = "block";

  // Close modal
  modal.querySelector(".close").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

async function deleteApp(appId) {
  if (!confirm("Bạn có chắc chắn muốn xóa ứng dụng này?")) {
    return;
  }

  try {
    const response = await fetch(`/api/apps/${appId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Xóa ứng dụng thành công!", "success");
      showMyApps(); // Refresh the list
      loadApps(); // Refresh main apps list
    } else {
      showToast(data.error || "Xóa ứng dụng thất bại!", "error");
    }
  } catch (error) {
    showToast("Lỗi kết nối!", "error");
  }
}

function updateStats() {
  const totalApps = apps.length;
  const totalDownloads = apps.reduce(
    (sum, app) => sum + (app.downloads || 0),
    0
  );

  animateNumber("totalApps", totalApps);
  animateNumber("totalDownloads", totalDownloads);
}

function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const startValue = 0;
  const duration = 2000;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(
      startValue + (targetValue - startValue) * progress
    );

    element.textContent = currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }

  requestAnimationFrame(updateNumber);
}

// Utility functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "block";
  setTimeout(() => modal.classList.add("show"), 10);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("show");
  setTimeout(() => (modal.style.display = "none"), 300);
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    const offsetTop = element.offsetTop - 70; // Account for fixed navbar
    window.scrollTo({
      top: offsetTop,
      behavior: "smooth",
    });
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : type === "warning"
      ? "exclamation-triangle"
      : "info-circle";

  toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

  toastContainer.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add("show"), 10);

  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toastContainer.removeChild(toast), 300);
  }, 4000);
}

// Animations setup
function setupAnimations() {
  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(10, 10, 10, 0.95)";
    } else {
      navbar.style.background = "rgba(10, 10, 10, 0.9)";
    }
  });

  // Parallax effect for hero section
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  });

  // Floating elements animation
  const floatingElements = document.querySelectorAll(
    ".floating-elements .element"
  );
  floatingElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 2}s`;
  });
}

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe all app cards
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const appCards = document.querySelectorAll(".app-card");
    appCards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
      card.style.transition = "all 0.6s ease";
      observer.observe(card);
    });
  }, 100);
});
