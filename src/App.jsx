import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, ScanText, Users, Plus, Trash2, Download, Save,
  RotateCcw, Goal, Zap, Brain, Shield, Target, SquarePen,
  AlertTriangle, CheckCircle2, X, Swords,
  Camera, ClipboardList, Crosshair, Database,
  Footprints, SendHorizonal, Activity, AlertOctagon,
  Ambulance, BatteryLow, HandMetal, ShieldAlert,
  ChevronRight, ArrowLeftRight, ClipboardCheck,
} from "lucide-react";

// ─── Formations ───────────────────────────────────────────────────────────────
// Each slot: { pos, x, y }  — x/y are % of pitch width/height (0-100)
// y: 88=GK end, 12=attacking end

const FORMATIONS = {
  "4-3-3": [
    {pos:"GK", x:50, y:88},
    {pos:"RB", x:82, y:72},{pos:"CB", x:62, y:76},{pos:"CB", x:38, y:76},{pos:"LB", x:18, y:72},
    {pos:"CM", x:70, y:54},{pos:"CM", x:50, y:50},{pos:"CM", x:30, y:54},
    {pos:"RW", x:80, y:26},{pos:"ST", x:50, y:18},{pos:"LW", x:20, y:26},
  ],
  "4-4-2": [
    {pos:"GK", x:50, y:88},
    {pos:"RB", x:82, y:72},{pos:"CB", x:62, y:76},{pos:"CB", x:38, y:76},{pos:"LB", x:18, y:72},
    {pos:"RM", x:82, y:50},{pos:"CM", x:62, y:50},{pos:"CM", x:38, y:50},{pos:"LM", x:18, y:50},
    {pos:"ST", x:62, y:22},{pos:"ST", x:38, y:22},
  ],
  "4-2-3-1": [
    {pos:"GK", x:50, y:88},
    {pos:"RB", x:82, y:72},{pos:"CB", x:62, y:76},{pos:"CB", x:38, y:76},{pos:"LB", x:18, y:72},
    {pos:"CDM", x:62, y:57},{pos:"CDM", x:38, y:57},
    {pos:"RAM", x:78, y:38},{pos:"CAM", x:50, y:36},{pos:"LAM", x:22, y:38},
    {pos:"ST", x:50, y:18},
  ],
  "3-5-2": [
    {pos:"GK", x:50, y:88},
    {pos:"CB", x:70, y:75},{pos:"CB", x:50, y:78},{pos:"CB", x:30, y:75},
    {pos:"RWB", x:86, y:55},{pos:"CM", x:65, y:50},{pos:"CM", x:50, y:46},{pos:"CM", x:35, y:50},{pos:"LWB", x:14, y:55},
    {pos:"ST", x:62, y:22},{pos:"ST", x:38, y:22},
  ],
  "3-4-3": [
    {pos:"GK", x:50, y:88},
    {pos:"CB", x:70, y:75},{pos:"CB", x:50, y:78},{pos:"CB", x:30, y:75},
    {pos:"RM", x:82, y:52},{pos:"CM", x:62, y:50},{pos:"CM", x:38, y:50},{pos:"LM", x:18, y:52},
    {pos:"RW", x:80, y:24},{pos:"ST", x:50, y:18},{pos:"LW", x:20, y:24},
  ],
  "4-1-4-1": [
    {pos:"GK", x:50, y:88},
    {pos:"RB", x:82, y:72},{pos:"CB", x:62, y:76},{pos:"CB", x:38, y:76},{pos:"LB", x:18, y:72},
    {pos:"CDM", x:50, y:60},
    {pos:"RM", x:82, y:46},{pos:"CM", x:62, y:42},{pos:"CM", x:38, y:42},{pos:"LM", x:18, y:46},
    {pos:"ST", x:50, y:18},
  ],
  "5-3-2": [
    {pos:"GK", x:50, y:88},
    {pos:"RWB", x:86, y:68},{pos:"CB", x:68, y:76},{pos:"CB", x:50, y:78},{pos:"CB", x:32, y:76},{pos:"LWB", x:14, y:68},
    {pos:"CM", x:65, y:50},{pos:"CM", x:50, y:46},{pos:"CM", x:35, y:50},
    {pos:"ST", x:62, y:22},{pos:"ST", x:38, y:22},
  ],
  "4-5-1": [
    {pos:"GK", x:50, y:88},
    {pos:"RB", x:82, y:72},{pos:"CB", x:62, y:76},{pos:"CB", x:38, y:76},{pos:"LB", x:18, y:72},
    {pos:"RM", x:84, y:48},{pos:"CM", x:67, y:44},{pos:"CM", x:50, y:42},{pos:"CM", x:33, y:44},{pos:"LM", x:16, y:48},
    {pos:"ST", x:50, y:18},
  ],
};

const FORMATION_NAMES = Object.keys(FORMATIONS);

// ─── Actions ──────────────────────────────────────────────────────────────────

const ACTIONS = [
  { key: "goal",      label: "Goal",       icon: "⚽", weight:  5 },
  { key: "assist",    label: "Assist",     icon: "🎯", weight:  4 },
  { key: "pace",      label: "Pace",       icon: "⚡", weight:  2 },
  { key: "iq",        label: "Game IQ",    icon: "🧠", weight:  2 },
  { key: "physical",  label: "Physical",   icon: "💪", weight:  2 },
  { key: "duel",      label: "Duel Won",   icon: "🛡️", weight:  2 },
  { key: "weak",      label: "Weak",       icon: "❌", weight: -2 },
  { key: "shooting",  label: "Shooting",   icon: "🎯", weight:  2 },
  { key: "passing",   label: "Passing",    icon: "➡️", weight:  2 },
  { key: "pressing",  label: "Pressing",   icon: "🔥", weight:  2 },
  { key: "gk_save",   label: "GK Save",    icon: "🧤", weight:  2 },
  { key: "foul",      label: "Foul",       icon: "🟨", weight: -2 },
  { key: "lazy",      label: "Lazy",       icon: "😴", weight: -2 },
  { key: "gk_error",  label: "GK Error",   icon: "🙈", weight: -2 },
  { key: "injury",    label: "Injury/Sub", icon: "🩺", weight:  0 },
  { key: "sub_on",    label: "Subbed On",  icon: "🟢", weight:  0 },
  { key: "sub_off",   label: "Subbed Off", icon: "🔴", weight:  0 },
];

const ACTION_BUTTONS = [
  { key: "goal",     icon: Goal,          label: "Goal"     },
  { key: "assist",   icon: Target,        label: "Assist"   },
  { key: "shooting", icon: Footprints,    label: "Shooting" },
  { key: "passing",  icon: SendHorizonal, label: "Passing"  },
  { key: "pressing", icon: Activity,      label: "Pressing" },
  { key: "pace",     icon: Zap,           label: "Pace"     },
  { key: "iq",       icon: Brain,         label: "IQ"       },
  { key: "physical", icon: Shield,        label: "Physical" },
  { key: "duel",     icon: Swords,        label: "Duel Won" },
  { key: "gk_save",  icon: HandMetal,     label: "GK Save"  },
  { key: "weak",     icon: SquarePen,     label: "Weak"     },
  { key: "foul",     icon: AlertOctagon,  label: "Foul"     },
  { key: "lazy",     icon: BatteryLow,    label: "Lazy"     },
  { key: "gk_error", icon: ShieldAlert,   label: "GK Error" },
  { key: "injury",   icon: Ambulance,     label: "Injury/Sub"},
];

