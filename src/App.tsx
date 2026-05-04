import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { DisplayPrefsProvider } from '@/contexts/DisplayPrefsContext';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DisplayPrefsProvider>
          <SyncProvider>
            <ToastContainer>
              <AppShell />
            </ToastContainer>
          </SyncProvider>
        </DisplayPrefsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
