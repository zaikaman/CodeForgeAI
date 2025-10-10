# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] Create a Vercel account at [vercel.com](https://vercel.com)
- [ ] Create a Supabase project at [supabase.com](https://supabase.com)
- [ ] Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
- [ ] Install Vercel CLI: `npm install -g vercel`

## Environment Variables Setup

### Backend (Set in Vercel Dashboard)
- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `SUPABASE_URL` - From Supabase project settings
- [ ] `SUPABASE_ANON_KEY` - From Supabase project settings
- [ ] `SUPABASE_SERVICE_KEY` - From Supabase project settings (API settings)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Set to `3000`

### Frontend (Set in Vercel Dashboard)
- [ ] `VITE_SUPABASE_URL` - Same as SUPABASE_URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY
- [ ] `VITE_API_URL` - Your Vercel deployment URL (set after first deploy)

### Optional
- [ ] `GITHUB_TOKEN` - For GitHub integration features
- [ ] `LOG_LEVEL` - Set to `info` or `debug`

## Supabase Setup

- [ ] Run migration `001_initial_schema.sql`
- [ ] Run migration `002_rls_policies.sql`
- [ ] Run migration `003_storage_buckets.sql`
- [ ] Run migration `004_user_profiles.sql`
- [ ] Run migration `005_vector_search.sql`
- [ ] Run migration `006_add_generations_table.sql`
- [ ] Run migration `007_add_preview_url.sql`
- [ ] Run migration `008_user_settings.sql`
- [ ] Run migration `009_add_theme_to_user_settings.sql`
- [ ] Run migration `010_add_chat_images_bucket.sql`
- [ ] Run migration `011_add_chat_messages.sql`
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Configure Storage buckets (if using file uploads)

## Deployment Steps

- [ ] Login to Vercel: `vercel login`
- [ ] Deploy to preview: `vercel`
- [ ] Test preview deployment
- [ ] Deploy to production: `vercel --prod`
- [ ] Update `VITE_API_URL` with production URL
- [ ] Redeploy frontend with updated API URL

## Post-Deployment Testing

- [ ] Visit your deployment URL
- [ ] Test user authentication
- [ ] Test API endpoints
- [ ] Test database connections
- [ ] Test file uploads (if applicable)
- [ ] Check browser console for errors
- [ ] Test with different browsers
- [ ] Test responsive design on mobile

## Optional Configuration

- [ ] Set up custom domain in Vercel
- [ ] Configure DNS records
- [ ] Enable Vercel Analytics
- [ ] Set up monitoring/alerts
- [ ] Configure CDN settings
- [ ] Set up CI/CD with GitHub

## Security Review

- [ ] Verify no `.env` files are committed
- [ ] Check CORS settings
- [ ] Verify RLS policies in Supabase
- [ ] Check API rate limiting
- [ ] Review authentication flows
- [ ] Verify HTTPS is enforced
- [ ] Check for exposed secrets in code

## Performance Optimization

- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Check bundle sizes
- [ ] Enable caching headers
- [ ] Test page load times
- [ ] Run Lighthouse audit

## Monitoring & Maintenance

- [ ] Check Vercel deployment logs
- [ ] Monitor Supabase usage
- [ ] Set up error tracking
- [ ] Schedule regular backups
- [ ] Review and rotate API keys regularly

## Documentation

- [ ] Update README with deployment URL
- [ ] Document any custom configurations
- [ ] Update API documentation
- [ ] Add troubleshooting guide

---

**Quick Deploy Command:**
```bash
# For Windows PowerShell
.\deploy.ps1

# For Mac/Linux
./deploy.sh
```

**Need Help?** Check `DEPLOYMENT.md` for detailed instructions.
