// Lấy phần tử DOM
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("toggle-password");
const loginError = document.getElementById("login-error");

// Hàm hiển thị thông báo lỗi
function showError(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
  loginError.classList.add("animate__animated", "animate__shakeX");

  // Xóa hiệu ứng sau khi hoàn thành
  setTimeout(() => {
    loginError.classList.remove("animate__shakeX");
  }, 1000);
}

// Hàm ẩn thông báo lỗi
function hideError() {
  loginError.style.display = "none";
  loginError.classList.remove("animate__shakeX");
}

// Hàm xử lý đăng nhập
async function handleLogin(event) {
  event.preventDefault();

  // Lấy giá trị từ form
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Kiểm tra trường trống
  if (!username || !password) {
    showError("Vui lòng nhập tên đăng nhập và mật khẩu");
    return;
  }

  try {
    // Đổi trạng thái nút đăng nhập
    const loginBtn = loginForm.querySelector(".login-btn");
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
    loginBtn.disabled = true;

    // Gọi API đăng nhập
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    // Xử lý đăng nhập thất bại
    if (!response.ok) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
    }

    // Đăng nhập thành công, chuyển hướng
    window.location.href = "/kzkhanhh";
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    showError(error.message);

    // Khôi phục nút đăng nhập
    const loginBtn = loginForm.querySelector(".login-btn");
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
    loginBtn.disabled = false;
  }
}

// Hàm hiển thị/ẩn mật khẩu
function togglePasswordVisibility() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// Đăng ký sự kiện
window.addEventListener("DOMContentLoaded", () => {
  // Đăng ký sự kiện submit form
  loginForm.addEventListener("submit", handleLogin);

  // Đăng ký sự kiện hiển thị/ẩn mật khẩu
  togglePasswordBtn.addEventListener("click", togglePasswordVisibility);

  // Ẩn thông báo lỗi khi người dùng bắt đầu nhập
  usernameInput.addEventListener("input", hideError);
  passwordInput.addEventListener("input", hideError);

  // Focus vào ô username
  usernameInput.focus();
});
