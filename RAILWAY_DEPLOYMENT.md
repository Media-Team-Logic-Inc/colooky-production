# Railway Deployment Guide for Colooky Backend

## Prerequisites
- Railway account created
- Railway CLI installed and logged in
- Backend build passing (✅ Completed)
- Environment variables configured (✅ Completed)

## Deployment Steps

### 1. Login to Railway CLI
```bash
railway login
```
This will open a browser window for authentication.

### 2. Connect to Existing Project or Create New
```bash
# If you have an existing Railway project
railway link [project-id]

# Or create a new project
railway create
```

### 3. Set Production Environment Variables
Copy the variables from `.env.production` to Railway dashboard:

#### Required Variables:
- `NODE_ENV=production`
- `PORT` (Railway will set this automatically)
- `DATABASE_URL` (from Supabase)
- `DIRECT_URL` (from Supabase)
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID`
- `STRIPE_INDIVIDUAL_YEARLY_PRICE_ID`
- `STRIPE_TEAM_MONTHLY_PRICE_ID`
- `STRIPE_TEAM_YEARLY_PRICE_ID`
- `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
- `STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

#### Set via Railway CLI:
```bash
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://postgres.ziohojpmpsbvokyysstf:bfnhQtGNPfHB2vGX@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
railway variables set DIRECT_URL="postgresql://postgres:bfnhQtGNPfHB2vGX@db.ziohojpmpsbvokyysstf.supabase.co:5432/postgres"
railway variables set JWT_SECRET="a0bedafd9ab5d9c0643ad08062d7b8fa73067e68e227bdd59749a810c9c5cca5"
railway variables set ENCRYPTION_KEY="1649e58340b5f345dd3f3e4b09b16bfb"
railway variables set GITHUB_CLIENT_ID="Ov23liBo1IMBcfDLC1rY"
railway variables set GITHUB_CLIENT_SECRET="bed7c0d5d17b773b355fea1f48c7c1e37c6b1973"
railway variables set STRIPE_SECRET_KEY="sk_test_51RsqJQGwcxGC6sWjbzny34tvN7uXf0DxcMbAsrFEf2d3GzMvZrOvZNdoq4ZJIbVao1AecPXpNfVE0VwW3PQ4PKwn00CV86PRmh"
railway variables set STRIPE_WEBHOOK_SECRET="we_1Rsr9iGwcxGC6sWjbElxsTS5"
# ... add all other Stripe price IDs
```

#### URLs to Update After Deployment:
- `NEXT_PUBLIC_API_URL` - Set to your Railway backend URL
- `FRONTEND_URL` - Set to your frontend domain
- `ALLOWED_ORIGINS` - Set to your frontend domain

### 4. Add Redis Service
```bash
railway add redis
```
This will automatically set the `REDIS_URL` environment variable.

### 5. Deploy Backend
```bash
# From the backend directory
cd backend
railway deploy
```

### 6. Run Database Migrations
```bash
# After successful deployment
railway run npx prisma migrate deploy
```

### 7. Verify Deployment
```bash
# Check service status
railway status

# View logs
railway logs

# Get service URL
railway domain
```

## Configuration Files Status

✅ `railway.toml` - Configured for Nixpacks build
✅ `package.json` - Build scripts ready
✅ `tsconfig.json` - ESM configuration complete
✅ Environment variables template created
✅ Database schema ready (Prisma)

## Post-Deployment Tasks

1. **Update Frontend Configuration:**
   - Update `NEXT_PUBLIC_API_URL` in frontend to point to Railway backend URL
   - Update CORS origins in backend if needed

2. **Test API Endpoints:**
   - Health check: `https://your-backend-url.up.railway.app/health`
   - Auth endpoints: `/api/auth/*`
   - Protected routes with authentication

3. **Configure Custom Domain (Optional):**
   ```bash
   railway domain add yourdomain.com
   ```

4. **Set up Monitoring:**
   - Add Sentry DSN for error tracking
   - Configure logging and analytics

## Troubleshooting

### Build Issues
- Ensure all `.js` extensions are added to imports (✅ Completed)
- Check `package.json` build script
- Verify TypeScript configuration

### Environment Issues
- Double-check all required environment variables are set
- Ensure database URLs are correct
- Verify Redis connection

### Runtime Issues
- Check Railway logs: `railway logs`
- Verify port configuration (Railway sets PORT automatically)
- Check database connectivity

## Current Status
- ✅ ESM module resolution fixed
- ✅ Build process working
- ✅ Environment variables configured
- ⏳ Waiting for Railway CLI login to complete deployment
- ⏳ Redis service to be added after login