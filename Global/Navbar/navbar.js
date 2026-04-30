function setNavItems(items) {
  const nav = document.getElementsByClassName("navbar")[0];
  if (!nav) return;

  nav.innerHTML = `
    <ul>
      ${items
        .map(
          (item) =>
            `<li class="${item.active ? "active" : ""}"><a href="${item.href}">${item.label}</a></li>`
        )
        .join("")}
    </ul>
  `;
}

// Navigation for index page
function createNavFromIndex() {
  setNavItems([
    { label: "My Home", href: "index.html", active: true },
    { label: "Check in", href: "../Check-In/Check-In.html" },
    { label: "Food Diary", href: "../Food-Diary/Food-Diary.html" },
    { label: "Charts", href: "../Charts/Charts.html" },
    { label: "Profile", href: "../Profile/Profile.html" },
  ]);
}

// Navigation for Check-In page
function createNavFromCheckIn() {
  setNavItems([
    { label: "My Home", href: "../index/index.html" },
    { label: "Check in", href: "Check-In.html", active: true },
    { label: "Food Diary", href: "../Food-Diary/Food-Diary.html" },
    { label: "Charts", href: "../Charts/Charts.html" },
    { label: "Profile", href: "../Profile/Profile.html" },
  ]);
}

// Navigation for Food-Diary page
function createNavFromFoodDiary() {
  setNavItems([
    { label: "My Home", href: "../index/index.html" },
    { label: "Check in", href: "../Check-In/Check-In.html" },
    { label: "Food Diary", href: "Food-Diary.html", active: true },
    { label: "Charts", href: "../Charts/Charts.html" },
    { label: "Profile", href: "../Profile/Profile.html" },
  ]);
}

// Navigation for Charts page
function createNavFromCharts() {
  setNavItems([
    { label: "My Home", href: "../index/index.html" },
    { label: "Check in", href: "../Check-In/Check-In.html" },
    { label: "Food Diary", href: "../Food-Diary/Food-Diary.html" },
    { label: "Charts", href: "Charts.html", active: true },
    { label: "Profile", href: "../Profile/Profile.html" },
  ]);
}

// Navigation for Profile page
function createNavFromProfile() {
  setNavItems([
    { label: "My Home", href: "../index/index.html" },
    { label: "Check in", href: "../Check-In/Check-In.html" },
    { label: "Food Diary", href: "../Food-Diary/Food-Diary.html" },
    { label: "Charts", href: "../Charts/Charts.html" },
    { label: "Profile", href: "Profile.html", active: true },
  ]);
}
