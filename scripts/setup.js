const fs = require("fs");
const path = require("path");

// Cấu trúc thư mục cần tạo
const directories = [
  "views",
  "public",
  "servers",
  "servers/notes",
  "servers/chat",
  "servers/blog",
  "scripts",
];

// Tạo file README.md cho từng server
const createServerReadme = (serverName) => `# ${serverName.toUpperCase()} Server

## Hướng dẫn sử dụng

1. Đặt code server của bạn vào thư mục này
2. Đảm bảo file chính có tên là \`server.js\`
3. Server sẽ tự động được khởi động khi chạy main server

## Cấu trúc thư mục đề xuất:
\`\`\`
${serverName}/
├── server.js          # File server chính
├── package.json       # Dependencies
├── views/             # HTML templates
├── public/            # Static files
└── data/              # Data files
\`\`\`

## Route pattern:
- Tất cả routes sẽ có prefix: \`/kz/${serverName}\`
- Ví dụ: \`/api/users\` → \`/kz/${serverName}/api/users\`

## Lưu ý:
- Không cần sửa đổi code server hiện có
- Main server sẽ tự động proxy các request
- Server sẽ chạy trên port được assign tự động
`;

// Tạo file hướng dẫn di chuyển server cũ
const migrationGuide = `# Hướng dẫn di chuyển Server cũ

## Bước 1: Copy server vào thư mục tương ứng
\`\`\`bash
# Ví dụ với notes server
cp -r /path/to/old/notes-server/* ./servers/notes/
\`\`\`

## Bước 2: Đổi tên file chính thành server.js
\`\`\`bash
cd servers/notes
mv app.js server.js  # hoặc index.js thành server.js
\`\`\`

## Bước 3: Cập nhật package.json (nếu có)
Đảm bảo script start trỏ đến server.js:
\`\`\`json
{
  "scripts": {
    "start": "node server.js"
  }
}
\`\`\`

## Bước 4: Cài đặt dependencies
\`\`\`bash
cd servers/notes
npm install
\`\`\`

## Bước 5: Test server
\`\`\`bash
# Từ thư mục gốc
npm start
\`\`\`

## Lưu ý quan trọng:
- **KHÔNG** cần sửa đổi code server cũ
- **KHÔNG** cần thay đổi routes hiện có
- Server sẽ tự động được proxy với prefix /kz/[folder-name]
- Ví dụ: localhost:3000/api/notes → localhost:8000/kz/notes/api/notes
`;

console.log("🏗️  Đang khởi tạo cấu trúc thư mục...\n");

// Tạo các thư mục
directories.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Đã tạo thư mục: ${dir}`);
  } else {
    console.log(`✅ Thư mục đã tồn tại: ${dir}`);
  }
});

// Tạo README cho từng server folder
const serverFolders = ["notes", "chat", "blog"];
serverFolders.forEach((serverName) => {
  const readmePath = path.join(
    process.cwd(),
    "servers",
    serverName,
    "README.md"
  );
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, createServerReadme(serverName));
    console.log(`📝 Đã tạo README: servers/${serverName}/README.md`);
  }
});

// Tạo file hướng dẫn migration
const migrationPath = path.join(process.cwd(), "MIGRATION_GUIDE.md");
if (!fs.existsSync(migrationPath)) {
  fs.writeFileSync(migrationPath, migrationGuide);
  console.log(`📋 Đã tạo hướng dẫn: MIGRATION_GUIDE.md`);
}

// Tạo file .gitignore
const gitignoreContent = `# Dependencies
node_modules/
*/node_modules/

# Logs
logs/
*.log
npm-debug.log*

# Data files
*/data/
*.json

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Temporary files
*.tmp
*.temp
`;

const gitignorePath = path.join(process.cwd(), ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log(`🙈 Đã tạo .gitignore`);
}

// Tạo example server để test
const exampleServerContent = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from Example Server!',
    server: 'example',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    data: 'This is a test endpoint',
    server: 'example'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Example Server',
    version: '1.0.0',
    routes: [
      'GET /',
      'GET /api/test',
      'GET /api/info'
    ]
  });
});

app.listen(PORT, () => {
  console.log(\`Example Server running on port \${PORT}\`);
});
`;

// Tạo example server trong thư mục notes (để test)
const examplePath = path.join(process.cwd(), "servers", "notes", "server.js");
if (!fs.existsSync(examplePath)) {
  fs.writeFileSync(examplePath, exampleServerContent);
  console.log(`🧪 Đã tạo example server: servers/notes/server.js`);
}

// Tạo package.json cho example server
const examplePackageJson = {
  name: "notes-server",
  version: "1.0.0",
  main: "server.js",
  scripts: {
    start: "node server.js",
  },
  dependencies: {
    express: "^4.18.2",
  },
};

const examplePackagePath = path.join(
  process.cwd(),
  "servers",
  "notes",
  "package.json"
);
if (!fs.existsSync(examplePackagePath)) {
  fs.writeFileSync(
    examplePackagePath,
    JSON.stringify(examplePackageJson, null, 2)
  );
  console.log(`📦 Đã tạo package.json: servers/notes/package.json`);
}

console.log("\n✨ Cấu trúc thư mục đã được tạo thành công!");
console.log("\n📋 Các bước tiếp theo:");
console.log("1. Chạy: npm install");
console.log("2. Di chuyển server cũ theo hướng dẫn trong MIGRATION_GUIDE.md");
console.log("3. Chạy: npm start");
console.log("4. Truy cập: http://localhost:8000");
console.log("\n🚀 Chúc bạn thành công!");
