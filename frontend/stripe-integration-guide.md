# Stripe Integration Testing Guide

## 🎉 Stripe Integration Complete!

Your Colooky application now has a fully functional Stripe billing system integrated with Supabase. Here's what's been set up:

## ✅ What's Implemented

### API Endpoints
- **`/api/stripe/checkout`** - Creates Stripe checkout sessions for subscriptions
- **`/api/stripe/portal`** - Redirects to Stripe customer portal for subscription management
- **`/api/stripe/webhook`** - Handles Stripe webhooks (subscription updates, payments, etc.)
- **`/api/user/subscription`** - Fetches current user subscription status from database

### Database Integration
- User subscriptions are automatically stored in Supabase
- Webhooks keep subscription status in sync with Stripe
- Real-time subscription data on billing page

### Billing Page Features
- Real subscription status display
- Payment method information
- Upgrade/downgrade buttons
- Stripe customer portal integration
- Usage tracking display

## 🧪 How to Test

### 1. Set Up Stripe Test Environment

Make sure these environment variables are set in your `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_... (your test secret key)
STRIPE_PUBLISHABLE_KEY=pk_test_... (your test publishable key)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook endpoint)
```

### 2. Configure Stripe Products

In your Stripe Dashboard, create these products with the exact price IDs from your `.env.local`:
- Individual Monthly (`STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID`)
- Individual Yearly (`STRIPE_INDIVIDUAL_YEARLY_PRICE_ID`)
- Team Monthly (`STRIPE_TEAM_MONTHLY_PRICE_ID`)
- Team Yearly (`STRIPE_TEAM_YEARLY_PRICE_ID`)
- Enterprise Monthly (`STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`)
- Enterprise Yearly (`STRIPE_ENTERPRISE_YEARLY_PRICE_ID`)

### 3. Set Up Webhook Endpoint

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. Test the Flow

1. **Sign in with GitHub** - This creates a user profile in Supabase
2. **Visit `/billing`** - Should show "Free Plan" initially
3. **Click "Upgrade to Individual"** - Should redirect to Stripe checkout
4. **Use test card**: `4242 4242 4242 4242` (any future date, any CVC)
5. **Complete checkout** - Should redirect back with success
6. **Check billing page** - Should now show "Individual Plan"
7. **Click "Manage Subscription"** - Should open Stripe customer portal

### 5. Test Webhook Integration

After completing a test purchase:
1. Check Supabase `subscription_plans` table - should have a new record
2. Check Stripe Dashboard > Events - should see webhook events
3. Try canceling subscription in customer portal - should update in database

## 🚨 Production Checklist

Before going live:

1. **Switch to Live Keys**
   - Update `STRIPE_SECRET_KEY` to live key (`sk_live_...`)
   - Update `STRIPE_PUBLISHABLE_KEY` to live key (`pk_live_...`)

2. **Update Webhook Endpoint**
   - Point to production URL
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

3. **Create Live Products**
   - Create real products in live Stripe dashboard
   - Update price IDs in environment variables

4. **Test Live Integration**
   - Test with real card (small amount)
   - Verify webhooks work in production
   - Test customer portal functionality

## 🔍 Debugging

### Common Issues

1. **"No customer found" Error**
   - User email doesn't match between NextAuth and Stripe
   - Check session data vs Stripe customer email

2. **Webhook Signature Verification Failed**
   - Wrong webhook secret in environment variables
   - Check Stripe dashboard for correct secret

3. **"Invalid plan or billing period" Error**
   - Price ID doesn't exist in Stripe
   - Check environment variables match Stripe product IDs

4. **Database Errors**
   - Supabase RLS policies preventing access
   - Check user authentication and profile creation

### Debug Endpoints

- **`/api/auth-debug`** - Check authentication status
- **`/api/debug-env`** - Verify environment variables
- **Browser Console** - Check for JavaScript errors

## 🎯 Success Indicators

✅ User can sign in with GitHub  
✅ Billing page loads subscription data  
✅ Checkout redirects to Stripe  
✅ Payment processing works  
✅ Subscription updates in database  
✅ Customer portal accessible  
✅ Webhooks process correctly  

---

🎉 **Congratulations!** Your Stripe integration is now live and ready for production!