function showError(element, message) {
  if (element) {
    element.textContent = message;
  }
}

function clearError(element) {
  if (element) {
    element.textContent = '';
  }
}

async function authRequest(endpoint, payload) {
  const response = await fetch(`${apiBase}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

function saveSession(data) {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('authUser', JSON.stringify(data.user));
  localStorage.setItem('userProStatus', data.user.is_pro ? 'true' : 'false');
}

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorField = document.getElementById('loginError');
    clearError(errorField);

    if (!email || !password) {
      showError(errorField, 'Enter both email and password.');
      return;
    }

    try {
      const result = await authRequest('login', { email, password });
      saveSession(result);
      window.location.href = 'dashboard.html';
    } catch (error) {
      showError(errorField, error.message);
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const errorField = document.getElementById('signupError');
    clearError(errorField);

    if (!email || !password) {
      showError(errorField, 'Enter both email and password.');
      return;
    }

    if (password.length < 6) {
      showError(errorField, 'Password must be at least 6 characters.');
      return;
    }

    try {
      const result = await authRequest('signup', { email, password });
      saveSession(result);
      window.location.href = 'dashboard.html';
    } catch (error) {
      showError(errorField, error.message);
    }
  });
}
