require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const recipeRoutes = require("./routes/recipes");
app.use("/api/recipes", recipeRoutes);

const homeRoute = require("./routes/home");
app.use("/", homeRoute);

module.exports = app; // export the configured app
