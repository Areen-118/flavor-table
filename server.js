require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const recipeRoutes = require("./routes/recipes");
const homeRoute = require("./routes/home");

app.use("/recipes", recipeRoutes);
app.use("/", homeRoute);

// Random Recipe API
app.get("/recipes/random", async (req, res) => {
  try {
    const response = await axios.get("https://api.spoonacular.com/recipes/random", {
      params: {
        number: 1,
        apiKey: process.env.SPOONACULAR_API_KEY,
      },
    });

    const recipe = response.data.recipes[0];
    console.log("API response:", recipe); // ✅ صارت داخل البلوك

    const simplified = {
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map((ing) => ing.original),
    };

    res.json(simplified);
  } catch (error) {
    console.error("Error fetching random recipe:", error.message);
    res.status(500).json({ error: "Failed to fetch random recipe" });
  }
});

module.exports = app;
