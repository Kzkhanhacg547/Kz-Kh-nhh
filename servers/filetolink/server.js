const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 2007;

// Cấu hình session
app.use(
  session({
    secret: "file-uploader-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Đặt true nếu sử dụng HTTPS
  })
);

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// Đảm bảo thư mục tồn tại
const dataDir = path.join(__dirname, "data");
const uploadsDbPath = path.join(dataDir, "uploads.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(uploadsDbPath)) {
  fs.writeFileSync(uploadsDbPath, JSON.stringify([]));
}

// Hàm tạo mã ngẫu nhiên độ dài 10 ký tự
function generateUniqueCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Cấu hình multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn 100MB
});

// Middleware kiểm tra đăng nhập cho trang admin
function requireLogin(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect("/kzkhanhh/login");
  }
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/kzkhanhh/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// API tải lên file
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không có file nào được tải lên" });
    }

    // Đọc dữ liệu base64 từ file
    const fileData = req.file.buffer.toString("base64");
    const fileType = req.file.mimetype;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    // Tạo mã duy nhất cho file
    const uniqueCode = generateUniqueCode();

    // Lưu thông tin file
    const fileInfo = {
      id: uniqueCode,
      name: fileName,
      type: fileType,
      size: fileSize,
      data: fileData,
      uploadDate: new Date().toISOString(),
    };

    // Đọc database hiện tại
    const uploads = JSON.parse(fs.readFileSync(uploadsDbPath));

    // Thêm file mới
    uploads.push(fileInfo);

    // Lưu lại vào file
    fs.writeFileSync(uploadsDbPath, JSON.stringify(uploads));

    // Trả về URL cho file
    const fileUrl = `/kzkhanhh/${uniqueCode}`;
    res.json({
      success: true,
      url: fileUrl,
      fullUrl: `${req.protocol}://${req.get("host")}${fileUrl}`,
      fileName: fileName,
      fileType: fileType,
      fileSize: fileSize,
    });
  } catch (error) {
    console.error("Lỗi khi tải lên:", error);
    res.status(500).json({ error: "Lỗi khi tải lên file" });
  }
});

// Trang xem file
app.get("/kzkhanhh/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Đọc database
    const uploads = JSON.parse(fs.readFileSync(uploadsDbPath));

    // Tìm file theo ID
    const fileInfo = uploads.find((file) => file.id === fileId);

    if (!fileInfo) {
      return res
        .status(404)
        .sendFile(path.join(__dirname, "public", "404.html"));
    }

    // Trả về trang xem file
    res.sendFile(path.join(__dirname, "public", "view.html"));
  } catch (error) {
    console.error("Lỗi khi xem file:", error);
    res.status(500).send("Lỗi server");
  }
});

// API lấy thông tin file
app.get("/api/file/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Đọc database
    const uploads = JSON.parse(fs.readFileSync(uploadsDbPath));

    // Tìm file theo ID
    const fileInfo = uploads.find((file) => file.id === fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: "Không tìm thấy file" });
    }

    // Trả về thông tin file
    res.json({
      id: fileInfo.id,
      name: fileInfo.name,
      type: fileInfo.type,
      size: fileInfo.size,
      data: fileInfo.data,
      uploadDate: fileInfo.uploadDate,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin file:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Trang đăng nhập admin
app.get("/kzkhanhh/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// API đăng nhập
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra thông tin đăng nhập
  if (username === "admin" && password === "admin123") {
    req.session.isAuthenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }
});

// API đăng xuất
app.get("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Trang quản lý file (yêu cầu đăng nhập)
app.get("/kzkhanhh", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// API lấy danh sách file
app.get("/api/files", requireLogin, (req, res) => {
  try {
    // Đọc database
    const uploads = JSON.parse(fs.readFileSync(uploadsDbPath));

    // Trả về danh sách file (không bao gồm dữ liệu file)
    const fileList = uploads.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: file.uploadDate,
    }));

    res.json(fileList);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách file:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// API xóa file
app.delete("/api/file/:fileId", requireLogin, (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Đọc database
    const uploads = JSON.parse(fs.readFileSync(uploadsDbPath));

    // Tìm index của file
    const fileIndex = uploads.findIndex((file) => file.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy file" });
    }

    // Xóa file
    uploads.splice(fileIndex, 1);

    // Lưu lại vào file
    fs.writeFileSync(uploadsDbPath, JSON.stringify(uploads));

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi xóa file:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
