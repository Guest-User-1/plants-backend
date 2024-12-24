require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const plantRoutes = require("./routes/plantRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const questionRoutes = require("./routes/questionRoutes");
const plantReportRoutes = require("./routes/plantReportRoutes");
const path = require("path"); // Add path module
const pool = require("./config/db");
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // Exit the application if the database connection fails
  }
})();

const app = express();

// Middleware
// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "plants-gamma.vercel.app",
      "plants-b11hy497n-guest-user-1s-projects.vercel.app",
    ], // Allow local and production frontEnd URLs
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // Allow cookies and other credentials
  })
);
app.use(express.json());

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/", authRoutes);
app.use("/plants", plantRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/questions", questionRoutes);
app.use("/plant-report", plantReportRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
