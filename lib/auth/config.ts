import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!user) {
            return null;
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error('Account is locked. Please try again later.');
          }

          // Verify password
          const isValid = await verifyPassword(credentials.password, user.passwordHash);

          if (!isValid) {
            // Increment failed login attempts
            const failedAttempts = user.failedLoginAttempts + 1;
            const lockUntil = failedAttempts >= 5 
              ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes after 5 failed attempts
              : null;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
                lockedUntil: lockUntil,
              },
            });

            return null;
          }

          // Reset failed login attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            },
          });

          // Return user object (will be encoded in JWT)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization?.name || null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          // Return error details in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              email: credentials.email,
            });
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // For ngrok and reverse proxies, use the request origin
      // Check if we have a custom baseUrl from environment
      const envUrl = process.env.NEXTAUTH_URL;
      const effectiveBaseUrl = envUrl || baseUrl;
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${effectiveBaseUrl}${url}`;
      }
      
      // Handle absolute URLs - check if same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(effectiveBaseUrl);
        
        // If same origin, allow it
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (e) {
        // Invalid URL, use baseUrl
      }
      
      // Default to effective baseUrl
      return effectiveBaseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Trust proxy for ngrok and other reverse proxies
  trustHost: true,
  // Use secure cookies for HTTPS (ngrok)
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
  // Log configuration in development
  ...(process.env.NODE_ENV === 'development' && {
    logger: {
      error(code, metadata) {
        console.error('[NextAuth Error]', code, metadata);
      },
      warn(code) {
        console.warn('[NextAuth Warn]', code);
      },
      debug(code, metadata) {
        console.log('[NextAuth Debug]', code, metadata);
      },
    },
  }),
};
