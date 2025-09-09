
async function getRecipes() {
  const ingredients = document.getElementById('ingredientInput').value;
  try {
    const response = await fetch(`http://localhost:3000/recipes?ingredients=${ingredients}`);
    if (!response.ok) throw new Error("Failed to fetch recipes");

    const recipes = await response.json();
    const list = document.getElementById('recipeList');
    list.innerHTML = '';

    if (recipes.length === 0) {
      list.innerHTML = `<li>No recipes found for "${ingredients}".</li>`;
      return;
    }

    recipes.forEach(recipe => {
      const item = document.createElement('li');
      item.textContent = recipe.title || "Untitled Recipe";

      // زر حفظ
      const saveBtn = document.createElement('button');
      saveBtn.textContent = "Save to Favorites";
      saveBtn.style.marginLeft = "10px";
      saveBtn.onclick = () => saveToFavorites(recipe);

      item.appendChild(saveBtn);
      list.appendChild(item);
    });

  } catch (error) {
    console.error(error);
    alert("Error fetching recipes. Please try again.");
  }
}
async function searchRecipes() {
  const ingredients = document.getElementById('ingredientInput').value.trim();
  if (!ingredients) return alert("Please enter ingredients!");

  try {
    const response = await fetch(`http://localhost:3000/recipes/search?ingredients=${(ingredients)}`);
    if (!response.ok) throw new Error("Failed to fetch recipes");

    const recipes = await response.json();
    console.log(recipes); 
    const results = document.getElementById('searchResults');
    results.innerHTML = '';

    if (!recipes || recipes.length === 0) {
      results.innerHTML = `<p>No recipes found for "${ingredients}".</p>`;
      return;
    }

    recipes.forEach((recipe) => {
      const used = recipe.usedIngredients?.join(', ') || "None";
      const missed = recipe.missedIngredients?.join(', ') || "None";

      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" width="300" />
        <p><strong>Used:</strong> ${used}</p>
        <p><strong>Missing:</strong> ${missed}</p>
      `;

      const saveBtn = document.createElement('button');
      saveBtn.textContent = "Save to Favorites";
      saveBtn.onclick = () => saveToFavorites(recipe);

      card.appendChild(saveBtn);
      results.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    alert("Error searching recipes. Please try again.");
  }
}

let currentRecipe = null;

async function fetchRandomRecipe() {
  try {
    const response = await fetch('http://localhost:3000/recipes/random');
    if (!response.ok) throw new Error("API request failed");

    const recipe = await response.json();
    currentRecipe = recipe; // store globally

    const display = document.getElementById('recipeDisplay');
    display.innerHTML = `
      <div class="recipe-card">
        <h2>${currentRecipe.title}</h2>
        <img src="${currentRecipe.image}" alt="${currentRecipe.title}" width="300" />
        <h3>Ingredients:</h3>
        <ul>
          ${currentRecipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
        </ul>
        <h3>Instructions:</h3>
        <p>${currentRecipe.instructions || "No instructions available."}</p>
        <button onclick="saveToFavorites(currentRecipe)">Save to Favorites</button>
      </div>
    `;

  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById('recipeDisplay').innerHTML = `
      <p style="color: red;">Failed to load recipe. Please try again later.</p>
    `;
  }
}



function loadFavorites() {
   const favorites = (JSON.parse(localStorage.getItem('favorites')) || []).filter(r => r);
  const list = document.getElementById('favoritesList');
  list.innerHTML = '';

  favorites.forEach((recipe, index) => {
    const item = document.createElement('li');
    item.className = 'recipe-card';
    item.innerHTML = `
      <h2>${recipe.title}</h2>
      <img src="${recipe.image}" width="300" />
      <p>${recipe.instructions || 'No instructions available.'}</p>
      <button onclick="removeFavorite(${index})">Remove</button>
    `;
    list.appendChild(item);
  });
}

function removeFavorite(index) {
 const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  favorites.splice(index, 1);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  loadFavorites(); 
}

function clearFavorites() {
  localStorage.removeItem('favorites');
  loadFavorites();
}

function saveToFavorites(recipe) {
  if (!recipe) {
    alert("No recipe to save!");
    return;
  }

  // جلب المفضلة من localStorage
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  // التحقق من وجود الوصفة مسبقاً
  const exists = favorites.some(fav => fav && fav.title === recipe.title);
  if (exists) {
    alert("Recipe already in favorites!");
    return;
  }

  // إضافة الوصفة وحفظها
  favorites.push(recipe);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  alert("Recipe added to favorites!");
}

