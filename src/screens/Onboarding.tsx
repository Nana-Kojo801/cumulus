import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  IconExternalLink, IconLink, IconLoader, IconCheck,
  IconAlertTriangle, IconEye, IconEyeOff,
} from '@/components/icons';
import { canvasApi, CanvasApiError } from '@/lib/canvas/client';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { usePostHog } from '@posthog/react';
import { cn } from '@/lib/utils';

const STEP_LABELS = ['Welcome', 'Canvas'];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex gap-1.5">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === step - 1 ? 24 : 8,
              background: i < step ? 'var(--c-accent)' : i === step - 1 ? 'var(--c-accent)' : 'var(--c-line-2)',
            }}
          />
        ))}
      </div>
      <span className="text-[12px] text-(--c-text-4)">
        Step {step} of {STEP_LABELS.length} · {STEP_LABELS[step - 1]}
      </span>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-2xl border p-6', className)}
      style={{ background: 'var(--c-surface)', borderColor: 'var(--c-line-2)' }}
    >
      {children}
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <StepBar step={1} />

      <div className="flex flex-col gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
          style={{ background: 'var(--c-accent)' }}
        >
          C
        </div>
        <div>
          <h1
            className="text-[28px] sm:text-[32px] font-bold text-(--c-text)"
            style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            Hey, {firstName}! 👋
          </h1>
          <p className="text-[15px] text-(--c-text-3) mt-3 leading-relaxed max-w-[380px]">
            Cumulus tracks your GPA so you always know where you stand.
            Set it up once and your running grade updates automatically as you enter scores.
          </p>
        </div>
      </div>

      <Button variant="primary" onClick={onNext} className="w-full sm:w-auto">
        Let's get started →
      </Button>
    </motion.div>
  );
}

// ─── Step 2: Canvas (connect + import) ───────────────────────────────────────

function StepCanvas({ onDone }: { onDone: (goToSync: boolean) => void }) {
  const upsertConnection = useMutation(api.canvasConnections.upsert);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function handleConnect() {
    if (!token.trim() || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const canvasUser = await canvasApi.getUser(token.trim());
      await upsertConnection({
        domain: 'ashesi.instructure.com',
        token: token.trim(),
        connectedAt: Date.now(),
        studentName: canvasUser.name,
        studentId: canvasUser.id,
      });
      setConnected(true);
    } catch (err) {
      if (err instanceof CanvasApiError && err.status === 401) {
        setError('Invalid token — please double-check and try again');
      } else {
        setError('Connection failed — check your internet connection');
      }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <StepBar step={2} />

      <div>
        <h2 className="text-[24px] font-bold text-(--c-text)" style={{ letterSpacing: '-0.02em' }}>
          Save yourself a lot of typing
        </h2>
        <p className="text-[14px] text-(--c-text-3) mt-1 max-w-[380px]">
          Connect your Canvas account and Cumulus will import your courses, assignments, and grades automatically.
        </p>
      </div>

      {connected ? (
        <>
          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-(--c-grade-a)/15 flex items-center justify-center shrink-0">
              <IconCheck size={18} className="text-(--c-grade-a)" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-(--c-text)">Canvas connected!</div>
              <div className="text-[13px] text-(--c-text-3) mt-0.5">
                Import your courses now, or do it later from Settings.
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => onDone(true)} className="w-full sm:w-auto">
              Import my courses now →
            </Button>
            <button
              onClick={() => onDone(false)}
              className="text-[13px] text-(--c-text-4) hover:text-(--c-text-3) transition-colors cursor-pointer text-center"
            >
              Go to my dashboard
            </button>
          </div>
        </>
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-(--c-grade-e)/10 border border-(--c-grade-e)/25 text-[13px] text-(--c-grade-e)">
                <IconAlertTriangle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.07em] text-(--c-text-3)">
                Canvas Access Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? 'text' : 'password'}
                    className="w-full h-10 px-3 pr-10 rounded-xl text-[14px] text-(--c-text) border outline-none focus:border-(--c-accent) transition-colors"
                    style={{ background: 'var(--c-bg-2)', borderColor: 'var(--c-line)' }}
                    placeholder="Paste your token here…"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--c-text-4) hover:text-(--c-text-3) cursor-pointer"
                  >
                    {showToken ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </div>
                <Button variant="primary" onClick={handleConnect} disabled={connecting || !token.trim()}>
                  {connecting ? <IconLoader size={14} className="animate-spin" /> : <IconLink size={14} />}
                  {connecting ? 'Checking…' : 'Connect'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--c-surface-2)' }}>
              <div className="text-[12px] font-semibold text-(--c-text-2)">How to get your token</div>
              <ol className="flex flex-col gap-2">
                {[
                  <>Open Canvas → <strong className="text-(--c-text-2) font-medium">Account → Settings</strong></>,
                  <>Scroll to <strong className="text-(--c-text-2) font-medium">Approved Integrations</strong></>,
                  <>Click <strong className="text-(--c-text-2) font-medium">+ New Access Token</strong>, give it a name, copy it</>,
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px text-[10px] text-(--c-text-3)" style={{ background: 'var(--c-surface-3)' }}>
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-(--c-text-3) leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://ashesi.instructure.com/profile/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-(--c-accent) hover:underline w-fit"
              >
                <IconExternalLink size={11} /> Open Canvas Settings
              </a>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onDone(false)}
              className="text-[13px] text-(--c-text-4) hover:text-(--c-text-3) transition-colors cursor-pointer text-center"
            >
              Skip for now — connect anytime in Settings
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Main Onboarding component ────────────────────────────────────────────────

export function OnboardingScreen({ initialStep = 1 }: { initialStep?: number }) {
  const { user } = useUser();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const saveStep = useMutation(api.users.saveOnboardingStep);

  const [step, setStep] = useState<number>(Math.min(initialStep, STEP_LABELS.length));

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there';

  const handleSaveStep = useCallback((s: number) => {
    saveStep({ step: s }).catch(() => {});
  }, [saveStep]);

  async function finish(goToSync: boolean) {
    posthog?.capture('onboarding_completed', { step });
    await completeOnboarding({});
    navigate(goToSync ? '/canvas/sync' : '/', { replace: true });
  }

  return (
    <div
      className="min-h-screen flex items-start sm:items-center justify-center p-5 sm:p-8"
      style={{ background: 'var(--c-bg)' }}
    >
      <div className="w-full max-w-[520px] pt-8 sm:pt-0">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepWelcome
              key="step1"
              firstName={firstName}
              onNext={() => { handleSaveStep(2); setStep(2); }}
            />
          )}
          {step === 2 && (
            <StepCanvas
              key="step2"
              onDone={finish}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
