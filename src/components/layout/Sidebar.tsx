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
  IconHome, IconCalendar, IconBarChart, IconSliders,
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
        <div
          className={cn('c-nav-item', isActive && 'on', collapsed && 'justify-center px-3')}
        >
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
          'flex items-center gap-2 px-3.5 py-2 rounded-[12px] transition-all cursor-pointer text-[13px]',
          isActive
            ? 'bg-(--c-accent-bg) text-(--c-accent) font-semibold'
            : 'text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text-2)',
          collapsed && 'justify-center px-2'
        )}>
          {!collapsed ? (
            <>
              <span className="flex-1 truncate font-medium">{cleanCourseName(course.name)}</span>
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
      'c-side flex flex-col h-full shrink-0 transition-all duration-200',
      isDrawer ? 'w-72' : collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Brand */}
      <div className={cn(
        'px-4 py-5 border-b border-(--c-line) shrink-0',
        collapsed && !isDrawer && 'px-2 py-4'
      )}>
        {collapsed && !isDrawer ? (
          <div className="flex justify-center">
            <BrandMark />
          </div>
        ) : (
          <div className="c-brand">
            <BrandMark />
            <div className="flex-1 min-w-0">
              <div className="c-brand-name" style={{ font: '800 18px var(--f-ui)', letterSpacing: '-0.02em', color: 'var(--c-text)' }}>
                Cumulus
              </div>
              <div style={{ font: '600 10px var(--f-ui)', color: 'var(--c-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
                v1.0 · cloud
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
        {/* Workspace */}
        <section>
          {(!collapsed || isDrawer) && (
            <div className="c-nav-section">Workspace</div>
          )}
          <div className="c-nav">
            <NavItem to="/" icon={IconHome} label="Dashboard" collapsed={collapsed && !isDrawer} end onClick={onClose} />
            <NavItem to="/semesters" icon={IconCalendar} label="Semesters" collapsed={collapsed && !isDrawer} onClick={onClose} />
            <NavItem to="/simulator" icon={IconBarChart} label="GPA Simulator" collapsed={collapsed && !isDrawer} onClick={onClose} />
          </div>
        </section>

        {/* Active semester courses */}
        {activeSemester && activeCourses.length > 0 && (
          <section>
            {(!collapsed || isDrawer) && (
              <div className="c-nav-section truncate">{activeSemester.name}</div>
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
            <div className="c-nav-section">System</div>
          )}
          <div className="c-nav">
            <NavItem to="/settings" icon={IconSliders} label="Settings" collapsed={collapsed && !isDrawer} onClick={onClose} />
          </div>
        </section>
      </nav>

      {/* GPA footer */}
      <div className={cn(
        'px-5 py-4 border-t border-(--c-line) shrink-0',
        collapsed && !isDrawer && 'px-2 py-3 flex justify-center'
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
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--c-text-4)',
                fontWeight: 700,
                marginBottom: 4,
                fontFamily: 'var(--f-ui)',
              }}
            >
              Cumulative GPA
            </div>
            <div
              className="c-bignum"
              style={{ fontSize: 38, color: 'var(--c-text)' }}
            >
              {fmtGPA(cumGPA.gpa)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'linear-gradient(160deg, var(--c-accent) 0%, var(--c-accent-2) 100%)',
        boxShadow: '0 6px 16px -6px rgba(139, 30, 45, 0.5)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Gold cloud accent */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 17,
          width: 16,
          height: 10,
          borderRadius: 999,
          background: 'var(--c-gold)',
          boxShadow: '9px -4px 0 -2px rgba(244, 238, 230, 0.8)',
        }}
      />
    </div>
  );
}
