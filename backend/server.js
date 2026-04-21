const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const stripeRoutes = require('./routes/stripe');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');

const allowedOrigins = [
  "http://localhost:3000",
  "https://bud-scan-nrqb.vercel.app",
  "https://bud-scan.onrender.com" // ✅ ADD THIS
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS blocked"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// Stripe webhook (must be after CORS but before express.json())
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { readUsers, writeUsers } = require('./utils/userStore');

    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("Webhook error:", err.message);
      return res.status(400).send(err.message);
    }

    // ✅ Payment success
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerId = session.customer;

      const users = readUsers();
      const userIndex = users.findIndex((user) => user.stripe_customer_id === customerId);

      if (userIndex !== -1) {
        users[userIndex].is_pro = true;
        users[userIndex].stripe_subscription_id = session.subscription;
        writeUsers(users);
      }
    }

    // ❌ Cancel subscription
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const customerId = sub.customer;

      const users = readUsers();
      const userIndex = users.findIndex((user) => user.stripe_customer_id === customerId);

      if (userIndex !== -1) {
        users[userIndex].is_pro = false;
        users[userIndex].stripe_subscription_id = null;
        writeUsers(users);
      }
    }

    // ❌ Payment failed
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const users = readUsers();
      const userIndex = users.findIndex((user) => user.stripe_customer_id === customerId);

      if (userIndex !== -1) {
        users[userIndex].is_pro = false;
        writeUsers(users);
      }
    }

    // ✅ Invoice paid (renewal)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const users = readUsers();
      const userIndex = users.findIndex((user) => user.stripe_customer_id === customerId);

      if (userIndex !== -1) {
        users[userIndex].is_pro = true;
        writeUsers(users);
      }
    }

    res.json({ received: true });
  }
);

// ✅ THEN body parser
app.use(express.json());

// Dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const { readUsers } = require('./utils/userStore');
  const users = readUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    is_pro: user.is_pro,
    scans_used: user.scans_used || 0,
    plan: user.is_pro ? 'Pro' : 'Free',
    stripe_customer_id: user.stripe_customer_id || null,
  });
});

app.use('/auth', authRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/stripe', stripeRoutes);
app.use(express.static(FRONTEND_PATH));

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bug Analyzer backend running on http://localhost:${PORT}`);
});
