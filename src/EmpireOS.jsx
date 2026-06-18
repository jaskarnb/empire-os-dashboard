import React, { useState } from "react";
import {
  Crown, Users, Lightbulb, Radar, Hammer, Rocket, DollarSign,
  Sparkles, Play, Loader2, Calendar, BarChart3, Check, Clock,
  FileText, Search, Activity, Zap, Radio, Mic, Video
} from "lucide-react";

/* ====================== WORKER URL ====================== */
// Set VITE_WORKER_URL in .env (or REACT_APP_WORKER_URL for CRA)
// Leave blank to use same origin (good for monorepo deploys)
const WORKER =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WORKER_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_WORKER_URL) ||
  "";

/* ====================== THEME ====================== */
const MONO = "ui-monospace,'SF Mono','JetBrains Mono',Menlo,monospace";
const C = {
  bg0: "#05070e",
  glass: "linear-gradient(180deg,rgba(17,24,41,0.72),rgba(8,12,22,0.72))",
  glass2: "linear-gradient(180deg,rgba(22,30,50,0.6),rgba(11,16,28,0.6))",
  line: "rgba(120,160,220,0.16)",
  lineHot: "rgba(34,211,238,0.45)",
  text: "#e3ebf5",
  dim: "#8593ab",
  faint: "#525d75",
  cyan: "#22d3ee",
  teal: "#5eead4",
  violet: "#a855f7",
  pink: "#f472b6",
  gold: "#fbbf24",
  green: "#34d399",
  blue: "#60a5fa",
  orange: "#fb923c",
  red: "#fb7185",
};
const TIER = { S: C.green, A: C.cyan, B: C.orange };

/* ====================== TEAMS ====================== */
const TEAMS = [
  { id: "command", name: "Command", color: C.gold, icon: Crown, code: "CMD-01",
    blurb: "Runs the daily standup, sets the #1 priority, watches the empire.",
    agents: [{ name: "Atlas", role: "Chief of operations" }] },
  { id: "reach", name: "Reach", color: C.blue, icon: Users, code: "RCH-02",
    blurb: "Schedules and ships posts across every page and platform.",
    agents: [{ name: "Nova", role: "Posting lead" }, { name: "Echo", role: "TikTok / Reels ops" }, { name: "Pulse", role: "YouTube Shorts ops" }] },
  { id: "spark", name: "Spark", color: C.violet, icon: Lightbulb, code: "SPK-03",
    blurb: "Brainstorms high-retention video ideas per niche, on demand.",
    agents: [{ name: "Muse", role: "Ideation lead" }, { name: "Riff", role: "Hook writer" }] },
  { id: "radar", name: "Radar", color: C.cyan, icon: Radar, code: "RDR-04",
    blurb: "Scans the live web for winning niches and video styles.",
    agents: [{ name: "Scout", role: "Trend intel lead" }, { name: "Probe", role: "Format analyst" }] },
  { id: "forge", name: "Forge", color: C.orange, icon: Hammer, code: "FRG-05",
    blurb: "Turns approved ideas into scripts, captions, and hashtags.",
    agents: [{ name: "Smith", role: "Production lead" }, { name: "Quill", role: "Caption / SEO" }] },
  { id: "vault", name: "Vault", color: C.green, icon: Rocket, code: "VLT-06",
    blurb: "Plans which pages to launch next and how to make more money.",
    agents: [{ name: "Ledger", role: "Growth strategist" }, { name: "Mint", role: "Monetization" }] },
];

const SEED_PAGES = [
  { id: 1, niche: "Personal finance", tier: "S", handle: "@cashflow.daily", followers: 42000, revenue: 3200, posts: 5, target: 5 },
  { id: 2, niche: "AI & tech tools", tier: "S", handle: "@theaidrop", followers: 31000, revenue: 2400, posts: 4, target: 5 },
  { id: 3, niche: "Horror stories", tier: "A", handle: "@midnight.whispers", followers: 88000, revenue: 1900, posts: 6, target: 5 },
  { id: 4, niche: "True crime", tier: "A", handle: "@coldcase.files", followers: 64000, revenue: 1500, posts: 4, target: 5 },
  { id: 5, niche: "History", tier: "A", handle: "@history.unpacked", followers: 51000, revenue: 1250, posts: 3, target: 4 },
  { id: 6, niche: "Motivation", tier: "A", handle: "@built.different", followers: 120000, revenue: 980, posts: 7, target: 5 },
  { id: 7, niche: "Health & fitness", tier: "B", handle: "@fixyourform", followers: 27000, revenue: 620, posts: 4, target: 4 },
  { id: 8, niche: "Food & recipes", tier: "B", handle: "@2step.eats", followers: 73000, revenue: 840, posts: 5, target: 5 },
];

