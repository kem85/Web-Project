const FOOD_DIARY_STORAGE_KEY = "fitnessTrackerFoodDiary";

function safeParseFoodDiary() {
  try {
    const rawValue = localStorage.getItem(FOOD_DIARY_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : { waterByDate: {}, notesByDate: {} };
  } catch (error) {
    console.error("Failed to read food diary data", error);
    return { waterByDate: {}, notesByDate: {} };
  }
}

function saveFoodDiary(data) {
  localStorage.setItem(FOOD_DIARY_STORAGE_KEY, JSON.stringify(data));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function initFoodDiary() {
  const currentDateElement = document.querySelector(".current-date");
  const dateButtons = document.querySelectorAll(".date-controls button");
  const waterAmount = document.querySelector(".water-amount");
  const quickAddButtons = document.querySelectorAll(".quick-add button");
  const customInput = document.querySelector(".custom-cups");
  const addCustomButton = document.querySelector(".btn-add");
  const notesArea = document.querySelector(".food-notes textarea");
  const completeButton = document.querySelector(".btn-complete");

  let selectedDate = new Date();
  let data = safeParseFoodDiary();

  function selectedDateKey() {
    return selectedDate.toISOString().slice(0, 10);
  }

  function render() {
    const key = selectedDateKey();
    const cups = Number(data.waterByDate?.[key] || 0);

    currentDateElement.textContent = formatDate(selectedDate);
    waterAmount.innerHTML = `${cups} cups <a href="#" id="resetWater">✏️</a>`;
    notesArea.value = data.notesByDate?.[key] || "";

    const resetWater = document.getElementById("resetWater");
    resetWater.addEventListener("click", (event) => {
      event.preventDefault();
      data.waterByDate[key] = 0;
      saveFoodDiary(data);
      render();
    });
  }

  function addWater(cups) {
    const key = selectedDateKey();
    data.waterByDate = data.waterByDate || {};
    data.waterByDate[key] = Number(data.waterByDate[key] || 0) + cups;
    saveFoodDiary(data);
    render();
  }

  dateButtons[0].addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    render();
  });

  dateButtons[1].addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    render();
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

  notesArea.addEventListener("input", () => {
    const key = selectedDateKey();
    data.notesByDate = data.notesByDate || {};
    data.notesByDate[key] = notesArea.value;
    saveFoodDiary(data);
  });

  completeButton.addEventListener("click", () => {
    window.alert("Food diary entry saved.");
  });

  render();
}

document.addEventListener("DOMContentLoaded", initFoodDiary);
