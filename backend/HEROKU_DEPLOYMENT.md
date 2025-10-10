# Backend Deployment Guide (Heroku)

## Prerequisites
- Heroku CLI installed
- Heroku account with credits
- Git installed

## Quick Deploy

### Option 1: Using PowerShell Script (Recommended)
```powershell
# From root directory
.\deploy-heroku-backend.ps1
```

### Option 2: Manual Deployment

1. **Login to Heroku**
```bash
heroku login
```

2. **Create Heroku App**
```bash
cd backend
heroku create codeforge-ai-backend
# or use your preferred name
```

3. **Enable Session Affinity (Required for Socket.io)**
```bash
heroku features:enable http-session-affinity -a codeforge-ai-backend
```

4. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set SUPABASE_URL=https://...supabase.co
heroku config:set SUPABASE_ANON_KEY=eyJ...
heroku config:set SUPABASE_SERVICE_KEY=eyJ...
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
```

5. **Deploy from Monorepo**

**Option A: Using subtree (from root)**
```bash
# From root directory
git subtree push --prefix backend heroku main
```

**Option B: Separate git repo in backend folder**
```bash
cd backend
git init
git add .
git commit -m "Initial backend deployment"
heroku git:remote -a codeforge-ai-backend
git push heroku main
```

6. **Check Deployment**
```bash
heroku logs --tail
heroku open
```

## Environment Variables

Required environment variables:
- `NODE_ENV`: `production`
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `FRONTEND_URL`: Your frontend URL (for CORS)

## Post-Deployment

1. **Update Frontend API URL**
   - Go to Vercel Dashboard
   - Add environment variable: `VITE_API_URL=https://codeforge-ai-backend.herokuapp.com`
   - Redeploy frontend

2. **Test Backend**
```bash
curl https://codeforge-ai-backend.herokuapp.com/api/status
```

3. **Monitor Logs**
```bash
heroku logs --tail -a codeforge-ai-backend
```

## Useful Commands

```bash
# View app info
heroku info

# Scale dynos
heroku ps:scale web=1

# Restart app
heroku restart

# View config
heroku config

# Access bash
heroku run bash

# View metrics
heroku ps
```

## Troubleshooting

### Socket.io not working
- Ensure session affinity is enabled:
  ```bash
  heroku features:enable http-session-affinity
  ```

### Build fails
- Check Node version in `package.json` engines
- Verify all dependencies are in `dependencies`, not `devDependencies`

### App crashes
- Check logs: `heroku logs --tail`
- Verify environment variables: `heroku config`

## Cost Optimization

With $300 credits:
- Use Eco dynos ($5/month) or Basic ($7/month)
- Eco dynos sleep after 30 min inactivity (may affect Socket.io)
- Basic dynos never sleep (recommended for real-time features)

```bash
# Scale to Eco dyno
heroku ps:scale web=1:eco

# Scale to Basic dyno
heroku ps:scale web=1:basic
```
