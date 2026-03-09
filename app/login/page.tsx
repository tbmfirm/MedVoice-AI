import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';
import { Stethoscope } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Login | MedVoice AI',
  description: 'Sign in to your MedVoice AI account',
};

export default async function LoginPage() {
  // If user is already logged in, redirect to admin
  const user = await getCurrentUser();
  if (user) {
    redirect('/admin');
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to access your dashboard</p>
          </div>

          {/* Login Form */}
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} MedVoice AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
