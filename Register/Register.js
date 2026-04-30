// =============================================
//   HEALTH PROFILE PAGE — Age, Height, Gender
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('healthForm');
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const submitBtn = document.getElementById('submitBtn');

    // Helper: show temporary toast message
    function showMessage(text, isError = false) {
        let toast = document.querySelector('.custom-toast');
        if (toast) toast.remove();
        
        toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.textContent = text;
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = isError ? '#e53935' : '#28a745';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '40px';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '500';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Clear previous inline errors
    function clearFieldErrors() {
        document.querySelectorAll('.error-msg').forEach(el => el.remove());
        document.querySelectorAll('.input-group').forEach(g => g.classList.remove('error', 'success'));
    }

    function showFieldError(inputElement, message) {
        const group = inputElement.closest('.input-group');
        if (!group) return;
        group.classList.add('error');
        group.classList.remove('success');
        const existing = group.parentNode.querySelector('.error-msg');
        if (existing) existing.remove();
        const errSpan = document.createElement('p');
        errSpan.className = 'error-msg';
        errSpan.style.color = '#e53935';
        errSpan.style.fontSize = '12px';
        errSpan.style.margin = '-8px 0 10px 4px';
        errSpan.textContent = message;
        group.insertAdjacentElement('afterend', errSpan);
    }

    function showFieldSuccess(inputElement) {
        const group = inputElement.closest('.input-group');
        if (group) {
            group.classList.remove('error');
            group.classList.add('success');
            const next = group.nextElementSibling;
            if (next && next.classList.contains('error-msg')) next.remove();
        }
    }

    // Real-time validation (optional)
    ageInput.addEventListener('input', () => {
        const val = parseInt(ageInput.value);
        if (ageInput.value && (isNaN(val) || val < 1 || val > 120)) {
            showFieldError(ageInput, 'Age must be between 1 and 120');
        } else if (ageInput.value) {
            showFieldSuccess(ageInput);
        } else {
            const group = ageInput.closest('.input-group');
            group?.classList.remove('error', 'success');
            const next = group?.nextElementSibling;
            if (next?.classList?.contains('error-msg')) next.remove();
        }
    });

    heightInput.addEventListener('input', () => {
        const val = parseInt(heightInput.value);
        if (heightInput.value && (isNaN(val) || val < 50 || val > 300)) {
            showFieldError(heightInput, 'Height must be between 50 cm and 300 cm');
        } else if (heightInput.value) {
            showFieldSuccess(heightInput);
        } else {
            const group = heightInput.closest('.input-group');
            group?.classList.remove('error', 'success');
            const next = group?.nextElementSibling;
            if (next?.classList?.contains('error-msg')) next.remove();
        }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFieldErrors();

        let isValid = true;
        const age = parseInt(ageInput.value);
        const height = parseFloat(heightInput.value);
        let selectedGender = null;
        for (let radio of genderRadios) {
            if (radio.checked) {
                selectedGender = radio.value;
                break;
            }
        }

        // Validate age
        if (!ageInput.value.trim()) {
            showFieldError(ageInput, 'Please enter your age');
            isValid = false;
        } else if (isNaN(age) || age < 1 || age > 120) {
            showFieldError(ageInput, 'Age must be between 1 and 120');
            isValid = false;
        } else {
            showFieldSuccess(ageInput);
        }

        // Validate height
        if (!heightInput.value.trim()) {
            showFieldError(heightInput, 'Please enter your height');
            isValid = false;
        } else if (isNaN(height) || height < 50 || height > 300) {
            showFieldError(heightInput, 'Height must be between 50 cm and 300 cm');
            isValid = false;
        } else {
            showFieldSuccess(heightInput);
        }

        // Validate gender
        if (!selectedGender) {
            const genderGroup = document.querySelector('.input-group:has(input[name="gender"])');
            if (genderGroup && !document.querySelector('.gender-error-msg')) {
                const err = document.createElement('p');
                err.className = 'error-msg gender-error-msg';
                err.style.color = '#e53935';
                err.style.fontSize = '12px';
                err.style.margin = '-8px 0 10px 4px';
                err.textContent = 'Please select your gender';
                genderGroup.insertAdjacentElement('afterend', err);
            }
            isValid = false;
        } else {
            const existingErr = document.querySelector('.gender-error-msg');
            if (existingErr) existingErr.remove();
        }

        if (isValid) {
            // Save data (e.g., to localStorage or send to server)
            const profile = {
                age: age,
                height: height,
                gender: selectedGender,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('healthProfile', JSON.stringify(profile));
            console.log('Profile saved:', profile);
            
            // Visual feedback
            submitBtn.textContent = 'Saved ✓';
            submitBtn.style.backgroundColor = '#28a745';
            showMessage('Profile saved successfully!', false);
            setTimeout(() => {
                submitBtn.textContent = 'Save Profile';
                submitBtn.style.backgroundColor = '#0066ee';
            }, 2000);
            
            // Optional: redirect or enable next step
            // window.location.href = 'dashboard.html';
        } else {
            showMessage('Please fix the errors above', true);
        }
    });
});