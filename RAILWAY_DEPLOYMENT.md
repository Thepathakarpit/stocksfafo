# Railway Deployment Guide for Stocksfafo

This guide will walk you through deploying the Stocksfafo application to Railway.app

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Git installed on your local machine
3. Your code committed to a Git repository (GitHub, GitLab, or Bitbucket)

## Project Overview

This application is configured to deploy as a **single service** on Railway:
- Frontend (React) is built as static files
- Backend (Express) serves both the API and frontend
- No external database required (uses in-memory storage with file persistence)

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Repository

Your code is already configured for Railway deployment with:
- ✅ `Dockerfile` - Multi-stage build for optimized deployment
- ✅ `railway.json` - Railway-specific configuration
- ✅ `package.json` - Proper build and start scripts
- ✅ Environment-aware CORS and port configuration

### Step 2: Create a New Railway Project

1. Go to https://railway.app and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (or your Git provider)
4. Authorize Railway to access your repositories if prompted
5. Select your `stocksfafo` repository

### Step 3: Configure Environment Variables

After creating the project, Railway will automatically start deploying. You need to set environment variables:

1. Click on your deployed service
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"**
4. Add the following variables:

#### Required Variables:

```
NODE_ENV=production
```

#### Optional but Recommended:

```
CORS_ORIGIN=https://your-app-name.up.railway.app
```

**Note:** Replace `your-app-name.up.railway.app` with your actual Railway domain (you'll get this after first deployment).

### Step 4: Generate a Railway Domain

1. In your Railway service dashboard, go to the **"Settings"** tab
2. Scroll down to **"Networking"** section
3. Click **"Generate Domain"** under "Public Networking"
4. Railway will assign you a domain like: `your-app-name.up.railway.app`

### Step 5: Update CORS Environment Variable

Now that you have your Railway domain:

1. Go back to the **"Variables"** tab
2. Update or add the `CORS_ORIGIN` variable with your Railway domain:

```
CORS_ORIGIN=https://your-app-name.up.railway.app
```

3. The app will automatically redeploy with the new variable

### Step 6: Wait for Deployment

Railway will:
1. Clone your repository
2. Build the frontend (React app)
3. Build the backend (TypeScript to JavaScript)
4. Create a Docker container
5. Start the application

This usually takes 3-5 minutes. You can monitor progress in the **"Deployments"** tab.

### Step 7: Access Your Application

Once deployment is complete (status shows ✅):

1. Click on your generated domain or visit it directly
2. You should see the Stocksfafo login/registration page
3. Create an account and start trading!

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Railway Platform              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Docker Container              │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │   Express Backend (Node.js) │ │ │
│  │  │   - API Routes (/api/*)     │ │ │
│  │  │   - WebSocket Server        │ │ │
│  │  │   - Static File Server      │ │ │
│  │  │                             │ │ │
│  │  │  ┌───────────────────────┐ │ │ │
│  │  │  │ React Frontend (built)│ │ │ │
│  │  │  │ Served as static files│ │ │ │
│  │  │  └───────────────────────┘ │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  In-Memory Data Store       │ │ │
│  │  │  (persisted to users.json)  │ │ │
│  │  └─────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│     Port: $PORT (set by Railway)        │
└─────────────────────────────────────────┘
                    │
                    ▼
        https://your-app.up.railway.app
```

## Key Features

✅ **Single Domain Deployment** - Frontend and backend served from same URL
✅ **Automatic HTTPS** - Railway provides SSL certificates
✅ **WebSocket Support** - Real-time stock updates work seamlessly
✅ **No Database Required** - Uses file-based persistence
✅ **Auto-Scaling** - Railway handles traffic automatically
✅ **Zero Downtime Deploys** - New versions deploy without interruption

## Post-Deployment Checks

After deployment, verify:

1. **Homepage loads** - Visit your Railway domain
2. **Registration works** - Create a new account
3. **Login works** - Sign in with your account
4. **Stock data loads** - Dashboard shows live stock prices
5. **Real-time updates** - Stock prices update every 5 seconds
6. **Trading works** - Execute buy/sell orders
7. **Portfolio updates** - Check your portfolio page

## Troubleshooting

### Build Fails

**Issue:** Build process fails during deployment

**Solutions:**
- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (requires Node 18+)

### Application Won't Start

**Issue:** Deployment succeeds but app shows as "crashed"

**Solutions:**
- Check the deployment logs
- Verify `PORT` is not hardcoded (should use `process.env.PORT`)
- Ensure start command is correct: `npm start`

### CORS Errors in Browser

**Issue:** "CORS policy" errors in browser console

**Solutions:**
- Set `CORS_ORIGIN` environment variable to your Railway domain
- Format: `https://your-app-name.up.railway.app` (no trailing slash)
- Redeploy after setting the variable

### WebSocket Connection Fails

**Issue:** Stock prices don't update in real-time

**Solutions:**
- Railway supports WebSockets by default
- Check browser console for connection errors
- Verify the app is using HTTPS (Railway auto-provides)
- Make sure frontend is using `window.location.origin` for WS URL

### Data Loss After Redeploy

**Issue:** User data disappears after redeployment

**Solutions:**
- Railway's ephemeral filesystem resets on deploy
- For persistent data, consider adding:
  - Railway Volumes (persistent storage)
  - MongoDB Atlas (free tier available)
  - PostgreSQL database (Railway provides this)

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | production | Environment mode |
| `PORT` | No | Auto-set by Railway | Application port |
| `CORS_ORIGIN` | Recommended | localhost:3000 | Allowed origins for CORS |
| `FRONTEND_URL` | Optional | Same as domain | Frontend URL |

## Updating Your Deployment

To update your deployed application:

1. Make changes to your code locally
2. Commit and push to your Git repository:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Railway automatically detects the push and redeploys
4. Monitor deployment progress in Railway dashboard

## Custom Domain (Optional)

To use your own domain instead of Railway's:

1. Go to your service **Settings** → **Networking**
2. Click **"Add Custom Domain"**
3. Enter your domain name (e.g., `stocksfafo.com`)
4. Add the CNAME record to your DNS provider as shown by Railway
5. Wait for DNS propagation (can take up to 48 hours)
6. Update `CORS_ORIGIN` environment variable to your custom domain

## Cost Considerations

- **Free Tier:** Railway offers $5 of free usage per month
- **Estimated Cost:** This app typically uses $3-8/month depending on traffic
- **Monitor Usage:** Check usage in Railway dashboard under "Usage"

## Support

If you encounter issues:

1. Check Railway Status: https://status.railway.app
2. Railway Docs: https://docs.railway.app
3. Railway Discord: https://discord.gg/railway
4. GitHub Issues: (your repository)

## Security Recommendations

For production use, consider:

1. **Add Authentication Tokens:** Implement JWT properly (currently uses simple tokens)
2. **Add Rate Limiting:** Prevent abuse of API endpoints
3. **Add Database:** Replace file-based storage with proper database
4. **Environment Secrets:** Use Railway's secret management for sensitive data
5. **CORS Restrictions:** Limit CORS to specific domains only

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Monitor application logs for errors
3. ✅ Set up monitoring/alerting (Railway provides basic metrics)
4. ✅ Consider adding a database for production use
5. ✅ Implement proper authentication and authorization
6. ✅ Add analytics to track user behavior

---

**Congratulations! Your Stocksfafo application is now live on Railway! 🚀**

Access it at: `https://your-app-name.up.railway.app`

