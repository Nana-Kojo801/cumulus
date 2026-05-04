// Cumulus — modals (Score Entry, What Score Do I Need, Criteria editor, Export, Import preview)
const { useState: useState2, useMemo: useMemo2 } = React;

// ─── Score Entry modal ──────────────────────────────────────────
const ScoreEntryModal = ({ courseId, criterionId, courses, onClose }) => {
  const course = courses.find(c => c.id === courseId);
  const cr = course.criteria.find(x => x.id === criterionId);
  const [entries, setEntries] = useState2(cr.entries);

  const setScore = (i, v) => {
    const next = [...entries];
    next[i] = { ...next[i], score: v === "" ? null : Number(v) };
    setEntries(next);
  };

  const liveAvg = (() => {
    const done = entries.filter(e => e.score != null && e.total != null && e.total > 0);
    if (done.length === 0) return null;
    return done.reduce((s, e) => s + (e.score / e.total) * 100, 0) / done.length;
  })();
  const contrib = liveAvg != null ? (liveAvg * cr.weight / 100) : null;

  return (
    <div className="c-sheet" style={{ width: 620 }}>
      <div className="c-sheet-head">
        <span className="c-tag">{course.code}</span>
        <h3>{cr.name}</h3>
        <span className="c-chip" style={{ marginLeft: "auto" }}>{cr.weight}% of grade</span>
        <button className="c-btn icon ghost" onClick={onClose}><I.X className="c-ico"/></button>
      </div>
      <div className="c-sheet-body">

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div className="c-card" style={{ padding: 14 }}>
            <div className="c-label" style={{ marginBottom: 6 }}>Average so far</div>
            <div className="c-bignum tnum" style={{ fontSize: 28 }}>{liveAvg == null ? "—" : liveAvg.toFixed(1)}</div>
          </div>
          <div className="c-card" style={{ padding: 14 }}>
            <div className="c-label" style={{ marginBottom: 6 }}>Contributes</div>
            <div className="c-bignum tnum" style={{ fontSize: 28 }}>{contrib == null ? "—" : contrib.toFixed(1)}<span style={{ fontSize: 12, color: "var(--c-text-3)" }}>/{cr.weight}</span></div>
          </div>
          <div className="c-card" style={{ padding: 14 }}>
            <div className="c-label" style={{ marginBottom: 6 }}>Completed</div>
            <div className="c-bignum tnum" style={{ fontSize: 28 }}>
              {entries.filter(e => e.score != null).length}<span style={{ fontSize: 12, color: "var(--c-text-3)" }}>/{entries.length}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span className="c-label">Entries</span>
          <button className="c-btn ghost sm" style={{ marginLeft: "auto" }}>
            <I.Plus className="c-ico sm"/> Add instance
          </button>
        </div>

        <div className="c-card" style={{ padding: 0 }}>
          {entries.map((e, i) => {
            const filled = e.score != null;
            const pct = filled ? (e.score / e.total) * 100 : null;
            return (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto auto auto auto", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i === 0 ? "none" : "1px solid var(--c-line)" }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--c-text-4)" }}>#{i+1}</div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{e.label}</div>
                <input className="c-input" style={{ width: 76, height: 30, textAlign: "right" }}
                       placeholder="—" value={e.score ?? ""} onChange={ev => setScore(i, ev.target.value)}/>
                <span className="mono" style={{ color: "var(--c-text-4)" }}>/</span>
                <input className="c-input" style={{ width: 60, height: 30, textAlign: "right", color: "var(--c-text-3)" }}
                       value={e.total ?? ""} readOnly/>
                <span className="mono tnum" style={{ width: 56, textAlign: "right", color: filled ? "var(--c-text)" : "var(--c-text-4)" }}>
                  {filled ? `${pct.toFixed(0)}%` : "pending"}
                </span>
                {filled
                  ? <GradePill letter={letterFor(pct)}/>
                  : <span className="c-pending c-grade-pill" data-band="-">—</span>}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "var(--c-text-4)", display: "flex", gap: 8, alignItems: "center" }}>
          <I.Info className="c-ico sm"/> Pending entries are excluded from the running average. Use "What score do I need?" to project.
        </div>
      </div>
      <div className="c-sheet-foot">
        <button className="c-btn ghost" onClick={onClose}>Cancel</button>
        <button className="c-btn primary" onClick={onClose}>Save scores</button>
      </div>
    </div>
  );
};

