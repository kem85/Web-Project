const REPORTS = {
  weight: { label: "Weight", unit: "kg", type: "line" },
  steps: { label: "Steps", unit: "steps", type: "bar" },
  calories: { label: "Calories", unit: "kcal", type: "line" },
  water: { label: "Water Intake", unit: "cups", type: "bar" },
};

let currentReport = "weight";
let currentDays = 7;
let currentRows = [];
let allChartData = [];

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function filterByPeriod(rows, days) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  return rows
    .filter((row) => {
      const rowDate = new Date(`${row.date}T00:00:00`);
      return row.date && rowDate >= cutoff;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getRowsForReport(reportKey) {
  return allChartData
    .map(row => ({ date: row.date, value: toNumber(row[reportKey]) }))
    .filter(row => row.value !== null && row.value > 0);
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function niceMax(value) {
  if (value <= 0) return 10;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / power) * power;
}

function drawEmptyState(ctx, width, height, report) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#777";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    `No ${report.label.toLowerCase()} data saved yet`,
    width / 2,
    height / 2 - 8,
  );
  ctx.font = "13px Arial";
  ctx.fillText(
    "Add values in Check-In or Food Diary, then come back here.",
    width / 2,
    height / 2 + 18,
  );
}

function drawChart(rows, report) {
  const canvas = document.getElementById("reportChart");
  const emptyMessage = document.getElementById("chartEmptyMessage");
  const { ctx, width, height } = resizeCanvas(canvas);

  if (!rows.length) {
    emptyMessage.hidden = false;
    drawEmptyState(ctx, width, height, report);
    return;
  }

  emptyMessage.hidden = true;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 28, right: 24, bottom: 52, left: 62 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = rows.map((row) => row.value);
  const maxValue = niceMax(Math.max(...values) * 1.15);
  const minValue = Math.min(0, Math.min(...values));
  const range = maxValue - minValue || 1;

  const xForIndex = (index) => {
    if (rows.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (rows.length - 1)) * chartWidth;
  };

  const yForValue = (value) =>
    padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  // Grid and y-axis labels
  ctx.strokeStyle = "#e0e0e0";
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";

  for (let i = 0; i <= 4; i++) {
    const value = minValue + (range / 4) * i;
    const y = yForValue(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(Math.round(value).toLocaleString(), padding.left - 10, y + 4);
  }

  // Axes
  ctx.strokeStyle = "#999";
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(width - padding.right, padding.top + chartHeight);
  ctx.stroke();

  if (report.type === "bar") {
    const barWidth = Math.max(
      12,
      Math.min(46, chartWidth / Math.max(rows.length, 1) - 12),
    );
    rows.forEach((row, index) => {
      const x = xForIndex(index) - barWidth / 2;
      const y = yForValue(row.value);
      const barHeight = padding.top + chartHeight - y;
      ctx.fillStyle = "#1a73e8";
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  } else {
    ctx.strokeStyle = "#1a73e8";
    ctx.lineWidth = 3;
    ctx.beginPath();

    rows.forEach((row, index) => {
      const x = xForIndex(index);
      const y = yForValue(row.value);
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    ctx.stroke();

    rows.forEach((row, index) => {
      const x = xForIndex(index);
      const y = yForValue(row.value);
      ctx.beginPath();
      ctx.fillStyle = "#1a73e8";
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // X labels
  ctx.fillStyle = "#555";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const maxLabels = width < 650 ? 5 : 8;
  const labelStep = Math.max(1, Math.ceil(rows.length / maxLabels));

  rows.forEach((row, index) => {
    if (index % labelStep !== 0 && index !== rows.length - 1) return;
    ctx.fillText(formatDateLabel(row.date), xForIndex(index), height - 24);
  });

  // Unit label
  ctx.fillStyle = "#333";
  ctx.font = "13px Arial";
  ctx.textAlign = "left";
  ctx.fillText(report.unit, padding.left, 18);

  // Value labels for small datasets
  if (rows.length <= 12) {
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    rows.forEach((row, index) => {
      const x = xForIndex(index);
      const y = yForValue(row.value);
      ctx.fillText(row.value.toLocaleString(), x, Math.max(16, y - 10));
    });
  }
}

function updateChart() {
  const report = REPORTS[currentReport];
  document.getElementById("chartTitle").textContent = report.label;
  currentRows = filterByPeriod(getRowsForReport(currentReport), currentDays);
  drawChart(currentRows, report);
}

async function loadChartData() {
  try {
    const response = await fetch('/api/charts/data');
    if (response.ok) {
      allChartData = await response.json();
    }
  } catch (error) {
    console.error("Failed to load chart data:", error);
  }
  updateChart();
}

function exportCurrentChart() {
  const report = REPORTS[currentReport];
  const header = "date,value,unit\n";
  const csvRows = currentRows
    .map((row) => `${row.date},${row.value},${report.unit}`)
    .join("\n");
  const blob = new Blob([header + csvRows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentReport}-report.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function initChartsPage() {
  const reportType = document.getElementById("reportType");
  const exportBtn = document.getElementById("exportChartBtn");
  const periodLinks = document.querySelectorAll(".period-links a");

  reportType.addEventListener("change", (event) => {
    currentReport = event.target.value;
    updateChart();
  });

  periodLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      currentDays = Number(link.dataset.days || 7);
      periodLinks.forEach((item) => item.classList.remove("active-period"));
      link.classList.add("active-period");
      updateChart();
    });
  });

  exportBtn.addEventListener("click", exportCurrentChart);
  window.addEventListener("resize", updateChart);

  loadChartData();
}

document.addEventListener("DOMContentLoaded", initChartsPage);
