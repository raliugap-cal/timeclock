import { useState, useEffect, useCallback, useRef } from "react";
import { useDB } from "./hooks/useDB.js";
import {
  Users, Clock, MapPin, DollarSign, BarChart3, LayoutDashboard,
  ChevronDown, ChevronUp, X, Plus, Search, Filter, Download,
  CheckCircle, AlertCircle, AlertTriangle, Circle, Wifi, WifiOff,
  Satellite, Shield, Activity, TrendingUp, TrendingDown, Layers,
  Settings, LogOut, RefreshCw, Terminal, Cpu, Database,
  Calendar, CalendarDays, Building2, Briefcase, CreditCard,
  FileText, ChevronRight, Loader2, Eye, Edit, Trash2,
  ArrowUpRight, ArrowDownRight, Zap, Target, Globe, Lock,
  Navigation, Radio, Fingerprint, ScanLine, Network, GitBranch,
  BarChart2, PieChart, Inbox, Bell, UserCheck, ClipboardList
} from "lucide-react";

// ═══════════════════════════════════════════════
//  DESIGN SYSTEM — AEROSPACE/HUD
// ═══════════════════════════════════════════════
const DS = {
  bg:        "#030712",
  bgAlt:     "#060d1a",
  surface:   "#0a1628",
  surfaceHi: "#0d1f38",
  border:    "#0d2847",
  borderHi:  "#1a4a7a",
  glow:      "#00d4ff",
  glowGreen: "#00ff88",
  glowAmber: "#ffaa00",
  glowRed:   "#ff3366",
  glowPurple:"#a855f7",
  text:      "#c9e4f8",
  textDim:   "#4a7a9b",
  textMid:   "#7ba8c8",
  mono:      "'JetBrains Mono', 'Fira Code', monospace",
  sans:      "'Barlow Condensed', 'IBM Plex Sans Condensed', sans-serif",
};

const glow = (color, px = 8) => `0 0 ${px}px ${color}44, 0 0 ${px*3}px ${color}22`;
const glowStrong = (color) => `0 0 8px ${color}88, 0 0 24px ${color}44, 0 0 48px ${color}18`;
const insetGlow = (color) => `inset 0 0 20px ${color}08`;

// ═══════════════════════════════════════════════
//  TAX ENGINE (SAT MX + IRS California)
// ═══════════════════════════════════════════════
const SAT_ISR = [
  {li:0,ls:746.04,ff:0,pct:1.92},{li:746.05,ls:6332.05,ff:14.32,pct:6.40},
  {li:6332.06,ls:11128.01,ff:371.83,pct:10.88},{li:11128.02,ls:12935.82,ff:893.63,pct:16.00},
  {li:12935.83,ls:15487.71,ff:1182.88,pct:17.92},{li:15487.72,ls:31236.49,ff:1640.18,pct:21.36},
  {li:31236.50,ls:49233.00,ff:5004.12,pct:23.52},{li:49233.01,ls:93993.90,ff:9236.89,pct:30.00},
  {li:93993.91,ls:125325.20,ff:22665.17,pct:32.00},{li:125325.21,ls:375975.61,ff:32691.18,pct:34.00},
  {li:375975.62,ls:Infinity,ff:117912.32,pct:35.00},
];
const SAT_SUBSIDIO = [
  {li:0,ls:1768.96,s:407.02},{li:1768.97,ls:2653.38,s:406.83},{li:2653.39,ls:3472.84,s:406.62},
  {li:3472.85,ls:3537.87,s:392.77},{li:3537.88,ls:4446.15,s:382.46},{li:4446.16,ls:4717.18,s:354.23},
  {li:4717.19,ls:5335.42,s:324.87},{li:5335.43,ls:6224.67,s:294.63},{li:6224.68,ls:7113.90,s:253.54},
  {li:7113.91,ls:7382.33,s:217.61},{li:7382.34,ls:Infinity,s:0},
];
const IRS_FED = [
  {li:0,ls:11925,r:.10},{li:11925,ls:48475,r:.12},{li:48475,ls:103350,r:.22},
  {li:103350,ls:197300,r:.24},{li:197300,ls:250525,r:.32},{li:250525,ls:626350,r:.35},
  {li:626350,ls:Infinity,r:.37},
];
const CA_FTB = [
  {li:0,ls:10756,r:.01},{li:10756,ls:25499,r:.02},{li:25499,ls:40245,r:.04},
  {li:40245,ls:55866,r:.06},{li:55866,ls:70606,r:.08},{li:70606,ls:360659,r:.093},
  {li:360659,ls:432787,r:.103},{li:432787,ls:721314,r:.113},{li:721314,ls:Infinity,r:.123},
];

const progTax = (income, brackets) => brackets.reduce((t, b) => {
  if (income <= b.li) return t;
  return t + (Math.min(income, b.ls) - b.li) * (b.r || b.rate || 0);
}, 0);

const calcIMSS = (sal) => {
  const sbc = Math.min(sal, 113.14 * 25 * 30);
  return { enf: sbc*.00375+sbc*.0025, inv: sbc*.00625, ces: sbc*.01125,
    total: Math.round((sbc*.00375+sbc*.0025+sbc*.00625+sbc*.01125)*100)/100 };
};

const calcMX = (salary, payroll) => {
  const div = payroll==="semanal"?4.33:payroll==="quincenal"?2:1;
  const base = Math.round(salary/div);
  const imss = calcIMSS(salary);
  const baseISR = salary - imss.total;
  const row = SAT_ISR.find(r=>baseISR>=r.li&&baseISR<=r.ls)||SAT_ISR[SAT_ISR.length-1];
  const isrBruto = Math.round((row.ff+(baseISR-row.li)*(row.pct/100))*100)/100;
  const subRow = SAT_SUBSIDIO.find(r=>baseISR>=r.li&&baseISR<=r.ls);
  const subsidio = subRow ? subRow.s : 0;
  const isrNeto = Math.max(0, isrBruto - subsidio);
  const f = 1/div;
  const deds = {
    "ISR Art. 96 LISR": Math.round(isrNeto*f),
    "IMSS Enf. y Maternidad": Math.round(imss.enf*f),
    "IMSS Invalidez y Vida": Math.round(imss.inv*f),
    "IMSS Cesantía y Vejez": Math.round(imss.ces*f),
    "Subsidio al Empleo": -Math.round(subsidio*f),
  };
  const totalDed = Math.round((imss.total+isrNeto)*f);
  return { currency:"MXN", regime:"SAT MX", base, deds, totalDed, net: base-totalDed,
    effectiveRate: ((totalDed/base)*100).toFixed(1) };
};

const calcUS = (salary, payroll) => {
  const periods = payroll==="weekly"?52:payroll==="biweekly"?26:12;
  const annual = salary*periods;
  const fedAGI = Math.max(0, annual-15000);
  const fedTax = progTax(fedAGI, IRS_FED);
  const ss = Math.min(annual,176100)*.062;
  const med = annual*.0145+Math.max(0,annual-200000)*.009;
  const caAGI = Math.max(0, annual-5363);
  const caState = progTax(caAGI, CA_FTB);
  const sdi = annual*.011;
  const fedPer = Math.round(fedTax/periods);
  const ssPer = Math.round(ss/periods);
  const medPer = Math.round(med/periods);
  const caPer = Math.round(caState/periods);
  const sdiPer = Math.round(sdi/periods);
  const totalDed = fedPer+ssPer+medPer+caPer+sdiPer;
  const deds = {
    "Federal Income Tax (IRS)": fedPer,
    "Social Security 6.2%": ssPer,
    "Medicare 1.45%": medPer,
    "CA State Tax (FTB)": caPer,
    "CA SDI 1.1%": sdiPer,
  };
  return { currency:"USD", regime:"IRS+CA", base: salary, deds, totalDed, net: salary-totalDed,
    effectiveRate: ((totalDed/salary)*100).toFixed(1),
    fedRate: ((fedTax/annual)*100).toFixed(1),
    caRate: ((caState/annual)*100).toFixed(1) };
};

const calcPayroll = (emp) => emp.country==="US" ? calcUS(emp.salary, emp.payroll) : calcMX(emp.salary, emp.payroll);

// ═══════════════════════════════════════════════
//  SEED DATA
// ═══════════════════════════════════════════════
const SEED = {
  employees: [
    {id:"e1",name:"Ana García",dept:"d1",role:"Desarrolladora Senior",status:"active",payroll:"quincenal",salary:25000,avatar:"AG",location:"l1",country:"MX",currency:"MXN",hireDate:"2021-03-15"},
    {id:"e2",name:"Carlos López",dept:"d2",role:"Ejecutivo de Ventas",status:"active",payroll:"semanal",salary:12000,avatar:"CL",location:"l2",country:"MX",currency:"MXN",hireDate:"2022-06-01"},
    {id:"e3",name:"María Rodríguez",dept:"d3",role:"Coordinadora RRHH",status:"active",payroll:"quincenal",salary:18000,avatar:"MR",location:"l1",country:"MX",currency:"MXN",hireDate:"2020-11-10"},
    {id:"e4",name:"Roberto Martínez",dept:"d4",role:"Supervisor Ops",status:"inactive",payroll:"mensual",salary:20000,avatar:"RM",location:"l3",country:"MX",currency:"MXN",hireDate:"2019-08-20"},
    {id:"e5",name:"Sofía Hernández",dept:"d1",role:"UX Designer",status:"active",payroll:"quincenal",salary:22000,avatar:"SH",location:"l1",country:"MX",currency:"MXN",hireDate:"2022-01-05"},
    {id:"e6",name:"Diego Flores",dept:"d5",role:"Contador Senior",status:"active",payroll:"mensual",salary:19000,avatar:"DF",location:"l1",country:"MX",currency:"MXN",hireDate:"2021-09-14"},
    {id:"e7",name:"James Wilson",dept:"d1",role:"Senior Engineer",status:"active",payroll:"biweekly",salary:9615,avatar:"JW",location:"l4",country:"US",currency:"USD",hireDate:"2022-04-11"},
    {id:"e8",name:"Sarah Chen",dept:"d2",role:"Sales Manager",status:"active",payroll:"biweekly",salary:7692,avatar:"SC",location:"l5",country:"US",currency:"USD",hireDate:"2023-02-14"},
    {id:"e9",name:"Michael Torres",dept:"d4",role:"Operations Lead",status:"active",payroll:"biweekly",salary:6154,avatar:"MT",location:"l4",country:"US",currency:"USD",hireDate:"2022-08-30"},
  ],
  departments: [
    {id:"d1",name:"Tecnología",color:"#00d4ff",head:"e1",budget:450000},
    {id:"d2",name:"Ventas",color:"#00ff88",head:"e2",budget:280000},
    {id:"d3",name:"Recursos Humanos",color:"#ffaa00",head:"e3",budget:180000},
    {id:"d4",name:"Operaciones",color:"#a855f7",head:"e4",budget:320000},
    {id:"d5",name:"Finanzas",color:"#ff3366",head:"e6",budget:220000},
  ],
  locations: [
    {id:"l1",name:"CDMX HQ",address:"Av. Paseo de la Reforma 350, Col. Juárez, CDMX",lat:19.4284,lng:-99.1639,radius:150,country:"MX",timezone:"America/Mexico_City"},
    {id:"l2",name:"Monterrey Norte",address:"Av. Revolución 2703, Monterrey, NL",lat:25.6866,lng:-100.3161,radius:120,country:"MX",timezone:"America/Monterrey"},
    {id:"l3",name:"Guadalajara Sur",address:"Carretera Guadalajara-Chapala Km 6.5",lat:20.6597,lng:-103.3496,radius:200,country:"MX",timezone:"America/Mexico_City"},
    {id:"l4",name:"Los Angeles Office",address:"1100 Wilshire Blvd, Suite 800, Los Angeles, CA 90017",lat:34.0522,lng:-118.2437,radius:120,country:"US",timezone:"America/Los_Angeles"},
    {id:"l5",name:"San Francisco Office",address:"101 California St, Floor 12, San Francisco, CA 94111",lat:37.7749,lng:-122.4194,radius:100,country:"US",timezone:"America/Los_Angeles"},
  ],
  timeRecords: [
    {id:"t1",empId:"e1",date:"2025-02-24",entry:"08:02",exit:"17:15",type:"geocerca",hours:9.2,status:"normal"},
    {id:"t2",empId:"e2",date:"2025-02-24",entry:"09:45",exit:"18:30",type:"manual",hours:8.75,status:"tardanza"},
    {id:"t3",empId:"e3",date:"2025-02-24",entry:"07:58",exit:"17:00",type:"geocerca",hours:9.03,status:"normal"},
    {id:"t4",empId:"e5",date:"2025-02-24",entry:"08:10",exit:"16:45",type:"geocerca",hours:8.58,status:"normal"},
    {id:"t5",empId:"e6",date:"2025-02-24",entry:"10:00",exit:null,type:"manual",hours:null,status:"activo"},
    {id:"t6",empId:"e7",date:"2025-02-24",entry:"09:00",exit:"18:00",type:"geocerca",hours:9.0,status:"normal"},
    {id:"t7",empId:"e8",date:"2025-02-24",entry:"08:30",exit:"17:30",type:"geocerca",hours:9.0,status:"normal"},
    {id:"t8",empId:"e1",date:"2025-02-23",entry:"08:00",exit:"17:00",type:"geocerca",hours:9.0,status:"normal"},
    {id:"t9",empId:"e2",date:"2025-02-23",entry:"08:30",exit:"17:30",type:"manual",hours:9.0,status:"normal"},
  ],
  payrollCuts: [
    {id:"p1",period:"1-15 Feb 2025",type:"quincenal",country:"MX",employees:5,grossTotal:97000,totalDed:14200,netTotal:82800,status:"pagado",date:"2025-02-15",createdBy:"admin"},
    {id:"p2",period:"Sem 7 Feb 2025",type:"semanal",country:"MX",employees:1,grossTotal:12000,totalDed:2100,netTotal:9900,status:"pendiente",date:"2025-02-21",createdBy:"admin"},
    {id:"p3",period:"Ene 2025",type:"mensual",country:"all",employees:3,grossTotal:45000,totalDed:8900,netTotal:36100,status:"pagado",date:"2025-01-31",createdBy:"admin"},
  ],
};


