const STORAGE_KEYS = {
  nutrition: "fitnessTrackerNutrition",
  checkIn: "fitnessTrackerCheckIn",
  profile: "ft_profile",
  credentials: "ft_credentials",
};

const DEFAULT_STATE = {
  calories: 1930,
  carbsPercent: 50,
  fatPercent: 30,
  proteinPercent: 20,
  foodCalories: 0,
  exerciseCalories: 0,
};

function safeParse(key) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error(`Failed to parse localStorage key: ${key}`, error);
    return null;
  }
}

function roundValue(value) {
  return Math.round(value);
}

function loadNutritionState() {
  const savedState = safeParse(STORAGE_KEYS.nutrition);
  const mergedState = { ...DEFAULT_STATE, ...savedState };

  if (getTotalPercent(mergedState) > 100) {
    return { ...DEFAULT_STATE };
  }

  return mergedState;
}

function saveNutritionState(state) {
  localStorage.setItem(STORAGE_KEYS.nutrition, JSON.stringify(state));
}

function getCheckInSummary() {
  const checkInData = safeParse(STORAGE_KEYS.checkIn);

  if (!checkInData || !checkInData.date) {
    return { streak: 1 };
  }

  const today = new Date().toISOString().split("T")[0];
  return {
    streak: checkInData.date === today ? 2 : 1,
  };
}

function getProfileSummary() {
  const profile = safeParse(STORAGE_KEYS.profile) || {};
  const credentials = safeParse(STORAGE_KEYS.credentials) || {};

  return {
    username: profile.name || credentials.name || "User",
    photo: profile.photoDataUrl || "../Profile/muslim cat.jpg",
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
  saveNutritionState(state);

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
    saveNutritionState(state);
  };

  elements.carbPercent.addEventListener("change", handlePercentChange);
  elements.fatPercent.addEventListener("change", handlePercentChange);
  elements.proteinPercent.addEventListener("change", handlePercentChange);
}

document.addEventListener("DOMContentLoaded", initDashboard);
