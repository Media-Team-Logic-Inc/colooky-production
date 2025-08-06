# README.md - Production Setup Guide
# 🚀 Colooky - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. **Infrastructure Requirements**
- [ ] Domain name (colooky.com)
- [ ] SSL certificate
- [ ] Server with Docker support (2GB+ RAM recommended)
- [ ] PostgreSQL database
- [ ] Redis instance

### 2. **External Service Setup**

#### GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App:
   - **Application name**: Colooky
   - **Homepage URL**: `https://colooky.com`
   - **Authorization callback URL**: `https://colooky.com/api/auth/github/callback`
3. Save Client ID and Client Secret

#### Stripe Setup
1. Create Stripe account
2. Create products and prices:
   - Individual: $19/month, $190/year
   - Team: $49/month, $490/year  
   - Enterprise: $199/month, $1990/year
3. Set up webhook endpoint: `https://colooky.com/api/webhooks/stripe`
4. Copy all price IDs and webhook secret

### 3. **Environment Configuration**
```bash
# Copy and fill environment variables
cp .env.example .env
# Edit .env with your actual values
```

### 4. **Database Setup**
```bash
# Generate Prisma client
cd backend && npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

## 🚀 **Deployment Options**

### Option 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone <your-repo-url>
cd colooky

# Set up environment
cp .env.example .env
# Edit .env file with your values

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 2: Separate Hosting
- **Frontend**: Deploy to Vercel/Netlify
- **Backend**: Deploy to Railway/Render
- **Database**: Use Supabase/PlanetScale
- **Redis**: Use Upstash/Redis Cloud

### Option 3: Cloud Platforms
- **AWS**: ECS + RDS + ElastiCache
- **Google Cloud**: Cloud Run + Cloud SQL + Memorystore
- **Azure**: Container Instances + Azure Database + Azure Cache

## 🔧 **Post-Deployment Setup**

### 1. **Verify Services**
```bash
# Check all services are running
docker-compose ps

# Test API health
curl https://colooky.com/api/health

# Test frontend
curl https://colooky.com
```

### 2. **Create Admin User**
```bash
# Connect to backend container
docker-compose exec backend npm run create-admin

# Or manually in database
```

### 3. **Set Up Monitoring**
- Configure error tracking (Sentry)
- Set up uptime monitoring
- Enable application metrics

### 4. **Test Complete Flow**
1. [ ] Landing page loads
2. [ ] GitHub OAuth works
3. [ ] Repository sync works
4. [ ] Code analysis completes
5. [ ] Visualization displays
6. [ ] Subscription flow works
7. [ ] Promo codes work
8. [ ] Webhooks receive events

## 📊 **Production Monitoring**

### Key Metrics to Track
- Response times
- Error rates
- User signups
- Subscription conversions
- Code analysis success rate
- Database performance

### Alerts to Configure
- Service downtime
- High error rates
- Failed payments
- Database connection issues
- Disk space warnings

## 🛡️ **Security Checklist**
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Security headers enabled
- [ ] Regular backups scheduled

## 🔄 **Backup Strategy**
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated daily backups
0 2 * * * /path/to/backup-script.sh
```

## 📈 **Scaling Considerations**
- **Frontend**: CDN for static assets
- **Backend**: Load balancer + multiple instances
- **Database**: Read replicas for analytics
- **Cache**: Redis cluster for high availability
- **Files**: Object storage for large repositories
