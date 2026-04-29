function getRelativePath(target) {
  const path = window.location.pathname.replace(/\\/g, "/");

  if (path.includes("/index/")) {
    return target.index;
  }
  if (path.includes("/Login/")) {
    return target.login;
  }

  return target.other;
}

function readJSON(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return fallback;
  }
}

function getDisplayName() {
  const profile = readJSON("ft_profile", {});
  const credentials = readJSON("ft_credentials", {});
  return profile.name || credentials.name || "User";
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
  });

  header.innerHTML = `
    <div class="logo">
      <h1><a href="${homeUrl}">myfitnesspal</a></h1>
    </div>

    <div class="user-section">
      <span>Hi <span id="username">${getDisplayName()}</span></span>
      <a href="#">Help</a>
      <a href="#">Settings</a>
      <a href="${loginUrl}" class="logout" id="logoutLink">Logout</a>
    </div>
  `;

  const logoutLink = document.getElementById("logoutLink");
  logoutLink.addEventListener("click", () => {
    localStorage.removeItem("ft_loggedIn");
  });
}

createHeader();
