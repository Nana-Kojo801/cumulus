// Cumulus — remaining screens: Course form, Simulator, Import preview, Settings, Grade scale

const { useState: useS3, useMemo: useM3 } = React;

// ─── Course Add/Edit sheet (slides in from the right) ───────────
const CourseEditModal = ({ courseId, semesterId: initialSemesterId, courses, semesters, onClose }) => {
  const existing = courseId ? courses.find(c => c.id === courseId) : null;
  const [form, setForm] = useS3({
    name: existing?.name || "",
    code: existing?.code || "",
    credits: existing?.credits || 3,
    semesterId: existing?.semesterId || initialSemesterId || semesters[semesters.length-1].id,
  });

  return (
    <div className="c-sheet wide">
      <div className="c-sheet-head">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--c-accent-bg)", display: "grid", placeItems: "center", color: "var(--c-accent)" }}>
          {existing ? <I.Edit className="c-ico"/> : <I.Plus className="c-ico"/>}
        </div>
        <div>
          <h3>{existing ? "Edit course" : "New course"}</h3>
          <div style={{ fontSize: 12.5, color: "var(--c-text-3)", marginTop: 2, fontWeight: 600 }}>
            {existing ? existing.code : "Add a course to a semester"}
          </div>
        </div>
        <button className="c-btn icon ghost" style={{ marginLeft: "auto" }} onClick={onClose}>
          <I.X className="c-ico"/>
        </button>
      </div>

      <div className="c-sheet-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div>
            <div className="c-label" style={{ marginBottom: 8 }}>Course name</div>
            <input className="c-input" value={form.name}
                   onChange={e => setForm({ ...form, name: e.target.value })}
                   placeholder="e.g. Database Systems"/>
          </div>
          <div>
            <div className="c-label" style={{ marginBottom: 8 }}>Course code</div>
            <input className="c-input" value={form.code}
                   onChange={e => setForm({ ...form, code: e.target.value })}
                   placeholder="e.g. CS 311"/>
          </div>
        </div>

        <div className="c-label" style={{ marginBottom: 10 }}>Credit hours</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4,
                      background: "var(--c-surface-2)", borderRadius: 999, width: "fit-content", marginBottom: 22 }}>
          <button className="c-btn icon ghost" style={{ height: 38, width: 38 }}
                  onClick={() => setForm({ ...form, credits: Math.max(1, form.credits - 1) })}>
            <I.Minus className="c-ico"/>
          </button>
          <div className="c-bignum tnum" style={{ fontSize: 24, padding: "0 28px", minWidth: 80, textAlign: "center" }}>
            {form.credits}
          </div>
          <button className="c-btn icon ghost" style={{ height: 38, width: 38 }}
                  onClick={() => setForm({ ...form, credits: Math.min(6, form.credits + 1) })}>
            <I.Plus className="c-ico"/>
          </button>
          <span style={{ fontSize: 12, color: "var(--c-text-4)", padding: "0 14px 0 6px", fontWeight: 600 }}>
            Typical Ashesi range 1–4
          </span>
        </div>

        <div className="c-label" style={{ marginBottom: 10 }}>Semester</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {semesters.map(s => {
            const selected = form.semesterId === s.id;
            return (
              <label key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                borderRadius: 14,
                border: `1.5px solid ${selected ? "var(--c-accent)" : "var(--c-line)"}`,
                background: selected ? "var(--c-accent-bg)" : "transparent",
                cursor: "pointer", fontSize: 14,
                transition: "all 120ms",
              }}>
                <input type="radio" name="sem" checked={selected}
                       onChange={() => setForm({ ...form, semesterId: s.id })}
                       style={{ accentColor: "var(--c-accent)", width: 18, height: 18 }}/>
                <span style={{ color: "var(--c-text)", fontWeight: 700 }}>{s.name}</span>
                {s.status === "active" && <span className="c-chip accent dot" style={{ marginLeft: "auto" }}>Active</span>}
                {s.status === "complete" && <span className="c-chip" style={{ marginLeft: "auto" }}>Complete</span>}
              </label>
            );
          })}
        </div>
      </div>

      <div className="c-sheet-foot">
        <button className="c-btn ghost" onClick={onClose}>Cancel</button>
        <button className="c-btn primary" onClick={onClose}>
          {existing ? "Save changes" : "Create course"}
        </button>
      </div>
    </div>
  );
};

// Backward-compat alias for any leftover route-based usage
const CourseEditScreen = (props) => <CourseEditModal {...props} onClose={() => props.go({ name: "semesters" })}/>;

