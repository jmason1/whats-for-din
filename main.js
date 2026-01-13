fetch('data/recipe-index.json')
  .then(r => r.json())
  .then(recipes => {
    const categoryContainer = document.getElementById('categories');
    const recipeList = document.getElementById('recipe-list');

    // Group recipes by category
    const categories = {};
    recipes.forEach(r => {
      const cat = r.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(r);
    });

    /* ---------- ALL BUTTON ---------- */
    const allBtn = document.createElement('button');
    allBtn.className = 'category-button active';
    allBtn.textContent = 'All';

    allBtn.addEventListener('click', () => {
      setActive(allBtn);
      renderAllRecipes();
    });

    categoryContainer.appendChild(allBtn);

    /* ---------- CATEGORY BUTTONS ---------- */
    Object.keys(categories).forEach(catName => {
      const btn = document.createElement('button');
      btn.className = 'category-button';
      btn.textContent = catName;

      btn.addEventListener('click', () => {
        setActive(btn);
        renderCategory(catName);
      });

      categoryContainer.appendChild(btn);
    });

    /* ---------- INITIAL RENDER ---------- */
    renderAllRecipes();

    /* ---------- HELPERS ---------- */

    function setActive(activeBtn) {
      document
        .querySelectorAll('.category-button')
        .forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    }

function renderCategory(categoryName) {
  recipeList.innerHTML = '';

  const group = document.createElement('div');
  group.className = 'category-group';

  const header = document.createElement('h2');
  header.textContent = categoryName;
  group.appendChild(header);

  categories[categoryName].forEach(r => {
    group.appendChild(createRecipeLink(r));
  });

  recipeList.appendChild(group);
}


function renderAllRecipes() {
  recipeList.innerHTML = '';

  Object.keys(categories).forEach(catName => {
    const group = document.createElement('div');
    group.className = 'category-group';

    const header = document.createElement('h2');
    header.textContent = catName;
    group.appendChild(header);

    categories[catName].forEach(r => {
      group.appendChild(createRecipeLink(r));
    });

    recipeList.appendChild(group);
  });
}


    function createRecipeLink(recipe) {
      const link = document.createElement('a');
      link.className = 'recipe-link';
      link.href = `recipe.html?id=${recipe.id}`;
      link.textContent = recipe.name;
      return link;
    }
  });
