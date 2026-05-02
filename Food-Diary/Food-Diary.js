const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

const DAILY_GOALS = {
  calories: 2140,
  carbs: 268,
  fat: 71,
  protein: 107,
  sodium: 2300,
  sugar: 80,
};



const FALLBACK_FOODS = [
  { name: "Egg, boiled", servingSize: "1 large egg", calories: 78, carbs: 0.6, fat: 5.3, protein: 6.3, sodium: 62, sugar: 0.6 },
  { name: "Egg, fried", servingSize: "1 large egg", calories: 90, carbs: 0.4, fat: 7, protein: 6.3, sodium: 95, sugar: 0.4 },
  { name: "White rice, cooked", servingSize: "1 cup cooked", calories: 205, carbs: 45, fat: 0.4, protein: 4.3, sodium: 2, sugar: 0.1 },
  { name: "Brown rice, cooked", servingSize: "1 cup cooked", calories: 216, carbs: 45, fat: 1.8, protein: 5, sodium: 10, sugar: 0.7 },
  { name: "Chicken breast, cooked", servingSize: "100 g", calories: 165, carbs: 0, fat: 3.6, protein: 31, sodium: 74, sugar: 0 },
  { name: "Chicken thigh, cooked", servingSize: "100 g", calories: 209, carbs: 0, fat: 10.9, protein: 26, sodium: 82, sugar: 0 },
  { name: "Banana", servingSize: "1 medium", calories: 105, carbs: 27, fat: 0.4, protein: 1.3, sodium: 1, sugar: 14 },
  { name: "Apple", servingSize: "1 medium", calories: 95, carbs: 25, fat: 0.3, protein: 0.5, sodium: 2, sugar: 19 },
  { name: "Milk, whole", servingSize: "1 cup", calories: 149, carbs: 12, fat: 8, protein: 7.7, sodium: 105, sugar: 12 },
  { name: "Milk, low fat", servingSize: "1 cup", calories: 102, carbs: 12, fat: 2.4, protein: 8.2, sodium: 107, sugar: 12 },
  { name: "Bread, white", servingSize: "1 slice", calories: 80, carbs: 15, fat: 1, protein: 2.7, sodium: 150, sugar: 1.5 },
  { name: "Bread, whole wheat", servingSize: "1 slice", calories: 81, carbs: 14, fat: 1.1, protein: 4, sodium: 144, sugar: 1.6 },
  { name: "Oats", servingSize: "40 g dry", calories: 150, carbs: 27, fat: 3, protein: 5, sodium: 0, sugar: 1 },
  { name: "Pasta, cooked", servingSize: "1 cup cooked", calories: 200, carbs: 42, fat: 1.2, protein: 7, sodium: 1, sugar: 1.2 },
  { name: "Potato, baked", servingSize: "1 medium", calories: 161, carbs: 37, fat: 0.2, protein: 4.3, sodium: 17, sugar: 2 },
  { name: "Greek yogurt, plain", servingSize: "170 g", calories: 100, carbs: 6, fat: 0.7, protein: 17, sodium: 61, sugar: 5 },
  { name: "Tuna, canned in water", servingSize: "100 g", calories: 116, carbs: 0, fat: 1, protein: 26, sodium: 338, sugar: 0 },
  { name: "Salmon, cooked", servingSize: "100 g", calories: 206, carbs: 0, fat: 12, protein: 22, sodium: 59, sugar: 0 },
  { name: "Beef steak, cooked", servingSize: "100 g", calories: 271, carbs: 0, fat: 19, protein: 25, sodium: 58, sugar: 0 },
  { name: "Almonds", servingSize: "28 g", calories: 164, carbs: 6, fat: 14, protein: 6, sodium: 0, sugar: 1.2 },
  { name: "Peanut butter", servingSize: "2 tbsp", calories: 188, carbs: 6, fat: 16, protein: 8, sodium: 147, sugar: 3 },
  { name: "Orange", servingSize: "1 medium", calories: 62, carbs: 15, fat: 0.2, protein: 1.2, sodium: 0, sugar: 12 },
  { name: "Tomato", servingSize: "1 medium", calories: 22, carbs: 4.8, fat: 0.2, protein: 1.1, sodium: 6, sugar: 3.2 },
  { name: "Cucumber", servingSize: "100 g", calories: 15, carbs: 3.6, fat: 0.1, protein: 0.7, sodium: 2, sugar: 1.7 },
  { name: "Lentils, cooked", servingSize: "1 cup cooked", calories: 230, carbs: 40, fat: 0.8, protein: 18, sodium: 4, sugar: 3.6 },
];

