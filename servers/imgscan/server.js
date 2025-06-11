const express = require("express");
const app = express();
app.use(express.static("public"));
app.get("/image/scanning", (req, res) => {
  res.sendFile(path.join(__dirname, "ai_image_scanning_media_system.html"));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Scanning is runing on ${PORT}`);
});
