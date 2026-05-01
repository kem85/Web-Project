// =============================================
//   LOGIN PAGE — Login.js
// =============================================

// ── Inject styles ─────────────────────────────
const style = document.createElement("style");
style.textContent = `
  .input-group.error   { outline: 2px solid #e53935; border-radius: 10px; }
  .input-group.success { outline: 2px solid #28a745; border-radius: 10px; }

  .error-msg {
    color: #e53935; font-size: 12px;
    margin: -10px 0 10px 4px;
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px); }
  }
  .shake { animation: shake 0.4s ease; }

  .btn-login:disabled {
    opacity: 0.75; cursor: not-allowed;
  }

  /* ── 2. CAPS LOCK WARNING ── */
  .caps-warning {
    display: none;
    align-items: center; gap: 6px;
    color: #e67e00; font-size: 12px;
    margin: -10px 0 10px 4px;
  }
  .caps-warning.visible { display: flex; }

  /* ── 3. REMEMBER ME ── */
  .remember-row {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 20px; font-size: 14px; color: #444;
  }
  .remember-row input[type="checkbox"] {
    width: 15px; height: 15px; cursor: pointer; accent-color: #0066ee;
  }

  /* ── 4. LOCKOUT BANNER ── */
  .lockout-banner {
    display: none;
    background: #fff3cd; border: 1px solid #ffc107;
    border-radius: 8px; padding: 12px 16px;
    margin-bottom: 16px; font-size: 14px; color: #856404;
    text-align: center;
  }
  .lockout-banner.visible { display: block; }

  /* Toast */
  .ft-toast {
    position: fixed; bottom: 30px; left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: #1a1a1a; color: white;
    padding: 12px 24px; border-radius: 8px;
    font-size: 14px; opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 9999; white-space: nowrap;
  }
  .ft-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
`;
document.head.appendChild(style);

// ── DOM refs ──────────────────────────────────
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = loginForm.querySelector(".btn-login");
const eyeIcon = document.getElementById("eyeIcon");

if (eyeIcon) {
  eyeIcon.addEventListener("click", () => {
    const isPassword = passInput.getAttribute("type") === "password";
    passInput.setAttribute("type", isPassword ? "text" : "password");
    eyeIcon.classList.toggle("fa-eye");
    eyeIcon.classList.toggle("fa-eye-slash");
  });
}

loginForm.classList.add("form-panel");
loginForm.id = "loginPanel";

// ═══════════════════════════════════════════════
//  INJECT: Caps Lock warning
// ═══════════════════════════════════════════════
const capsWarn = document.createElement("div");
capsWarn.className = "caps-warning";
capsWarn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Caps Lock is on`;
passInput.closest(".input-group").insertAdjacentElement("afterend", capsWarn);

["keyup", "keydown"].forEach((evt) =>
  passInput.addEventListener(evt, (e) =>
    capsWarn.classList.toggle("visible", e.getModifierState("CapsLock")),
  ),
);

// ═══════════════════════════════════════════════
//  INJECT: Lockout banner
// ═══════════════════════════════════════════════
const lockoutBanner = document.createElement("div");
lockoutBanner.className = "lockout-banner";
loginBtn.insertAdjacentElement("beforebegin", lockoutBanner);

// ═══════════════════════════════════════════════
//  FAILED ATTEMPTS LOCKOUT
// ═══════════════════════════════════════════════
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECS = 30;
let failedAttempts = 0;
let lockoutUntil = 0;
let lockoutTimer = null;

const isLockedOut = () => Date.now() < lockoutUntil;

function startLockoutCountdown() {
  clearInterval(lockoutTimer);
  loginBtn.disabled = true;

  lockoutTimer = setInterval(() => {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(lockoutTimer);
      lockoutBanner.classList.remove("visible");
      loginBtn.disabled = false;
      loginBtn.textContent = "Log In";
      failedAttempts = 0;
      lockoutUntil = 0;
    } else {
      lockoutBanner.classList.add("visible");
      lockoutBanner.textContent = `Too many failed attempts. Please wait ${remaining}s before trying again.`;
    }
  }, 500);
}

if (isLockedOut()) startLockoutCountdown();

function recordFailure() {
  failedAttempts++;
  if (failedAttempts >= MAX_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_SECS * 1000;
    startLockoutCountdown();
  }
}

function clearFailures() {
  failedAttempts = 0;
  lockoutUntil = 0;
  clearInterval(lockoutTimer);
  lockoutBanner.classList.remove("visible");
}

// ═══════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════
const getGroup = (input) => input.closest(".input-group");
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function setError(input, message) {
  const group = getGroup(input);
  group.classList.add("error");
  group.classList.remove("success");
  const existing = group.nextElementSibling;
  if (existing && existing.classList.contains("error-msg")) existing.remove();
  if (message.trim()) {
    const msg = document.createElement("p");
    msg.className = "error-msg";
    msg.textContent = message;
    group.insertAdjacentElement("afterend", msg);
  }
  group.classList.remove("shake");
  void group.offsetWidth;
  group.classList.add("shake");
  group.addEventListener(
    "animationend",
    () => group.classList.remove("shake"),
    { once: true },
  );
}

function clearError(input) {
  const group = getGroup(input);
  group.classList.remove("error");
  const next = group.nextElementSibling;
  if (next && next.classList.contains("error-msg")) next.remove();
}

function setSuccess(input) {
  const group = getGroup(input);
  group.classList.remove("error");
  group.classList.add("success");
  const next = group.nextElementSibling;
  if (next && next.classList.contains("error-msg")) next.remove();
}

function showToast(message, duration = 3000) {
  const old = document.querySelector(".ft-toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.className = "ft-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => toast.classList.add("show")),
  );
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, duration);
}

// ═══════════════════════════════════════════════
//  LOGIN — validation & submit
// ═══════════════════════════════════════════════
emailInput.addEventListener("blur", () => {
  const v = emailInput.value.trim();
  if (!v) setError(emailInput, "Email is required.");
  else if (!isValidEmail(v))
    setError(emailInput, "Please enter a valid email address.");
  else setSuccess(emailInput);
});
passInput.addEventListener("blur", () => {
  const v = passInput.value;
  if (!v) setError(passInput, "Password is required.");
  else if (v.length < 6)
    setError(passInput, "Password must be at least 6 characters.");
  else setSuccess(passInput);
});
emailInput.addEventListener("input", () => clearError(emailInput));
passInput.addEventListener("input", () => clearError(passInput));

loginForm.addEventListener("submit", (e) => {
  e.preventDefault(); // Stop default to check validation
  if (isLockedOut()) return;

  const email = emailInput.value.trim();
  const password = passInput.value;
  let valid = true;

  // Validation checks
  if (!email) {
    setError(emailInput, "Email is required.");
    valid = false;
  } else if (!isValidEmail(email)) {
    setError(emailInput, "Valid email required.");
    valid = false;
  }

  if (!password) {
    setError(passInput, "Password is required.");
    valid = false;
  } else if (password.length < 6) {
    setError(passInput, "Min 6 characters.");
    valid = false;
  }

  if (!valid) return;

  // Visual success state
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in…";

  // Delay slightly so user sees the "Logging in..." state, then submit to Flask
  setTimeout(() => {
    loginForm.submit();
  }, 600);
});

// ═══════════════════════════════════════════════
//  SOCIAL BUTTONS
// ═══════════════════════════════════════════════
document
  .querySelectorAll(".btn-social")
  .forEach((btn) =>
    btn.addEventListener("click", () => showToast("Social login coming soon!")),
  );

// ── Auto-focus ────────────────────────────────
emailInput.focus();