const diaryState = {
  foodsByDate: {},
  waterByDate: {},
  notesByDate: {},
};

let selectedDate = new Date();
let activeMeal = "Breakfast";
let currentResults = [];
let selectedDateLocked = false;
let selectedDateLockReason = "";

function getDateKey(date = selectedDate) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? number.toLocaleString() : number.toFixed(1);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getLockMessage() {
  return selectedDateLockReason || "This diary entry is locked. Only today's unfinished entry can be changed.";
}

function showLockedMessage() {
  window.alert(getLockMessage());
}

function canEditSelectedDate() {
  return !selectedDateLocked;
}

function getFoodsForDate() {
  const key = getDateKey();

  if (!diaryState.foodsByDate[key]) {
    diaryState.foodsByDate[key] = MEALS.reduce((meals, meal) => {
      meals[meal] = [];
      return meals;
    }, {});
  }

  return diaryState.foodsByDate[key];
}

function emptyNutrition() {
  return {
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    sodium: 0,
    sugar: 0,
  };
}

function addNutrition(total, food) {
  total.calories += Number(food.calories) || 0;
  total.carbs += Number(food.carbs) || 0;
  total.fat += Number(food.fat) || 0;
  total.protein += Number(food.protein) || 0;
  total.sodium += Number(food.sodium) || 0;
  total.sugar += Number(food.sugar) || 0;
  return total;
}

function getMealTotal(foods) {
  return foods.reduce(addNutrition, emptyNutrition());
}

function getDailyTotal(foodsByMeal) {
  return MEALS.reduce((total, meal) => {
    return foodsByMeal[meal].reduce(addNutrition, total);
  }, emptyNutrition());
}

function buildFoodRow(food, meal, index) {
  const removeButton = canEditSelectedDate()
    ? `<button class="remove-food" type="button" data-action="remove-food" data-meal="${meal}" data-index="${index}">Remove</button>`
    : `<span class="locked-food-label">Locked</span>`;

  return `
    <tr class="food-row">
      <td>
        <div class="food-name">${escapeHTML(food.name)}</div>
        <div class="serving-size">${escapeHTML(food.servingSize || "Serving size not available")}</div>
        ${removeButton}
      </td>
      <td>${formatNumber(food.calories)}</td>
      <td>${formatNumber(food.carbs)}</td>
      <td>${formatNumber(food.fat)}</td>
      <td>${formatNumber(food.protein)}</td>
      <td>${formatNumber(food.sodium)}</td>
      <td>${formatNumber(food.sugar)}</td>
    </tr>
  `;
}

function buildMealTotalRow(foods) {
  const total = getMealTotal(foods);

  return `
    <tr class="meal-total-row">
      <td>Meal Total</td>
      <td>${formatNumber(total.calories)}</td>
      <td>${formatNumber(total.carbs)}</td>
      <td>${formatNumber(total.fat)}</td>
      <td>${formatNumber(total.protein)}</td>
      <td>${formatNumber(total.sodium)}</td>
      <td>${formatNumber(total.sugar)}</td>
    </tr>
  `;
}

function renderMealRows() {
  const tbody = document.getElementById("mealRows");
  const foodsByMeal = getFoodsForDate();

  tbody.innerHTML = MEALS.map((meal, mealIndex) => {
    const foods = foodsByMeal[meal];
    const sectionHeader = mealIndex === 0 ? "" : `
      <tr class="section-header">
        <td colspan="7">${meal}</td>
      </tr>
    `;

    const foodRows = foods.length
      ? foods.map((food, index) => buildFoodRow(food, meal, index)).join("")
      : `
        <tr class="empty-food-row">
          <td colspan="7">No foods added yet</td>
        </tr>
      `;

    return `
      ${sectionHeader}
      ${foodRows}
      ${buildMealTotalRow(foods)}
      <tr class="action-row">
        <td>
          <button class="add-food-link" type="button" data-action="add-food" data-meal="${meal}" ${selectedDateLocked ? "disabled" : ""}>
            ${selectedDateLocked ? "Entry Locked" : "Add Food"}
          </button>
        </td>
        <td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
    `;
  }).join("");

  updateFooterTotals(foodsByMeal);
}

