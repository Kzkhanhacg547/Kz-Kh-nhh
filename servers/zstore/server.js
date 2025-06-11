const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 2500;
const JWT_SECRET = "zstore_secret_key_2024";

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

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
const USERS_FILE = "./data/users.json";
const APPS_FILE = "./data/apps.json";
const ADMIN_EMAIL = "kzemytb547@gmail.com";

// Initialize data directories
if (!fs.existsSync("./data")) {
  fs.mkdirSync("./data");
}

// Initialize data files
const initializeData = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(APPS_FILE)) {
    fs.writeFileSync(APPS_FILE, JSON.stringify([]));
  }
};

// Helper functions
const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const readApps = () => {
  try {
    return JSON.parse(fs.readFileSync(APPS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const writeApps = (apps) => {
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Send email notification
const sendNotificationEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"Z STORE" <basilmailtd@gmail.com>',
      to: to,
      subject: subject,
      text: text,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

// Routes

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// User registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const users = readUsers();

    // Check if user exists
    if (users.find((u) => u.email === email || u.username === username)) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      isAdmin: email === ADMIN_EMAIL,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// User login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = readUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Get user profile
app.get("/api/profile", authenticateToken, (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

// Submit app for review
app.post(
  "/api/apps/submit",
  authenticateToken,
  upload.single("appFile"),
  async (req, res) => {
    try {
      const { appName, description, downloadLink, category } = req.body;

      if (!appName || !description || (!downloadLink && !req.file)) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      const apps = readApps();
      let fileData = null;
      let fileName = null;

      // Handle file upload
      if (req.file) {
        fileData = req.file.buffer.toString("base64");
        fileName = req.file.originalname;
      }

      const newApp = {
        id: uuidv4(),
        appName,
        description,
        downloadLink,
        category: category || "Other",
        fileName,
        fileData,
        authorId: req.user.id,
        authorEmail: req.user.email,
        status: "pending", // pending, approved, rejected
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      apps.push(newApp);
      writeApps(apps);

      // Notify admin
      await sendNotificationEmail(
        ADMIN_EMAIL,
        "New App Submission - Z STORE",
        `A new app "${appName}" has been submitted for review by ${req.user.email}.`
      );

      res.json({ message: "App submitted for review successfully" });
    } catch (error) {
      console.error("App submission error:", error);
      res.status(500).json({ error: "App submission failed" });
    }
  }
);

// Get user's apps
app.get("/api/apps/my-apps", authenticateToken, (req, res) => {
  const apps = readApps();
  const userApps = apps.filter((app) => app.authorId === req.user.id);

  // Don't send file data in list view
  const sanitizedApps = userApps.map((app) => ({
    ...app,
    fileData: undefined,
  }));

  res.json(sanitizedApps);
});

// Get approved apps (public)
app.get("/api/apps/approved", (req, res) => {
  const apps = readApps();
  const approvedApps = apps.filter((app) => app.status === "approved");

  // Don't send file data in list view
  const sanitizedApps = approvedApps.map((app) => ({
    ...app,
    fileData: undefined,
  }));

  res.json(sanitizedApps);
});

// Get pending apps (admin only)
app.get("/api/apps/pending", authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const apps = readApps();
  const pendingApps = apps.filter((app) => app.status === "pending");

  // Don't send file data in list view
  const sanitizedApps = pendingApps.map((app) => ({
    ...app,
    fileData: undefined,
  }));

  res.json(sanitizedApps);
});

// Approve/reject app (admin only)
app.post("/api/apps/:id/review", authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const { id } = req.params;
    const { action, feedback } = req.body; // action: 'approve' or 'reject'

    const apps = readApps();
    const appIndex = apps.findIndex((app) => app.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ error: "App not found" });
    }

    apps[appIndex].status = action === "approve" ? "approved" : "rejected";
    apps[appIndex].adminFeedback = feedback;
    apps[appIndex].reviewedAt = new Date().toISOString();

    writeApps(apps);

    // Notify author
    const statusText = action === "approve" ? "approved" : "rejected";
    await sendNotificationEmail(
      apps[appIndex].authorEmail,
      `App ${statusText} - Z STORE`,
      `Your app "${apps[appIndex].appName}" has been ${statusText}.${
        feedback ? `\n\nFeedback: ${feedback}` : ""
      }`
    );

    res.json({ message: `App ${statusText} successfully` });
  } catch (error) {
    res.status(500).json({ error: "Review action failed" });
  }
});

// Download app
app.get("/api/apps/:id/download", (req, res) => {
  try {
    const { id } = req.params;
    const apps = readApps();
    const app = apps.find((a) => a.id === id && a.status === "approved");

    if (!app) {
      return res.status(404).json({ error: "App not found or not approved" });
    }

    // If app has file data, serve the file
    if (app.fileData && app.fileName) {
      const fileBuffer = Buffer.from(app.fileData, "base64");

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${app.fileName}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(fileBuffer);
    } else if (app.downloadLink) {
      // Redirect to external download link
      res.redirect(app.downloadLink);
    } else {
      res.status(400).json({ error: "No download method available" });
    }
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
});

// Update app (author only, when status is pending or rejected)
app.put(
  "/api/apps/:id",
  authenticateToken,
  upload.single("appFile"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { appName, description, downloadLink, category } = req.body;

      const apps = readApps();
      const appIndex = apps.findIndex((app) => app.id === id);

      if (appIndex === -1) {
        return res.status(404).json({ error: "App not found" });
      }

      const app = apps[appIndex];

      // Check if user is the author
      if (app.authorId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to edit this app" });
      }

      // Check if app can be edited (only pending or rejected)
      if (app.status === "approved") {
        return res
          .status(400)
          .json({ error: "Approved apps cannot be edited" });
      }

      // Update app data
      if (appName) app.appName = appName;
      if (description) app.description = description;
      if (downloadLink) app.downloadLink = downloadLink;
      if (category) app.category = category;

      // Handle file upload
      if (req.file) {
        app.fileData = req.file.buffer.toString("base64");
        app.fileName = req.file.originalname;
      }

      app.status = "pending"; // Reset to pending for re-review
      app.updatedAt = new Date().toISOString();

      writeApps(apps);

      res.json({ message: "App updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "App update failed" });
    }
  }
);

// Delete app (author only, when not approved)
app.delete("/api/apps/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const apps = readApps();
    const appIndex = apps.findIndex((app) => app.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ error: "App not found" });
    }

    const app = apps[appIndex];

    // Check if user is the author or admin
    if (app.authorId !== req.user.id && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this app" });
    }

    apps.splice(appIndex, 1);
    writeApps(apps);

    res.json({ message: "App deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "App deletion failed" });
  }
});

// Initialize data on startup
initializeData();

// Start server
app.listen(PORT, () => {
  console.log(`Z STORE server running on http://localhost:${PORT}`);
});

module.exports = app;
