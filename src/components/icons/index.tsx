import type { ReactNode, SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

function Icon({ size = 24, strokeWidth = 2, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── Navigation ─────────────────────────────────────────────────────────── */

/** Dashboard — four rounded squares in a 2×2 grid */
export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </Icon>
  );
}

/** Semesters — calendar with date dots */
export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      <circle cx="8.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** GPA Simulator — rising bar chart */
export function IconBarChart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 20h18" />
      <rect x="4" y="13" width="4" height="7" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </Icon>
  );
}

/** Settings — three horizontal sliders */
export function IconSliders(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h2.5M10.5 6H20" />
      <path d="M4 12h7.5M15.5 12H20" />
      <path d="M4 18h4.5M12.5 18H20" />
      <circle cx="7.5" cy="6" r="2" />
      <circle cx="14" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </Icon>
  );
}

/* ── Actions ─────────────────────────────────────────────────────────────── */

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

/** Pencil / Edit */
export function IconEdit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Icon>
  );
}

/** Trash / Delete */
export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </Icon>
  );
}

/** Close / X */
export function IconX(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Icon>
  );
}

/* ── Directional ─────────────────────────────────────────────────────────── */

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

export function IconChevronUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 15l-6-6-6 6" />
    </Icon>
  );
}

/* ── Status ──────────────────────────────────────────────────────────────── */

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 13l4 4L19 7" />
    </Icon>
  );
}

/** Alert / Warning triangle */
export function IconWarning(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3L2 21h20L12 3z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17.5" x2="12" y2="17.51" strokeWidth={3} strokeLinecap="round" />
    </Icon>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  );
}

/** Spinner / Loader — use className="animate-spin" */
export function IconLoader(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
      <path d="M12 3a9 9 0 019 9" />
    </Icon>
  );
}

/* ── Course / Grade ──────────────────────────────────────────────────────── */

/** Target / bullseye — "what score do I need?" */
export function IconTarget(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** Graduation cap — courses */
export function IconCourse(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 9l10-5 10 5-10 5L2 9z" />
      <path d="M6 11.5v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      <path d="M22 9v5" />
    </Icon>
  );
}

/* ── Data / Transfer ─────────────────────────────────────────────────────── */

/** Export / Share — arrow up from tray */
export function IconShare(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 14v5a1 1 0 001 1h14a1 1 0 001-1v-5" />
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
    </Icon>
  );
}

/** Upload — tray with arrow up */
export function IconUpload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
    </Icon>
  );
}

/** Download — tray with arrow down */
export function IconDownload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M12 3v12" />
      <path d="M16 11l-4 4-4-4" />
    </Icon>
  );
}

/** Copy — two overlapping pages */
export function IconCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </Icon>
  );
}

/** Reset / rotate-back */
export function IconReset(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7v6h6" />
      <path d="M21 17A9 9 0 006.07 6.07L3 13" />
    </Icon>
  );
}

export function IconRotateCcw(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7v6h6" />
      <path d="M21 17A9 9 0 006.07 6.07L3 13" />
    </Icon>
  );
}

/** Sync / Refresh — circular arrows */
export function IconSync(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10" />
      <path d="M3.51 15l4.64 4.36A9 9 0 0023 14" />
    </Icon>
  );
}

export function IconRefreshCw(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10" />
      <path d="M3.51 15l4.64 4.36A9 9 0 0023 14" />
    </Icon>
  );
}

/* ── Canvas / Integration ────────────────────────────────────────────────── */

/** Chain link — connected */
export function IconLink(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </Icon>
  );
}

/** Broken chain — disconnected */
export function IconUnlink(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" />
      <line x1="17.5" y1="17.5" x2="19.5" y2="19.5" />
    </Icon>
  );
}

/** External link — arrow out of box corner */
export function IconExternalLink(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </Icon>
  );
}

/* ── Template ────────────────────────────────────────────────────────────── */

/** QR Code — three corner squares + data dots */
export function IconQR(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="5" y="5" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="16" y="5" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="5" y="16" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="18.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** File JSON — document with braces marker */
export function IconFileJson(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
      <path d="M9.5 13l-1 2 1 2" />
      <path d="M14.5 13l1 2-1 2" />
      <path d="M12 13v4" />
    </Icon>
  );
}

/* ── Misc ────────────────────────────────────────────────────────────────── */

/** Three vertical dots */
export function IconMoreVertical(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** Magnifying glass */
export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Icon>
  );
}

/** Info circle — circle with i */
export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v1" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M12 11v5" />
    </Icon>
  );
}

export function IconAlertCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </Icon>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </Icon>
  );
}

export function IconLogOut(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
  );
}
