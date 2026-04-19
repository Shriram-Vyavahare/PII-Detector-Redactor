require('dotenv').config();

const express = require("express");
const fs = require("fs");
const path = require("path");

const uploadRoutes = require("./routes/uploadRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const { testConnection } = require("./config/database");

const app = express();
const port = 3000;
const reactBuildPath = path.join(__dirname, "../frontend-react/build");
const reactIndexPath = path.join(reactBuildPath, "index.html");

/* Test database connection on startup */
testConnection();

/* Serve uploaded/redacted files */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* API routes */
app.use("/api", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", authRoutes);

/* Serve React build when available */
if (fs.existsSync(reactIndexPath)) {
  app.use(express.static(reactBuildPath));

  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(reactIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.status(503).send("React build not found. Run `npm run build` in `frontend-react`.");
  });
}

/* Start server */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
