import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

export function AuthScreen() {
  return (
    <div className="min-h-screen bg-(--c-bg) flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8 w-full max-w-sm"
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-(--r-3) flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(160deg, var(--c-accent), var(--c-accent-2))',
              boxShadow: '0 8px 24px -8px rgba(139, 30, 45, 0.5)',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', left: 12, top: 26,
              width: 20, height: 13, borderRadius: 999,
              background: 'var(--c-gold)',
            }} />
            <svg width="36" height="22" viewBox="0 0 18 12" fill="none" style={{ position: 'relative', zIndex: 1 }}>
              <path
                d="M14 5C14 2.79 12.21 1 10 1C8.55 1 7.29 1.76 6.56 2.9C6.27 2.76 5.95 2.68 5.61 2.68C4.42 2.68 3.46 3.64 3.46 4.83C3.46 4.87 3.46 4.9 3.47 4.94C2.52 5.21 1.8 6.08 1.8 7.12C1.8 8.38 2.83 9.4 4.09 9.4H13.91C15.39 9.4 16.6 8.19 16.6 6.71C16.6 5.48 15.77 4.44 14.65 4.1C14.43 4.42 14.22 4.72 14 5Z"
                fill="rgba(255,255,255,0.9)"
              />
            </svg>
          </div>
          <div className="text-center">
            <div
              style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, fontFamily: 'var(--f-ui)', color: 'var(--c-text)' }}
            >
              Cumulus
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-text-3)', marginTop: 4 }}>
              GPA tracker for Ashesi University
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div
          className="w-full"
          style={{
            background: 'var(--c-surface)',
            borderRadius: 'var(--r-4)',
            border: '1px solid var(--c-line-2)',
            overflow: 'hidden',
          }}
        >
          <div className="px-6 pt-6 pb-4 text-center border-b border-(--c-line)">
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--c-text)' }}>
              Sign in to continue
            </div>
          </div>

          <div className="p-5 w-full">
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: '#c9445d',
                  borderRadius: '12px',
                  fontFamily: 'var(--f-ui)',
                  fontSize: '14px',
                },
                elements: {
                  rootBox: '!w-full !max-w-none !block',
                  cardBox: '!shadow-none !border-0 !w-full !max-w-none !bg-transparent !p-0',
                  card: '!bg-transparent !shadow-none !border-0 !p-0 !m-0 !w-full !max-w-none',
                  header: '!hidden',
                  headerTitle: '!hidden',
                  headerSubtitle: '!hidden',
                  headerBackRow: '!hidden',
                  main: '!p-0 !m-0 !w-full',
                  socialButtonsRoot: '!w-full !max-w-none !pt-3',
                  socialButtonsBlockButtons: '!w-full !max-w-none !flex !flex-col !gap-2 !p-0',
                  socialButtonsBlockButton: '!w-full !max-w-none !h-12 !rounded-xl !bg-transparent !border !border-[var(--c-line-2)] !text-[var(--c-text)] !text-[14px] !font-semibold !shadow-none !m-0 !no-underline',
                  socialButtonsBlockButtonText: '!text-[var(--c-text)] !font-semibold',
                  socialButtonsBlockButtonArrow: '!hidden',
                  socialButtonsProviderIcon: '!w-5 !h-5',
                  dividerRow: '!hidden',
                  dividerLine: '!hidden',
                  dividerText: '!hidden',
                  form: '!hidden',
                  formButtonPrimary: '!hidden',
                  formFieldRow: '!hidden',
                  footer: '!hidden',
                  footerAction: '!hidden',
                  footerPages: '!hidden',
                  identityPreview: '!hidden',
                  alternativeMethodsBlockButton: '!hidden',
                  internal_footerPageLink: '!hidden',
                },
                layout: { socialButtonsPlacement: 'top' },
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
