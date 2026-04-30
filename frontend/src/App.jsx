import { useState, useEffect, useRef, useCallback } from "react";

// algorithm engine
function calcStrength(a, b) {
  let s = 0;
  if (a.roommate && a.roommate === b.name) s += 4;
  for (const i of (a.previousInternships || [])) {
    if (i !== "None" && (b.previousInternships || []).includes(i)) s += 3;
  }
  if (a.major && a.major === b.major) s += 2;
  if (a.age === b.age) s += 1;
  return s;
}

function buildGraph(students) {
  const adj = {};
  for (const s of students) adj[s.name] = [];
  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      const w = calcStrength(students[i], students[j]);
      if (w > 0) {
        adj[students[i].name].push({ neighbor: students[j].name, weight: w });
        adj[students[j].name].push({ neighbor: students[i].name, weight: w });
      }
    }
  }
  return adj;
}

function galeShapley(students) {
  const map = {}, rm = {}, propIdx = {};
  for (const s of students) { map[s.name] = s; rm[s.name] = null; propIdx[s.name] = 0; }
  const queue = students.filter(s => s.roommatePreferences.length > 0).map(s => s.name);
  let iters = 0;
  while (queue.length > 0 && iters++ < 2000) {
    const pName = queue.shift();
    if (rm[pName]) continue;
    const p = map[pName];
    const idx = propIdx[pName];
    if (idx >= p.roommatePreferences.length) continue;
    const tName = p.roommatePreferences[idx];
    propIdx[pName]++;
    const t = map[tName];
    if (!t) { if (propIdx[pName] < p.roommatePreferences.length) queue.push(pName); continue; }
    if (!rm[tName]) {
      rm[pName] = tName; rm[tName] = pName;
    } else {
      const cur = rm[tName];
      const curRank = t.roommatePreferences.indexOf(cur);
      const pRank = t.roommatePreferences.indexOf(pName);
      if (pRank !== -1 && (curRank === -1 || pRank < curRank)) {
        rm[cur] = null; rm[pName] = tName; rm[tName] = pName;
        if (propIdx[cur] < map[cur].roommatePreferences.length) queue.push(cur);
      } else {
        if (propIdx[pName] < p.roommatePreferences.length) queue.push(pName);
      }
    }
  }
  return rm;
}

function dijkstra(students, graph, startName, targetCompany) {
  const dist = {}, prev = {};
  for (const s of students) dist[s.name] = Infinity;
  dist[startName] = 0;
  const sMap = {};
  for (let i = 0; i < students.length; i++) sMap[i] = students[i].name;
  const idxMap = {};
  for (let i = 0; i < students.length; i++) idxMap[students[i].name] = i;
  const pq = [[0, startName]];
  const visited = new Set();
  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    const st = students.find(s => s.name === u);
    if (u !== startName && st?.previousInternships?.includes(targetCompany)) {
      const path = []; let cur = u;
      while (cur) { path.unshift(cur); cur = prev[cur]; }
      return path;
    }
    for (const edge of (graph[u] || [])) {
      if (visited.has(edge.neighbor)) continue;
      const w = Math.max(0, 10 - edge.weight);
      const nd = d + w;
      if (nd < dist[edge.neighbor]) {
        dist[edge.neighbor] = nd; prev[edge.neighbor] = u;
        pq.push([nd, edge.neighbor]);
      }
    }
  }
  return [];
}

// Pod Formation - mirrors PodFormation.java max-heap greedy algorithm exactly
function formPods(students, graph, podSize) {
  const unvisited = new Set(students.map(s => s.name));
  const allPods = [];
  let currentPod = [];
  while (unvisited.size > 0) {
    const startName = unvisited.values().next().value;
    // max-heap: highest weight neighbor explored first (mirrors Java PriorityQueue max-heap)
    let pq = [{ weight: 0, name: startName }];
    while (pq.length > 0) {
      pq.sort((a, b) => b.weight - a.weight); // descending = max first
      const { name: u } = pq.shift();
      if (!unvisited.has(u)) continue;
      unvisited.delete(u);
      currentPod.push(u);
      if (currentPod.length === podSize) {
        allPods.push([...currentPod]);
        currentPod = [];
      }
      for (const edge of (graph[u] || [])) {
        if (unvisited.has(edge.neighbor)) {
          pq.push({ weight: edge.weight, name: edge.neighbor });
        }
      }
    }
  }
  if (currentPod.length > 0) allPods.push(currentPod);
  return allPods;
}

