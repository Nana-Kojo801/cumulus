import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

import { Chip } from '@/components/ui/Chip';
import { Label } from '@/components/ui/Label';
import type { CourseTemplate } from '@/lib/templateCodec';
import { useSemesters } from '@/hooks/useSemesters';
import { db } from '@/db/schema';
import { useToast } from '@/components/ui/Toast';

interface TemplateImportModalProps {
  open: boolean;
  onClose: () => void;
  template: CourseTemplate;
  defaultSemesterId?: string;
  onImported?: (courseId: string) => void;
}

export function TemplateImportModal({ open, onClose, template, defaultSemesterId, onImported }: TemplateImportModalProps) {
  const { toast } = useToast();
  const semesters = useSemesters() ?? [];
  const sorted = [...semesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.term - b.term;
  });
  const [semesterId, setSemesterId] = useState(defaultSemesterId ?? semesters.find(s => s.status === 'active')?.id ?? '');

  const weightSum = template.criteria.reduce((a, c) => a + c.weight, 0);
  const selectedSem = semesters.find(s => s.id === semesterId);

  async function handleImport() {
    if (!semesterId) return;
    const courseId = uuidv4();
    await db.transaction('rw', db.courses, db.criteria, db.scoreEntries, async () => {
      await db.courses.add({
        id: courseId,
        semesterId,
        code: template.code,
        name: template.name,
        credits: template.credits,
        createdAt: Date.now(),
      });
      for (const c of template.criteria) {
        const critId = uuidv4();
        await db.criteria.add({
          id: critId,
          courseId,
          name: c.name,
          weight: c.weight,
          instanceCount: c.instanceCount,
          createdAt: Date.now(),
        });
        for (let i = 1; i <= c.instanceCount; i++) {
          await db.scoreEntries.add({
            id: uuidv4(),
            criterionId: critId,
            label: `${c.name} ${i}`,
            score: null,
            total: 100,
            createdAt: Date.now() + i,
          });
        }
      }
    });
    toast('Template imported successfully');
    onImported?.(courseId);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Import Course Template">
      <div className="p-5 flex flex-col gap-4">
        {/* Preview */}
        <div className="bg-(--c-surface-2) rounded-(--radius-r3) p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-(--c-text)">{template.name}</span>
            <Chip>{template.credits} credits</Chip>
          </div>
          <div className="flex flex-col gap-1.5">
            {template.criteria.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="text-(--c-text-2)">{c.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-(--c-text-3) font-mono">{c.instanceCount}×</span>
                  <Chip variant="default">{c.weight}%</Chip>
                </div>
              </div>
            ))}
          </div>
          {weightSum !== 100 && (
            <div className="flex items-center gap-2 text-[12px] text-(--c-grade-c)">
              <AlertTriangle size={13} />
              Criteria weights sum to {weightSum}% (should be 100%)
            </div>
          )}
        </div>

        {/* Semester selector */}
        <div className="flex flex-col gap-2">
          <Label>Add to semester</Label>
          <div className="flex flex-col gap-1.5">
            {sorted.map(sem => (
              <button
                key={sem.id}
                onClick={() => setSemesterId(sem.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-(--radius-r3) border text-left transition-all cursor-pointer ${
                  semesterId === sem.id
                    ? 'bg-(--c-accent-bg) border-(--c-accent)/30 text-(--c-text)'
                    : 'bg-(--c-surface) border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-2)'
                }`}
              >
                <span className="flex-1 text-[14px]">{sem.name}</span>
                {sem.status === 'active' && <Chip variant="accent" className="text-[11px]">Active</Chip>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleImport} disabled={!semesterId}>
            Add to {selectedSem ? selectedSem.name : 'Semester'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