/* ====================== API — routes through worker ====================== */
async function workerPost(path, body = {}) {
  const res = await fetch(`${WORKER}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Worker error");
  return data;
}

async function pollJob(jobId, intervalMs = 3000, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(`${WORKER}/api/jobs/${jobId}`);
    const job = await res.json();
    if (job.status === "done")   return job.result;
    if (job.status === "error")  throw new Error(job.error);
  }
  throw new Error("Render timed out after 2 minutes");
}

/* ====================== HUD PRIMITIVES ====================== */
function Brackets({ color }) {
  const b = { position: "absolute", width: 9, height: 9, borderColor: color, pointerEvents: "none" };
  return (
    <>
      <span style={{ ...b, top: -1, left: -1, borderTop: "1.5px solid", borderLeft: "1.5px solid" }} />
      <span style={{ ...b, top: -1, right: -1, borderTop: "1.5px solid", borderRight: "1.5px solid" }} />
      <span style={{ ...b, bottom: -1, left: -1, borderBottom: "1.5px solid", borderLeft: "1.5px solid" }} />
      <span style={{ ...b, bottom: -1, right: -1, borderBottom: "1.5px solid", borderRight: "1.5px solid" }} />
    </>
  );
}
function Panel({ children, accent = C.line, bg = C.glass, style, brackets = true }) {
  return (
    <div style={{ position: "relative", background: bg, border: `1px solid ${C.line}`, borderRadius: 4, ...style }}>
      {brackets && <Brackets color={accent} />}
      {children}
    </div>
  );
}
function Eyebrow({ children, color = C.dim }) {
  return <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color }}>{children}</div>;
}
function Stat({ label, value, accent }) {
  return (
    <Panel accent={accent || C.lineHot} bg={C.glass2} style={{ flex: 1, minWidth: 132, padding: "13px 15px" }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ fontSize: 25, fontWeight: 700, color: accent || C.text, marginTop: 6, fontFamily: MONO, letterSpacing: -0.5 }}>{value}</div>
    </Panel>
  );
}
function Btn({ children, onClick, busy, color = C.cyan, disabled }) {
  const off = busy || disabled;
  return (
    <button className="eos-btn" onClick={onClick} disabled={off} style={{
      "--g": color, display: "inline-flex", alignItems: "center", gap: 7,
      background: off ? "rgba(255,255,255,0.03)" : color + "1c",
      border: `1px solid ${off ? C.line : color + "70"}`, color: off ? C.faint : color,
      borderRadius: 3, padding: "8px 13px", fontSize: 12, fontWeight: 600, fontFamily: MONO,
      letterSpacing: 0.4, textTransform: "uppercase", cursor: off ? "default" : "pointer",
    }}>
      {busy ? <Loader2 size={13} className="spin" /> : null}{children}
    </button>
  );
}
function SectionTitle({ eyebrow, color, title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Eyebrow color={color}>{eyebrow}</Eyebrow>
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 5, letterSpacing: -0.4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ====================== RADAR SIGNATURE ====================== */
function RadarCore() {
  const cx = 66, cy = 66;
  const blips = TEAMS.map((t, i) => {
    const a = (i / TEAMS.length) * Math.PI * 2 - Math.PI / 2;
    const r = 26 + (i % 3) * 12;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, c: t.color, d: i * 0.4 };
  });
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="sweep" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.cyan} stopOpacity="0.0" />
          <stop offset="80%" stopColor={C.cyan} stopOpacity="0.0" />
          <stop offset="100%" stopColor={C.cyan} stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {[20, 38, 56].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth="1" />
      ))}
      <line x1={cx - 60} y1={cy} x2={cx + 60} y2={cy} stroke={C.line} strokeWidth="0.6" />
      <line x1={cx} y1={cy - 60} x2={cx} y2={cy + 60} stroke={C.line} strokeWidth="0.6" />
      <g style={{ transformOrigin: "66px 66px", animation: "radar 4.5s linear infinite" }}>
        <path d={`M${cx},${cy} L${cx + 56},${cy} A56,56 0 0,1 ${cx + 56 * Math.cos(-0.9)},${cy + 56 * Math.sin(-0.9)} Z`} fill="url(#sweep)" />
        <line x1={cx} y1={cy} x2={cx + 56} y2={cy} stroke={C.cyan} strokeWidth="1.4" opacity="0.8" />
      </g>
      {blips.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r="3" fill={b.c} className="pulse" style={{ animationDelay: b.d + "s" }} />
      ))}
      <circle cx={cx} cy={cy} r="3.5" fill={C.cyan} />
    </svg>
  );
}

/* ====================== AGENT NODE ====================== */
function AgentNode({ name, role, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.line}`, borderRadius: 3, padding: "7px 11px" }}>
      <span style={{ position: "relative", width: 8, height: 8 }}>
        <span className="pulse" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: MONO }}>{name}</div>
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 1 }}>{role}</div>
      </div>
    </div>
  );
}
function StatusPill({ status }) {
  const map = {
    idea:      { c: C.violet, t: "Idea",    I: Lightbulb },
    scripted:  { c: C.orange, t: "Ready",   I: Hammer },
    rendering: { c: C.pink,   t: "Render",  I: Video },
    scheduled: { c: C.blue,   t: "Queued",  I: Clock },
    posted:    { c: C.green,  t: "Live",    I: Check },
  };
  const m = map[status] || map.idea, I = m.I;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.c + "1c", color: m.c, border: `1px solid ${m.c}55`, borderRadius: 3, padding: "4px 9px", fontSize: 10.5, fontWeight: 700, fontFamily: MONO, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
      <I size={11} /> {m.t}
    </span>
  );
}
function FieldRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginTop: 3 }}>{value}</div>
    </div>
  );
}

