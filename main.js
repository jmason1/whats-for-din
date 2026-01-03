fetch('data/recipe-index.json')
  .then(r => r.json())
  .then(recipes => {
    const app = document.getElementById('app');

    recipes.forEach(r => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      card.innerHTML = `
        <h2>${r.name}</h2>
        <p>${r.category}</p>
        <a href="recipe.html?id=${r.id}">View recipe</a>
      `;

      app.appendChild(card);
    });
  });