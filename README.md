# Temp Mail App

A free temporary email service that creates real temporary email addresses and receives emails including verification codes.

## Features

- **Real Temporary Email Addresses** - Creates actual working email addresses via mail.tm API
- **Instant Email Delivery** - Emails arrive in seconds
- **Verification Code Detection** - Automatically detects and highlights verification/OTP codes
- **No Registration** - Use immediately without signing up
- **Auto Cleanup** - Emails are automatically deleted after some time
- **API Endpoints** - REST API for programmatic access

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/account` | Create a new temporary email account |
| DELETE | `/api/account` | Delete account (body: `{token}`) |
| GET | `/api/messages?token={token}` | Get all messages |
| GET | `/api/messages/{id}?token={token}` | Get specific message |
| DELETE | `/api/messages/{id}?token={token}` | Delete message |

## Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Connect Railway to your repo
3. Deploy automatically

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

No environment variables required - uses mail.tm public API.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- mail.tm API
