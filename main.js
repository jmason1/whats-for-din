fetch('data/recipe-index.json')
  .then(r => r.json())
  .then(recipes => {
    const app = document.getElementById('app');

    // 1️⃣ Group recipes by category
    const categories = {};
    recipes.forEach(r => {
      const cat = r.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(r);
    });

    // 2️⃣ Render each category
    Object.keys(categories).forEach(catName => {
      // Category header
      const header = document.createElement('h2');
      header.textContent = catName;
      app.appendChild(header);

      // Recipes in this category
      categories[catName].forEach(r => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
          <h3>${r.name}</h3>
          <a href="recipe.html?id=${r.id}">View recipe</a>
        `;
        app.appendChild(card);
      });
    });
  });
