function setNavItems(items) {
  const nav = document.getElementsByClassName("navbar")[0];
  if (!nav) return;

  nav.innerHTML = `
    <ul>
      ${items
        .map(
          (item) =>
            `<li class="${item.active ? "active" : ""}"><a href="${item.href}">${item.label}</a></li>`,
        )
        .join("")}
    </ul>
  `;
}

// Navigation for index page
function createNavFromIndex() {
  setNavItems([
    { label: "My Home", href: "/", active: true },
    { label: "Check in", href: "/check_in" },
    { label: "Food Diary", href: "/food_diary" },
    { label: "Charts", href: "/charts" },
    { label: "Profile", href: "/profile" },
  ]);
}

// Navigation for Check-In page
function createNavFromCheckIn() {
  setNavItems([
    { label: "My Home", href: "/" },
    { label: "Check in", href: "/check_in", active: true },
    { label: "Food Diary", href: "/food_diary" },
    { label: "Charts", href: "/charts" },
    { label: "Profile", href: "/profile" },
  ]);
}

// Navigation for Food-Diary page
function createNavFromFoodDiary() {
  setNavItems([
    { label: "My Home", href: "/" },
    { label: "Check in", href: "/check_in" },
    { label: "Food Diary", href: "/food_diary", active: true },
    { label: "Charts", href: "/charts" },
    { label: "Profile", href: "/profile" },
  ]);
}

// Navigation for Charts page
function createNavFromCharts() {
  setNavItems([
    { label: "My Home", href: "/" },
    { label: "Check in", href: "/check_in" },
    { label: "Food Diary", href: "/food_diary" },
    { label: "Charts", href: "/charts", active: true },
    { label: "Profile", href: "/profile" },
  ]);
}

// Navigation for Profile page
function createNavFromProfile() {
  setNavItems([
    { label: "My Home", href: "/" },
    { label: "Check in", href: "/check_in" },
    { label: "Food Diary", href: "/food_diary" },
    { label: "Charts", href: "/charts" },
    { label: "Profile", href: "/profile", active: true },
  ]);
}
