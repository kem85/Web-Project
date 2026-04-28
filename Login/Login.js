// =============================================
//   LOGIN PAGE — Login.js
// =============================================

// ── 1. AUTO-REDIRECT IF ALREADY LOGGED IN ────
if (localStorage.getItem('ft_loggedIn') === 'true') {
  window.location.replace('../index/index.html');
}

// ── Inject styles ─────────────────────────────
const style = document.createElement('style');
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

  .btn-login:disabled, .btn-signup:disabled {
    opacity: 0.75; cursor: not-allowed;
  }
  .btn-signup {
    width: 100%; padding: 14px;
    background-color: #0066ee; color: white;
    border: none; border-radius: 8px;
    font-size: 16px; font-weight: 700;
    cursor: pointer; margin-bottom: 20px;
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

  /* ── 5. SIGN UP FORM ── */
  .form-panel.hidden { display: none; }

  .strength-bar-wrap {
    height: 4px; background: #e1e4e8;
    border-radius: 4px; margin: 6px 0 4px; overflow: hidden;
  }
  .strength-bar {
    height: 100%; width: 0%;
    border-radius: 4px;
    transition: width 0.3s ease, background 0.3s ease;
  }
  .strength-label { font-size: 11px; color: #6a737d; margin-bottom: 10px; }

  .toggle-form-link {
    color: #0066ee; cursor: pointer;
    text-decoration: none; font-weight: 400;
  }
  .toggle-form-link:hover { text-decoration: underline; }

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
const loginForm  = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const loginBtn   = loginForm.querySelector('.btn-login');
const forgotLink = document.querySelector('.forgot-link');
const footerText = document.querySelector('.footer-text');
const eyeIcon = document.getElementById('eyeIcon');

if (eyeIcon) {
  eyeIcon.addEventListener('click', () => {
    const isPassword = passInput.getAttribute('type') === 'password';
    passInput.setAttribute('type', isPassword ? 'text' : 'password');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
  });
}

loginForm.classList.add('form-panel');
loginForm.id = 'loginPanel';

// ═══════════════════════════════════════════════
//  INJECT: Remember Me checkbox
// ═══════════════════════════════════════════════
const rememberRow = document.createElement('div');
rememberRow.className = 'remember-row';
rememberRow.innerHTML = `
  <input type="checkbox" id="rememberMe">
  <label for="rememberMe">Remember me</label>
`;
loginForm.querySelector('.forgot-container').insertAdjacentElement('afterend', rememberRow);
const rememberCheckbox = document.getElementById('rememberMe');

const rememberedEmail = localStorage.getItem('ft_rememberedEmail');
if (rememberedEmail) {
  emailInput.value         = rememberedEmail;
  rememberCheckbox.checked = true;
}

// ═══════════════════════════════════════════════
//  INJECT: Caps Lock warning
// ═══════════════════════════════════════════════
const capsWarn = document.createElement('div');
capsWarn.className = 'caps-warning';
capsWarn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Caps Lock is on`;
passInput.closest('.input-group').insertAdjacentElement('afterend', capsWarn);

['keyup', 'keydown'].forEach(evt =>
  passInput.addEventListener(evt, (e) =>
    capsWarn.classList.toggle('visible', e.getModifierState('CapsLock'))
  )
);

// ═══════════════════════════════════════════════
//  INJECT: Lockout banner
// ═══════════════════════════════════════════════
const lockoutBanner = document.createElement('div');
lockoutBanner.className = 'lockout-banner';
loginBtn.insertAdjacentElement('beforebegin', lockoutBanner);

// ═══════════════════════════════════════════════
//  INJECT: Sign Up form panel
// ═══════════════════════════════════════════════
const signupPanel = document.createElement('div');
signupPanel.className = 'form-panel hidden';
signupPanel.id = 'signupPanel';
signupPanel.innerHTML = `
  <h2>Create Account</h2>

  <div class="input-group">
    <label for="su_name">Full Name</label>
    <input type="text" id="su_name" placeholder="Your name">
  </div>

  <div class="input-group">
    <label for="su_email">Email Address</label>
    <input type="email" id="su_email" placeholder="Email">
  </div>

  <div class="input-group">
    <label for="su_pass">Password</label>
    <div class="password-wrapper">
      <input type="password" id="su_pass" placeholder="Password">
      <i class="fa-regular fa-eye-slash toggle-password" id="su_eyeIcon"></i>
    </div>
  </div>
  <div class="strength-bar-wrap"><div class="strength-bar" id="strengthBar"></div></div>
  <div class="strength-label" id="strengthLabel">Password strength</div>

  <div class="input-group">
    <label for="su_confirm">Confirm Password</label>
    <input type="password" id="su_confirm" placeholder="Confirm password">
  </div>

  <button class="btn-signup" id="signupBtn">Sign Up</button>

  <p class="footer-text">
    Already a member? <a class="toggle-form-link" id="goToLogin">Log in</a>
  </p>
`;
loginForm.insertAdjacentElement('afterend', signupPanel);

// ── Sign up refs ──────────────────────────────
const su_name    = document.getElementById('su_name');
const su_email   = document.getElementById('su_email');
const su_pass    = document.getElementById('su_pass');
const su_confirm = document.getElementById('su_confirm');
const signupBtn  = document.getElementById('signupBtn');
const strengthBar   = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');

// Password visibility toggle for signup
document.getElementById('su_eyeIcon').addEventListener('click', function () {
  const isPass = su_pass.type === 'password';
  su_pass.type = isPass ? 'text' : 'password';
  this.classList.toggle('fa-eye');
  this.classList.toggle('fa-eye-slash');
});

// Strength meter
su_pass.addEventListener('input', () => {
  const pw    = su_pass.value;
  let score   = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const pct    = pw.length === 0 ? 0 : Math.max(20, score * 20);
  const colors = ['', '#e53935', '#e67e00', '#f9a825', '#43a047', '#1b5e20'];
  const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

  strengthBar.style.width      = pct + '%';
  strengthBar.style.background = colors[score] || '#e1e4e8';
  strengthLabel.textContent    = pw.length ? labels[score] : 'Password strength';
  strengthLabel.style.color    = colors[score] || '#6a737d';
});

// ═══════════════════════════════════════════════
//  TOGGLE Login ↔ Sign Up
// ═══════════════════════════════════════════════
function showSignup() {
  document.getElementById('loginPanel').classList.add('hidden');
  signupPanel.classList.remove('hidden');
  su_name.focus();
}
function showLogin() {
  signupPanel.classList.add('hidden');
  document.getElementById('loginPanel').classList.remove('hidden');
  emailInput.focus();
}

footerText.innerHTML = `Not a member yet? <a class="toggle-form-link" id="goToSignup">Sign up now!</a>`;
document.getElementById('goToSignup').addEventListener('click', showSignup);
document.getElementById('goToLogin').addEventListener('click', showLogin);

// ═══════════════════════════════════════════════
//  FAILED ATTEMPTS LOCKOUT
// ═══════════════════════════════════════════════
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECS = 30;
let failedAttempts = parseInt(localStorage.getItem('ft_failedAttempts')) || 0;
let lockoutUntil   = parseInt(localStorage.getItem('ft_lockoutUntil'))   || 0;
let lockoutTimer   = null;

const isLockedOut = () => Date.now() < lockoutUntil;

function startLockoutCountdown() {
  clearInterval(lockoutTimer);
  loginBtn.disabled = true;

  lockoutTimer = setInterval(() => {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(lockoutTimer);
      lockoutBanner.classList.remove('visible');
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Log In';
      failedAttempts = 0;
      localStorage.removeItem('ft_failedAttempts');
      localStorage.removeItem('ft_lockoutUntil');
    } else {
      lockoutBanner.classList.add('visible');
      lockoutBanner.textContent =
        `Too many failed attempts. Please wait ${remaining}s before trying again.`;
    }
  }, 500);
}

if (isLockedOut()) startLockoutCountdown();

function recordFailure() {
  failedAttempts++;
  localStorage.setItem('ft_failedAttempts', failedAttempts);
  if (failedAttempts >= MAX_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_SECS * 1000;
    localStorage.setItem('ft_lockoutUntil', lockoutUntil);
    startLockoutCountdown();
  }
}

function clearFailures() {
  failedAttempts = 0; lockoutUntil = 0;
  clearInterval(lockoutTimer);
  localStorage.removeItem('ft_failedAttempts');
  localStorage.removeItem('ft_lockoutUntil');
  lockoutBanner.classList.remove('visible');
}

// ═══════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════
const getGroup     = (input) => input.closest('.input-group');
const isValidEmail = (v)     => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function setError(input, message) {
  const group = getGroup(input);
  group.classList.add('error');
  group.classList.remove('success');
  const existing = group.nextElementSibling;
  if (existing && existing.classList.contains('error-msg')) existing.remove();
  if (message.trim()) {
    const msg = document.createElement('p');
    msg.className = 'error-msg';
    msg.textContent = message;
    group.insertAdjacentElement('afterend', msg);
  }
  group.classList.remove('shake');
  void group.offsetWidth;
  group.classList.add('shake');
  group.addEventListener('animationend', () => group.classList.remove('shake'), { once: true });
}

function clearError(input) {
  const group = getGroup(input);
  group.classList.remove('error');
  const next = group.nextElementSibling;
  if (next && next.classList.contains('error-msg')) next.remove();
}

function setSuccess(input) {
  const group = getGroup(input);
  group.classList.remove('error');
  group.classList.add('success');
  const next = group.nextElementSibling;
  if (next && next.classList.contains('error-msg')) next.remove();
}

function showToast(message, duration = 3000) {
  const old = document.querySelector('.ft-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.className = 'ft-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ═══════════════════════════════════════════════
//  LOGIN — validation & submit
// ═══════════════════════════════════════════════
emailInput.addEventListener('blur', () => {
  const v = emailInput.value.trim();
  if (!v)                setError(emailInput, 'Email is required.');
  else if (!isValidEmail(v)) setError(emailInput, 'Please enter a valid email address.');
  else                   setSuccess(emailInput);
});
passInput.addEventListener('blur', () => {
  const v = passInput.value;
  if (!v)           setError(passInput, 'Password is required.');
  else if (v.length < 6) setError(passInput, 'Password must be at least 6 characters.');
  else              setSuccess(passInput);
});
emailInput.addEventListener('input', () => clearError(emailInput));
passInput.addEventListener('input',  () => clearError(passInput));

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isLockedOut()) return;

  const email    = emailInput.value.trim();
  const password = passInput.value;
  let valid = true;

  if (!email)                { setError(emailInput, 'Email is required.');               valid = false; }
  else if (!isValidEmail(email)) { setError(emailInput, 'Please enter a valid email address.'); valid = false; }
  if (!password)             { setError(passInput,  'Password is required.');             valid = false; }
  else if (password.length < 6)  { setError(passInput, 'Password must be at least 6 characters.'); valid = false; }
  if (!valid) return;

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Logging in…';

  setTimeout(() => {
    const stored = localStorage.getItem('ft_credentials');
    if (stored) {
      const creds = JSON.parse(stored);
      if (creds.email === email && creds.password === password) {
        rememberCheckbox.checked
          ? localStorage.setItem('ft_rememberedEmail', email)
          : localStorage.removeItem('ft_rememberedEmail');
        clearFailures();
        localStorage.setItem('ft_loggedIn', 'true');
        loginBtn.textContent = '✓ Success!';
        setTimeout(() => { window.location.href = '../index/index.html'; }, 600);
      } else {
        loginBtn.disabled    = false;
        loginBtn.textContent = 'Log In';
        recordFailure();
        if (!isLockedOut()) {
          const left = MAX_ATTEMPTS - failedAttempts;
          setError(emailInput, ' ');
          setError(passInput, left > 0
            ? `Incorrect email or password. ${left} attempt${left !== 1 ? 's' : ''} left.`
            : 'Incorrect email or password.');
        }
      }
    } else {
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Log In';
      setError(emailInput, 'No account found. Please sign up first.');
    }
  }, 900);
});

// ═══════════════════════════════════════════════
//  SIGN UP — validation & submit
// ═══════════════════════════════════════════════
[su_name, su_email, su_pass, su_confirm].forEach(input =>
  input.addEventListener('input', () => clearError(input))
);

su_email.addEventListener('blur', () => {
  const v = su_email.value.trim();
  if (!v)                setError(su_email, 'Email is required.');
  else if (!isValidEmail(v)) setError(su_email, 'Please enter a valid email address.');
  else                   setSuccess(su_email);
});
su_confirm.addEventListener('blur', () => {
  if (su_confirm.value && su_confirm.value !== su_pass.value)
    setError(su_confirm, 'Passwords do not match.');
  else if (su_confirm.value)
    setSuccess(su_confirm);
});

signupBtn.addEventListener('click', () => {
  const name     = su_name.value.trim();
  const email    = su_email.value.trim();
  const password = su_pass.value;
  const confirm  = su_confirm.value;
  let valid = true;

  if (!name)                 { setError(su_name,    'Name is required.');                     valid = false; }
  if (!email)                { setError(su_email,   'Email is required.');                    valid = false; }
  else if (!isValidEmail(email)) { setError(su_email,'Please enter a valid email address.');  valid = false; }
  if (!password)             { setError(su_pass,    'Password is required.');                 valid = false; }
  else if (password.length < 6)  { setError(su_pass,'Password must be at least 6 characters.'); valid = false; }
  if (confirm !== password)  { setError(su_confirm, 'Passwords do not match.');               valid = false; }
  if (!valid) return;

  signupBtn.disabled    = true;
  signupBtn.textContent = 'Creating account…';

  setTimeout(() => {
    localStorage.setItem('ft_credentials', JSON.stringify({ email, password, name }));
    localStorage.setItem('ft_loggedIn', 'true');
    signupBtn.textContent = '✓ Account created!';
    setTimeout(() => { window.location.href = '../index/index.html'; }, 700);
  }, 900);
});

// ═══════════════════════════════════════════════
//  SOCIAL BUTTONS & FORGOT PASSWORD
// ═══════════════════════════════════════════════
document.querySelectorAll('.btn-social').forEach(btn =>
  btn.addEventListener('click', () => showToast('Social login coming soon!'))
);

forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (!email || !isValidEmail(email)) {
    setError(emailInput, 'Enter your email above first.');
    emailInput.focus();
    return;
  }
  showToast(`Password reset link sent to ${email}`);
});

// ── Auto-focus ────────────────────────────────
emailInput.focus();