import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { GradePill } from '@/components/ui/GradePill';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { Course, Criterion, ScoreEntry } from '@/db/schema';
import { requiredAverage, requiredOnEntry, letterFor } from '@/lib/calculations';
import { TARGET_GRADES } from '@/lib/gradeScale';
import { cn } from '@/lib/utils';

const NONE = '__none__';

interface WhatScoreModalProps {
  open: boolean;
  onClose: () => void;
  course: Course;
  criteria: Criterion[];
  entries: ScoreEntry[];
}

type Mode = 'overall' | 'specific';

export function WhatScoreModal({ open, onClose, course, criteria, entries }: WhatScoreModalProps) {
  const [mode, setMode] = useState<Mode>('overall');
  const [targetLetter, setTargetLetter] = useState('B+');
  const [selectedEntryId, setSelectedEntryId] = useState('');

  const pendingEntries = entries.filter(e => e.score === null);

  const overallResult = requiredAverage(course, criteria, entries, targetLetter);
  const specificResult = selectedEntryId
    ? requiredOnEntry(course, criteria, entries, targetLetter, selectedEntryId)
    : null;

  const selectedEntry = entries.find(e => e.id === selectedEntryId);
  const selectedCrit = selectedEntry
    ? criteria.find(c => c.id === selectedEntry.criterionId)
    : null;

  return (
    <Sheet open={open} onClose={onClose} title="What Score Do I Need?">
      <div className="p-5 flex flex-col gap-5">
        {/* Mode toggle */}
        <div className="flex rounded-(--radius-r2) bg-(--c-surface-2) p-0.5 border border-(--c-line)">
          {([['overall', 'Across all remaining work'], ['specific', 'For one specific assessment']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 py-1.5 text-[13px] rounded-(--radius-r1) transition-all cursor-pointer font-serif',
                mode === m
                  ? 'bg-(--c-surface-3) text-(--c-text) shadow'
                  : 'text-(--c-text-3) hover:text-(--c-text-2)'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Target grade */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Target Grade</span>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_GRADES.map(g => (
              <button
                key={g}
                onClick={() => setTargetLetter(g)}
                className={cn(
                  'h-9 px-3 rounded-full text-[13px] font-serif border transition-all cursor-pointer',
                  targetLetter === g
                    ? 'bg-(--c-accent-bg) text-(--c-accent) border-(--c-accent)/30'
                    : 'bg-(--c-surface-2) text-(--c-text-2) border-(--c-line) hover:bg-(--c-surface-3)'
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {mode === 'overall' && (
          <OverallResult result={overallResult} targetLetter={targetLetter} entries={entries} />
        )}

        {mode === 'specific' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Select Assessment</span>
              <Select
                value={selectedEntryId || NONE}
                onValueChange={val => setSelectedEntryId(val === NONE ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pending assessment…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select a pending assessment…</SelectItem>
                  {pendingEntries.length > 0 && <SelectSeparator />}
                  {pendingEntries.map(e => {
                    const crit = criteria.find(c => c.id === e.criterionId);
                    return (
                      <SelectItem key={e.id} value={e.id}>
                        {e.label} · {crit?.name} · out of {e.total}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {specificResult && selectedEntry && selectedCrit && (
              <SpecificResult
                result={specificResult}
                entry={selectedEntry}
                crit={selectedCrit}
                targetLetter={targetLetter}
              />
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Sheet>
  );
}

function OverallResult({
  result,
  targetLetter,
  entries,
}: {
  result: ReturnType<typeof requiredAverage>;
  targetLetter: string;
  entries: ScoreEntry[];
}) {
  const currentLetter = result.earned > 0 ? letterFor(result.earned) : null;

  return (
    <div className="rounded-(--radius-r3) border border-(--c-line-2) p-4 flex flex-col gap-3 bg-(--c-surface-2)">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-(--c-text-3)">Current grade</span>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tabular-nums text-(--c-text)">
            {result.earned > 0 ? `${result.earned.toFixed(1)}%` : '—'}
          </span>
          {currentLetter && <GradePill letter={currentLetter} size="sm" />}
        </div>
      </div>

      {result.trivial && (
        <div className="bg-(--c-grade-a)/10 text-(--c-grade-a) border border-(--c-grade-a)/20 rounded-(--radius-r2) p-3 text-[13px]">
          You've already secured at least <strong>{targetLetter}</strong>. Well done!
        </div>
      )}

      {result.impossible && !result.trivial && (
        <div className="bg-(--c-grade-e)/10 text-(--c-grade-e) border border-(--c-grade-e)/20 rounded-(--radius-r2) p-3 text-[13px]">
          You cannot reach <strong>{targetLetter}</strong>. Highest achievable is{' '}
          <strong>{letterFor(result.maxAchievable)}</strong>.
        </div>
      )}

      {!result.trivial && !result.impossible && result.required !== null && (
        <div className="bg-(--c-accent-bg) text-(--c-accent) border border-(--c-accent)/20 rounded-(--radius-r2) p-3 text-[13px]">
          You need an average of{' '}
          <strong className="text-[16px]">{result.required.toFixed(1)}%</strong>{' '}
          across your remaining <strong>{result.pendingWeight.toFixed(0)}%</strong> of weighted work to reach{' '}
          <strong>{targetLetter}</strong>.
        </div>
      )}

      {result.pendingWeight === 0 && !result.trivial && !result.impossible && (
        <div className="text-[13px] text-(--c-text-3)">All work is scored.</div>
      )}
    </div>
  );
}

function SpecificResult({
  result,
  entry,
  crit,
  targetLetter,
}: {
  result: ReturnType<typeof requiredOnEntry>;
  entry: ScoreEntry;
  crit: Criterion;
  targetLetter: string;
}) {
  return (
    <div className="rounded-(--radius-r3) border border-(--c-line-2) p-4 bg-(--c-surface-2)">
      {result.alreadySecured && (
        <div className="bg-(--c-grade-a)/10 text-(--c-grade-a) border border-(--c-grade-a)/20 rounded-(--radius-r2) p-3 text-[13px]">
          You've already secured at least <strong>{targetLetter}</strong>, even if you score 0 on {entry.label}.
        </div>
      )}
      {result.impossible && !result.alreadySecured && (
        <div className="bg-(--c-grade-e)/10 text-(--c-grade-e) border border-(--c-grade-e)/20 rounded-(--radius-r2) p-3 text-[13px]">
          You cannot reach <strong>{targetLetter}</strong> even with a perfect score on {entry.label}.
        </div>
      )}
      {!result.alreadySecured && !result.impossible && result.needed !== null && (
        <div className="bg-(--c-accent-bg) text-(--c-accent) border border-(--c-accent)/20 rounded-(--radius-r2) p-3 text-[13px]">
          You need{' '}
          <strong className="text-[16px]">{result.needed.toFixed(1)}/{entry.total}</strong>
          {result.neededPct !== null && ` (${result.neededPct.toFixed(1)}%)`}{' '}
          on <strong>{entry.label}</strong> to reach <strong>{targetLetter}</strong>,
          assuming average performance on your other pending work.
        </div>
      )}
    </div>
  );
}