// ─── What Score Do I Need ───────────────────────────────────────
const NeededModal = ({ courseId, courses, onClose }) => {
  const course = courses.find(c => c.id === courseId);
  const [target, setTarget] = useState2("A");
  const [mode, setMode] = useState2("overall"); // "overall" | "specific"
  const [selectedKey, setSelectedKey] = useState2(null);

  // Build list of pending entries (specific upcoming evaluations)
  const pendingEntries = [];
  for (const cr of course.criteria) {
    cr.entries.forEach((e, idx) => {
      if (e.score == null) {
        pendingEntries.push({ key: `${cr.id}::${idx}`, criterion: cr, entry: e, idx });
      }
    });
  }

  // default-select first pending entry
  React.useEffect(() => {
    if (mode === "specific" && !selectedKey && pendingEntries.length > 0) {
      setSelectedKey(pendingEntries[0].key);
    }
  }, [mode, selectedKey, pendingEntries.length]);

  const r = useMemo2(() => requiredAverage(course, target), [course, target]);
  const { pct } = courseRunningGrade(course);

  // Per-entry forecast: assuming all OTHER pending entries land at the criterion's
  // running average (or a flat 0 if no data), what does THIS entry need to score?
  const specific = useMemo2(() => {
    if (mode !== "specific" || !selectedKey) return null;
    const sel = pendingEntries.find(p => p.key === selectedKey);
    if (!sel) return null;
    const targetPct = (GRADE_SCALE.find(g => g.letter === target)?.min ?? 0);
    const totalEntryTotal = sel.entry.total || 100;

    // Compute final-grade contribution of every entry except the selected one.
    // For entries already scored: use actual.
    // For other pending entries: assume they hit "assumeAvg" % (default = current running average for that criterion, or the overall course pct).
    let fixed = 0; // weighted % contribution baked in
    for (const cr of course.criteria) {
      const perInstanceWeight = cr.weight / Math.max(cr.entries.length, 1);
      const critAvg = criterionAverage(cr);
      const fallback = critAvg != null ? critAvg : (pct ?? 0);
      cr.entries.forEach((e, idx) => {
        if (sel.criterion.id === cr.id && idx === sel.idx) return; // exclude target
        if (e.score != null && e.total) {
          fixed += (e.score / e.total) * 100 * (perInstanceWeight / 100);
        } else {
          fixed += fallback * (perInstanceWeight / 100);
        }
      });
    }

    const selectedPerInstanceWeight = sel.criterion.weight / Math.max(sel.criterion.entries.length, 1);
    // need: fixed + selectedPct * (selectedPerInstanceWeight / 100) >= targetPct
    const requiredPct = (targetPct - fixed) / (selectedPerInstanceWeight / 100);
    const requiredRaw = (requiredPct / 100) * totalEntryTotal;

    return {
      sel,
      requiredPct,
      requiredRaw,
      total: totalEntryTotal,
      impossible: requiredPct > 100,
      trivial: requiredPct <= 0,
      maxIfPerfect: fixed + selectedPerInstanceWeight,
      weight: selectedPerInstanceWeight,
    };
  }, [mode, selectedKey, target, course, pct]);

  return (
    <div className="c-sheet" style={{ width: 600 }}>
      <div className="c-sheet-head">
        <I.Target className="c-ico" style={{ color: "var(--c-accent)" }}/>
        <h3>What score do I need?</h3>
        <span className="c-chip" style={{ marginLeft: "auto" }}>{course.code}</span>
        <button className="c-btn icon ghost" onClick={onClose}><I.X className="c-ico"/></button>
      </div>
      <div className="c-sheet-body">

        {/* Mode toggle */}
        <div className="c-seg" style={{ marginBottom: 18 }}>
          <button className={mode === "overall" ? "on" : ""} onClick={() => setMode("overall")}>Across all remaining</button>
          <button className={mode === "specific" ? "on" : ""} onClick={() => setMode("specific")}>For one assessment</button>
        </div>

        <div className="c-label" style={{ marginBottom: 8 }}>Target grade</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
          {GRADE_SCALE.map(g => (
            <button key={g.letter} onClick={() => setTarget(g.letter)}
                    className="c-btn ghost sm"
                    style={{
                      borderColor: target === g.letter ? "var(--c-accent)" : "var(--c-line)",
                      background: target === g.letter ? "var(--c-accent-bg)" : "transparent",
                      color: target === g.letter ? "var(--c-accent)" : "var(--c-text-2)",
                      minWidth: 56, justifyContent: "center",
                    }}>
              <span className="mono" style={{ fontWeight: 600 }}>{g.letter}</span>
              <span style={{ fontSize: 10, color: "var(--c-text-4)" }}>{g.points.toFixed(1)}</span>
            </button>
          ))}
        </div>

        {mode === "specific" && (
          <>
            <div className="c-label" style={{ marginBottom: 8 }}>Pick the upcoming assessment</div>
            <div className="c-card" style={{ padding: 0, marginBottom: 14, maxHeight: 200, overflow: "auto" }}>
              {pendingEntries.length === 0 && (
                <div style={{ padding: 18, color: "var(--c-text-3)", fontSize: 13 }}>No pending assessments.</div>
              )}
              {pendingEntries.map(p => {
                const on = p.key === selectedKey;
                const perInstanceW = p.criterion.weight / Math.max(p.criterion.entries.length, 1);
                return (
                  <div key={p.key} onClick={() => setSelectedKey(p.key)}
                       style={{
                         padding: "12px 14px",
                         borderTop: "1px solid var(--c-line)",
                         display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center",
                         cursor: "pointer",
                         background: on ? "var(--c-accent-bg)" : "transparent",
                       }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13, color: on ? "var(--c-accent)" : "var(--c-text)" }}>{p.entry.label}</div>
                      <div style={{ fontSize: 11, color: "var(--c-text-4)", marginTop: 2 }}>{p.criterion.name} · out of {p.entry.total}</div>
                    </div>
                    <span className="mono tnum" style={{ fontSize: 11, color: "var(--c-text-3)" }}>{perInstanceW.toFixed(1)}%</span>
                    {on && <I.Check className="c-ico" style={{ color: "var(--c-accent)" }}/>}
                    {!on && <span style={{ width: 14 }}/>}
                  </div>
                );
              })}
            </div>

            {specific && (
              <div className="c-card" style={{ padding: 22, marginBottom: 14, background: "var(--c-bg-2)" }}>
                {specific.impossible
                  ? <>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <I.X className="c-ico" style={{ color: "var(--c-grade-e)" }}/>
                        <span style={{ fontWeight: 500, color: "var(--c-grade-e)" }}>Out of reach on this assessment alone</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--c-text-3)", lineHeight: 1.5 }}>
                        Even with a perfect <span className="mono tnum" style={{ color: "var(--c-text)" }}>{specific.total}/{specific.total}</span> here, the highest possible final is <span className="mono tnum" style={{ color: "var(--c-text)" }}>{specific.maxIfPerfect.toFixed(1)}</span> (assuming average performance on other pending work).
                      </div>
                    </>
                  : specific.trivial
                    ? <>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                          <I.Check className="c-ico" style={{ color: "var(--c-grade-a)" }}/>
                          <span style={{ fontWeight: 500, color: "var(--c-grade-a)" }}>Already secured</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--c-text-3)" }}>
                          You can score 0 on this and still hit {target}, assuming average performance elsewhere.
                        </div>
                      </>
                    : <>
                        <div className="c-label" style={{ marginBottom: 8 }}>You need to score</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                          <div className="c-bignum tnum" style={{ fontSize: 64, lineHeight: 0.9 }}>
                            {Math.ceil(specific.requiredRaw * 10) / 10}
                          </div>
                          <span className="serif" style={{ fontSize: 22, color: "var(--c-text-3)" }}>
                            / {specific.total}
                          </span>
                          <span className="mono tnum" style={{ marginLeft: "auto", color: "var(--c-text-3)", fontSize: 13 }}>
                            ({specific.requiredPct.toFixed(1)}%)
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--c-text-3)", lineHeight: 1.5 }}>
                          On <span style={{ color: "var(--c-text)" }}>{specific.sel.entry.label}</span> to finish the course at <span style={{ color: "var(--c-text)" }}>{target}</span>. Assumes you average your current performance on the other {pendingEntries.length - 1} pending {pendingEntries.length - 1 === 1 ? "assessment" : "assessments"}.
                        </div>
                      </>
                }
              </div>
            )}
          </>
        )}

        {mode === "overall" && (
          <div className="c-card" style={{ padding: 22, marginBottom: 14, background: "var(--c-bg-2)" }}>
            {r.required == null
              ? <div style={{ color: "var(--c-text-3)" }}>No pending work — your final stands.</div>
              : r.impossible
                ? <>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                      <I.X className="c-ico" style={{ color: "var(--c-grade-e)" }}/>
                      <span style={{ fontWeight: 500, color: "var(--c-grade-e)" }}>Mathematically out of reach</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--c-text-3)", marginBottom: 14, lineHeight: 1.5 }}>
                      Even with a perfect 100 on every remaining assessment, the highest possible final is <span className="mono tnum" style={{ color: "var(--c-text)" }}>{r.maxAchievable.toFixed(1)}</span>.
                    </div>
                    <div className="c-label" style={{ marginBottom: 4 }}>Best achievable grade</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="c-bignum tnum" style={{ fontSize: 36 }}>{r.maxAchievable.toFixed(1)}</div>
                      <GradePill letter={letterFor(r.maxAchievable)} size="lg"/>
                    </div>
                  </>
                : <>
                    <div className="c-label" style={{ marginBottom: 8 }}>You need to average</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                      <div className="c-bignum tnum" style={{ fontSize: 72, lineHeight: 0.9 }}>
                        {Math.max(0, r.required).toFixed(1)}
                      </div>
                      <span className="mono" style={{ color: "var(--c-text-3)", fontSize: 16 }}>%</span>
                      <span className="serif" style={{ fontSize: 18, color: "var(--c-text-3)", marginLeft: 8 }}>
                        across remaining work
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--c-text-3)", lineHeight: 1.5 }}>
                      To finish with <span style={{ color: "var(--c-text)" }}>{target}</span>, average at least this on the {r.pendingWeight.toFixed(0)}% of weight that's still pending.
                    </div>
                  </>
            }
          </div>
        )}

        {mode === "overall" && (
          <div className="c-card" style={{ padding: 0 }}>
            <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr auto auto", fontSize: 11, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--c-line)" }} className="mono">
              <span>Pending criterion</span><span>Weight</span><span style={{ minWidth: 60, textAlign: "right" }}>Pending</span>
            </div>
            {course.criteria.map(c => {
              const { done, total } = criterionCompletion(c);
              const remaining = total - done;
              if (remaining === 0) return null;
              const pendingW = c.weight * (total === 0 ? 1 : remaining / total);
              return (
                <div key={c.id} style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, borderTop: "1px solid var(--c-line)" }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                  <span className="mono tnum" style={{ color: "var(--c-text-3)", fontSize: 12 }}>{c.weight}%</span>
                  <span className="mono tnum" style={{ minWidth: 60, textAlign: "right", fontSize: 12 }}>{remaining}/{total} · {pendingW.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="c-sheet-foot">
        <button className="c-btn ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// ─── Criteria editor ────────────────────────────────────────────
const CriteriaModal = ({ courseId, courses, onClose }) => {
  const course = courses.find(c => c.id === courseId);
  const [list, setList] = useState2(course.criteria.map(c => ({ ...c, count: c.entries.length })));
  const total = list.reduce((s, c) => s + Number(c.weight || 0), 0);

  return (
    <div className="c-sheet" style={{ width: 640 }}>
      <div className="c-sheet-head">
        <I.Edit className="c-ico"/>
        <h3>Edit evaluation criteria</h3>
        <span className="c-chip" style={{ marginLeft: "auto" }}>{course.code}</span>
        <button className="c-btn icon ghost" onClick={onClose}><I.X className="c-ico"/></button>
      </div>
      <div className="c-sheet-body">
        <div className="c-card" style={{ padding: 0, marginBottom: 14 }}>
          <div style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.6fr 32px", fontSize: 11, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--c-line)" }} className="mono">
            <span>Name</span><span>Weight %</span><span>Instances</span><span/>
          </div>
          {list.map((c, i) => (
            <div key={c.id} style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.6fr 32px", gap: 10, alignItems: "center", borderTop: i === 0 ? "none" : "1px solid var(--c-line)" }}>
              <input className="c-input" style={{ height: 32 }} value={c.name}
                     onChange={e => { const next=[...list]; next[i]={...c, name:e.target.value}; setList(next); }}/>
              <input className="c-input" style={{ height: 32, textAlign: "right" }} value={c.weight}
                     onChange={e => { const next=[...list]; next[i]={...c, weight:Number(e.target.value) || 0}; setList(next); }}/>
              <input className="c-input" style={{ height: 32, textAlign: "right" }} value={c.count}
                     onChange={e => { const next=[...list]; next[i]={...c, count:Number(e.target.value) || 1}; setList(next); }}/>
              <button className="c-btn icon ghost" style={{ height: 32, width: 32 }}>
                <I.Trash className="c-ico sm"/>
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button className="c-btn ghost sm"><I.Plus className="c-ico sm"/> Add criterion</button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="c-label">Total weight</span>
            <span className="c-bignum tnum" style={{ fontSize: 18, color: total === 100 ? "var(--c-grade-a)" : "var(--c-grade-d)" }}>{total}%</span>
          </div>
        </div>

        <div style={{ height: 10, background: "var(--c-line)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${Math.min(total, 100)}%`, background: total === 100 ? "var(--c-grade-a)" : "var(--c-accent)", transition: "width 200ms" }}/>
          {total > 100 && <div style={{ width: `${total - 100}%`, background: "var(--c-grade-e)" }}/>}
        </div>

        {total !== 100 && (
          <div style={{ marginTop: 10, fontSize: 12, color: total > 100 ? "var(--c-grade-e)" : "var(--c-grade-d)", display: "flex", gap: 6, alignItems: "center" }}>
            <I.Info className="c-ico sm"/> Weights must sum to 100% before grading is accurate. Currently {total > 100 ? `${total - 100}% over` : `${100 - total}% under`}.
          </div>
        )}
      </div>
      <div className="c-sheet-foot">
        <button className="c-btn ghost" onClick={onClose}>Cancel</button>
        <button className="c-btn primary" onClick={onClose}>Save changes</button>
      </div>
    </div>
  );
};

// ─── Export Template (with QR) ──────────────────────────────────
const ExportModal = ({ courseId, courses, onClose }) => {
  const course = courses.find(c => c.id === courseId);
  const [tab, setTab] = useState2("qr");
  const json = JSON.stringify({
    name: course.name, code: course.code, credits: course.credits,
    criteria: course.criteria.map(c => ({ name: c.name, weight: c.weight, instances: c.entries.length })),
  }, null, 2);
  const link = `https://cumul.us/t#v1:${course.code.replace(/\s/g,"")}.${course.credits}cr.${course.criteria.length}c`;

  return (
    <div className="c-sheet" style={{ width: 640 }}>
      <div className="c-sheet-head">
        <I.Share className="c-ico"/>
        <h3>Share course template</h3>
        <span className="c-chip" style={{ marginLeft: "auto" }}>{course.code}</span>
        <button className="c-btn icon ghost" onClick={onClose}><I.X className="c-ico"/></button>
      </div>
      <div className="c-sheet-body">

        <div style={{ fontSize: 13, color: "var(--c-text-3)", marginBottom: 16, lineHeight: 1.5 }}>
          Shares the structure only — name, credits, and weighted criteria. <span style={{ color: "var(--c-text-2)" }}>No scores or personal data are included.</span>
        </div>

        <div className="c-seg" style={{ marginBottom: 18 }}>
          <button className={tab === "qr" ? "on" : ""} onClick={() => setTab("qr")}>QR code</button>
          <button className={tab === "link" ? "on" : ""} onClick={() => setTab("link")}>Link</button>
          <button className={tab === "json" ? "on" : ""} onClick={() => setTab("json")}>JSON</button>
        </div>

        {tab === "qr" && (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 22, alignItems: "center" }}>
            <FakeQR/>
            <div>
              <div className="c-label" style={{ marginBottom: 8 }}>Anyone scanning</div>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 12 }}>
                Gets the empty course skeleton and chooses where to add it.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="c-btn ghost sm"><I.Download className="c-ico sm"/> Save PNG</button>
                <button className="c-btn ghost sm"><I.Share className="c-ico sm"/> Share</button>
              </div>
            </div>
          </div>
        )}

        {tab === "link" && (
          <div>
            <div className="c-label" style={{ marginBottom: 8 }}>Shareable link</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="c-input mono" readOnly value={link} style={{ fontSize: 12 }}/>
              <button className="c-btn primary"><I.Check className="c-ico sm"/> Copy</button>
            </div>
            <div style={{ fontSize: 12, color: "var(--c-text-4)", marginTop: 10, lineHeight: 1.5 }}>
              The template data is encoded in the URL fragment. No server stores it — sharing works fully offline.
            </div>
          </div>
        )}

        {tab === "json" && (
          <pre className="mono" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-line)", borderRadius: 10, padding: 14, fontSize: 11.5, color: "var(--c-text-2)", maxHeight: 280, overflow: "auto", lineHeight: 1.55 }}>
{json}
          </pre>
        )}

        <div className="c-hr" style={{ margin: "20px 0" }}/>

        <div className="c-label" style={{ marginBottom: 8 }}>Preview</div>
        <div className="c-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 8 }}>
            <span className="c-tag">{course.code}</span>
            <span style={{ fontWeight: 500 }}>{course.name}</span>
            <span className="c-chip" style={{ marginLeft: "auto" }}>{course.credits} cr</span>
          </div>
          <WeightBar criteria={course.criteria}/>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {course.criteria.map(c => (
              <span key={c.id} className="c-chip">{c.name} · {c.weight}%</span>
            ))}
          </div>
        </div>
      </div>
      <div className="c-sheet-foot">
        <button className="c-btn ghost" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};

// Fake-QR — visually convincing but not a real code
const FakeQR = () => {
  const cells = 21;
  const seed = 1337;
  let r = seed;
  const rand = () => { r = (r * 1664525 + 1013904223) | 0; return ((r >>> 0) % 1000) / 1000; };
  const data = Array.from({ length: cells * cells }, () => rand() < 0.5);
  // finder-pattern corners
  const isFinder = (x, y) =>
    (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
  const inFinder = (x, y, ox, oy) => {
    const dx = x - ox, dy = y - oy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    const m = Math.max(Math.abs(dx-3), Math.abs(dy-3));
    return m === 0 || m === 1 || m === 3;
  };

  return (
    <div style={{ width: 168, height: 168, padding: 8, background: "white", borderRadius: 10 }}>
      <svg viewBox={`0 0 ${cells} ${cells}`} width="152" height="152" shapeRendering="crispEdges">
        {Array.from({ length: cells }).map((_, y) =>
          Array.from({ length: cells }).map((__, x) => {
            let on = data[y * cells + x];
            const fx = x < 7 ? 0 : (x >= cells - 7 ? cells - 7 : null);
            const fy = y < 7 ? 0 : (y >= cells - 7 ? cells - 7 : null);
            if (fx != null && fy != null && (fx === 0 || fy === 0) && (fy === 0 || fx === 0)) {
              const f = inFinder(x, y, fx, fy);
              if (f != null) on = f;
            } else if (isFinder(x, y)) {
              on = false;
            }
            return on ? <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill="black"/> : null;
          })
        )}
      </svg>
    </div>
  );
};

window.ScoreEntryModal = ScoreEntryModal;
window.NeededModal = NeededModal;
window.CriteriaModal = CriteriaModal;
window.ExportModal = ExportModal;
window.FakeQR = FakeQR;
