async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');

  if (!user || !user.id) {
    console.warn('No authenticated user found');
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/dashboard?userId=${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Dashboard fetch error:', data.error);
      return;
    }

    document.getElementById('plan').textContent = data.plan;
    document.getElementById('scans').textContent = data.scans_used;
  } catch (error) {
    console.error('Dashboard load error:', error);
  }
}

// Expose to global scope for analyze.js
window.loadDashboard = loadDashboard;

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('dashboard.html')) {
    loadDashboard();
  }
});
