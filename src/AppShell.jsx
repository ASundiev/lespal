import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/components/LoginPage';

const AuthenticatedApp = lazy(() => import('./App.jsx'));

function FullscreenSpinner() {
  return (
    <div className="min-h-screen bg-[#161616] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-white" />
    </div>
  );
}

export function AppShell() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <FullscreenSpinner />;
  if (!user) return <LoginPage />;

  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <AuthenticatedApp />
    </Suspense>
  );
}
