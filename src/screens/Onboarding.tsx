import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  IconExternalLink, IconLink, IconLoader, IconCheck,
  IconAlertTriangle, IconPlus, IconTrash, IconEye, IconEyeOff,
} from '@/components/icons';
import { canvasApi, CanvasApiError } from '@/lib/canvas/client';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { usePostHog } from '@posthog/react';
import { cn } from '@/lib/utils';

interface CourseRow {
  id: string;
  name: string;
  code: string;
  credits: number;
}

const STEP_LABELS = ['Welcome', 'Your semester', 'Your courses', 'Canvas (optional)'];

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

// ─── Step 2: Semester setup ───────────────────────────────────────────────────

function StepSemester({
  onNext,
  onSave,
}: {
  onNext: (id: string, name: string) => void;
  onSave: (step: number) => void;
}) {
  const createSemester = useMutation(api.semesters.create);
  const [year, setYear] = useState(1);
  const [term, setTerm] = useState(1);
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);

  const autoName = `Year ${year} · Semester ${term}`;
  const displayName = customName || autoName;

  async function handleNext() {
    setSaving(true);
    try {
      const id = await createSemester({
        name: displayName,
        year,
        term,
        status: 'active',
        createdAt: Date.now(),
      });
      onSave(3);
      onNext(id as string, displayName);
    } finally {
      setSaving(false);
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
          Set up your first semester
        </h2>
        <p className="text-[14px] text-(--c-text-3) mt-1">
          A semester groups all your courses together. You can add more later.
        </p>
      </div>

      <Card className="flex flex-col gap-5">
        {/* Year selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold uppercase tracking-[0.07em] text-(--c-text-3)">
            Academic Year
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(y => (
              <button
                key={y}
                onClick={() => { setYear(y); setCustomName(''); }}
                className="h-10 rounded-xl text-[14px] font-semibold border transition-all cursor-pointer"
                style={{
                  background: year === y ? 'var(--c-accent-bg)' : 'var(--c-surface-2)',
                  color: year === y ? 'var(--c-accent)' : 'var(--c-text-3)',
                  borderColor: year === y ? 'var(--c-accent)' : 'var(--c-line)',
                }}
              >
                Year {y}
              </button>
            ))}
          </div>
        </div>

        {/* Semester selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold uppercase tracking-[0.07em] text-(--c-text-3)">
            Semester
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map(s => (
              <button
                key={s}
                onClick={() => { setTerm(s); setCustomName(''); }}
                className="h-10 rounded-xl text-[14px] font-semibold border transition-all cursor-pointer"
                style={{
                  background: term === s ? 'var(--c-accent-bg)' : 'var(--c-surface-2)',
                  color: term === s ? 'var(--c-accent)' : 'var(--c-text-3)',
                  borderColor: term === s ? 'var(--c-accent)' : 'var(--c-line)',
                }}
              >
                Semester {s}
              </button>
            ))}
          </div>
        </div>

        {/* Name preview + edit */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold uppercase tracking-[0.07em] text-(--c-text-3)">
            Semester Name
          </label>
          <input
            className="h-10 px-3 rounded-xl text-[14px] text-(--c-text) border outline-none focus:border-(--c-accent) transition-colors"
            style={{ background: 'var(--c-bg-2)', borderColor: 'var(--c-line)' }}
            value={displayName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="e.g. Year 1 · Semester 1"
          />
        </div>
      </Card>

      <Button variant="primary" onClick={handleNext} disabled={saving || !displayName.trim()} className="w-full sm:w-auto">
        {saving ? <><IconLoader size={14} className="animate-spin" /> Creating…</> : 'Continue →'}
      </Button>
    </motion.div>
  );
}

// ─── Step 3: Add courses ──────────────────────────────────────────────────────

function StepCourses({
  semesterName,
  semesterId,
  onNext,
  onSkip,
  onSave,
}: {
  semesterName: string;
  semesterId: string;
  onNext: () => void;
  onSkip: () => void;
  onSave: (step: number) => void;
}) {
  const createCourse = useMutation(api.courses.create);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(3);
  const [saving, setSaving] = useState(false);

  function addCourse() {
    if (!name.trim()) return;
    setCourses(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), code: code.trim(), credits }]);
    setName('');
    setCode('');
    setCredits(3);
  }

  function removeCourse(id: string) {
    setCourses(prev => prev.filter(c => c.id !== id));
  }

  async function handleNext() {
    setSaving(true);
    try {
      for (const c of courses) {
        await createCourse({
          semesterId,
          name: c.name,
          code: c.code,
          credits: c.credits,
          createdAt: Date.now(),
        });
      }
      onSave(4);
      onNext();
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <StepBar step={3} />

      <div>
        <h2 className="text-[24px] font-bold text-(--c-text)" style={{ letterSpacing: '-0.02em' }}>
          Add your courses
        </h2>
        <p className="text-[14px] text-(--c-text-3) mt-1">
          For <span className="text-(--c-text-2) font-medium">{semesterName}</span>. You can always add more later.
        </p>
      </div>

      {/* Add course form */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <input
            className="h-10 px-3 rounded-xl text-[14px] text-(--c-text) border outline-none focus:border-(--c-accent) transition-colors w-full"
            style={{ background: 'var(--c-bg-2)', borderColor: 'var(--c-line)' }}
            placeholder="Course name (e.g. Calculus I)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCourse()}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 h-10 px-3 rounded-xl text-[14px] text-(--c-text) border outline-none focus:border-(--c-accent) transition-colors"
              style={{ background: 'var(--c-bg-2)', borderColor: 'var(--c-line)' }}
              placeholder="Code (optional, e.g. CS 101)"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCourse()}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setCredits(c => Math.max(1, c - 1))}
                className="w-8 h-10 rounded-lg text-[18px] text-(--c-text-3) hover:text-(--c-text) hover:bg-(--c-surface-2) transition-all cursor-pointer flex items-center justify-center"
              >
                −
              </button>
              <span className="w-8 text-center text-[14px] font-mono font-semibold text-(--c-text) tabular-nums">
                {credits}
              </span>
              <button
                onClick={() => setCredits(c => Math.min(9, c + 1))}
                className="w-8 h-10 rounded-lg text-[18px] text-(--c-text-3) hover:text-(--c-text) hover:bg-(--c-surface-2) transition-all cursor-pointer flex items-center justify-center"
              >
                +
              </button>
              <span className="text-[12px] text-(--c-text-4) ml-1">cr</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={addCourse} disabled={!name.trim()}>
          <IconPlus size={13} /> Add course
        </Button>
      </Card>

      {/* Added courses list */}
      {courses.length > 0 && (
        <div className="flex flex-col gap-2">
          {courses.map(c => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-line)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-(--c-text) truncate">{c.name}</div>
                <div className="text-[12px] text-(--c-text-4)">
                  {c.code ? `${c.code} · ` : ''}{c.credits} credits
                </div>
              </div>
              <button
                onClick={() => removeCourse(c.id)}
                className="p-1.5 text-(--c-text-4) hover:text-(--c-grade-e) transition-colors cursor-pointer shrink-0"
              >
                <IconTrash size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={saving || courses.length === 0}
          className="w-full sm:w-auto"
        >
          {saving
            ? <><IconLoader size={14} className="animate-spin" /> Saving…</>
            : `Continue with ${courses.length} course${courses.length !== 1 ? 's' : ''} →`}
        </Button>
        <button
          onClick={() => { onSave(4); onSkip(); }}
          className="text-[13px] text-(--c-text-4) hover:text-(--c-text-3) transition-colors cursor-pointer text-center"
        >
          Skip, I'll add courses later
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 4: Canvas (optional) ────────────────────────────────────────────────

function StepCanvas({
  onDone,
}: {
  onDone: () => void;
}) {
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
      key="step4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <StepBar step={4} />

      <div>
        <h2 className="text-[24px] font-bold text-(--c-text)" style={{ letterSpacing: '-0.02em' }}>
          Save yourself a lot of typing
        </h2>
        <p className="text-[14px] text-(--c-text-3) mt-1 max-w-[380px]">
          Connect your Canvas account and Cumulus will import your courses, assignments, and grades automatically.
        </p>
      </div>

      {connected ? (
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-(--c-grade-a)/15 flex items-center justify-center shrink-0">
            <IconCheck size={18} className="text-(--c-grade-a)" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-(--c-text)">Canvas connected!</div>
            <div className="text-[13px] text-(--c-text-3) mt-0.5">
              You can sync your grades from Settings anytime.
            </div>
          </div>
        </Card>
      ) : (
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
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px text-[10px] text-(--c-text-3)" style={{ background: 'var(--c-surface-3)' }}>
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-(--c-text-3) leading-relaxed">{step}</span>
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
      )}

      <div className="flex flex-col gap-3">
        <Button variant="primary" onClick={onDone} className="w-full sm:w-auto">
          {connected ? 'Go to dashboard →' : 'Finish setup →'}
        </Button>
        {!connected && (
          <button
            onClick={onDone}
            className="text-[13px] text-(--c-text-4) hover:text-(--c-text-3) transition-colors cursor-pointer text-center"
          >
            Skip for now — connect anytime in Settings
          </button>
        )}
      </div>
    </motion.div>
  );
}

const SEM_CACHE_KEY = 'cumulus-onb-sem';

// ─── Main Onboarding component ────────────────────────────────────────────────

export function OnboardingScreen({ initialStep = 1 }: { initialStep?: number }) {
  const { user } = useUser();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const saveStep = useMutation(api.users.saveOnboardingStep);

  const [step, setStep] = useState<number>(initialStep);
  const cached = (() => { try { return JSON.parse(localStorage.getItem(SEM_CACHE_KEY) ?? 'null'); } catch { return null; } })();
  const [semesterId, setSemesterId] = useState<string>(cached?.id ?? '');
  const [semesterName, setSemesterName] = useState<string>(cached?.name ?? '');

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there';

  const handleSaveStep = useCallback((s: number) => {
    saveStep({ step: s }).catch(() => {});
  }, [saveStep]);

  async function finish() {
    posthog?.capture('onboarding_completed', { step });
    await completeOnboarding({});
    localStorage.removeItem(SEM_CACHE_KEY);
    navigate('/', { replace: true });
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
            <StepSemester
              key="step2"
              onNext={(id, name) => {
                localStorage.setItem(SEM_CACHE_KEY, JSON.stringify({ id, name }));
                setSemesterId(id);
                setSemesterName(name);
                setStep(3);
              }}
              onSave={handleSaveStep}
            />
          )}
          {step === 3 && (
            <StepCourses
              key="step3"
              semesterName={semesterName}
              semesterId={semesterId}
              onNext={() => setStep(4)}
              onSkip={() => setStep(4)}
              onSave={handleSaveStep}
            />
          )}
          {step === 4 && (
            <StepCanvas
              key="step4"
              onDone={finish}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
