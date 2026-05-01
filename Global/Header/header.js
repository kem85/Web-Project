function getRelativePath(target) {
  const path = window.location.pathname.replace(/\\/g, "/");

  if (path.includes("/index/")) {
    return target.index;
  }
  if (path.includes("/Login/")) {
    return target.login;
  }
  if (path.includes("/Profile/")) {
    return target.profile ?? target.other;
  }
  if (path.includes("/Settings/")) {
    return target.settings ?? target.other;
  }

  return target.other;
}

function getDisplayName() {
  return "User";
}

function createHeader() {
  const header = document.getElementsByClassName("header")[0];
  if (!header) return;

  const homeUrl = getRelativePath({
    index: "index.html",
    other: "../index/index.html",
    login: "../index/index.html",
  });

  const loginUrl = getRelativePath({
    index: "../Login/Login.html",
    other: "../Login/Login.html",
    login: "Login.html",
    profile: "../Login/Login.html",
    settings: "../Login/Login.html",
  });

  const profileUrl = getRelativePath({
    index: "../Profile/Profile.html",
    other: "../Profile/Profile.html",
    login: "../Profile/Profile.html",
    profile: "Profile.html",
    settings: "../Profile/Profile.html",
  });

  const settingsUrl = getRelativePath({
    index: "../Settings/Settings.html",
    other: "../Settings/Settings.html",
    login: "../Settings/Settings.html",
    profile: "../Settings/Settings.html",
    settings: "Settings.html",
  });

  header.innerHTML = `
    <div class="logo">
      <h1><a href="${homeUrl}">myfitnesspal</a></h1>
    </div>

    <div class="user-section">
      <span>Hi <a href="${profileUrl}" id="usernameLink">${getDisplayName()}</a></span>
      <a href="${settingsUrl}">Settings</a>
      <a href="${loginUrl}" class="logout" id="logoutLink">Logout</a>
    </div>
  `;

}

createHeader();
