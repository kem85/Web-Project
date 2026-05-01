// =============================================
//   PROFILE PAGE — profile.js
// =============================================

// ── Run after DOM is ready ────────────────────
document.addEventListener('DOMContentLoaded', init);

// ── State ─────────────────────────────────────
const DEFAULTS = {
  name:        'Youssef',
  age:         '20',
  gender:      'Male',
  memberSince: 'June 9, 2024',
  aboutMe:     '',
  whyShape:    '',
  inspirations:'',
  photoDataUrl: null,
  friends:     [],   // [{ id, name, since }]
};

let profileState = { ...DEFAULTS };

function loadState() {
  return { ...profileState };
}

function saveState(state) {
  profileState = { ...state };
}

// ── Init ──────────────────────────────────────
function init() {
  let state = loadState();
  renderProfile(state);

  const profilePic = document.querySelector('.profile-pic');
  if (profilePic) {
    profilePic.style.cursor = 'pointer';
    profilePic.addEventListener('click', () => openPhotoPicker(state, (updated) => {
      state = updated;
      saveState(state);
      renderProfile(state);
    }));
  }

  // Friends section
  injectFriendsUI(() => state, (updated) => {
    state = updated;
    saveState(state);
    renderFriends(state);
  });
}

// ── Render ────────────────────────────────────
function renderProfile(state) {
  // Header info
  document.querySelector('h1').textContent = `${state.name}'s profile`;
  document.querySelector('.profile-info h2').textContent = state.name;

  const infoParagraphs = document.querySelectorAll('.profile-info .information p');
  if (infoParagraphs[0]) infoParagraphs[0].textContent = `${state.age} years old`;
  if (infoParagraphs[1]) infoParagraphs[1].textContent = state.gender;
  if (infoParagraphs[2]) infoParagraphs[2].textContent = `Member since ${state.memberSince}`;

  // Profile photo
  if (state.photoDataUrl) {
    document.querySelector('.profile-pic').src = state.photoDataUrl;
  }

  // Text sections
  renderSection('.left h3:nth-of-type(1)', state.aboutMe,      `I haven't filled this out yet.`);
  renderSection('.left h3:nth-of-type(2)', state.whyShape,     `I haven't filled this out yet.`);
  renderSection('.left h3:nth-of-type(3)', state.inspirations, `I haven't filled this out yet.`);

  renderFriends(state);
}

function renderSection(headerSelector, value, placeholder) {
  const h3 = document.querySelector(headerSelector);
  if (!h3) return;
  let p = h3.nextElementSibling;
  if (!p || p.tagName !== 'P') return;

  if (value && value.trim() !== '') {
    p.textContent = value;
    p.classList.remove('empty');
  } else {
    p.textContent = placeholder;
    p.classList.add('empty');
  }
}

// ── Friends ───────────────────────────────────

// Inject the Add Friend button + friends list container into the .right column
function injectFriendsUI(getState, onUpdate) {
  const right = document.querySelector('.right');
  if (!right) return;

  // Replace the static placeholder <p> with our managed container
  const staticP = right.querySelector('p.empty');
  if (staticP) staticP.remove();

  // List container (we'll populate it via renderFriends)
  const listEl = document.createElement('div');
  listEl.id = 'friends-list';
  right.appendChild(listEl);

  // Add Friend button
  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add Friend';
  Object.assign(addBtn.style, {
    marginTop: '12px',
    padding: '8px 20px',
    background: '#2d6cdf',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  });
  right.appendChild(addBtn);

  addBtn.addEventListener('click', () => {
    openAddFriendModal(getState(), (updated) => onUpdate(updated));
  });

  // Initial render
  renderFriends(getState());
}

function renderFriends(state) {
  const listEl = document.getElementById('friends-list');
  if (!listEl) return;

  const friends = state.friends || [];
  listEl.innerHTML = '';

  if (friends.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = `${state.name} does not have any friends yet.`;
    Object.assign(empty.style, {
      fontStyle: 'italic', color: '#3f3f3f',
      fontWeight: 'bold', fontSize: 'small',
      marginTop: '10px', marginBottom: '8px',
    });
    listEl.appendChild(empty);
    return;
  }

  friends.forEach((friend) => {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      marginBottom: '6px',
      background: '#f0f4ff',
      borderRadius: '6px',
      border: '1px solid #d0ddf7',
    });

    // Avatar + name
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '10px';

    const avatar = document.createElement('div');
    avatar.textContent = friend.name.charAt(0).toUpperCase();
    Object.assign(avatar.style, {
      width: '34px', height: '34px',
      borderRadius: '50%',
      background: '#2d6cdf',
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: '16px', flexShrink: '0',
    });

    const nameEl = document.createElement('div');
    nameEl.textContent = friend.name;
    nameEl.style.fontWeight = 'bold';
    nameEl.style.fontSize = '14px';

    left.appendChild(avatar);
    left.appendChild(nameEl);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove friend';
    Object.assign(removeBtn.style, {
      background: 'none',
      border: 'none',
      color: '#999',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '2px 6px',
      borderRadius: '4px',
    });
    removeBtn.addEventListener('mouseenter', () => removeBtn.style.color = '#e53935');
    removeBtn.addEventListener('mouseleave', () => removeBtn.style.color = '#999');
    removeBtn.addEventListener('click', () => {
      // Load fresh state
      const fresh = loadState();
      fresh.friends = (fresh.friends || []).filter(f => f.id !== friend.id);
      saveState(fresh);
      renderFriends(fresh);
    });

    row.appendChild(left);
    row.appendChild(removeBtn);
    listEl.appendChild(row);
  });
}

