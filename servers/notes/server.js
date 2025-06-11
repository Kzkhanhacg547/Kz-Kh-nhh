const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const shortid = require("shortid");

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình middleware
app.use(express.static(path.join(__dirname, "public")));
// Tăng giới hạn kích thước để xử lý dữ liệu base64 lớn
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Đường dẫn đến file lưu trữ dữ liệu ghi chú
const notesDataPath = path.join(__dirname, "server/data/notes.json");

// Đảm bảo file dữ liệu tồn tại
if (!fs.existsSync(path.dirname(notesDataPath))) {
  fs.mkdirSync(path.dirname(notesDataPath), { recursive: true });
}

if (!fs.existsSync(notesDataPath)) {
  fs.writeFileSync(
    notesDataPath,
    JSON.stringify({ notes: [], adminPassword: "KzAdmin123" })
  );
}

// Đọc dữ liệu ghi chú
const readNotesData = () => {
  const data = fs.readFileSync(notesDataPath);
  return JSON.parse(data);
};

// Ghi dữ liệu ghi chú
const writeNotesData = (data) => {
  fs.writeFileSync(notesDataPath, JSON.stringify(data, null, 2));
};

// Routes chính
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

// Tạo ghi chú mới
app.post("/api/notes", (req, res) => {
  try {
    const { title, content, type, mediaFiles } = req.body;

    // Tạo ID và các liên kết
    const noteId = uuidv4();
    const viewLink = shortid.generate();
    const editLink = shortid.generate();

    // Xử lý dữ liệu media base64
    const processedMedia = Array.isArray(mediaFiles) ? mediaFiles.map(file => ({
      type: file.type,
      data: file.data, // Dữ liệu base64
      name: file.name || `file-${shortid.generate()}`
    })) : [];

    // Tạo ghi chú mới
    const newNote = {
      id: noteId,
      title,
      content,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewLink,
      editLink,
      media: processedMedia,
    };

    // Lưu vào dữ liệu
    const data = readNotesData();
    data.notes.push(newNote);
    writeNotesData(data);

    res.json({
      success: true,
      note: newNote,
      viewUrl: `/view/${viewLink}`,
      editUrl: `/edit/${editLink}`,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ success: false, message: "Không thể tạo ghi chú" });
  }
});

// Xem ghi chú
app.get("/view/:link", (req, res) => {
  res.sendFile(path.join(__dirname, "views/view.html"));
});

// API lấy thông tin ghi chú để xem
app.get("/api/notes/view/:link", (req, res) => {
  try {
    const { link } = req.params;
    const data = readNotesData();
    const note = data.notes.find((n) => n.viewLink === link);

    if (!note) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ghi chú" });
    }

    // Không trả về edit link khi ở chế độ xem
    const { editLink, ...safeNote } = note;
    res.json({ success: true, note: safeNote });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy ghi chú" });
  }
});

// Trang chỉnh sửa ghi chú
app.get("/edit/:link", (req, res) => {
  res.sendFile(path.join(__dirname, "views/editor.html"));
});

// API lấy thông tin ghi chú để chỉnh sửa
app.get("/api/notes/edit/:link", (req, res) => {
  try {
    const { link } = req.params;
    const data = readNotesData();
    const note = data.notes.find((n) => n.editLink === link);

    if (!note) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ghi chú" });
    }

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy ghi chú" });
  }
});

// Cập nhật ghi chú
app.put("/api/notes/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, newMediaFiles } = req.body;

    const data = readNotesData();
    const noteIndex = data.notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ghi chú" });
    }

    // Xử lý file media mới nếu có
    const newMedia = Array.isArray(newMediaFiles) ? newMediaFiles.map(file => ({
      type: file.type,
      data: file.data, // Dữ liệu base64
      name: file.name || `file-${shortid.generate()}`
    })) : [];

    // Cập nhật ghi chú
    data.notes[noteIndex] = {
      ...data.notes[noteIndex],
      title,
      content,
      type,
      updatedAt: new Date().toISOString(),
      media: [...data.notes[noteIndex].media, ...newMedia],
    };

    writeNotesData(data);

    res.json({
      success: true,
      note: data.notes[noteIndex],
      viewUrl: `/view/${data.notes[noteIndex].viewLink}`,
      editUrl: `/edit/${data.notes[noteIndex].editLink}`,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật ghi chú:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật ghi chú" });
  }
});

// Xóa media trong ghi chú
app.delete("/api/notes/:id/media/:mediaIndex", (req, res) => {
  try {
    const { id, mediaIndex } = req.params;

    const data = readNotesData();
    const noteIndex = data.notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ghi chú" });
    }

    // Xóa media khỏi danh sách
    if (data.notes[noteIndex].media[mediaIndex]) {
      data.notes[noteIndex].media.splice(mediaIndex, 1);
      data.notes[noteIndex].updatedAt = new Date().toISOString();

      writeNotesData(data);

      res.json({ success: true, note: data.notes[noteIndex] });
    } else {
      res.status(404).json({ success: false, message: "Không tìm thấy media" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa media" });
  }
});

// Trang admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

// API đăng nhập admin
app.post("/api/admin/login", (req, res) => {
  try {
    const { password } = req.body;
    const data = readNotesData();

    if (password === data.adminPassword) {
      res.json({ success: true, token: "admin-token-" + Date.now() });
    } else {
      res.status(401).json({ success: false, message: "Mật khẩu không đúng" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi đăng nhập" });
  }
});

// API lấy tất cả ghi chú (admin)
app.get("/api/admin/notes", (req, res) => {
  try {
    const data = readNotesData();
    
    // Có thể tạo phiên bản rút gọn để tránh truyền dữ liệu base64 lớn
    const simplifiedNotes = data.notes.map(note => {
      const { media, ...noteData } = note;
      return {
        ...noteData,
        mediaCount: media.length
      };
    });

    res.json({ success: true, notes: simplifiedNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy ghi chú" });
  }
});

// API xóa ghi chú (admin)
app.delete("/api/admin/notes/:id", (req, res) => {
  try {
    const { id } = req.params;

    const data = readNotesData();
    const noteIndex = data.notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ghi chú" });
    }

    // Xóa ghi chú
    data.notes.splice(noteIndex, 1);
    writeNotesData(data);

    res.json({ success: true, message: "Đã xóa ghi chú thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa ghi chú" });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});