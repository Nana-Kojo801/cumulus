import { useState } from 'react';
import {
  IconDownload, IconUpload, IconTrash, IconReset, IconLink, IconUnlink,
  IconSync, IconExternalLink, IconLoader,
} from '@/components/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GradePill } from '@/components/ui/GradePill';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GRADE_SCALE } from '@/lib/gradeScale';
import { db } from '@/db/schema';
import { clearAndReseed } from '@/db/seed';
import { useToast } from '@/components/ui/Toast';
import { useCanvasConnection } from '@/hooks/useCanvasConnection';
import { canvasApi, CanvasApiError } from '@/lib/canvas/client';

const section = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: i * 0.07 },
});

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function Settings() {
  const onMenuOpen = useMenuOpen();
  const { toast } = useToast();
  const navigate = useNavigate();
  const connection = useCanvasConnection();
  const [showClear, setShowClear] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [canvasToken, setCanvasToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  async function handleExport() {
    const [semesters, courses, criteria, entries] = await Promise.all([
      db.semesters.toArray(),
      db.courses.toArray(),
      db.criteria.toArray(),
      db.scoreEntries.toArray(),
    ]);
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
      await db.transaction('rw', db.semesters, db.courses, db.criteria, db.scoreEntries, async () => {
        await db.semesters.clear();
        await db.courses.clear();
        await db.criteria.clear();
        await db.scoreEntries.clear();
        await db.semesters.bulkAdd(data.semesters ?? []);
        await db.courses.bulkAdd(data.courses ?? []);
        await db.criteria.bulkAdd(data.criteria ?? []);
        await db.scoreEntries.bulkAdd(data.scoreEntries ?? []);
      });
      toast('Backup imported successfully');
    } catch {
      toast('Failed to import backup — invalid file format', 'error');
    }
  }

  async function handleClear() {
    await db.transaction('rw', db.semesters, db.courses, db.criteria, db.scoreEntries, async () => {
      await db.semesters.clear();
      await db.courses.clear();
      await db.criteria.clear();
      await db.scoreEntries.clear();
    });
    toast('All data cleared');
  }

  async function handleReset() {
    await clearAndReseed();
    toast('Demo data restored');
  }

  async function handleConnect() {
    if (!canvasToken.trim()) return;
    setConnecting(true);
    try {
      const user = await canvasApi.getUser(canvasToken.trim());
      await db.canvasConnections.put({
        id: 'default',
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
    await db.canvasConnections.delete('default');
    toast('Disconnected from Canvas');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
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

          </div>
        </div>
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
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={handleReset}
        title="Reset to Demo Data"
        description="This will replace all your current data with the demo seed data."
        confirmLabel="Reset"
        variant="danger"
      />

      <ConfirmDialog
        open={showDisconnect}
        onClose={() => setShowDisconnect(false)}
        onConfirm={handleDisconnect}
        title="Disconnect from Canvas"
        description="This will remove your Canvas token from this device. You can reconnect at any time by entering a new token."
        confirmLabel="Disconnect"
        variant="danger"
      />
    </div>
  );
}
