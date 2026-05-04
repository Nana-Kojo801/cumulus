// Cumulus — screens (Home, Semesters, Semester Detail, Course Detail, Forms, Score Entry,
// What Score Do I Need, GPA Simulator, Template Export/Import, Settings)
// All screens are click-through; data is fixed (per spec).

const { useState, useMemo, useEffect } = React;

// ─── Sidebar ─────────────────────────────────────────────────────
const Sidebar = ({ route, go, semesters, courses }) => {
  const active = semesters.find(s => s.status === "active");
  return (
    <aside className="c-side">
      <div className="c-brand">
        <div className="mark"/>
        <div>
          <div className="name">Cumulus</div>
          <div className="sub">v0.4 · local</div>
        </div>
      </div>

      <div className="c-nav">
        <div className="c-nav-section">Workspace</div>
        <div className={`c-nav-item ${route.name === "home" ? "on":""}`} onClick={() => go({ name: "home" })}>
          <I.Home className="c-ico"/> Dashboard
        </div>
        <div className={`c-nav-item ${route.name === "semesters" ? "on":""}`} onClick={() => go({ name: "semesters" })}>
          <I.Layers className="c-ico"/> Semesters
          <span className="count">{semesters.length}</span>
        </div>
        <div className={`c-nav-item ${route.name === "simulator" ? "on":""}`} onClick={() => go({ name: "simulator" })}>
          <I.Target className="c-ico"/> GPA Simulator
        </div>

        <div className="c-nav-section" style={{ marginTop: 14 }}>Active · {active?.name.replace("· ", "")}</div>
        {courses.filter(c => c.semesterId === active?.id).map(c => {
          const { pct } = courseRunningGrade(c);
          return (
            <div key={c.id}
                 className={`c-nav-item ${route.name === "course" && route.id === c.id ? "on":""}`}
                 onClick={() => go({ name: "course", id: c.id })}>
              <span className="mono" style={{ fontSize: 10, color: "var(--c-text-4)", width: 44 }}>{c.code}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span className="count tnum">{pct == null ? "—" : pct.toFixed(0)}</span>
            </div>
          );
        })}

        <div className="c-nav-section" style={{ marginTop: 14 }}>System</div>
        <div className={`c-nav-item ${route.name === "settings" ? "on":""}`} onClick={() => go({ name: "settings" })}>
          <I.Cog className="c-ico"/> Settings
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--c-line)", color: "var(--c-text-4)", fontSize: 11, lineHeight: 1.5 }}>
        <div className="mono" style={{ textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Cumulative</div>
        <div className="c-bignum" style={{ fontSize: 28, color: "var(--c-text)" }}>{fmtGPA(cumulativeGPA(semesters, courses).gpa)}</div>
      </div>
    </aside>
  );
};

// ─── Topbar with breadcrumbs ────────────────────────────────────
const Topbar = ({ crumbs, right }) => (
  <div className="c-topbar">
    <div className="crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <I.Right className="c-ico sm" style={{ opacity: 0.4 }}/>}
          <span className={i === crumbs.length - 1 ? "now" : ""}
                onClick={c.go} style={{ cursor: c.go ? "pointer" : "default" }}>{c.label}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="right">{right}</div>
  </div>
);

// ─── Home / Dashboard ───────────────────────────────────────────
const HomeScreen = ({ go, semesters, courses }) => {
  const cum = cumulativeGPA(semesters, courses);
  const active = semesters.find(s => s.status === "active");
  const sem = active ? semesterGPA(active, courses) : { gpa: null, credits: 0 };
  const activeCourses = courses.filter(c => c.semesterId === active?.id);

  // semester GPA history for sparkline
  const history = semesters.map(s => semesterGPA(s, courses).gpa).filter(g => g != null);

  // total completed credits
  const completedCredits = semesters.filter(s => s.status === "complete").reduce((s, sem) => {
    return s + courses.filter(c => c.semesterId === sem.id).reduce((a, c) => a + c.credits, 0);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* hero strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}>
        <div className="c-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
          <div className="c-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }}/>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "150px 1fr", gap: 22, alignItems: "center" }}>
            <GPARing gpa={cum.gpa} label="Cumulative" size={150}/>
            <div style={{ minWidth: 0 }}>
              <div className="c-label" style={{ marginBottom: 8 }}>Year 2 · Spring · Wk 9</div>
              <div className="serif" style={{ fontSize: 24, lineHeight: 1.15, marginBottom: 14 }}>
                On track for honors. <span style={{ color: "var(--c-text-3)" }}>Two midterms to go.</span>
              </div>
              <div style={{ display: "flex", gap: 22 }}>
                <div>
                  <div className="c-label">Credits</div>
                  <div className="c-bignum tnum" style={{ fontSize: 24 }}>{completedCredits}<span style={{ fontSize: 12, color: "var(--c-text-3)", marginLeft: 4 }}>/128</span></div>
                </div>
                <div>
                  <div className="c-label">Semesters</div>
                  <div className="c-bignum tnum" style={{ fontSize: 24 }}>{semesters.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="c-card" style={{ padding: 18 }}>
          <div className="c-label" style={{ marginBottom: 10 }}>This semester</div>
          <div className="c-bignum" style={{ fontSize: 56, marginBottom: 4 }}>{fmtGPA(sem.gpa)}</div>
          <div style={{ fontSize: 13, color: "var(--c-text-3)", marginBottom: 18 }}>
            <span className="mono" style={{ color: "var(--c-grade-a)" }}>+0.08</span> vs last semester
          </div>
          <Sparkline values={history} w={220} h={36}/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--c-text-4)" }} className="mono">
            <span>Y1·1</span><span>Y1·2</span><span>Y2·1</span><span>Y2·2</span>
          </div>
        </div>

        <div className="c-card" style={{ padding: 18 }}>
          <div className="c-label" style={{ marginBottom: 10 }}>Outstanding</div>
          {(() => {
            const pending = activeCourses.flatMap(c =>
              c.criteria.flatMap(cr => cr.entries.filter(e => e.score == null).map(e => ({ course: c, crit: cr, entry: e })))
            );
            const groups = {};
            pending.forEach(p => {
              groups[p.course.id] = groups[p.course.id] || { course: p.course, count: 0 };
              groups[p.course.id].count += 1;
            });
            const top = Object.values(groups).sort((a,b) => b.count - a.count).slice(0, 4);
            return (
              <div className="c-stack" style={{ gap: 10 }}>
                <div className="c-bignum" style={{ fontSize: 56, lineHeight: 1, marginBottom: 4 }}>{pending.length}</div>
                <div style={{ fontSize: 12, color: "var(--c-text-3)", marginBottom: 8 }}>pending assessments across {Object.keys(groups).length} courses</div>
                {top.map(g => (
                  <div key={g.course.id} className="c-row-h" style={{ justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--c-text-2)" }}>{g.course.code}</span>
                    <span className="mono" style={{ color: "var(--c-text-3)" }}>{g.count}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Active semester courses */}
      <div>
        <div className="c-section-head">
          <h2>Active courses</h2>
          <span className="sub">{active?.name}</span>
          <button className="c-btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => go({ name: "semester", id: active.id })}>
            Open semester <I.Right className="c-ico sm"/>
          </button>
        </div>

        <div className="c-card" style={{ padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1.6fr 0.6fr 1fr 0.7fr 0.6fr 32px", gap: 0, padding: "10px 18px", fontSize: 11, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--c-line)" }} className="mono">
            <div>Code</div><div>Course</div><div style={{ textAlign: "right" }}>Credits</div><div>Progress</div><div style={{ textAlign: "right" }}>Grade</div><div style={{ textAlign: "right" }}>Letter</div><div/>
          </div>
          {activeCourses.map(c => {
            const { pct, weightCompleted } = courseRunningGrade(c);
            const letter = letterFor(pct);
            return (
              <div key={c.id} className="c-listrow" style={{ display: "grid", gridTemplateColumns: "60px 1.6fr 0.6fr 1fr 0.7fr 0.6fr 32px", padding: "16px 18px" }}
                   onClick={() => go({ name: "course", id: c.id })}>
                <div className="mono" style={{ color: "var(--c-text-3)", fontSize: 11 }}>{c.code}</div>
                <div>
                  <div style={{ fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--c-text-4)", marginTop: 2 }}>{c.criteria.length} criteria</div>
                </div>
                <div className="mono tnum" style={{ textAlign: "right", color: "var(--c-text-2)" }}>{c.credits}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MiniBar pct={weightCompleted} w={90}/>
                  <span className="mono" style={{ fontSize: 11, color: "var(--c-text-3)" }}>{Math.round(weightCompleted)}%</span>
                </div>
                <div className="c-bignum tnum" style={{ textAlign: "right", fontSize: 22 }}>{pct == null ? "—" : pct.toFixed(1)}</div>
                <div style={{ textAlign: "right" }}><GradePill letter={letter}/></div>
                <I.Right className="c-ico" style={{ color: "var(--c-text-4)" }}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="c-card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}
             onClick={() => go({ name: "simulator" })}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--c-accent-bg)", display: "grid", placeItems: "center", color: "var(--c-accent)" }}>
            <I.Target className="c-ico lg"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>Simulate a target GPA</div>
            <div style={{ fontSize: 12, color: "var(--c-text-3)" }}>Set a goal — see what you need in each open course.</div>
          </div>
          <I.ArrowRight className="c-ico" style={{ color: "var(--c-text-3)" }}/>
        </div>
      </div>
    </div>
  );
};

// ─── Semesters list (accordion) ─────────────────────────────────
const SemestersScreen = ({ go, semesters, courses, openModal }) => {
  const cum = cumulativeGPA(semesters, courses);
  const active = semesters.find(s => s.status === "active");
  const [openIds, setOpenIds] = useState(active ? new Set([active.id]) : new Set());
  const toggle = (id) => {
    const next = new Set(openIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setOpenIds(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* hero strip */}
      <div className="hero-card" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 28, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Cumulative GPA</div>
          <div className="c-bignum" style={{ fontSize: 88, color: "white" }}>{fmtGPA(cum.gpa)}</div>
        </div>
        <HeroStat label="Credits earned" value={cum.credits}/>
        <HeroStat label="Semesters" value={semesters.length}/>
        <HeroStat label="Courses" value={courses.length}/>
      </div>

      <div>
        <div className="c-section-head">
          <h2>Semesters</h2>
          <span className="sub">{semesters.length} total · tap to expand</span>
          <button className="c-btn primary sm" style={{ marginLeft: "auto" }}>
            <I.Plus className="c-ico sm"/> New semester
          </button>
        </div>

        <div className="c-acc">
          {semesters.map((s) => {
            const sg = semesterGPA(s, courses);
            const list = courses.filter(c => c.semesterId === s.id);
            const credits = list.reduce((a, c) => a + c.credits, 0);
            const isOpen = openIds.has(s.id);
            return (
              <React.Fragment key={s.id}>
                <div className={`c-acc-row ${isOpen ? "open" : ""}`} onClick={() => toggle(s.id)}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>{s.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--c-text-3)", marginTop: 4, fontWeight: 600 }}>
                      {list.length} courses · {credits} credits
                    </div>
                  </div>
                  {s.status === "active" && <span className="c-chip accent dot">Active</span>}
                  {s.status === "complete" && <span className="c-chip">Complete</span>}
                  <div style={{ textAlign: "right" }}>
                    <div className="c-label" style={{ fontSize: 10 }}>GPA</div>
                    <div className="c-bignum tnum" style={{ fontSize: 26 }}>{fmtGPA(sg.gpa)}</div>
                  </div>
                  <button className="c-btn icon ghost" onClick={(e) => e.stopPropagation()}>
                    <I.More className="c-ico"/>
                  </button>
                  <I.Right className="c-ico chev"/>
                </div>

                <div className={`c-acc-panel ${isOpen ? "open" : ""}`}>
                  <div className="inner">
                    <div className="c-acc-courses">
                      {list.length === 0 && (
                        <div style={{ padding: "10px 18px", color: "var(--c-text-3)", fontSize: 13 }}>
                          No courses in this semester yet.
                        </div>
                      )}
                      {list.map(c => {
                        const { pct } = courseRunningGrade(c);
                        const letter = letterFor(pct);
                        return (
                          <div key={c.id} className="c-acc-course" onClick={() => go({ name: "course", id: c.id })}>
                            <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--c-text-3)" }}>{c.code}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em" }}>{c.name}</div>
                              <div style={{ fontSize: 11.5, color: "var(--c-text-4)", marginTop: 2, fontWeight: 600 }}>
                                {c.credits} credit{c.credits === 1 ? "" : "s"}
                              </div>
                            </div>
                            <span className="mono tnum" style={{ fontSize: 13, color: "var(--c-text-3)", fontWeight: 700 }}>
                              {pct == null ? "—" : `${pct.toFixed(1)}%`}
                            </span>
                            <span className="c-grade-pill" data-band={letter[0] === "—" ? "-" : letter[0]}>{letter}</span>
                            <I.Right className="c-ico" style={{ color: "var(--c-text-4)" }}/>
                          </div>
                        );
                      })}
                      <button className="c-btn ghost sm" style={{ alignSelf: "flex-start", marginTop: 6 }}
                              onClick={(e) => { e.stopPropagation(); openModal && openModal({ kind: "course-edit", semesterId: s.id }); }}>
                        <I.Plus className="c-ico sm"/> Add course
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const HeroStat = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
    <div className="c-bignum tnum" style={{ fontSize: 36, color: "white" }}>{value}</div>
  </div>
);

// ─── Semester Detail ────────────────────────────────────────────
const SemesterScreen = ({ go, semesterId, semesters, courses, openModal }) => {
  const semester = semesters.find(s => s.id === semesterId);
  const list = courses.filter(c => c.semesterId === semesterId);
  const sg = semesterGPA(semester, courses);
  const credits = list.reduce((a, c) => a + c.credits, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 16 }}>
        <div className="c-card" style={{ padding: 22 }}>
          <div className="c-label" style={{ marginBottom: 8 }}>Semester GPA</div>
          <div className="c-bignum" style={{ fontSize: 72, lineHeight: 0.9 }}>{fmtGPA(sg.gpa)}</div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--c-text-3)" }}>
            Computed from {list.filter(c => courseRunningGrade(c).pct != null).length} of {list.length} courses with at least one entry.
          </div>
        </div>
        <div className="c-card" style={{ padding: 22 }}>
          <div className="c-label" style={{ marginBottom: 8 }}>Credits</div>
          <div className="c-bignum tnum" style={{ fontSize: 48 }}>{credits}</div>
          <div style={{ display: "flex", marginTop: 14, height: 8, borderRadius: 999, overflow: "hidden", background: "var(--c-line)" }}>
            {list.map((c, i) => {
              const colors = ["oklch(0.82 0.09 230)","oklch(0.78 0.07 200)","oklch(0.74 0.06 175)","oklch(0.7 0.07 250)","oklch(0.66 0.07 215)"];
              return <div key={c.id} title={`${c.code} — ${c.credits}cr`} style={{ flex: c.credits, background: colors[i % colors.length], opacity: 0.85 }}/>;
            })}
          </div>
        </div>
        <div className="c-card" style={{ padding: 22 }}>
          <div className="c-label" style={{ marginBottom: 8 }}>Status</div>
          <div className="serif" style={{ fontSize: 28 }}>{semester.status === "active" ? "In progress" : "Complete"}</div>
          {semester.status === "active" &&
            <div style={{ marginTop: 12 }}>
              <div className="c-progress"><i style={{ width: "62%" }}/></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--c-text-4)" }} className="mono">
                <span>WEEK 9 / 14</span><span>62%</span>
              </div>
            </div>
          }
        </div>
      </div>

      <div>
        <div className="c-section-head">
          <h2>Courses</h2>
          <span className="sub">{list.length}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="c-btn primary sm" onClick={() => openModal && openModal({ kind: "course-edit", semesterId })}>
              <I.Plus className="c-ico sm"/> Add course
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {list.map(c => {
            const { pct, weightCompleted } = courseRunningGrade(c);
            return (
              <div key={c.id} className="c-card" style={{ padding: 18, cursor: "pointer" }}
                   onClick={() => go({ name: "course", id: c.id })}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--c-text-4)", letterSpacing: "0.06em" }}>{c.code}</span>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{c.name}</span>
                  <span className="c-chip" style={{ marginLeft: "auto" }}>{c.credits} cr</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div className="c-label" style={{ marginBottom: 4 }}>Current</div>
                    <div className="c-bignum tnum" style={{ fontSize: 38 }}>{pct == null ? "—" : pct.toFixed(1)}</div>
                  </div>
                  <GradePill letter={letterFor(pct)} size="lg"/>
                </div>
                <WeightBar criteria={c.criteria}/>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--c-text-4)" }} className="mono">
                  <span>{c.criteria.length} criteria</span>
                  <span>{Math.round(weightCompleted)}% graded</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Course Detail ──────────────────────────────────────────────
const CourseScreen = ({ go, courseId, courses, semesters, openModal }) => {
  const course = courses.find(c => c.id === courseId);
  const semester = semesters.find(s => s.id === course.semesterId);
  const { pct } = courseRunningGrade(course);
  const projected = courseProjectedGrade(course, pct);
  const totalWeight = course.criteria.reduce((s, c) => s + c.weight, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div className="c-card" style={{ padding: 24, position: "relative" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span className="c-tag">{course.code}</span>
            <span className="c-chip">{course.credits} credits</span>
            <span className="c-chip">{semester.name}</span>
          </div>
          <div className="serif" style={{ fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 18 }}>{course.name}</div>

          <div style={{ display: "grid", gridTemplateColumns: "auto auto auto auto", gap: 32, alignItems: "flex-end" }}>
            <div>
              <div className="c-label" style={{ marginBottom: 6 }}>Current</div>
              <div className="c-bignum tnum" style={{ fontSize: 56 }}>{pct == null ? "—" : pct.toFixed(1)}</div>
            </div>
            <div>
              <div className="c-label" style={{ marginBottom: 6 }}>Letter</div>
              <GradePill letter={letterFor(pct)} size="lg"/>
            </div>
            <div>
              <div className="c-label" style={{ marginBottom: 6 }}>Grade points</div>
              <div className="c-bignum tnum" style={{ fontSize: 26 }}>{(pointsFor(pct) ?? 0).toFixed(1)}</div>
            </div>
            <div>
              <div className="c-label" style={{ marginBottom: 6 }}>Projected</div>
              <div className="c-bignum tnum" style={{ fontSize: 26, color: "var(--c-text-2)" }}>{projected.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="c-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <I.Target className="c-ico lg" style={{ color: "var(--c-accent)" }}/>
            <span style={{ fontWeight: 500 }}>What score do I need?</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--c-text-3)", lineHeight: 1.5 }}>
            Set a target grade and Cumulus computes the average you need across remaining work.
          </div>
          <button className="c-btn primary" onClick={() => openModal({ kind: "needed", courseId })}>
            Run forecast <I.ArrowRight className="c-ico sm"/>
          </button>
          <div className="c-hr"/>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="c-btn ghost sm" onClick={() => openModal({ kind: "export", courseId })}>
              <I.Share className="c-ico sm"/> Share template
            </button>
            <button className="c-btn ghost sm" onClick={() => openModal && openModal({ kind: "course-edit", id: courseId })}>
              <I.Edit className="c-ico sm"/> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div>
        <div className="c-section-head">
          <h2>Evaluation criteria</h2>
          <span className="sub">{totalWeight}% allocated</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="c-btn ghost sm" onClick={() => openModal({ kind: "criteria", courseId })}>
              <I.Edit className="c-ico sm"/> Edit criteria
            </button>
          </div>
        </div>

        <div className="c-card" style={{ padding: 0 }}>
          {course.criteria.map((cr, i) => {
            const avg = criterionAverage(cr);
            const { done, total } = criterionCompletion(cr);
            const contrib = avg != null ? (avg * cr.weight / 100) : null;
            return (
              <div key={cr.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--c-line)", padding: "18px 22px", display: "grid", gridTemplateColumns: "auto 1.4fr 1fr 1fr 1fr auto", alignItems: "center", gap: 18, cursor: "pointer" }}
                   onClick={() => openModal({ kind: "score", courseId, criterionId: cr.id })}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--c-surface-2)", display: "grid", placeItems: "center", color: "var(--c-text-3)", fontSize: 12 }} className="mono">{i+1}</div>
                <div>
                  <div style={{ fontWeight: 500 }}>{cr.name}</div>
                  <div style={{ fontSize: 11, color: "var(--c-text-4)", marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                    <Dots done={done} total={total}/>
                    <span>{done} / {total}</span>
                  </div>
                </div>
                <div>
                  <div className="c-label">Weight</div>
                  <div className="c-bignum tnum" style={{ fontSize: 18 }}>{cr.weight}<span style={{ fontSize: 11, color: "var(--c-text-3)" }}>%</span></div>
                </div>
                <div>
                  <div className="c-label">Average</div>
                  <div className="c-bignum tnum" style={{ fontSize: 18 }}>{avg == null ? "—" : avg.toFixed(1)}</div>
                </div>
                <div>
                  <div className="c-label">Contributes</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <MiniBar pct={contrib != null ? (contrib / cr.weight) * 100 : 0} w={70}/>
                    <span className="mono tnum" style={{ fontSize: 12, color: "var(--c-text-3)" }}>
                      {contrib == null ? "—" : `${contrib.toFixed(1)}/${cr.weight}`}
                    </span>
                  </div>
                </div>
                <I.Right className="c-ico" style={{ color: "var(--c-text-4)" }}/>
              </div>
            );
          })}

          <div className="c-hr"/>
          <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, background: "var(--c-bg-2)" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Weight allocation</span>
            <div style={{ flex: 1 }}>
              <WeightBar criteria={course.criteria}/>
            </div>
            <span className="mono tnum" style={{ fontSize: 12, color: totalWeight === 100 ? "var(--c-grade-a)" : "var(--c-grade-d)" }}>
              {totalWeight}% / 100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.HomeScreen = HomeScreen;
window.SemestersScreen = SemestersScreen;
window.SemesterScreen = SemesterScreen;
window.CourseScreen = CourseScreen;
