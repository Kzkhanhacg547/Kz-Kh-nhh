// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
const port = 1200;

// Cấu hình thư mục lưu trữ tệp tải lên
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Middleware để xử lý tệp đa phương tiện
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận tệp PDF và Word
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận tệp PDF hoặc Word!"), false);
    }
  },
});

// Đảm bảo thư mục uploads tồn tại
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Phục vụ các tệp tĩnh từ thư mục public
app.use(express.static("public"));

// Định tuyến gốc
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API để tải lên và trích xuất văn bản
app.post("/extract-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng tải lên một tệp." });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let extractedText = "";

    // Trích xuất văn bản dựa trên loại tệp
    if (fileExtension === ".pdf") {
      // Xử lý tệp PDF
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else if (fileExtension === ".docx" || fileExtension === ".doc") {
      // Xử lý tệp Word
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    }

    // Xóa tệp sau khi xử lý
    fs.unlinkSync(filePath);

    res.json({ text: extractedText });
  } catch (error) {
    console.error("Lỗi khi trích xuất văn bản:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi trích xuất văn bản." });
  }
});

// Khởi động máy chủ
app.listen(port, () => {
  console.log(`Máy chủ đang chạy tại http://localhost:${port}`);
});
