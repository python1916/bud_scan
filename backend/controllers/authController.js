const { readUsers, writeUsers } = require('../utils/userStore');

function generateToken(email) {
  return Buffer.from(`${email}:${Date.now()}`).toString('base64');
}

function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const users = readUsers();

  if (users.find((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ error: 'User already exists.' });
  }

  const newUser = {
    id: Date.now().toString(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
    is_pro: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };

  users.push(newUser);
  writeUsers(users);

  return res.status(201).json({
    message: 'Signup successful.',
    token: generateToken(normalizedEmail),
    user: { id: newUser.id, email: normalizedEmail, is_pro: false },
  });
}

function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readUsers();
  const normalizedEmail = email.toLowerCase();
  const user = users.find((item) => item.email === normalizedEmail && item.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  return res.status(200).json({
    message: 'Login successful.',
    token: generateToken(normalizedEmail),
    user: { id: user.id, email: normalizedEmail, is_pro: user.is_pro },
  });
}

module.exports = { signup, login };