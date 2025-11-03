# Deployment Guide - Earthquake Explorer

This guide explains how to deploy your Earthquake Explorer app to Netlify.

## Prerequisites

- GitHub account
- Netlify account (free tier works great)
- Your code pushed to GitHub repository

## Option 1: Deploy via Netlify Web UI (Recommended for beginners)

### Step 1: Push Code to GitHub

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit - Earthquake Explorer"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/Dhairyasoniiiii/earthquake-explorer.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub account
5. Select your `earthquake-explorer` repository

### Step 3: Configure Build Settings

Netlify should auto-detect these settings from your `netlify.toml` file:

- **Build command**: `npm run build`
- **Publish directory**: `dist`

If not, manually enter these values.

### Step 4: Deploy

1. Click "Deploy site"
2. Wait for the build to complete (usually 1-2 minutes)
3. Your site will be live at a random Netlify URL like `random-name-123456.netlify.app`

### Step 5: Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow instructions to update DNS settings

## Option 2: Deploy via Netlify CLI (For advanced users)

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This opens a browser window for authentication.

### Step 3: Build Your Project

```bash
npm run build
```

### Step 4: Deploy

For a production deployment:

```bash
netlify deploy --prod
```

Follow the prompts:
- **Create a new site**: Yes
- **Team**: Choose your team
- **Site name**: earthquake-explorer (or your preferred name)
- **Publish directory**: dist

Your site will be deployed and you'll receive a URL!

## Option 3: Continuous Deployment (Automatic updates)

After connecting via Option 1, every time you push to your main branch, Netlify automatically:

1. Detects the push
2. Runs `npm run build`
3. Deploys the new version

To push updates:

```bash
git add .
git commit -m "Update: improved globe animations"
git push
```

## Verifying Your Deployment

Once deployed, verify everything works:

1. Page loads without errors
2. Loading animation shows briefly
3. Earthquake data appears in table
4. Charts display correctly
5. Globe rotates smoothly
6. Clicking table rows highlights chart points
7. Expand globe modal works

## Common Issues & Solutions

### Issue: Build fails with "command not found"

**Solution**: Make sure `package.json` has all dependencies listed:
```bash
npm install
```

### Issue: Site loads but shows blank page

**Solution**: Check browser console for errors. Often caused by:
- Missing environment variables
- CORS issues with USGS API
- JavaScript errors in production build

### Issue: Slow initial load

**Solution**: This is normal! The app fetches earthquake data on load. Consider adding:
- Service worker for caching
- Loading placeholder

### Issue: API rate limiting

**Solution**: The app already has rate limiting built in. If users hit it frequently:
- Increase the refresh interval in `App.tsx`
- Implement data caching
- Use a backend proxy

## Performance Optimization Tips

After deploying, consider these optimizations:

### 1. Enable Compression

Netlify automatically compresses files, but verify in Network tab that `Content-Encoding: gzip` is present.

### 2. Add Cache Headers

Create a `_headers` file in the `public` folder:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

### 3. Lighthouse Score

Run Lighthouse in Chrome DevTools:
- Performance: Target 90+
- Accessibility: Target 95+
- Best Practices: Target 100
- SEO: Target 90+

## Monitoring Your Deployment

### Netlify Analytics (Paid feature)

- Page views
- Top pages
- Bandwidth usage

### Google Analytics (Free)

Add to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>
```

## Environment Variables (If needed)

If you add any API keys or secrets:

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add your variables
3. Reference in code via `import.meta.env.VITE_YOUR_VAR`
4. Update `.env.example` in your repo

## Rollback to Previous Version

If something breaks:

1. Go to Netlify Dashboard → Deploys
2. Find the working version
3. Click "..." → "Publish deploy"

## Next Steps

After successful deployment:

1. Update README with live demo link
2. Share on social media
3. Add to your portfolio
4. Consider adding features:
   - User preferences
   - Historical data comparison
   - Mobile responsive layout
   - Dark/light theme toggle

## Support

If you encounter issues:

1. Check [Netlify Docs](https://docs.netlify.com)
2. Review build logs in Netlify dashboard
3. Check browser console for runtime errors
4. Verify `netlify.toml` configuration

---

Happy deploying!