// ═══════════════════════════════════════════════
//  DESIGN COMPONENTS
// ═══════════════════════════════════════════════

const HudCorner = ({ pos = "tl", size = 10, color = DS.glow }) => {
  const styles = {
    tl: { top: 0, left: 0, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    tr: { top: 0, right: 0, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
    bl: { bottom: 0, left: 0, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    br: { bottom: 0, right: 0, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
  };
  return <div style={{ position: "absolute", width: size, height: size, ...styles[pos] }} />;
};

const Panel = ({ children, style, glowColor = DS.glow, noPad }) => (
  <div style={{
    background: DS.surface,
    border: `1px solid ${DS.border}`,
    borderRadius: 2,
    position: "relative",
    padding: noPad ? 0 : "20px 22px",
    boxShadow: `${insetGlow(glowColor)}, 0 4px 24px rgba(0,0,0,0.4)`,
    ...style,
  }}>
    <HudCorner pos="tl" color={glowColor} />
    <HudCorner pos="tr" color={glowColor} />
    <HudCorner pos="bl" color={glowColor} />
    <HudCorner pos="br" color={glowColor} />
    {children}
  </div>
);

const Tag = ({ label, value, color = DS.glow }) => (
  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
    <span style={{ fontSize:9, color: DS.textDim, fontFamily: DS.mono, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
    <span style={{ fontSize:10, color, fontFamily: DS.mono, fontWeight:700 }}>{value}</span>
  </div>
);

const StatusDot = ({ status }) => {
  const c = status==="active"||status==="normal"||status==="pagado" ? DS.glowGreen
    : status==="activo" ? DS.glow
    : status==="tardanza"||status==="pendiente" ? DS.glowAmber
    : DS.glowRed;
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:10, height:10 }}>
      <span style={{ position:"absolute", width:10, height:10, borderRadius:"50%", background:c, opacity:.3, animation:"ping 1.8s ease infinite" }} />
      <span style={{ width:6, height:6, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}` }} />
    </span>
  );
};

const Chip = ({ children, color = DS.glow }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", gap:4,
    padding:"2px 8px", borderRadius:1,
    background:`${color}12`, border:`1px solid ${color}33`,
    color, fontSize:10, fontFamily:DS.mono, fontWeight:700,
    letterSpacing:"0.06em", textTransform:"uppercase",
  }}>{children}</span>
);

const Avatar = ({ initials, color = DS.glow, size = 36 }) => (
  <div style={{
    width:size, height:size, borderRadius:1, flexShrink:0,
    background:`${color}10`, border:`1px solid ${color}40`,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*.3, fontWeight:800, color, fontFamily:DS.mono,
    boxShadow:`0 0 12px ${color}20`,
    letterSpacing:"0.05em",
  }}>{initials}</div>
);

const KpiCard = ({ icon: Icon, label, value, sub, color = DS.glow, trend }) => (
  <Panel glowColor={color} style={{ overflow:"hidden" }}>
    <div style={{ position:"absolute", bottom:-10, right:-10, opacity:.04 }}>
      <Icon size={80} color={color} />
    </div>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div style={{ width:32, height:32, border:`1px solid ${color}44`, borderRadius:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={16} color={color} />
      </div>
      {trend != null && (
        <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color: trend>=0?DS.glowGreen:DS.glowRed, fontFamily:DS.mono }}>
          {trend>=0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div style={{ marginTop:16, fontFamily:DS.mono, fontSize:26, fontWeight:800, color, lineHeight:1, letterSpacing:"-0.02em" }}>{value}</div>
    <div style={{ marginTop:6, fontSize:10, color:DS.textDim, fontFamily:DS.sans, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</div>
    {sub && <div style={{ marginTop:4, fontSize:10, color:DS.textMid, fontFamily:DS.mono }}>{sub}</div>}
  </Panel>
);

const Btn = ({ children, onClick, color = DS.glow, variant = "primary", size = "md", icon: Icon, disabled }) => {
  const pad = size==="sm" ? "5px 12px" : "9px 18px";
  const fs = size==="sm" ? 11 : 13;
  return (
    <button onClick={disabled?undefined:onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:pad, borderRadius:1, cursor:disabled?"not-allowed":"pointer",
      fontSize:fs, fontFamily:DS.mono, fontWeight:700, letterSpacing:"0.06em",
      border:`1px solid ${color}${disabled?"22":"66"}`,
      background: variant==="primary" ? `${color}18` : "transparent",
      color: disabled ? DS.textDim : color,
      boxShadow: disabled ? "none" : `0 0 12px ${color}18`,
      transition:"all .15s", opacity: disabled?.6:1,
    }}>
      {Icon && <Icon size={fs-1} />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", options, placeholder, required }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <label style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.1em", textTransform:"uppercase" }}>
      {label}{required && <span style={{color:DS.glowRed}}> *</span>}
    </label>}
    {type === "select" ? (
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        background:DS.bgAlt, border:`1px solid ${DS.border}`, borderRadius:1,
        color:DS.text, fontSize:12, fontFamily:DS.mono, padding:"8px 10px",
        outline:"none", colorScheme:"dark",
      }}>
        {options?.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{
          background:DS.bgAlt, border:`1px solid ${DS.border}`, borderRadius:1,
          color:DS.text, fontSize:12, fontFamily:DS.mono, padding:"8px 10px",
          outline:"none", width:"100%", boxSizing:"border-box",
        }} />
    )}
  </div>
);

const Modal = ({ title, children, onClose, width = 560 }) => (
  <div style={{
    position:"fixed", inset:0, background:"rgba(3,7,18,.88)",
    display:"flex", alignItems:"center", justifyContent:"center",
    zIndex:1000, backdropFilter:"blur(8px)",
  }} onClick={onClose}>
    <Panel style={{ width, maxHeight:"88vh", overflow:"auto" }} onClick={e=>e.stopPropagation()}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div style={{ fontFamily:DS.sans, fontSize:15, fontWeight:700, color:DS.text, letterSpacing:"0.1em", textTransform:"uppercase" }}>{title}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:DS.textDim, cursor:"pointer", display:"flex" }}><X size={16}/></button>
      </div>
      {children}
    </Panel>
  </div>
);

const Drawer = ({ title, children, onClose }) => (
  <div style={{
    position:"fixed", inset:0, background:"rgba(3,7,18,.7)",
    display:"flex", justifyContent:"flex-end",
    zIndex:1000, backdropFilter:"blur(4px)",
  }} onClick={onClose}>
    <div style={{
      width:520, background:DS.bgAlt, borderLeft:`1px solid ${DS.borderHi}`,
      overflowY:"auto", padding:"28px 28px",
      boxShadow:`-8px 0 40px rgba(0,0,0,.5)`,
    }} onClick={e=>e.stopPropagation()}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div style={{ fontFamily:DS.sans, fontSize:13, fontWeight:700, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>{title}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:DS.textDim, cursor:"pointer", display:"flex" }}><X size={16}/></button>
      </div>
      {children}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, label, action }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:2, height:18, background:DS.glow, boxShadow:glow(DS.glow,4) }} />
      <Icon size={15} color={DS.glow} />
      <span style={{ fontFamily:DS.sans, fontSize:16, fontWeight:700, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>{label}</span>
    </div>
    {action}
  </div>
);

// ═══════════════════════════════════════════════
//  TABLE COMPONENT
// ═══════════════════════════════════════════════
const Table = ({ cols, rows }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead>
        <tr style={{ borderBottom:`1px solid ${DS.border}` }}>
          {cols.map(c=>(
            <th key={c.key} style={{ padding:"8px 14px", textAlign:"left", fontSize:9, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.12em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i)=>(
          <tr key={i} style={{ borderBottom:`1px solid ${DS.border}44`, transition:"background .1s" }}
            onMouseEnter={e=>e.currentTarget.style.background=`${DS.glow}06`}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            {cols.map(c=>(
              <td key={c.key} style={{ padding:"11px 14px", fontSize:12, color:DS.text, fontFamily:c.mono?DS.mono:"inherit", whiteSpace:"nowrap" }}>
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ═══════════════════════════════════════════════
//  VIEWS
// ═══════════════════════════════════════════════

const ViewDashboard = ({ db }) => {
  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setClock(new Date()),1000); return ()=>clearInterval(t); }, []);

  if (!db) return null;
  const activeEmps = db.employees.filter(e=>e.status==="active");
  const todayRecs = db.timeRecords.filter(r=>r.date==="2025-02-24");
  const openRecs = todayRecs.filter(r=>!r.exit);
  const lateRecs = todayRecs.filter(r=>r.status==="tardanza");
  const pendingCuts = db.payrollCuts.filter(p=>p.status==="pendiente");

  return (
    <div>
      {/* Top status bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div style={{ fontFamily:DS.sans, fontSize:24, fontWeight:800, color:DS.text, letterSpacing:"0.06em", textTransform:"uppercase" }}>
            SISTEMA ACTIVO
          </div>
          <div style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim, marginTop:3 }}>
            {clock.toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).toUpperCase()}
          </div>
        </div>
        <Panel style={{ padding:"12px 20px", display:"flex", gap:24, alignItems:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:DS.mono, fontSize:28, fontWeight:900, color:DS.glow, lineHeight:1, letterSpacing:"0.05em" }}>
              {clock.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
            </div>
            <div style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.1em", marginTop:3 }}>UTC-6 / CDMX</div>
          </div>
          <div style={{ width:1, height:40, background:DS.border }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:DS.mono, fontSize:20, fontWeight:900, color:DS.glowGreen, lineHeight:1 }}>
              {clock.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"America/Los_Angeles"})}
            </div>
            <div style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.1em", marginTop:3 }}>PST / LA</div>
          </div>
        </Panel>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KpiCard icon={Users} label="Empleados Activos" value={activeEmps.length} sub={`${db.employees.length} total`} color={DS.glow} trend={5} />
        <KpiCard icon={UserCheck} label="Presentes Hoy" value={`${todayRecs.length}`} sub={`${openRecs.length} en turno`} color={DS.glowGreen} trend={2} />
        <KpiCard icon={AlertTriangle} label="Tardanzas" value={lateRecs.length} sub="día de hoy" color={DS.glowAmber} trend={-12} />
        <KpiCard icon={CreditCard} label="Cortes Pendientes" value={pendingCuts.length} sub={`${db.payrollCuts.length} total`} color={DS.glowPurple} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
        {/* Recent time records */}
        <Panel>
          <SectionHeader icon={Clock} label="Registros de Tiempo — Hoy" />
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {todayRecs.slice(0,6).map(r => {
              const emp = db.employees.find(e=>e.id===r.empId);
              if (!emp) return null;
              const dept = db.departments.find(d=>d.id===emp.dept);
              return (
                <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", background:DS.bgAlt, border:`1px solid ${DS.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Avatar initials={emp.avatar} color={dept?.color||DS.glow} size={32} />
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:DS.text, fontFamily:DS.mono }}>{emp.name}</div>
                      <div style={{ fontSize:10, color:DS.textDim }}>{emp.role}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.glowGreen }}>{r.entry}</span>
                    <span style={{ color:DS.textDim, fontSize:10 }}>→</span>
                    <span style={{ fontFamily:DS.mono, fontSize:11, color:r.exit?DS.glowRed:DS.glowAmber }}>{r.exit||"ACTIVO"}</span>
                    <StatusDot status={r.status} />
                    <Chip color={r.type==="geocerca"?DS.glowPurple:DS.glow}>{r.type==="geocerca"?"GEO":"MAN"}</Chip>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Department overview */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Panel>
            <SectionHeader icon={Building2} label="Departamentos" />
            {db.departments.map(dept => {
              const count = db.employees.filter(e=>e.dept===dept.id&&e.status==="active").length;
              const maxCount = Math.max(...db.departments.map(d=>db.employees.filter(e=>e.dept===d.id&&e.status==="active").length));
              return (
                <div key={dept.id} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid }}>{dept.name}</span>
                    <span style={{ fontFamily:DS.mono, fontSize:11, color:dept.color, fontWeight:700 }}>{count} EMP</span>
                  </div>
                  <div style={{ height:3, background:DS.bgAlt, borderRadius:0 }}>
                    <div style={{ height:"100%", width:`${(count/maxCount)*100}%`, background:dept.color, boxShadow:`0 0 8px ${dept.color}88`, transition:"width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </Panel>

          <Panel glowColor={DS.glowAmber}>
            <SectionHeader icon={Globe} label="Cobertura Global" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div style={{ padding:"12px 14px", background:DS.bgAlt, border:`1px solid ${DS.border}` }}>
                <div style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.1em" }}>MEXICO</div>
                <div style={{ fontFamily:DS.mono, fontSize:20, fontWeight:800, color:DS.glowGreen, marginTop:4 }}>
                  {db.employees.filter(e=>e.country==="MX"&&e.status==="active").length}
                </div>
                <div style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono }}>SAT · LISR · IMSS</div>
              </div>
              <div style={{ padding:"12px 14px", background:DS.bgAlt, border:`1px solid ${DS.border}` }}>
                <div style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.1em" }}>CALIFORNIA</div>
                <div style={{ fontFamily:DS.mono, fontSize:20, fontWeight:800, color:DS.glow, marginTop:4 }}>
                  {db.employees.filter(e=>e.country==="US"&&e.status==="active").length}
                </div>
                <div style={{ fontSize:9, color:DS.textDim, fontFamily:DS.mono }}>IRS · CA FTB · SDI</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

// Standalone overlay — must NOT be defined inside another component
const EmpModalOverlay = ({ onClose, children }) => (
  <div
    style={{ position:"fixed", inset:0, background:"rgba(3,7,18,.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(8px)" }}
    onClick={onClose}
  >
    <div
      style={{ background:DS.bgAlt, border:`1px solid ${DS.borderHi}`, borderRadius:2, width:600, maxHeight:"90vh", overflowY:"auto", padding:28, position:"relative", boxShadow:`0 0 40px ${DS.glow}18` }}
      onClick={e => e.stopPropagation()}
    >
      <HudCorner pos="tl" color={DS.glow} size={12} />
      <HudCorner pos="tr" color={DS.glow} size={12} />
      <HudCorner pos="bl" color={DS.glow} size={12} />
      <HudCorner pos="br" color={DS.glow} size={12} />
      {children}
    </div>
  </div>
);

const ViewEmployees = ({ db, upsertEmployee, deleteEmployee }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const filtered = (db?.employees||[]).filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (db.departments.find(d=>d.id===e.dept)?.name||"").toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setError("");
    setForm({
      name:"", dept:"d1", role:"", salary:"",
      payroll:"quincenal", location:"l1",
      country:"MX", currency:"MXN",
      status:"active",
      hireDate: new Date().toISOString().slice(0,10)
    });
    setEditMode(false);
    setModal(true);
  };

  const openEdit = (emp) => {
    setError("");
    setForm({ ...emp, salary: String(emp.salary) });
    setEditMode(true);
    setModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setError("El nombre es requerido."); return; }
    if (!form.role.trim()) { setError("El puesto es requerido."); return; }
    if (!form.salary || isNaN(Number(form.salary)) || Number(form.salary) <= 0) { setError("El salario debe ser un número mayor a 0."); return; }
    setError("");

    const avatar = form.name.trim().split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
    const record = {
      ...form,
      salary: Number(form.salary),
      avatar,
      // only include id if editing an existing record
      ...(editMode && form.id ? { id: form.id } : {}),
    };

    upsertEmployee(record);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setModal(false);
  };

  const handleDelete = (id) => {
    deleteEmployee(id);
    setConfirm(null);
  };

  const deptOpts = (db?.departments||[]).map(d=>({v:d.id,l:d.name}));
  const locOpts  = (db?.locations||[]).map(l=>({v:l.id,l:l.name}));



  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:2, height:18, background:DS.glow, boxShadow:glow(DS.glow,4) }} />
          <Users size={15} color={DS.glow} />
          <span style={{ fontFamily:DS.sans, fontSize:16, fontWeight:700, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>Gestión de Empleados</span>
          <Chip color={DS.textDim}>{db.employees.length} TOTAL</Chip>
        </div>
        <button
          onClick={openNew}
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:1, cursor:"pointer", fontSize:12, fontFamily:DS.mono, fontWeight:700, letterSpacing:"0.06em", border:`1px solid ${DS.glow}66`, background:`${DS.glow}18`, color:DS.glow, boxShadow:`0 0 12px ${DS.glow}18` }}
        >
          <Plus size={14} /> NUEVO EMPLEADO
        </button>
      </div>

      {saved && (
        <div style={{ marginBottom:14, padding:"10px 16px", background:`${DS.glowGreen}10`, border:`1px solid ${DS.glowGreen}44`, display:"flex", gap:8, alignItems:"center" }}>
          <CheckCircle size={13} color={DS.glowGreen} />
          <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.glowGreen }}>EMPLEADO GUARDADO CORRECTAMENTE EN BASE DE DATOS</span>
        </div>
      )}

      <Panel noPad>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${DS.border}`, display:"flex", gap:12, alignItems:"center" }}>
          <Search size={14} color={DS.textDim} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o departamento..."
            style={{ flex:1, background:"none", border:"none", outline:"none", color:DS.text, fontSize:12, fontFamily:DS.mono }}
          />
          <span style={{ fontSize:10, color:DS.textDim, fontFamily:DS.mono }}>{filtered.length} REGISTROS</span>
        </div>
        <Table
          cols={[
            { key:"name", label:"Empleado", render: row => {
              const dept = db.departments.find(d=>d.id===row.dept);
              return (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar initials={row.avatar||"??"} color={dept?.color||DS.glow} size={30} />
                  <div>
                    <div style={{ fontFamily:DS.mono, fontSize:12, fontWeight:700, color:DS.text }}>{row.name}</div>
                    <div style={{ fontSize:10, color:DS.textDim }}>{row.role}</div>
                  </div>
                </div>
              );
            }},
            { key:"dept", label:"Depto.", render: row => {
              const dept = db.departments.find(d=>d.id===row.dept);
              return <Chip color={dept?.color||DS.glow}>{dept?.name||"—"}</Chip>;
            }},
            { key:"location", label:"Ubicación", render: row => {
              const loc = db.locations.find(l=>l.id===row.location);
              return <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid }}>{loc?.name||"—"}</span>;
            }},
            { key:"country", label:"Régimen", render: row => <Chip color={row.country==="MX"?DS.glowGreen:DS.glow}>{row.country==="MX"?"MX · SAT":"US · IRS"}</Chip> },
            { key:"payroll", label:"Nómina", render: row => <Chip color={DS.glowAmber}>{row.payroll}</Chip> },
            { key:"salary", label:"Salario", render: row => (
              <span style={{ fontFamily:DS.mono, fontSize:12, color:DS.glow }}>{row.currency} ${Number(row.salary).toLocaleString()}</span>
            )},
            { key:"status", label:"Estado", render: row => (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <StatusDot status={row.status} />
                <span style={{ fontFamily:DS.mono, fontSize:10, color:row.status==="active"?DS.glowGreen:DS.glowRed }}>{row.status==="active"?"ACTIVO":"INACTIVO"}</span>
              </div>
            )},
            { key:"actions", label:"", render: row => (
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>openEdit(row)} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", border:`1px solid ${DS.glow}44`, background:`${DS.glow}10`, color:DS.glow, fontFamily:DS.mono, fontSize:10, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
                  <Edit size={10}/> EDITAR
                </button>
                <button onClick={()=>setConfirm(row)} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", border:`1px solid ${DS.glowRed}44`, background:`${DS.glowRed}08`, color:DS.glowRed, fontFamily:DS.mono, fontSize:10, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
                  <Trash2 size={10}/> BAJA
                </button>
              </div>
            )},
          ]}
          rows={filtered}
        />
        {filtered.length === 0 && (
          <div style={{ padding:"32px", textAlign:"center", fontFamily:DS.mono, fontSize:11, color:DS.textDim }}>
            {search ? "SIN RESULTADOS PARA LA BÚSQUEDA" : "SIN EMPLEADOS REGISTRADOS"}
          </div>
        )}
      </Panel>

      {/* ── MODAL ALTA / EDICIÓN ── */}
      {modal && (
        <EmpModalOverlay onClose={()=>setModal(false)}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:2, height:16, background:DS.glow, boxShadow:glow(DS.glow) }} />
              <Users size={14} color={DS.glow} />
              <span style={{ fontFamily:DS.sans, fontSize:14, fontWeight:800, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>
                {editMode ? "EDITAR EMPLEADO" : "ALTA DE NUEVO EMPLEADO"}
              </span>
            </div>
            <button onClick={()=>setModal(false)} style={{ background:"none", border:"none", color:DS.textDim, cursor:"pointer", display:"flex" }}>
              <X size={16}/>
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ marginBottom:14, padding:"10px 14px", background:`${DS.glowRed}10`, border:`1px solid ${DS.glowRed}44`, display:"flex", gap:8, alignItems:"center" }}>
              <AlertCircle size={12} color={DS.glowRed} />
              <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.glowRed }}>{error}</span>
            </div>
          )}

          {/* Form grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <Input label="Nombre Completo *" value={form.name||""} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Ej: Juan Pérez García" required />
            </div>
            <Input label="Departamento" type="select" value={form.dept||"d1"} onChange={v=>setForm(p=>({...p,dept:v}))} options={deptOpts} />
            <Input label="Puesto / Rol *" value={form.role||""} onChange={v=>setForm(p=>({...p,role:v}))} placeholder="Ej: Analista Senior" required />
            <Input label="Salario Base *" type="number" value={form.salary||""} onChange={v=>setForm(p=>({...p,salary:v}))} placeholder="Ej: 15000" required />
            <Input label="Tipo de Nómina" type="select" value={form.payroll||"quincenal"} onChange={v=>setForm(p=>({...p,payroll:v}))}
              options={[{v:"semanal",l:"Semanal (MX)"},{v:"quincenal",l:"Quincenal (MX)"},{v:"mensual",l:"Mensual (MX)"},{v:"biweekly",l:"Biweekly (US)"}]} />
            <Input label="Sede / Ubicación" type="select" value={form.location||"l1"} onChange={v=>{
              const loc = db.locations.find(l=>l.id===v);
              setForm(p=>({...p, location:v, country: loc?.country||"MX", currency: loc?.country==="US"?"USD":"MXN"}));
            }} options={locOpts} />
            <Input label="Fecha de Ingreso" type="date" value={form.hireDate||""} onChange={v=>setForm(p=>({...p,hireDate:v}))} />
            <Input label="Estado" type="select" value={form.status||"active"} onChange={v=>setForm(p=>({...p,status:v}))}
              options={[{v:"active",l:"Activo"},{v:"inactive",l:"Inactivo"}]} />
          </div>

          {/* Régimen preview */}
          <div style={{ margin:"16px 0", padding:"10px 14px", background:DS.surface, border:`1px solid ${DS.border}`, display:"flex", gap:16, alignItems:"center" }}>
            <Shield size={13} color={form.country==="MX"?DS.glowGreen:DS.glow} />
            <div>
              <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.1em" }}>RÉGIMEN FISCAL APLICABLE</div>
              <div style={{ fontFamily:DS.mono, fontSize:11, color:form.country==="MX"?DS.glowGreen:DS.glow, fontWeight:700, marginTop:2 }}>
                {form.country==="MX" ? "SAT México · ISR Art.96 LISR + IMSS + Subsidio Empleo" : "IRS Federal 10–37% + CA FTB 1–12.3% + FICA 7.65% + SDI 1.1%"}
              </div>
            </div>
            <Chip color={form.currency==="USD"?DS.glow:DS.glowGreen}>{form.currency||"MXN"}</Chip>
          </div>

          {/* Buttons */}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setModal(false)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", border:`1px solid ${DS.textDim}44`, background:"transparent", color:DS.textDim, fontFamily:DS.mono, fontSize:12, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
              <X size={13}/> CANCELAR
            </button>
            <button onClick={handleSave} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", border:`1px solid ${DS.glowGreen}66`, background:`${DS.glowGreen}18`, color:DS.glowGreen, fontFamily:DS.mono, fontSize:12, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
              <CheckCircle size={13}/> {editMode ? "ACTUALIZAR" : "DAR DE ALTA"}
            </button>
          </div>
        </EmpModalOverlay>
      )}

      {/* ── MODAL BAJA ── */}
      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(3,7,18,.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001, backdropFilter:"blur(8px)" }}
          onClick={()=>setConfirm(null)}>
          <div style={{ background:DS.bgAlt, border:`1px solid ${DS.glowRed}55`, padding:28, width:420, position:"relative" }}
            onClick={e=>e.stopPropagation()}>
            <HudCorner pos="tl" color={DS.glowRed} size={10} />
            <HudCorner pos="br" color={DS.glowRed} size={10} />
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <AlertTriangle size={16} color={DS.glowRed} />
              <span style={{ fontFamily:DS.sans, fontSize:14, fontWeight:800, color:DS.glowRed, letterSpacing:"0.1em" }}>CONFIRMAR BAJA</span>
            </div>
            <div style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid, lineHeight:1.8, marginBottom:20 }}>
              ¿Confirma la baja del empleado<br/>
              <span style={{ color:DS.glowRed, fontWeight:700 }}>{confirm.name}</span>?<br/>
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirm(null)} style={{ padding:"8px 18px", border:`1px solid ${DS.textDim}44`, background:"transparent", color:DS.textDim, fontFamily:DS.mono, fontSize:11, cursor:"pointer", borderRadius:1 }}>
                CANCELAR
              </button>
              <button onClick={()=>handleDelete(confirm.id)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 18px", border:`1px solid ${DS.glowRed}66`, background:`${DS.glowRed}18`, color:DS.glowRed, fontFamily:DS.mono, fontSize:11, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
                <Trash2 size={11}/> CONFIRMAR BAJA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewTime = ({ db, addTimeRecord }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ empId:"e1", date:"2025-02-24", entry:"", exit:"", type:"manual" });

  const getEmpName = (id) => db.employees.find(e=>e.id===id)?.name||id;
  const getDept = (empId) => { const e=db.employees.find(x=>x.id===empId); return db.departments.find(d=>d.id===e?.dept); };

  const handleAdd = async () => {
    const h = form.exit ? ((new Date(`2000-01-01T${form.exit}`)-new Date(`2000-01-01T${form.entry}`))/3600000).toFixed(2) : null;
    await addTimeRecord({ empId:form.empId, date:form.date, entry:form.entry, exit:form.exit||null, type:form.type, hours:h?Number(h):null, status: form.exit?"normal":"activo" });
    setModal(false);
  };

  return (
    <div>
      <SectionHeader icon={Clock} label="Control de Tiempo"
        action={
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={()=>setModal(true)} icon={Plus} color={DS.glow}>REGISTRO MANUAL</Btn>
            <Btn icon={Satellite} color={DS.glowPurple}>GEOCERCA CONFIG</Btn>
          </div>
        }
      />

      {/* Geocerca status */}
      <Panel glowColor={DS.glowPurple} style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ position:"relative", width:44, height:44, flexShrink:0 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px dashed ${DS.glowPurple}44`, animation:"spin 12s linear infinite" }} />
            <div style={{ position:"absolute", inset:"20%", borderRadius:"50%", border:`1px solid ${DS.glowPurple}88` }} />
            <div style={{ position:"absolute", inset:"38%", borderRadius:"50%", background:DS.glowPurple, boxShadow:glowStrong(DS.glowPurple) }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:DS.sans, fontSize:13, fontWeight:700, color:DS.text, letterSpacing:"0.1em", textTransform:"uppercase" }}>Módulo Geocerca — Activo</div>
            <div style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim, marginTop:4 }}>
              Registro automático vía GPS al entrar/salir del perímetro. App móvil con verificación en tiempo real.
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {db.locations.map(l=>(
              <div key={l.id} style={{ padding:"8px 12px", background:DS.bgAlt, border:`1px solid ${DS.border}`, textAlign:"center", minWidth:80 }}>
                <div style={{ fontFamily:DS.mono, fontSize:13, fontWeight:800, color:DS.glowPurple }}>{l.radius}m</div>
                <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim, marginTop:2 }}>{l.name.split(" ")[0].toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel noPad>
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${DS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Tag label="REGISTROS" value={`${db.timeRecords.length} TOTAL`} />
          <div style={{ display:"flex", gap:14 }}>
            <Tag label="HOY" value={`${db.timeRecords.filter(r=>r.date==="2025-02-24").length}`} color={DS.glowGreen} />
            <Tag label="ACTIVOS" value={`${db.timeRecords.filter(r=>!r.exit).length}`} color={DS.glowAmber} />
          </div>
        </div>
        <Table
          cols={[
            { key:"empId", label:"Empleado", render: row => {
              const emp = db.employees.find(e=>e.id===row.empId);
              const dept = getDept(row.empId);
              return (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Avatar initials={emp?.avatar||"??"} color={dept?.color||DS.glow} size={28} />
                  <span style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:DS.text }}>{emp?.name||row.empId}</span>
                </div>
              );
            }},
            { key:"date", label:"Fecha", mono:true },
            { key:"entry", label:"Entrada", render: row => <span style={{ fontFamily:DS.mono, color:DS.glowGreen }}>{row.entry}</span> },
            { key:"exit", label:"Salida", render: row => <span style={{ fontFamily:DS.mono, color:row.exit?DS.glowRed:DS.glowAmber }}>{row.exit||"EN TURNO"}</span> },
            { key:"hours", label:"Horas", render: row => <span style={{ fontFamily:DS.mono, color:DS.text }}>{row.hours?`${row.hours}h`:"—"}</span> },
            { key:"type", label:"Tipo", render: row => <Chip color={row.type==="geocerca"?DS.glowPurple:DS.glow}>{row.type==="geocerca"?"GEOCERCA":"MANUAL"}</Chip> },
            { key:"status", label:"Estado", render: row => (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}><StatusDot status={row.status} /><span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textMid }}>{row.status.toUpperCase()}</span></div>
            )},
          ]}
          rows={db.timeRecords}
        />
      </Panel>

      {modal && (
        <Modal title="REGISTRO MANUAL DE TIEMPO" onClose={()=>setModal(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <Input label="Empleado" type="select" value={form.empId} onChange={v=>setForm(p=>({...p,empId:v}))}
                options={db.employees.filter(e=>e.status==="active").map(e=>({v:e.id,l:e.name}))} />
            </div>
            <Input label="Fecha" type="date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} />
            <Input label="Tipo" type="select" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={[{v:"manual",l:"Manual"},{v:"geocerca",l:"Geocerca"}]} />
            <Input label="Hora Entrada" type="time" value={form.entry} onChange={v=>setForm(p=>({...p,entry:v}))} required />
            <Input label="Hora Salida" type="time" value={form.exit} onChange={v=>setForm(p=>({...p,exit:v}))} />
          </div>
          <div style={{ margin:"16px 0", padding:"10px 14px", background:`${DS.glowAmber}08`, border:`1px solid ${DS.glowAmber}33` }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <AlertTriangle size={12} color={DS.glowAmber} />
              <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.glowAmber }}>REQUIERE APROBACIÓN DEL SUPERVISOR</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn onClick={()=>setModal(false)} color={DS.textDim} variant="ghost" icon={X}>CANCELAR</Btn>
            <Btn onClick={handleAdd} icon={CheckCircle} color={DS.glowGreen}>REGISTRAR</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ViewLocations = ({ db, upsertLocation, deleteLocation }) => {
  const [modal, setModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name:"", address:"", lat:"", lng:"", radius:"150", country:"MX", timezone:"America/Mexico_City" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saved, setSaved] = useState(false);

  const openNew = () => {
    setForm({ name:"", address:"", lat:"", lng:"", radius:"150", country:"MX", timezone:"America/Mexico_City" });
    setEditMode(false);
    setModal(true);
  };

  const openEdit = (loc) => {
    setForm({ ...loc, lat: String(loc.lat), lng: String(loc.lng), radius: String(loc.radius) });
    setEditMode(true);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.lat || !form.lng) return;
    await upsertLocation({
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      radius: Number(form.radius),
      id: editMode ? form.id : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setModal(false);
  };

  const handleDelete = (loc) => {
    deleteLocation(loc.id);
    setDeleteConfirm(null);
  };

  const countryOpts = [{ v:"MX", l:"🇲🇽 México (SAT)" }, { v:"US", l:"🇺🇸 California (IRS+FTB)" }];
  const tzOpts = [
    { v:"America/Mexico_City", l:"America/Mexico_City (UTC-6)" },
    { v:"America/Monterrey", l:"America/Monterrey (UTC-6)" },
    { v:"America/Tijuana", l:"America/Tijuana (UTC-8)" },
    { v:"America/Los_Angeles", l:"America/Los_Angeles (UTC-8)" },
    { v:"America/New_York", l:"America/New_York (UTC-5)" },
  ];

  return (
    <div>
      {/* Header con botón siempre visible */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:2, height:18, background:DS.glow, boxShadow:glow(DS.glow,4) }} />
          <MapPin size={15} color={DS.glow} />
          <span style={{ fontFamily:DS.sans, fontSize:16, fontWeight:700, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>
            Ubicaciones & Geocercas
          </span>
          <Chip color={DS.textDim}>{db.locations.length} SEDES</Chip>
        </div>
        <button
          onClick={openNew}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"9px 18px", borderRadius:1, cursor:"pointer",
            fontSize:12, fontFamily:DS.mono, fontWeight:700, letterSpacing:"0.06em",
            border:`1px solid ${DS.glow}66`,
            background:`${DS.glow}18`,
            color: DS.glow,
            boxShadow:`0 0 12px ${DS.glow}18`,
          }}
        >
          <Plus size={14} />
          NUEVA UBICACIÓN
        </button>
      </div>

      {saved && (
        <div style={{ marginBottom:14, padding:"10px 16px", background:`${DS.glowGreen}10`, border:`1px solid ${DS.glowGreen}44`, display:"flex", gap:8, alignItems:"center" }}>
          <CheckCircle size={13} color={DS.glowGreen} />
          <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.glowGreen }}>UBICACIÓN GUARDADA CORRECTAMENTE EN BASE DE DATOS</span>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {db.locations.map(loc => {
          const isMX = loc.country === "MX";
          const color = isMX ? DS.glowGreen : DS.glow;
          const empCount = db.employees.filter(e => e.location === loc.id && e.status === "active").length;

          return (
            <div key={loc.id} style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderLeft: `3px solid ${color}`,
              position: "relative",
              padding: "18px 22px",
              display: "grid",
              gridTemplateColumns: "72px 1fr auto",
              gap: 20,
              alignItems: "center",
              boxShadow: `inset 0 0 20px ${color}06, 0 4px 24px rgba(0,0,0,.4)`,
            }}>
              <HudCorner pos="tl" color={color} size={8} />
              <HudCorner pos="br" color={color} size={8} />

              {/* Radar visual */}
              <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px dashed ${color}33`, animation:"spin 18s linear infinite" }} />
                <div style={{ position:"absolute", inset:"18%", borderRadius:"50%", border:`1px solid ${color}55` }} />
                <div style={{ position:"absolute", inset:"36%", borderRadius:"50%", border:`1px solid ${color}88` }} />
                <div style={{ position:"absolute", inset:"50%", borderRadius:"50%", background:color, boxShadow:glowStrong(color), transform:"translate(-50%,-50%)", width:10, height:10 }} />
                <div style={{ position:"absolute", top:2, right:8, fontFamily:DS.mono, fontSize:7, color, fontWeight:800, letterSpacing:"0.1em" }}>
                  {isMX ? "MX" : "US"}
                </div>
                <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", fontFamily:DS.mono, fontSize:7, color:DS.textDim }}>
                  {loc.radius}m
                </div>
              </div>

              {/* Info */}
              <div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontFamily:DS.sans, fontSize:17, fontWeight:800, color:DS.text, letterSpacing:"0.08em", textTransform:"uppercase" }}>{loc.name}</span>
                  <Chip color={color}>{isMX ? "SAT MX" : "IRS+CA"}</Chip>
                  {empCount > 0 && <Chip color={DS.glowAmber}>{empCount} EMP.</Chip>}
                </div>
                <div style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim, marginBottom:12 }}>
                  <Navigation size={9} color={DS.textDim} style={{ display:"inline", marginRight:4 }} />
                  {loc.address}
                </div>
                <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                  {[
                    { l:"LATITUD",  v:Number(loc.lat).toFixed(4) },
                    { l:"LONGITUD", v:Number(loc.lng).toFixed(4) },
                    { l:"RADIO",    v:`${loc.radius} m`, c:color },
                    { l:"ZONA HORARIA", v:loc.timezone?.split("/")[1]?.replace("_"," ")||"—" },
                    { l:"RÉGIMEN FISCAL", v:isMX?"SAT · LISR · IMSS":"IRS FED. + CA FTB", c:color },
                  ].map(t => (
                    <div key={t.l}>
                      <div style={{ fontSize:8, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.1em", marginBottom:2 }}>{t.l}</div>
                      <div style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:t.c || DS.textMid }}>{t.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button onClick={() => openEdit(loc)} style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"6px 14px", border:`1px solid ${DS.glow}44`,
                  background:`${DS.glow}10`, color:DS.glow,
                  fontFamily:DS.mono, fontSize:10, fontWeight:700, cursor:"pointer", borderRadius:1,
                }}>
                  <Edit size={11} /> EDITAR
                </button>
                <button onClick={() => setDeleteConfirm(loc)} style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"6px 14px", border:`1px solid ${DS.glowRed}44`,
                  background:`${DS.glowRed}08`, color:DS.glowRed,
                  fontFamily:DS.mono, fontSize:10, fontWeight:700, cursor:"pointer", borderRadius:1,
                }}>
                  <Trash2 size={11} /> BAJA
                </button>
              </div>
            </div>
          );
        })}

        {db.locations.length === 0 && (
          <div style={{ padding:"40px", textAlign:"center", border:`1px dashed ${DS.border}`, background:DS.surface }}>
            <MapPin size={32} color={DS.textDim} style={{ margin:"0 auto 12px" }} />
            <div style={{ fontFamily:DS.mono, fontSize:11, color:DS.textDim }}>SIN UBICACIONES REGISTRADAS</div>
            <button onClick={openNew} style={{ marginTop:16, padding:"8px 20px", background:`${DS.glow}18`, border:`1px solid ${DS.glow}44`, color:DS.glow, fontFamily:DS.mono, fontSize:11, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
              + REGISTRAR PRIMERA UBICACIÓN
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL ALTA / EDICIÓN ── */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(3,7,18,.9)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:1000, backdropFilter:"blur(8px)",
        }} onClick={() => setModal(false)}>
          <div style={{
            background:DS.bgAlt, border:`1px solid ${DS.borderHi}`,
            borderRadius:2, width:580, maxHeight:"90vh", overflowY:"auto",
            padding:28, position:"relative",
            boxShadow:`0 0 40px ${DS.glow}18`,
          }} onClick={e => e.stopPropagation()}>
            <HudCorner pos="tl" color={DS.glow} size={12} />
            <HudCorner pos="tr" color={DS.glow} size={12} />
            <HudCorner pos="bl" color={DS.glow} size={12} />
            <HudCorner pos="br" color={DS.glow} size={12} />

            {/* Modal header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:2, height:16, background:DS.glow, boxShadow:glow(DS.glow) }} />
                <MapPin size={14} color={DS.glow} />
                <span style={{ fontFamily:DS.sans, fontSize:14, fontWeight:800, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>
                  {editMode ? "EDITAR GEOCERCA" : "ALTA DE NUEVA UBICACIÓN"}
                </span>
              </div>
              <button onClick={() => setModal(false)} style={{ background:"none", border:"none", color:DS.textDim, cursor:"pointer", display:"flex" }}>
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <Input label="Nombre de la Sucursal / Sede *" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Ej: Oficina Monterrey Norte" required />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <Input label="Dirección Completa" value={form.address} onChange={v=>setForm(p=>({...p,address:v}))} placeholder="Av. Principal 100, Colonia, Ciudad, CP" />
              </div>
              <Input label="Latitud *" value={form.lat} onChange={v=>setForm(p=>({...p,lat:v}))} placeholder="19.4326" />
              <Input label="Longitud *" value={form.lng} onChange={v=>setForm(p=>({...p,lng:v}))} placeholder="-99.1332" />
              <Input label="Radio de Geocerca (metros)" type="number" value={form.radius} onChange={v=>setForm(p=>({...p,radius:v}))} />
              <Input label="País / Régimen Fiscal" type="select" value={form.country} onChange={v=>setForm(p=>({...p,country:v}))} options={countryOpts} />
              <div style={{ gridColumn:"1/-1" }}>
                <Input label="Zona Horaria" type="select" value={form.timezone} onChange={v=>setForm(p=>({...p,timezone:v}))} options={tzOpts} />
              </div>
            </div>

            {/* Tip */}
            <div style={{ margin:"16px 0", padding:"10px 14px", background:`${DS.glow}08`, border:`1px solid ${DS.glow}22`, display:"flex", gap:8, alignItems:"flex-start" }}>
              <Satellite size={12} color={DS.glow} style={{ marginTop:1, flexShrink:0 }} />
              <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim, lineHeight:1.6 }}>
                Para obtener coordenadas exactas: Google Maps → clic derecho → "¿Qué hay aquí?" · 
                El radio define el perímetro de la geocerca para registro automático desde la app móvil.
              </span>
            </div>

            {/* Fiscal regime preview */}
            <div style={{ padding:"10px 14px", background:DS.surface, border:`1px solid ${DS.border}`, marginBottom:20 }}>
              <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.1em", marginBottom:8 }}>RÉGIMEN FISCAL APLICABLE</div>
              {form.country === "MX" ? (
                <div style={{ display:"flex", gap:16 }}>
                  {[["ISR Art. 96","1.92–35%",DS.glowRed],["IMSS Empleado","~2.1%",DS.glowPurple],["Subsidio Emp.","Art. 113 LISR",DS.glowGreen]].map(([l,v,c])=>(
                    <div key={l}><div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim }}>{l}</div><div style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:c, marginTop:2 }}>{v}</div></div>
                  ))}
                </div>
              ) : (
                <div style={{ display:"flex", gap:16 }}>
                  {[["IRS Federal","10–37%",DS.glowRed],["FICA SS+Med","7.65%",DS.glowAmber],["CA State FTB","1–12.3%",DS.glowPurple],["CA SDI","1.1%",DS.glow]].map(([l,v,c])=>(
                    <div key={l}><div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim }}>{l}</div><div style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:c, marginTop:2 }}>{v}</div></div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setModal(false)} style={{
                display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px",
                border:`1px solid ${DS.textDim}44`, background:"transparent", color:DS.textDim,
                fontFamily:DS.mono, fontSize:12, fontWeight:700, cursor:"pointer", borderRadius:1,
              }}><X size={13} /> CANCELAR</button>
              <button onClick={handleSave} disabled={!form.name||!form.lat||!form.lng} style={{
                display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px",
                border:`1px solid ${DS.glowGreen}66`, background:`${DS.glowGreen}18`, color:DS.glowGreen,
                fontFamily:DS.mono, fontSize:12, fontWeight:700, cursor:"pointer", borderRadius:1,
                opacity: (!form.name||!form.lat||!form.lng) ? 0.5 : 1,
              }}><CheckCircle size={13} /> {editMode ? "ACTUALIZAR" : "GUARDAR UBICACIÓN"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(3,7,18,.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001, backdropFilter:"blur(8px)" }}>
          <div style={{ background:DS.bgAlt, border:`1px solid ${DS.glowRed}55`, padding:28, width:400, position:"relative" }}>
            <HudCorner pos="tl" color={DS.glowRed} size={10} />
            <HudCorner pos="br" color={DS.glowRed} size={10} />
            <div style={{ fontFamily:DS.sans, fontSize:14, fontWeight:800, color:DS.glowRed, letterSpacing:"0.1em", marginBottom:12 }}>CONFIRMAR ELIMINACIÓN</div>
            <div style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid, lineHeight:1.7, marginBottom:20 }}>
              ¿Eliminar la ubicación <span style={{ color:DS.glowRed, fontWeight:700 }}>{deleteConfirm.name}</span>?<br/>
              Los empleados asignados quedarán sin sede activa.
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding:"7px 16px", border:`1px solid ${DS.textDim}44`, background:"transparent", color:DS.textDim, fontFamily:DS.mono, fontSize:11, cursor:"pointer", borderRadius:1 }}>CANCELAR</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding:"7px 16px", border:`1px solid ${DS.glowRed}66`, background:`${DS.glowRed}18`, color:DS.glowRed, fontFamily:DS.mono, fontSize:11, fontWeight:700, cursor:"pointer", borderRadius:1 }}>
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Payroll Result Modal ──────────────────────────────────────
const PayrollResultModal = ({ data, onClose, savePayrollCut }) => {
  const [tab, setTab] = useState("employees");
  const [expanded, setExpanded] = useState(null);
  const { emps, form, db } = data;

  const results = emps.map(e => ({ emp: e, calc: calcPayroll(e) }));
  const totalGross = results.reduce((s,r)=>s+r.calc.base,0);
  const totalDed = results.reduce((s,r)=>s+r.calc.totalDed,0);
  const totalNet = results.reduce((s,r)=>s+r.calc.net,0);

  const byLoc = (db.locations||[]).map(loc => {
    const locR = results.filter(r=>r.emp.location===loc.id);
    if (!locR.length) return null;
    const g=locR.reduce((s,r)=>s+r.calc.base,0), d=locR.reduce((s,r)=>s+r.calc.totalDed,0), n=locR.reduce((s,r)=>s+r.calc.net,0);
    return { loc, results:locR, gross:g, ded:d, net:n };
  }).filter(Boolean);

  const handleConfirm = async () => {
    await savePayrollCut({
      period: `${form.from||"—"} al ${form.to||"—"}`,
      type: form.type, country: form.country,
      employees: emps.length,
      grossTotal: totalGross, totalDed, netTotal: totalNet,
      status:"pendiente", date: new Date().toISOString().slice(0,10),
      createdBy:"admin",
    });
    onClose();
  };

  const TABS = [
    { id:"employees", label:"POR EMPLEADO", icon:Users },
    { id:"locations", label:"POR UBICACIÓN", icon:MapPin },
    { id:"summary", label:"RESUMEN FISCAL", icon:BarChart3 },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(3,7,18,.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(10px)", padding:20 }}>
      <div style={{ background:DS.bgAlt, border:`1px solid ${DS.borderHi}`, borderRadius:2, width:"100%", maxWidth:1000, maxHeight:"93vh", display:"flex", flexDirection:"column", boxShadow:`0 0 60px rgba(0,212,255,.08)` }}>
        <HudCorner pos="tl" color={DS.glow} size={14} />
        <HudCorner pos="tr" color={DS.glow} size={14} />

        {/* Header */}
        <div style={{ padding:"20px 28px", borderBottom:`1px solid ${DS.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:2, height:20, background:DS.glow, boxShadow:glow(DS.glow) }} />
                <span style={{ fontFamily:DS.sans, fontSize:18, fontWeight:800, color:DS.text, letterSpacing:"0.12em", textTransform:"uppercase" }}>RESULTADOS DEL CORTE DE NÓMINA</span>
                <Chip color={DS.glowAmber}>{form.type.toUpperCase()}</Chip>
              </div>
              <div style={{ display:"flex", gap:28 }}>
                {[
                  { l:"BRUTO TOTAL", v:`$${Math.round(totalGross).toLocaleString()}`, c:DS.text },
                  { l:"RETENCIONES", v:`-$${Math.round(totalDed).toLocaleString()}`, c:DS.glowRed },
                  { l:"NETO A DISPERSAR", v:`$${Math.round(totalNet).toLocaleString()}`, c:DS.glowGreen },
                  { l:"EMPLEADOS", v:results.length, c:DS.glow },
                  { l:"TASA EFECTIVA", v:`${((totalDed/totalGross)*100).toFixed(1)}%`, c:DS.glowAmber },
                ].map(k=>(
                  <div key={k.l}>
                    <div style={{ fontSize:8, color:DS.textDim, fontFamily:DS.mono, letterSpacing:"0.12em", marginBottom:3 }}>{k.l}</div>
                    <div style={{ fontFamily:DS.mono, fontSize:16, fontWeight:900, color:k.c }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:DS.textDim, cursor:"pointer" }}><X size={18}/></button>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginTop:16 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                display:"flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:1, border:"none", cursor:"pointer",
                background: tab===t.id ? `${DS.glow}20` : "transparent",
                color: tab===t.id ? DS.glow : DS.textDim,
                fontFamily:DS.mono, fontSize:11, fontWeight:700, letterSpacing:"0.08em",
                borderBottom: tab===t.id ? `2px solid ${DS.glow}` : "2px solid transparent",
              }}>
                <t.icon size={12}/>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 28px" }}>

          {/* ── EMPLOYEES TAB ── */}
          {tab==="employees" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {results.map(({ emp, calc }) => {
                const isMX = emp.country==="MX";
                const dept = db.departments.find(d=>d.id===emp.dept);
                const isExp = expanded===emp.id;
                const color = isMX ? DS.glowGreen : DS.glow;
                return (
                  <div key={emp.id} style={{ border:`1px solid ${isExp?color+"55":DS.border}`, background:DS.surface }}>
                    <div onClick={()=>setExpanded(isExp?null:emp.id)} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 28px", alignItems:"center", padding:"12px 16px", cursor:"pointer", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Avatar initials={emp.avatar} color={dept?.color||color} size={30} />
                        <div>
                          <div style={{ fontFamily:DS.mono, fontSize:12, fontWeight:700, color:DS.text }}>{emp.name}</div>
                          <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>{emp.role}</div>
                        </div>
                      </div>
                      <Chip color={color}>{isMX?"SAT MX":"IRS+CA"}</Chip>
                      <div><div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>BRUTO</div><div style={{ fontFamily:DS.mono, fontSize:12, color:DS.text }}>{calc.currency} ${calc.base.toLocaleString()}</div></div>
                      <div><div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>DEDUC.</div><div style={{ fontFamily:DS.mono, fontSize:12, color:DS.glowRed }}>-${calc.totalDed.toLocaleString()}</div></div>
                      <div><div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>NETO</div><div style={{ fontFamily:DS.mono, fontSize:13, fontWeight:800, color:DS.glowGreen }}>${calc.net.toLocaleString()}</div></div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:36, height:3, background:DS.bg }}>
                          <div style={{ height:"100%", width:`${calc.effectiveRate}%`, background:DS.glowAmber }} />
                        </div>
                        <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.glowAmber }}>{calc.effectiveRate}%</span>
                      </div>
                      <div style={{ color:isExp?DS.glow:DS.textDim, display:"flex" }}>{isExp?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>
                    </div>
                    {isExp && (
                      <div style={{ borderTop:`1px solid ${DS.border}`, padding:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, background:DS.bgAlt }}>
                        <div>
                          <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.12em", marginBottom:10 }}>DESGLOSE DE RETENCIONES</div>
                          {Object.entries(calc.deds).map(([k,v])=>{
                            const isCredit = v<0;
                            return (
                              <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7, paddingBottom:7, borderBottom:`1px solid ${DS.border}33` }}>
                                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                  <div style={{ width:3, height:14, background:isCredit?DS.glowGreen:DS.glowRed }} />
                                  <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid }}>{k}</span>
                                </div>
                                <span style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:isCredit?DS.glowGreen:DS.glowRed }}>
                                  {isCredit?"+":" -"}{calc.currency} ${Math.abs(v).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, paddingTop:6, borderTop:`1px solid ${DS.border}` }}>
                            <span style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:DS.text }}>TOTAL RETENCIONES</span>
                            <span style={{ fontFamily:DS.mono, fontSize:12, fontWeight:800, color:DS.glowRed }}>-{calc.currency} ${calc.totalDed.toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.12em", marginBottom:10 }}>DISTRIBUCIÓN SALARIAL</div>
                          <div style={{ height:20, display:"flex", marginBottom:10, borderRadius:1, overflow:"hidden" }}>
                            {Object.entries(calc.deds).filter(([,v])=>v>0).map(([k,v],i)=>{
                              const colors=[DS.glowRed,"#ff7043","#ff9800",DS.glowAmber,"#cddc39"];
                              return <div key={k} title={`${k}: $${v}`} style={{ width:`${(v/calc.base)*100}%`, background:colors[i%colors.length] }} />;
                            })}
                            <div style={{ flex:1, background:DS.glowGreen }} title="Neto" />
                          </div>
                          <div style={{ padding:"12px 14px", background:DS.surface, border:`1px solid ${DS.glowGreen}33`, marginTop:10 }}>
                            <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>NETO A DEPOSITAR</div>
                            <div style={{ fontFamily:DS.mono, fontSize:22, fontWeight:900, color:DS.glowGreen, marginTop:4 }}>{calc.currency} ${calc.net.toLocaleString()}</div>
                          </div>
                          {!isMX && (
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:10 }}>
                              {[["FED. RATE",calc.fedRate+"%"],["CA RATE",calc.caRate+"%"],["TOTAL",calc.effectiveRate+"%"]].map(([l,v])=>(
                                <div key={l} style={{ padding:"8px", background:DS.surface, border:`1px solid ${DS.border}`, textAlign:"center" }}>
                                  <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim }}>{l}</div>
                                  <div style={{ fontFamily:DS.mono, fontSize:13, fontWeight:800, color:DS.glowAmber }}>{v}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LOCATIONS TAB ── */}
          {tab==="locations" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {byLoc.map(({ loc, results:lr, gross, ded, net }) => {
                const isMX = loc.country==="MX";
                const color = isMX ? DS.glowGreen : DS.glow;
                const curr = isMX?"MXN":"USD";
                const dedTypes = {};
                lr.forEach(r=>Object.entries(r.calc.deds).forEach(([k,v])=>{ dedTypes[k]=(dedTypes[k]||0)+Math.abs(v); }));
                return (
                  <Panel key={loc.id} glowColor={color} noPad>
                    <div style={{ padding:"16px 20px", borderBottom:`1px solid ${DS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:`${color}06` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <Navigation size={18} color={color} />
                        <div>
                          <div style={{ fontFamily:DS.sans, fontSize:15, fontWeight:800, color:DS.text, letterSpacing:"0.1em", textTransform:"uppercase" }}>{loc.name}</div>
                          <div style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim }}>{loc.address}</div>
                          <Chip color={color} style={{ marginTop:4 }}>{isMX?"SAT MÉXICO · LISR + LSS":"IRS FEDERAL + CA FTB + SDI 2025"}</Chip>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:20 }}>
                        {[
                          {l:"EMP.",v:lr.length,c:DS.text},
                          {l:"BRUTO",v:`${curr} $${Math.round(gross).toLocaleString()}`,c:DS.text},
                          {l:"IMPUESTOS",v:`-$${Math.round(ded).toLocaleString()}`,c:DS.glowRed},
                          {l:"NETO",v:`${curr} $${Math.round(net).toLocaleString()}`,c:DS.glowGreen},
                        ].map(k=>(
                          <div key={k.l} style={{ textAlign:"right" }}>
                            <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim, letterSpacing:"0.12em" }}>{k.l}</div>
                            <div style={{ fontFamily:DS.mono, fontSize:14, fontWeight:800, color:k.c }}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                      <div style={{ padding:"16px 20px", borderRight:`1px solid ${DS.border}` }}>
                        <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.12em", marginBottom:12 }}>RETENCIONES POR CONCEPTO</div>
                        {Object.entries(dedTypes).map(([k,v])=>{
                          const pct = ((v/gross)*100).toFixed(1);
                          return (
                            <div key={k} style={{ marginBottom:8 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid }}>{k}</span>
                                <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.glowRed, fontWeight:700 }}>-{curr} ${Math.round(v).toLocaleString()} <span style={{ color:DS.textDim, fontWeight:400 }}>({pct}%)</span></span>
                              </div>
                              <div style={{ height:2, background:DS.bg }}>
                                <div style={{ height:"100%", width:`${(v/ded)*100}%`, background:DS.glowRed }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ padding:"16px 20px" }}>
                        <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.12em", marginBottom:12 }}>EMPLEADOS ({lr.length})</div>
                        {lr.map(({emp,calc})=>(
                          <div key={emp.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:DS.bg, border:`1px solid ${DS.border}`, marginBottom:6 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <Avatar initials={emp.avatar} color={color} size={24} />
                              <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.text }}>{emp.name}</span>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontFamily:DS.mono, fontSize:12, fontWeight:700, color:DS.glowGreen }}>${calc.net.toLocaleString()}</div>
                              <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>de ${calc.base.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                        <div style={{ height:16, display:"flex", marginTop:10, borderRadius:1, overflow:"hidden" }}>
                          <div style={{ width:`${(net/gross)*100}%`, background:DS.glowGreen }} />
                          <div style={{ flex:1, background:DS.glowRed }} />
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                          <span style={{ fontFamily:DS.mono, fontSize:9, color:DS.glowGreen }}>NETO {((net/gross)*100).toFixed(1)}%</span>
                          <span style={{ fontFamily:DS.mono, fontSize:9, color:DS.glowRed }}>IMPUESTOS {((ded/gross)*100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}

          {/* ── SUMMARY TAB ── */}
          {tab==="summary" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                {[
                  {country:"MX",flag:"MX",label:"MÉXICO — SAT LISR + LSS",color:DS.glowGreen,curr:"MXN"},
                  {country:"US",flag:"US",label:"CALIFORNIA — IRS + CA FTB",color:DS.glow,curr:"USD"},
                ].map(({ country, flag, label, color, curr }) => {
                  const r=results.filter(x=>x.emp.country===country);
                  if (!r.length) return <div key={country} style={{ padding:20, border:`1px solid ${DS.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textDim }}>SIN EMPLEADOS EN ESTE RÉGIMEN</span></div>;
                  const g=r.reduce((s,x)=>s+x.calc.base,0), d=r.reduce((s,x)=>s+x.calc.totalDed,0), n=r.reduce((s,x)=>s+x.calc.net,0);
                  const dedByType = {};
                  r.forEach(x=>Object.entries(x.calc.deds).forEach(([k,v])=>{ dedByType[k]=(dedByType[k]||0)+Math.abs(v); }));
                  return (
                    <Panel key={country} glowColor={color}>
                      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
                        <Chip color={color}>{flag}</Chip>
                        <span style={{ fontFamily:DS.sans, fontSize:13, fontWeight:700, color:DS.text, letterSpacing:"0.08em" }}>{label}</span>
                        <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim }}>{r.length} emp.</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                        {[["BRUTO",g,DS.text],["DEDUC.",d,DS.glowRed],["NETO",n,DS.glowGreen]].map(([l,v,c])=>(
                          <div key={l} style={{ padding:"10px 12px", background:DS.bgAlt, border:`1px solid ${DS.border}` }}>
                            <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim, letterSpacing:"0.1em" }}>{l}</div>
                            <div style={{ fontFamily:DS.mono, fontSize:14, fontWeight:800, color:c, marginTop:4 }}>{curr} ${Math.round(v).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                      {Object.entries(dedByType).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                          <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textMid }}>{k}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:50, height:3, background:DS.bg }}>
                              <div style={{ height:"100%", width:`${(v/d)*100}%`, background:color }} />
                            </div>
                            <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.glowRed, fontWeight:700 }}>-{curr} ${Math.round(v).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </Panel>
                  );
                })}
              </div>

              {/* Waterfall chart */}
              <Panel>
                <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.12em", marginBottom:16 }}>DISTRIBUCIÓN SALARIAL — TODOS LOS EMPLEADOS</div>
                {results.sort((a,b)=>b.calc.net-a.calc.net).map(({emp,calc})=>(
                  <div key={emp.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
                    <div style={{ width:120, fontFamily:DS.mono, fontSize:10, color:DS.textMid, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{emp.name.split(" ")[0]} {emp.name.split(" ")[1]?.[0]}.</div>
                    <div style={{ flex:1, height:16, display:"flex", borderRadius:0, overflow:"hidden" }}>
                      <div style={{ width:`${(calc.net/calc.base)*100}%`, background:emp.country==="MX"?`${DS.glowGreen}cc`:`${DS.glow}cc` }} />
                      <div style={{ flex:1, background:`${DS.glowRed}44` }} />
                    </div>
                    <div style={{ width:130, display:"flex", justifyContent:"space-between", fontFamily:DS.mono, fontSize:10 }}>
                      <span style={{ color:DS.glowGreen }}>${calc.net.toLocaleString()}</span>
                      <span style={{ color:DS.textDim }}>/{calc.base.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </Panel>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 28px", borderTop:`1px solid ${DS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, background:DS.surface }}>
          <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>
            CÁLCULO ESTIMADO · SAT LISR 2025 · IRS PUB. 15-T 2025 · CA FTB 2025 · SINGLE FILER
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn icon={Download} color={DS.textDim} variant="ghost" size="sm">EXPORTAR</Btn>
            <Btn onClick={handleConfirm} icon={CheckCircle} color={DS.glowGreen}>CONFIRMAR Y GUARDAR CORTE</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewPayroll = ({ db, savePayrollCut }) => {
  const [showCut, setShowCut] = useState(false);
  const [cutForm, setCutForm] = useState({ type:"quincenal", from:"", to:"", country:"MX" });
  const [payrollResult, setPayrollResult] = useState(null);
  const [filterCountry, setFilterCountry] = useState("all");

  const activeEmps = (db?.employees||[]).filter(e=>e.status==="active");
  const filtered = filterCountry==="all" ? activeEmps : activeEmps.filter(e=>e.country===filterCountry);

  const handleProcess = () => {
    const emps = activeEmps.filter(e=>
      (cutForm.country==="all"||e.country===cutForm.country) &&
      (cutForm.type==="all"||e.payroll===cutForm.type)
    );
    setPayrollResult({ emps, form:{...cutForm}, db });
    setShowCut(false);
  };

  if (!db) return null;

  return (
    <div>
      <SectionHeader icon={DollarSign} label="Nómina & Motor Fiscal"
        action={<Btn onClick={()=>setShowCut(true)} icon={Zap} color={DS.glowAmber}>NUEVO CORTE</Btn>}
      />

      {/* Regime cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        {[
          { country:"MX", flag:"🇲🇽", label:"RÉGIMEN SAT MÉXICO", sub:"LISR · LSS · IMSS 2025", color:DS.glowGreen, curr:"MXN",
            items:[{l:"ISR Art. 96",v:"1.92–35%"},{l:"IMSS Empleado",v:"~2.1%"},{l:"Subsidio Emp.",v:"Art. 113"}] },
          { country:"US", flag:"🇺🇸", label:"IRS FED. + CALIFORNIA FTB", sub:"IRS Pub. 15-T · CA FTB · SDI 2025", color:DS.glow, curr:"USD",
            items:[{l:"Federal IRS",v:"10–37%"},{l:"FICA SS+Med",v:"7.65%"},{l:"CA State",v:"1–12.3%"}] },
        ].map(({country,flag,label,sub,color,curr,items}) => {
          const r = activeEmps.filter(e=>e.country===country);
          const net = r.reduce((s,e)=>s+calcPayroll(e).net, 0);
          return (
            <Panel key={country} glowColor={color} style={{ overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                    <Shield size={14} color={color} />
                    <span style={{ fontFamily:DS.sans, fontSize:13, fontWeight:800, color:DS.text, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
                  </div>
                  <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>{sub}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim }}>NETO PERÍODO</div>
                  <div style={{ fontFamily:DS.mono, fontSize:18, fontWeight:900, color:DS.glowGreen }}>{curr} ${Math.round(net).toLocaleString()}</div>
                  <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>{r.length} empleados</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {items.map(item=>(
                  <div key={item.l} style={{ padding:"8px 10px", background:DS.bgAlt, border:`1px solid ${DS.border}` }}>
                    <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim, letterSpacing:"0.1em" }}>{item.l}</div>
                    <div style={{ fontFamily:DS.mono, fontSize:12, fontWeight:700, color, marginTop:4 }}>{item.v}</div>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Employee payroll table */}
      <Panel noPad>
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${DS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <ClipboardList size={13} color={DS.glow} />
            <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textMid, letterSpacing:"0.1em" }}>CÁLCULO POR EMPLEADO</span>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[["all","TODOS"],["MX","🇲🇽 MX"],["US","🇺🇸 US"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilterCountry(v)} style={{
                padding:"4px 12px", border:"none", cursor:"pointer", fontFamily:DS.mono, fontSize:9, fontWeight:700,
                background: filterCountry===v ? `${DS.glow}22` : "transparent",
                color: filterCountry===v ? DS.glow : DS.textDim,
                borderBottom: filterCountry===v ? `2px solid ${DS.glow}` : "2px solid transparent",
              }}>{l}</button>
            ))}
          </div>
        </div>
        <Table
          cols={[
            { key:"name", label:"Empleado", render: row => {
              const dept=db.departments.find(d=>d.id===row.dept);
              return <div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar initials={row.avatar} color={dept?.color||DS.glow} size={28} /><div><div style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:DS.text }}>{row.name}</div><div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim }}>{row.payroll}</div></div></div>;
            }},
            { key:"regime", label:"Régimen", render: row => <Chip color={row.country==="MX"?DS.glowGreen:DS.glow}>{row.country==="MX"?"SAT MX":"IRS+CA"}</Chip> },
            { key:"loc", label:"Ubicación", render: row => { const loc=db.locations.find(l=>l.id===row.location); return <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textMid }}>{loc?.name||"—"}</span>; }},
            { key:"gross", label:"Bruto", render: row => { const c=calcPayroll(row); return <span style={{ fontFamily:DS.mono, fontSize:12, color:DS.text }}>{c.currency} ${c.base.toLocaleString()}</span>; }},
            { key:"ded", label:"Deduc.", render: row => { const c=calcPayroll(row); return <span style={{ fontFamily:DS.mono, fontSize:12, color:DS.glowRed }}>-${c.totalDed.toLocaleString()}</span>; }},
            { key:"net", label:"Neto", render: row => { const c=calcPayroll(row); return <span style={{ fontFamily:DS.mono, fontSize:13, fontWeight:800, color:DS.glowGreen }}>${c.net.toLocaleString()}</span>; }},
            { key:"rate", label:"Tasa Ef.", render: row => { const c=calcPayroll(row); return <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:40, height:3, background:DS.bg }}><div style={{ height:"100%", width:`${c.effectiveRate}%`, background:DS.glowAmber }} /></div><span style={{ fontFamily:DS.mono, fontSize:10, color:DS.glowAmber }}>{c.effectiveRate}%</span></div>; }},
          ]}
          rows={filtered}
        />
      </Panel>

      {/* Cut history */}
      <Panel style={{ marginTop:16 }}>
        <SectionHeader icon={FileText} label="Historial de Cortes" />
        <Table
          cols={[
            { key:"period", label:"Período", render: row => <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.text }}>{row.period}</span> },
            { key:"type", label:"Tipo", render: row => <Chip color={DS.glowAmber}>{row.type}</Chip> },
            { key:"country", label:"Régimen", render: row => <Chip color={row.country==="MX"?DS.glowGreen:row.country==="US"?DS.glow:DS.textMid}>{row.country==="all"?"GLOBAL":row.country==="MX"?"SAT MX":"IRS+CA"}</Chip> },
            { key:"employees", label:"Emp.", mono:true },
            { key:"grossTotal", label:"Bruto", render: row => <span style={{ fontFamily:DS.mono, fontSize:12, color:DS.text }}>${row.grossTotal.toLocaleString()}</span> },
            { key:"totalDed", label:"Deduc.", render: row => <span style={{ fontFamily:DS.mono, fontSize:12, color:DS.glowRed }}>-${row.totalDed.toLocaleString()}</span> },
            { key:"netTotal", label:"Neto", render: row => <span style={{ fontFamily:DS.mono, fontSize:13, fontWeight:800, color:DS.glowGreen }}>${row.netTotal.toLocaleString()}</span> },
            { key:"status", label:"Estado", render: row => <div style={{ display:"flex", gap:5, alignItems:"center" }}><StatusDot status={row.status} /><Chip color={row.status==="pagado"?DS.glowGreen:DS.glowAmber}>{row.status.toUpperCase()}</Chip></div> },
            { key:"date", label:"Fecha", mono:true },
          ]}
          rows={db.payrollCuts}
        />
      </Panel>

      {showCut && (
        <Modal title="CONFIGURAR CORTE DE NÓMINA" onClose={()=>setShowCut(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Input label="País / Régimen" type="select" value={cutForm.country} onChange={v=>setCutForm(p=>({...p,country:v}))}
              options={[{v:"MX",l:"🇲🇽 México (SAT)"},{v:"US",l:"🇺🇸 California (IRS+FTB)"},{v:"all",l:"🌎 Ambos"}]} />
            <Input label="Tipo de Nómina" type="select" value={cutForm.type} onChange={v=>setCutForm(p=>({...p,type:v}))}
              options={[{v:"semanal",l:"Semanal"},{v:"quincenal",l:"Quincenal"},{v:"biweekly",l:"Biweekly (US)"},{v:"mensual",l:"Mensual"},{v:"all",l:"Todos"}]} />
            <Input label="Fecha Inicio" type="date" value={cutForm.from} onChange={v=>setCutForm(p=>({...p,from:v}))} />
            <Input label="Fecha Fin" type="date" value={cutForm.to} onChange={v=>setCutForm(p=>({...p,to:v}))} />
          </div>
          {/* Preview */}
          <div style={{ margin:"16px 0", background:DS.bgAlt, border:`1px solid ${DS.border}`, padding:"12px 16px" }}>
            <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.1em", marginBottom:10 }}>PREVISUALIZACIÓN</div>
            {[{c:"MX",l:"MX · SAT",col:DS.glowGreen,curr:"MXN"},{c:"US",l:"US · IRS+CA",col:DS.glow,curr:"USD"}].map(({c,l,col,curr})=>{
              if (cutForm.country!=="all"&&cutForm.country!==c) return null;
              const emps=activeEmps.filter(e=>e.country===c&&(cutForm.type==="all"||e.payroll===cutForm.type));
              const net=emps.reduce((s,e)=>s+calcPayroll(e).net,0);
              const gross=emps.reduce((s,e)=>s+calcPayroll(e).base,0);
              const ded=emps.reduce((s,e)=>s+calcPayroll(e).totalDed,0);
              return (
                <div key={c} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${DS.border}33` }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}><Chip color={col}>{l}</Chip><span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim }}>{emps.length} emp.</span></div>
                  <div style={{ display:"flex", gap:16 }}>
                    <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.text }}>{curr} ${Math.round(gross).toLocaleString()}</span>
                    <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.glowRed }}>-${Math.round(ded).toLocaleString()}</span>
                    <span style={{ fontFamily:DS.mono, fontSize:12, fontWeight:800, color:DS.glowGreen }}>${Math.round(net).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn onClick={()=>setShowCut(false)} color={DS.textDim} variant="ghost" icon={X}>CANCELAR</Btn>
            <Btn onClick={handleProcess} icon={Zap} color={DS.glowAmber}>PROCESAR CORTE</Btn>
          </div>
        </Modal>
      )}

      {payrollResult && <PayrollResultModal data={payrollResult} onClose={()=>setPayrollResult(null)} savePayrollCut={savePayrollCut} />}
    </div>
  );
};

const ViewBI = ({ db }) => {
  if (!db) return null;
  const depts = db.departments;
  const empsByDept = depts.map(d => ({ dept:d, count:db.employees.filter(e=>e.dept===d.id&&e.status==="active").length }));
  const totalNet = db.employees.filter(e=>e.status==="active").reduce((s,e)=>s+calcPayroll(e).net,0);
  const totalGross = db.employees.filter(e=>e.status==="active").reduce((s,e)=>s+calcPayroll(e).base,0);

  return (
    <div>
      <SectionHeader icon={BarChart3} label="Reportes de Inteligencia" action={
        <div style={{ display:"flex", gap:8 }}>
          <Btn icon={Download} color={DS.textDim} variant="ghost" size="sm">CSV</Btn>
          <Btn icon={FileText} color={DS.textDim} variant="ghost" size="sm">PDF</Btn>
        </div>
      } />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        <KpiCard icon={Activity} label="Horas Semana" value="2,448h" sub="Todas las sedes" color={DS.glow} trend={3} />
        <KpiCard icon={TrendingUp} label="Asistencia Promedio" value="89.2%" sub="vs 87.4% sem. ant." color={DS.glowGreen} trend={2} />
        <KpiCard icon={AlertCircle} label="Incidencias" value="31" sub="tardanzas + ausencias" color={DS.glowAmber} trend={-8} />
        <KpiCard icon={DollarSign} label="Costo Total Nómina" value={`$${Math.round(totalNet/1000)}k`} sub="período actual" color={DS.glowPurple} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Dept distribution */}
        <Panel>
          <SectionHeader icon={Building2} label="Empleados por Departamento" />
          {empsByDept.sort((a,b)=>b.count-a.count).map(({ dept, count }) => {
            const maxC = Math.max(...empsByDept.map(x=>x.count));
            return (
              <div key={dept.id} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid }}>{dept.name}</span>
                  <span style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:dept.color }}>{count} EMP.</span>
                </div>
                <div style={{ height:4, background:DS.bgAlt }}>
                  <div style={{ height:"100%", width:`${(count/maxC)*100}%`, background:dept.color, boxShadow:`0 0 8px ${dept.color}66`, transition:"width 1s" }} />
                </div>
              </div>
            );
          })}
        </Panel>

        {/* Payroll cost by dept */}
        <Panel>
          <SectionHeader icon={DollarSign} label="Costo de Nómina por Depto." />
          {depts.map(dept => {
            const emps = db.employees.filter(e=>e.dept===dept.id&&e.status==="active");
            const netDept = emps.reduce((s,e)=>s+calcPayroll(e).net,0);
            const pct = totalNet > 0 ? ((netDept/totalNet)*100).toFixed(0) : 0;
            return (
              <div key={dept.id} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontFamily:DS.mono, fontSize:11, color:DS.textMid }}>{dept.name}</span>
                  <div style={{ display:"flex", gap:10 }}>
                    <span style={{ fontFamily:DS.mono, fontSize:10, color:DS.textDim }}>{pct}%</span>
                    <span style={{ fontFamily:DS.mono, fontSize:11, fontWeight:700, color:dept.color }}>${Math.round(netDept).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ height:4, background:DS.bgAlt }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:dept.color, boxShadow:`0 0 6px ${dept.color}55` }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      {/* Attendance heatmap simulation */}
      <Panel>
        <SectionHeader icon={CalendarDays} label="Asistencia Semanal por Día" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {[
            {d:"LUN",p:58,a:4,t:3},{d:"MAR",p:61,a:2,t:2},{d:"MIÉ",p:55,a:7,t:3},
            {d:"JUE",p:60,a:3,t:2},{d:"VIE",p:52,a:8,t:5},
          ].map(day=>{
            const total=day.p+day.a+day.t;
            return (
              <div key={day.d} style={{ background:DS.bgAlt, border:`1px solid ${DS.border}`, padding:"14px 12px" }}>
                <div style={{ fontFamily:DS.sans, fontSize:16, fontWeight:800, color:DS.text, letterSpacing:"0.1em", marginBottom:10 }}>{day.d}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {[{l:"PRES.",v:day.p,c:DS.glowGreen},{l:"AUS.",v:day.a,c:DS.glowRed},{l:"TARD.",v:day.t,c:DS.glowAmber}].map(s=>(
                    <div key={s.l}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                        <span style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim }}>{s.l}</span>
                        <span style={{ fontFamily:DS.mono, fontSize:10, fontWeight:700, color:s.c }}>{s.v}</span>
                      </div>
                      <div style={{ height:2, background:DS.bg }}>
                        <div style={{ height:"100%", width:`${(s.v/total)*100}%`, background:s.c }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Fiscal summary */}
      <Panel style={{ marginTop:16 }} glowColor={DS.glowAmber}>
        <SectionHeader icon={CreditCard} label="Análisis Fiscal Global" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          {[
            {l:"Total Bruto",v:`$${Math.round(totalGross).toLocaleString()}`,c:DS.text,i:Briefcase},
            {l:"Total Impuestos",v:`-$${Math.round(totalGross-totalNet).toLocaleString()}`,c:DS.glowRed,i:Shield},
            {l:"Total Neto",v:`$${Math.round(totalNet).toLocaleString()}`,c:DS.glowGreen,i:CreditCard},
          ].map(k=>(
            <div key={k.l} style={{ padding:"16px", background:DS.bgAlt, border:`1px solid ${DS.border}`, display:"flex", gap:12, alignItems:"center" }}>
              <k.i size={22} color={k.c} />
              <div>
                <div style={{ fontFamily:DS.mono, fontSize:9, color:DS.textDim, letterSpacing:"0.1em" }}>{k.l}</div>
                <div style={{ fontFamily:DS.mono, fontSize:18, fontWeight:900, color:k.c, marginTop:4 }}>{k.v}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  SIDEBAR NAV
// ═══════════════════════════════════════════════
const NAV = [
  { id:"dashboard", icon:LayoutDashboard, label:"DASHBOARD" },
  { id:"employees", icon:Users, label:"EMPLEADOS" },
  { id:"time", icon:Clock, label:"CONTROL TIEMPO" },
  { id:"locations", icon:MapPin, label:"GEOCERCAS" },
  { id:"payroll", icon:DollarSign, label:"NÓMINA" },
  { id:"reports", icon:BarChart3, label:"REPORTES BI" },
];

// ═══════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("dashboard");
  const { db, loading, error, refetch, upsertEmployee, deleteEmployee, upsertLocation, deleteLocation, addTimeRecord, savePayrollCut } = useDB();

  if (loading) return (
    <div style={{ background:DS.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:DS.mono }}>
      <div style={{ textAlign:"center" }}>
        <Loader2 size={32} color={DS.glow} style={{ animation:"spin 1s linear infinite", marginBottom:16 }} />
        <div style={{ color:DS.textDim, fontSize:11, letterSpacing:"0.2em" }}>INICIALIZANDO BASE DE DATOS...</div>
      </div>
    </div>
  );

  return (
    <div style={{ background:DS.bg, minHeight:"100vh", display:"flex", fontFamily:DS.sans, color:DS.text, position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${DS.bg}; }
        ::-webkit-scrollbar-thumb { background:${DS.border}; }
        input, select, textarea { font-family:${DS.mono} !important; color-scheme:dark; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ping { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.6);opacity:0} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        body { background:${DS.bg}; }
      `}</style>

      {/* Scanline overlay */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
        <div style={{ position:"absolute", left:0, right:0, height:2, background:`linear-gradient(transparent,${DS.glow}08,transparent)`, animation:"scanline 6s linear infinite" }} />
      </div>

      {/* Grid background */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:`linear-gradient(${DS.border}18 1px,transparent 1px),linear-gradient(90deg,${DS.border}18 1px,transparent 1px)`, backgroundSize:"40px 40px" }} />

      {/* Sidebar */}
      <div style={{ width:220, background:DS.bgAlt, borderRight:`1px solid ${DS.border}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", zIndex:10, flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${DS.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, border:`1px solid ${DS.glow}88`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:glow(DS.glow,6), position:"relative" }}>
              <HudCorner pos="tl" color={DS.glow} size={6} />
              <HudCorner pos="br" color={DS.glow} size={6} />
              <Cpu size={16} color={DS.glow} />
            </div>
            <div>
              <div style={{ fontFamily:DS.sans, fontSize:14, fontWeight:800, color:DS.text, letterSpacing:"0.15em" }}>TIMECLOCK</div>
              <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim, letterSpacing:"0.1em" }}>v2.0 // ENTERPRISE</div>
            </div>
          </div>
          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
            <StatusDot status="active" />
            <span style={{ fontFamily:DS.mono, fontSize:8, color:DS.glowGreen, letterSpacing:"0.08em" }}>SISTEMA OPERATIVO</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => {
            const active = view===n.id;
            return (
              <button key={n.id} onClick={()=>setView(n.id)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"9px 10px", border:"none", cursor:"pointer", borderRadius:1,
                background: active ? `${DS.glow}14` : "transparent",
                color: active ? DS.glow : DS.textDim,
                fontFamily:DS.mono, fontSize:10, fontWeight:active?700:400, letterSpacing:"0.08em",
                textAlign:"left", transition:"all .15s",
                borderLeft: active ? `2px solid ${DS.glow}` : `2px solid transparent`,
              }}>
                <n.icon size={13} />
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* DB status */}
        <div style={{ padding:"10px 14px", borderTop:`1px solid ${DS.border}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Database size={10} color={DS.glowGreen} />
              <span style={{ fontFamily:DS.mono, fontSize:8, color:DS.glowGreen, letterSpacing:"0.1em" }}>DB CONECTADA</span>
            </div>
            <button onClick={refetch} title="Sincronizar BD" style={{ background:"none", border:"none", cursor:"pointer", color:DS.textDim, display:"flex" }}>
              <RefreshCw size={10} />
            </button>
          </div>
          <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim }}>
            {db?.employees?.length||0} EMP · {db?.timeRecords?.length||0} REG · {db?.payrollCuts?.length||0} CORTES
          </div>
        </div>

        {/* User */}
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${DS.border}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, border:`1px solid ${DS.glowPurple}55`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Lock size={12} color={DS.glowPurple} />
          </div>
          <div>
            <div style={{ fontFamily:DS.mono, fontSize:10, fontWeight:700, color:DS.text }}>ADMIN</div>
            <div style={{ fontFamily:DS.mono, fontSize:8, color:DS.textDim }}>SUPERUSUARIO</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px", position:"relative", zIndex:1 }}>
        {view==="dashboard" && <ViewDashboard db={db} />}
        {view==="employees" && <ViewEmployees db={db} upsertEmployee={upsertEmployee} deleteEmployee={deleteEmployee} />}
        {view==="time" && <ViewTime db={db} addTimeRecord={addTimeRecord} />}
        {view==="locations" && <ViewLocations db={db} upsertLocation={upsertLocation} deleteLocation={deleteLocation} />}
        {view==="payroll" && <ViewPayroll db={db} savePayrollCut={savePayrollCut} />}
        {view==="reports" && <ViewBI db={db} />}
      </main>
    </div>
  );
}
