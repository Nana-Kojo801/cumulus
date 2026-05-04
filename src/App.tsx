import { BrowserRouter } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthScreen } from '@/screens/AuthScreen';
import { ThemeProvider } from '@/contexts/ThemeContext';

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-(--c-bg)">
      <div
        className="w-7 h-7 rounded-full animate-spin"
        style={{ border: '2px solid var(--c-line-2)', borderTopColor: 'var(--c-accent)' }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastContainer>
        <BrowserRouter>
          <AuthLoading>
            <LoadingSpinner />
          </AuthLoading>

          <Unauthenticated>
            <AuthScreen />
          </Unauthenticated>

          <Authenticated>
            <AppShell />
          </Authenticated>
        </BrowserRouter>
      </ToastContainer>
    </ThemeProvider>
  );
}
