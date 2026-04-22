const CHECK_IN_STORAGE_KEY = "fitnessTrackerCheckIn";

function safeParseCheckIn() {
  try {
    const rawValue = localStorage.getItem(CHECK_IN_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error("Failed to parse check-in data", error);
    return null;
  }
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  return `${value}${suffix}`;
}

function getEmptyEntry() {
  return {
    date: "",
    weight: "",
    steps: "",
    neck: "",
    waist: "",
    hips: "",
  };
}

function normalizeCheckInData(savedData) {
  if (!savedData) {
    return {
      currentEntry: getEmptyEntry(),
      previousEntry: getEmptyEntry(),
      history: [],
    };
  }

  return {
    currentEntry: { ...getEmptyEntry(), ...(savedData.currentEntry || {}) },
    previousEntry: { ...getEmptyEntry(), ...(savedData.previousEntry || {}) },
    history: Array.isArray(savedData.history) ? savedData.history : [],
  };
}

function updateLastValues(data, elements) {
  const sourceEntry = data.previousEntry.date
    ? data.previousEntry
    : data.currentEntry;

  elements.lastWeight.textContent = formatValue(sourceEntry.weight, " kg");
  elements.lastNeck.textContent = formatValue(sourceEntry.neck);
  elements.lastWaist.textContent = formatValue(sourceEntry.waist);
  elements.lastHips.textContent = formatValue(sourceEntry.hips);
}

function fillTodayInputs(data, elements) {
  if (data.currentEntry.date !== getTodayDate()) {
    return;
  }

  elements.weightInput.value = data.currentEntry.weight;
  elements.stepsInput.value = data.currentEntry.steps;
  elements.neckInput.value = data.currentEntry.neck;
  elements.waistInput.value = data.currentEntry.waist;
  elements.hipsInput.value = data.currentEntry.hips;
}

function setStatus(elements, message, type) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
}

function getFormEntry(elements) {
  return {
    date: getTodayDate(),
    weight: elements.weightInput.value.trim(),
    steps: elements.stepsInput.value.trim(),
    neck: elements.neckInput.value.trim(),
    waist: elements.waistInput.value.trim(),
    hips: elements.hipsInput.value.trim(),
  };
}

function hasAnyValue(entry) {
  return [entry.weight, entry.steps, entry.neck, entry.waist, entry.hips].some(
    (value) => value !== ""
  );
}

function isPositiveNumber(value) {
  return value === "" || (Number(value) > 0 && Number.isFinite(Number(value)));
}

function validateEntry(entry) {
  if (!hasAnyValue(entry)) {
    return "Please enter at least one value before saving.";
  }

  const values = [entry.weight, entry.steps, entry.neck, entry.waist, entry.hips];
  const hasInvalidValue = values.some((value) => !isPositiveNumber(value));

  if (hasInvalidValue) {
    return "Please enter positive numbers only.";
  }

  return "";
}

function saveCheckIn(data) {
  const payload = {
    ...data,
    date: data.currentEntry.date,
    weight: data.currentEntry.weight,
    steps: data.currentEntry.steps,
    neck: data.currentEntry.neck,
    waist: data.currentEntry.waist,
    hips: data.currentEntry.hips,
  };

  localStorage.setItem(CHECK_IN_STORAGE_KEY, JSON.stringify(payload));
}

function initCheckInPage() {
  const elements = {
    weightInput: document.getElementById("weightInput"),
    stepsInput: document.getElementById("stepsInput"),
    neckInput: document.getElementById("neckInput"),
    waistInput: document.getElementById("waistInput"),
    hipsInput: document.getElementById("hipsInput"),
    lastWeight: document.getElementById("lastWeight"),
    lastNeck: document.getElementById("lastNeck"),
    lastWaist: document.getElementById("lastWaist"),
    lastHips: document.getElementById("lastHips"),
    saveBtn: document.getElementById("saveBtn"),
    statusMessage: document.getElementById("statusMessage"),
  };

  const data = normalizeCheckInData(safeParseCheckIn());
  updateLastValues(data, elements);
  fillTodayInputs(data, elements);

  elements.saveBtn.addEventListener("click", () => {
    const entry = getFormEntry(elements);
    const validationMessage = validateEntry(entry);

    if (validationMessage) {
      setStatus(elements, validationMessage, "error");
      return;
    }

    if (data.currentEntry.date && data.currentEntry.date !== entry.date) {
      data.previousEntry = { ...data.currentEntry };
    }

    data.currentEntry = entry;

    const historyWithoutToday = data.history.filter(
      (item) => item.date !== entry.date
    );
    data.history = [...historyWithoutToday, entry].sort((first, second) =>
      first.date.localeCompare(second.date)
    );

    saveCheckIn(data);
    updateLastValues(data, elements);
    setStatus(elements, "Your check-in has been saved.", "success");
  });
}

document.addEventListener("DOMContentLoaded", initCheckInPage);
