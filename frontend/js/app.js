function redirectIfAuthenticated() {
  const token = localStorage.getItem('authToken');
  if (token && window.location.pathname.endsWith('login.html')) {
    window.location.href = 'dashboard.html';
  }
}

function protectRoute() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  redirectIfAuthenticated();

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('userProStatus');
      window.location.href = 'login.html';
    });
  }

  if (window.location.pathname.endsWith('dashboard.html')) {
    protectRoute();
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    const proStatus = localStorage.getItem('userProStatus') === 'true';

    if (user) {
      const summary = document.getElementById('resultsSummary');
      if (summary) {
        summary.textContent = `Signed in as ${user.email}. Ready to analyze your code.`;
      }

      const proStatusEl = document.getElementById('proStatus');
      const upgradeButton = document.getElementById('upgradeButton');

      if (proStatus) {
        if (proStatusEl) {
          proStatusEl.textContent = '✓ Pro';
          proStatusEl.classList.add('pro-active');
        }
        if (upgradeButton) {
          upgradeButton.style.display = 'none';
        }
      } else {
        if (proStatusEl) {
          proStatusEl.textContent = 'Free plan';
        }
        if (upgradeButton) {
          upgradeButton.style.display = 'inline-block';
          upgradeButton.addEventListener('click', () => {
            window.upgrade();
          });
        }
      }
    }
  }
});
