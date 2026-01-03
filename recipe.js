const params = new URLSearchParams(window.location.search);
const recipeId = params.get('id');

async function loadRecipePage() {
  // Load recipe index and ingredients
  const [index, ingredients] = await Promise.all([
    fetch('data/recipe-index.json').then(r => r.json()),
    fetch('data/ingredients.json').then(r => r.json())
  ]);

  // Map for quick ingredient lookups
  const ingredientMap = Object.fromEntries(
    ingredients.map(i => [i.id, i])
  );

  // Load main recipe
  const entry = index.find(r => r.id === recipeId);
  const recipe = await fetch(entry.file).then(r => r.json());

  // Load sub-recipes (first level only)
  const subRecipes = [];
  if (recipe.subRecipes) {
    for (const sub of recipe.subRecipes) {
      const subEntry = index.find(r => r.id === sub.recipeId);
      const subRecipe = await fetch(subEntry.file).then(r => r.json());
      subRecipes.push(subRecipe);
    }
  }

  // Create map of totalQty for main recipe
  const recipeTotals = Object.fromEntries(
    recipe.ingredients.map(i => [i.ingredientId, i.totalQty])
  );

  renderRecipe(recipe, subRecipes, ingredientMap, recipeTotals);
}

function renderRecipe(recipe, subRecipes, ingredientMap, recipeTotals) {
  document.getElementById('recipe-name').textContent = recipe.name;
  const content = document.getElementById('recipe-content');

  // Build a small info section (oven setting, prep/cook times)
  let infoHtml = '';
  if (recipe.oven_setting || recipe.prep_time || recipe.cook_time) {
    infoHtml = `
      <div class="recipe-info" style="margin-top:40px;">
        <ul>
          ${recipe.oven_setting ? `<li><strong>Oven:</strong> ${recipe.oven_setting}</li>` : ''}
          ${recipe.prep_time ? `<li><strong>Prep time:</strong> ${recipe.prep_time}</li>` : ''}
          ${recipe.cook_time ? `<li><strong>Cook time:</strong> ${recipe.cook_time}</li>` : ''}
        </ul>
      </div>
    `;
  }

  content.innerHTML = `
    <h3>Ingredients</h3>
    ${renderIngredientGroup(recipe, ingredientMap)}
    ${subRecipes.map(sr => renderIngredientGroup(sr, ingredientMap)).join('')}

    ${infoHtml}

    <h3 style="margin-top:40px;">Method</h3>
    <ol class="method">
      ${renderSteps(recipe.steps, ingredientMap, subRecipes, recipeTotals)}
    </ol>
  `;
}


// Render a recipe's ingredient list with title
function renderIngredientGroup(recipe, ingredientMap) {
  return `
    <h4>${recipe.name}</h4>
    <ul>
      ${recipe.ingredients.map(i => {
        const ing = ingredientMap[i.ingredientId];
        return `<li>${ing.name}: ${i.totalQty} ${ing.units}</li>`;
      }).join('')}
    </ul>
  `;
}

// Recursively render steps (handles sub-recipes)
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

    // Inline sub-recipe steps
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

// Render ingredients used in a single step, supports fractional qty
function renderUses(step, ingredientMap, recipeTotals) {
  if (step.uses) {
    return `
      <ul>
        ${step.uses.map(u => {
          const ing = ingredientMap[u.ingredientId];
          let totalQty = recipeTotals[u.ingredientId];
          if (totalQty === undefined) totalQty = 1; // fallback

          let displayQty;
          if (u.qty <= 1) {
            displayQty = u.qty * totalQty;
          } else {
            displayQty = u.qty;
          }

          // Preserve decimals, max 2 places
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

// Start page load
loadRecipePage();
