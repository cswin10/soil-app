# Deployment Guide - Soil Mixing Optimizer

This guide walks you through deploying the Soil Mixing Optimizer to Netlify.

## Quick Deploy (Recommended)

### Method 1: Deploy to Netlify Button

The easiest way to deploy:

1. Click this button (add to your GitHub README):
   ```markdown
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=YOUR_REPO_URL)
   ```

2. Netlify will:
   - Fork your repository
   - Configure build settings automatically
   - Deploy your app
   - Give you a live URL

## Step-by-Step Deployment

### Prerequisites

- GitHub account
- Netlify account (free tier works perfectly)
- Git installed locally

### Step 1: Push Code to GitHub

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit: Soil Mixing Optimizer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/soil-mixing-optimizer.git
git push -u origin main
```

### Step 2: Connect to Netlify

1. **Go to Netlify:**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign up or log in

2. **Add New Site:**
   - Click "Add new site" → "Import an existing project"

3. **Connect GitHub:**
   - Click "GitHub"
   - Authorize Netlify to access your repositories
   - Select your `soil-mixing-optimizer` repository

4. **Configure Build Settings:**
   Netlify should auto-detect these from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

   If not auto-detected, enter them manually.

5. **Deploy:**
   - Click "Deploy site"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like `https://random-name-12345.netlify.app`

### Step 3: Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter your domain (e.g., `soil-optimizer.yourdomain.com`)

2. **Update DNS:**
   - Add CNAME record pointing to your Netlify URL
   - Or use Netlify DNS for automatic configuration

3. **Enable HTTPS:**
   - Netlify provides free SSL certificates
   - Auto-configured, no action needed

## Netlify CLI Deployment

For developers who prefer command-line:

### Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Login

```bash
netlify login
```

This opens your browser to authenticate.

### Initialize Site

```bash
netlify init
```

Follow the prompts:
- Create & configure a new site
- Choose your team
- Site name: `soil-mixing-optimizer` (or custom)
- Build command: `npm run build`
- Publish directory: `dist`

### Deploy

**Deploy to draft URL:**
```bash
netlify deploy
```

**Deploy to production:**
```bash
netlify deploy --prod
```

## Continuous Deployment

Once connected to GitHub, Netlify automatically deploys when you push:

```bash
git add .
git commit -m "Update optimization algorithm"
git push origin main
```

Netlify will:
1. Detect the push
2. Run `npm install`
3. Run `npm run build`
4. Deploy the new version
5. Send you an email confirmation

## Environment Variables

This app doesn't require any environment variables! Everything is self-contained.

## Build Settings Summary

These are configured in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  python_version = "3.11"
```

## Troubleshooting Deployment

### Build Fails: "Python version not found"

**Solution:** Check `netlify.toml` has:
```toml
[functions]
  python_version = "3.11"
```

### Build Fails: "Module not found"

**Solution:** Ensure `package.json` includes all dependencies:
```bash
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Functions Don't Work

**Check:**
1. Functions are in `netlify/functions/` directory
2. `netlify.toml` specifies functions directory
3. `requirements.txt` includes scipy and numpy
4. Python version is 3.11 in `netlify.toml`

**Test locally:**
```bash
netlify dev
```

This runs a local Netlify environment.

### Site Loads But Shows 404

**Solution:** Add redirect rule to `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This is already included in your config.

## Performance Optimization

### Enable Netlify Analytics

1. Go to Netlify Dashboard
2. Click "Analytics" tab
3. Enable analytics (paid feature)

### Enable Asset Optimization

Netlify automatically optimizes:
- Minifies JavaScript and CSS
- Compresses images
- Adds cache headers
- Enables HTTP/2

No configuration needed!

### CDN Configuration

Netlify uses a global CDN automatically:
- 100+ edge locations worldwide
- Automatic cache invalidation
- Instant cache purge on deploy

## Monitoring

### Build Notifications

**Email:**
- Automatic for all builds
- Configure in Netlify Dashboard → Site settings → Build & deploy → Deploy notifications

**Slack:**
1. Go to Deploy notifications
2. Add notification → Slack
3. Choose events (Deploy started, succeeded, failed)

### Function Logs

**View in Netlify:**
1. Go to Functions tab
2. Click on `optimize` function
3. View real-time logs

**View in CLI:**
```bash
netlify functions:list
netlify functions:invoke optimize --payload '{"batches": [...], "limits": {...}}'
```

## Security

### HTTPS

- Automatically enabled by Netlify
- Free Let's Encrypt SSL certificate
- Auto-renewal
- Forced HTTPS redirect (recommended)

**Enable forced HTTPS:**
1. Domain settings
2. Toggle "Force HTTPS"

### CORS

CORS is configured in the Python function:
```python
headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

For production, consider restricting to your domain:
```python
'Access-Control-Allow-Origin': 'https://your-domain.com',
```

## Scaling

Netlify free tier includes:
- **100 GB bandwidth/month** - plenty for most use cases
- **300 build minutes/month** - sufficient for frequent updates
- **125k function invocations/month** - ~4,000 optimizations/day

For high-traffic sites, upgrade to Pro tier:
- 1TB bandwidth
- 1000 build minutes
- Unlimited function invocations
- ~$19/month

## Rollback

If a deployment breaks something:

**In Netlify Dashboard:**
1. Go to Deploys tab
2. Find working deployment
3. Click "Publish deploy"

**Via CLI:**
```bash
netlify deploy:list
netlify deploy:publish DEPLOY_ID
```

## Testing Before Deployment

### Local Testing

```bash
npm run dev
```

Opens at `http://localhost:3000`

### Netlify Dev (Test Functions Locally)

```bash
npm install -g netlify-cli
netlify dev
```

This simulates the full Netlify environment including functions.

### Build Test

```bash
npm run build
npm run preview
```

Preview the production build locally.

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] Sample data loads
- [ ] CSV upload works
- [ ] Optimization runs successfully
- [ ] Results display properly
- [ ] CSV export works
- [ ] Copy instructions works
- [ ] Mobile responsive (test on phone)
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)

## Getting Your Site URL

After deployment, your site is available at:
```
https://YOUR-SITE-NAME.netlify.app
```

Find it in:
- Netlify Dashboard (top of page)
- Email confirmation
- Deploy log output

## Updating Your Site

Make changes locally:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Netlify automatically rebuilds and deploys within 2-3 minutes.

## Cost Estimate

**Free tier is sufficient for most users:**
- Unlimited sites
- 100 GB bandwidth
- 300 build minutes
- 125k function requests

**When to upgrade:**
- >100 GB bandwidth/month
- >125k optimizations/month
- Need advanced features (password protection, team collaboration)

## Support

If you encounter issues:

1. Check [Netlify Status](https://www.netlifystatus.com/)
2. Review [Netlify Docs](https://docs.netlify.com/)
3. Check build logs in Netlify Dashboard
4. Test locally with `netlify dev`
5. Contact Netlify Support (even on free tier!)

## Next Steps

After deployment:
1. Share the URL with your team
2. Bookmark the Netlify Dashboard
3. Set up deploy notifications
4. Consider adding a custom domain
5. Monitor usage in Netlify Analytics

Your soil mixing optimizer is now live and ready to use!
