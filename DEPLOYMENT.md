# CodeForge AI - Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **OpenAI API Key**: Get your key from [platform.openai.com](https://platform.openai.com)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Environment Variables

You need to set up environment variables in Vercel Dashboard:

#### Required Environment Variables:

**Backend Variables:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `3000`

**Frontend Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_API_URL` - Your backend API URL (will be provided after first deploy)

#### Optional Variables:
- `GITHUB_TOKEN` - For GitHub integration
- `LOG_LEVEL` - Set to `info` or `debug`

### Step 4: Deploy to Vercel

#### Option A: Deploy via CLI

```bash
# From project root
vercel

# Or for production
vercel --prod
```

#### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration
5. Add environment variables in the dashboard
6. Click "Deploy"

### Step 5: Set up Supabase Database

Run the migrations in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Run each migration file in order from supabase/migrations/
```

Or use Supabase CLI:

```bash
npx supabase db push
```

### Step 6: Update Frontend API URL

After deployment, update the `VITE_API_URL` environment variable with your Vercel backend URL:

```
VITE_API_URL=https://your-project.vercel.app
```

Then redeploy the frontend.

## 🔧 Troubleshooting

### Issue: Backend timeout errors

**Solution:** Vercel Serverless Functions have a 10s timeout on hobby plan. Consider:
- Upgrading to Pro plan (60s timeout)
- Optimizing long-running operations
- Using background jobs for heavy tasks

### Issue: Build fails

**Solution:** Check these common issues:
1. All dependencies are in `package.json`
2. TypeScript errors are resolved
3. Environment variables are set correctly
4. Node version matches (≥20.0.0)

### Issue: API routes not working

**Solution:** 
1. Verify `vercel.json` routing configuration
2. Check backend endpoints start with `/api/`
3. Ensure CORS is configured properly

## 📊 Monitoring

- **Logs**: Check Vercel Dashboard > Project > Logs
- **Analytics**: Enable Vercel Analytics in dashboard
- **Errors**: Check Vercel Dashboard > Project > Errors

## 🔄 Continuous Deployment

Once connected to Git:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Auto-deploy to preview URLs
- Pull requests → Get preview deployments

## 🌐 Custom Domain

1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

## 📝 Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Supabase migrations are run
- [ ] Frontend can connect to backend
- [ ] Authentication works
- [ ] API endpoints respond correctly
- [ ] Database queries work
- [ ] File uploads work (if applicable)
- [ ] Custom domain is configured (optional)

## 🔐 Security Notes

- Never commit `.env` files
- Use Vercel's encrypted environment variables
- Enable RLS (Row Level Security) in Supabase
- Use HTTPS only
- Set up proper CORS policies
- Rotate API keys regularly

## 💰 Cost Considerations

**Vercel Free (Hobby) Plan Limits:**
- 100 GB bandwidth/month
- 6,000 build minutes/month
- 10s serverless function timeout
- 100 GB-hours function execution

**Supabase Free Plan Limits:**
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth/month
- 50,000 monthly active users

For production apps, consider upgrading to paid plans.

## 🆘 Need Help?

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- GitHub Issues: [Your repo issues page]