// test case data to simulate
const TEST_CASES = {
  1: {
    label: "TC1: Mutual Groups",
    // desc: "4 students w/ full mutual prefs + isolated pair. Tests standard matching & graph components."
    desc: "",
    students: [
      { name:"Alice",   age:20, gender:"Female", year:2, major:"Computer Science", gpa:3.5, roommatePreferences:["Bob","Charlie","Frank"], previousInternships:["Google"] },
      { name:"Bob",     age:21, gender:"Male",   year:3, major:"Computer Science", gpa:3.7, roommatePreferences:["Alice","Charlie","Frank"], previousInternships:["Google","Microsoft"] },
      { name:"Charlie", age:20, gender:"Male",   year:2, major:"Mathematics",       gpa:3.2, roommatePreferences:["Alice","Bob","Frank"],    previousInternships:["None"] },
      { name:"Frank",   age:23, gender:"Male",   year:3, major:"Chemistry",         gpa:3.1, roommatePreferences:["Alice","Bob","Charlie"],  previousInternships:[] },
      { name:"Dana",    age:22, gender:"Female", year:4, major:"Biology",            gpa:3.8, roommatePreferences:["Evan"],                  previousInternships:["Pfizer"] },
      { name:"Evan",    age:22, gender:"Male",   year:4, major:"Biology",            gpa:3.6, roommatePreferences:["Dana"],                  previousInternships:["Moderna","Pfizer"] },
    ]
  },
  2: {
    label: "TC2: Referral Chain",
    desc: "",
    students: [
      { name:"Greg",  age:24, gender:"Male",   year:4, major:"Economics", gpa:3.4, roommatePreferences:["Helen","Ivy"], previousInternships:["InternshipA"] },
      { name:"Helen", age:24, gender:"Female", year:4, major:"Economics", gpa:3.5, roommatePreferences:["Greg","Ivy"],  previousInternships:["InternshipB"] },
      { name:"Ivy",   age:25, gender:"Female", year:4, major:"Economics", gpa:3.8, roommatePreferences:["Helen","Greg"],previousInternships:["DummyCompany"] },
    ]
  },
  3: {
    label: "TC3: Empty Prefs",
    //     desc: "One student has empty roommatePreferences. Jack/Kim pair; Leo stays unpaired.",
    desc: "",
    students: [
      { name:"Jack", age:19, gender:"Male",   year:1, major:"History", gpa:3.0, roommatePreferences:["Kim"], previousInternships:["MuseumIntern"] },
      { name:"Kim",  age:19, gender:"Female", year:1, major:"History", gpa:3.2, roommatePreferences:["Jack"],previousInternships:["MuseumIntern"] },
      { name:"Leo",  age:20, gender:"Male",   year:1, major:"History", gpa:3.5, roommatePreferences:[],     previousInternships:["None"] },
    ]
  },
  4: {
    label: "TC4: Disconnected Graph",
    // desc: "Two fully disconnected components with zero shared attributes. Tests isolated nodes."
    desc: "",
    students: [
      { name:"Zara",  age:18, gender:"Female", year:1, major:"Physics",  gpa:3.9, roommatePreferences:["Omar"], previousInternships:["LabCorp"] },
      { name:"Omar",  age:18, gender:"Male",   year:1, major:"Physics",  gpa:3.7, roommatePreferences:["Zara"], previousInternships:["LabCorp"] },
      { name:"Quinn", age:30, gender:"Non-binary", year:5, major:"Law",  gpa:3.1, roommatePreferences:["Rex"],  previousInternships:["LawFirm"] },
      { name:"Rex",   age:30, gender:"Male",   year:5, major:"Law",      gpa:3.3, roommatePreferences:["Quinn"],previousInternships:["LawFirm"] },
    ]
  },
  5: {
    label: "TC5: Cyclic Prefs",
    // desc: "Cyclic roommate prefs: A→B→C→A. Tests algorithm stability with no clear stable pair."
    desc: "",
    students: [
      { name:"Mia",   age:22, gender:"Female", year:3, major:"Art",    gpa:3.4, roommatePreferences:["Noel","Pax"],  previousInternships:["Museum"] },
      { name:"Noel",  age:22, gender:"Male",   year:3, major:"Music",  gpa:3.6, roommatePreferences:["Pax","Mia"],   previousInternships:["Orchestra"] },
      { name:"Pax",   age:22, gender:"Female", year:3, major:"Theatre",gpa:3.2, roommatePreferences:["Mia","Noel"],  previousInternships:["PlayCo"] },
      { name:"Skyler",age:22, gender:"Male",   year:3, major:"Film",   gpa:3.8, roommatePreferences:["Mia"],         previousInternships:["StudioA","Museum"] },
    ]
  },
  6: {
    label: "TC6: Single Student",
    // desc: "Only one student. Tests isolated node edge case — no edges, no roommate, no path."
    desc: "",
    students: [
      { name:"Solo", age:21, gender:"Male", year:2, major:"Philosophy", gpa:3.3, roommatePreferences:[], previousInternships:["None"] },
    ]
  },
};

// color choices

const NODE_COLORS = ["#e05c5c","#e09a2e","#4cad63","#4a90d9","#9b6dd6","#d9726b","#2eb8a0","#d45b8a","#7aad3a","#e07a35"];
const EDGE_COLOR = "rgba(120,130,160,0.35)";
const PATH_COLOR = "#f5c842";

// graph canves