// ─── GPA Target Simulator ───────────────────────────────────────
const SimulatorScreen = ({ courses, semesters }) => {
  const active = semesters.find(s => s.status === "active");
  const activeCourses = courses.filter(c => c.semesterId === active.id);
  const [target, setTarget] = useS3(3.7);
  const [overrides, setOverrides] = useS3({}); // courseId -> assumed letter

  // for each active course: current pct, projected pct given override
  const rows = activeCourses.map(c => {
    const { pct } = courseRunningGrade(c);
    const letter = letterFor(pct);
    const overrideLetter = overrides[c.id];
    let assumedFinal;
    if (overrideLetter) {
      assumedFinal = (GRADE_SCALE.find(g => g.letter === overrideLetter)?.min ?? 0) + 2;
    } else {
      assumedFinal = pct ?? 0;
    }
    const points = pointsFor(assumedFinal);
    return { course: c, current: pct, currentLetter: letter, assumedFinal, points, overrideLetter };
  });

  // simulated cumulative: completed semesters + simulated active sem
  const completed = semesters.filter(s => s.status !== "active");
  let pts = 0, credits = 0;
  for (const s of completed) {
    const list = courses.filter(c => c.semesterId === s.id);
    for (const co of list) {
      const { pct } = courseRunningGrade(co);
      if (pct == null) continue;
      pts += pointsFor(pct) * co.credits;
      credits += co.credits;
    }
  }
  for (const r of rows) {
    pts += r.points * r.course.credits;
    credits += r.course.credits;
  }
  const simGPA = credits ? pts / credits : null;
  const delta = simGPA != null ? simGPA - cumulativeGPA(semesters, courses).gpa : 0;
  const meets = simGPA != null && simGPA >= target;

  // Required average per course to hit target
  const targetLetter = (() => {
    // map target gpa to closest letter min
    const sorted = [...GRADE_SCALE].sort((a,b) => a.points - b.points);
    let pick = sorted[0];
    for (const g of sorted) if (g.points <= target) pick = g;
    // for target >=3.5 use B+, etc — we'll just use the cutoff at target gpa
    return pick.letter;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero */}
      <div className="c-card" style={{ padding: 26, position: "relative", overflow: "hidden" }}>
        <div className="c-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.3 }}/>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
          <div>
            <div className="c-label" style={{ marginBottom: 10 }}>Target cumulative GPA</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 18 }}>
              <span className="c-bignum tnum" style={{ fontSize: 80, lineHeight: 0.9 }}>{target.toFixed(2)}</span>
              <span className="serif" style={{ fontSize: 24, color: "var(--c-text-3)" }}>/ 4.00</span>
            </div>
            <input type="range" min="2" max="4" step="0.01" value={target}
                   onChange={e => setTarget(Number(e.target.value))}
                   style={{ width: "100%", accentColor: "var(--c-accent)" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--c-text-4)" }} className="mono">
              <span>2.00 · pass</span><span>3.00 · second</span><span>3.50 · honors</span><span>4.00 · max</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
            <div className="c-card" style={{ padding: 16, background: "var(--c-bg-2)", border: meets ? "1px solid oklch(0.82 0.09 155 / 0.35)" : "1px solid var(--c-line)" }}>
              <div className="c-label" style={{ marginBottom: 4 }}>Simulated cumulative</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="c-bignum tnum" style={{ fontSize: 40 }}>{fmtGPA(simGPA)}</span>
                <span className="mono tnum" style={{ color: delta >= 0 ? "var(--c-grade-a)" : "var(--c-grade-e)", fontSize: 13 }}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: meets ? "var(--c-grade-a)" : "var(--c-text-3)", display: "flex", gap: 6, alignItems: "center" }}>
                {meets
                  ? <><I.Check className="c-ico sm"/> On track to hit {target.toFixed(2)}</>
                  : <><I.ArrowUp className="c-ico sm"/> {(target - simGPA).toFixed(2)} above current trajectory</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* per-course simulation */}
      <div>
        <div className="c-section-head">
          <h2>What it takes per course</h2>
          <span className="sub">Active semester · click a letter to override</span>
        </div>

        <div className="c-card" style={{ padding: 0 }}>
          <div style={{ padding: "10px 18px", display: "grid", gridTemplateColumns: "60px 1.4fr 60px 0.8fr 0.7fr 1.6fr", fontSize: 11, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--c-line)" }} className="mono">
            <span>Code</span><span>Course</span><span>Cr</span><span>Current</span><span>Assume</span><span>What if I get…</span>
          </div>
          {rows.map(r => (
            <div key={r.course.id} style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "60px 1.4fr 60px 0.8fr 0.7fr 1.6fr", alignItems: "center", gap: 10, borderTop: "1px solid var(--c-line)" }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--c-text-4)" }}>{r.course.code}</span>
              <span style={{ fontWeight: 500 }}>{r.course.name}</span>
              <span className="mono tnum" style={{ color: "var(--c-text-3)" }}>{r.course.credits}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="c-bignum tnum" style={{ fontSize: 16 }}>{r.current == null ? "—" : r.current.toFixed(1)}</span>
                <GradePill letter={r.currentLetter}/>
              </div>
              <GradePill letter={letterFor(r.assumedFinal)} size="lg"/>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {GRADE_SCALE.slice(0, 7).map(g => (
                  <button key={g.letter}
                          onClick={() => setOverrides({ ...overrides, [r.course.id]: overrides[r.course.id] === g.letter ? null : g.letter })}
                          className="mono"
                          style={{
                            border: "1px solid var(--c-line)",
                            background: r.overrideLetter === g.letter ? "var(--c-accent-bg)" : "transparent",
                            color: r.overrideLetter === g.letter ? "var(--c-accent)" : "var(--c-text-3)",
                            borderColor: r.overrideLetter === g.letter ? "var(--c-accent)" : "var(--c-line)",
                            padding: "3px 9px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600,
                          }}>{g.letter}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--c-text-4)" }}>
          <I.Info className="c-ico sm"/> Overrides simulate hypothetical final grades. Clear an override by clicking it again.
        </div>
      </div>
    </div>
  );
};

// ─── Import Template Preview ────────────────────────────────────
const ImportScreen = ({ go, semesters }) => {
  // mock incoming template
  const tpl = {
    name: "Operating Systems",
    code: "CS 314",
    credits: 3,
    criteria: [
      { name: "Lab", weight: 20, instances: 5 },
      { name: "Quiz", weight: 15, instances: 4 },
      { name: "Midterm", weight: 25, instances: 1 },
      { name: "Project", weight: 15, instances: 1 },
      { name: "Final", weight: 25, instances: 1 },
    ],
    sharedBy: "Akua A. (CS 2027)",
  };
  const [target, setTarget] = useS3(semesters.find(s => s.status === "active").id);
  const totalWeight = tpl.criteria.reduce((s, c) => s + c.weight, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 820 }}>
      <div className="c-section-head">
        <h2>Import course template</h2>
        <span className="sub">Preview before adding</span>
      </div>

      <div className="c-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 22, background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-line)", display: "flex", alignItems: "center", gap: 12 }}>
          <I.QR className="c-ico lg" style={{ color: "var(--c-accent)" }}/>
          <div style={{ flex: 1 }}>
            <div className="c-label" style={{ marginBottom: 2 }}>Source</div>
            <div style={{ fontSize: 13 }}><span className="mono" style={{ color: "var(--c-text-3)" }}>cumul.us/t#v1:CS314…</span> · shared by <span style={{ color: "var(--c-text)" }}>{tpl.sharedBy}</span></div>
          </div>
          <span className="c-chip">Template only · no scores</span>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
            <span className="c-tag">{tpl.code}</span>
            <span className="serif" style={{ fontSize: 26 }}>{tpl.name}</span>
            <span className="c-chip" style={{ marginLeft: "auto" }}>{tpl.credits} credits</span>
          </div>

          <div className="c-card" style={{ padding: 16, background: "var(--c-bg-2)" }}>
            <WeightBar criteria={tpl.criteria.map((c,i) => ({ ...c, id: i }))}/>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 14 }}>
              {tpl.criteria.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid var(--c-line)", borderRadius: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                  <span className="mono tnum" style={{ color: "var(--c-text-3)", marginLeft: "auto", fontSize: 12 }}>{c.weight}%</span>
                  <span className="c-chip">{c.instances}×</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11 }} className="mono">
              <span style={{ color: "var(--c-text-4)" }}>{tpl.criteria.length} criteria</span>
              <span style={{ color: "var(--c-grade-a)" }}>Weights total {totalWeight}% ✓</span>
            </div>
          </div>

          <div className="c-hr" style={{ margin: "22px 0" }}/>

          <div className="c-label" style={{ marginBottom: 8 }}>Add to semester</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {semesters.map(s => (
              <label key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${target === s.id ? "var(--c-accent)" : "var(--c-line)"}`,
                background: target === s.id ? "var(--c-accent-bg)" : "transparent",
                cursor: "pointer", fontSize: 13,
              }}>
                <input type="radio" checked={target === s.id} onChange={() => setTarget(s.id)} style={{ accentColor: "var(--c-accent)" }}/>
                <span>{s.name}</span>
                {s.status === "active" && <span className="c-chip accent dot" style={{ marginLeft: "auto" }}>Active</span>}
              </label>
            ))}
          </div>
        </div>

        <div style={{ padding: 16, borderTop: "1px solid var(--c-line)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--c-bg)" }}>
          <span style={{ fontSize: 12, color: "var(--c-text-4)" }}>You'll fill in scores after the course is added.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="c-btn ghost" onClick={() => go({ name: "home" })}>Cancel</button>
            <button className="c-btn primary" onClick={() => go({ name: "semester", id: target })}>
              <I.Plus className="c-ico sm"/> Add course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Settings (full-width with inline grade scale + theme toggle) ──
const SettingsScreen = ({ go, openModal, theme, setTheme }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="c-section-head">
        <h2>Settings</h2>
        <span className="sub">Local · this device only</span>
      </div>

      {/* Top row: Appearance + App identity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        <div className="c-card" style={{ padding: 24 }}>
          <div className="c-label" style={{ marginBottom: 14 }}>Appearance</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ThemeChip selected={theme === "light"} onClick={() => setTheme("light")} mode="light"/>
            <ThemeChip selected={theme === "dark"} onClick={() => setTheme("dark")} mode="dark"/>
          </div>

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--c-surface-2)", borderRadius: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--c-surface-3)", display: "grid", placeItems: "center", color: "var(--c-text-2)" }}>
              {theme === "dark" ? <I.Moon className="c-ico"/> : <I.Sun className="c-ico"/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Dark mode</div>
              <div style={{ fontSize: 12, color: "var(--c-text-3)", marginTop: 2 }}>Easier on the eyes when grinding at midnight.</div>
            </div>
            <button className={`c-toggle ${theme === "dark" ? "on" : ""}`}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}/>
          </div>
        </div>

        <div className="c-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>
          <div className="c-label">About</div>
          <div className="c-brand" style={{ padding: 0 }}>
            <div className="mark"/>
            <div>
              <div className="name">Cumulus</div>
              <div className="sub">v0.4.1 · local</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--c-text-3)", lineHeight: 1.5 }}>
            Local-first GPA tracker built for Ashesi students. No accounts, no cloud, no surveillance — your grades stay on your device.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
            <span className="c-chip">OFFLINE</span>
            <span className="c-chip">NO ACCOUNT</span>
            <span className="c-chip yellow">v0.4.1</span>
          </div>
        </div>
      </div>

      {/* Inline Ashesi grade scale */}
      <div className="c-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "22px 26px 18px", display: "flex", alignItems: "baseline", gap: 14, borderBottom: "1px solid var(--c-line)" }}>
          <h3 style={{ margin: 0, font: "700 20px var(--f-ui)", letterSpacing: "-0.02em" }}>Ashesi grade scale</h3>
          <span style={{ fontSize: 12.5, color: "var(--c-text-3)", fontWeight: 600 }}>
            Cumulus uses Ashesi's official scale. Built-in, not user-configurable.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {GRADE_SCALE.map((g, i) => {
            const band = g.letter[0];
            return (
              <div key={g.letter}
                   style={{
                     padding: "20px 22px",
                     borderRight: (i % 4 !== 3) ? "1px solid var(--c-line)" : "0",
                     borderTop: i >= 4 ? "1px solid var(--c-line)" : "0",
                     display: "flex", flexDirection: "column", gap: 10,
                   }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="c-grade-pill" data-band={band} style={{ fontSize: 16, height: 36, minWidth: 52, padding: "0 14px" }}>{g.letter}</span>
                  <span className="c-bignum tnum" style={{ fontSize: 26 }}>{g.points.toFixed(1)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--c-text-3)", fontWeight: 600 }}>
                  {g.letter === "E" ? "Below 50%" : `${g.min}–${g.max < 100 ? Math.floor(g.max) : 100}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data management */}
      <div className="c-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 26px 16px" }}>
          <div className="c-label">Your data</div>
        </div>
        <SettingRow icon={<I.Download/>} label="Export all data"
                    sub="Download a full backup as JSON"
                    action={<><I.Download className="c-ico sm"/> Download</>}/>
        <SettingRow icon={<I.Upload/>} label="Import data backup"
                    sub="Restore from a previously exported JSON file"
                    action={<><I.Upload className="c-ico sm"/> Choose file</>}/>
        <SettingRow icon={<I.Trash/>} label="Clear all data"
                    sub="Removes every semester, course, and score from this device"
                    action="Clear…"
                    danger/>
      </div>
    </div>
  );
};

