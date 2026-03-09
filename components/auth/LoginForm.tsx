'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorParam = searchParams?.get('error');

  React.useEffect(() => {
    if (errorParam === 'unauthorized') {
      setError('You do not have permission to access this page.');
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Get the current origin (ngrok or localhost)
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = currentOrigin ? `${currentOrigin}/admin` : '/admin';
      
      console.log('[Login] Signing in with callbackUrl:', callbackUrl);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Handle specific error types
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please try again.');
        } else if (result.error === 'Configuration') {
          setError('Authentication configuration error. Please contact support.');
        } else {
          setError(result.error || 'An error occurred during login.');
        }
        setIsLoading(false);
      } else if (result?.ok) {
        // Redirect to admin dashboard using current origin (ngrok or localhost)
        const adminUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/admin`
          : '/admin';
        console.log('[Login] Redirecting to:', adminUrl);
        window.location.href = adminUrl;
      } else {
        setError('Unexpected response from server.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="text-center">
        <a
          href="#"
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Implement forgot password
          }}
        >
          Forgot your password?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
