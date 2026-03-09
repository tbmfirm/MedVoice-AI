# Quick Fix Guide for NextAuth v5 & Ngrok Issues

## Immediate Steps

### 1. Verify Environment Variables

Run this to check your environment:
```bash
npx tsx scripts/check-env.ts
```

Your `.env.local` MUST have:
```bash
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://798d-67-71-178-83.ngrok-free.app
```

### 2. Restart Dev Server

**CRITICAL**: After updating `.env.local`, you MUST restart:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3. Clear Browser Data

1. Open DevTools (F12)
2. Application tab → Cookies
3. Clear all cookies for your ngrok domain
4. Try logging in again

### 4. Check Server Console

When you start the server, look for:
```
[NextAuth] Handler is a function
```
or
```
[NextAuth] Handler has handlers property
```

This tells you which pattern NextAuth is using.

## What Was Fixed

✅ **Handler Export**: Now handles multiple NextAuth v5 beta patterns
✅ **Redirect Callback**: Uses `NEXTAUTH_URL` from environment
✅ **Middleware**: Checks `x-forwarded-host` header for ngrok
✅ **Login Form**: Uses `window.location.href` to preserve origin
✅ **Error Handler**: Preserves ngrok URL in redirects
✅ **Debugging**: Added console logs to track issues

## Still Not Working?

### Check 1: Handler Type
```bash
npx tsx scripts/test-nextauth-handler.ts
```

### Check 2: Server Console
Look for `[NextAuth]` logs when accessing `/api/auth/providers`

### Check 3: Network Tab
In browser DevTools → Network:
- Check if `/api/auth/providers` returns 200 or 500
- Check if cookies are being set
- Check redirect URLs

### Check 4: Environment Loading
Make sure `.env.local` is in the project root (same level as `package.json`)

## Common Issues

### Issue: Still redirecting to localhost
**Fix**: 
1. Verify `NEXTAUTH_URL` in `.env.local` matches ngrok URL exactly
2. Restart dev server
3. Clear browser cookies

### Issue: Function.prototype.apply error
**Fix**: 
1. Check server console for `[NextAuth]` log
2. The handler should now work with the new pattern detection
3. If still failing, check NextAuth version: `npm list next-auth`

### Issue: SSL error on localhost
**Fix**: This means redirect is still going to localhost. Follow "Still redirecting to localhost" fix above.

## Test Login Flow

1. Go to: `https://your-ngrok-url.ngrok-free.app/login`
2. Enter credentials
3. Should redirect to: `https://your-ngrok-url.ngrok-free.app/admin`
4. If it goes to `localhost:3000`, check environment variables

## Need Help?

Check these files for more details:
- `docs/NEXTAUTH_V5_FIX.md` - Technical details
- `docs/NGROK_SETUP.md` - Ngrok-specific setup
- `docs/AUTH_TROUBLESHOOTING.md` - General auth troubleshooting
