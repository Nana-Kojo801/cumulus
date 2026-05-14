import { useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour, TOUR_STEPS } from '@/contexts/TourContext';
import { Button } from '@/components/ui/Button';

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PAD = 8;

function getTargetRect(target: string): TargetRect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left - PAD, y: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

function Tooltip({
  rect,
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onEnd,
}: {
  rect: TargetRect | null;
  step: (typeof TOUR_STEPS)[number];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onEnd: () => void;
}) {
  const { w, h } = useWindowSize();
  const isMobile = w <= 640;

  if (isMobile) {
    // Always bottom sheet on mobile
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-[10001]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="rounded-t-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line-2)', borderBottom: 'none' }}
        >
          <TooltipContent step={step} currentStep={currentStep} totalSteps={totalSteps} onNext={onNext} onPrev={onPrev} onEnd={onEnd} />
        </div>
      </div>
    );
  }

  // Desktop: position near target
  const TOOLTIP_W = 320;
  const TOOLTIP_H = 180;

  let top = 0;
  let left = 0;

  if (!rect) {
    // Center screen
    top = h / 2 - TOOLTIP_H / 2;
    left = w / 2 - TOOLTIP_W / 2;
  } else {
    const spaceBelow = h - (rect.y + rect.height);
    const spaceAbove = rect.y;
    const spaceRight = w - (rect.x + rect.width);

    if (spaceBelow >= TOOLTIP_H + 12) {
      top = rect.y + rect.height + 12;
      left = Math.min(rect.x, w - TOOLTIP_W - 16);
    } else if (spaceAbove >= TOOLTIP_H + 12) {
      top = rect.y - TOOLTIP_H - 12;
      left = Math.min(rect.x, w - TOOLTIP_W - 16);
    } else if (spaceRight >= TOOLTIP_W + 12) {
      top = rect.y;
      left = rect.x + rect.width + 12;
    } else {
      top = rect.y;
      left = rect.x - TOOLTIP_W - 12;
    }
    top = Math.max(16, Math.min(top, h - TOOLTIP_H - 16));
    left = Math.max(16, Math.min(left, w - TOOLTIP_W - 16));
  }

  return (
    <div
      className="fixed z-[10001] rounded-2xl p-5 flex flex-col gap-3 shadow-2xl"
      style={{
        top,
        left,
        width: TOOLTIP_W,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-line-2)',
      }}
    >
      <TooltipContent step={step} currentStep={currentStep} totalSteps={totalSteps} onNext={onNext} onPrev={onPrev} onEnd={onEnd} />
    </div>
  );
}

function TooltipContent({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onEnd,
}: {
  step: (typeof TOUR_STEPS)[number];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onEnd: () => void;
}) {
  const isLast = currentStep === totalSteps - 1;
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-(--c-text-4) font-semibold uppercase tracking-[0.07em]">
          {currentStep + 1} / {totalSteps}
        </span>
        <button onClick={onEnd} className="text-[12px] text-(--c-text-4) hover:text-(--c-text-3) transition-colors cursor-pointer">
          End tour
        </button>
      </div>
      <div>
        <div className="text-[16px] font-bold text-(--c-text)" style={{ letterSpacing: '-0.015em' }}>
          {step.title}
        </div>
        <p className="text-[13px] text-(--c-text-3) mt-1.5 leading-relaxed">{step.body}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        {currentStep > 0 && (
          <Button variant="ghost" size="sm" onClick={onPrev}>← Prev</Button>
        )}
        <Button variant="primary" size="sm" className="flex-1" onClick={isLast ? onEnd : onNext}>
          {isLast ? 'Start using Cumulus' : 'Next →'}
        </Button>
      </div>
    </>
  );
}

export function TourSpotlight() {
  const { isActive, currentStep, totalSteps, currentStepData, nextStep, prevStep, endTour } = useTour();
  const [rect, setRect] = useState<TargetRect | null>(null);
  const { w, h } = useWindowSize();

  useLayoutEffect(() => {
    if (!isActive) return;
    setRect(getTargetRect(currentStepData.target));
  }, [isActive, currentStep, currentStepData.target, w, h]);

  if (!isActive) return null;

  const svgId = 'tour-mask';

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={currentStep}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[10000]"
        style={{ pointerEvents: 'none' }}
      >
        {/* SVG overlay with hole */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'all' }}
          onClick={e => {
            // click outside tooltip/spotlight → nothing (allow scrolling target into view)
          }}
        >
          <defs>
            <mask id={svgId}>
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  rx={10}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask={`url(#${svgId})`}
          />
        </svg>

        {/* Tooltip — pointer-events on */}
        <div style={{ pointerEvents: 'all' }}>
          <Tooltip
            rect={rect}
            step={currentStepData}
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
            onEnd={endTour}
          />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
