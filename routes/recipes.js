const express = require('express');
const axios = require('axios');
const router = express.Router();

const apiKey = process.env.SPOONACULAR_API_KEY;

const cors = require('cors');
app.use(cors());

// GET /recipes/random

router.get('/random', async (req, res) => {
  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/random', {
      params: {
        number: 1,
        apiKey
      }
    });

    const recipe = response.data.recipes[0];
    const simplified = {
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map(ing => ing.original)
    };

    res.json(simplified);
  } catch (error) {
    console.error('Error fetching random recipe:', error.message);
    res.status(500).json({ error: 'Failed to fetch random recipe' });
  }
});

// GET /recipes/search
router.get('/search', async (req, res) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients query is required' });
  }

  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients, // comma-separated string
        number: 5,
        apiKey
      }
    });

    const simplified = response.data.map(recipe => ({
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients.map(ing => ing.name),
      missedIngredients: recipe.missedIngredients.map(ing => ing.name)
    }));

    if (simplified.length === 0) {
      return res.status(404).json({ message: "No recipes found with given ingredients" });
    }

    res.json(simplified);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

module.exports = router;
