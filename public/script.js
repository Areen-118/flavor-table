// async function getRecipes() {
//   const ingredients = document.getElementById("ingredientInput").value;
//   try {
//     const response = await fetch(
//       `http://localhost:3000/recipes?ingredients=${ingredients}`
//     );
//     if (!response.ok) throw new Error("Failed to fetch recipes");

//     const recipes = await response.json();
//     const list = document.getElementById("recipeList");
//     list.innerHTML = "";

//     if (recipes.length === 0) {
//       list.innerHTML = `<li>No recipes found for "${ingredients}".</li>`;
//       return;
//     }

//     recipes.forEach((recipe) => {
//       const item = document.createElement("li");
//       item.textContent = recipe.title || "Untitled Recipe";

//       // زر حفظ
//       const saveBtn = document.createElement("button");
//       saveBtn.textContent = "Save to Favorites";
//       saveBtn.style.marginLeft = "10px";
//       saveBtn.onclick = () => saveToFavorites(recipe);

//       item.appendChild(saveBtn);
//       list.appendChild(item);
//     });
//   } catch (error) {
//     console.error(error);
//     alert("Error fetching recipes. Please try again.");
//   }
// }
async function searchRecipes() {
  const ingredients = document.getElementById("ingredientInput").value.trim();
  if (!ingredients) return alert("Please enter ingredients!");

  try {
    const response = await fetch(
      `http://localhost:3000/api/recipes/search?ingredients=${ingredients}`
    );
    if (!response.ok) throw new Error("Failed to fetch recipes");

    const recipes = await response.json();
    console.log(recipes);
    const results = document.getElementById("searchResults");
    results.innerHTML = "";

    if (!recipes || recipes.length === 0) {
      results.innerHTML = `<p>No recipes found for "${ingredients}".</p>`;
      return;
    }

    recipes.forEach((recipe) => {
      const used = recipe.usedIngredients?.join(", ") || "None";
      const missed = recipe.missedIngredients?.join(", ") || "None";

      const card = document.createElement("div");
      card.className = "recipe-card";
      card.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" width="300" />
        <p><strong>Used:</strong> ${used}</p>
        <p><strong>Missing:</strong> ${missed}</p>
      `;

      const saveBtn = document.createElement("button");
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
    const response = await fetch("http://localhost:3000/api/recipes/random");
    if (!response.ok) throw new Error("API request failed");

    const recipe = await response.json();
    currentRecipe = recipe; // store globally

    const display = document.getElementById("recipeDisplay");
    display.innerHTML = `
      <div class="recipe-card">
        <h2>${currentRecipe.title}</h2>
        <img src="${currentRecipe.image}" alt="${
      currentRecipe.title
    }" width="300" />
        <h3>Ingredients:</h3>
        <ul>
          ${currentRecipe.ingredients.map((ing) => `<li>${ing}</li>`).join("")}
        </ul>
        <h3>Instructions:</h3>
        <p>${currentRecipe.instructions || "No instructions available."}</p>
        <button onclick="saveToFavorites(currentRecipe)">Save to Favorites</button>
      </div>
    `;
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("recipeDisplay").innerHTML = `
      <p style="color: red;">Failed to load recipe. Please try again later.</p>
    `;
  }
}


let favoritesCache = [];
async function loadFavorites() {
  try {
    const response = await fetch("http://localhost:3000/api/recipes/favorites");
    if (!response.ok) throw new Error("Failed to load favorites");

    const favorites = await response.json();
    favoritesCache = favorites; 
    const list = document.getElementById("favoritesList");
    list.innerHTML = "";

    if (!favorites.length) {
      list.innerHTML = "<p>No favorites yet.</p>";
      return;
    }

    favorites.forEach((recipe) => {
      const item = document.createElement("li");
      item.className = "recipe-card";
      item.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" width="300" />
        <p>${recipe.instructions || "No instructions available."}</p>
        <button onclick="removeFavorite(${recipe.id})">Remove</button>
        <button onclick="showUpdateForm(${recipe.id})">Update</button>

      `;
      list.appendChild(item);
    });
  } catch (error) {
    console.error("Error loading favorites:", error);
    alert("Could not load favorites.");
  }
}

async function removeFavorite(id) {
  if (!confirm("Are you sure you want to remove this favorite?")) return;

  try {
    const response = await axios.delete(`http://localhost:3000/api/recipes/favorites/${id}`);

    
    alert("Favorite removed!");
    loadFavorites(); // refresh UI
  } catch (error) {
    console.error("❌ Error removing favorite:", error);
    alert("Server error: Could not remove favorite.");
  }
}

async function saveToFavorites(recipe) {
  console.log("Saving recipe:", recipe);

  if (
    !recipe ||
    !recipe.title ||
    !recipe.image ||
    !recipe.ingredients ||
    !recipe.readyin == null ||
    !recipe.instructions
  ) {
    alert("Invalid recipe data!");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/recipes/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: recipe.title,
        image: recipe.image,
        ingredients: recipe.ingredients, // will be JSON.stringified by backend
        readyin: recipe.readyin ?? 0,
        instructions: recipe.instructions,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to save recipe.");
      return;
    }

    alert("Recipe added successfully!");
    
  } catch (error) {
    console.error("❌ Error saving recipe:", error);
    alert("Server error: Could not save recipe.");
  }
}

function showUpdateForm(id) {
  const recipe = favoritesCache.find(r => r.id === id); // ✅ look up recipe
  if (!recipe) {
    alert("Recipe not found!");
    return;
  }

  document.getElementById("updateId").value = recipe.id;
  document.getElementById("updateTitle").value = recipe.title || "";
  document.getElementById("updateImage").value = recipe.image || "";
  document.getElementById("updateInstructions").value = recipe.instructions || "";

  document.getElementById("updateFormContainer").style.display = "block";
}


async function submitUpdate(event) {
  event.preventDefault();
  const id = document.getElementById("updateId").value;
  const title = document.getElementById("updateTitle").value;
  const image = document.getElementById("updateImage").value;
  const instructions = document.getElementById("updateInstructions").value;

  try {
    await axios.put(`http://localhost:3000/api/recipes/favorites/${id}`, {
      title, image, instructions
    });
    alert("Recipe updated!");
    loadFavorites();
    document.getElementById("updateFormContainer").style.display = "none";
  } catch (err) {
    console.error("❌ Error updating favorite:", err);
    alert("Update failed");
  }
}
