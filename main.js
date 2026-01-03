// Fetch recipes.json and render them as cards
fetch('recipes.json')
  .then(response => response.json())
  .then(recipes => {
    const app = document.getElementById('app');

    recipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      // Convert ingredients array to HTML list
      const ingredientsList = recipe.ingredients
        .map(ing => `<li>${ing.qty} — ${ing.item}</li>`)
        .join('');

      // Convert tags array to badges (optional)
      const tagsHTML = recipe.tags ? recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ') : '';

      // Fill card content
      card.innerHTML = `
        <h2>${recipe.name}</h2>
        <p><strong>Cuisine:</strong> ${recipe.cuisine.join(', ')}</p>
        <p><strong>Prep:</strong> ${recipe.prepTime}, <strong>Cook:</strong> ${recipe.cookTime}</p>
        <h3>Ingredients:</h3>
        <ul>${ingredientsList}</ul>
        <h3>Method:</h3>
        <p>${recipe.method.replace(/\n/g, '<br>')}</p>
        <div class="tags">${tagsHTML}</div>
      `;

      app.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading recipes:', err));