function GraphCanvas({ students, graph, roommates, referralPath, selectedName, onSelect }) {
  const canvasRef = useRef(null);
  const posRef = useRef({});
  const dragRef = useRef(null);
  const [, forceRender] = useState(0);
  const nameToIdx = useRef({});

  // initialize circular positions
  useEffect(() => {
    if (!students.length) return;
    const cx = 300, cy = 200, r = students.length === 1 ? 0 : 155;
    const pos = {};
    students.forEach((s, i) => {
      const a = (2 * Math.PI * i / students.length) - Math.PI / 2;
      pos[s.name] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    posRef.current = pos;
    nameToIdx.current = Object.fromEntries(students.map((s, i) => [s.name, i]));
    forceRender(n => n + 1);
  }, [students]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const pos = posRef.current;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Edges
    const pathSet = new Set();
    for (let i = 0; i < referralPath.length - 1; i++) pathSet.add(`${referralPath[i]}|${referralPath[i+1]}`);

    for (const [name, edges] of Object.entries(graph)) {
      for (const e of edges) {
        if (name > e.neighbor) continue;
        const a = pos[name], b = pos[e.neighbor];
        if (!a || !b) continue;
        const inPath = pathSet.has(`${name}|${e.neighbor}`) || pathSet.has(`${e.neighbor}|${name}`);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = inPath ? PATH_COLOR : EDGE_COLOR;
        ctx.lineWidth = inPath ? 3.5 : 1.5;
        ctx.stroke();
        // Weight label
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = inPath ? PATH_COLOR : "rgba(160,170,200,0.9)";
        ctx.fillText(e.weight, mx, my - 7);
      }
    }

    // Roommate dashed rings
    for (const s of students) {
      if (!roommates[s.name]) continue;
      const p = pos[s.name];
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,180,60,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Nodes
    students.forEach((s, i) => {
      const p = pos[s.name];
      if (!p) return;
      const isSelected = s.name === selectedName;
      const inPath = referralPath.includes(s.name);
      const color = NODE_COLORS[i % NODE_COLORS.length];
      const r = isSelected ? 21 : 17;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 7, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(245,200,66,0.18)";
        ctx.fill();
      }
      if (inPath && !isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 7, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(245,200,66,0.12)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#f5c842" : inPath ? "#f5c842" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = isSelected ? 3 : inPath ? 2.5 : 1.5;
      ctx.stroke();

      ctx.font = `bold ${r >= 20 ? 11 : 10}px 'Courier New',monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(s.name.slice(0, 6), p.x, p.y);
    });
  }, [students, graph, referralPath, selectedName, roommates]);

  useEffect(() => { draw(); });

  const hitTest = (x, y) => {
    for (const s of students) {
      const p = posRef.current[s.name];
      if (p && Math.hypot(x - p.x, y - p.y) < 24) return s.name;
    }
    return null;
  };

  const onMouseDown = e => {
    const r = canvasRef.current.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (hit) { dragRef.current = hit; onSelect(hit); }
  };
  const onMouseMove = e => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (dragRef.current) {
      posRef.current[dragRef.current] = { x, y };
      forceRender(n => n + 1);
    }
    canvasRef.current.style.cursor = hitTest(x, y) ? "grab" : "default";
  };
  const onMouseUp = () => { dragRef.current = null; };

  return (
    <canvas ref={canvasRef} width={600} height={400}
      style={{ width:"100%", height:"auto", borderRadius:10, background:"rgba(8,10,18,0.7)", border:"1px solid rgba(255,255,255,0.07)", display:"block" }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />
  );
}


const SH = ({ icon, title }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"rgba(180,185,210,0.8)", textTransform:"uppercase" }}>{title}</span>
  </div>
);


const Pill = ({ label, color = "rgba(255,255,255,0.08)", textColor = "rgba(200,210,230,0.9)" }) => (
  <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:20, background:color, color:textColor, fontSize:11, marginRight:4, marginBottom:4 }}>{label}</span>
);


const Card = ({ children, accent, style = {} }) => (
  <div style={{ background:"rgba(22,26,42,0.9)", border:`1px solid ${accent || "rgba(255,255,255,0.08)"}`, borderRadius:12, padding:18, ...style }}>
    {children}
  </div>
);


export default function App() {
  const [tcKey, setTcKey] = useState(1);
  const [students, setStudents] = useState([]);
  const [graph, setGraph] = useState({});
  const [roommates, setRoommates] = useState({});
  const [referralPath, setReferralPath] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [targetCompany, setTargetCompany] = useState("");
  const [startStudent, setStartStudent] = useState("");
  const [activeTab, setActiveTab] = useState("graph");
  const [chatLog, setChatLog] = useState([]);
  const [friendLog, setFriendLog] = useState([]);
  const [referralError, setReferralError] = useState("");
  const [podSize, setPodSize] = useState(2);
  const [pods, setPods] = useState([]);

  const loadCase = useCallback((key) => {
    const tc = TEST_CASES[key];
    const base = tc.students.map(s => ({ ...s }));
    const rm = galeShapley(base);
    const withRm = base.map(s => ({ ...s, roommate: rm[s.name] }));
    const g = buildGraph(withRm);
    setStudents(withRm);
    setGraph(g);
    setRoommates(rm);
    setReferralPath([]);
    setSelectedName(null);
    setTargetCompany("");
    setStartStudent("");
    setReferralError("");
    setPods(formPods(withRm, g, podSize));
    // simulate FriendRequestThread + ChatThread
    const fl = [], cl = [];
    const seen = new Set();
    let threadNum = 1;
    for (const s of withRm) {
      for (const edge of (g[s.name] || [])) {
        const key = [s.name, edge.neighbor].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const a = s.name, b = edge.neighbor;
        fl.push(`${a} sent a friend request to ${b} [Thread: pool-1-thread-${threadNum++}]`);
        fl.push(`${b} sent a friend request to ${a} [Thread: pool-1-thread-${threadNum++}]`);
        cl.push(`[${a} -> ${b}]: Hello there! [Thread: pool-1-thread-${threadNum++}]`);
        cl.push(`[${b} -> ${a}]: Hi back! [Thread: pool-1-thread-${threadNum++}]`);
      }
    }
    setFriendLog(fl);
    setChatLog(cl);
  }, []);

  useEffect(() => { loadCase(tcKey); }, [tcKey, loadCase]);

  // recompute pods when pod size changes without reloading everything
  useEffect(() => {
    if (students.length > 0) setPods(formPods(students, graph, podSize));
  }, [podSize]);

  const runReferral = () => {
    setReferralError("");
    setReferralPath([]);
    if (!startStudent || !targetCompany.trim()) { setReferralError("Select a start student and enter a company name."); return; }
    const path = dijkstra(students, graph, startStudent, targetCompany.trim());
    if (path.length === 0) setReferralError(`No referral path found from ${startStudent} to anyone at "${targetCompany}".`);
    else setReferralPath(path);
  };

  const sel = students.find(s => s.name === selectedName);
  const selIdx = students.findIndex(s => s.name === selectedName);
  const selColor = selIdx >= 0 ? NODE_COLORS[selIdx % NODE_COLORS.length] : "#888";
  const allCompanies = [...new Set(students.flatMap(s => s.previousInternships || []).filter(i => i && i !== "None"))];

  const tabs = [
    { id:"graph",     label:"Graph",         icon:"" },
    { id:"roommates", label:"Roommates",      icon:"" },
    { id:"pods",      label:"Pod Formation",  icon:"" },
    { id:"referral",  label:"Referral Path",  icon:"" },
    { id:"friends",   label:"Friends & Chat", icon:"" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#080a12", color:"#cdd2e8", fontFamily:"'Courier New', Courier, monospace", overflowX:"hidden" }}>
      {/* HEADER */}
      <div style={{ background:"linear-gradient(180deg,rgba(20,24,40,1) 0%,rgba(8,10,18,0) 100%)", padding:"22px 28px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, letterSpacing:"0.15em", color:"#f5c842", lineHeight:1 }}>LONGHORN NETWORK</div>
            <div style={{ fontSize:11, letterSpacing:"0.35em", color:"rgba(180,190,220,0.5)", marginTop:2 }}></div>
          </div>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {Object.entries(TEST_CASES).map(([k, tc]) => (
              <button key={k} onClick={() => setTcKey(+k)}
                title={tc.desc}
                style={{ padding:"6px 13px", background: tcKey === +k ? "#f5c842" : "rgba(255,255,255,0.06)", color: tcKey === +k ? "#0a0c14" : "rgba(200,210,230,0.75)", border:`1px solid ${tcKey === +k ? "#f5c842" : "rgba(255,255,255,0.1)"}`, borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:"inherit", fontWeight: tcKey === +k ? 700 : 400, letterSpacing:"0.05em", transition:"all 0.15s" }}>
                {tc.label}
              </button>
            ))}
          </div>
        </div>
        {/* test case description */}
        <div style={{ maxWidth:1180, margin:"10px auto 0", fontSize:12, color:"rgba(160,170,200,0.6)", fontStyle:"italic" }}>
          {TEST_CASES[tcKey].desc}
        </div>
      </div>

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"20px 20px 40px" }}>
        {/* STAT STRIP */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:20 }}>
          {[
            { label:"Students", val: students.length },
            { label:"Graph Edges", val: Object.values(graph).reduce((a,e) => a + e.length, 0) / 2 },
            { label:"Roommate Pairs", val: Object.values(roommates).filter(Boolean).length / 2 },
            { label:"Unpaired", val: students.filter(s => s.roommatePreferences.length > 0 && !roommates[s.name]).length },
            { label:"Companies", val: allCompanies.length },
          ].map(({ label, val }) => (
            <div key={label} style={{ background:"rgba(22,26,42,0.8)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:"rgba(160,170,200,0.55)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:"#f5c842" }}>{Math.round(val)}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:2, marginBottom:20, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding:"10px 18px", background: activeTab === t.id ? "rgba(245,200,66,0.08)" : "transparent", color: activeTab === t.id ? "#f5c842" : "rgba(160,170,200,0.6)", border:"none", borderBottom: activeTab === t.id ? "2px solid #f5c842" : "2px solid transparent", cursor:"pointer", fontSize:12, fontFamily:"inherit", letterSpacing:"0.08em", fontWeight: activeTab === t.id ? 700 : 400, transition:"all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Graph Tab */}
        {activeTab === "graph" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 310px", gap:18 }}>
            <div>
              <div style={{ marginBottom:8, fontSize:11, color:"rgba(150,160,190,0.5)", letterSpacing:"0.08em" }}></div>
              <GraphCanvas students={students} graph={graph} roommates={roommates} referralPath={referralPath} selectedName={selectedName} onSelect={setSelectedName} />
              <div style={{ marginTop:10, display:"flex", gap:18, flexWrap:"wrap", fontSize:11, color:"rgba(140,150,180,0.6)" }}>
                <span>── edge (weight)</span>
                <span style={{ color:"rgba(255,180,60,0.7)" }}>○· · roommate ring</span>
                <span style={{ color:"#f5c842" }}>●  selected / path</span>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Adjacency list */}
              <Card>
                <SH icon="⬡" title="Adjacency List" />
                <div style={{ maxHeight:280, overflowY:"auto" }}>
                  {students.length === 0 && <div style={{ color:"rgba(160,170,200,0.4)", fontSize:12 }}>No data</div>}
                  {students.map((s, i) => (
                    <div key={s.name} style={{ marginBottom:10, cursor:"pointer" }} onClick={() => setSelectedName(s.name)}>
                      <div style={{ color: NODE_COLORS[i % NODE_COLORS.length], fontWeight:700, fontSize:12, marginBottom:2 }}>{s.name}</div>
                      {(graph[s.name] || []).length === 0
                        ? <div style={{ color:"rgba(140,150,180,0.4)", fontSize:11, marginLeft:10 }}>isolated node</div>
                        : (graph[s.name] || []).map(e => (
                          <div key={e.neighbor} style={{ fontSize:11, color:"rgba(160,170,200,0.65)", marginLeft:10, lineHeight:1.6 }}>
                            → {e.neighbor} <span style={{ color:"#f5c842" }}>({e.weight})</span>
                          </div>
                        ))
                      }
                    </div>
                  ))}
                </div>
              </Card>

              {/* Selected student info */}
              {sel ? (
                <Card accent={selColor + "44"}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:selColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, color:"#fff", flexShrink:0 }}>{sel.name[0]}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:"#fff" }}>{sel.name}</div>
                      <div style={{ fontSize:11, color:"rgba(160,170,200,0.6)" }}>{sel.gender} · Age {sel.age} · Yr {sel.year} · GPA {sel.gpa}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, display:"flex", flexDirection:"column", gap:7 }}>
                    <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Major: </span>{sel.major}</div>
                    <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Roommate: </span><span style={{ color: roommates[sel.name] ? "#f0a040" : "rgba(160,170,200,0.4)" }}>{roommates[sel.name] || "None"}</span></div>
                    <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Internships: </span>{(sel.previousInternships || []).join(", ") || "None"}</div>
                    <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Preferences: </span>{sel.roommatePreferences.length ? sel.roommatePreferences.join(", ") : "None"}</div>
                    <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Strength to others: </span>
                      {(graph[sel.name] || []).map(e => `${e.neighbor}(${e.weight})`).join(", ") || "None"}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div style={{ textAlign:"center", color:"rgba(160,170,200,0.35)", fontSize:12, padding:"20px 0" }}>Click a node to inspect</div>
                </Card>
              )}
            </div>
          </div>
        )}


        {/* Roommate Tab */}
        {activeTab === "roommates" && (
          <div>
            <SH icon="" title="Gale-Shapley Stable Matching Results" />
            {students.length === 0 && <div style={{ color:"rgba(160,170,200,0.4)" }}>No students loaded.</div>}

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:14, marginBottom:24 }}>
              {students.map((s, i) => {
                const paired = !!roommates[s.name];
                const hasPrefs = s.roommatePreferences.length > 0;
                return (
                  <Card key={s.name} accent={paired ? "rgba(240,160,64,0.3)" : hasPrefs ? "rgba(220,80,80,0.25)" : "rgba(255,255,255,0.06)"}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:NODE_COLORS[i % NODE_COLORS.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#fff", flexShrink:0 }}>{s.name[0]}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#dde3f0" }}>{s.name}</div>
                        <div style={{ fontSize:11, color:"rgba(160,170,200,0.55)" }}>{s.major} · GPA {s.gpa}</div>
                      </div>
                      <div style={{ marginLeft:"auto", fontSize:18 }}>
                        {paired ? "🏠" : hasPrefs ? "⏳" : "—"}
                      </div>
                    </div>
                    <div style={{ fontSize:12, display:"flex", flexDirection:"column", gap:6 }}>
                      <div>
                        <span style={{ color:"rgba(160,170,200,0.5)" }}>Roommate: </span>
                        {paired
                          ? <span style={{ color:"#f0a040", fontWeight:700 }}>{roommates[s.name]}</span>
                          : <span style={{ color: hasPrefs ? "rgba(220,100,100,0.8)" : "rgba(160,170,200,0.35)" }}>
                              {hasPrefs ? "Unpaired" : "No preferences"}
                            </span>
                        }
                      </div>
                      <div>
                        <span style={{ color:"rgba(160,170,200,0.5)" }}>Prefers: </span>
                        {s.roommatePreferences.length
                          ? s.roommatePreferences.map(p => (
                            <Pill key={p} label={p} color={roommates[s.name] === p ? "rgba(240,160,64,0.2)" : "rgba(255,255,255,0.07)"} textColor={roommates[s.name] === p ? "#f0a040" : "rgba(190,200,220,0.8)"} />
                          ))
                          : <span style={{ color:"rgba(160,170,200,0.3)" }}>None</span>
                        }
                      </div>
                      <div>
                        <span style={{ color:"rgba(160,170,200,0.5)" }}>Internships: </span>
                        {(s.previousInternships||[]).join(", ")||"None"}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Summary */}
            <Card>
              <SH icon="" title="Matching Summary" />
              <div style={{ display:"flex", gap:24, flexWrap:"wrap", fontSize:13 }}>
                <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Total pairs: </span><span style={{ color:"#f5c842", fontWeight:700 }}>{Object.values(roommates).filter(Boolean).length / 2}</span></div>
                <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Unpaired (had prefs): </span><span style={{ color:"rgba(220,100,100,0.85)", fontWeight:700 }}>{students.filter(s => s.roommatePreferences.length > 0 && !roommates[s.name]).length}</span></div>
                <div><span style={{ color:"rgba(160,170,200,0.5)" }}>No prefs: </span><span style={{ color:"rgba(160,170,200,0.5)", fontWeight:700 }}>{students.filter(s => s.roommatePreferences.length === 0).length}</span></div>
              </div>
            </Card>
          </div>
        )}

        {/* Pod Formation Tab */}
        {activeTab === "pods" && (
          <div>
            <SH icon="" title="Pod Formation : Prim's Max-Heap Greedy Algorithm" />
            <div style={{ fontSize:12, color:"rgba(160,170,200,0.45)", marginBottom:18, lineHeight:1.6 }}>
                          </div>

            {/* Pod size control */}
            <Card style={{ marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:10, color:"rgba(160,170,200,0.5)", letterSpacing:"0.1em", marginBottom:6 }}>POD SIZE</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[2,3,4].map(n => (
                      <button key={n} onClick={() => { setPodSize(n); setPods(formPods(students, graph, n)); }}
                        style={{ padding:"6px 16px", background: podSize === n ? "#f5c842" : "rgba(255,255,255,0.06)", color: podSize === n ? "#0a0c14" : "rgba(200,210,230,0.75)", border:`1px solid ${podSize === n ? "#f5c842" : "rgba(255,255,255,0.12)"}`, borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight: podSize === n ? 700 : 400 }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:24, fontSize:12 }}>
                  <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Total pods: </span><span style={{ color:"#f5c842", fontWeight:700 }}>{pods.length}</span></div>
                  <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Students: </span><span style={{ color:"#f5c842", fontWeight:700 }}>{students.length}</span></div>
                  <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Full pods: </span><span style={{ color:"#f5c842", fontWeight:700 }}>{pods.filter(p => p.length === podSize).length}</span></div>
                  <div><span style={{ color:"rgba(160,170,200,0.5)" }}>Partial pods: </span><span style={{ color:"rgba(220,150,80,0.9)", fontWeight:700 }}>{pods.filter(p => p.length < podSize).length}</span></div>
                </div>
              </div>
            </Card>

            {/* Pod cards */}
            {pods.length === 0 && <div style={{ color:"rgba(160,170,200,0.4)", fontSize:12 }}>No students loaded.</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
              {pods.map((pod, pi) => {
                const isFull = pod.length === podSize;
                const totalStrength = pod.reduce((sum, nameA, ai) =>
                  sum + pod.slice(ai + 1).reduce((s2, nameB) => {
                    const edge = (graph[nameA] || []).find(e => e.neighbor === nameB);
                    return s2 + (edge ? edge.weight : 0);
                  }, 0), 0);
                return (
                  <Card key={pi} accent={isFull ? "rgba(100,200,150,0.25)" : "rgba(220,160,60,0.25)"}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#dde3f0" }}>Pod {pi + 1}</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        {!isFull && <span style={{ fontSize:10, padding:"2px 7px", background:"rgba(220,160,60,0.15)", border:"1px solid rgba(220,160,60,0.3)", borderRadius:4, color:"rgba(220,160,60,0.9)" }}>partial</span>}
                        <span style={{ fontSize:11, color:"rgba(160,170,200,0.5)" }}>{pod.length}/{podSize} members</span>
                      </div>
                    </div>

                    {/* Member bubbles */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                      {pod.map(name => {
                        const si = students.findIndex(s => s.name === name);
                        return (
                          <div key={name} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"5px 10px" }}>
                            <div style={{ width:22, height:22, borderRadius:"50%", background:NODE_COLORS[si % NODE_COLORS.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:"#fff", flexShrink:0 }}>{name[0]}</div>
                            <span style={{ fontSize:12, color:"#dde3f0" }}>{name}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Intra-pod connection strengths */}
                    <div>
                      <div style={{ fontSize:10, color:"rgba(160,170,200,0.4)", letterSpacing:"0.08em", marginBottom:5 }}>INTRA-POD CONNECTIONS</div>
                      {pod.length < 2
                        ? <div style={{ fontSize:11, color:"rgba(160,170,200,0.3)" }}>None — isolated node</div>
                        : pod.map((nameA, ai) => pod.slice(ai + 1).map(nameB => {
                          const edge = (graph[nameA] || []).find(e => e.neighbor === nameB);
                          const w = edge ? edge.weight : 0;
                          return (
                            <div key={nameA+nameB} style={{ fontSize:11, color:"rgba(160,170,200,0.6)", marginBottom:3 }}>
                              {nameA} ↔ {nameB}: <span style={{ color: w >= 6 ? "#6bcb77" : w >= 3 ? "#f5c842" : "rgba(200,100,100,0.8)", fontWeight:700 }}>{w}</span>
                            </div>
                          );
                        }))
                      }
                      {pod.length >= 2 && (
                        <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.06)", fontSize:11 }}>
                          <span style={{ color:"rgba(160,170,200,0.5)" }}>Total strength: </span>
                          <span style={{ color:"#f5c842", fontWeight:700 }}>{totalStrength}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Referral Path Tab */}
        {activeTab === "referral" && (
          <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Card>
                <SH icon="" title="Dijkstra Referral Search" />
                <div style={{ fontSize:11, color:"rgba(160,170,200,0.45)", marginBottom:14, lineHeight:1.6 }}>

                </div>

                <label style={{ fontSize:11, color:"rgba(160,170,200,0.55)", letterSpacing:"0.08em", display:"block", marginBottom:6 }}>START STUDENT</label>
                <select value={startStudent} onChange={e => setStartStudent(e.target.value)}
                  style={{ width:"100%", background:"rgba(14,16,28,0.9)", color:"#cdd2e8", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"8px 10px", fontSize:12, fontFamily:"inherit", marginBottom:14, boxSizing:"border-box" }}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>

                <label style={{ fontSize:11, color:"rgba(160,170,200,0.55)", letterSpacing:"0.08em", display:"block", marginBottom:6 }}>TARGET COMPANY</label>
                <input value={targetCompany} onChange={e => setTargetCompany(e.target.value)}
                  placeholder="e.g. DummyCompany, Google…"
                  style={{ width:"100%", background:"rgba(14,16,28,0.9)", color:"#cdd2e8", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"8px 10px", fontSize:12, fontFamily:"inherit", marginBottom:8, boxSizing:"border-box" }} />

                {allCompanies.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, color:"rgba(160,170,200,0.4)", marginBottom:5 }}>QUICK SELECT:</div>
                    {allCompanies.map(c => (
                      <span key={c} onClick={() => setTargetCompany(c)}
                        style={{ display:"inline-block", fontSize:10, padding:"2px 8px", background:"rgba(245,200,66,0.08)", border:"1px solid rgba(245,200,66,0.2)", borderRadius:4, cursor:"pointer", color:"#f5c842", marginRight:4, marginBottom:4 }}>{c}</span>
                    ))}
                  </div>
                )}

                <button onClick={runReferral}
                  style={{ width:"100%", padding:"10px 0", background:"#f5c842", color:"#0a0c14", border:"none", borderRadius:6, fontWeight:700, fontSize:12, fontFamily:"inherit", letterSpacing:"0.08em", cursor:"pointer" }}>
                  FIND PATH
                </button>

                {referralError && (
                  <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(220,80,80,0.1)", border:"1px solid rgba(220,80,80,0.25)", borderRadius:8, fontSize:12, color:"rgba(230,120,120,0.9)" }}>
                    {referralError}
                  </div>
                )}

                {referralPath.length > 0 && (
                  <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(100,200,140,0.07)", border:"1px solid rgba(100,200,140,0.2)", borderRadius:8 }}>
                    <div style={{ fontSize:10, color:"rgba(100,200,140,0.8)", letterSpacing:"0.1em", marginBottom:8 }}>✓ PATH FOUND ({referralPath.length} hops)</div>
                    <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:5 }}>
                      {referralPath.map((name, i) => {
                        const si = students.findIndex(s => s.name === name);
                        return (
                          <span key={name} style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ background:NODE_COLORS[si % NODE_COLORS.length], color:"#fff", padding:"3px 10px", borderRadius:16, fontSize:12, fontWeight:700 }}>{name}</span>
                            {i < referralPath.length - 1 && <span style={{ color:"#f5c842", fontSize:14 }}>→</span>}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:8, fontSize:11, color:"rgba(160,170,200,0.45)" }}>
                      Target: <span style={{ color:"rgba(100,200,140,0.7)" }}>{targetCompany}</span> found at <span style={{ fontWeight:700, color:"#dde3f0" }}>{referralPath[referralPath.length - 1]}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Company Directory */}
              <Card>
                <SH icon="" title="Company Directory" />
                {allCompanies.length === 0
                  ? <div style={{ fontSize:12, color:"rgba(160,170,200,0.35)" }}>None</div>
                  : allCompanies.map(c => {
                    const holders = students.filter(s => (s.previousInternships||[]).includes(c));
                    return (
                      <div key={c} style={{ marginBottom:8, fontSize:12 }}>
                        <span style={{ color:"#f5c842", fontWeight:700 }}>{c}</span>
                        <span style={{ color:"rgba(160,170,200,0.45)", marginLeft:6 }}>→ {holders.map(h => h.name).join(", ")}</span>
                      </div>
                    );
                  })
                }
              </Card>
            </div>

            {/* Graph preview */}
            <div>
              <div style={{ fontSize:11, color:"rgba(150,160,190,0.5)", letterSpacing:"0.08em", marginBottom:8 }}></div>
              <GraphCanvas students={students} graph={graph} roommates={roommates} referralPath={referralPath} selectedName={startStudent} onSelect={n => setStartStudent(n)} />
            </div>
          </div>
        )}

        {/* Friends & Chat Tab */}
        {activeTab === "friends" && (
          <div>
            <SH icon="" title="Multithreaded Friend Requests & Chat History" />
            <div style={{ fontSize:12, color:"rgba(160,170,200,0.45)", marginBottom:16, lineHeight:1.6 }}>

            </div>

            {/* Thread logs */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
              <Card>
                <SH icon="" title="Friend Request Thread Log" />
                <div style={{ background:"rgba(8,10,18,0.8)", borderRadius:8, padding:12, fontFamily:"monospace", fontSize:11, maxHeight:140, overflowY:"auto" }}>
                  {friendLog.length === 0
                    ? <span style={{ color:"rgba(160,170,200,0.3)" }}>None</span>
                    : friendLog.map((l, i) => <div key={i} style={{ color:"rgba(100,200,140,0.85)", marginBottom:3 }}>{l}</div>)
                  }
                </div>
              </Card>
              <Card>
                <SH icon="" title="Chat Thread Log" />
                <div style={{ background:"rgba(8,10,18,0.8)", borderRadius:8, padding:12, fontFamily:"monospace", fontSize:11, maxHeight:140, overflowY:"auto" }}>
                  {chatLog.length === 0
                    ? <span style={{ color:"rgba(160,170,200,0.3)" }}>None</span>
                    : chatLog.map((l, i) => <div key={i} style={{ color:"rgba(100,160,245,0.85)", marginBottom:3 }}>{l}</div>)
                  }
                </div>
              </Card>
            </div>

            {/* Per-student cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
              {students.map((s, i) => {
                const friends = (graph[s.name] || []).map(e => e.neighbor);
                const requestsSent = friends;
                const requestsReceived = friends;
                const chatMessages = friends.length > 0
                  ? friends.flatMap(f => [
                      `[${s.name} -> ${f}]: Hello there!`,
                      `[${f} -> ${s.name}]: Hi back!`,
                    ])
                  : [];
                return (
                  <Card key={s.name}>
                    {/* Student header */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:NODE_COLORS[i % NODE_COLORS.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#fff", flexShrink:0 }}>{s.name[0]}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#dde3f0" }}>{s.name}</div>
                        <div style={{ fontSize:11, color:"rgba(160,170,200,0.5)" }}>{s.major} · GPA {s.gpa}</div>
                      </div>
                      <div style={{ marginLeft:"auto", fontSize:10, padding:"3px 8px", borderRadius:4,
                        background: friends.length > 0 ? "rgba(100,200,140,0.1)" : "rgba(160,170,200,0.06)",
                        border: friends.length > 0 ? "1px solid rgba(100,200,140,0.25)" : "1px solid rgba(255,255,255,0.08)",
                        color: friends.length > 0 ? "rgba(100,200,140,0.8)" : "rgba(160,170,200,0.35)" }}>
                        {friends.length > 0 ? `${friends.length} friend${friends.length > 1 ? "s" : ""}` : "isolated"}
                      </div>
                    </div>

                    {/* Friend Requests Sent */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, color:"rgba(160,170,200,0.45)", letterSpacing:"0.08em", marginBottom:5 }}>
                        <span style={{ color:"rgba(100,180,255,0.7)" }}>↑</span> FRIEND REQUESTS SENT
                      </div>
                      {requestsSent.length > 0
                        ? <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {requestsSent.map(f => (
                              <span key={f} style={{ fontSize:11, padding:"2px 8px", borderRadius:12,
                                background:"rgba(77,150,255,0.1)", border:"1px solid rgba(77,150,255,0.25)", color:"rgba(130,180,255,0.9)" }}>
                                {`-> ${f}`}
                              </span>
                            ))}
                          </div>
                        : <span style={{ fontSize:12, color:"rgba(160,170,200,0.35)", fontStyle:"italic" }}>None</span>
                      }
                    </div>

                    {/* Friend Requests Received */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, color:"rgba(160,170,200,0.45)", letterSpacing:"0.08em", marginBottom:5 }}>
                        <span style={{ color:"rgba(100,220,140,0.7)" }}>↓</span> FRIEND REQUESTS RECEIVED
                      </div>
                      {requestsReceived.length > 0
                        ? <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {requestsReceived.map(f => (
                              <span key={f} style={{ fontSize:11, padding:"2px 8px", borderRadius:12,
                                background:"rgba(100,200,140,0.1)", border:"1px solid rgba(100,200,140,0.25)", color:"rgba(120,210,160,0.9)" }}>
                                {`<- ${f}`}
                              </span>
                            ))}
                          </div>
                        : <span style={{ fontSize:12, color:"rgba(160,170,200,0.35)", fontStyle:"italic" }}>None</span>
                      }
                    </div>

                    {/* Chat History */}
                    <div>
                      <div style={{ fontSize:10, color:"rgba(160,170,200,0.45)", letterSpacing:"0.08em", marginBottom:5 }}>
                        CHAT HISTORY
                      </div>
                      <div style={{ background:"rgba(8,10,18,0.7)", borderRadius:6, padding:"8px 10px", maxHeight:120, overflowY:"auto", border:"1px solid rgba(255,255,255,0.05)" }}>
                        {chatMessages.length > 0
                          ? chatMessages.map((m, mi) => (
                              <div key={mi} style={{ fontSize:10,
                                color: m.startsWith(`[${s.name}`) ? "rgba(130,180,255,0.85)" : "rgba(140,210,170,0.85)",
                                marginBottom:4, lineHeight:1.6, fontFamily:"monospace" }}>{m}</div>
                            ))
                          : <span style={{ fontSize:11, color:"rgba(160,170,200,0.3)", fontStyle:"italic" }}>None</span>
                        }
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}