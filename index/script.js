const data = window.userData;
function getMyCalories() {
  const user = window.userData;
  const W = parseFloat(user.weight) || 70; // Weight
  const H = parseFloat(user.height) || 170; // Height
  const A = parseInt(user.age) || 25;       // Age
  const gender = user.gender.toLowerCase();

  // 3. The Math from your image (Mifflin-St Jeor)
  let bmr = (10 * W) + (6.25 * H) - (5 * A);

  if (gender === 'male' || gender === 'man') {
    bmr = bmr + 5; // Formula for men
  } else {
    bmr = bmr - 161; // Formula for women
  }
  return Math.round(bmr);
}
const DEFAULT_STATE = {
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

function loadNutritionState() {
  return { ...DEFAULT_STATE };
}

function getCheckInSummary() {
  return { streak: 1 };
}

function getProfileSummary() {
  return {
    username: "User",
    photo: "/Profile/muslim_cat.jpg",
  };
}

function calculateMacroGrams(calories, percentage, caloriesPerGram) {
  return roundValue((calories * (percentage / 100)) / caloriesPerGram);
}

function formatTodayLabel() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return formatter.format(new Date());
}

function getTotalPercent(state) {
  return state.carbsPercent + state.fatPercent + state.proteinPercent;
}

function syncSelectValues(state, elements) {
  elements.carbPercent.value = String(state.carbsPercent);
  elements.fatPercent.value = String(state.fatPercent);
  elements.proteinPercent.value = String(state.proteinPercent);
}

function updateMacroTable(state, elements) {
  const totalPercent = getTotalPercent(state);
  const carbsGrams = calculateMacroGrams(state.calories, state.carbsPercent, 4);
  const fatGrams = calculateMacroGrams(state.calories, state.fatPercent, 9);
  const proteinGrams = calculateMacroGrams(state.calories, state.proteinPercent, 4);
  const totalCalories = roundValue(state.calories * (totalPercent / 100));

  elements.carbGram.textContent = carbsGrams;
  elements.fatGram.textContent = fatGrams;
  elements.proteinGram.textContent = proteinGrams;
  elements.totalPercent.textContent = totalPercent;
  elements.totalCalories.textContent = totalCalories;
}

function updateCaloriesCard(state, elements) {
  const remainingCalories =
    state.calories - state.foodCalories + state.exerciseCalories;
  const consumedCalories = Math.max(0, state.foodCalories - state.exerciseCalories);
  const progress = state.calories
    ? Math.min(consumedCalories / state.calories, 1)
    : 0;
  const progressDegrees = roundValue(progress * 360);

  elements.remainingCalories.textContent = remainingCalories;
  elements.goalCalories.textContent = state.calories;
  elements.circle.style.background = `conic-gradient(#1a73e8 0deg, #1a73e8 ${progressDegrees}deg, #e5e5e5 ${progressDegrees}deg, #e5e5e5 360deg)`;
}

function updateHeaderContent() {
  const profile = getProfileSummary();
  const usernameElement = document.getElementById("username");
  const userPhotoElement = document.getElementById("userPhoto");

  if (usernameElement) {
    usernameElement.textContent = profile.username;
  }

  if (userPhotoElement) {
    userPhotoElement.src = profile.photo;
  }
}

function updatePageTitle(elements) {
  elements.pageTitle.textContent = formatTodayLabel();
}

function updateStreak(elements, streakValue) {
  elements.streak.textContent = streakValue;
  elements.streakLabel.textContent =
    streakValue === 1 ? "Day Streak" : "Days Streak";
}

function getStateKeyFromSelectId(selectId) {
  const idMap = {
    carbPercent: "carbsPercent",
    fatPercent: "fatPercent",
    proteinPercent: "proteinPercent",
  };

  return idMap[selectId];
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
    streak: document.getElementById("streak"),
    streakLabel: document.getElementById("streakLabel"),
    circle: document.querySelector(".circle"),
  };

  const state = loadNutritionState();
  const checkInSummary = getCheckInSummary();

  elements.caloriesInput.value = state.calories;
  syncSelectValues(state, elements);
  updatePageTitle(elements);
  updateStreak(elements, checkInSummary.streak);

  updateMacroTable(state, elements);
  updateCaloriesCard(state, elements);
  updateHeaderContent();

  const handlePercentChange = (event) => {
    const nextState = {
      ...state,
      carbsPercent: Number(elements.carbPercent.value),
      fatPercent: Number(elements.fatPercent.value),
      proteinPercent: Number(elements.proteinPercent.value),
    };

    if (getTotalPercent(nextState) > 100) {
      const stateKey = getStateKeyFromSelectId(event.target.id);
      event.target.value = String(state[stateKey]);
      window.alert("Total macro percentages cannot exceed 100%.");
      return;
    }

    state.carbsPercent = nextState.carbsPercent;
    state.fatPercent = nextState.fatPercent;
    state.proteinPercent = nextState.proteinPercent;

    syncSelectValues(state, elements);
    updateMacroTable(state, elements);
  };

  elements.carbPercent.addEventListener("change", handlePercentChange);
  elements.fatPercent.addEventListener("change", handlePercentChange);
  elements.proteinPercent.addEventListener("change", handlePercentChange);
}

document.addEventListener("DOMContentLoaded", initDashboard);
