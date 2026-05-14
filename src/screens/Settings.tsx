import { useState } from 'react';
import {
  IconDownload, IconUpload, IconTrash, IconLink, IconUnlink,
  IconSync, IconExternalLink, IconLoader, IconLogOut,
} from '@/components/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useCanvasConnection } from '@/hooks/useCanvasConnection';
import { canvasApi, CanvasApiError } from '@/lib/canvas/client';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useDisplayPrefs } from '@/contexts/DisplayPrefsContext';
import { useOfflineMutation } from '@/lib/useOfflineMutation';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const section = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: i * 0.07 },
});

function ThemeChip({ selected, onClick, mode }: { selected: boolean; onClick: () => void; mode: 'light' | 'dark' }) {
  const isDark = mode === 'dark';
  return (
    <button
      onClick={onClick}
      style={{
        border: 0,
        cursor: 'pointer',
        padding: 6,
        borderRadius: 16,
        background: selected ? 'var(--c-accent)' : 'var(--c-surface-2)',
        boxShadow: selected ? '0 8px 20px -8px var(--c-accent)' : 'none',
        transition: 'all 160ms',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{
        height: 84,
        borderRadius: 12,
        padding: 12,
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(135deg, #1A0E10, #271A1D)'
          : 'linear-gradient(135deg, #FAF6F0, #F4EEE6)',
      }}>
        <div style={{ width: 38, height: 6, borderRadius: 3, background: isDark ? '#C9445D' : '#8B1E2D', marginBottom: 6 }} />
        <div style={{ width: 60, height: 4, borderRadius: 2, background: isDark ? '#6E5A56' : '#A89090', marginBottom: 4 }} />
        <div style={{ width: 48, height: 4, borderRadius: 2, background: isDark ? '#3A282D' : '#EBE2D5' }} />
        <div style={{
          position: 'absolute',
          right: 12, top: 12,
          width: 22, height: 22,
          borderRadius: 999,
          background: 'var(--c-gold)',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 6px 2px' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: selected ? 'white' : 'var(--c-text)' }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
        {selected && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4.5 4.5L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

function SettingRow({
  icon, label, action, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  action: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center', borderTop: '1px solid var(--c-line)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: danger ? 'var(--c-coral-bg)' : 'var(--c-surface-2)',
        display: 'grid', placeItems: 'center',
        color: danger ? 'var(--c-grade-e)' : 'var(--c-text-2)',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: danger ? 'var(--c-grade-e)' : 'var(--c-text)' }}>{label}</div>
      <div onClick={onClick}>{action}</div>
    </div>
  );
}

export function Settings() {
  const onMenuOpen = useMenuOpen();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { connection, isLoading: connectionLoading } = useCanvasConnection();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { theme, setTheme } = useTheme();
  const { showShortNames, setShowShortNames } = useDisplayPrefs();

  const [showClear, setShowClear] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [canvasToken, setCanvasToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  const semesters = useSemesters() ?? [];
  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  const clearAll = useOfflineMutation(
    api.data.clearAll,
    'data/clearAll',
    () => ({}),
  );
  const clearAndImport = useMutation(api.data.clearAndImport);
  const deleteAccount = useMutation(api.data.deleteAccount);
  const upsertConnection = useMutation(api.canvasConnections.upsert);
  const removeConnection = useMutation(api.canvasConnections.remove);

  function handleExport() {
    const data = { semesters, courses, criteria, scoreEntries: entries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cumulus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup exported');
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.semesters || !data.courses) throw new Error('Invalid backup format');
      await clearAndImport({
        semesters: data.semesters ?? [],
        courses: data.courses ?? [],
        criteria: data.criteria ?? [],
        scoreEntries: data.scoreEntries ?? [],
      });
      toast('Backup imported successfully');
    } catch {
      toast('Failed to import backup — invalid file format', 'error');
    }
  }

  async function handleClear() {
    await clearAll({});
    toast('All data cleared');
  }

  async function handleConnect() {
    if (!canvasToken.trim()) return;
    setConnecting(true);
    try {
      const user = await canvasApi.getUser(canvasToken.trim());
      await upsertConnection({
        domain: 'ashesi.instructure.com',
        token: canvasToken.trim(),
        connectedAt: Date.now(),
        studentName: user.name,
        studentId: user.id,
      });
      setCanvasToken('');
      toast('Connected to Canvas');
    } catch (err) {
      if (err instanceof CanvasApiError && err.status === 401) {
        toast('Invalid token — please double-check and try again', 'error');
      } else {
        toast('Connection failed — check your internet connection', 'error');
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    await removeConnection({});
    toast('Disconnected from Canvas');
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount({});
      await clerkUser?.delete();
    } catch {
      toast('Failed to delete account — please try again', 'error');
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Settings" onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col gap-8 w-full">

        {/* Appearance */}
        <motion.section {...section(0)}>
          <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>
            Appearance
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ThemeChip selected={theme === 'light'} onClick={() => setTheme('light')} mode="light" />
            <ThemeChip selected={theme === 'dark'} onClick={() => setTheme('dark')} mode="dark" />
          </div>
          <div className="flex items-center justify-between px-1 mt-6">
            <div>
              <div className="text-[14px] font-medium text-(--c-text)">Use short course names</div>
              <div className="text-[12px] text-(--c-text-3)">Show your custom short names instead of full names</div>
            </div>
            <button
              onClick={() => setShowShortNames(!showShortNames)}
              className="relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0"
              style={{ background: showShortNames ? 'var(--c-accent)' : 'var(--c-surface-3)' }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: 4, transform: showShortNames ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </motion.section>

        {/* Canvas Integration */}
        <motion.section {...section(1)}>
          <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>
            Canvas Integration
          </h2>

          {connectionLoading ? (
            <Card className="p-5 flex flex-col gap-3">
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-10 w-full rounded-(--radius-r2)" />
              <div className="skeleton h-10 w-36 rounded-full" />
            </Card>
          ) : connection ? (
            <Card className="divide-y divide-(--c-line)">
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-(--c-grade-a)/15 flex items-center justify-center shrink-0">
                  <IconLink size={16} className="text-(--c-grade-a)" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-(--c-text) truncate">{connection.studentName}</div>
                  <div className="text-[12px] text-(--c-text-3)">ashesi.instructure.com</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-(--c-grade-a) shrink-0" />
              </div>
              <div className="px-4 py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-(--c-text-3)">Connected</span>
                  <span className="text-(--c-text-2) tabular-nums">{fmtDate(connection.connectedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-(--c-text-3)">Last synced</span>
                  <span className="text-(--c-text-2) tabular-nums">
                    {connection.lastSyncedAt ? fmtDate(connection.lastSyncedAt) : 'Never'}
                  </span>
                </div>
              </div>
              <div className="p-4 flex gap-2 flex-wrap">
                <Button variant="primary" onClick={() => navigate('/canvas/sync')}>
                  <IconSync size={14} />
                  {connection.lastSyncedAt ? 'Refresh scores' : 'Sync from Canvas'}
                </Button>
                <Button variant="danger" onClick={() => setShowDisconnect(true)}>
                  <IconUnlink size={14} /> Disconnect
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-(--c-text-3) uppercase tracking-[0.07em]">
                  Access Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="flex-1 min-w-0 h-9 px-3 text-[13px] bg-(--c-bg-2) border border-(--c-line) rounded-(--radius-r1) text-(--c-text) outline-none focus:border-(--c-accent) placeholder:text-(--c-text-4) transition-colors"
                    placeholder="Paste your Canvas access token…"
                    value={canvasToken}
                    onChange={e => setCanvasToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  />
                  <Button variant="primary" onClick={handleConnect} disabled={connecting || !canvasToken.trim()}>
                    {connecting ? <IconLoader size={14} className="animate-spin" /> : <IconLink size={14} />}
                    {connecting ? 'Connecting…' : 'Connect'}
                  </Button>
                </div>
              </div>
              <div className="rounded-(--radius-r2) bg-(--c-surface-2) p-3.5 flex flex-col gap-2">
                <div className="text-[12px] font-medium text-(--c-text-2)">How to generate an access token</div>
                <ol className="text-[12px] text-(--c-text-3) flex flex-col gap-1 pl-4 list-decimal">
                  <li>Open Canvas → <span className="text-(--c-text-2) font-medium">Account → Settings</span></li>
                  <li>Scroll to <span className="text-(--c-text-2) font-medium">Approved Integrations</span></li>
                  <li>Click <span className="text-(--c-text-2) font-medium">New Access Token</span>, copy the token</li>
                </ol>
                <a
                  href="https://ashesi.instructure.com/profile/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-(--c-accent) hover:underline w-fit mt-0.5"
                >
                  <IconExternalLink size={11} /> Open Canvas Settings
                </a>
              </div>
            </Card>
          )}
        </motion.section>

        {/* Data Management */}
        <motion.section {...section(2)}>
          <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>
            Data Management
          </h2>
          <Card className="divide-y divide-(--c-line)">
            <div className="flex items-center gap-4 p-4">
              <span className="flex-1 text-[14px] text-(--c-text)">Export backup</span>
              <Button variant="default" onClick={handleExport}>
                <IconDownload size={14} /> Export
              </Button>
            </div>
            <div className="flex items-center gap-4 p-4">
              <span className="flex-1 text-[14px] text-(--c-text)">Import backup</span>
              <label className="cursor-pointer shrink-0">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
                />
                <span className="inline-flex items-center gap-1.5 h-9 px-4 text-[14px] rounded-full font-medium bg-(--c-surface-2) text-(--c-text) border border-(--c-line-2) hover:bg-(--c-surface-3) transition-all cursor-pointer">
                  <IconUpload size={14} /> Import
                </span>
              </label>
            </div>
            <div className="flex items-center gap-4 p-4">
              <span className="flex-1 text-[14px] text-(--c-grade-e)">Clear all data</span>
              <Button variant="danger" onClick={() => setShowClear(true)}>
                <IconTrash size={14} /> Clear All
              </Button>
            </div>
          </Card>
        </motion.section>

        {/* Account */}
        <motion.section {...section(3)}>
          <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>Account</h2>
          <Card className="divide-y divide-(--c-line)">
            <SettingRow
              icon={<IconLogOut size={16} />}
              label="Sign out"
              action={
                <Button variant="default" size="sm" onClick={() => signOut()}>
                  <IconLogOut size={14} /> Sign Out
                </Button>
              }
            />
            <SettingRow
              icon={<IconTrash size={16} />}
              label="Delete account"
              action={
                <Button variant="danger" size="sm" onClick={() => setShowDeleteAccount(true)}>
                  <IconTrash size={14} /> Delete
                </Button>
              }
              danger
            />
          </Card>
        </motion.section>

      </div>

      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={handleClear}
        title="Clear All Data"
        description="This will permanently delete all semesters, courses, criteria, and scores. This cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        requirePhrase="DELETE"
      />
      <ConfirmDialog
        open={showDisconnect}
        onClose={() => setShowDisconnect(false)}
        onConfirm={handleDisconnect}
        title="Disconnect from Canvas"
        description="This will remove your Canvas token. You can reconnect at any time."
        confirmLabel="Disconnect"
        variant="danger"
      />
      <ConfirmDialog
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This will permanently delete your account, all your grades, and all associated data. This cannot be undone."
        confirmLabel="Delete Account"
        variant="danger"
        requirePhrase="DELETE"
      />
    </div>
  );
}
