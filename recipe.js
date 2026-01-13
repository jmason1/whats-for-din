const params = new URLSearchParams(window.location.search);
const recipeId = params.get('id');

/* ---------- SCALING STATE ---------- */

let currentScale = 1;
let currentRecipe = null;
let currentSubRecipes = [];
let currentIngredientMap = {};
let baseRecipeTotals = {};

/* ---------- LOAD ---------- */

async function loadRecipePage() {
  const [index, ingredients] = await Promise.all([
    fetch('data/recipe-index.json').then(r => r.json()),
    fetch('data/ingredients.json').then(r => r.json())
  ]);

  currentIngredientMap = Object.fromEntries(
    ingredients.map(i => [i.id, i])
  );

  const entry = index.find(r => r.id === recipeId);
  currentRecipe = await fetch(entry.file).then(r => r.json());

  currentSubRecipes = [];
  if (currentRecipe.subRecipes) {
    for (const sub of currentRecipe.subRecipes) {
      const subEntry = index.find(r => r.id === sub.recipeId);
      const subRecipe = await fetch(subEntry.file).then(r => r.json());
      currentSubRecipes.push(subRecipe);
    }
  }

  baseRecipeTotals = Object.fromEntries(
    currentRecipe.ingredients.map(i => [i.ingredientId, i.totalQty])
  );

  setupScaleControls();
  renderRecipe(
    currentRecipe,
    currentSubRecipes,
    currentIngredientMap,
    baseRecipeTotals
  );
  
  renderNotes(currentRecipe.notes);
}

/* ---------- SCALE HELPERS ---------- */

function scaleQty(value) {
  return +(value * currentScale).toFixed(2);
}

function setupScaleControls() {
  const buttons = document.querySelectorAll('.scale-controls button');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentScale = parseFloat(btn.dataset.scale);

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      renderRecipe(
        currentRecipe,
        currentSubRecipes,
        currentIngredientMap,
        baseRecipeTotals
      );
    });
  });
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
  if (recipe.oven_setting || recipe.prep_time || recipe.cook_time || recipe.default_quantity != null) {
    infoContainer.innerHTML = `
      <div class="recipe-info">
        <ul>
          ${recipe.oven_setting ? `<li class="Oven"><span class="Type">Oven:</span><span class="Res">${recipe.oven_setting}</span></li>` : ''}
          ${recipe.prep_time ? `<li class="Prep"><span class="Type">Prep:</span><span class="Res">${recipe.prep_time}</span></li>` : ''}
          ${recipe.cook_time ? `<li class="Cook"><span class="Type">Cook:</span><span class="Res">${recipe.cook_time}</span></li>` : ''}
          ${recipe.default_quantity != null ? `<li class="Quantity"><span class="Type">Serves:</span><span class="Res">${scaleQty(recipe.default_quantity)}</span></li>` : ''}
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
    <h3>${recipe.name}</h3>
    <div class="ingredient-list">
      ${recipe.ingredients.map(i => {
        const ing = ingredientMap[i.ingredientId];
        const scaledTotal = scaleQty(i.totalQty);

        return `
          <div
            class="ingredient-item"
            data-ingredient-id="${i.ingredientId}"
            onclick="this.classList.toggle('checked')"
          >
            <div class="ingName">
              <span class="ingTitle">${ing.name}</span>
              ${i.ingNote ? `<span class="ingNote">${i.ingNote}</span>` : ''}
            </div>
            <span class="ingredient-qty">${scaledTotal} ${ing.units}</span>
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
          let baseTotal = recipeTotals[u.ingredientId];
          if (baseTotal === undefined) baseTotal = 1;

          let amount;
          if (u.qty <= 1) {
            amount = baseTotal * u.qty;
          } else {
            amount = u.qty;
          }

          amount = scaleQty(amount);

          return `<li>${ing.name}: ${amount} ${ing.units}</li>`;
        }).join('')}
      </ul>
    `;
  }

  if (step.usesSubRecipe) {
    return `<strong>${step.usesSubRecipe.recipeId.replace(/_/g, ' ')}</strong>`;
  }

  return `<span class="no-uses">—</span>`;
}


/* NOTES */

function renderNotes(notes) {
  const notesEl = document.getElementById('notes');

  if (!notes || notes.length === 0) {
    notesEl.innerHTML = '';
    return;
  }

  notesEl.innerHTML = notes
    .map(n => `<li>${n.text}</li>`)
    .join('');
}


/* ---------- INIT ---------- */

loadRecipePage();