/* ====================== MAIN ====================== */
export default function EmpireOS() {
  const [tab, setTab] = useState("command");
  const [pages] = useState(SEED_PAGES);
  const [ideas, setIdeas] = useState([]);
  const [trends, setTrends] = useState("");
  const [growth, setGrowth] = useState(null);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState({});
  const [sparkNiche, setSparkNiche] = useState(SEED_PAGES[0].niche);
  const [log, setLog] = useState([{ t: nowt(), agent: "Atlas", team: C.gold, msg: "Empire OS online. 8 pages · worker mode." }]);

  const totalRev       = pages.reduce((s, p) => s + p.revenue, 0);
  const totalFollowers = pages.reduce((s, p) => s + p.followers, 0);
  const postsToday     = pages.reduce((s, p) => s + p.posts, 0);

  function nowt() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function pushLog(agent, team, msg) { setLog((L) => [{ t: nowt(), agent, team, msg }, ...L].slice(0, 40)); }
  const setB = (k, v) => setBusy((b) => ({ ...b, [k]: v }));

  /* ---- Atlas standup ---- */
  async function runStandup() {
    setB("standup", true); pushLog("Atlas", C.gold, "Running morning standup…");
    try {
      const { brief: txt } = await workerPost("/standup", {
        pageCount: pages.length,
        followersK: Math.round(totalFollowers / 1000),
        revMonth: totalRev,
        ideasInPipeline: ideas.length,
      });
      setBrief(txt); pushLog("Atlas", C.gold, "Briefing posted to Command.");
    } catch (e) { pushLog("Atlas", C.gold, `Standup failed: ${e.message}`); }
    setB("standup", false);
  }

  /* ---- Muse ideas ---- */
  async function runSpark() {
    setB("spark", true); pushLog("Muse", C.violet, `Brainstorming ideas for ${sparkNiche}…`);
    try {
      const { ideas: arr } = await workerPost("/ideas", { niche: sparkNiche });
      const newOnes = arr.map((x, i) => ({
        id: Date.now() + i, niche: sparkNiche, title: x.title, hook: x.hook,
        status: "idea", script: "", caption: "", hashtags: [],
      }));
      setIdeas((I) => [...newOnes, ...I]);
      pushLog("Muse", C.violet, `Added ${newOnes.length} ideas · ${sparkNiche}.`);
      setTab("pipeline");
    } catch (e) { pushLog("Muse", C.violet, `Idea gen failed: ${e.message}`); }
    setB("spark", false);
  }

  /* ---- Smith forge ---- */
  async function runForge(idea) {
    setB("forge" + idea.id, true); pushLog("Smith", C.orange, `Building package: "${idea.title}"`);
    try {
      const pkg = await workerPost("/forge", { niche: idea.niche, title: idea.title, hook: idea.hook });
      setIdeas((I) => I.map((x) => x.id === idea.id ? { ...x, status: "scripted", script: pkg.script, caption: pkg.caption, hashtags: pkg.hashtags || [] } : x));
      pushLog("Smith", C.orange, `"${idea.title}" production-ready.`);
    } catch (e) { pushLog("Smith", C.orange, `Production failed: ${e.message}`); }
    setB("forge" + idea.id, false);
  }

  /* ---- Edge TTS + Remotion render ---- */
  async function runRender(idea) {
    setB("render" + idea.id, true);
    pushLog("Smith", C.pink, `Rendering video for "${idea.title}"…`);
    setIdeas((I) => I.map((x) => x.id === idea.id ? { ...x, status: "rendering" } : x));
    try {
      // Step 1: Edge TTS voiceover
      pushLog("Smith", C.pink, "Edge TTS: generating voiceover…");
      const { audioPath } = await workerPost("/render/tts", { script: idea.script, ideaId: String(idea.id) });

      // Step 2: Remotion render (async — poll job)
      pushLog("Smith", C.pink, "Remotion: rendering video (30-90s)…");
      const { jobId } = await workerPost("/render/video", {
        ideaId: String(idea.id), title: idea.title, hook: idea.hook,
        script: idea.script, niche: idea.niche, audioPath,
      });
      const videoPath = await pollJob(jobId);

      setIdeas((I) => I.map((x) => x.id === idea.id ? { ...x, status: "scripted", videoPath } : x));
      pushLog("Smith", C.pink, `Video ready: ${videoPath}`);
    } catch (e) {
      setIdeas((I) => I.map((x) => x.id === idea.id ? { ...x, status: "scripted" } : x));
      pushLog("Smith", C.pink, `Render failed: ${e.message}`);
    }
    setB("render" + idea.id, false);
  }

  /* ---- Nova schedule ---- */
  async function runSchedule(idea) {
    setB("sched" + idea.id, true);
    try {
      const { slot } = await workerPost("/schedule", {
        ideaId: String(idea.id), platform: "tiktok",
        caption: idea.caption, hashtags: idea.hashtags, videoPath: idea.videoPath,
      });
      setIdeas((I) => I.map((x) => x.id === idea.id ? { ...x, status: "scheduled", slot } : x));
      pushLog("Nova", C.blue, `Scheduled "${idea.title}" → ${slot}.`);
    } catch (e) { pushLog("Nova", C.blue, `Schedule failed: ${e.message}`); }
    setB("sched" + idea.id, false);
  }

  function markPosted(idea) {
    setIdeas((I) => I.map((x) => x.id === idea.id ? { ...x, status: "posted" } : x));
    pushLog("Echo", C.blue, `Posted "${idea.title}". Live now.`);
  }

  /* ---- Scout radar ---- */
  async function runRadar() {
    setB("radar", true); pushLog("Scout", C.cyan, "Scanning live web for trends…");
    try {
      const { report } = await workerPost("/radar");
      setTrends(report); pushLog("Scout", C.cyan, "Trend report delivered.");
    } catch (e) { pushLog("Scout", C.cyan, `Scan failed: ${e.message}`); }
    setB("radar", false);
  }

  /* ---- Ledger vault ---- */
  async function runVault() {
    setB("vault", true); pushLog("Ledger", C.green, "Building growth plan…");
    try {
      const plan = await workerPost("/vault", { niches: pages.map((p) => p.niche), revMonth: totalRev });
      setGrowth(plan); pushLog("Ledger", C.green, "Growth plan ready in Vault.");
    } catch (e) { pushLog("Ledger", C.green, `Plan failed: ${e.message}`); }
    setB("vault", false);
  }

  const TABS = [
    { id: "command",  label: "Command",  icon: Crown },
    { id: "teams",    label: "Teams",    icon: Users },
    { id: "pages",    label: "Pages",    icon: BarChart3 },
    { id: "pipeline", label: "Pipeline", icon: FileText },
    { id: "radar",    label: "Trends",   icon: Radar },
    { id: "revenue",  label: "Revenue",  icon: DollarSign },
  ];

  const wrap = {
    background: C.bg0, color: C.text, fontFamily: "ui-sans-serif,system-ui,-apple-system,sans-serif",
    minHeight: 720, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.line}`,
    backgroundImage: `radial-gradient(circle at 50% -10%,rgba(34,211,238,0.08),transparent 55%),linear-gradient(rgba(120,160,220,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,220,0.035) 1px,transparent 1px)`,
    backgroundSize: "100% 100%,42px 42px,42px 42px",
  };

  return (
    <div style={wrap}>
      <style>{`
        .spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
        @keyframes radar{to{transform:rotate(360deg)}}
        .pulse{animation:pl 2.2s ease-in-out infinite}@keyframes pl{0%,100%{opacity:1}50%{opacity:.3}}
        .eos-btn{transition:box-shadow .15s,filter .15s}
        .eos-btn:hover:not(:disabled){box-shadow:0 0 16px var(--g);filter:brightness(1.18)}
        .eos-tab{transition:all .15s}
        .eos-tab:hover{color:${C.text}}
        .eos-row{transition:border-color .15s,background .15s}
        .eos-row:hover{border-color:${C.lineHot}!important}
        ::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-thumb{background:rgba(120,160,220,0.25);border-radius:3px}
        select.eos-sel{background:rgba(255,255,255,0.03);color:${C.text};border:1px solid ${C.line};border-radius:3px;padding:7px 10px;font-size:12px;font-family:${MONO}}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.line}`, display: "flex", gap: 22, alignItems: "center", background: "linear-gradient(180deg,rgba(16,22,40,0.5),transparent)" }}>
        <RadarCore />
        <div style={{ flex: 1 }}>
          <Eyebrow color={C.cyan}>◢ Mission control · faceless content network</Eyebrow>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -1, marginTop: 4 }}>EMPIRE<span style={{ color: C.cyan }}>·</span>OS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11.5, color: C.green, fontFamily: MONO }}>
            <span className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
            6 TEAMS · 15 AGENTS · WORKER {WORKER ? "CONNECTED" : "LOCAL"}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Stat label="Active pages"  value={pages.length} />
            <Stat label="Followers"     value={(totalFollowers / 1000).toFixed(0) + "K"} />
            <Stat label="Revenue / mo"  value={"$" + (totalRev / 1000).toFixed(1) + "K"} accent={C.green} />
            <Stat label="Queued today"  value={postsToday} accent={C.cyan} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, padding: "10px 16px", borderBottom: `1px solid ${C.line}`, overflowX: "auto" }}>
        {TABS.map((t) => {
          const Icon = t.icon, on = tab === t.id;
          return (
            <button key={t.id} className="eos-tab" onClick={() => setTab(t.id)} style={{
              position: "relative", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              background: on ? C.cyan + "16" : "transparent", color: on ? C.cyan : C.dim,
              border: `1px solid ${on ? C.cyan + "55" : "transparent"}`, borderRadius: 3,
              padding: "8px 14px", fontSize: 11.5, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.6,
              textTransform: "uppercase", cursor: "pointer", boxShadow: on ? `0 0 14px ${C.cyan}33` : "none",
            }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", minHeight: 470 }}>
        <div style={{ flex: 1, padding: 22, overflow: "auto", maxHeight: 580 }}>

          {/* ---- COMMAND ---- */}
          {tab === "command" && (
            <div>
              <SectionTitle eyebrow="CMD-01 · Atlas" color={C.gold} title="Command center" sub="Kick off the day in one click. Atlas runs the room." />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                <Btn onClick={runStandup} busy={busy.standup} color={C.gold}><Play size={13} /> Morning standup</Btn>
                <Btn onClick={runRadar}   busy={busy.radar}   color={C.cyan}><Search size={13} /> Scan trends</Btn>
                <Btn onClick={runVault}   busy={busy.vault}   color={C.green}><Rocket size={13} /> Growth plan</Btn>
              </div>

              {brief && (
                <Panel accent={C.gold} style={{ padding: 16, marginBottom: 18 }}>
                  <Eyebrow color={C.gold}>Atlas · morning briefing</Eyebrow>
                  <p style={{ margin: "9px 0 0", lineHeight: 1.65, fontSize: 14 }}>{brief}</p>
                </Panel>
              )}

              <Eyebrow>Team status grid</Eyebrow>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 10, marginTop: 10 }}>
                {TEAMS.map((tm) => {
                  const Icon = tm.icon;
                  return (
                    <Panel key={tm.id} accent={tm.color} bg={C.glass2} style={{ padding: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={15} color={tm.color} />
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{tm.name}</span>
                        <span className="pulse" style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 6, letterSpacing: 1 }}>{tm.code}</div>
                      <div style={{ fontSize: 11.5, color: C.dim, marginTop: 4, lineHeight: 1.4 }}>{tm.agents.map((a) => a.name).join(" · ")}</div>
                    </Panel>
                  );
                })}
              </div>

              <Panel accent={C.lineHot} style={{ marginTop: 18, padding: 13, borderStyle: "dashed" }}>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55 }}>
                  Worker endpoint: <span style={{ fontFamily: MONO, color: C.cyan }}>{WORKER || "(same origin)"}</span>. All Claude calls, Edge TTS renders, and Remotion video renders run server-side — your API key stays out of the browser.
                </div>
              </Panel>
            </div>
          )}

          {/* ---- TEAMS ---- */}
          {tab === "teams" && (
            <div>
              <SectionTitle eyebrow="Roster" color={C.blue} title="The teams" sub="Six squads, fifteen agents. Each does a real job." />
              <div style={{ display: "grid", gap: 11 }}>
                {TEAMS.map((tm) => {
                  const Icon = tm.icon;
                  return (
                    <Panel key={tm.id} accent={tm.color} style={{ padding: 15, borderLeft: `2px solid ${tm.color}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Icon size={17} color={tm.color} />
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{tm.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, letterSpacing: 1, marginLeft: 4 }}>{tm.code}</span>
                        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10.5, color: C.dim }}>{tm.agents.length} AGENT{tm.agents.length > 1 ? "S" : ""}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.dim, margin: "9px 0 12px", lineHeight: 1.5 }}>{tm.blurb}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {tm.agents.map((a) => <AgentNode key={a.name} name={a.name} role={a.role} color={tm.color} />)}
                      </div>
                    </Panel>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- PAGES ---- */}
          {tab === "pages" && (
            <div>
              <SectionTitle eyebrow="RCH-02 · Reach" color={C.violet} title="Pages" sub="Every page in the network, run by the Reach team." />
              <div style={{ display: "grid", gap: 9 }}>
                {pages.map((p) => (
                  <Panel key={p.id} accent={TIER[p.tier]} bg={C.glass2} brackets={false} style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 14, borderLeft: `2px solid ${TIER[p.tier]}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: 3, background: TIER[p.tier] + "1c", border: `1px solid ${TIER[p.tier]}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: TIER[p.tier], fontFamily: MONO }}>{p.tier}</div>
                    <div style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.niche}</div>
                      <div style={{ fontSize: 12, color: C.dim, fontFamily: MONO }}>{p.handle}</div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 64 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO }}>{(p.followers / 1000).toFixed(0)}K</div>
                      <Eyebrow>followers</Eyebrow>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 64 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.green, fontFamily: MONO }}>${p.revenue.toLocaleString()}</div>
                      <Eyebrow>per mo</Eyebrow>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 96 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.dim, marginBottom: 4 }}>{p.posts}/{p.target} POSTS</div>
                      <div style={{ width: 90, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: Math.min(100, (p.posts / p.target) * 100) + "%", height: "100%", background: p.posts >= p.target ? C.green : C.orange, boxShadow: `0 0 8px ${p.posts >= p.target ? C.green : C.orange}` }} />
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          )}

          {/* ---- PIPELINE ---- */}
          {tab === "pipeline" && (
            <div>
              <SectionTitle eyebrow="SPK-03 → FRG-05 → RCH-02" color={C.violet} title="Idea pipeline" sub="Spark → Forge (script+TTS+video) → Reach (schedule)" />
              <Panel accent={C.violet} style={{ padding: 13, marginBottom: 16, display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim, letterSpacing: 1, textTransform: "uppercase" }}>Brainstorm for</span>
                <select className="eos-sel" value={sparkNiche} onChange={(e) => setSparkNiche(e.target.value)}>
                  {pages.map((p) => <option key={p.id} value={p.niche}>{p.niche}</option>)}
                </select>
                <Btn onClick={runSpark} busy={busy.spark} color={C.violet}><Sparkles size={13} /> Generate 5 ideas</Btn>
              </Panel>

              {ideas.length === 0 && (
                <div style={{ textAlign: "center", padding: 44, color: C.faint, fontSize: 13, fontFamily: MONO }}>// NO IDEAS YET — PICK A NICHE AND LET MUSE COOK</div>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                {ideas.map((idea) => (
                  <Panel key={idea.id} accent={C.violet} style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <StatusPill status={idea.status} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{idea.title}</div>
                        <Eyebrow>{idea.niche}</Eyebrow>
                        <div style={{ fontSize: 13, color: C.text, marginTop: 8, fontStyle: "italic", borderLeft: `2px solid ${C.violet}66`, paddingLeft: 10 }}>"{idea.hook}"</div>

                        {idea.status !== "idea" && idea.script && (
                          <Panel accent={C.orange} bg={C.glass2} style={{ marginTop: 11, padding: 12 }}>
                            <FieldRow label="Script" value={idea.script} />
                            <FieldRow label="Caption" value={idea.caption} />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                              {idea.hashtags.map((h, i) => <span key={i} style={{ fontSize: 11, color: C.cyan, background: C.cyan + "16", padding: "2px 8px", borderRadius: 2, fontFamily: MONO }}>{h}</span>)}
                            </div>
                          </Panel>
                        )}
                        {idea.videoPath && (
                          <div style={{ marginTop: 8, fontSize: 12, color: C.pink, fontFamily: MONO, display: "flex", gap: 6, alignItems: "center" }}>
                            <Video size={12} /> {idea.videoPath}
                          </div>
                        )}
                        {idea.slot && (
                          <div style={{ marginTop: 9, fontSize: 12, color: C.blue, display: "flex", alignItems: "center", gap: 6, fontFamily: MONO }}>
                            <Calendar size={13} /> {idea.slot}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
                          {idea.status === "idea" && (
                            <Btn onClick={() => runForge(idea)} busy={busy["forge" + idea.id]} color={C.orange}><Hammer size={12} /> Write script</Btn>
                          )}
                          {idea.status === "scripted" && !idea.videoPath && (
                            <Btn onClick={() => runRender(idea)} busy={busy["render" + idea.id]} color={C.pink}><Video size={12} /> Render video</Btn>
                          )}
                          {idea.status === "scripted" && (
                            <Btn onClick={() => runSchedule(idea)} busy={busy["sched" + idea.id]} color={C.blue}><Calendar size={12} /> Schedule</Btn>
                          )}
                          {idea.status === "rendering" && (
                            <span style={{ fontSize: 12, color: C.pink, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO }}><Loader2 size={13} className="spin" /> Rendering…</span>
                          )}
                          {idea.status === "scheduled" && (
                            <Btn onClick={() => markPosted(idea)} color={C.green}><Check size={12} /> Mark posted</Btn>
                          )}
                          {idea.status === "posted" && (
                            <span style={{ fontSize: 12, color: C.green, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO }}><Check size={13} /> LIVE</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          )}

          {/* ---- RADAR / VAULT ---- */}
          {tab === "radar" && (
            <div>
              <SectionTitle eyebrow="RDR-04 · Scout" color={C.cyan} title="Trend radar" sub="Scout searches the live web for what's winning right now." />
              <Btn onClick={runRadar} busy={busy.radar} color={C.cyan}><Search size={13} /> Scan TikTok / Reels / Shorts</Btn>
              {trends ? (
                <Panel accent={C.cyan} style={{ marginTop: 14, padding: 16 }}>
                  <Eyebrow color={C.cyan}>Scout · live trend report</Eyebrow>
                  <p style={{ margin: "9px 0 0", lineHeight: 1.7, fontSize: 14, whiteSpace: "pre-wrap" }}>{trends}</p>
                </Panel>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: C.faint, fontSize: 13, fontFamily: MONO }}>// HIT SCAN TO PULL LATEST NICHE + FORMAT TRENDS</div>
              )}
              <div style={{ marginTop: 22 }}>
                <SectionTitle eyebrow="VLT-06 · Ledger" color={C.green} title="Growth plan" sub="Ledger maps the next moves to make more money." />
                <Btn onClick={runVault} busy={busy.vault} color={C.green}><Rocket size={13} /> Build growth plan</Btn>
                {growth && (
                  <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
                    <div>
                      <Eyebrow color={C.green}>Launch next</Eyebrow>
                      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        {(growth.launches || []).map((l, i) => (
                          <Panel key={i} accent={C.green} bg={C.glass2} style={{ padding: 12, borderLeft: `2px solid ${C.green}` }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{l.niche} <span style={{ color: C.green, fontSize: 12, fontFamily: MONO }}>· {l.platform}</span></div>
                            <div style={{ fontSize: 12, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>{l.why}</div>
                          </Panel>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Eyebrow color={C.green}>Money moves</Eyebrow>
                      <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
                        {(growth.moves || []).map((m, i) => (
                          <Panel key={i} bg={C.glass2} accent={C.green} brackets={false} style={{ padding: "10px 12px", display: "flex", gap: 9, borderLeft: `2px solid ${C.green}` }}>
                            <DollarSign size={15} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 13, lineHeight: 1.5 }}>{m}</span>
                          </Panel>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- REVENUE ---- */}
          {tab === "revenue" && (
            <div>
              <SectionTitle eyebrow="Telemetry" color={C.green} title="Revenue" sub="Where the money comes from across the network." />
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <Stat label="Monthly total"  value={"$" + totalRev.toLocaleString()} accent={C.green} />
                <Stat label="Annual run-rate" value={"$" + (totalRev * 12 / 1000).toFixed(0) + "K"} accent={C.green} />
                <Stat label="Avg / page"     value={"$" + Math.round(totalRev / pages.length).toLocaleString()} />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[...pages].sort((a, b) => b.revenue - a.revenue).map((p) => {
                  const max = Math.max(...pages.map((x) => x.revenue));
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 128, fontSize: 12.5, color: C.text }}>{p.niche}</div>
                      <div style={{ flex: 1, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden", border: `1px solid ${C.line}` }}>
                        <div style={{ width: (p.revenue / max) * 100 + "%", height: "100%", background: TIER[p.tier], borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, boxShadow: `0 0 14px ${TIER[p.tier]}77` }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: C.bg0, fontFamily: MONO }}>${p.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* TELEMETRY FEED */}
        <div style={{ width: 252, borderLeft: `1px solid ${C.line}`, padding: 16, overflow: "auto", maxHeight: 580, background: "linear-gradient(180deg,rgba(14,20,36,0.4),transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <Radio size={13} color={C.cyan} />
            <Eyebrow color={C.cyan}>Telemetry</Eyebrow>
            <span className="pulse" style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} />
          </div>
          <div style={{ display: "grid", gap: 11 }}>
            {log.map((l, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: l.team, boxShadow: `0 0 5px ${l.team}` }} />
                  <span style={{ fontWeight: 700, color: l.team, fontFamily: MONO, fontSize: 11.5 }}>{l.agent}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: C.faint, fontFamily: MONO }}>{l.t}</span>
                </div>
                <div style={{ color: C.dim, paddingLeft: 11, marginTop: 2 }}>{l.msg}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
