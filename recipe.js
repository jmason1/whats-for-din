const params = new URLSearchParams(window.location.search);
const recipeId = params.get('id');

async function loadRecipePage() {
  const [index, ingredients] = await Promise.all([
    fetch('data/recipe-index.json').then(r => r.json()),
    fetch('data/ingredients.json').then(r => r.json())
  ]);

  const ingredientMap = Object.fromEntries(
    ingredients.map(i => [i.id, i])
  );

  const entry = index.find(r => r.id === recipeId);
  const recipe = await fetch(entry.file).then(r => r.json());

  const subRecipes = [];
  if (recipe.subRecipes) {
    for (const sub of recipe.subRecipes) {
      const subEntry = index.find(r => r.id === sub.recipeId);
      const subRecipe = await fetch(subEntry.file).then(r => r.json());
      subRecipes.push(subRecipe);
    }
  }

  const recipeTotals = Object.fromEntries(
    recipe.ingredients.map(i => [i.ingredientId, i.totalQty])
  );

  renderRecipe(recipe, subRecipes, ingredientMap, recipeTotals);
}

/* ---------- MAIN RENDER ---------- */

function renderRecipe(recipe, subRecipes, ingredientMap, recipeTotals) {
  document.getElementById('recipe-name').textContent = recipe.name;

  /* ---------- INGREDIENTS ---------- */
  const ingredientContainer = document.getElementById('ingredient-groups');
  ingredientContainer.innerHTML = `
    ${renderIngredientGroup(recipe, ingredientMap)}
    ${subRecipes.map(sr => renderIngredientGroup(sr, ingredientMap)).join('')}
  `;

  /* ---------- INFO ---------- */
  const infoContainer = document.getElementById('RecipeInfo');
  if (recipe.oven_setting || recipe.prep_time || recipe.cook_time) {
    infoContainer.innerHTML = `
      <div class="recipe-info" style="margin-top:40px;">
        <ul>
          ${recipe.oven_setting ? `<li><strong>Oven:</strong> ${recipe.oven_setting}</li>` : ''}
          ${recipe.prep_time ? `<li><strong>Prep time:</strong> ${recipe.prep_time}</li>` : ''}
          ${recipe.cook_time ? `<li><strong>Cook time:</strong> ${recipe.cook_time}</li>` : ''}
        </ul>
      </div>
    `;
  } else {
    infoContainer.innerHTML = '';
  }

  /* ---------- METHOD ---------- */
  const methodContainer = document.getElementById('method-steps');
  methodContainer.innerHTML =
    renderSteps(recipe.steps, ingredientMap, subRecipes, recipeTotals);
}

/* ---------- INGREDIENTS ---------- */

function renderIngredientGroup(recipe, ingredientMap) {
  return `
    <h4>${recipe.name}</h4>
    <div class="ingredient-list">
      ${recipe.ingredients.map(i => {
        const ing = ingredientMap[i.ingredientId];
        return `
          <div
            class="ingredient-item"
            data-ingredient-id="${i.ingredientId}"
            onclick="this.classList.toggle('checked')"
          >
            <span class="ingredient-name">${ing.name}</span>
            <span class="ingredient-qty">${i.totalQty} ${ing.units}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ---------- METHOD STEPS ---------- */

function renderSteps(steps, ingredientMap, subRecipes, recipeTotals, isSub = false) {
  return steps.map(step => {
    let html = `
      <li class="method-step ${isSub ? 'sub-step' : ''}">
        <div class="step-uses">
          ${renderUses(step, ingredientMap, recipeTotals)}
        </div>
        <div class="step-text">
          ${step.text}
        </div>
      </li>
    `;

    if (step.usesSubRecipe) {
      const sub = subRecipes.find(r => r.id === step.usesSubRecipe.recipeId);
      if (sub) {
        const subTotals = Object.fromEntries(
          sub.ingredients.map(i => [i.ingredientId, i.totalQty])
        );

        html += `
          <ol class="method sub-method">
            ${renderSteps(sub.steps, ingredientMap, [], subTotals, true)}
          </ol>
        `;
      }
    }

    return html;
  }).join('');
}

/* ---------- STEP INGREDIENT USES ---------- */

function renderUses(step, ingredientMap, recipeTotals) {
  if (step.uses && step.uses.length > 0) {
    return `
      <ul>
        ${step.uses.map(u => {
          const ing = ingredientMap[u.ingredientId];
          let totalQty = recipeTotals[u.ingredientId];
          if (totalQty === undefined) totalQty = 1;

          let displayQty;
          if (u.qty <= 1) {
            displayQty = u.qty * totalQty;
          } else {
            displayQty = u.qty;
          }

          displayQty = parseFloat(displayQty.toFixed(2));

          return `<li>${ing.name}: ${displayQty} ${ing.units}</li>`;
        }).join('')}
      </ul>
    `;
  }

  if (step.usesSubRecipe) {
    return `<strong>${step.usesSubRecipe.recipeId.replace(/_/g, ' ')}</strong>`;
  }

  return `<span class="no-uses">—</span>`;
}

/* ---------- INIT ---------- */

loadRecipePage();
