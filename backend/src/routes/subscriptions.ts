import express from 'express';
import { StripeService } from '../services/stripe';
import { UsageService } from '../services/usage';

const router = express.Router();

// Create checkout session
router.post('/checkout', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { tier, interval = 'monthly', promoCode, affiliateCode } = req.body;

    const result = await StripeService.createCheckoutSession({
      userId,
      tier,
      interval,
      promoCode,
      affiliateCode,
      successUrl: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing`
    });

    res.json(result);
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Validate promo code
router.post('/validate-promo', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { code, tier, interval = 'monthly' } = req.body;

    const result = await StripeService.validatePromoCode(code, userId, tier, interval);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get usage statistics
router.get('/usage', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const usage = await UsageService.getUserUsage(userId);
    res.json({ usage });
  } catch (error) {
    console.error('Usage fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// Create customer portal session
router.post('/portal', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const session = await StripeService.createCustomerPortalSession(
      userId,
      `${process.env.FRONTEND_URL}/dashboard`
    );
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;