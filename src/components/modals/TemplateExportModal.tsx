import { useState, useRef, useEffect } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import type { Course, Criterion } from '@/db/schema';
import { buildShareUrl, encodeTemplate, type CourseTemplate } from '@/lib/templateCodec';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface TemplateExportModalProps {
  open: boolean;
  onClose: () => void;
  course: Course;
  criteria: Criterion[];
}

type Tab = 'link' | 'qr' | 'json';

export function TemplateExportModal({ open, onClose, course, criteria }: TemplateExportModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('link');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const template: CourseTemplate = {
    name: course.name,
    code: course.code,
    credits: course.credits,
    criteria: criteria.map(c => ({ name: c.name, weight: c.weight, instanceCount: c.instanceCount })),
  };
  const shareUrl = buildShareUrl(template);
  const jsonStr = JSON.stringify(template, null, 2);

  useEffect(() => {
    if (tab === 'qr' && open) {
      QRCode.toDataURL(shareUrl, { width: 220, margin: 2, color: { dark: '#fffff0', light: '#2b2e3d' } })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [tab, open, shareUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${course.name.replace(/\s+/g, '-')}-template-qr.png`;
    a.click();
  }

  function handleDownloadJSON() {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.name.replace(/\s+/g, '-')}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'link', label: 'Share Link' },
    { id: 'qr', label: 'QR Code' },
    { id: 'json', label: 'JSON File' },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Export Template">
      <div className="flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-(--c-line) px-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'py-3 px-2 text-[13px] font-serif border-b-2 mr-4 transition-all cursor-pointer',
                tab === t.id
                  ? 'border-(--c-accent) text-(--c-text)'
                  : 'border-transparent text-(--c-text-3) hover:text-(--c-text-2)'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {tab === 'link' && (
            <>
              <p className="text-[13px] text-(--c-text-3)">
                Share this link to let others import this course template (no scores included).
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 h-9 px-3 rounded-(--radius-r2) bg-(--c-bg-2) border border-(--c-line) text-(--c-text-3) text-[12px] font-mono outline-none truncate"
                />
                <Button variant="default" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </>
          )}

          {tab === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-[13px] text-(--c-text-3) self-start">
                Scan this QR code to import this course template.
              </p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="rounded-(--radius-r2)" width={220} height={220} />
              ) : (
                <div className="w-55 h-55 bg-(--c-surface-2) rounded-(--radius-r2) flex items-center justify-center text-(--c-text-3) text-[13px]">
                  Generating…
                </div>
              )}
              <Button variant="default" onClick={handleDownloadQR} disabled={!qrDataUrl}>
                <Download size={14} /> Download PNG
              </Button>
            </div>
          )}

          {tab === 'json' && (
            <>
              <p className="text-[13px] text-(--c-text-3)">
                Download a JSON file to share or import this template later.
              </p>
              <pre className="bg-(--c-bg-2) rounded-(--radius-r2) p-3 text-[11px] font-mono text-(--c-text-2) overflow-auto max-h-50 border border-(--c-line)">
                {jsonStr}
              </pre>
              <Button variant="default" onClick={handleDownloadJSON}>
                <Download size={14} /> Download .json
              </Button>
            </>
          )}
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-(--c-line)">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Sheet>
  );
}
