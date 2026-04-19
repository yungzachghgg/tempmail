# Deploy to Railway - Quick Guide

## Step 1: Push to GitHub

Open PowerShell in your project folder and run:

```powershell
cd "c:\My Web Sites\https___temp-mail.app_\temp-mail.app"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Temp Mail App"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/temp-mail-app.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Railway

1. Go to https://railway.com/
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `temp-mail-app` repository
6. Railway will auto-detect it's a Next.js app and deploy it!

## What Gets Deployed

Your app includes:
- **Real temp mail** via mail.tm API
- **REST API** at `/api/*` endpoints
- **Modern UI** with auto-refresh inbox
- **Code detection** that highlights verification codes
- **Railway config** for easy deployment

## API Endpoints

Once deployed, your API will be available at:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `https://your-app.up.railway.app/api/account` | Create temp email |
| GET | `https://your-app.up.railway.app/api/messages?token=TOKEN` | Get inbox |
| GET | `https://your-app.up.railway.app/api/messages/ID?token=TOKEN` | Read email |
| DELETE | `https://your-app.up.railway.app/api/messages/ID?token=TOKEN` | Delete email |

## Environment Variables (Optional)

No env vars required - the app uses mail.tm's public API.

## Local Development (Optional)

If you have Node.js installed locally:

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Troubleshooting

**Build fails?**
- Check Railway logs in the dashboard
- Make sure all files were pushed to GitHub

**API not working?**
- The mail.tm API has rate limits
- Wait a few seconds and try again

**Emails not arriving?**
- Some senders block temp mail domains
- Try a different sender or wait a few minutes

## Features

✅ Creates REAL temporary email addresses
✅ Receives emails instantly
✅ Auto-detects verification/OTP codes
✅ Copy-to-clipboard functionality
✅ Auto-refresh inbox every 10 seconds
✅ Mobile-friendly responsive design
✅ No registration required
✅ Completely free

## Support

- Railway docs: https://docs.railway.com/
- Next.js docs: https://nextjs.org/docs
- mail.tm API: https://api.mail.tm/
