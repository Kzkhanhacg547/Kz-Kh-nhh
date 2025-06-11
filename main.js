const express = require("express");
const path = require("path");
const fs = require("fs");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const MAIN_PORT = process.env.MAIN_PORT || 8000;

// Cấu hình các sub-server và port của chúng
const subServers = {
  notes: {
    port: 3001,
    path: "./servers/notes",
    serverFile: "server.js",
  },
  music: {
    port: 2025,
    path: "./servers/music",
    serverFile: "server.js",
  },
  filetolink: {
    port: 2006,
    path: "./servers/filetolink",
    serverFile: "server.js",
  },
  ai: {
    port: 2001,
    path: "./servers/AI",
    serverFile: "server.js",
  },
  kztext: {
    port: 1200,
    path: "./servers/kztext",
    serverFile: "server.js",
  },
  imgscan: {
    port: 2300,
    path: "servers/imgscan",
    serverFile: "server.js",
  },
  zstore: {
    port: 2500,
    path: "./servers/zstore",
    serverFile: "server.js",
  },
  zdev: {
    port: 3000,
    path: "./servers/zdev",
    serverFile: "index.js",
  },
};

// Middleware để serve static files từ thư mục public chính
app.use("/public", express.static(path.join(__dirname, "public")));

// Hàm khởi động một sub-server
const startSubServer = (serverName, config) => {
  return new Promise((resolve, reject) => {
    const { spawn } = require("child_process");
    const serverPath = path.join(__dirname, config.path);
    const serverFile = path.join(serverPath, config.serverFile);

    // Kiểm tra xem file server có tồn tại không
    if (!fs.existsSync(serverFile)) {
      console.warn(`⚠️  Server file không tồn tại: ${serverFile}`);
      resolve(null);
      return;
    }

    console.log(
      `🚀 Đang khởi động ${serverName} server tại port ${config.port}...`
    );

    // Khởi động sub-server với port tương ứng
    const child = spawn("node", [config.serverFile], {
      cwd: serverPath,
      env: { ...process.env, PORT: config.port },
      stdio: "inherit",
    });

    child.on("error", (err) => {
      console.error(`❌ Lỗi khởi động ${serverName}:`, err);
      reject(err);
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ ${serverName} server đã thoát với code: ${code}`);
      }
    });

    // Đợi một chút để server khởi động
    setTimeout(() => {
      console.log(`✅ ${serverName} server đã khởi động thành công`);
      resolve(child);
    }, 2000);
  });
};

// Hàm thiết lập proxy cho các sub-server
const setupProxies = () => {
  Object.keys(subServers).forEach((serverName) => {
    const config = subServers[serverName];

    // Tạo proxy middleware
    const proxyMiddleware = createProxyMiddleware({
      target: `http://localhost:${config.port}`,
      changeOrigin: true,
      pathRewrite: {
        [`^/kz/${serverName}`]: "", // Loại bỏ prefix khi chuyển tiếp
      },
      onError: (err, req, res) => {
        console.error(`❌ Proxy error cho ${serverName}:`, err.message);
        res.status(500).json({
          error: `Server ${serverName} không khả dụng`,
          message: err.message,
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log các request thành công
        console.log(
          `📡 Proxy ${req.method} ${req.originalUrl} -> ${serverName}:${config.port}`
        );
      },
    });

    // Thiết lập route với prefix /kz/serverName
    app.use(`/kz/${serverName}`, proxyMiddleware);

    console.log(
      `🔗 Đã thiết lập proxy: /kz/${serverName} -> localhost:${config.port}`
    );
  });
};

// Khởi động tất cả sub-servers
const startAllServers = async () => {
  console.log("🏗️  Đang khởi động tất cả sub-servers...\n");

  const serverPromises = Object.keys(subServers).map((serverName) =>
    startSubServer(serverName, subServers[serverName])
  );

  try {
    await Promise.all(serverPromises);
    console.log("\n✅ Tất cả sub-servers đã được khởi động");

    // Thiết lập proxy sau khi tất cả servers đã khởi động
    setupProxies();
  } catch (error) {
    console.error("❌ Lỗi khi khởi động sub-servers:", error);
  }
};

// Route chính - trang dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/dashboard.html"));
});

// API để lấy thông tin các server
app.get("/api/servers", (req, res) => {
  const serverInfo = Object.keys(subServers).map((name) => ({
    name,
    port: subServers[name].port,
    url: `/kz/${name}`,
    path: subServers[name].path,
  }));

  res.json({
    success: true,
    servers: serverInfo,
    mainPort: MAIN_PORT,
  });
});

// Middleware xử lý 404
app.use((req, res, next) => {
  res.status(404).json({
    error: "Route không tồn tại",
    availableRoutes: Object.keys(subServers).map((name) => `/kz/${name}`),
    message: "Vui lòng kiểm tra lại đường dẫn",
  });
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error("❌ Lỗi server:", err);
  res.status(500).json({
    error: "Lỗi server nội bộ",
    message: err.message,
  });
});

// Khởi động main server
const startMainServer = async () => {
  try {
    // Khởi động tất cả sub-servers trước
    await startAllServers();

    // Sau đó khởi động main server
    app.listen(MAIN_PORT, () => {
      console.log(
        `\n🎯 Main Server đang chạy tại: http://localhost:${MAIN_PORT}`
      );
      console.log(`📋 Dashboard: http://localhost:${MAIN_PORT}`);
      console.log(`\n🔗 Các routes có sẵn:`);
      Object.keys(subServers).forEach((name) => {
        console.log(`   • http://localhost:${MAIN_PORT}/kz/${name}`);
      });
      console.log("\n✨ Hệ thống đã sẵn sàng!");
    });
  } catch (error) {
    console.error("❌ Lỗi khởi động main server:", error);
    process.exit(1);
  }
};

// Xử lý tín hiệu thoát
process.on("SIGINT", () => {
  console.log("\n🛑 Đang tắt server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Đang tắt server...");
  process.exit(0);
});

// Khởi động hệ thống
startMainServer();
