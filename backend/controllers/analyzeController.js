function analyzeCode(code) {
  const lines = code.split(/\r?\n/);
  const bugs = [];

  lines.forEach((line, index) => {
    const number = index + 1;
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    if (/==\s*\d+/.test(trimmed) && !/===/.test(trimmed)) {
      bugs.push({
        severity: 'medium',
        message: 'Use strict equality for reliable comparisons.',
        line: number,
        suggestion: 'Replace == with === to avoid type coercion.',
      });
    }

    if (/console\.(log|debug|warn)\(/.test(trimmed)) {
      bugs.push({
        severity: 'low',
        message: 'Debug statement detected.',
        line: number,
        suggestion: 'Remove console statements from production code.',
      });
    }

    if (/var\s+\w+/.test(trimmed)) {
      bugs.push({
        severity: 'low',
        message: 'Legacy variable declaration found.',
        line: number,
        suggestion: 'Use const or let instead of var.',
      });
    }

    if (/function\s+\w+\s*\(/.test(trimmed) && trimmed.endsWith('{')) {
      bugs.push({
        severity: 'low',
        message: 'Named function declared with block scope.',
        line: number,
        suggestion: 'Consider using arrow functions or module-scoped declarations.',
      });
    }

    if (/\bTODO\b/.test(trimmed)) {
      bugs.push({
        severity: 'low',
        message: 'TODO comment found.',
        line: number,
        suggestion: 'Resolve TODO items before production deployment.',
      });
    }

    if (/\bPromise\.all\(/.test(trimmed) && /await/.test(trimmed) === false) {
      bugs.push({
        severity: 'medium',
        message: 'Promise.all result is not awaited.',
        line: number,
        suggestion: 'Use await Promise.all(...) when processing asynchronous results.',
      });
    }
  });

  if (bugs.length === 0 && code.trim()) {
    bugs.push({
      severity: 'low',
      message: 'No obvious issues found.',
      line: 0,
      suggestion: 'Review code manually or add more thorough analysis rules.',
    });
  }

  return bugs;
}

function analyze(req, res) {
  const { code, userId } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Code is required for analysis.' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { readUsers, writeUsers } = require('../utils/userStore');
  const users = readUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (!user.is_pro) {
    return res.status(403).json({ error: 'Upgrade required to analyze code.' });
  }

  const bugs = analyzeCode(code);

  // Track scan usage
  if (!user.scans_used) {
    user.scans_used = 0;
  }
  user.scans_used += 1;
  writeUsers(users);

  return res.json({ bugs, scans_used: user.scans_used });
}

module.exports = { analyze };
