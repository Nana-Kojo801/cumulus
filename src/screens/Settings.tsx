import { useState } from 'react';
import {
<<<<<<< HEAD
  IconDownload, IconUpload, IconTrash, IconLink, IconUnlink, IconRefreshCw, IconExternalLink, IconLoader, IconLogOut,
=======
  IconDownload, IconUpload, IconTrash, IconReset, IconLink, IconUnlink,
  IconSync, IconExternalLink, IconLoader,
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
} from '@/components/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
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
  const connection = useCanvasConnection();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { theme, setTheme } = useTheme();

  const [showClear, setShowClear] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [canvasToken, setCanvasToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  const semesters = useSemesters() ?? [];
  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  const clearAll = useMutation(api.data.clearAll);
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
<<<<<<< HEAD
      <Topbar title="Settings" onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 lg:p-7 flex flex-col gap-8">
=======
      <Topbar breadcrumbs={[{ label: 'Settings' }]} onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col gap-8">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

          {/* Grade Scale */}
          <motion.section {...section(0)}>
            <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>
              Grade Scale
            </h2>
            <Card className="overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-(--c-line) bg-(--c-surface-2)">
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-[0.08em] text-(--c-text-3) font-normal w-16">Letter</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-[0.08em] text-(--c-text-3) font-normal">Range</th>
                    <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-[0.08em] text-(--c-text-3) font-normal">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--c-line)">
                  {GRADE_SCALE.map(g => (
                    <tr key={g.letter} className="hover:bg-(--c-surface-2) transition-colors">
                      <td className="px-4 py-2.5"><GradePill letter={g.letter} size="sm" /></td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-(--c-text-2)">
                        {g.min}–{g.max === 100 ? '100' : g.max.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-(--c-text-2) text-right">
                        {g.points.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.section>

          {/* Right column */}
          <div className="flex flex-col gap-8">

            {/* Canvas Integration */}
            <motion.section {...section(1)}>
              <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>
                Canvas Integration
              </h2>

              {connection ? (
                <Card className="divide-y divide-(--c-line)">
                  {/* Connected header */}
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

                  {/* Meta */}
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

                  {/* Actions */}
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
                  {/* Token input */}
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
                      <Button
                        variant="primary"
                        onClick={handleConnect}
                        disabled={connecting || !canvasToken.trim()}
                      >
                        {connecting
                          ? <IconLoader size={14} className="animate-spin" />
                          : <IconLink size={14} />}
                        {connecting ? 'Connecting…' : 'Connect'}
                      </Button>
                    </div>
                  </div>

                  {/* Token guide */}
                  <div className="rounded-(--radius-r2) bg-(--c-surface-2) p-3.5 flex flex-col gap-2">
                    <div className="text-[12px] font-medium text-(--c-text-2)">How to generate an access token</div>
                    <ol className="text-[12px] text-(--c-text-3) flex flex-col gap-1 pl-4 list-decimal">
                      <li>Open Canvas and go to <span className="text-(--c-text-2) font-medium">Account → Settings</span></li>
                      <li>Scroll down to <span className="text-(--c-text-2) font-medium">Approved Integrations</span></li>
                      <li>Click <span className="text-(--c-text-2) font-medium">New Access Token</span>, give it a name, and copy the token</li>
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
                <div className="flex items-start gap-4 p-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-(--c-text) mb-0.5">Export backup</div>
                    <div className="text-[12px] text-(--c-text-3)">Download a full JSON backup of all your data.</div>
                  </div>
                  <Button variant="default" onClick={handleExport}>
                    <IconDownload size={14} /> Export
                  </Button>
                </div>

                <div className="flex items-start gap-4 p-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-(--c-text) mb-0.5">Import backup</div>
                    <div className="text-[12px] text-(--c-text-3)">Restore from a previously exported backup.</div>
                  </div>
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

                <div className="flex items-start gap-4 p-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-(--c-text) mb-0.5">Reset to demo data</div>
                    <div className="text-[12px] text-(--c-text-3)">Restore the seed data to explore all features.</div>
                  </div>
                  <Button variant="default" onClick={() => setShowReset(true)}>
                    <IconReset size={14} /> Reset Demo
                  </Button>
                </div>

                <div className="flex items-start gap-4 p-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-(--c-grade-e) mb-0.5">Clear all data</div>
                    <div className="text-[12px] text-(--c-text-3)">Permanently delete everything. Cannot be undone.</div>
                  </div>
                  <Button variant="danger" onClick={() => setShowClear(true)}>
                    <IconTrash size={14} /> Clear All
                  </Button>
                </div>
              </Card>
            </motion.section>

            {/* About */}
            <motion.section {...section(3)}>
              <h2 className="text-[18px] font-medium text-(--c-text) mb-3" style={{ letterSpacing: '-0.018em' }}>About</h2>
              <Card className="p-5 flex flex-col gap-2">
                <div className="text-[15px] font-medium text-(--c-text)">Cumulus</div>
                <div className="text-[12px] font-mono text-(--c-text-3)">Version 1.0.0 · local-first</div>
                <p className="text-[13px] text-(--c-text-2)">
                  A GPA tracker for Ashesi University students. All data stays on your device — no account, no server.
                </p>
              </Card>
            </motion.section>
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6

        {/* Appearance */}
        <motion.section {...section(0)}>
          <div className="c-label mb-3">Appearance</div>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <ThemeChip selected={theme === 'light'} onClick={() => setTheme('light')} mode="light" />
            <ThemeChip selected={theme === 'dark'} onClick={() => setTheme('dark')} mode="dark" />
          </div>
        </motion.section>

        {/* Canvas Integration */}
        <motion.section {...section(1)}>
          <div className="c-label mb-3">Canvas Integration</div>
          <div className="c-card overflow-hidden">
            {connection ? (
              <>
                <SettingRow
                  icon={<IconLink size={16} />}
                  label={connection.studentName}
                  action={
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>
                        Synced {connection.lastSyncedAt ? fmtDate(connection.lastSyncedAt) : 'never'}
                      </span>
                      <div style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--c-grade-a)' }} />
                    </div>
                  }
                />
                <SettingRow
                  icon={<IconRefreshCw size={16} />}
                  label={connection.lastSyncedAt ? 'Refresh scores' : 'Sync from Canvas'}
                  action={
                    <Button variant="primary" size="sm" onClick={() => navigate('/canvas/sync')}>
                      <IconRefreshCw size={14} /> Sync
                    </Button>
                  }
                />
                <SettingRow
                  icon={<IconUnlink size={16} />}
                  label="Disconnect Canvas"
                  action={
                    <Button variant="danger" size="sm" onClick={() => setShowDisconnect(true)}>
                      <IconUnlink size={14} /> Disconnect
                    </Button>
                  }
                  danger
                />
              </>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="c-label">Access Token</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      className="c-input flex-1 min-w-0"
                      style={{ height: 40 }}
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
                <div style={{ borderRadius: 12, background: 'var(--c-surface-2)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-2)', marginBottom: 6 }}>How to get an access token</div>
                  <ol style={{ fontSize: 12, color: 'var(--c-text-3)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <li>Open Canvas → <strong style={{ color: 'var(--c-text-2)' }}>Account → Settings</strong></li>
                    <li>Scroll to <strong style={{ color: 'var(--c-text-2)' }}>Approved Integrations</strong></li>
                    <li>Click <strong style={{ color: 'var(--c-text-2)' }}>New Access Token</strong> and copy it</li>
                  </ol>
                  <a href="https://ashesi.instructure.com/profile/settings" target="_blank" rel="noopener noreferrer" className="c-link inline-flex items-center gap-1 mt-2" style={{ fontSize: 12 }}>
                    <IconExternalLink size={11} /> Open Canvas Settings
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Data Management */}
        <motion.section {...section(2)}>
          <div className="c-label mb-3">Data Management</div>
          <div className="c-card overflow-hidden">
            <SettingRow
              icon={<IconDownload size={16} />}
              label="Export backup"
              action={
                <Button variant="default" size="sm" onClick={handleExport}>
                  <IconDownload size={14} /> Export
                </Button>
              }
            />
            <SettingRow
              icon={<IconUpload size={16} />}
              label="Import backup"
              action={
                <label className="cursor-pointer">
                  <input type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])} />
                  <span className="c-btn sm ghost"><IconUpload size={14} /> Import</span>
                </label>
              }
            />
            <SettingRow
              icon={<IconTrash size={16} />}
              label="Clear all data"
              action={
                <Button variant="danger" size="sm" onClick={() => setShowClear(true)}>
                  <IconTrash size={14} /> Clear All
                </Button>
              }
              danger
            />
          </div>
        </motion.section>

        {/* Account */}
        <motion.section {...section(3)}>
          <div className="c-label mb-3">Account</div>
          <div className="c-card overflow-hidden">
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
          </div>
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
