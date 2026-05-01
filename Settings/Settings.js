let settingsState = {
  name: '',
  age: '',
  gender: 'Male',
  aboutMe: '',
  whyShape: '',
  inspirations: '',
};

function loadSettingsState() {
  return { ...settingsState };
}

function saveSettingsState(state) {
  settingsState = { ...state };
}

function initSettingsPage() {
  const state = loadSettingsState();

  const nameInput = document.getElementById('nameInput');
  const ageInput = document.getElementById('ageInput');
  const genderInput = document.getElementById('genderInput');
  const aboutInput = document.getElementById('aboutInput');
  const whyInput = document.getElementById('whyInput');
  const inspoInput = document.getElementById('inspoInput');
  const form = document.getElementById('settingsForm');
  const saveMessage = document.getElementById('saveMessage');
  const cancelBtn = document.getElementById('cancelBtn');

  nameInput.value = state.name || '';
  ageInput.value = state.age || '';
  genderInput.value = state.gender || 'Male';
  aboutInput.value = state.aboutMe || '';
  whyInput.value = state.whyShape || '';
  inspoInput.value = state.inspirations || '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!nameInput.value.trim()) {
      nameInput.focus();
      nameInput.style.borderColor = '#ef4444';
      setTimeout(() => { nameInput.style.borderColor = '#d1d5db'; }, 1400);
      return;
    }

    const updatedState = {
      name: nameInput.value.trim(),
      age: ageInput.value.trim(),
      gender: genderInput.value,
      aboutMe: aboutInput.value.trim(),
      whyShape: whyInput.value.trim(),
      inspirations: inspoInput.value.trim(),
    };

    saveSettingsState(updatedState);
    saveMessage.hidden = false;
    setTimeout(() => { saveMessage.hidden = true; }, 3000);
  });

  cancelBtn.addEventListener('click', () => {
    window.location.href = '/profile';
  });
}

document.addEventListener('DOMContentLoaded', initSettingsPage);
