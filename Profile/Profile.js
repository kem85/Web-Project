// =============================================
//   PROFILE PAGE — profile.js
// =============================================

// ── Run after DOM is ready ────────────────────
document.addEventListener("DOMContentLoaded", init);

// ── State ─────────────────────────────────────
let profileState = {
  name: "Loading...",
  age: "--",
  gender: "--",
  memberSince: "--",
  aboutMe: "",
  whyShape: "",
  inspirations: "",
  photoDataUrl: null,
};

function loadState() {
  return { ...profileState };
}

function saveState(state) {
  profileState = { ...state };
}

// Helper to save to state, render UI, AND push to the database
async function syncProfile(newState) {
  saveState(newState);
  renderProfile(newState);

  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newState),
    });
  } catch (err) {
    console.error("Error saving profile to database:", err);
  }
}

// ── Init ──────────────────────────────────────
async function init() {
  // 1. Fetch live data from the database
  try {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const dbData = await res.json();
      saveState(dbData);
    }
  } catch (err) {
    console.error("Failed to load profile data", err);
  }

  let state = loadState();
  renderProfile(state);

  // 2. Setup Edit Photo
  const profilePic = document.querySelector(".profile-pic");
  if (profilePic) {
    profilePic.style.cursor = "pointer";
    profilePic.addEventListener("click", () =>
      openPhotoPicker(loadState(), (updated) => syncProfile(updated))
    );
  }

  // 3. Setup Edit Button
  const editBtn = document.getElementById('edit-profile-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
        openEditModal(loadState(), (updated) => syncProfile(updated));
    });
  }
}

// ── Render ────────────────────────────────────
function renderProfile(state) {
  // Header info
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = `${state.name}'s profile`;
  
  const h2 = document.querySelector(".profile-info h2");
  if (h2) h2.textContent = state.name;

  const infoParagraphs = document.querySelectorAll(
    ".profile-info .information p",
  );
  if (infoParagraphs[0])
    infoParagraphs[0].textContent = `${state.age} years old`;
  if (infoParagraphs[1]) infoParagraphs[1].textContent = state.gender;
  if (infoParagraphs[2])
    infoParagraphs[2].textContent = `Member since ${state.memberSince}`;

  // Profile photo
  if (state.photoDataUrl) {
    const pic = document.querySelector(".profile-pic");
    if (pic) pic.src = state.photoDataUrl;
  }

  // Text sections
  renderSection(
    ".left h3:nth-of-type(1)",
    state.aboutMe,
    `I haven't filled this out yet.`,
  );
  renderSection(
    ".left h3:nth-of-type(2)",
    state.whyShape,
    `I haven't filled this out yet.`,
  );
  renderSection(
    ".left h3:nth-of-type(3)",
    state.inspirations,
    `I haven't filled this out yet.`,
  );
}

function renderSection(headerSelector, value, placeholder) {
  const h3 = document.querySelector(headerSelector);
  if (!h3) return;
  let p = h3.nextElementSibling;
  if (!p || p.tagName !== "P") return;

  if (value && value.trim() !== "") {
    p.textContent = value;
    p.classList.remove("empty");
  } else {
    p.textContent = placeholder;
    p.classList.add("empty");
  }
}