function openAddFriendModal(state, onSave) {
  const backdrop = document.createElement('div');
  Object.assign(backdrop.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: '1000',
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    background: 'white',
    borderRadius: '10px',
    padding: '32px 36px',
    width: '380px',
    maxWidth: '95vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    fontFamily: 'Arial, sans-serif',
  });

  modal.innerHTML = `
    <h2 style="margin:0 0 20px;font-size:1.2rem;color:#2d6cdf;">Add a Friend</h2>
    <div style="margin-bottom:20px;">
      <label style="display:block;font-weight:bold;margin-bottom:6px;font-size:14px;">Friend's Name</label>
      <input id="f_name" type="text" placeholder="Enter their name…" style="${inputStyle()}">
      <p id="f_error" style="color:#e53935;font-size:12px;margin:6px 0 0;display:none;">Please enter a name.</p>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;">
      <button id="f_cancel" style="${cancelBtnStyle()}">Cancel</button>
      <button id="f_add"    style="${saveBtnStyle()}">Add Friend</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  modal.querySelector('#f_name').focus();

  const close = () => document.body.removeChild(backdrop);

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  modal.querySelector('#f_cancel').addEventListener('click', close);

  modal.querySelector('#f_add').addEventListener('click', () => {
    const nameInput = modal.querySelector('#f_name');
    const errorEl   = modal.querySelector('#f_error');
    const name = nameInput.value.trim();

    if (!name) {
      errorEl.style.display = 'block';
      flash(nameInput);
      return;
    }

    // Always load fresh state
    const freshState = loadState();
    const friends    = freshState.friends || [];

    if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      errorEl.textContent = 'That friend is already added.';
      errorEl.style.display = 'block';
      flash(nameInput);
      return;
    }

    const newFriend = {
      id:    Date.now().toString(),
      name,
      since: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };

    const updated = { ...freshState, friends: [...friends, newFriend] };
    close();
    onSave(updated);
  });

  // Allow Enter key to submit
  modal.querySelector('#f_name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') modal.querySelector('#f_add').click();
  });
}


function openEditModal(state, onSave) {
  // Backdrop
  const backdrop = document.createElement('div');
  Object.assign(backdrop.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: '1000',
  });

  // Modal box
  const modal = document.createElement('div');
  Object.assign(modal.style, {
    background: 'white',
    borderRadius: '10px',
    padding: '35px 40px',
    width: '460px',
    maxWidth: '95vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    fontFamily: 'Arial, sans-serif',
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
        <option ${state.gender==='Male'?'selected':''}>Male</option>
        <option ${state.gender==='Female'?'selected':''}>Female</option>
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
  modal.querySelector('#m_name').focus();

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  modal.querySelector('#m_cancel').addEventListener('click', close);

  modal.querySelector('#m_save').addEventListener('click', () => {
    const name = modal.querySelector('#m_name').value.trim();
    if (!name) { flash(modal.querySelector('#m_name')); return; }

    const updated = {
      ...state,
      name,
      age:          modal.querySelector('#m_age').value,
      gender:       modal.querySelector('#m_gender').value,
      aboutMe:      modal.querySelector('#m_about').value.trim(),
      whyShape:     modal.querySelector('#m_why').value.trim(),
      inspirations: modal.querySelector('#m_inspo').value.trim(),
    };
    close();
    onSave(updated);
  });

  function close() { document.body.removeChild(backdrop); }
}

// ── Photo Picker ──────────────────────────────
function openPhotoPicker(state, onSave) {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*';

  input.addEventListener('change', () => {
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
  el.style.borderColor = '#e53935';
  el.focus();
  setTimeout(() => { el.style.borderColor = '#ccc'; }, 1500);
}

// Escape HTML to avoid XSS in innerHTML
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
