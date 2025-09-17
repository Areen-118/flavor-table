const express = require("express");
const axios = require("axios");
const pg = require("pg");
const pool = require('./db');
const router = express.Router();
const apiKey = process.env.SPOONACULAR_API_KEY;

// GET /recipes/random (Spoonacular API)

router.get("/random", async (req, res) => {
  try {
    const response = await axios.get("https://api.spoonacular.com/recipes/random", {
      params: {
        number: 1,
        apiKey,
      },
    });

    const recipe = response.data.recipes[0];
    const simplified = {
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map((ing) => ing.original),
    };

    res.json(simplified);
  } catch (error) {
    console.error("❌ Error fetching random recipe:", error.message);
    res.status(500).json({ error: "Failed to fetch random recipe" });
  }
});

// GET /recipes/search?ingredients=tomato,cheese (Spoonacular API)
router.get("/search", async (req, res) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    return res.status(400).json({ error: "Ingredients query is required" });
  }

  try {
    const response = await axios.get(
      "https://api.spoonacular.com/recipes/findByIngredients",
      {
        params: {
          ingredients, // comma-separated string
          number: 5,
          apiKey,
        },
      }
    );

    const simplified = response.data.map((recipe) => ({
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients.map((ing) => ing.name),
      missedIngredients: recipe.missedIngredients.map((ing) => ing.name),
    }));

    if (simplified.length === 0) {
      return res
        .status(404)
        .json({ message: "No recipes found with given ingredients" });
    }

    res.json(simplified);
  } catch (error) {
    console.error("❌ Search error:", error.message);
    res.status(500).json({ error: "Failed to search recipes" });
  }
});


// CRUD for PostgreSQL

// Add a recipe to favorites
router.post("/add", async (req, res) => {
  const { title, image, ingredients, readyin, instructions } = req.body;

  // Basic validation
  if (!title || !image || !ingredients  || !instructions) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  console.log("Adding recipe:", { title, image, ingredients, readyin, instructions });

  try {
    const result = await pool.query(
      `INSERT INTO recipes (title, image, ingredients, readyin , instructions)
       VALUES ($1, $2, $3::jsonb, $4, $5) RETURNING *`,
      [
        title,
        image,
        JSON.stringify(ingredients), // convert to JSON for Postgres
        readyin,
        instructions,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error inserting recipe:", error.message);
    res.status(500).json({ error: "Failed to insert recipe" });
  }
});
//Get all favorites from DB
router.get("/favorites", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching recipes:", error.message);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Remove favorite by ID
router.delete("/favorites/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM recipes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({ message: "Favorite removed", removed: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting favorite:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update favorite by ID
router.put("/favorites/:id", async (req, res) => {
  const { id } = req.params;
  const { title, image, instructions } = req.body;

  console.log("➡️ Update request:", { id, title, image, instructions });

  try {
    const result = await pool.query(
      `UPDATE recipes 
       SET title = $1, image = $2, instructions = $3
       WHERE id = $4
       RETURNING *`,
      [title, image, instructions, id]
    );

    if (result.rowCount === 0) {
      console.warn("⚠️ No recipe found with id:", id);
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error updating recipe:", error.message);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});











// Read single recipe
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM recipes WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error fetching recipe:", error.message);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

// Update recipe
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { title, image, instructions } = req.body;

  try {
    const result = await pool.query(
      "UPDATE recipes SET title = $1, image = $2, instructions = $3 WHERE id = $4 RETURNING *",
      [title, image, instructions, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error updating recipe:", error.message);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// Delete recipe
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM recipes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json({ message: "Recipe deleted", deleted: result.rows[0] });
  } catch (error) {
    console.error("❌ Error deleting recipe:", error.message);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// Get all favorites
router.get('/favorites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM favorites ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/favorites', async (req, res) => {
  const { title, image, instructions } = req.body;
  try {
    const exists = await pool.query('SELECT * FROM favorites WHERE title = $1', [title]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Recipe already in favorites' });
    }

    const result = await pool.query(
      'INSERT INTO favorites (title, image, instructions) VALUES ($1, $2, $3) RETURNING *',
      [title, image, instructions]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a recipe from favorites
router.delete('/favorites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM favorites WHERE id = $1', [id]);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Optional: clear all favorites
router.delete('/favorites', async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites');
    res.status(200).json({ message: 'All favorites cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
