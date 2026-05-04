// Cumulus — shared UI primitives + grade pill helpers

const fmtGPA = (g) => g == null ? "—" : g.toFixed(2);
const fmtPct = (p) => p == null ? "—" : `${p.toFixed(1)}%`;

const bandOf = (letter) => {
  if (!letter || letter === "—") return "-";
  return letter[0]; // A, B, C, D, E
};

const GradePill = ({ letter, size = "md" }) => {
  const band = bandOf(letter);
  const cls = size === "lg" ? "c-grade-pill" : "c-grade-pill";
  const style = size === "lg"
    ? { minWidth: 44, height: 32, fontSize: 14, padding: "0 12px", borderRadius: 8 }
    : {};
  return <span className={cls} data-band={band} style={style}>{letter || "—"}</span>;
};

// inline mini-bar showing a percentage
const MiniBar = ({ pct, w = 80, color = "var(--c-accent)" }) => {
  const v = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div style={{ width: w, height: 3, background: "var(--c-line)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${v}%`, height: "100%", background: color, borderRadius: 2 }} />
    </div>
  );
};

// SVG sparkline of percentages
const Sparkline = ({ values, w = 120, h = 28, color = "var(--c-accent)" }) => {
  const pts = values.filter(v => v != null);
  if (pts.length < 2) return <svg width={w} height={h} className="c-spark"><line x1="0" y1={h/2} x2={w} y2={h/2} stroke="var(--c-line-2)" strokeDasharray="2 2"/></svg>;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = Math.max(1, max - min);
  const dx = w / (pts.length - 1);
  const path = pts.map((v, i) => {
    const x = i * dx;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="c-spark">
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Big GPA ring
const GPARing = ({ gpa, label, size = 180, max = 4 }) => {
  const v = Math.max(0, Math.min(max, gpa ?? 0));
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const off = c - (v / max) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--c-line)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--c-accent)" strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 4,
      }}>
        <span className="c-bignum" style={{ fontSize: size * 0.32 }}>{fmtGPA(gpa)}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--c-text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      </div>
    </div>
  );
};

// Stacked horizontal weight bar — shows weight allocation across criteria
const WeightBar = ({ criteria, h = 8 }) => {
  const total = criteria.reduce((s, c) => s + c.weight, 0);
  const palette = [
    "oklch(0.82 0.09 230)",
    "oklch(0.78 0.07 200)",
    "oklch(0.74 0.06 175)",
    "oklch(0.7 0.05 250)",
    "oklch(0.66 0.05 220)",
  ];
  return (
    <div style={{ display: "flex", height: h, borderRadius: 999, overflow: "hidden", background: "var(--c-line)", border: "1px solid var(--c-line)" }}>
      {criteria.map((c, i) => (
        <div key={c.id} title={`${c.name} — ${c.weight}%`}
             style={{ width: `${(c.weight / Math.max(total, 100)) * 100}%`, background: palette[i % palette.length], opacity: 0.9 }}/>
      ))}
    </div>
  );
};

// Score row with completion dots
const Dots = ({ done, total, accent = "var(--c-accent)" }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: 6, height: 6, borderRadius: 999,
        background: i < done ? accent : "var(--c-line-2)",
      }}/>
    ))}
  </div>
);

// Empty placeholder
const EmptyState = ({ title, sub, action }) => (
  <div style={{
    padding: "60px 24px",
    border: "1px dashed var(--c-line-2)",
    borderRadius: "var(--r-3)",
    textAlign: "center",
    color: "var(--c-text-3)",
  }}>
    <div className="serif" style={{ fontSize: 28, color: "var(--c-text-2)", marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 13, marginBottom: 18 }}>{sub}</div>}
    {action}
  </div>
);

Object.assign(window, { fmtGPA, fmtPct, bandOf, GradePill, MiniBar, Sparkline, GPARing, WeightBar, Dots, EmptyState });
