import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, FileJson } from 'lucide-react';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TemplateImportModal } from '@/components/modals/TemplateImportModal';
import { decodeTemplate, type CourseTemplate } from '@/lib/templateCodec';
import { useToast } from '@/components/ui/Toast';

export function TemplateImport() {
  const onMenuOpen = useMenuOpen();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const encodedTemplate = searchParams.get('template');
  const urlTemplate = encodedTemplate ? decodeTemplate(encodedTemplate) : null;
  const [fileTemplate, setFileTemplate] = useState<CourseTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(!!urlTemplate);

  const template = urlTemplate ?? fileTemplate;

  function handleFile(file: File) {
    file.text().then(text => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed.name || !Array.isArray(parsed.criteria)) {
          toast('Invalid template file format', 'error');
          return;
        }
        setFileTemplate(parsed as CourseTemplate);
        setModalOpen(true);
      } catch {
        toast('Could not parse JSON file', 'error');
      }
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar breadcrumbs={[{ label: 'Import Template' }]} onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col gap-6">

        {urlTemplate ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 flex flex-col gap-4 max-w-2xl">
              <div className="text-[15px] font-medium text-(--c-text)">Template found in URL</div>
              <p className="text-[13px] text-(--c-text-2)">
                A course template for <strong className="text-(--c-text)">{urlTemplate.name}</strong> was found in the URL.
                Preview it before importing.
              </p>
              <div>
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Preview & Import
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card className="p-6 flex flex-col gap-5">
                <div>
                  <div className="text-[15px] font-medium text-(--c-text) mb-1">Import course template</div>
                  <p className="text-[13px] text-(--c-text-3)">
                    Drop a JSON template exported from another course, or paste a share link.
                  </p>
                </div>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-(--radius-r3) p-12 text-center flex flex-col items-center gap-4 transition-all cursor-pointer ${
                    dragging
                      ? 'border-(--c-accent) bg-(--c-accent-bg)'
                      : 'border-(--c-line-2) hover:border-(--c-accent) hover:bg-(--c-surface-2)'
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                >
                  <motion.div
                    animate={{ scale: dragging ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <FileJson size={36} className={dragging ? 'text-(--c-accent)' : 'text-(--c-text-3)'} />
                  </motion.div>
                  <div>
                    <div className="text-[15px] font-medium text-(--c-text-2) mb-1">
                      Drop a JSON file here
                    </div>
                    <div className="text-[13px] text-(--c-text-3)">or click to browse your files</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] rounded-full border border-(--c-line-2) text-(--c-text-2) bg-(--c-surface-2) hover:bg-(--c-surface-3) transition-colors">
                    <Upload size={14} /> Browse files
                  </span>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.08 }}
            >
              <Card className="p-5 flex flex-col gap-2 border-(--c-accent)/20 bg-(--c-accent-bg)/30">
                <div className="text-[13px] font-medium text-(--c-accent)">How to get a template</div>
                <p className="text-[13px] text-(--c-text-3) leading-relaxed">
                  Open any course, tap <strong className="text-(--c-text-2)">Export Template</strong> in the top bar, then share the
                  JSON file or URL with a classmate. They can paste the link or drop the file here.
                </p>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {template && (
        <TemplateImportModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setFileTemplate(null); }}
          template={template}
          onImported={courseId => navigate(`/courses/${courseId}`)}
        />
      )}
    </div>
  );
}
