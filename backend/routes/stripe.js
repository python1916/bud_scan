const express = require('express');
const Stripe = require('stripe');
const { readUsers, writeUsers } = require('../utils/userStore');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email are required.' });
  }

  try {
    const users = readUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId },
      });
      customerId = customer.id;
      user.stripe_customer_id = customerId;
      writeUsers(users);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.BASE_URL}/dashboard.html?upgraded=true`,
      cancel_url: `${process.env.BASE_URL}/dashboard.html`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

module.exports = router;
