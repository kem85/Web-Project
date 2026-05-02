const userData = window.userData || {};

const DEFAULT_PROFILE = {
  weight: 70,
  height: 170,
  age: 25,
};

function getValidNumber(value, fallback, min, max) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    return fallback;
  }
  return number;
}

function getMyCalories() {
  // Protect the dashboard from corrupted profile/session values.
  // Example: a bad weight value like 500 kg would create a fake 6000+ calorie goal.
  const W = getValidNumber(userData.weight, DEFAULT_PROFILE.weight, 30, 250);
  const H = getValidNumber(userData.height, DEFAULT_PROFILE.height, 100, 230);
  const A = getValidNumber(userData.age, DEFAULT_PROFILE.age, 10, 100);
  const gender = String(userData.gender || "male").toLowerCase();

  let bmr = 10 * W + 6.25 * H - 5 * A;
  bmr += gender === "female" || gender === "woman" ? -161 : 5;

  return Math.round(bmr);
}

const state = {
  calories: getMyCalories(),
  carbsPercent: 50,
  fatPercent: 30,
  proteinPercent: 20,
  foodCalories: 0,
  exerciseCalories: 0,
};

function roundValue(value) {
  return Math.round(value);
}

function calculateMacroGrams(calories, percentage, caloriesPerGram) {
  return roundValue((calories * (percentage / 100)) / caloriesPerGram);
}

function formatTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function getTotalPercent() {
  return state.carbsPercent + state.fatPercent + state.proteinPercent;
}

function syncSelectValues(elements) {
  elements.carbPercent.value = String(state.carbsPercent);
  elements.fatPercent.value = String(state.fatPercent);
  elements.proteinPercent.value = String(state.proteinPercent);
}

function updateMacroTable(elements) {
  const totalPercent = getTotalPercent();

  elements.carbGram.textContent = calculateMacroGrams(state.calories, state.carbsPercent, 4);
  elements.fatGram.textContent = calculateMacroGrams(state.calories, state.fatPercent, 9);
  elements.proteinGram.textContent = calculateMacroGrams(state.calories, state.proteinPercent, 4);
  elements.totalPercent.textContent = totalPercent;
  elements.totalCalories.textContent = roundValue(state.calories * (totalPercent / 100));
}

function updateCaloriesCard(elements) {
  const remainingCalories = state.calories - state.foodCalories + state.exerciseCalories;
  const consumedCalories = Math.max(0, state.foodCalories - state.exerciseCalories);
  const progress = state.calories ? Math.min(consumedCalories / state.calories, 1) : 0;
  const progressDegrees = `${Math.round(progress * 360)}deg`;

  elements.remainingCalories.textContent = remainingCalories;
  elements.goalCalories.textContent = state.calories;
  elements.foodCalories.textContent = state.foodCalories;
  elements.exerciseCalories.textContent = state.exerciseCalories;
  elements.circle.style.setProperty("--progress-deg", progressDegrees);
}

function updateHeaderContent() {
  const usernameElement = document.getElementById("username");
  const userPhotoElement = document.getElementById("userPhoto");

  if (usernameElement) {
    usernameElement.textContent = userData.username || "User";
  }

  if (userPhotoElement) {
    userPhotoElement.src = "/Profile/muslim%20cat.jpg";
  }
}

function getStateKeyFromSelectId(selectId) {
  const idMap = {
    carbPercent: "carbsPercent",
    fatPercent: "fatPercent",
    proteinPercent: "proteinPercent",
  };

  return idMap[selectId];
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function loadFoodCaloriesFromDiary(elements) {
  try {
    const response = await fetch(`/api/diary?date=${encodeURIComponent(getTodayKey())}`);
    if (!response.ok) throw new Error("Diary API failed.");

    const data = await response.json();
    state.foodCalories = Math.round(Number(data?.totals?.calories) || 0);

    // Only sync food intake from the Food Diary.
    // Do NOT replace the Home calorie goal from diary data, because notes/profile fields
    // can accidentally affect the server goal and make the number jump.

    updateMacroTable(elements);
    updateCaloriesCard(elements);
  } catch (error) {
    updateCaloriesCard(elements);
  }
}

function initDashboard() {
  const elements = {
    pageTitle: document.getElementById("pageTitle"),
    caloriesInput: document.getElementById("caloriesInput"),
    carbPercent: document.getElementById("carbPercent"),
    fatPercent: document.getElementById("fatPercent"),
    proteinPercent: document.getElementById("proteinPercent"),
    carbGram: document.getElementById("carbGram"),
    fatGram: document.getElementById("fatGram"),
    proteinGram: document.getElementById("proteinGram"),
    totalPercent: document.getElementById("totalPercent"),
    totalCalories: document.getElementById("totalCalories"),
    remainingCalories: document.getElementById("remainingCalories"),
    goalCalories: document.getElementById("goalCalories"),
    foodCalories: document.getElementById("foodCalories"),
    exerciseCalories: document.getElementById("exerciseCalories"),
    circle: document.getElementById("calorieCircle"),
  };

  elements.caloriesInput.value = state.calories;
  elements.pageTitle.textContent = formatTodayLabel();

  syncSelectValues(elements);
  updateMacroTable(elements);
  updateCaloriesCard(elements);
  updateHeaderContent();
  loadFoodCaloriesFromDiary(elements);

  window.addEventListener("focus", () => loadFoodCaloriesFromDiary(elements));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadFoodCaloriesFromDiary(elements);
  });

  const handlePercentChange = (event) => {
    const stateKey = getStateKeyFromSelectId(event.target.id);
    const oldValue = state[stateKey];
    state[stateKey] = Number(event.target.value);

    if (getTotalPercent() > 100) {
      state[stateKey] = oldValue;
      event.target.value = String(oldValue);
      window.alert("Total macro percentages cannot exceed 100%.");
      return;
    }

    updateMacroTable(elements);
  };

  elements.carbPercent.addEventListener("change", handlePercentChange);
  elements.fatPercent.addEventListener("change", handlePercentChange);
  elements.proteinPercent.addEventListener("change", handlePercentChange);
}

document.addEventListener("DOMContentLoaded", initDashboard);
