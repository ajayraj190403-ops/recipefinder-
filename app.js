const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const recipeGrid = document.getElementById('recipeGrid');
const loader = document.getElementById('loader');
const modal = document.getElementById('recipeModal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close-btn');

// Fetch random recipes on load
window.addEventListener('DOMContentLoaded', () => fetchRecipes(''));

searchBtn.addEventListener('click', () => fetchRecipes(searchInput.value));
searchInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') fetchRecipes(searchInput.value); 
});

async function fetchRecipes(query) {
    loader.style.display = 'block';
    recipeGrid.innerHTML = '';
    
    // Using TheMealDB API
    const url = query ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}` 
                      : `https://www.themealdb.com/api/json/v1/1/search.php?s=chicken`; 

    try {
        const response = await fetch(url);
        const data = await response.json();
        loader.style.display = 'none';
        
        if (data.meals) {
            displayRecipes(data.meals);
        } else {
            recipeGrid.innerHTML = '<p>No recipes found. Try another search!</p>';
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        loader.style.display = 'none';
    }
}

function displayRecipes(meals) {
    meals.forEach(meal => {
        const card = document.createElement('div');
        card.classList.add('recipe-card');
        card.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="recipe-info">
                <h3>${meal.strMeal}</h3>
                <div class="tags">${meal.strCategory} | ${meal.strArea}</div>
                <div class="rating">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                    (124 reviews)
                </div>
            </div>
        `;
        card.addEventListener('click', () => openModal(meal));
        recipeGrid.appendChild(card);
    });
}

function openModal(meal) {
    // 1. Extract ingredients into a structured array
    let baseIngredients = [];
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== '') {
            baseIngredients.push({
                ingredient: meal[`strIngredient${i}`],
                measure: meal[`strMeasure${i}`]
            });
        }
    }

    // 2. Build the Modal UI with Serving Controls
    modalBody.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <div class="tags" style="margin-bottom: 2rem;">${meal.strCategory} | ${meal.strArea}</div>
        <div class="modal-grid">
            <div>
                <img src="${meal.strMealThumb}" class="modal-img" alt="${meal.strMeal}">
                <div style="margin-top: 1rem; display: flex; gap: 10px;">
                    <button style="padding: 10px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;"><i class="fas fa-heart"></i> Save</button>
                    <button style="padding: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;"><i class="fas fa-share-alt"></i> Share</button>
                </div>
            </div>
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <h3>Ingredients</h3>
                    
                    <div style="display: flex; align-items: center; gap: 10px; background: #f5f6fa; padding: 5px 15px; border-radius: 20px;">
                        <span>Servings:</span>
                        <button id="btnMinus" style="border:none; background:none; font-size: 1.2rem; cursor:pointer; color: #ff6b6b;"><b>-</b></button>
                        <span id="servingCount" style="font-weight: bold; width: 20px; text-align: center;">2</span>
                        <button id="btnPlus" style="border:none; background:none; font-size: 1.2rem; cursor:pointer; color: #ff6b6b;"><b>+</b></button>
                    </div>
                </div>

                <ul id="ingredientList" style="margin-left: 1.5rem; line-height: 1.8;">
                    </ul>
                <h3 style="margin-top: 2rem;">Cooking Instructions</h3>
                <p style="margin-top: 1rem; line-height: 1.8; white-space: pre-line;">${meal.strInstructions}</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // 3. Logic to update the ingredients list
    const ingredientListEl = document.getElementById('ingredientList');
    const servingCountEl = document.getElementById('servingCount');
    let currentServings = 2; // Default starting servings

    function renderIngredients() {
        const multiplier = currentServings / 2; // Assuming the base recipe is for 2 people
        ingredientListEl.innerHTML = baseIngredients.map(item => {
            let newMeasure = scaleMeasure(item.measure, multiplier);
            return `<li><b>${newMeasure}</b> ${item.ingredient}</li>`;
        }).join('');
    }

    // Initial render
    renderIngredients();

    // 4. Attach Event Listeners to the +/- buttons
    document.getElementById('btnPlus').addEventListener('click', () => {
        if (currentServings < 24) { // Max limit
            currentServings++;
            servingCountEl.innerText = currentServings;
            renderIngredients();
        }
    });

    document.getElementById('btnMinus').addEventListener('click', () => {
        if (currentServings > 1) { // Prevent 0 or negative
            currentServings--;
            servingCountEl.innerText = currentServings;
            renderIngredients();
        }
    });
}

// Helper Function: Parses fractions/decimals and multiplies them
function scaleMeasure(measureStr, multiplier) {
    if (!measureStr) return '';
    
    // Regex to match leading numbers, fractions (1/2), or mixed fractions (1 1/2)
    const match = measureStr.trim().match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)(.*)/);
    
    if (!match) return measureStr; 
    
    let numStr = match[1].trim();
    const restOfString = match[2];
    let value = 0;
    
    // Convert fractions to decimals for math
    if (numStr.includes('/')) {
        const parts = numStr.split(' ');
        if (parts.length === 2) { 
            const frac = parts[1].split('/');
            value = parseInt(parts[0]) + (parseInt(frac[0]) / parseInt(frac[1]));
        } else { 
            const frac = numStr.split('/');
            value = parseInt(frac[0]) / parseInt(frac[1]);
        }
    } else {
        value = parseFloat(numStr);
    }
    
    // Multiply and format back to a clean string
    // Uses unary plus (+) to drop unnecessary trailing zeros (e.g., 2.00 becomes 2)
    let scaledValue = +(value * multiplier).toFixed(2); 
    
    return `${scaledValue}${restOfString}`;
}

// Close Modal Logic
closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { 
    if (e.target === modal) modal.style.display = 'none'; 
});
