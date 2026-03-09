# NextAuth v5 Beta Handler Fix

## Problem

NextAuth v5 beta.25 was causing `Function.prototype.apply` errors because the handler export pattern wasn't compatible with Next.js App Router.

## Solution Implemented

### 1. Handler Export Fix

**File**: `app/api/auth/[...nextauth]/route.ts`

The handler now checks what NextAuth returns and handles multiple patterns:

- **Pattern 1**: Object with `handlers` property: `{ handlers: { GET, POST } }`
- **Pattern 2**: Direct function that can be used for both GET and POST
- **Pattern 3**: Object with direct `GET` and `POST` properties
- **Fallback**: Wrapper function if needed

The code now:
1. Checks the type of what NextAuth returns
2. Extracts GET and POST handlers appropriately
3. Validates they are functions before exporting
4. Logs which pattern was detected (for debugging)

### 2. Ngrok Redirect Fix

**Files Updated**:
- `lib/auth/config.ts` - Redirect callback uses `NEXTAUTH_URL` from env
- `middleware.ts` - Uses `x-forwarded-host` header for ngrok
- `app/api/auth/error/route.ts` - Preserves ngrok URL in error redirects
- `components/auth/LoginForm.tsx` - Uses `window.location.origin` for redirects

**Key Changes**:
- Redirect callback now prioritizes `NEXTAUTH_URL` environment variable
- Middleware checks `x-forwarded-host` header (set by ngrok)
- Login form uses `window.location.href` instead of `router.push()` to preserve origin
- Error handler checks multiple header sources for origin

### 3. Debugging Added

- Console logs in handler export to see which pattern is used
- NextAuth logger enabled in development
- Login form logs callback URL and redirect URL
- Error handler logs redirect origin

## Testing

1. **Check Environment Variables**:
   ```bash
   npx tsx scripts/check-env.ts
   ```

2. **Test Handler Type**:
   ```bash
   npx tsx scripts/test-nextauth-handler.ts
   ```

3. **Verify Login Flow**:
   - Access via ngrok URL: `https://your-ngrok-url.ngrok-free.app/login`
   - Login with valid credentials
   - Should redirect to: `https://your-ngrok-url.ngrok-free.app/admin`
   - Check server console for handler pattern logs

## Environment Variables Required

```bash
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.app
```

## If Issues Persist

1. **Check Server Console**: Look for `[NextAuth]` logs to see which handler pattern was detected
2. **Verify Handler Type**: Run `npx tsx scripts/test-nextauth-handler.ts`
3. **Check Environment**: Run `npx tsx scripts/check-env.ts`
4. **Clear Browser Cookies**: Old cookies from localhost might interfere
5. **Restart Dev Server**: After changing `.env.local`

## Fallback Options

If NextAuth v5 beta continues to have issues:

1. **Downgrade to NextAuth v4**:
   ```bash
   npm install next-auth@^4.24.5
   ```
   Then update the handler export to the v4 pattern.

2. **Wait for NextAuth v5 stable release**

3. **Use alternative auth library** (e.g., Clerk, Auth0)
