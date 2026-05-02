import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

import { Chip } from '@/components/ui/Chip';
import { db } from '@/db/schema';
import type { Criterion, ScoreEntry, Course } from '@/db/schema';
import { criterionAverage } from '@/lib/calculations';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

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

export function ScoreEntryModal({ open, onClose, criterion, course, entries }: ScoreEntryModalProps) {
  const { toast } = useToast();
  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);

  useEffect(() => {
    setLocalEntries(
      entries.map(e => ({
        id: e.id,
        criterionId: e.criterionId,
        label: e.label,
        score: e.score !== null ? String(e.score) : '',
        total: String(e.total),
      }))
    );
  }, [entries, open]);

  function updateEntry(id: string, field: 'label' | 'score' | 'total', value: string) {
    setLocalEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function addEntry() {
    const newCount = localEntries.length + 1;
    setLocalEntries(prev => [...prev, {
      id: uuidv4(),
      criterionId: criterion.id,
      label: `${criterion.name} ${newCount}`,
      score: '',
      total: '100',
      isNew: true,
    }]);
  }

  function removeEntry(id: string) {
    setLocalEntries(prev => prev.filter(e => e.id !== id));
  }

  async function handleSave() {
    await db.transaction('rw', db.scoreEntries, db.criteria, async () => {
      for (const le of localEntries) {
        const scoreVal = le.score === '' ? null : parseFloat(le.score);
        const totalVal = parseFloat(le.total) || 100;

        if (le.isNew) {
          await db.scoreEntries.add({
            id: le.id,
            criterionId: le.criterionId,
            label: le.label,
            score: scoreVal,
            total: totalVal,
            manuallyEdited: true,
            createdAt: Date.now(),
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.scoreEntries.where('id').equals(le.id).modify((e: any) => {
            e.label = le.label;
            e.score = scoreVal;
            e.total = totalVal;
            e.manuallyEdited = true;
            delete e.entryWeight;
          });
        }
      }
      const existingIds = new Set(localEntries.map(e => e.id));
      const toDelete = entries.filter(e => !existingIds.has(e.id)).map(e => e.id);
      if (toDelete.length > 0) await db.scoreEntries.bulkDelete(toDelete);
      await db.criteria.update(criterion.id, { instanceCount: localEntries.length });
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
  const avg = criterionAverage(scoredEntries);
  const contribution = avg !== null ? avg * criterion.weight / 100 : null;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-(--c-line) flex items-center gap-3 shrink-0">
          <span className="text-[15px] font-medium text-(--c-text) flex-1">{criterion.name}</span>
          <Chip variant="accent">{criterion.weight}% of grade</Chip>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--c-surface-2) text-(--c-text-3) cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-(--c-line)">
          <StatCard label="Average so far" value={avg !== null ? `${avg.toFixed(1)}%` : '—'} />
          <StatCard
            label="Contribution"
            value={contribution !== null ? `${contribution.toFixed(1)} / ${criterion.weight}pts` : '—'}
          />
          <StatCard label="Completed" value={`${scored.length} / ${localEntries.length}`} />
        </div>

        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Instances</span>
        </div>

        {/* Entries list */}
        <div className="px-4 pb-1 flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
          {localEntries.map((entry, idx) => {
            const isPending = entry.score === '';
            const scoreVal = entry.score !== '' ? parseFloat(entry.score) : null;
            const totalVal = parseFloat(entry.total) || 100;
            const pct = scoreVal !== null ? (scoreVal / totalVal) * 100 : null;

            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-(--radius-r2)',
                  isPending ? 'pending-stripe' : 'bg-(--c-surface-2)'
                )}
              >
                <span className="font-mono text-[11px] text-(--c-text-4) w-5 text-right shrink-0">{idx + 1}</span>
                <input
                  className="flex-1 bg-transparent text-[13px] text-(--c-text) outline-none min-w-0"
                  value={entry.label}
                  onChange={e => updateEntry(entry.id, 'label', e.target.value)}
                />
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
                <span className="w-12 text-[12px] font-mono tabular-nums text-(--c-text-3) text-right">
                  {pct !== null ? `${pct.toFixed(0)}%` : '—'}
                </span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 rounded text-(--c-text-4) hover:text-(--c-grade-e) transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-2">
          <Button variant="ghost" size="sm" onClick={addEntry}>
            <Plus size={13} /> Add instance
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-(--c-line)">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Sheet>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-(--c-surface-2) rounded-(--radius-r2) p-3 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.08em] text-(--c-text-3)">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums text-(--c-text)">{value}</span>
    </div>
  );
}
