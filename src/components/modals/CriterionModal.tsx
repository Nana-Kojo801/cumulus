import { useState, useEffect } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { Criterion } from '@/db/schema';
import { cn } from '@/lib/utils';
import { usePostHog } from '@posthog/react';
import { useToast } from '@/components/ui/Toast';
import { api } from '../../../convex/_generated/api';
import { useOfflineMutation } from '@/lib/useOfflineMutation';

interface CriterionModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  existingCriteria: Criterion[];
  editing?: Criterion;
}

export function CriterionModal({ open, onClose, courseId, existingCriteria, editing }: CriterionModalProps) {
  const posthog = usePostHog();
  const { toast } = useToast();
  const createCriterion = useOfflineMutation(
    api.criteria.create,
    'criteria/create',
    (args) => ({ ...args, tempId: crypto.randomUUID() }),
    (localArgs) => (localArgs as { tempId: string }).tempId,
  );
  const updateCriterion = useOfflineMutation(
    api.criteria.update,
    'criteria/update',
    (args) => args,
  );

  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setWeight(editing ? String(editing.weight) : '');
    }
  }, [editing, open]);

  const weightNum = parseFloat(weight) || 0;
  const otherWeight = existingCriteria
    .filter(c => c.id !== editing?.id)
    .reduce((acc, c) => acc + c.weight, 0);
  const totalWeight = otherWeight + weightNum;

  const weightStatus =
    totalWeight === 100 ? 'exact' :
    totalWeight > 100   ? 'over'  : 'under';

  const weightColor = {
    exact: 'text-(--c-accent)',
    over:  'text-(--c-grade-e)',
    under: 'text-(--c-text-3)',
  }[weightStatus];

  const remainingWeight = 100 - otherWeight;

  async function handleSave() {
    const w = parseFloat(weight);
    if (!name.trim() || !w || w <= 0) return;

    if (editing) {
      await updateCriterion({ id: editing.id, name: name.trim(), weight: w });
      posthog?.capture('criterion_updated', { weight: w });
      toast('Criterion updated');
    } else {
      await createCriterion({
        courseId,
        name: name.trim(),
        weight: w,
        instanceCount: 0,
        createdAt: Date.now(),
      });
      posthog?.capture('criterion_added', { weight: w });
      toast('Criterion added — open Score to add entries');
    }
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit Criterion' : 'Add Criterion'}>
      <div className="p-5 flex flex-col gap-4">

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crit-name">Name</Label>
          <Input
            id="crit-name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Quizzes, Final Exam, Labs"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="crit-weight">Weight %</Label>
            {!editing && remainingWeight > 0 && remainingWeight < 100 && (
              <button
                className="text-[11px] text-(--c-accent) hover:underline cursor-pointer"
                onClick={() => setWeight(String(remainingWeight))}
              >
                Use remaining {remainingWeight}%
              </button>
            )}
          </div>
          <Input
            id="crit-weight"
            type="number"
            min={1}
            max={100}
            value={weight}
            onChange={e => setWeight(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`e.g. ${remainingWeight > 0 ? remainingWeight : 30}`}
            className="font-mono"
          />
          <div className={cn('text-[12px] tabular-nums', weightColor)}>
            {totalWeight === 0 ? (
              <span className="text-(--c-text-4)">
                {100 - otherWeight}% available
              </span>
            ) : totalWeight === 100 ? (
              'Total: 100% ✓'
            ) : totalWeight > 100 ? (
              `Total: ${totalWeight}% — exceeds 100% by ${totalWeight - 100}%`
            ) : (
              `Total: ${totalWeight}% — ${100 - totalWeight}% remaining`
            )}
          </div>
        </div>

        {!editing && (
          <div className="flex items-start gap-2.5 bg-(--c-surface-2) rounded-(--radius-r2) px-3 py-2.5">
            <span className="text-(--c-accent) text-[14px] mt-px shrink-0">ℹ</span>
            <p className="text-[12px] text-(--c-text-3) leading-relaxed">
              You don't need to know the number of entries yet. After saving, open{' '}
              <strong className="text-(--c-text-2)">Score</strong> on this criterion and add entries one by one as they happen.
            </p>
          </div>
        )}

        {editing && (
          <div className="text-[12px] text-(--c-text-3) bg-(--c-surface-2) rounded-(--radius-r2) px-3 py-2.5">
            {editing.instanceCount === 0
              ? 'No entries yet — open Score to add some.'
              : `${editing.instanceCount} ${editing.instanceCount === 1 ? 'entry' : 'entries'} — manage them from the Score view.`}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim() || !weight || parseFloat(weight) <= 0}
          >
            {editing ? 'Save Changes' : 'Add Criterion'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
