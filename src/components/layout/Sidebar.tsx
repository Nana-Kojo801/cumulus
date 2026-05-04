import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSemesters, useActiveSemester } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { cumulativeGPA, courseRunningGrade } from '@/lib/calculations';
import { fmtGPA, cleanCourseName } from '@/lib/utils';
import type { Course } from '@/db/schema';
import {
  IconHome, IconCalendar, IconBarChart, IconSliders, IconX,
} from '@/components/icons';

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

function NavItem({
  to, icon: Icon, label, collapsed, end, onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className="block">
      {({ isActive }) => (
        <div className={cn(
          'relative flex items-center gap-2.5 px-3 py-2.5 rounded-(--radius-r2) transition-all text-[13px] font-medium cursor-pointer',
          isActive
            ? 'bg-(--c-accent-bg) text-(--c-accent)'
            : 'text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text-2)',
          collapsed && 'justify-center px-2'
        )}>
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-(--c-accent)" />
          )}
          <Icon size={16} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </div>
      )}
    </NavLink>
  );
}

function CourseNavItem({
  course, collapsed, grade, onClick,
}: {
  course: Course;
  collapsed?: boolean;
  grade: string;
  onClick?: () => void;
}) {
  return (
    <NavLink to={`/courses/${course.id}`} onClick={onClick} className="block">
      {({ isActive }) => (
        <div className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-(--radius-r2) transition-all cursor-pointer',
          isActive
            ? 'bg-(--c-accent-bg) text-(--c-accent)'
            : 'text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text-2)',
          collapsed && 'justify-center px-2'
        )}>
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-(--c-accent)" />
          )}
          {!collapsed ? (
            <>
              <span className="text-[13px] flex-1 truncate">{cleanCourseName(course.name)}</span>
              <span className="text-[12px] font-mono tabular-nums text-(--c-text-4) shrink-0">{grade}</span>
            </>
          ) : (
            <div className="w-2 h-2 rounded-full bg-(--c-surface-3)" />
          )}
        </div>
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
    <aside className={cn(
      'flex flex-col h-full bg-(--c-bg-2) border-r border-(--c-line) shrink-0 transition-all duration-200',
      isDrawer ? 'w-72' : collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Brand */}
      <div className={cn('px-4 py-4 border-b border-(--c-line) shrink-0', collapsed && !isDrawer && 'px-2')}>
        <div className={cn('flex items-center gap-3', collapsed && !isDrawer && 'justify-center')}>
          <CumulusMark />
          {(!collapsed || isDrawer) && (
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold tracking-tight text-(--c-text)" style={{ letterSpacing: '-0.02em' }}>
                Cumulus
              </div>
            </div>
          )}
          {isDrawer && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text) transition-all cursor-pointer shrink-0"
            >
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
        {/* Workspace */}
        <section>
          {(!collapsed || isDrawer) && (
            <div className="px-3 mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.12em] text-(--c-text-4) font-semibold">Workspace</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <NavItem to="/" icon={IconHome} label="Dashboard" collapsed={collapsed && !isDrawer} end onClick={onClose} />
            <NavItem to="/semesters" icon={IconCalendar} label="Semesters" collapsed={collapsed && !isDrawer} onClick={onClose} />
            <NavItem to="/simulator" icon={IconBarChart} label="GPA Simulator" collapsed={collapsed && !isDrawer} onClick={onClose} />
          </div>
        </section>

        {/* Active semester courses */}
        {activeSemester && activeCourses.length > 0 && (
          <section>
            {(!collapsed || isDrawer) && (
              <div className="px-3 mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-(--c-text-4) font-semibold truncate block">
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
            <div className="px-3 mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.12em] text-(--c-text-4) font-semibold">System</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <NavItem to="/settings" icon={IconSliders} label="Settings" collapsed={collapsed && !isDrawer} onClick={onClose} />
          </div>
        </section>
      </nav>

      {/* Cumulative GPA footer */}
      <div className={cn(
        'px-4 py-4 border-t border-(--c-line) shrink-0',
        collapsed && !isDrawer && 'px-2 py-3'
      )}>
        {collapsed && !isDrawer ? (
          <div
            className="tabular-nums font-bold text-(--c-accent) text-[12px]"
            style={{ fontFamily: 'var(--f-mono)' }}
          >
            {fmtGPA(cumGPA.gpa)}
          </div>
        ) : (
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-(--c-text-4) font-semibold mb-0.5">Cumulative GPA</div>
            <div
              className="tabular-nums font-bold text-(--c-text)"
              style={{ fontSize: '30px', letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              {fmtGPA(cumGPA.gpa)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function CumulusMark() {
  return (
    <div
      className="w-8 h-8 rounded-(--radius-r2) shrink-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, var(--c-accent-bg) 0%, color-mix(in oklch, var(--c-accent) 20%, transparent) 100%)',
        border: '1px solid color-mix(in oklch, var(--c-accent) 25%, transparent)',
      }}
    >
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
        <path
          d="M14 5C14 2.79 12.21 1 10 1C8.55 1 7.29 1.76 6.56 2.9C6.27 2.76 5.95 2.68 5.61 2.68C4.42 2.68 3.46 3.64 3.46 4.83C3.46 4.87 3.46 4.9 3.47 4.94C2.52 5.21 1.8 6.08 1.8 7.12C1.8 8.38 2.83 9.4 4.09 9.4H13.91C15.39 9.4 16.6 8.19 16.6 6.71C16.6 5.48 15.77 4.44 14.65 4.1C14.43 4.42 14.22 4.72 14 5Z"
          fill="var(--c-accent)"
          fillOpacity="0.9"
        />
      </svg>
    </div>
  );
}
