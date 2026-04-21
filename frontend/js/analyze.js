// DOM
const analyzeButton = document.getElementById('analyzeButton');
const codeInput = document.getElementById('codeInput');
const fileInput = document.getElementById('fileInput');
const resultsList = document.getElementById('resultsList');
const resultsSummary = document.getElementById('resultsSummary');
const analyzeError = document.getElementById('analyzeError');

// ✅ Safe user getter
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser'));
  } catch {
    return null;
  }
}

// ✅ Render results
function renderResults(bugs = []) {
  if (!resultsList) return;

  resultsList.innerHTML = '';

  if (!bugs.length) {
    if (resultsSummary) {
      resultsSummary.textContent = 'No issues found.';
    }
    return;
  }

  bugs.forEach((bug) => {
    const item = document.createElement('li');
    item.className = 'result-item';

    item.innerHTML = `
      <div>
        <div class="tag ${bug.severity}">${bug.severity?.toUpperCase()}</div>
        <p>${bug.message}</p>
      </div>
      <div>
        <p>Line ${bug.line ?? '-'}</p>
        <small>${bug.suggestion ?? ''}</small>
      </div>
    `;

    resultsList.appendChild(item);
  });

  if (resultsSummary) {
    resultsSummary.textContent = `Found ${bugs.length} issue${bugs.length === 1 ? '' : 's'}.`;
  }
}

// ✅ File upload
function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !codeInput) return;

  const reader = new FileReader();
  reader.onload = () => {
    codeInput.value = reader.result || '';
  };
  reader.readAsText(file);
}

// ✅ ANALYZE (with paywall handling)
async function analyzeCode() {
  if (!codeInput) return;

  const code = codeInput.value.trim();
  const user = getUser();

  if (!code) {
    analyzeError.textContent = 'Paste your code first.';
    return;
  }

  if (!user) {
    analyzeError.textContent = 'Please log in first.';
    return;
  }

  analyzeError.textContent = '';

  try {
    const res = await fetch(`${apiBase}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId: user.id }),
    });

    const data = await res.json();

    // 🔒 PAYWALL TRIGGER
    if (res.status === 403) {
      analyzeError.textContent = 'Upgrade required to scan.';
      await upgrade(); // auto send to checkout
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'Analysis failed');
    }

    renderResults(data.bugs);

    // Refresh dashboard stats
    if (window.loadDashboard) {
      window.loadDashboard();
    }
  } catch (err) {
    analyzeError.textContent = err.message;
  }
}

// ✅ STRIPE UPGRADE
async function upgrade() {
  const user = getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${apiBase}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Stripe failed');
    }

    // 🚀 redirect to Stripe
    window.location.href = data.url;
  } catch (err) {
    analyzeError.textContent = err.message;
  }
}

// Events
fileInput?.addEventListener('change', handleFileUpload);
analyzeButton?.addEventListener('click', analyzeCode);

// expose for button onclick
window.upgrade = upgrade;