function updateFooterTotals(foodsByMeal) {
  const total = getDailyTotal(foodsByMeal);

  Object.keys(DAILY_GOALS).forEach((key) => {
    const totalCell = document.querySelector(`[data-total="${key}"]`);
    const remainingCell = document.querySelector(`[data-remaining="${key}"]`);
    const goalCell = document.querySelector(`[data-goal="${key}"]`);
    const remaining = DAILY_GOALS[key] - total[key];

    if (goalCell) goalCell.textContent = formatNumber(DAILY_GOALS[key]);
    if (totalCell) totalCell.textContent = formatNumber(total[key]);
    if (remainingCell) {
      remainingCell.textContent = formatNumber(remaining);
      remainingCell.classList.toggle("negative", remaining < 0);
      remainingCell.classList.toggle("positive", remaining >= 0);
    }
  });
}

function applyServerDiaryPayload(payload) {
  if (!payload) return;

  selectedDateLocked = Boolean(payload.locked);
  selectedDateLockReason = payload.lockReason || "";

  const key = getDateKey();
  if (Object.prototype.hasOwnProperty.call(payload, "waterCups")) {
    diaryState.waterByDate[key] = Number(payload.waterCups) || 0;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "notes")) {
    diaryState.notesByDate[key] = payload.notes || "";
  }

  if (payload.goals) {
    Object.keys(DAILY_GOALS).forEach((key) => {
      if (Number.isFinite(Number(payload.goals[key]))) {
        DAILY_GOALS[key] = Number(payload.goals[key]);
      }
    });
  }

  if (payload.meals) {
    diaryState.foodsByDate[key] = MEALS.reduce((meals, meal) => {
      meals[meal] = Array.isArray(payload.meals[meal])
        ? payload.meals[meal].map(normalizeFood)
        : [];
      return meals;
    }, {});
  }
}

async function loadDiaryFromServer() {
  const key = getDateKey();

  try {
    const response = await fetch(`/api/diary?date=${encodeURIComponent(key)}`);
    if (!response.ok) throw new Error("Diary API failed.");
    const payload = await response.json();
    applyServerDiaryPayload(payload);
  } catch (error) {
    // If Flask is not available, keep the page usable but still lock non-today dates.
    const todayKey = new Date().toISOString().slice(0, 10);
    selectedDateLocked = key !== todayKey;
    selectedDateLockReason = selectedDateLocked
      ? "This day is not today, so the entry is locked."
      : "";
    getFoodsForDate();
  }
}

function openFoodModal(meal) {
  if (!canEditSelectedDate()) {
    showLockedMessage();
    return;
  }

  activeMeal = meal;
  currentResults = [];

  document.getElementById("activeMealName").textContent = meal;
  document.getElementById("foodSearchInput").value = "";
  document.getElementById("foodSearchStatus").textContent = "";
  document.getElementById("foodResults").innerHTML = "";
  document.getElementById("foodSearchModal").classList.remove("hidden");
  document.getElementById("foodSearchInput").focus();
}