const ThemeChip = ({ selected, onClick, mode }) => {
  const isDark = mode === "dark";
  return (
    <button onClick={onClick}
            style={{
              border: 0, cursor: "pointer",
              padding: 6, borderRadius: 16,
              background: selected ? "var(--c-accent)" : "var(--c-surface-2)",
              boxShadow: selected ? "0 8px 20px -8px var(--c-accent)" : "none",
              transition: "all 160ms",
              textAlign: "left",
            }}>
      <div style={{
        height: 92, borderRadius: 12, padding: 12, position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #0E1226, #2D3560)"
          : "linear-gradient(135deg, #EAF2FF, #FFE9C4)",
      }}>
        <div style={{ width: 38, height: 6, borderRadius: 3, background: isDark ? "#4F7CFF" : "#4F7CFF", marginBottom: 6 }}/>
        <div style={{ width: 60, height: 4, borderRadius: 2, background: isDark ? "#5E6489" : "#99A2BD", marginBottom: 4 }}/>
        <div style={{ width: 48, height: 4, borderRadius: 2, background: isDark ? "#3D4470" : "#C0C8E0" }}/>
        <div style={{ position: "absolute", right: 12, top: 12, width: 22, height: 22, borderRadius: 999,
          background: isDark ? "#FFD93D" : "#FFD93D" }}/>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px 2px" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: selected ? "white" : "var(--c-text)" }}>
          {isDark ? "Dark" : "Light"}
        </span>
        {selected && <I.Check className="c-ico sm" style={{ color: "white" }}/>}
      </div>
    </button>
  );
};