// ── Edit Modal ────────────────────────────────
function openEditModal(state, onSave) {
  // Backdrop
  const backdrop = document.createElement("div");
  Object.assign(backdrop.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "1000",
  });

  // Modal box
  const modal = document.createElement("div");
  Object.assign(modal.style, {
    background: "white",
    borderRadius: "10px",
    padding: "35px 40px",
    width: "460px",
    maxWidth: "95vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    fontFamily: "Arial, sans-serif",
  });

  modal.innerHTML = `
    <h2 style="margin:0 0 24px;font-size:1.3rem;color:#2d6cdf;">Edit Profile</h2>

    <div style="margin-bottom:14px;">
      <label style="display:block;font-weight:bold;margin-bottom:4px;font-size:14px;">Name</label>
      <input id="m_name" value="${esc(state.name)}" style="${inputStyle()}">
    </div>

    <div style="margin-bottom:14px;">
      <label style="display:block;font-weight:bold;margin-bottom:4px;font-size:14px;">Age</label>
      <input id="m_age" type="number" min="1" max="120" value="${esc(state.age)}" style="${inputStyle()}">
    </div>

    <div style="margin-bottom:14px;">
      <label style="display:block;font-weight:bold;margin-bottom:4px;font-size:14px;">Gender</label>
      <select id="m_gender" style="${inputStyle()}">
        <option ${state.gender === "Male" ? "selected" : ""}>Male</option>
        <option ${state.gender === "Female" ? "selected" : ""}>Female</option>
      </select>
    </div>

    <div style="margin-bottom:14px;">
      <label style="display:block;font-weight:bold;margin-bottom:4px;font-size:14px;">About Me</label>
      <textarea id="m_about" rows="3" placeholder="Tell us about yourself…" style="${textareaStyle()}">${esc(state.aboutMe)}</textarea>
    </div>

    <div style="margin-bottom:14px;">
      <label style="display:block;font-weight:bold;margin-bottom:4px;font-size:14px;">Why I want to get in shape</label>
      <textarea id="m_why" rows="3" placeholder="Your motivation…" style="${textareaStyle()}">${esc(state.whyShape)}</textarea>
    </div>

    <div style="margin-bottom:24px;">
      <label style="display:block;font-weight:bold;margin-bottom:4px;font-size:14px;">My Inspirations</label>
      <textarea id="m_inspo" rows="3" placeholder="Who or what inspires you…" style="${textareaStyle()}">${esc(state.inspirations)}</textarea>
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end;">
      <button id="m_cancel" style="${cancelBtnStyle()}">Cancel</button>
      <button id="m_save"   style="${saveBtnStyle()}">Save Changes</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Focus first field
  modal.querySelector("#m_name").focus();

  // Close on backdrop click
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  modal.querySelector("#m_cancel").addEventListener("click", close);

  modal.querySelector("#m_save").addEventListener("click", () => {
    const name = modal.querySelector("#m_name").value.trim();
    if (!name) {
      flash(modal.querySelector("#m_name"));
      return;
    }

    const updated = {
      ...state,
      name,
      age: modal.querySelector("#m_age").value,
      gender: modal.querySelector("#m_gender").value,
      aboutMe: modal.querySelector("#m_about").value.trim(),
      whyShape: modal.querySelector("#m_why").value.trim(),
      inspirations: modal.querySelector("#m_inspo").value.trim(),
    };
    close();
    onSave(updated);
  });

  function close() {
    document.body.removeChild(backdrop);
  }
}

// ── Photo Picker ──────────────────────────────
function openPhotoPicker(state, onSave) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onSave({ ...state, photoDataUrl: e.target.result });
    };
    reader.readAsDataURL(file);
  });

  input.click();
}

// ── Style helpers ─────────────────────────────
function inputStyle() {
  return `width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box;`;
}
function textareaStyle() {
  return `width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box;resize:vertical;font-family:Arial,sans-serif;`;
}
function saveBtnStyle() {
  return `padding:10px 28px;background:#2d6cdf;color:white;border:none;border-radius:4px;font-size:14px;cursor:pointer;font-weight:bold;`;
}
function cancelBtnStyle() {
  return `padding:10px 28px;background:#eee;color:#333;border:none;border-radius:4px;font-size:14px;cursor:pointer;`;
}

// Flash red border on invalid field
function flash(el) {
  el.style.borderColor = "#e53935";
  el.focus();
  setTimeout(() => {
    el.style.borderColor = "#ccc";
  }, 1500);
}

// Escape HTML to avoid XSS in innerHTML
function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}