import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, TrendingUp, Settings, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSemesters, useActiveSemester } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { cumulativeGPA, courseRunningGrade } from '@/lib/calculations';
import { fmtGPA } from '@/lib/utils';
import type { Course } from '@/db/schema';

interface SidebarProps {
  collapsed?: boolean;
  /** When set, sidebar renders as a mobile drawer and this fires on close */
  onClose?: () => void;
}

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2.5 rounded-(--radius-r2) transition-all text-[14px]',
          isActive
            ? 'bg-(--c-surface-2) text-(--c-text) border border-(--c-line-2)'
            : 'text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text-2)',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function CourseNavItem({
  course,
  collapsed,
  grade,
  onClick,
}: {
  course: Course;
  collapsed?: boolean;
  grade: string;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={`/courses/${course.id}`}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 px-3 py-2 rounded-(--radius-r2) transition-all',
          isActive
            ? 'bg-(--c-surface-2) text-(--c-text) border border-(--c-line-2)'
            : 'text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text-2)',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {!collapsed ? (
        <>
          {course.code && (
            <span className="font-mono text-[11px] text-(--c-text-4) uppercase shrink-0 w-[52px] truncate">
              {course.code}
            </span>
          )}
          <span className="text-[13px] flex-1 truncate">{course.name}</span>
          <span className="text-[12px] font-mono tabular-nums text-(--c-text-3) shrink-0">{grade}</span>
        </>
      ) : (
        <BookOpen size={15} className="shrink-0" />
      )}
    </NavLink>
  );
}

export function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const semesters = useSemesters() ?? [];
  const activeSemester = useActiveSemester();
  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  const cumGPA = cumulativeGPA(semesters, courses, criteria, entries);
  const activeCourses = courses.filter(c => c.semesterId === activeSemester?.id);

  const isDrawer = !!onClose;

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-(--c-bg-2) border-r border-(--c-line) shrink-0 transition-all duration-200',
        isDrawer ? 'w-72' : collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className={cn('px-4 py-4 border-b border-(--c-line) shrink-0', collapsed && !isDrawer && 'px-2')}>
        <div className={cn('flex items-center gap-3', collapsed && !isDrawer && 'justify-center')}>
          <CloudMark />
          {(!collapsed || isDrawer) && (
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-(--c-text)">Cumulus</div>
              <div className="text-[10px] font-mono text-(--c-text-4)">v1.0 · local</div>
            </div>
          )}
          {isDrawer && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text) transition-all cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-4">
        {/* Workspace */}
        <section>
          {(!collapsed || isDrawer) && (
            <div className="px-3 mb-1">
              <span className="text-[10px] uppercase tracking-[0.1em] text-(--c-text-4)">Workspace</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed && !isDrawer} end onClick={onClose} />
            <NavItem to="/semesters" icon={BookOpen} label="Semesters" collapsed={collapsed && !isDrawer} onClick={onClose} />
            <NavItem to="/simulator" icon={TrendingUp} label="GPA Simulator" collapsed={collapsed && !isDrawer} onClick={onClose} />
          </div>
        </section>

        {/* Active Semester courses */}
        {activeSemester && activeCourses.length > 0 && (
          <section>
            {(!collapsed || isDrawer) && (
              <div className="px-3 mb-1">
                <span className="text-[10px] uppercase tracking-[0.1em] text-(--c-text-4) truncate block">
                  {activeSemester.name}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {activeCourses.map(course => {
                const courseCriteria = criteria.filter(cr => cr.courseId === course.id);
                const courseEntries = entries.filter(e => courseCriteria.some(cr => cr.id === e.criterionId));
                const { pct } = courseRunningGrade(course, courseCriteria, courseEntries);
                return (
                  <CourseNavItem
                    key={course.id}
                    course={course}
                    collapsed={collapsed && !isDrawer}
                    grade={pct !== null ? `${pct.toFixed(1)}%` : '—'}
                    onClick={onClose}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* System */}
        <section>
          {(!collapsed || isDrawer) && (
            <div className="px-3 mb-1">
              <span className="text-[10px] uppercase tracking-[0.1em] text-(--c-text-4)">System</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed && !isDrawer} onClick={onClose} />
            <NavItem to="/import" icon={Upload} label="Import Template" collapsed={collapsed && !isDrawer} onClick={onClose} />
          </div>
        </section>
      </nav>

      {/* Cumulative GPA */}
      <div className={cn('px-4 py-4 border-t border-(--c-line) shrink-0', collapsed && !isDrawer && 'px-2 py-3')}>
        {collapsed && !isDrawer ? (
          <div className="text-center font-mono text-[11px] text-(--c-text-3) tabular-nums">
            {fmtGPA(cumGPA.gpa)}
          </div>
        ) : (
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-(--c-text-4) mb-0.5">Cumulative GPA</div>
            <div
              className="tabular-nums font-semibold text-(--c-text)"
              style={{ fontSize: '28px', letterSpacing: '-0.028em' }}
            >
              {fmtGPA(cumGPA.gpa)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function CloudMark() {
  return (
    <div
      className="w-8 h-8 rounded-(--radius-r1) shrink-0 flex items-center justify-center"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-line-2)' }}
    >
      <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
        <path
          d="M15.5 6C15.5 3.51 13.49 1.5 11 1.5C9.26 1.5 7.76 2.49 7.01 3.93C6.68 3.77 6.31 3.68 5.92 3.68C4.52 3.68 3.38 4.82 3.38 6.22C3.38 6.26 3.38 6.3 3.39 6.34C2.29 6.64 1.5 7.65 1.5 8.85C1.5 10.32 2.7 11.5 4.18 11.5H15.82C17.57 11.5 19 10.08 19 8.32C19 6.86 17.98 5.64 16.61 5.25C16.24 5.58 15.88 5.8 15.5 6Z"
          fill="white"
          fillOpacity="0.9"
        />
      </svg>
    </div>
  );
}
