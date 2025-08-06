# 🚀 Colooky - Production Repository

Transform your GitHub repositories into beautiful subway map visualizations.

## 🎨 What is Colooky?

Colooky is a SaaS platform that helps developers visualize their code structure through interactive subway map-style diagrams. Perfect for understanding complex projects, onboarding team members, and creating stunning presentations of your work.

## ✨ Features

- **Beautiful Visualizations**: Transform code into intuitive subway maps
- **GitHub Integration**: Seamless OAuth and repository sync
- **Team Collaboration**: Share visualizations with your team
- **Export Options**: PNG/SVG export for presentations
- **Subscription Tiers**: Individual, Team, and Enterprise plans

## 🏗️ Architecture

- **Frontend**: Next.js 14 with Tailwind CSS
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for performance
- **Payments**: Stripe integration
- **Auth**: GitHub OAuth

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Media-Team-Logic-Inc/colooky-production.git
cd colooky-production
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Install dependencies**
```bash
# Frontend
cd frontend && npm install

# Backend  
cd ../backend && npm install
```

4. **Start development servers**
```bash
# Frontend (port 3000)
cd frontend && npm run dev

# Backend (port 3001)
cd backend && npm run dev
```

## 📊 Subscription Plans

- **Individual**: $19/mo - 10 repositories, standard visualizations
- **Team**: $49/mo - 50 repositories, 5 team members, advanced features
- **Enterprise**: $199/mo - Unlimited everything, custom branding, SSO

## 🔧 Production Deployment

Deploy to Railway for backend, Vercel for frontend:

1. **Backend to Railway**: Deploy from GitHub, add Redis service
2. **Frontend to Vercel**: Connect repository, set environment variables
3. **Domain**: Point colooky.com to Vercel, api.colooky.com to Railway

## 📋 Environment Variables

Key variables needed for production:
- `NEXTAUTH_URL=https://colooky.com`
- `NEXT_PUBLIC_API_URL=https://api.colooky.com`
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `STRIPE_SECRET_KEY` & publishable key
- `DATABASE_URL` (Supabase)
- `REDIS_URL` (Railway Redis)

## 🛡️ Security

- Environment variables protected by .gitignore
- JWT authentication with secure secrets
- Rate limiting and CORS configured
- Stripe webhooks for secure payments

---

Built with ❤️ using Claude Code
