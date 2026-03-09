# Ngrok Setup for NextAuth

## Problem
When using ngrok, NextAuth redirects to `localhost:3000` instead of your ngrok URL after login.

## Solution

### 1. Update `.env.local`

**Important**: Set `NEXTAUTH_URL` to your ngrok URL:

```bash
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://798d-67-71-178-83.ngrok-free.app
```

**Note**: Every time your ngrok URL changes, update `NEXTAUTH_URL` and restart your dev server.

### 2. Restart Dev Server

After updating `.env.local`, you **must** restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Clear Browser Cookies

If you were previously logged in with localhost:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear cookies for your ngrok domain
4. Try logging in again

### 4. Verify Setup

1. Check that your ngrok tunnel is running:
   ```bash
   ngrok http 3000
   ```

2. Access your app via ngrok URL:
   ```
   https://your-ngrok-url.ngrok-free.app/login
   ```

3. Login should redirect to:
   ```
   https://your-ngrok-url.ngrok-free.app/admin
   ```

## Troubleshooting

### Still redirecting to localhost?

1. **Check environment variables are loaded**:
   ```bash
   # In your terminal, verify the variables
   echo $NEXTAUTH_URL
   ```

2. **Verify `.env.local` is in project root** (not in a subdirectory)

3. **Check Next.js is reading the file**:
   - Restart dev server
   - Check server console for any env variable warnings

4. **Use absolute URLs in code**:
   - The code now uses `window.location.origin` for callbacks
   - This should automatically use ngrok URL when accessed via ngrok

### SSL Error (ERR_SSL_PROTOCOL_ERROR)

If you see SSL errors when redirected to localhost:
- This means the redirect is still going to localhost
- Follow steps above to fix `NEXTAUTH_URL`
- Clear browser cache and cookies

### Function.prototype.apply Error

This is a NextAuth v5 beta compatibility issue. The handler export has been fixed, but if it persists:

1. Check NextAuth version:
   ```bash
   npm list next-auth
   ```

2. Try updating to latest beta:
   ```bash
   npm install next-auth@beta
   ```

## Quick Fix Script

Create a script to update ngrok URL automatically:

```bash
#!/bin/bash
# update-ngrok-url.sh

# Get current ngrok URL (if using ngrok API)
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Could not get ngrok URL. Is ngrok running?"
  exit 1
fi

# Update .env.local
sed -i.bak "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=$NGROK_URL|" .env.local

echo "✅ Updated NEXTAUTH_URL to: $NGROK_URL"
echo "⚠️  Restart your dev server for changes to take effect"
```

## Best Practices

1. **Use a static ngrok domain** (paid ngrok feature) to avoid URL changes
2. **Set up ngrok config file** to always use the same domain
3. **Use environment-specific configs**:
   - `.env.local` for localhost
   - `.env.ngrok` for ngrok (load with `--env-file .env.ngrok`)

## Alternative: Use ngrok's Static Domain

If you have ngrok paid plan:
1. Reserve a static domain in ngrok dashboard
2. Update ngrok config:
   ```yaml
   # ngrok.yml
   tunnels:
     web:
       addr: 3000
       domain: your-static-domain.ngrok-free.app
   ```
3. Set `NEXTAUTH_URL` to your static domain
4. No need to update URL every time!
