// require("dotenv").config();
// const express = require("express");
// const path = require("path");
// const cors = require("cors");

// const app = express();

// // ====================
// // Middlewares
// // ====================
// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, "public")));

// // ====================
// // Routes
// // ====================
// const recipeRoutes = require("./routes/recipes");
// app.use("/api/recipes", recipeRoutes);


// const homeRoute = require("./routes/home");
// app.use("/", homeRoute);

// // ====================
// // Export for server.js
// // ====================
// module.exports = app;
require("dotenv").config();
const { Pool } = require("pg");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Test DB connection, then start server
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL database");
    client.release();

    // Make pool available globally via app.locals if needed
    app.locals.pool = pool;

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    process.exit(1);
  });
