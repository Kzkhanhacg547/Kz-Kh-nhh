const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your-secret-key-here";

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static("public"));

// Nodemailer config
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "basilmailtd@gmail.com",
    pass: "uzxtolejmfoyrzcd",
  },
});

// Data storage files
const DATA_DIR = "./data";
const USERS_FILE = path.join(DATA_DIR, "users.json");
const APPS_FILE = path.join(DATA_DIR, "apps.json");
const FILES_DIR = path.join(DATA_DIR, "files");

// Initialize data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

// Initialize data files
const initDataFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    const adminUser = {
      id: "admin",
      username: "admin",
      email: "kzemytb547@gmail.com",
      password: bcrypt.hashSync("admin123", 10),
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify([adminUser], null, 2));
  }

  if (!fs.existsSync(APPS_FILE)) {
    fs.writeFileSync(APPS_FILE, JSON.stringify([], null, 2));
  }
};

initDataFiles();

// Helper functions
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
const writeUsers = (users) =>
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const readApps = () => JSON.parse(fs.readFileSync(APPS_FILE, "utf8"));
const writeApps = (apps) =>
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload.html"));
});

// Authentication routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const users = readUsers();

    if (users.find((u) => u.username === username || u.email === email)) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password: hashedPassword,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find((u) => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// App management routes
app.post(
  "/api/apps",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { name, description, downloadUrl, category, version } = req.body;
      const apps = readApps();

      let fileData = null;
      let fileName = null;

      if (req.file) {
        fileName = `${crypto.randomUUID()}_${req.file.originalname}`;
        fileData = req.file.buffer.toString("base64");

        // Save file data
        const fileInfo = {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          data: fileData,
        };
        fs.writeFileSync(
          path.join(FILES_DIR, fileName + ".json"),
          JSON.stringify(fileInfo)
        );
      }

      const newApp = {
        id: crypto.randomUUID(),
        name,
        description,
        downloadUrl: downloadUrl || null,
        fileName: fileName,
        category: category || "Other",
        version: version || "1.0.0",
        author: req.user.username,
        authorId: req.user.id,
        status: req.user.role === "admin" ? "approved" : "pending",
        downloads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      apps.push(newApp);
      writeApps(apps);

      // Send notification email to admin
      if (req.user.role !== "admin") {
        try {
          await transporter.sendMail({
            from: "basilmailtd@gmail.com",
            to: "kzemytb547@gmail.com",
            subject: "New App Submission - Z STORE",
            html: `
            <h2>New App Submission</h2>
            <p><strong>App Name:</strong> ${name}</p>
            <p><strong>Author:</strong> ${req.user.username}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p>Please review and approve this submission.</p>
          `,
          });
        } catch (emailError) {
          console.log("Email notification failed:", emailError);
        }
      }

      res.json({ message: "App submitted successfully", app: newApp });
    } catch (error) {
      console.error("App submission error:", error);
      res.status(500).json({ error: "Failed to submit app" });
    }
  }
);

app.get("/api/apps", (req, res) => {
  try {
    const apps = readApps();
    const approvedApps = apps
      .filter((app) => app.status === "approved")
      .map((app) => ({ ...app, fileName: undefined })); // Hide file info
    res.json(approvedApps);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

app.get("/api/apps/all", authenticateToken, isAdmin, (req, res) => {
  try {
    const apps = readApps();
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

app.get("/api/apps/user", authenticateToken, (req, res) => {
  try {
    const apps = readApps();
    const userApps = apps.filter((app) => app.authorId === req.user.id);
    res.json(userApps);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user apps" });
  }
});

app.put(
  "/api/apps/:id",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, downloadUrl, category, version } = req.body;
      const apps = readApps();
      const appIndex = apps.findIndex((app) => app.id === id);

      if (appIndex === -1) {
        return res.status(404).json({ error: "App not found" });
      }

      const app = apps[appIndex];

      // Check permission
      if (req.user.role !== "admin" && app.authorId !== req.user.id) {
        return res.status(403).json({ error: "Permission denied" });
      }

      // Handle file update
      if (req.file) {
        // Delete old file if exists
        if (app.fileName) {
          const oldFilePath = path.join(FILES_DIR, app.fileName + ".json");
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // Save new file
        const fileName = `${crypto.randomUUID()}_${req.file.originalname}`;
        const fileData = req.file.buffer.toString("base64");
        const fileInfo = {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          data: fileData,
        };
        fs.writeFileSync(
          path.join(FILES_DIR, fileName + ".json"),
          JSON.stringify(fileInfo)
        );
        app.fileName = fileName;
      }

      // Update app info
      app.name = name || app.name;
      app.description = description || app.description;
      app.downloadUrl = downloadUrl || app.downloadUrl;
      app.category = category || app.category;
      app.version = version || app.version;
      app.updatedAt = new Date().toISOString();

      // Reset status to pending if user is not admin
      if (req.user.role !== "admin") {
        app.status = "pending";
      }

      apps[appIndex] = app;
      writeApps(apps);

      res.json({ message: "App updated successfully", app });
    } catch (error) {
      res.status(500).json({ error: "Failed to update app" });
    }
  }
);

app.put("/api/apps/:id/status", authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const apps = readApps();
    const appIndex = apps.findIndex((app) => app.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ error: "App not found" });
    }

    apps[appIndex].status = status;
    apps[appIndex].updatedAt = new Date().toISOString();
    writeApps(apps);

    res.json({ message: "App status updated", app: apps[appIndex] });
  } catch (error) {
    res.status(500).json({ error: "Failed to update app status" });
  }
});

app.delete("/api/apps/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const apps = readApps();
    const appIndex = apps.findIndex((app) => app.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ error: "App not found" });
    }

    const app = apps[appIndex];

    // Check permission
    if (req.user.role !== "admin" && app.authorId !== req.user.id) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // Delete associated file
    if (app.fileName) {
      const filePath = path.join(FILES_DIR, app.fileName + ".json");
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    apps.splice(appIndex, 1);
    writeApps(apps);

    res.json({ message: "App deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete app" });
  }
});

app.get("/api/download/:id", (req, res) => {
  try {
    const { id } = req.params;
    const apps = readApps();
    const app = apps.find((app) => app.id === id && app.status === "approved");

    if (!app) {
      return res.status(404).json({ error: "App not found" });
    }

    // Increment download count
    app.downloads = (app.downloads || 0) + 1;
    const appIndex = apps.findIndex((a) => a.id === id);
    apps[appIndex] = app;
    writeApps(apps);

    if (app.fileName) {
      // Serve file from base64
      const filePath = path.join(FILES_DIR, app.fileName + ".json");
      if (fs.existsSync(filePath)) {
        const fileInfo = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const buffer = Buffer.from(fileInfo.data, "base64");

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileInfo.originalName}"`
        );
        res.setHeader("Content-Type", fileInfo.mimeType);
        res.send(buffer);
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } else if (app.downloadUrl) {
      // Redirect to external URL
      res.redirect(app.downloadUrl);
    } else {
      res.status(404).json({ error: "No download available" });
    }
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Z STORE server running on http://localhost:${PORT}`);
});
