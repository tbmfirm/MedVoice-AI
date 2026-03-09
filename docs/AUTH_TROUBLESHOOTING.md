# Authentication Troubleshooting Guide

## Common Login Errors

### Error: Redirected to `/api/auth/error`

This usually means one of the following:

1. **Missing Environment Variables**
   - Check that `.env.local` exists and has:
     ```
     NEXTAUTH_SECRET=your-secret-key
     NEXTAUTH_URL=http://localhost:3000
     ```
   - Generate a secret: `openssl rand -base64 32`

2. **User Doesn't Exist**
   - Verify the user exists in the database
   - Run: `npx tsx scripts/create-admin.ts` to create a test user

3. **Wrong Password**
   - Check the password is correct
   - Passwords are hashed with bcrypt

4. **Account Locked**
   - After 5 failed login attempts, account is locked for 30 minutes
   - Wait or reset the `lockedUntil` field in database

### Error: "Function.prototype.apply was called on #<Object>"

This is a NextAuth v5 compatibility issue. Fixed by:
- Using correct route handler export format
- Ensuring NextAuth is properly initialized

### Error: "Configuration" error

This means NextAuth configuration is invalid:
- Check `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your actual URL
- For ngrok, update `NEXTAUTH_URL` to your ngrok URL

## Using with ngrok

When using ngrok, you need to:

1. **Update NEXTAUTH_URL**:
   ```bash
   NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.app
   ```

2. **Restart your dev server** after changing environment variables

3. **Clear browser cookies** if you were logged in with localhost

## Testing Login

1. **Create a test user**:
   ```bash
   npx tsx scripts/create-admin.ts password123 admin@test.com Admin User
   ```

2. **Login at**: `http://localhost:3000/login` (or your ngrok URL)

3. **Check browser console** for any errors

4. **Check server logs** for authentication errors

## Debug Mode

NextAuth debug mode is enabled in development. Check server console for:
- Authentication attempts
- User lookup results
- Password verification results
- Session creation

## Database Issues

If login fails silently:

1. **Check database connection**:
   ```bash
   npm run db:studio
   ```

2. **Verify user exists**:
   ```sql
   SELECT * FROM "User" WHERE email = 'your-email@example.com';
   ```

3. **Check password hash**:
   - Passwords should be hashed with bcrypt
   - Use `hashPassword()` function when creating users

## Common Fixes

### Fix 1: Missing NEXTAUTH_SECRET
```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET=generated-secret-here
```

### Fix 2: Wrong NEXTAUTH_URL
```bash
# For localhost
NEXTAUTH_URL=http://localhost:3000

# For ngrok
NEXTAUTH_URL=https://your-url.ngrok-free.app
```

### Fix 3: User Not Found
```bash
# Create admin user
npx tsx scripts/create-admin.ts
```

### Fix 4: Account Locked
```sql
-- Reset locked account
UPDATE "User" SET "lockedUntil" = NULL, "failedLoginAttempts" = 0 WHERE email = 'user@example.com';
```

## Still Having Issues?

1. Check server console for detailed error messages
2. Enable NextAuth debug mode (already enabled in dev)
3. Verify all environment variables are set
4. Check database connection
5. Verify user exists and password is correct