function closeFoodModal() {
  document.getElementById("foodSearchModal").classList.add("hidden");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function pickNutrient(nutrients, names) {
  for (const name of names) {
    const value = toNumber(nutrients?.[name]);
    if (value > 0) return value;
  }
  return 0;
}

function normalizeOpenFoodFactsProduct(product) {
  const nutrients = product.nutriments || {};
  const name = product.product_name || product.generic_name || product.abbreviated_product_name;

  if (!name) return null;

  const calories = pickNutrient(nutrients, [
    "energy-kcal_serving",
    "energy-kcal_100g",
    "energy-kcal",
  ]);

  if (!calories) return null;

  const usedServingValue = toNumber(nutrients["energy-kcal_serving"]) > 0;
  const servingSize = product.serving_size || (usedServingValue ? "1 serving" : "100 g");
  const brand = product.brands ? ` (${product.brands.split(",")[0]})` : "";

  return {
    name: `${name}${brand}`,
    servingSize,
    calories: Math.round(calories),
    carbs: pickNutrient(nutrients, ["carbohydrates_serving", "carbohydrates_100g", "carbohydrates"]),
    fat: pickNutrient(nutrients, ["fat_serving", "fat_100g", "fat"]),
    protein: pickNutrient(nutrients, ["proteins_serving", "proteins_100g", "proteins"]),
    sodium: Math.round(pickNutrient(nutrients, ["sodium_serving", "sodium_100g", "sodium"]) * 1000),
    sugar: pickNutrient(nutrients, ["sugars_serving", "sugars_100g", "sugars"]),
  };
}

function normalizeFood(food) {
  return {
    name: food.name,
    servingSize: food.servingSize || "Serving size not available",
    calories: toNumber(food.calories),
    carbs: toNumber(food.carbs),
    fat: toNumber(food.fat),
    protein: toNumber(food.protein),
    sodium: toNumber(food.sodium),
    sugar: toNumber(food.sugar),
  };
}

function searchFallbackFoods(query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  return FALLBACK_FOODS.filter((food) => {
    const searchText = `${food.name} ${food.servingSize}`.toLowerCase();
    return queryWords.every((word) => searchText.includes(word)) ||
      queryWords.some((word) => searchText.includes(word));
  }).slice(0, 10).map(normalizeFood);
}

async function searchFoods(query) {
  const proxyUrl = `/api/food-search?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const data = await response.json();
      const foods = (data.foods || [])
        .map(normalizeFood)
        .filter((food) => food.name && food.calories);

      if (foods.length) return foods;
    }
  } catch (error) {
    // Flask is not running or the backend route is unavailable.
  }

  try {
    const directUrl = new URL("https://world.openfoodfacts.org/api/v2/search");
    directUrl.searchParams.set("search_terms", query);
    directUrl.searchParams.set("fields", "product_name,generic_name,abbreviated_product_name,brands,serving_size,nutriments");
    directUrl.searchParams.set("page_size", "20");
    directUrl.searchParams.set("sort_by", "unique_scans_n");

    const response = await fetch(directUrl.toString());
    if (!response.ok) throw new Error("Food API request failed.");

    const data = await response.json();
    const onlineFoods = (data.products || [])
      .map(normalizeOpenFoodFactsProduct)
      .filter(Boolean);

    const fallbackFoods = searchFallbackFoods(query);
    const mergedFoods = [];
    const seenNames = new Set();

    [...onlineFoods, ...fallbackFoods].forEach((food) => {
      const key = food.name.toLowerCase();
      if (!seenNames.has(key)) {
        mergedFoods.push(food);
        seenNames.add(key);
      }
    });

    return mergedFoods.slice(0, 10);
  } catch (error) {
    const fallbackFoods = searchFallbackFoods(query);
    if (fallbackFoods.length) return fallbackFoods;
    throw error;
  }
}

function renderSearchResults(foods) {
  const resultsContainer = document.getElementById("foodResults");
  resultsContainer.innerHTML = "";

  foods.forEach((food, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "food-result-item";
    button.dataset.index = String(index);

    button.innerHTML = `
      <span class="result-name">${escapeHTML(food.name)}</span>
      <span class="result-meta">${formatNumber(food.calories)} kcal${food.servingSize ? ` • ${escapeHTML(food.servingSize)}` : ""}</span>
    `;

    resultsContainer.appendChild(button);
  });
}

async function handleFoodSearch(event) {
  event.preventDefault();

  const input = document.getElementById("foodSearchInput");
  const status = document.getElementById("foodSearchStatus");
  const resultsContainer = document.getElementById("foodResults");
  const query = input.value.trim();

  if (query.length < 2) {
    status.textContent = "Type at least 2 characters to search.";
    resultsContainer.innerHTML = "";
    return;
  }

  status.textContent = "Loading foods...";
  status.className = "search-status loading";
  resultsContainer.innerHTML = "";

  try {
    currentResults = await searchFoods(query);

    if (!currentResults.length) {
      status.textContent = "No foods found. Try a more specific name.";
      status.className = "search-status";
      return;
    }

    status.textContent = `Found ${currentResults.length} result${currentResults.length === 1 ? "" : "s"}.`;
    status.className = "search-status";
    renderSearchResults(currentResults);
  } catch (error) {
    console.error(error);
    status.textContent = "Food search failed. Check your internet connection or run the Flask server, then try again.";
    status.className = "search-status error";
  }
}

async function addFoodToMeal(food) {
  if (!canEditSelectedDate()) {
    showLockedMessage();
    closeFoodModal();
    return;
  }

  try {
    const response = await fetch("/api/diary/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: getDateKey(), meal: activeMeal, food }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || "Could not add food to server.");
    }
    const payload = await response.json();
    applyServerDiaryPayload(payload);
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes("locked")) {
      selectedDateLocked = true;
      selectedDateLockReason = error.message;
      showLockedMessage();
      return;
    }
    const foodsByMeal = getFoodsForDate();
    foodsByMeal[activeMeal].push({ ...food, id: Date.now() });
  }

  renderMealRows();
  closeFoodModal();
}

async function removeFoodFromMeal(meal, index) {
  if (!canEditSelectedDate()) {
    showLockedMessage();
    return;
  }

  try {
    const response = await fetch("/api/diary/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: getDateKey(), meal, index }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || "Could not remove food from server.");
    }
    const payload = await response.json();
    applyServerDiaryPayload(payload);
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes("locked")) {
      selectedDateLocked = true;
      selectedDateLockReason = error.message;
      showLockedMessage();
      renderMealRows();
      return;
    }
    const foodsByMeal = getFoodsForDate();
    foodsByMeal[meal].splice(index, 1);
  }

  renderMealRows();
}

function updateLockUI() {
  const container = document.querySelector(".diary-container");
  const completeText = document.querySelector(".complete-text");
  const completeButton = document.querySelector(".btn-complete");
  const customInput = document.querySelector(".custom-cups");
  const addCustomButton = document.querySelector(".btn-add");
  const quickAddButtons = document.querySelectorAll(".quick-add button");
  const notesArea = document.querySelector(".food-notes textarea");
  const editNote = document.querySelector(".edit-note");

  container?.classList.toggle("locked-day", selectedDateLocked);

  if (completeText) {
    completeText.textContent = selectedDateLocked
      ? getLockMessage()
      : "When you're finished logging all foods and exercise for this day, click here:";
  }

  if (completeButton) {
    completeButton.disabled = selectedDateLocked;
    completeButton.textContent = selectedDateLocked ? "Entry Locked" : "Complete This Entry";
  }

  if (customInput) customInput.disabled = selectedDateLocked;
  if (addCustomButton) addCustomButton.disabled = selectedDateLocked;
  quickAddButtons.forEach((button) => {
    button.disabled = selectedDateLocked;
  });

  if (notesArea) {
    notesArea.disabled = selectedDateLocked;
    notesArea.placeholder = selectedDateLocked ? "This day is locked." : "Write a note...";
  }

  if (editNote) {
    editNote.classList.toggle("disabled-link", selectedDateLocked);
  }
}

function renderWaterAndNotes() {
  const key = getDateKey();
  const waterAmount = document.querySelector(".water-amount");
  const notesArea = document.querySelector(".food-notes textarea");
  const cups = Number(diaryState.waterByDate[key] || 0);

  waterAmount.innerHTML = canEditSelectedDate()
    ? `${formatNumber(cups)} cups <a href="#" id="resetWater">✏️</a>`
    : `${formatNumber(cups)} cups <span class="locked-food-label">Locked</span>`;

  notesArea.value = diaryState.notesByDate[key] || "";

  const resetWater = document.getElementById("resetWater");
  if (resetWater) {
    resetWater.addEventListener("click", async (event) => {
      event.preventDefault();
      if (!canEditSelectedDate()) {
        showLockedMessage();
        return;
      }
      await updateWaterOnServer(0, "reset");
    });
  }

  updateLockUI();
}

async function updateWaterOnServer(cups, action = "add") {
  if (!canEditSelectedDate()) {
    showLockedMessage();
    return;
  }

  const key = getDateKey();

  try {
    const response = await fetch("/api/diary/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: key, cups, action }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || "Could not update water.");
    }

    const payload = await response.json();
    applyServerDiaryPayload(payload);
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes("locked")) {
      selectedDateLocked = true;
      selectedDateLockReason = error.message;
      showLockedMessage();
    } else if (action === "reset") {
      diaryState.waterByDate[key] = 0;
    } else {
      diaryState.waterByDate[key] = Number(diaryState.waterByDate[key] || 0) + cups;
    }
  }

  renderWaterAndNotes();
}

function addWater(cups) {
  updateWaterOnServer(cups, "add");
}

async function saveNotesToServer(notes) {
  if (!canEditSelectedDate()) return;

  const key = getDateKey();
  diaryState.notesByDate[key] = notes;

  try {
    const response = await fetch("/api/diary/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: key, notes }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || "Could not save notes.");
    }

    const payload = await response.json();
    applyServerDiaryPayload(payload);
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes("locked")) {
      selectedDateLocked = true;
      selectedDateLockReason = error.message;
      showLockedMessage();
      renderWaterAndNotes();
    }
  }
}

async function renderPage() {
  document.querySelector(".current-date").textContent = formatDate(selectedDate);
  await loadDiaryFromServer();
  renderMealRows();
  renderWaterAndNotes();
}

function initFoodDiary() {
  const dateButtons = document.querySelectorAll(".date-controls button");
  const mealRows = document.getElementById("mealRows");
  const modal = document.getElementById("foodSearchModal");
  const searchForm = document.getElementById("foodSearchForm");
  const resultsContainer = document.getElementById("foodResults");
  const quickAddButtons = document.querySelectorAll(".quick-add button");
  const customInput = document.querySelector(".custom-cups");
  const addCustomButton = document.querySelector(".btn-add");
  const notesArea = document.querySelector(".food-notes textarea");
  const completeButton = document.querySelector(".btn-complete");
  const editNote = document.querySelector(".edit-note");
  const changeUnits = document.querySelector(".water-desc a");

  dateButtons[0].addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    renderPage();
  });

  dateButtons[1].addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    renderPage();
  });

  mealRows.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    if (target.dataset.action === "add-food") {
      openFoodModal(target.dataset.meal);
    }

    if (target.dataset.action === "remove-food") {
      removeFoodFromMeal(target.dataset.meal, Number(target.dataset.index));
    }
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.classList.contains("modal-close")) {
      closeFoodModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeFoodModal();
    }
  });

  searchForm.addEventListener("submit", handleFoodSearch);

  resultsContainer.addEventListener("click", (event) => {
    const resultButton = event.target.closest(".food-result-item");
    if (!resultButton) return;

    const food = currentResults[Number(resultButton.dataset.index)];
    if (food) addFoodToMeal(food);
  });

  quickAddButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const cups = Number(button.textContent.match(/\d+/)?.[0] || 0);
      if (cups > 0) addWater(cups);
    });
  });

  addCustomButton.addEventListener("click", () => {
    const cups = Number(customInput.value);

    if (!Number.isFinite(cups) || cups <= 0) {
      window.alert("Please enter a positive number of cups.");
      return;
    }

    addWater(cups);
    customInput.value = "";
  });

  let notesSaveTimer;
  notesArea.addEventListener("input", () => {
    if (!canEditSelectedDate()) {
      showLockedMessage();
      renderWaterAndNotes();
      return;
    }

    diaryState.notesByDate[getDateKey()] = notesArea.value;
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => saveNotesToServer(notesArea.value), 350);
  });

  completeButton.addEventListener("click", async () => {
    if (!canEditSelectedDate()) {
      showLockedMessage();
      return;
    }

    const confirmed = window.confirm("Complete and lock this entry? You will not be able to edit foods, water, or notes for this day.");
    if (!confirmed) return;

    completeButton.textContent = "Completing...";
    completeButton.disabled = true;

    try {
      const response = await fetch("/api/diary/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getDateKey() }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Could not complete entry.");
      }

      const payload = await response.json();
      applyServerDiaryPayload(payload);
    } catch (error) {
      selectedDateLocked = true;
      selectedDateLockReason = error.message || "This entry is locked.";
      showLockedMessage();
    }

    renderMealRows();
    renderWaterAndNotes();
  });

  editNote.addEventListener("click", (event) => {
    event.preventDefault();
    if (!canEditSelectedDate()) {
      showLockedMessage();
      return;
    }
    notesArea.focus();
  });

  changeUnits.addEventListener("click", (event) => {
    event.preventDefault();
    window.alert("Water units are set to cups for this version.");
  });

  renderPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFoodDiary);
} else {
  initFoodDiary();
}
