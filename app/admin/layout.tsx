import { Metadata } from 'next';
import SessionProviderWrapper from '@/components/admin/SessionProviderWrapper';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ErrorBoundary } from '@/components/admin/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin Dashboard | MedVoice AI',
  description: 'MedVoice AI Admin Dashboard',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-900 flex">
          <AdminSidebar />
          <div className="flex-1 flex flex-col lg:ml-0">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </SessionProviderWrapper>
  );
}
