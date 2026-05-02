function getDisplayName() {
  // Check if the global variable exists; if not, default to "User"
  return window.dbUsername && window.dbUsername !== "None"
    ? window.dbUsername
    : "User";
}
function createHeader() {
  const header = document.getElementsByClassName("header")[0];
  if (!header) return;

  const homeUrl = "/";
  const logoutUrl = "/logout";
  const profileUrl = "/profile";
  const settingsUrl = "/settings";

  header.innerHTML = `
    <div class="logo">
      <h1><a href="${homeUrl}">myfitnesspal</a></h1>
    </div>

    <div class="user-section">
      <span>Hi <a href="${profileUrl}" id="usernameLink">${getDisplayName()}</a></span>
      <a href="${settingsUrl}">Settings</a>
      <a href="${logoutUrl}" class="logout" id="logoutLink">Logout</a>
    </div>
  `;
}

// Call it
createHeader();
