const express = require("express");
const path = require("path");

const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const port = 3000;

/* Serve frontend */
app.use(express.static(path.join(__dirname, "../frontend")));

/* Serve uploaded/redacted files */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* API routes */
app.use("/api", uploadRoutes);

/* Start server */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});