const PERIOD_LABELS = ["1st","2nd","3rd","4th"];
const DEMO_OCR_TEXT = `No# |, PlayerA |, Position`;
const STORAGE_KEY   = "ray-scout-pitch-app-vite-v1";
const MOBILE_TABS   = [
  { key: "extract",  label: "Extract",  Icon: Camera        },
  { key: "players",  label: "Players",  Icon: ClipboardList  },
  { key: "pitch",    label: "Pitch",    Icon: Crosshair      },
  { key: "database", label: "Database", Icon: Database       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
function cleanLine(l) {
  return String(l||"").replace(/[✓✔]/g,"").replace(/CONFIRMED/gi,"").replace(/U\d+/gi,"")
    .replace(/AW\d+/gi,"").replace(/\b\d{1,2}\.\d{1,2}\b/g,"").replace(/[|,:;]+/g," ").replace(/\s+/g," ").trim();
}
function isLikelyPosition(l) {
  return /^(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB|RAM|LAM|RM|LM|CAM)(\/(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB|RAM|LAM|RM|LM))*$/i.test(String(l||"").trim());
}
function isLikelyName(l) {
  const c=cleanLine(l);
  if (!c||isLikelyPosition(c)) return false;
  if (/^(CONFIRMED|SELECTED|SQUAD)$/i.test(c)||/^[A-Z]{1,3}\d*$/i.test(c)) return false;
  const parts=c.split(" ").filter(Boolean);
  return parts.length>=2&&parts.every(p=>/[A-Za-z''-]/.test(p));
}
function normalisePosition(l) { const c=cleanLine(l).toUpperCase(); return isLikelyPosition(c)?c:""; }
function dedupePlayers(players) {
  const seen=new Set();
  return players.filter(p=>{ const k=String(p.name||"").trim().toLowerCase(); if(!k||seen.has(k))return false; seen.add(k);return true; });
}
function parseOCRText(text) {
  const lines=String(text||"").split(/\n+/).map(cleanLine).filter(Boolean)
    .filter(l=>!/^(ant|wayne|barry|pete|jim birch|george dolby|dean bar|dean stanhop|lloyd gro)$/i.test(l));
  const players=[];
  for (let i=0;i<lines.length;i++) {
    const line=lines[i],next=lines[i+1]||"",next2=lines[i+2]||"";
    if (isLikelyName(line)&&isLikelyPosition(next)){players.push({id:makeId(),no:String(players.length+1),name:line,pos:normalisePosition(next)});i++;continue;}
    if (isLikelyName(line)&&/^(CONFIRMED|SELECTED)$/i.test(next)&&isLikelyPosition(next2)){players.push({id:makeId(),no:String(players.length+1),name:line,pos:normalisePosition(next2)});i+=2;continue;}
    if (isLikelyName(line)) players.push({id:makeId(),no:String(players.length+1),name:line,pos:""});
  }
  return dedupePlayers(players).slice(0,25);
}
function formatClock(s) {
  const safe=Number.isFinite(s)?Math.max(0,s):0;
  return `${Math.floor(safe/60)}:${String(safe%60).padStart(2,"0")}`;
}
function scorePlayer(events,id) {
  return events.filter(e=>e.playerId===id).reduce((sum,e)=>sum+(ACTIONS.find(a=>a.key===e.action)?.weight||0),0);
}
function getActionCounts(events,id) {
  return ACTIONS.reduce((acc,a)=>{acc[a.key]=events.filter(e=>e.playerId===id&&e.action===a.key).length;return acc;},{});
}
function sortPlayersByNumber(list) {
  return [...list].sort((a,b)=>{
    const an=parseInt(a.no,10),bn=parseInt(b.no,10),av=!isNaN(an),bv=!isNaN(bn);
    if (av&&bv)return an-bn;if(av)return -1;if(bv)return 1;
    return String(a.name).localeCompare(String(b.name));
  });
}
function runParserTests() {
  const tests=[
    {name:"parses simple name-position pairs",pass:(()=>{const p=parseOCRText("Tom Leahy\nCF\nJack Smith\nCB");return p.length===2&&p[0].name==="Tom Leahy"&&p[0].pos==="CF";})()},
    {name:"dedupes repeated players",pass:(()=>parseOCRText("Tom Leahy\nCF\nTom Leahy\nCF").length===1)()},
    {name:"ignores status noise",pass:(()=>{const p=parseOCRText("Tom Leahy\nCONFIRMED\nCF");return p.length===1&&p[0].pos==="CF";})()},
    {name:"keeps compound positions",pass:(()=>{const p=parseOCRText("Thomas Frost Ferris\nCDM/LB");return p.length===1&&p[0].pos==="CDM/LB";})()},
  ];
  return {tests,passed:tests.filter(t=>t.pass).length,total:tests.length};
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Button({children,variant="primary",size="md",...props}) {
  const s={primary:{background:"#0f172a",color:"#fff",border:"1px solid #0f172a"},outline:{background:"#fff",color:"#0f172a",border:"1px solid #cbd5e1"},danger:{background:"#dc2626",color:"#fff",border:"1px solid #dc2626"},success:{background:"#16a34a",color:"#fff",border:"1px solid #16a34a"}};
  const p=size==="sm"?"6px 10px":"10px 14px";
  return <button {...props} style={{...s[variant],borderRadius:14,padding:p,fontWeight:600,fontSize:size==="sm"?12:14,cursor:props.disabled?"not-allowed":"pointer",opacity:props.disabled?0.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,...props.style}}>{children}</button>;
}
function ActionBtn({actionKey,icon:Icon,label,disabled,onClick}) {
  const weight=ACTIONS.find(a=>a.key===actionKey)?.weight??0;
  const pos=weight>0,neg=weight<0;
  const bg=pos?"#f0fdf4":neg?"#fef2f2":"#f8fafc";
  const border=pos?"#bbf7d0":neg?"#fecaca":"#e2e8f0";
  const color=pos?"#166534":neg?"#991b1b":"#475569";
  return (
    <button disabled={disabled} onClick={onClick} title={`${label} (${weight>0?"+":""}${weight})`}
      style={{background:disabled?"#f8fafc":bg,border:`1px solid ${disabled?"#e2e8f0":border}`,borderRadius:10,padding:"5px 4px",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.45:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,color:disabled?"#94a3b8":color,minHeight:48,transition:"background 0.1s"}}>
      <Icon size={13} strokeWidth={2}/>
      <span style={{fontSize:9,fontWeight:600,lineHeight:1.1,textAlign:"center",whiteSpace:"nowrap"}}>{label}</span>
      <span style={{fontSize:8,opacity:0.75,lineHeight:1}}>{weight>0?`+${weight}`:weight}</span>
    </button>
  );
}
function Input(props){return <input {...props} style={{width:"100%",padding:"10px 14px",borderRadius:14,border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",boxSizing:"border-box",fontSize:14,...props.style}}/>;}
function Textarea(props){return <textarea {...props} style={{width:"100%",padding:"12px 14px",borderRadius:14,border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",boxSizing:"border-box",resize:"vertical"}}/>;}
function Badge({children,variant="default",color}){
  const s=variant==="danger"?{background:"#fee2e2",color:"#991b1b",border:"1px solid #fecaca"}:variant==="success"?{background:"#dcfce7",color:"#166534",border:"1px solid #bbf7d0"}:{background:"#e2e8f0",color:"#0f172a",border:"1px solid #cbd5e1"};
  return <span style={{...s,display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:999,fontSize:12,fontWeight:600}}>{children}</span>;
}
function Card({children,style={}}){return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:22,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",...style}}>{children}</div>;}
function CardHeader({children}){return <div style={{padding:20,paddingBottom:8}}>{children}</div>;}
function CardContent({children}){return <div style={{padding:20,paddingTop:8}}>{children}</div>;}
function Modal({open,onClose,title,children,maxWidth=520}) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,zIndex:2000}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth,background:"#fff",borderRadius:22,border:"1px solid #e2e8f0",boxShadow:"0 20px 40px rgba(0,0,0,0.18)",maxHeight:"90vh",overflow:"auto"}}>
        <div style={{padding:20,borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <div style={{fontSize:20,fontWeight:700}}>{title}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer"}}><X size={20}/></button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Mobile Tab Bar ───────────────────────────────────────────────────────────

function MobileTabBar({activeTab,setActiveTab}) {
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #e2e8f0",display:"flex",zIndex:1000,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {MOBILE_TABS.map(({key,label,Icon})=>{
        const active=activeTab===key;
        return (
          <button key={key} onClick={()=>setActiveTab(key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"transparent",border:"none",cursor:"pointer",color:active?"#0f172a":"#94a3b8",position:"relative",minHeight:60,paddingBottom:4}}>
            {active&&<div style={{position:"absolute",top:0,left:"25%",right:"25%",height:3,background:"#0f172a",borderRadius:"0 0 4px 4px"}}/>}
            <Icon size={22} strokeWidth={active?2.5:1.8}/>
            <span style={{fontSize:10,fontWeight:active?700:500}}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
function SubTabs({tabs,active,setActive}) {
  return (
    <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
      {tabs.map(([k,l])=>(
        <button key={k} onClick={()=>setActive(k)} style={{flex:"1 1 auto",padding:"8px 6px",borderRadius:12,border:"none",cursor:"pointer",background:active===k?"#0f172a":"#e2e8f0",color:active===k?"#fff":"#64748b",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{l}</button>
      ))}
    </div>
  );
}

// ─── Clock Panel ──────────────────────────────────────────────────────────────

function ClockPanel({isMobile,numPeriods,setNumPeriods,periodMins,setPeriodMins,currentPeriod,setCurrentPeriod,clock,setClock,timerOn,setTimerOn,periodLengthSecs,matchStarted,setMatchStarted}) {
  const remaining=clock;
  const isLastPeriod=currentPeriod>=numPeriods;
  const periodLabel=PERIOD_LABELS[currentPeriod-1]||`P${currentPeriod}`;
  const clockColour=remaining<=60&&matchStarted?"#dc2626":"#0f172a";
  function handleStart(){
    if(!matchStarted){setClock(periodLengthSecs);setMatchStarted(true);}
    setTimerOn(s=>!s);
  }
  function handleNextPeriod(){
    if(isLastPeriod)return;
    setCurrentPeriod(p=>p+1);setClock(periodLengthSecs);setTimerOn(false);
  }
  function handleReset(){setTimerOn(false);setMatchStarted(false);setCurrentPeriod(1);setClock(periodLengthSecs);}
  const pips=Array.from({length:numPeriods},(_,i)=>{
    const done=i+1<currentPeriod,active=i+1===currentPeriod;
    return <div key={i} style={{width:10,height:10,borderRadius:"50%",background:done?"#0f172a":active?(remaining<=60&&matchStarted?"#dc2626":"#3b82f6"):"#cbd5e1",border:active?"2px solid #0f172a":"2px solid transparent",transition:"background 0.3s"}}/>;
  });
  return (
    <div style={{gridColumn:"1/-1",border:"1px solid #e2e8f0",borderRadius:16,background:"#f8fafc",padding:14,display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"1 1 120px"}}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Periods</div>
          <div style={{display:"flex",gap:4}}>
            {[1,2,3,4].map(n=>(
              <button key={n} disabled={matchStarted} onClick={()=>setNumPeriods(n)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"1px solid",borderColor:numPeriods===n?"#0f172a":"#cbd5e1",background:numPeriods===n?"#0f172a":"#fff",color:numPeriods===n?"#fff":"#64748b",fontWeight:700,fontSize:13,cursor:matchStarted?"not-allowed":"pointer",opacity:matchStarted?0.6:1}}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{flex:"2 1 200px"}}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Mins per period</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[10,15,20,25,30,45].map(m=>(
              <button key={m} disabled={matchStarted} onClick={()=>setPeriodMins(m)} style={{flex:"1 0 auto",padding:"6px 4px",borderRadius:8,border:"1px solid",borderColor:periodMins===m?"#0f172a":"#cbd5e1",background:periodMins===m?"#0f172a":"#fff",color:periodMins===m?"#fff":"#64748b",fontWeight:700,fontSize:11,cursor:matchStarted?"not-allowed":"pointer",opacity:matchStarted?0.6:1}}>{m}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
            <span>{periodLabel} Period</span>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>{pips}</div>
          </div>
          <div style={{fontSize:38,fontWeight:800,color:clockColour,letterSpacing:-1,lineHeight:1,fontVariantNumeric:"tabular-nums",transition:"color 0.3s"}}>
            {formatClock(matchStarted?remaining:periodLengthSecs)}
          </div>
          {matchStarted&&remaining===0&&<div style={{fontSize:12,color:"#dc2626",fontWeight:700,marginTop:2}}>{isLastPeriod?"⏱ Full time!":`⏱ End of ${periodLabel} period`}</div>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Button variant="outline" onClick={handleStart} disabled={matchStarted&&remaining===0&&isLastPeriod}>{!matchStarted?"Start":timerOn?"Pause":"Resume"}</Button>
          {matchStarted&&!isLastPeriod&&remaining===0&&<Button onClick={handleNextPeriod}><span style={{display:"inline-flex",alignItems:"center",gap:4}}>Next<ChevronRight size={14}/></span></Button>}
          {matchStarted&&!isLastPeriod&&remaining>0&&<Button variant="outline" onClick={handleNextPeriod}><span style={{display:"inline-flex",alignItems:"center",gap:4}}>Skip<ChevronRight size={14}/></span></Button>}
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Pre-Match Setup Screen ───────────────────────────────────────────────────
// Shows before the match starts; lets user pick formation + assign players to slots

function PreMatchSetup({players, onConfirm}) {
  const [formation, setFormation] = useState("4-3-3");
  const slots = FORMATIONS[formation]; // array of {pos,x,y}

  // lineup[slotIndex] = playerId | null
  const [lineup, setLineup] = useState(() => Array(slots.length).fill(null));

  // Keep lineup length in sync when formation changes
  useEffect(() => {
    setLineup(Array(FORMATIONS[formation].length).fill(null));
  }, [formation]);

  const assignedIds   = lineup.filter(Boolean);
  const benchPlayers  = players.filter(p => !assignedIds.includes(p.id));

  function assignPlayer(slotIdx, playerId) {
    setLineup(prev => {
      const next = [...prev];
      // If this player is already in another slot, clear that slot first
      const existingSlot = next.findIndex(id => id === playerId);
      if (existingSlot !== -1) next[existingSlot] = null;
      next[slotIdx] = playerId || null;
      return next;
    });
  }

  function autoFill() {
    const sorted = sortPlayersByNumber(players);
    setLineup(Array(slots.length).fill(null).map((_, i) => sorted[i]?.id || null));
  }

  function clearAll() {
    setLineup(Array(slots.length).fill(null));
  }

  function handleConfirm() {
    // Build lineupData: [{playerId, slotIndex, pos, x, y}]
    const lineupData = lineup.map((playerId, idx) => ({
      playerId: playerId || null,
      slotIndex: idx,
      pos: slots[idx].pos,
      x: slots[idx].x,
      y: slots[idx].y,
    }));
    onConfirm({ formation, lineupData });
  }

  const filledCount = lineup.filter(Boolean).length;

  return (
    <div style={{display:"grid",gap:16}}>
      <Card>
        <CardHeader>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:24,fontWeight:800}}>Pre-Match Setup</div>
              <div style={{fontSize:14,color:"#64748b",marginTop:2}}>Choose your formation and assign players to positions</div>
            </div>
            <Button onClick={handleConfirm} style={{minWidth:140}}>
              <ClipboardCheck size={16}/> Start Match
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formation picker */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Formation</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {FORMATION_NAMES.map(f=>(
                <button key={f} onClick={()=>setFormation(f)} style={{padding:"8px 14px",borderRadius:12,border:"1px solid",borderColor:formation===f?"#0f172a":"#cbd5e1",background:formation===f?"#0f172a":"#fff",color:formation===f?"#fff":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gap:16,gridTemplateColumns:"minmax(0,1fr) 280px"}}>
            {/* Pitch preview with slot assignment */}
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>
                Assign Players — {filledCount}/{slots.length} filled
              </div>
              <div style={{position:"relative",width:"100%",maxWidth:380,aspectRatio:"0.72/1",background:"#047857",borderRadius:22,border:"3px solid #fff",boxShadow:"0 4px 24px rgba(0,0,0,0.15)",overflow:"hidden",margin:"0 auto"}}>
                {/* Pitch markings */}
                <div style={{position:"absolute",inset:10,borderRadius:16,border:"2px solid rgba(255,255,255,0.6)"}}/>
                <div style={{position:"absolute",left:0,right:0,top:"50%",borderTop:"2px solid rgba(255,255,255,0.6)"}}/>
                <div style={{position:"absolute",left:"50%",top:"50%",width:80,height:80,transform:"translate(-50%,-50%)",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.6)"}}/>
                <div style={{position:"absolute",left:"50%",top:10,width:140,height:54,transform:"translateX(-50%)",border:"2px solid rgba(255,255,255,0.6)",borderTop:"none",borderRadius:"0 0 12px 12px"}}/>
                <div style={{position:"absolute",left:"50%",bottom:10,width:140,height:54,transform:"translateX(-50%)",border:"2px solid rgba(255,255,255,0.6)",borderBottom:"none",borderRadius:"12px 12px 0 0"}}/>

                {slots.map((slot, idx) => {
                  const pid = lineup[idx];
                  const player = pid ? players.find(p => p.id === pid) : null;
                  const filled = !!player;
                  return (
                    <div key={idx} style={{position:"absolute",left:`${slot.x}%`,top:`${slot.y}%`,transform:"translate(-50%,-50%)",zIndex:2}}>
                      <select
                        value={pid||""}
                        onChange={e=>assignPlayer(idx, e.target.value||null)}
                        style={{opacity:0,position:"absolute",inset:0,width:"100%",height:"100%",cursor:"pointer",zIndex:3}}
                      >
                        <option value="">— empty —</option>
                        {/* Show currently assigned player + bench players */}
                        {player && <option key={player.id} value={player.id}>{player.no}. {player.name}</option>}
                        {benchPlayers.map(p=>(
                          <option key={p.id} value={p.id}>{p.no}. {p.name} ({p.pos||"?"})</option>
                        ))}
                      </select>
                      <div style={{
                        width:46,height:46,borderRadius:"50%",
                        background:filled?"#fff":"rgba(255,255,255,0.2)",
                        border:filled?"2px solid #0f172a":"2px dashed rgba(255,255,255,0.7)",
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                        cursor:"pointer",pointerEvents:"none",
                      }}>
                        {filled ? (
                          <>
                            <span style={{fontSize:11,fontWeight:800,lineHeight:1,color:"#0f172a"}}>{player.no}</span>
                            <span style={{fontSize:7,lineHeight:1.2,color:"#64748b",maxWidth:40,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.name.split(" ")[0]}</span>
                          </>
                        ) : (
                          <span style={{fontSize:9,color:"rgba(255,255,255,0.9)",fontWeight:700,textAlign:"center",lineHeight:1.2,padding:"0 4px"}}>{slot.pos}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"center"}}>
                <Button variant="outline" size="sm" onClick={autoFill}>Auto-fill</Button>
                <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
              </div>
            </div>

            {/* Player list / bench */}
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>
                Bench ({benchPlayers.length})
              </div>
              <div style={{display:"grid",gap:6,maxHeight:460,overflow:"auto"}}>
                {benchPlayers.length===0 && (
                  <div style={{fontSize:13,color:"#94a3b8",padding:12,textAlign:"center",border:"1px dashed #e2e8f0",borderRadius:12}}>All players assigned</div>
                )}
                {benchPlayers.map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:12,background:"#f8fafc"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0}}>{p.no}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{p.pos||"—"}</div>
                    </div>
                    <Badge>{p.pos||"?"}</Badge>
                  </div>
                ))}
              </div>

              {/* Slot assignment list */}
              <div style={{marginTop:16}}>
                <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Starting XI</div>
                <div style={{display:"grid",gap:4,maxHeight:300,overflow:"auto"}}>
                  {slots.map((slot,idx)=>{
                    const pid=lineup[idx];
                    const player=pid?players.find(p=>p.id===pid):null;
                    return (
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",border:"1px solid",borderColor:player?"#bbf7d0":"#e2e8f0",borderRadius:10,background:player?"#f0fdf4":"#fafafa"}}>
                        <span style={{fontSize:11,fontWeight:700,color:"#64748b",width:36,flexShrink:0}}>{slot.pos}</span>
                        {player ? (
                          <>
                            <span style={{flex:1,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.no}. {player.name}</span>
                            <button onClick={()=>assignPlayer(idx,null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:2}}><X size={12}/></button>
                          </>
                        ) : (
                          <span style={{flex:1,fontSize:12,color:"#94a3b8"}}>— unassigned —</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub Modal ────────────────────────────────────────────────────────────────

function SubModal({open, onClose, playerOnPitch, benchPlayers, players, onSub}) {
  if (!open || !playerOnPitch) return null;
  const player = players.find(p=>p.id===playerOnPitch);
  return (
    <Modal open={open} onClose={onClose} title="Make Substitution" maxWidth={420}>
      <div style={{marginBottom:16,padding:12,border:"1px solid #fecaca",background:"#fef2f2",borderRadius:14}}>
        <div style={{fontSize:12,color:"#991b1b",fontWeight:600,marginBottom:4}}>🔴 Subbing off</div>
        <div style={{fontWeight:700,fontSize:16}}>{player?.no}. {player?.name}</div>
        <div style={{fontSize:13,color:"#64748b"}}>{player?.pos}</div>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8}}>🟢 Select replacement from bench</div>
      {benchPlayers.length===0 && (
        <div style={{fontSize:14,color:"#94a3b8",textAlign:"center",padding:16}}>No bench players available</div>
      )}
      <div style={{display:"grid",gap:8,maxHeight:360,overflow:"auto"}}>
        {benchPlayers.map(p=>(
          <button key={p.id} onClick={()=>onSub(playerOnPitch, p.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:14,background:"#f8fafc",cursor:"pointer",textAlign:"left",width:"100%"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{p.no}</div>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{p.pos||"—"}</div>
            </div>
            <ArrowLeftRight size={16} style={{marginLeft:"auto",color:"#64748b"}}/>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ─── Extract Tab ──────────────────────────────────────────────────────────────

function ExtractTab({isMobile,imageUrl,imageDataUrl,ocrText,setOcrText,ocrError,setOcrError,manualText,setManualText,isExtracting,fileRef,handleImageUpload,runOCR,applyManualParse,loadDemoText}) {
  const [sub,setSub]=useState("photo");
  return (
    <div style={{display:"grid",gap:16}}>
      {isMobile&&<SubTabs tabs={[["photo","📷 Photo"],["ocr","📋 OCR"],["fix","✏️ Fix"]]} active={sub} setActive={setSub}/>}
      {(!isMobile||sub==="photo")&&(
        <Card>
          <CardHeader><div style={{fontSize:22,fontWeight:700}}>Upload Team Sheet</div></CardHeader>
          <CardContent>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageUpload}/>
            <div style={{display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",marginBottom:16}}>
              <Button onClick={()=>fileRef.current?.click()}><Upload size={16}/> Upload</Button>
              <Button variant="outline" onClick={runOCR} disabled={!imageDataUrl||isExtracting}><ScanText size={16}/>{isExtracting?"Extracting…":"Extract"}</Button>
              <Button variant="outline" onClick={loadDemoText}><Users size={16}/> Demo</Button>
            </div>
            {ocrError&&<div style={{border:"1px solid #fde68a",background:"#fefce8",color:"#854d0e",borderRadius:16,padding:14,marginBottom:16,display:"flex",gap:8}}><AlertTriangle size={16} style={{marginTop:2,flexShrink:0}}/><span>{ocrError}</span></div>}
            <div style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:16,padding:12,minHeight:260}}>
              {imageUrl?<img src={imageUrl} alt="Team sheet" style={{width:"100%",maxHeight:480,objectFit:"contain",borderRadius:12}}/>:<div style={{minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",border:"1px dashed #cbd5e1",borderRadius:12,color:"#64748b"}}>Team sheet preview</div>}
            </div>
          </CardContent>
        </Card>
      )}
      {(!isMobile||sub==="ocr"||sub==="fix")&&(
        <Card>
          <CardHeader><div style={{fontSize:22,fontWeight:700}}>OCR Text / Manual Fix</div></CardHeader>
          <CardContent>
            <div style={{display:"grid",gap:16}}>
              {(!isMobile||sub==="ocr")&&<div><div style={{marginBottom:8,fontSize:14,fontWeight:600}}>OCR Output</div><Textarea value={ocrText} onChange={e=>setOcrText(e.target.value)} placeholder="Paste OCR output from Google Lens…" rows={6}/></div>}
              {(!isMobile||sub==="fix")&&<>
                <div><div style={{marginBottom:8,fontSize:14,fontWeight:600}}>Manual Clean-up</div><Textarea value={manualText} onChange={e=>setManualText(e.target.value)} placeholder="Player name on one line, position on next." rows={10}/></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Button onClick={()=>applyManualParse(manualText)}><Users size={16}/> Parse Text</Button>
                  <Button variant="outline" onClick={()=>{setManualText(ocrText);setOcrError("");}}>Use OCR Text</Button>
                  <Button variant="outline" onClick={()=>applyManualParse(ocrText||manualText)}>Parse Best</Button>
                </div>
                <div style={{border:"1px solid #bbf7d0",background:"#f0fdf4",color:"#166534",borderRadius:16,padding:14,fontSize:13}}>💡 Best mobile flow: photo → Google Lens → copy → paste here → parse → fix names.</div>
              </>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────

function PlayersTab({players,addBlankPlayer,updatePlayer,removePlayer,setEditingPlayer}) {
  return (
    <Card>
      <CardHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{fontSize:22,fontWeight:700}}>Player List</div>
          <Button onClick={addBlankPlayer}><Plus size={16}/> Add Player</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{display:"grid",gap:10}}>
          {players.map(p=>(
            <div key={p.id} style={{display:"grid",gap:8,gridTemplateColumns:"48px 3fr 52px 45px 35px",alignItems:"center",border:"1px solid #e2e8f0",background:"#fafafa",borderRadius:16,padding:10}}>
              <Input value={p.no}   onChange={e=>updatePlayer(p.id,{no:e.target.value})}                    placeholder="#"  />
              <Input value={p.name} onChange={e=>updatePlayer(p.id,{name:e.target.value})}                  placeholder="Name"/>
              <Input value={p.pos}  onChange={e=>updatePlayer(p.id,{pos:e.target.value.toUpperCase()})}      placeholder="Pos"/>
              <Button variant="outline" onClick={()=>setEditingPlayer(p)}>✏️</Button>
              <Button variant="danger"  onClick={()=>removePlayer(p.id)}><Trash2 size={15}/></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pitch Tab ────────────────────────────────────────────────────────────────

function PitchTab({
  isMobile, players, events, leaderboard,
  selectedPlayerId, setSelectedPlayerId,
  logAction, undoLastEvent, resetMatch,
  // lineup state
  formation, lineupData, benchIds,
  onMakeSub,
  currentPeriod, periodLengthSecs, clock,
}) {
  const [sub, setSub] = useState("pitch");
  const [subTarget, setSubTarget] = useState(null); // playerId of player to sub off
  const disabled = !selectedPlayerId;

  // Build placed players from lineupData (has pos/x/y per slot)
  const pitchPlayers = useMemo(() => {
    if (!lineupData) return [];
    return lineupData
      .filter(slot => slot.playerId)
      .map(slot => {
        const p = players.find(pl => pl.id === slot.playerId);
        if (!p) return null;
        return { ...p, x: slot.x, y: slot.y, slotPos: slot.pos };
      })
      .filter(Boolean);
  }, [lineupData, players]);

  const benchPlayers = useMemo(() =>
    players.filter(p => benchIds.includes(p.id)),
  [players, benchIds]);

  function handlePlayerTap(playerId) {
    setSelectedPlayerId(playerId);
  }

  function handleSubOff(playerId) {
    setSubTarget(playerId);
  }

  return (
    <>
      <div style={{display:"grid",gap:16,gridTemplateColumns:isMobile?"1fr":"minmax(0,1.15fr) minmax(320px,0.85fr)"}}>
        <Card>
          <CardHeader>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:22,fontWeight:700}}>Pitch</div>
                {formation && <Badge>{formation}</Badge>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <Button variant="outline" size="sm" onClick={undoLastEvent}><RotateCcw size={14}/> Undo</Button>
                <Button variant="outline" size="sm" onClick={resetMatch}>Clear</Button>
              </div>
            </div>
            {isMobile&&<div style={{marginTop:10}}><SubTabs tabs={[["pitch","⚽ Pitch"],["bench","🔄 Bench"],["board","🏆 Board"],["log","📋 Log"]]} active={sub} setActive={setSub}/></div>}
          </CardHeader>

          <CardContent>
            {(!isMobile||sub==="pitch")&&(
              <>
                {/* ── Pitch ── */}
                <div style={{position:"relative",margin:"0 auto",width:"100%",maxWidth:isMobile?340:420,aspectRatio:"0.72/1",overflow:"hidden",borderRadius:28,border:"4px solid #fff",background:"#047857",boxShadow:"inset 0 0 20px rgba(0,0,0,0.12)"}}>
                  <div style={{position:"absolute",inset:12,borderRadius:22,border:"2px solid rgba(255,255,255,0.8)"}}/>
                  <div style={{position:"absolute",left:"50%",top:"50%",width:96,height:96,transform:"translate(-50%,-50%)",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.8)"}}/>
                  <div style={{position:"absolute",left:0,right:0,top:"50%",borderTop:"2px solid rgba(255,255,255,0.8)"}}/>
                  <div style={{position:"absolute",left:"50%",top:12,width:160,height:64,transform:"translateX(-50%)",borderBottom:"2px solid rgba(255,255,255,0.8)",borderLeft:"2px solid rgba(255,255,255,0.8)",borderRight:"2px solid rgba(255,255,255,0.8)",borderBottomLeftRadius:16,borderBottomRightRadius:16}}/>
                  <div style={{position:"absolute",left:"50%",bottom:12,width:160,height:64,transform:"translateX(-50%)",borderTop:"2px solid rgba(255,255,255,0.8)",borderLeft:"2px solid rgba(255,255,255,0.8)",borderRight:"2px solid rgba(255,255,255,0.8)",borderTopLeftRadius:16,borderTopRightRadius:16}}/>

                  {pitchPlayers.map(p=>{
                    const score=scorePlayer(events,p.id);
                    const sel=selectedPlayerId===p.id;
                    const subCount=events.filter(e=>e.playerId===p.id&&e.action==="sub_on").length;
                    return (
                      <motion.div key={p.id} whileTap={{scale:0.92}} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:"translate(-50%,-50%)",zIndex:sel?10:5}}>
                        {/* Main token */}
                        <div
                          onClick={()=>handlePlayerTap(p.id)}
                          style={{width:isMobile?46:54,height:isMobile?46:54,borderRadius:"50%",border:sel?"3px solid #fcd34d":"2px solid #fff",background:sel?"#fcd34d":"#fff",color:"#0f172a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:sel?"0 0 0 3px rgba(252,211,77,0.4),0 8px 18px rgba(0,0,0,0.2)":"0 4px 12px rgba(0,0,0,0.18)",cursor:"pointer",position:"relative"}}
                        >
                          {subCount>0&&<div style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#16a34a",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,color:"#fff",fontWeight:700}}>{subCount}</span></div>}
                          <span style={{fontSize:isMobile?12:13,fontWeight:800,lineHeight:1}}>{p.no}</span>
                          <span style={{maxWidth:isMobile?34:42,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:7,lineHeight:1.2,color:"#475569"}}>{p.name.split(" ")[0].slice(0,8)}</span>
                          <span style={{fontSize:7,lineHeight:1,color:"#94a3b8"}}>{p.slotPos}</span>
                          {score!==0&&<span style={{fontSize:8,lineHeight:1,color:score>0?"#166534":"#991b1b",fontWeight:700}}>{score>0?`+${score}`:score}</span>}
                        </div>
                        {/* Sub-off button — only show when selected */}
                        {sel&&(
                          <button
                            onClick={e=>{e.stopPropagation();handleSubOff(p.id);}}
                            style={{position:"absolute",bottom:-18,left:"50%",transform:"translateX(-50%)",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"2px 6px",fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",zIndex:20}}
                          >↓ Sub</button>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* If no lineup set, show hint */}
                  {pitchPlayers.length===0&&(
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.8)",fontSize:13,fontWeight:600,textAlign:"center",padding:20}}>
                      No lineup set. Use Pre-Match Setup to assign players.
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#166534",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>✅ Positive</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:10}}>
                    {ACTION_BUTTONS.filter(b=>(ACTIONS.find(a=>a.key===b.key)?.weight??0)>0).map(b=>(
                      <ActionBtn key={b.key} actionKey={b.key} icon={b.icon} label={b.label} disabled={disabled} onClick={()=>logAction(b.key)}/>
                    ))}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:"#991b1b",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>❌ Negative</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:10}}>
                    {ACTION_BUTTONS.filter(b=>(ACTIONS.find(a=>a.key===b.key)?.weight??0)<0).map(b=>(
                      <ActionBtn key={b.key} actionKey={b.key} icon={b.icon} label={b.label} disabled={disabled} onClick={()=>logAction(b.key)}/>
                    ))}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>⬜ Neutral</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
                    {ACTION_BUTTONS.filter(b=>(ACTIONS.find(a=>a.key===b.key)?.weight??0)===0).map(b=>(
                      <ActionBtn key={b.key} actionKey={b.key} icon={b.icon} label={b.label} disabled={disabled} onClick={()=>logAction(b.key)}/>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Bench sub-tab */}
            {isMobile&&sub==="bench"&&(
              <BenchPanel players={players} benchIds={benchIds} events={events}/>
            )}

            {isMobile&&sub==="board"&&(
              <div style={{display:"grid",gap:8}}>
                {leaderboard.slice(0,10).map((p,idx)=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13}}>{idx+1}</div>
                      <div><div style={{fontWeight:700,fontSize:14}}>{p.no}. {p.name}</div><div style={{fontSize:12,color:"#64748b"}}>{p.pos}</div></div>
                    </div>
                    <Badge>{p.score}</Badge>
                  </div>
                ))}
              </div>
            )}

            {isMobile&&sub==="log"&&(
              <EventLogList events={events} players={players}/>
            )}
          </CardContent>
        </Card>

        {/* Desktop right column */}
        {!isMobile&&(
          <div style={{display:"grid",gap:16,alignContent:"start"}}>
            <BenchPanel players={players} benchIds={benchIds} events={events}/>
            <Card>
              <CardHeader><div style={{fontSize:18,fontWeight:700}}>Leaderboard</div></CardHeader>
              <CardContent>
                <div style={{display:"grid",gap:8}}>
                  {leaderboard.slice(0,8).map((p,idx)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12}}>{idx+1}</div>
                        <div><div style={{fontWeight:700,fontSize:13}}>{p.no}. {p.name}</div><div style={{fontSize:11,color:"#64748b"}}>{p.pos}</div></div>
                      </div>
                      <Badge>{p.score}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><div style={{fontSize:18,fontWeight:700}}>Event Log</div></CardHeader>
              <CardContent>
                <div style={{maxHeight:300,overflow:"auto"}}>
                  <EventLogList events={events} players={players}/>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Sub modal */}
      <SubModal
        open={!!subTarget}
        onClose={()=>setSubTarget(null)}
        playerOnPitch={subTarget}
        benchPlayers={benchPlayers}
        players={players}
        onSub={(offId,onId)=>{
          onMakeSub(offId,onId);
          setSubTarget(null);
          setSelectedPlayerId(onId);
        }}
      />
    </>
  );
}

// ─── Bench Panel ──────────────────────────────────────────────────────────────

function BenchPanel({players, benchIds, events}) {
  const bench = players.filter(p=>benchIds.includes(p.id));
  const subOnIds = new Set(events.filter(e=>e.action==="sub_on").map(e=>e.playerId));

  return (
    <Card>
      <CardHeader><div style={{fontSize:18,fontWeight:700}}>Bench ({bench.length})</div></CardHeader>
      <CardContent>
        {bench.length===0&&<div style={{fontSize:13,color:"#94a3b8",textAlign:"center",padding:12}}>Bench is empty</div>}
        <div style={{display:"grid",gap:6}}>
          {bench.map(p=>{
            const wasOnPitch = subOnIds.has(p.id);
            const score = scorePlayer(events, p.id);
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"1px solid",borderColor:wasOnPitch?"#bbf7d0":"#e2e8f0",borderRadius:12,background:wasOnPitch?"#f0fdf4":"#f8fafc"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:wasOnPitch?"#16a34a":"#cbd5e1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0}}>{p.no}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{p.pos||"—"} {wasOnPitch?"· Played":""}</div>
                </div>
                {score!==0&&<Badge variant={score>0?"success":"danger"}>{score>0?`+${score}`:score}</Badge>}
                {!wasOnPitch&&<Badge>Bench</Badge>}
                {wasOnPitch&&<Badge variant="success">Played</Badge>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Event Log List ───────────────────────────────────────────────────────────

function EventLogList({events, players}) {
  if (events.length===0) return <div style={{fontSize:14,color:"#64748b",padding:8}}>No events yet.</div>;
  return (
    <div style={{display:"grid",gap:6}}>
      {events.map(e=>{
        const p=players.find(x=>x.id===e.playerId),a=ACTIONS.find(x=>x.key===e.action);
        const isSub = e.action==="sub_on"||e.action==="sub_off";
        return (
          <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,border:"1px solid",borderColor:isSub?"#bfdbfe":"#e2e8f0",background:isSub?"#eff6ff":"#fff",borderRadius:12,padding:"8px 12px"}}>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{a?.icon} {p?.no}. {p?.name}</div>
              <div style={{fontSize:11,color:"#64748b"}}>{a?.label} · P{e.period||1} · {formatClock(e.t)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Database Tab ─────────────────────────────────────────────────────────────

function DatabaseTab({isMobile,db,tests,setTests}) {
  return (
    <div style={{display:"grid",gap:16,gridTemplateColumns:isMobile?"1fr":"minmax(0,1.1fr) minmax(320px,0.9fr)"}}>
      <Card>
        <CardHeader><div style={{fontSize:22,fontWeight:700}}>Saved Matches</div></CardHeader>
        <CardContent>
          <div style={{display:"grid",gap:16}}>
            {db.length===0&&<div style={{border:"1px dashed #cbd5e1",borderRadius:16,padding:32,textAlign:"center",color:"#64748b"}}>Save a match and it will appear here.</div>}
            {db.map(m=>(
              <div key={m.id} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:18,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:700}}>{m.matchName||"Untitled"}</div>
                    <div style={{fontSize:14,color:"#64748b"}}>{m.opponent?`vs ${m.opponent}`:"No opponent"} · {new Date(m.playedAt).toLocaleString()}</div>
                    {m.formation&&<Badge style={{marginTop:4}}>{m.formation}</Badge>}
                  </div>
                  <Badge>{m.numPeriods}×{m.periodMins}min</Badge>
                </div>
                <div style={{marginTop:14,display:"grid",gap:8,gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))"}}>
                  {m.summary.slice(0,9).map(p=>(
                    <div key={p.playerId} style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:10}}>
                      <div style={{fontWeight:700,fontSize:13}}>{p.no}. {p.name}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{p.pos}</div>
                      <div style={{marginTop:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13}}>Score</span><Badge>{p.score}</Badge></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div style={{fontSize:22,fontWeight:700}}>Parser Self-Tests</div></CardHeader>
        <CardContent>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {tests.passed===tests.total?<Badge><CheckCircle2 size={14}/> {tests.passed}/{tests.total} passed</Badge>:<Badge variant="danger"><AlertTriangle size={14}/> {tests.passed}/{tests.total} passed</Badge>}
            <Button variant="outline" size="sm" onClick={()=>setTests(runParserTests())}>Run Tests</Button>
          </div>
          <div style={{display:"grid",gap:8}}>
            {tests.tests.map(t=>(
              <div key={t.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:12}}>
                <span style={{fontSize:13}}>{t.name}</span>
                {t.pass?<Badge>Pass</Badge>:<Badge variant="danger">Fail</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const fileRef = useRef(null);

  // ── Player / match data ──
  const [players,          setPlayers]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [db,               setDb]               = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [matchName,        setMatchName]        = useState("U CP-Showcase");
  const [opponent,         setOpponent]         = useState("");

  // ── Period / clock ──
  const [numPeriods,    setNumPeriods]    = useState(2);
  const [periodMins,    setPeriodMins]    = useState(20);
  const [currentPeriod, setCurrentPeriod]= useState(1);
  const [clock,         setClock]        = useState(20*60);
  const [timerOn,       setTimerOn]      = useState(false);
  const [matchStarted,  setMatchStarted] = useState(false);
  const periodLengthSecs = periodMins*60;

  // ── Lineup state ──
  // lineupData: [{playerId, slotIndex, pos, x, y}]
  // benchIds: playerIds not in lineup
  // showSetup: show pre-match screen
  const [formation,   setFormation]   = useState("4-3-3");
  const [lineupData,  setLineupData]  = useState(null);  // null = not set up yet
  const [benchIds,    setBenchIds]    = useState([]);
  const [showSetup,   setShowSetup]   = useState(false);

  // ── OCR / extract ──
  const [manualText,   setManualText]   = useState(DEMO_OCR_TEXT);
  const [imageUrl,     setImageUrl]     = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [ocrText,      setOcrText]      = useState("");
  const [ocrError,     setOcrError]     = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  // ── UI ──
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [activeTab,     setActiveTab]     = useState("extract");
  const [tests,         setTests]         = useState(runParserTests);
  const [isMobile,      setIsMobile]      = useState(()=>typeof window!=="undefined"?window.innerWidth<=768:false);

  // ── Sync clock when period length changes ──
  useEffect(()=>{ if(!matchStarted) setClock(periodLengthSecs); },[periodMins,matchStarted,periodLengthSecs]);

  // ── Countdown tick ──
  useEffect(()=>{
    if(!timerOn) return;
    if(clock<=0){setTimerOn(false);return;}
    const id=setInterval(()=>setClock(c=>{if(c<=1){setTimerOn(false);return 0;}return c-1;}),1000);
    return ()=>clearInterval(id);
  },[timerOn,clock]);

  // ── Persistence ──
  useEffect(()=>{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw){setPlayers(parseOCRText(DEMO_OCR_TEXT));return;}
    try{
      const s=JSON.parse(raw);
      setPlayers(s.players?.length?s.players:parseOCRText(DEMO_OCR_TEXT));
      setEvents(s.events||[]);setDb(s.db||[]);setMatchName(s.matchName||"U CP-Showcase");
      setOpponent(s.opponent||"");setOcrText(s.ocrText||"");setManualText(s.manualText||DEMO_OCR_TEXT);setOcrError(s.ocrError||"");
      if(s.numPeriods)setNumPeriods(s.numPeriods);
      if(s.periodMins)setPeriodMins(s.periodMins);
      if(s.formation)setFormation(s.formation);
      if(s.lineupData)setLineupData(s.lineupData);
      if(s.benchIds)setBenchIds(s.benchIds);
    }catch{setPlayers(parseOCRText(DEMO_OCR_TEXT));}
  },[]);

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({players,events,db,matchName,opponent,ocrText,manualText,ocrError,numPeriods,periodMins,formation,lineupData,benchIds}));
  },[players,events,db,matchName,opponent,ocrText,manualText,ocrError,numPeriods,periodMins,formation,lineupData,benchIds]);

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);
  },[]);

  // ── Derived ──
  const selectedPlayer = players.find(p=>p.id===selectedPlayerId)||null;
  const leaderboard    = useMemo(()=>[...players].map(p=>({...p,score:scorePlayer(events,p.id),counts:getActionCounts(events,p.id)})).sort((a,b)=>{
    if(b.score!==a.score)return b.score-a.score;
    const an=parseInt(a.no,10),bn=parseInt(b.no,10);
    if(!isNaN(an)&&!isNaN(bn))return an-bn;return String(a.name).localeCompare(String(b.name));
  }),[players,events]);

  // ── Image ──
  async function fileToDataUrl(file){
    const orig=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=orig;});
    const scale=Math.min(1,1400/img.width),c=document.createElement("canvas");
    c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",0.72);
  }
  async function handleImageUpload(e){
    const file=e.target.files?.[0];if(!file)return;
    try{setOcrError("");setImageUrl(URL.createObjectURL(file));setImageDataUrl(await fileToDataUrl(file));}
    catch(err){console.error(err);setOcrError("Could not prepare image");}
  }

  // ── OCR ──
  function parsePlayersJson(text){
    try{const c=String(text||"").replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
      const parsed=JSON.parse(c);if(!Array.isArray(parsed.players))return[];
      return parsed.players.map((p,i)=>({id:makeId(),no:String(i+1),name:String(p.name||"").trim(),pos:String(p.pos||"").trim().toUpperCase()})).filter(p=>p.name);
    }catch{return[];}
  }
  async function runOCR(){
    if(!imageDataUrl){setOcrError("Upload image first");return;}
    try{
      setIsExtracting(true);setOcrError("");
      const res=await fetch("/api/extract-team-sheet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:imageDataUrl})});
      const raw=await res.text();let data;try{data=JSON.parse(raw);}catch{throw new Error(raw||"Non-JSON response");}
      if(!res.ok)throw new Error(data.detail||data.error||"OCR failed");
      if(!data.result)throw new Error("No OCR result returned");
      setOcrText(data.result);const pp=parsePlayersJson(data.result);
      if(pp.length>0){setPlayers(sortPlayersByNumber(pp));setActiveTab("players");}
      else setOcrError("OCR returned text but player JSON could not be parsed.");
    }catch(err){console.error(err);setOcrError(err.message||"OCR failed");}
    finally{setIsExtracting(false);}
  }
  function applyManualParse(src=manualText){
    const jp=parsePlayersJson(src);if(jp.length){setPlayers(sortPlayersByNumber(jp));setActiveTab("players");setOcrError("");return;}
    const ep=parseOCRText(src);if(ep.length){setPlayers(sortPlayersByNumber(ep));setActiveTab("players");setOcrError("");return;}
    setOcrError("No players could be parsed.");
  }

  // ── Players ──
  const addBlankPlayer=()=>setPlayers(prev=>sortPlayersByNumber([...prev,{id:makeId(),no:String(prev.length+1),name:"New Player",pos:"Pos"}]));
  const updatePlayer=(id,patch)=>setPlayers(prev=>sortPlayersByNumber(prev.map(p=>p.id===id?{...p,...patch}:p)));
  const removePlayer=(id)=>{setPlayers(p=>p.filter(x=>x.id!==id));setEvents(e=>e.filter(x=>x.playerId!==id));if(selectedPlayerId===id)setSelectedPlayerId(null);};

  // ── Lineup confirm from pre-match setup ──
  function handleLineupConfirm({formation: f, lineupData: ld}) {
    setFormation(f);
    setLineupData(ld);
    // Bench = all players NOT in starting lineup
    const startIds = new Set(ld.map(s=>s.playerId).filter(Boolean));
    setBenchIds(players.filter(p=>!startIds.has(p.id)).map(p=>p.id));
    setShowSetup(false);
    setActiveTab("pitch");
  }

  // ── Substitution ──
  function handleMakeSub(offId, onId) {
    const elapsed = periodLengthSecs - clock;
    // Log sub_off for outgoing player
    setEvents(prev=>[
      {id:makeId(),t:elapsed,period:currentPeriod,playerId:offId,action:"sub_off",ts:new Date().toISOString()},
      {id:makeId(),t:elapsed,period:currentPeriod,playerId:onId, action:"sub_on", ts:new Date().toISOString()},
      ...prev,
    ]);
    // Swap in lineup: replace offId slot with onId
    setLineupData(prev => prev.map(slot =>
      slot.playerId === offId ? {...slot, playerId: onId} : slot
    ));
    // Update bench: remove onId, add offId
    setBenchIds(prev => [...prev.filter(id=>id!==onId), offId]);
  }

  // ── Events ──
  const logAction=(key)=>{
    if(!selectedPlayerId)return;
    const elapsed=periodLengthSecs-clock;
    setEvents(prev=>[{id:makeId(),t:elapsed,period:currentPeriod,playerId:selectedPlayerId,action:key,ts:new Date().toISOString()},...prev]);
  };
  const undoLastEvent=()=>setEvents(prev=>prev.slice(1));
  const resetMatch=()=>{
    setEvents([]);setTimerOn(false);setMatchStarted(false);
    setCurrentPeriod(1);setClock(periodLengthSecs);setSelectedPlayerId(null);
    // Restore lineup to original (clear subs)
    if(lineupData){
      const startIds=new Set(lineupData.map(s=>s.playerId).filter(Boolean));
      setBenchIds(players.filter(p=>!startIds.has(p.id)).map(p=>p.id));
    }
  };
  const finishMatch=()=>{
    const summary=leaderboard.map(({id:playerId,no,name,pos,score,counts})=>({playerId,no,name,pos,score,counts}));
    setDb(prev=>[{id:makeId(),matchName,opponent,numPeriods,periodMins,formation,playedAt:new Date().toISOString(),summary,events},...prev]);
  };

  // ── Exports ──
  function exportJSON(){const blob=new Blob([JSON.stringify({players,events,db,matchName,opponent,numPeriods,periodMins,formation,lineupData},null,2)],{type:"application/json"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`scout-${matchName.replace(/\s+/g,"-").toLowerCase()}.json`});a.click();URL.revokeObjectURL(a.href);}
  function exportCSV(){
    const rows=[["Period","Time","No","Player","Pos","Action"],...events.map(e=>{
      const p=players.find(x=>x.id===e.playerId),a=ACTIONS.find(x=>x.key===e.action);
      return[e.period||1,formatClock(e.t),p?.no||"",p?.name||"",p?.pos||"",a?.label||e.action];
    })];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`events-${matchName.replace(/\s+/g,"-").toLowerCase()}.csv`});a.click();URL.revokeObjectURL(a.href);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",paddingTop:16,paddingLeft:16,paddingRight:16,paddingBottom:isMobile?80:16,color:"#0f172a",fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:1320,margin:"0 auto",display:"grid",gap:16}}>

        {/* ── Header ── */}
        <div style={{display:"grid",gap:16,gridTemplateColumns:isMobile?"1fr":"minmax(0,1.15fr) minmax(320px,0.85fr)"}}>
          <Card>
            <CardHeader>
              <div style={{display:"flex",gap:12,justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:isMobile?22:32,fontWeight:800,marginBottom:6}}>Scout Match Flow</div>
                  {!isMobile&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                    {formation&&lineupData&&<Badge variant="success">▶ {formation}</Badge>}
                    {!lineupData&&<Badge variant="danger">No lineup set</Badge>}
                  </div>}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Button variant="outline" size="sm" onClick={()=>setShowSetup(true)}><ClipboardCheck size={14}/> {lineupData?"Edit Lineup":"Setup"}</Button>
                  <Button variant="outline" size="sm" onClick={exportJSON}><Download size={14}/> JSON</Button>
                  <Button variant="outline" size="sm" onClick={exportCSV}><Download size={14}/> CSV</Button>
                  <Button size="sm" onClick={finishMatch}><Save size={14}/> Save</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{display:"grid",gap:12,gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fit,minmax(200px,1fr))"}}>
                <Input value={matchName} onChange={e=>setMatchName(e.target.value)} placeholder="Match name"/>
                <Input value={opponent}  onChange={e=>setOpponent(e.target.value)}  placeholder="Opponent"/>
                <ClockPanel
                  isMobile={isMobile}
                  numPeriods={numPeriods}       setNumPeriods={setNumPeriods}
                  periodMins={periodMins}        setPeriodMins={setPeriodMins}
                  currentPeriod={currentPeriod} setCurrentPeriod={setCurrentPeriod}
                  clock={clock}                  setClock={setClock}
                  timerOn={timerOn}              setTimerOn={setTimerOn}
                  periodLengthSecs={periodLengthSecs}
                  matchStarted={matchStarted}    setMatchStarted={setMatchStarted}
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected player panel — desktop */}
          {!isMobile&&(
            <Card>
              <CardHeader><div style={{fontSize:20,fontWeight:700}}>Selected Player</div></CardHeader>
              <CardContent>
                {selectedPlayer?(
                  <div style={{display:"grid",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:48,height:48,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16}}>{selectedPlayer.no}</div>
                      <div><div style={{fontWeight:700}}>{selectedPlayer.name}</div><div style={{fontSize:13,color:"#64748b"}}>{selectedPlayer.pos||"No position set"}</div></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                      {ACTIONS.filter(a=>!["sub_on","sub_off"].includes(a.key)).map(a=>(
                        <div key={a.key} style={{border:"1px solid #e2e8f0",borderRadius:10,background:"#f8fafc",padding:5,textAlign:"center"}}>
                          <div style={{fontSize:13}}>{a.icon}</div>
                          <div style={{fontSize:9,color:"#64748b"}}>{a.label}</div>
                          <div style={{fontWeight:700,fontSize:12}}>{events.filter(e=>e.playerId===selectedPlayer.id&&e.action===a.key).length}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ):(
                  <div style={{border:"1px dashed #cbd5e1",borderRadius:16,padding:28,textAlign:"center",color:"#64748b",fontSize:14}}>Tap a player on the pitch.</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop tab bar */}
        {!isMobile&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[{key:"extract",label:"1. Extract"},{key:"players",label:"2. Players"},{key:"pitch",label:"3. Pitch"},{key:"database",label:"4. Database"}].map(t=>(
              <Button key={t.key} variant={activeTab===t.key?"primary":"outline"} onClick={()=>setActiveTab(t.key)}>{t.label}</Button>
            ))}
          </div>
        )}

        {activeTab==="extract" &&<ExtractTab isMobile={isMobile} imageUrl={imageUrl} imageDataUrl={imageDataUrl} ocrText={ocrText} setOcrText={setOcrText} ocrError={ocrError} setOcrError={setOcrError} manualText={manualText} setManualText={setManualText} isExtracting={isExtracting} fileRef={fileRef} handleImageUpload={handleImageUpload} runOCR={runOCR} applyManualParse={applyManualParse} loadDemoText={()=>{setManualText(DEMO_OCR_TEXT);setOcrError("");}}/>}
        {activeTab==="players" &&<PlayersTab players={players} addBlankPlayer={addBlankPlayer} updatePlayer={updatePlayer} removePlayer={removePlayer} setEditingPlayer={setEditingPlayer}/>}
        {activeTab==="pitch"   &&<PitchTab
          isMobile={isMobile} players={players} events={events} leaderboard={leaderboard}
          selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId}
          logAction={logAction} undoLastEvent={undoLastEvent} resetMatch={resetMatch}
          formation={formation} lineupData={lineupData} benchIds={benchIds}
          onMakeSub={handleMakeSub}
          currentPeriod={currentPeriod} periodLengthSecs={periodLengthSecs} clock={clock}
        />}
        {activeTab==="database"&&<DatabaseTab isMobile={isMobile} db={db} tests={tests} setTests={setTests}/>}

      </div>

      {isMobile&&<MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab}/>}

      {/* Edit player modal */}
      <Modal open={!!editingPlayer} onClose={()=>setEditingPlayer(null)} title="Edit Player">
        {editingPlayer&&(
          <div style={{display:"grid",gap:12}}>
            <Input value={editingPlayer.no}   onChange={e=>setEditingPlayer({...editingPlayer,no:e.target.value})}                  placeholder="Number"/>
            <Input value={editingPlayer.name} onChange={e=>setEditingPlayer({...editingPlayer,name:e.target.value})}                placeholder="Name"/>
            <Input value={editingPlayer.pos}  onChange={e=>setEditingPlayer({...editingPlayer,pos:e.target.value.toUpperCase()})}    placeholder="Position"/>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <Button variant="outline" onClick={()=>setEditingPlayer(null)}>Cancel</Button>
              <Button onClick={()=>{updatePlayer(editingPlayer.id,editingPlayer);setEditingPlayer(null);}}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pre-match setup modal / full screen */}
      <Modal open={showSetup} onClose={()=>setShowSetup(false)} title="" maxWidth={900}>
        <PreMatchSetup players={players} onConfirm={handleLineupConfirm}/>
      </Modal>
    </div>
  );
}