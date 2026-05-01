document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const username = document.getElementById('username');
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const emailInput = document.getElementById('email');
    const confirmEmail = document.getElementById('confirmEmail');
    const passwordInput = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const strengthBar = document.getElementById('strengthBar');
    const strengthLabel = document.getElementById('strengthLabel');
    const capsWarning = document.getElementById('capsWarning');
    const signupBtn = document.getElementById('signupBtn');

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const getGroup = (input) => input.closest('.input-group');

    function setError(input, message) {
        const group = getGroup(input);
        if (!group) return;
        group.classList.add('error');
        group.classList.remove('success');
        const next = group.nextElementSibling;
        if (next && next.classList.contains('error-msg')) next.remove();
        if (message.trim()) {
            const msg = document.createElement('p');
            msg.className = 'error-msg';
            msg.textContent = message;
            group.insertAdjacentElement('afterend', msg);
        }
    }

    function clearError(input) {
        const group = getGroup(input);
        if (!group) return;
        group.classList.remove('error');
        const next = group.nextElementSibling;
        if (next && next.classList.contains('error-msg')) next.remove();
    }

    function setSuccess(input) {
        const group = getGroup(input);
        if (!group) return;
        group.classList.remove('error');
        group.classList.add('success');
        const next = group.nextElementSibling;
        if (next && next.classList.contains('error-msg')) next.remove();
    }

    function showToast(message, duration = 3000) {
        const oldToast = document.querySelector('.ft-toast');
        if (oldToast) oldToast.remove();
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

    function updateStrengthMeter() {
        const value = passwordInput.value;
        let score = 0;
        if (value.length >= 8) score++;
        if (value.length >= 12) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        const pct = value.length === 0 ? 0 : Math.max(20, score * 20);
        const colors = ['', '#e53935', '#e67e00', '#f9a825', '#43a047', '#1b5e20'];
        const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

        strengthBar.style.width = pct + '%';
        strengthBar.style.background = colors[score] || '#e1e4e8';
        strengthLabel.textContent = value.length ? labels[score] : 'Password strength';
        strengthLabel.style.color = colors[score] || '#6a737d';
    }

    [username, ageInput, heightInput, emailInput, confirmEmail, passwordInput, confirmPassword].forEach((input) => {
        input.addEventListener('input', () => clearError(input));
    });

    emailInput.addEventListener('blur', () => {
        const value = emailInput.value.trim();
        if (!value) setError(emailInput, 'Email is required.');
        else if (!isValidEmail(value)) setError(emailInput, 'Please enter a valid email address.');
        else setSuccess(emailInput);
    });

    confirmEmail.addEventListener('blur', () => {
        const value = confirmEmail.value.trim();
        if (!value) setError(confirmEmail, 'Please confirm your email.');
        else if (value !== emailInput.value.trim()) setError(confirmEmail, 'Emails do not match.');
        else if (!isValidEmail(value)) setError(confirmEmail, 'Please enter a valid email address.');
        else setSuccess(confirmEmail);
    });

    passwordInput.addEventListener('input', () => {
        clearError(passwordInput);
        updateStrengthMeter();
    });

    passwordInput.addEventListener('keydown', (event) => {
        capsWarning.classList.toggle('visible', event.getModifierState('CapsLock'));
    });
    passwordInput.addEventListener('keyup', (event) => {
        capsWarning.classList.toggle('visible', event.getModifierState('CapsLock'));
    });

    eyeIcon.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    });

    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();

        let valid = true;

        if (!username.value.trim()) {
            setError(username, 'Username is required.');
            valid = false;
        } else {
            setSuccess(username);
        }

        const ageValue = ageInput.value.trim();
        if (!ageValue) {
            setError(ageInput, 'Age is required.');
            valid = false;
        } else if (isNaN(ageValue) || Number(ageValue) < 1 || Number(ageValue) > 120) {
            setError(ageInput, 'Age must be between 1 and 120.');
            valid = false;
        } else {
            setSuccess(ageInput);
        }

        const heightValue = heightInput.value.trim();
        if (!heightValue) {
            setError(heightInput, 'Height is required.');
            valid = false;
        } else if (isNaN(heightValue) || Number(heightValue) < 50 || Number(heightValue) > 300) {
            setError(heightInput, 'Height must be between 50 and 300 cm.');
            valid = false;
        } else {
            setSuccess(heightInput);
        }

        const emailValue = emailInput.value.trim();
        const confirmEmailValue = confirmEmail.value.trim();

        if (!emailValue) {
            setError(emailInput, 'Email is required.');
            valid = false;
        } else if (!isValidEmail(emailValue)) {
            setError(emailInput, 'Please enter a valid email address.');
            valid = false;
        } else {
            setSuccess(emailInput);
        }

        if (!confirmEmailValue) {
            setError(confirmEmail, 'Please confirm your email.');
            valid = false;
        } else if (confirmEmailValue !== emailValue) {
            setError(confirmEmail, 'Emails do not match.');
            valid = false;
        } else {
            setSuccess(confirmEmail);
        }

        const passwordValue = passwordInput.value;
        if (!passwordValue) {
            setError(passwordInput, 'Password is required.');
            valid = false;
        } else if (passwordValue.length < 6) {
            setError(passwordInput, 'Password must be at least 6 characters.');
            valid = false;
        } else {
            setSuccess(passwordInput);
        }

        if (!confirmPassword.value) {
            setError(confirmPassword, 'Please confirm your password.');
            valid = false;
        } else if (confirmPassword.value !== passwordValue) {
            setError(confirmPassword, 'Passwords do not match.');
            valid = false;
        } else {
            setSuccess(confirmPassword);
        }

        if (!valid) {
            showToast('Please fix the errors and try again.', 3200);
            return;
        }

        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account…';

        setTimeout(() => {
            // TODO: submit registration data to your database/backend here.
            signupBtn.textContent = '✓ Account created!';
            showToast('Account created successfully!');
            setTimeout(() => {
                window.location.href = '../index/index.html';
            }, 800);
        }, 700);
    });
});
