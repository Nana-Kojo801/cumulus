import { useState, useEffect, useRef } from 'react';
import { IconTrash, IconPlus } from '@/components/icons';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import type { Criterion, ScoreEntry, Course } from '@/db/schema';
import { criterionAverage } from '@/lib/calculations';
import { usePostHog } from '@posthog/react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '../../../convex/_generated/api';
import { useOfflineMutation } from '@/lib/useOfflineMutation';

interface ScoreEntryModalProps {
  open: boolean;
  onClose: () => void;
  criterion: Criterion;
  course: Course;
  entries: ScoreEntry[];
}

interface LocalEntry {
  id: string;
  criterionId: string;
  label: string;
  score: string;
  total: string;
  isNew?: boolean;
}

export function ScoreEntryModal({ open, onClose, criterion, course: _course, entries }: ScoreEntryModalProps) {
  const posthog = usePostHog();
  const { toast } = useToast();
  const saveAll = useOfflineMutation(
    api.scoreEntries.saveAll,
    'scoreEntries/saveAll',
    (args) => args,
  );
  const updateCriterion = useOfflineMutation(
    api.criteria.update,
    'criteria/update',
    (args) => args,
  );

  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLocalEntries(
      entries.map(e => ({
        id: e.id,
        criterionId: e.criterionId,
        label: e.label,
        score: e.score !== null ? String(e.score) : '',
        total: String(e.total),
      }))
    );
    setOverrideEnabled(criterion.manualScoreEnabled ?? false);
    setOverrideScore(criterion.manualScore !== undefined ? String(criterion.manualScore) : '');
  }, [open, entries, criterion]);

  function updateEntry(id: string, field: 'label' | 'score' | 'total', value: string) {
    setLocalEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function addEntry() {
    const newCount = localEntries.length + 1;
    setLocalEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      criterionId: criterion.id,
      label: `${criterion.name} ${newCount}`,
      score: '',
      total: '100',
      isNew: true,
    }]);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }

  function removeEntry(id: string) {
    setLocalEntries(prev => prev.filter(e => e.id !== id));
  }

  async function handleSave() {
    // Save score entries
    const existingIds = new Set(entries.map(e => e.id));
    const toCreate = localEntries
      .filter(le => le.isNew)
      .map(le => ({
        label: le.label,
        score: le.score === '' ? null : parseFloat(le.score),
        total: parseFloat(le.total) || 100,
      }));
    const toUpdate = localEntries
      .filter(le => !le.isNew && existingIds.has(le.id))
      .map(le => ({
        id: le.id,
        label: le.label,
        score: le.score === '' ? null : parseFloat(le.score),
        total: parseFloat(le.total) || 100,
      }));
    const currentIds = new Set(localEntries.map(le => le.id));
    const toDelete = entries.filter(e => !currentIds.has(e.id)).map(e => e.id);

    await saveAll({ criterionId: criterion.id, toCreate, toUpdate, toDelete });

    // Save override state if changed
    const overrideChanged =
      overrideEnabled !== (criterion.manualScoreEnabled ?? false) ||
      (overrideEnabled && overrideScore !== String(criterion.manualScore ?? ''));
    if (overrideChanged) {
      const parsedScore = parseFloat(overrideScore);
      await updateCriterion({
        id: criterion.id,
        manualScoreEnabled: overrideEnabled,
        manualScore: overrideEnabled && !isNaN(parsedScore) ? parsedScore : undefined,
      });
    }

    posthog?.capture('scores_saved', {
      entries_created: toCreate.length,
      entries_updated: toUpdate.length,
      entries_deleted: toDelete.length,
      total_entries: localEntries.length,
    });
    toast('Scores saved');
    onClose();
  }

  const scored = localEntries.filter(e => e.score !== '');
  const scoredEntries: ScoreEntry[] = scored.map(e => ({
    id: e.id,
    criterionId: e.criterionId,
    label: e.label,
    score: parseFloat(e.score),
    total: parseFloat(e.total) || 100,
    createdAt: 0,
  }));

  const displayAvg = overrideEnabled && overrideScore !== ''
    ? parseFloat(overrideScore)
    : criterionAverage(scoredEntries);
  const avg = overrideEnabled && overrideScore !== '' ? parseFloat(overrideScore) : criterionAverage(scoredEntries);
  const contribution = avg !== null ? avg * criterion.weight / 100 : null;

  return (
    <Sheet open={open} onClose={onClose} fullHeight>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-(--c-line) flex items-center gap-3 shrink-0">
        <span className="text-[15px] font-semibold text-(--c-text) flex-1 min-w-0 truncate">{criterion.name}</span>
        <Chip variant="accent" className="shrink-0">{criterion.weight}%</Chip>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--c-surface-2) text-(--c-text-3) cursor-pointer shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-(--c-line) shrink-0">
        <StatCard label="Average" value={displayAvg !== null && !isNaN(displayAvg as number) ? `${(displayAvg as number).toFixed(1)}%` : '—'} />
        <StatCard
          label="Contribution"
          value={contribution !== null && !isNaN(contribution) ? `${contribution.toFixed(1)}/${criterion.weight}` : '—'}
        />
        <StatCard label="Scored" value={overrideEnabled ? '—' : `${scored.length}/${localEntries.length}`} />
      </div>

      {/* Override score toggle */}
      <div className="px-4 py-3 border-b border-(--c-line) shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-(--c-text)">Override Score</div>
            <div className="text-[11px] text-(--c-text-3)">Set a manual percentage, ignoring instances</div>
          </div>
          <button
            onClick={() => setOverrideEnabled(v => !v)}
            className={cn(
              'w-10 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer',
              overrideEnabled ? 'bg-(--c-accent)' : 'bg-(--c-surface-3)',
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform',
              overrideEnabled ? 'left-[22px]' : 'left-[2px]',
            )} />
          </button>
        </div>
        {overrideEnabled && (
          <div className="mt-2.5 flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="w-24 bg-(--c-bg-2) border border-(--c-accent) rounded-(--radius-r1) px-2 py-1.5 text-[14px] font-mono text-right text-(--c-text) outline-none focus:border-(--c-accent)"
              value={overrideScore}
              onChange={e => setOverrideScore(e.target.value)}
              placeholder="0–100"
              autoFocus
            />
            <span className="text-[13px] text-(--c-text-3)">%</span>
          </div>
        )}
      </div>

      {/* Instances label + Add button */}
      <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
        <span className={cn(
          'text-[11px] uppercase tracking-[0.08em] font-bold',
          overrideEnabled ? 'text-(--c-text-4)/50' : 'text-(--c-text-4)',
        )}>
          Instances {overrideEnabled && <span className="normal-case tracking-normal font-normal">(ignored)</span>}
        </span>
        <Button variant="ghost" size="sm" onClick={addEntry} disabled={overrideEnabled}>
          <IconPlus size={13} /> Add instance
        </Button>
      </div>

      {/* Entries list */}
      <div ref={listRef} className={cn('flex-1 overflow-y-auto min-h-0 px-4 pb-2 flex flex-col gap-1.5', overrideEnabled && 'opacity-40 pointer-events-none')}>
        {localEntries.map((entry, idx) => {
          const isPending = entry.score === '';
          const scoreVal = entry.score !== '' ? parseFloat(entry.score) : null;
          const totalVal = parseFloat(entry.total) || 100;
          const pct = scoreVal !== null ? (scoreVal / totalVal) * 100 : null;

          return (
            <div
              key={entry.id}
              className={cn(
                'px-3 py-2.5 rounded-(--radius-r2) flex flex-col gap-1.5',
                isPending ? 'pending-stripe' : 'bg-(--c-surface-2)'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-(--c-text-4) w-5 text-right shrink-0">{idx + 1}</span>
                <input
                  className="flex-1 bg-transparent text-[13px] font-semibold text-(--c-text) outline-none min-w-0"
                  value={entry.label}
                  onChange={e => updateEntry(entry.id, 'label', e.target.value)}
                />
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 rounded text-(--c-text-4) hover:text-(--c-grade-e) transition-colors cursor-pointer shrink-0"
                >
                  <IconTrash size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 pl-7">
                <input
                  type="number"
                  className="w-16 bg-(--c-bg-2) border border-(--c-line) rounded-(--radius-r1) px-2 py-1 text-[13px] font-mono text-right text-(--c-text) outline-none focus:border-(--c-accent)"
                  value={entry.score}
                  onChange={e => updateEntry(entry.id, 'score', e.target.value)}
                  placeholder="—"
                />
                <span className="text-(--c-text-4) text-[12px]">/</span>
                <input
                  type="number"
                  className="w-16 bg-(--c-bg-2) border border-(--c-line) rounded-(--radius-r1) px-2 py-1 text-[13px] font-mono text-right text-(--c-text) outline-none focus:border-(--c-accent)"
                  value={entry.total}
                  onChange={e => updateEntry(entry.id, 'total', e.target.value)}
                />
                <span className="flex-1 text-[12px] font-mono tabular-nums text-(--c-text-3) text-right">
                  {pct !== null ? `${pct.toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>
          );
        })}
        {localEntries.length === 0 && (
          <div className="py-8 text-center text-[13px] text-(--c-text-4)">
            No instances yet. Tap "Add instance" to start.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-(--c-line) flex justify-end gap-2 px-5 py-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save</Button>
      </div>
    </Sheet>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-(--c-surface-2) rounded-(--radius-r2) p-3 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.08em] text-(--c-text-4) font-bold">{label}</span>
      <span className="text-[14px] font-semibold tabular-nums text-(--c-text)">{value}</span>
    </div>
  );
}