const SettingRow = ({ icon, label, sub, action, onClick, danger }) => (
  <div style={{ padding: "16px 26px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center", borderTop: "1px solid var(--c-line)" }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: danger ? "var(--c-coral-bg)" : "var(--c-surface-2)", display: "grid", placeItems: "center", color: danger ? "var(--c-grade-e)" : "var(--c-text-2)" }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: danger ? "var(--c-grade-e)" : "var(--c-text)" }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--c-text-3)", marginTop: 2, fontWeight: 500 }}>{sub}</div>
    </div>
    <button className="c-btn ghost sm" onClick={onClick} style={danger ? { color: "var(--c-grade-e)" } : {}}>
      {action}
    </button>
  </div>
);

// ─── Grade Scale modal ──────────────────────────────────────────
const GradeScaleModal = ({ onClose }) => (
  <div className="c-sheet">
    <div className="c-sheet-head">
      <I.Calc className="c-ico"/>
      <h3>Ashesi grade scale</h3>
      <button className="c-btn icon ghost" style={{ marginLeft: "auto" }} onClick={onClose}><I.X className="c-ico"/></button>
    </div>
    <div className="c-sheet-body">
      <div style={{ fontSize: 13, color: "var(--c-text-3)", marginBottom: 18, lineHeight: 1.5, fontWeight: 500 }}>
        Cumulus uses Ashesi University's official grading scale. This is institutional and not user-configurable.
      </div>
      <div className="c-card" style={{ padding: 0 }}>
        {GRADE_SCALE.map(g => (
          <div key={g.letter} style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "center", gap: 12, borderTop: "1px solid var(--c-line)" }}>
            <span className="c-grade-pill" data-band={g.letter[0]}>{g.letter}</span>
            <span style={{ color: "var(--c-text-2)", fontSize: 13.5, fontWeight: 600 }}>
              {g.letter === "E" ? "Below 50%" : `${g.min}–${g.max < 100 ? Math.floor(g.max) : 100}%`}
            </span>
            <span className="c-bignum tnum" style={{ fontSize: 20 }}>{g.points.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="c-sheet-foot">
      <button className="c-btn primary" onClick={onClose}>Got it</button>
    </div>
  </div>
);

window.CourseEditScreen = CourseEditScreen;
window.CourseEditModal = CourseEditModal;
window.SimulatorScreen = SimulatorScreen;
window.ImportScreen = ImportScreen;
window.SettingsScreen = SettingsScreen;
window.GradeScaleModal = GradeScaleModal;
