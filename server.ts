import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // ==========================================
  // SAFEPAY INTEGRATION (MOCK ENDPOINTS)
  // ==========================================

  // 1. Create Checkout Session
  app.post('/api/safepay/checkout', async (req, res) => {
    try {
      const { plan, userId, email } = req.body;
      
      // TODO: Call Safepay API here to generate a checkout token/URL
      // const response = await fetch('https://sandbox.api.getsafepay.com/order/v1/init', { ... })
      
      const mockAmount = plan === 'yearly' ? 9999 : 999;
      
      // Simulate a delay
      await new Promise(r => setTimeout(r, 1000));

      // Return a mock checkout URL for now
      // In production, return the actual Safepay checkout URL
      res.json({
        success: true,
        checkoutUrl: `/mock-safepay-checkout?plan=${plan}&userId=${userId}&amount=${mockAmount}`,
        token: `mock_safepay_token_${Date.now()}`
      });
    } catch (error) {
      console.error('Safepay Checkout Error:', error);
      res.status(500).json({ error: 'Failed to initialize payment' });
    }
  });

  // 2. Webhook / Callback Handler
  app.post('/api/safepay/webhook', async (req, res) => {
    try {
      const { transaction_id, status, reference, custom_data } = req.body;
      
      // TODO: Verify Safepay signature here to ensure the webhook is legitimate
      
      if (status === 'PAID') {
        const userId = custom_data?.userId;
        const plan = custom_data?.plan;
        
        // TODO: Use firebase-admin to update the user's subscriptionStatus in Firestore
        // import * as admin from 'firebase-admin';
        // await admin.firestore().collection('users').doc(userId).update({
        //   subscriptionStatus: 'premium',
        //   plan: plan,
        //   trialEndsAt: new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        // });
        
        console.log(`Payment confirmed for user ${userId}. Subscription updated to premium.`);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).send('Webhook Error');
    }
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
