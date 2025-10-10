# Heroku Automatic Deployment Setup

## 📋 Prerequisites
- Heroku account
- GitHub repository: `zaikaman/CodeForgeAI`
- Backend code ready in `backend/` folder

## 🔗 Connect GitHub to Heroku

### Method 1: Using Heroku Dashboard (Recommended)

#### Step 1: Create Heroku App
1. Go to [Heroku Dashboard](https://dashboard.heroku.com/)
2. Click **"New"** → **"Create new app"**
3. App name: `codeforge-ai-backend`
4. Region: **United States** (or your preferred)
5. Click **"Create app"**

#### Step 2: Connect to GitHub
1. In your app dashboard, go to the **"Deploy"** tab
2. Under **"Deployment method"**, click **"GitHub"**
3. Click **"Connect to GitHub"**
4. Authorize Heroku to access your GitHub account (if first time)
5. Search for repository: `CodeForgeAI`
6. Click **"Connect"**

#### Step 3: Configure Automatic Deploys
1. Scroll to **"Automatic deploys"** section
2. Select branch: **`main`**
3. ✅ **Optional**: Enable **"Wait for CI to pass before deploy"** (if you have GitHub Actions)
4. Click **"Enable Automatic Deploys"**

#### Step 4: Set Monorepo Configuration
**Important**: Since we're in a monorepo, we need to tell Heroku to deploy from `backend/` folder only.

Go to **"Settings"** tab → **"Buildpacks"**:

**Option A: Using Buildpack (Recommended)**
1. Click **"Add buildpack"**
2. Enter: `https://github.com/timanovsky/subdir-heroku-buildpack`
3. Click **"Save changes"**
4. Add another buildpack: `heroku/nodejs`
5. **Drag** the subdir buildpack to be **FIRST** (above nodejs)

Then add Config Var:
- Key: `PROJECT_PATH`
- Value: `backend`

**Option B: Using Heroku CLI with subtree (Alternative)**
Skip buildpack and use manual subtree push (see Method 2 below)

#### Step 5: Set Environment Variables
Go to **"Settings"** → **"Config Vars"** → **"Reveal Config Vars"**

Add these variables:
```
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://gpt1.shupremium.com/v1
SUPABASE_URL=https://qjoiukjkksxnwgrenobs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-frontend.vercel.app
```

#### Step 6: Enable Session Affinity (for Socket.io)
Go to terminal and run:
```bash
heroku features:enable http-session-affinity -a codeforge-ai-backend
```

#### Step 7: Manual Deploy First Time
In the **"Deploy"** tab → **"Manual deploy"** section:
1. Select branch: **`main`**
2. Click **"Deploy Branch"**

This will trigger the first deployment. After this, every push to `main` will auto-deploy!

---

### Method 2: Using Heroku CLI (Alternative)

If you prefer command line:

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create codeforge-ai-backend

# 3. Add buildpack for monorepo
heroku buildpacks:add -i 1 https://github.com/timanovsky/subdir-heroku-buildpack
heroku buildpacks:add heroku/nodejs
heroku config:set PROJECT_PATH=backend

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=your_key
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set SUPABASE_SERVICE_KEY=your_key
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app

# 5. Enable session affinity
heroku features:enable http-session-affinity

# 6. Connect to GitHub (use dashboard for this)
# Or use git subtree to deploy directly:
git subtree push --prefix backend heroku main
```

---

## 🔄 How Automatic Deployment Works

After setup:
1. You push code to `main` branch on GitHub
2. Heroku detects the push
3. Heroku automatically builds and deploys from `backend/` folder
4. If build succeeds, new version goes live
5. If build fails, previous version stays running

## 📊 Monitor Deployments

### Via Dashboard
1. Go to **"Activity"** tab to see deployment history
2. Go to **"More"** → **"View logs"** to see real-time logs

### Via CLI
```bash
# View logs
heroku logs --tail -a codeforge-ai-backend

# View recent deployments
heroku releases -a codeforge-ai-backend

# Rollback to previous version
heroku rollback -a codeforge-ai-backend
```

## 🎯 Testing Automatic Deployment

1. Make a small change in `backend/` (e.g., update a comment)
2. Commit and push:
```bash
git add backend/
git commit -m "test: trigger automatic deployment"
git push origin main
```
3. Watch deployment in Heroku Dashboard → Activity tab
4. Check logs: `heroku logs --tail -a codeforge-ai-backend`

## 🔔 Enable Notifications

1. In Heroku Dashboard → **App name** → **"Settings"**
2. Scroll to **"App webhooks"**
3. Add webhook URL (e.g., Slack, Discord, email)
4. You'll get notified on every deployment

## 🚀 Installing Flyctl on Heroku

Since Heroku doesn't natively support flyctl, we use a workaround to install it during the build process. This enables preview deployments and Fly.io integration.

### Setup Steps

#### 1. Add Vendor Binaries Buildpack

The project includes a `Vendorfile` that tells Heroku to download flyctl during build:

```bash
# Add vendor binaries buildpack (must be FIRST)
heroku buildpacks:add --index 1 https://github.com/diowa/heroku-buildpack-vendorbinaries.git -a your-app-name

# Verify buildpack order (vendor binaries should be first)
heroku buildpacks -a your-app-name
```

#### 2. Configure PATH for Flyctl

```bash
# Make flyctl executable from anywhere in your app
heroku config:set PATH="/app/vendor/flyctl:$PATH" -a your-app-name
```

#### 3. Set Fly.io API Token

```bash
# Get your Fly.io API token locally
flyctl auth token

# Set it as Heroku config var
heroku config:set FLY_API_TOKEN=your-token -a your-app-name
```

#### 4. Deploy and Test

```bash
# Push to trigger build (flyctl will be downloaded and extracted)
git push heroku main

# Test flyctl installation
heroku run flyctl version -a your-app-name
```

### Automated Setup Script

We provide scripts to automate the buildpack configuration:

**PowerShell (Windows):**
```powershell
.\setup-heroku-flyctl.ps1 -AppName your-app-name -FlyApiToken your-token
```

**Bash (Linux/Mac):**
```bash
chmod +x setup-heroku-flyctl.sh
./setup-heroku-flyctl.sh your-app-name your-token
```

### Vendorfile Configuration

The `Vendorfile` in the project root specifies the flyctl binary to download:
```
https://github.com/superfly/flyctl/releases/latest/download/flyctl_linux_amd64.tar.gz
```

**Notes:**
- Always fetches the latest flyctl version on each deploy
- For a pinned version, replace `/latest/` with a specific tag (e.g., `/v0.3.192/`)
- Binary size (~50MB) adds to slug size
- Extracted to `/app/vendor/flyctl/flyctl` on Heroku dynos

### Usage in Your App

Once installed, you can use flyctl in:

**Scripts (Node.js):**
```javascript
const { exec } = require('child_process');

exec('flyctl deploy', (error, stdout, stderr) => {
  console.log(stdout);
});
```

**Procfile Worker:**
```
worker: node scripts/deploy-preview.js
```

**Terminal Commands:**
```bash
heroku run flyctl apps list -a your-app-name
```

## ⚠️ Important Notes

- **First deployment** must be manual to verify everything works
- **Monorepo**: Make sure `PROJECT_PATH=backend` is set correctly
- **Environment variables**: Double-check all required vars are set
- **Socket.io**: Session affinity MUST be enabled
- **Build time**: First build may take 2-3 minutes (longer with flyctl download)
- **Custom ADK**: Already committed in `backend/node_modules/@iqai/adk`
- **Flyctl**: Vendor binaries buildpack must be FIRST in buildpack order

## 🆘 Troubleshooting

### Build fails with "cannot find module"
- Check if custom ADK is committed: `git ls-files backend/node_modules/@iqai/adk`
- Verify buildpack order: subdir buildpack must be FIRST

### Deploy from wrong folder
- Verify `PROJECT_PATH=backend` is set in Config Vars
- Check buildpack order in Settings → Buildpacks

### Socket.io connections fail
- Enable session affinity: `heroku features:enable http-session-affinity`
- Check CORS settings in `backend/src/api/server.ts`

### Previous deployment keeps running
- Build failed, check logs: `heroku logs --tail`
- Heroku keeps old version running if new build fails

### Flyctl not found on Heroku
- Verify Vendorfile exists in project root
- Check buildpack order: vendor binaries must be FIRST
- Verify PATH config: `heroku config:get PATH -a your-app-name`
- Check build logs for download errors: `heroku logs --tail -a your-app-name`
- Test extraction path: `heroku run ls -la /app/vendor/flyctl -a your-app-name`

### Flyctl authentication fails
- Verify FLY_API_TOKEN is set: `heroku config:get FLY_API_TOKEN -a your-app-name`
- Generate new token locally: `flyctl auth token`
- Update token on Heroku: `heroku config:set FLY_API_TOKEN=new-token -a your-app-name`
