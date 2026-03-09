import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, ScanText, Users, Plus, Trash2, Download, Save,
  RotateCcw, Goal, Zap, Brain, Shield, Target, SquarePen,
  AlertTriangle, CheckCircle2, X, Swords,
  Camera, ClipboardList, Crosshair, Database,
  Footprints, SendHorizonal, Activity, AlertOctagon,
  Ambulance, BatteryLow, HandMetal, ShieldAlert,
  ChevronRight,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

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
];

const DEFAULT_FORMATION = {
  GK:       [{ x: 50, y: 89 }],
  RB:       [{ x: 82, y: 72 }],
  CB:       [{ x: 58, y: 73 }, { x: 42, y: 73 }],
  LB:       [{ x: 18, y: 72 }],
  CDM:      [{ x: 50, y: 58 }],
  CM:       [{ x: 35, y: 48 }, { x: 65, y: 48 }],
  CAM:      [{ x: 50, y: 38 }],
  RW:       [{ x: 80, y: 25 }],
  LW:       [{ x: 20, y: 25 }],
  CF:       [{ x: 50, y: 15 }],
  ST:       [{ x: 50, y: 15 }],
  W:        [{ x: 80, y: 25 }, { x: 20, y: 25 }],
  "LW/RW":  [{ x: 80, y: 25 }, { x: 20, y: 25 }],
  "CDM/LB": [{ x: 18, y: 72 }, { x: 50, y: 58 }],
  "CB/RB":  [{ x: 82, y: 72 }, { x: 58, y: 73 }, { x: 42, y: 73 }],
  "LW/LB":  [{ x: 20, y: 25 }, { x: 18, y: 72 }],
};

const DEMO_OCR_TEXT = `No# |, PlayerA |, Position`;
const STORAGE_KEY   = "ray-scout-pitch-app-vite-v1";

const MOBILE_TABS = [
  { key: "extract",  label: "Extract",  Icon: Camera       },
  { key: "players",  label: "Players",  Icon: ClipboardList },
  { key: "pitch",    label: "Pitch",    Icon: Crosshair    },
  { key: "database", label: "Database", Icon: Database     },
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

// Ordinal label helper
const PERIOD_LABELS = ["1st","2nd","3rd","4th"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function cleanLine(line) {
  return String(line||"")
    .replace(/[✓✔]/g,"").replace(/CONFIRMED/gi,"").replace(/U\d+/gi,"")
    .replace(/AW\d+/gi,"").replace(/\b\d{1,2}\.\d{1,2}\b/g,"")
    .replace(/[|,:;]+/g," ").replace(/\s+/g," ").trim();
}

function isLikelyPosition(line) {
  return /^(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB)(\/(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB))*$/i.test(String(line||"").trim());
}

function isLikelyName(line) {
  const c=cleanLine(line);
  if (!c||isLikelyPosition(c)) return false;
  if (/^(CONFIRMED|SELECTED|SQUAD)$/i.test(c)||/^[A-Z]{1,3}\d*$/i.test(c)) return false;
  const parts=c.split(" ").filter(Boolean);
  return parts.length>=2&&parts.every(p=>/[A-Za-z''-]/.test(p));
}

function normalisePosition(line) {
  const c=cleanLine(line).toUpperCase(); return isLikelyPosition(c)?c:"";
}

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

function getPositionSlot(players) {
  const grouped=players.reduce((acc,p)=>{const k=(p.pos||"CM").toUpperCase().trim();(acc[k]=acc[k]||[]).push(p);return acc;},{});
  const placed=[];
  Object.entries(grouped).forEach(([posKey,group])=>{
    const baseSlots=DEFAULT_FORMATION[posKey]||DEFAULT_FORMATION[posKey.split("/")[0]]||[{x:50,y:50}];
    if (group.length<=baseSlots.length){group.forEach((p,i)=>placed.push({...p,...baseSlots[i]}));return;}
    const ppb=Math.ceil(group.length/baseSlots.length);
    group.forEach((p,i)=>{
      const bi=Math.min(Math.floor(i/ppb),baseSlots.length-1);
      const base=baseSlots[bi],li=i-bi*ppb,lc=Math.min(ppb,group.length-bi*ppb);
      let x=base.x,y=base.y;
      if (lc>1){const cols=Math.min(lc,3);x=base.x+(li%cols-(cols-1)/2)*8;y=base.y+Math.floor(li/cols)*7;}
      placed.push({...p,x:Math.max(8,Math.min(92,x)),y:Math.max(8,Math.min(92,y))});
    });
  });
  return placed;
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

function Button({children,variant="primary",...props}) {
  const s={primary:{background:"#0f172a",color:"#fff",border:"1px solid #0f172a"},outline:{background:"#fff",color:"#0f172a",border:"1px solid #cbd5e1"},danger:{background:"#dc2626",color:"#fff",border:"1px solid #dc2626"}};
  return <button {...props} style={{...s[variant],borderRadius:14,padding:"10px 14px",fontWeight:600,cursor:props.disabled?"not-allowed":"pointer",opacity:props.disabled?0.55:1,display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</button>;
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

function Input(props){return <input {...props} style={{width:"100%",padding:"12px 14px",borderRadius:14,border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",boxSizing:"border-box"}}/>;}
function Textarea(props){return <textarea {...props} style={{width:"100%",padding:"12px 14px",borderRadius:14,border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",boxSizing:"border-box",resize:"vertical"}}/>;}

function Badge({children,variant="default"}) {
  const s=variant==="danger"?{background:"#fee2e2",color:"#991b1b",border:"1px solid #fecaca"}:{background:"#e2e8f0",color:"#0f172a",border:"1px solid #cbd5e1"};
  return <span style={{...s,display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,fontSize:12,fontWeight:600}}>{children}</span>;
}

function Card({children,style={}}){return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:22,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",...style}}>{children}</div>;}
function CardHeader({children}){return <div style={{padding:20,paddingBottom:8}}>{children}</div>;}
function CardContent({children}){return <div style={{padding:20,paddingTop:8}}>{children}</div>;}

function Modal({open,onClose,title,children}) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,zIndex:2000}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"#fff",borderRadius:22,border:"1px solid #e2e8f0",boxShadow:"0 20px 40px rgba(0,0,0,0.18)"}}>
        <div style={{padding:20,borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:20,fontWeight:700}}>{title}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer"}}><X size={20}/></button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Mobile Bottom Tab Bar ────────────────────────────────────────────────────

function MobileTabBar({activeTab,setActiveTab}) {
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#ffffff",borderTop:"1px solid #e2e8f0",display:"flex",alignItems:"stretch",zIndex:1000,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {MOBILE_TABS.map(({key,label,Icon})=>{
        const active=activeTab===key;
        return (
          <button key={key} onClick={()=>setActiveTab(key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"transparent",border:"none",cursor:"pointer",color:active?"#0f172a":"#94a3b8",position:"relative",minHeight:60,paddingBottom:4}}>
            {active&&<div style={{position:"absolute",top:0,left:"25%",right:"25%",height:3,background:"#0f172a",borderRadius:"0 0 4px 4px"}}/>}
            <Icon size={22} strokeWidth={active?2.5:1.8}/>
            <span style={{fontSize:10,fontWeight:active?700:500,letterSpacing:0.2}}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SubTabs({tabs,active,setActive}) {
  return (
    <div style={{display:"flex",gap:8,marginBottom:4}}>
      {tabs.map(([k,l])=>(
        <button key={k} onClick={()=>setActive(k)} style={{flex:1,padding:"9px 4px",borderRadius:12,border:"none",cursor:"pointer",background:active===k?"#0f172a":"#e2e8f0",color:active===k?"#fff":"#64748b",fontSize:12,fontWeight:600}}>{l}</button>
      ))}
    </div>
  );
}

// ─── Clock Panel — countdown with periods ─────────────────────────────────────

function ClockPanel({
  isMobile,
  // period config (set before match starts)
  numPeriods, setNumPeriods,
  periodMins, setPeriodMins,
  // live state
  currentPeriod, setCurrentPeriod,
  clock, setClock,
  timerOn, setTimerOn,
  periodLengthSecs,
  matchStarted, setMatchStarted,
  onPeriodEnd,
}) {
  const remaining = clock;
  const isLastPeriod = currentPeriod >= numPeriods;
  const periodLabel = PERIOD_LABELS[currentPeriod - 1] || `P${currentPeriod}`;

  // Colour clock red when ≤ 60 s left
  const clockColour = remaining <= 60 && matchStarted ? "#dc2626" : "#0f172a";

  function handleStart() {
    if (!matchStarted) {
      // First start — initialise clock to full period length
      setClock(periodLengthSecs);
      setMatchStarted(true);
    }
    setTimerOn(s => !s);
  }

  function handleNextPeriod() {
    if (isLastPeriod) return;
    setCurrentPeriod(p => p + 1);
    setClock(periodLengthSecs);
    setTimerOn(false);
  }

  function handleReset() {
    setTimerOn(false);
    setMatchStarted(false);
    setCurrentPeriod(1);
    setClock(periodLengthSecs);
  }

  // Period pip indicators
  const pips = Array.from({length: numPeriods}, (_, i) => {
    const done = i + 1 < currentPeriod;
    const active = i + 1 === currentPeriod;
    return (
      <div key={i} style={{
        width: 10, height: 10, borderRadius: "50%",
        background: done ? "#0f172a" : active ? (remaining<=60&&matchStarted?"#dc2626":"#3b82f6") : "#cbd5e1",
        border: active ? "2px solid #0f172a" : "2px solid transparent",
        transition: "background 0.3s",
      }}/>
    );
  });

  return (
    <div style={{
      gridColumn: isMobile ? "1/-1" : undefined,
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      background: "#f8fafc",
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Period config row — only editable before match starts */}
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>

        {/* Periods selector */}
        <div style={{flex:"1 1 120px"}}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Periods</div>
          <div style={{display:"flex",gap:4}}>
            {[1,2,3,4].map(n=>(
              <button key={n} disabled={matchStarted} onClick={()=>{setNumPeriods(n);}} style={{
                flex:1, padding:"6px 0", borderRadius:8, border:"1px solid",
                borderColor: numPeriods===n?"#0f172a":"#cbd5e1",
                background: numPeriods===n?"#0f172a":"#fff",
                color: numPeriods===n?"#fff":"#64748b",
                fontWeight:700, fontSize:13,
                cursor: matchStarted?"not-allowed":"pointer",
                opacity: matchStarted?0.6:1,
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Period length selector */}
        <div style={{flex:"1 1 160px"}}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Mins per period</div>
          <div style={{display:"flex",gap:4}}>
            {[10,15,20,25,30,45].map(m=>(
              <button key={m} disabled={matchStarted} onClick={()=>setPeriodMins(m)} style={{
                flex:1, padding:"6px 0", borderRadius:8, border:"1px solid",
                borderColor: periodMins===m?"#0f172a":"#cbd5e1",
                background: periodMins===m?"#0f172a":"#fff",
                color: periodMins===m?"#fff":"#64748b",
                fontWeight:700, fontSize:11,
                cursor: matchStarted?"not-allowed":"pointer",
                opacity: matchStarted?0.6:1,
              }}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Clock display row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>

        {/* Left: period label + pips + clock */}
        <div>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
            <span>{periodLabel} Period</span>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>{pips}</div>
          </div>
          <div style={{
            fontSize: 38,
            fontWeight: 800,
            color: clockColour,
            letterSpacing: -1,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            transition: "color 0.3s",
          }}>
            {formatClock(matchStarted ? remaining : periodLengthSecs)}
          </div>
          {matchStarted && remaining === 0 && (
            <div style={{fontSize:12,color:"#dc2626",fontWeight:700,marginTop:2}}>
              {isLastPeriod ? "⏱ Full time!" : `⏱ End of ${periodLabel} period`}
            </div>
          )}
        </div>

        {/* Right: buttons */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Button variant="outline" onClick={handleStart} disabled={matchStarted && remaining===0 && isLastPeriod}>
            {!matchStarted ? "Start" : timerOn ? "Pause" : "Resume"}
          </Button>

          {matchStarted && !isLastPeriod && remaining === 0 && (
            <Button onClick={handleNextPeriod}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                Next <ChevronRight size={14}/>
              </span>
            </Button>
          )}

          {matchStarted && !isLastPeriod && remaining > 0 && (
            <Button variant="outline" onClick={handleNextPeriod}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                Skip <ChevronRight size={14}/>
              </span>
            </Button>
          )}

          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>
      </div>
    </div>
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
              <Button onClick={()=>fileRef.current?.click()}><span style={{display:"inline-flex",alignItems:"center",gap:8}}><Upload size={16}/> Upload</span></Button>
              <Button variant="outline" onClick={runOCR} disabled={!imageDataUrl||isExtracting}><span style={{display:"inline-flex",alignItems:"center",gap:8}}><ScanText size={16}/>{isExtracting?"Extracting…":"Extract"}</span></Button>
              <Button variant="outline" onClick={loadDemoText}><span style={{display:"inline-flex",alignItems:"center",gap:8}}><Users size={16}/> Demo</span></Button>
            </div>
            {ocrError&&<div style={{border:"1px solid #fde68a",background:"#fefce8",color:"#854d0e",borderRadius:16,padding:14,marginBottom:16}}><div style={{display:"flex",alignItems:"flex-start",gap:8}}><AlertTriangle size={16} style={{marginTop:2}}/><span>{ocrError}</span></div></div>}
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
                  <Button onClick={()=>applyManualParse(manualText)}><span style={{display:"inline-flex",alignItems:"center",gap:8}}><Users size={16}/> Parse Text</span></Button>
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
          <Button onClick={addBlankPlayer}><span style={{display:"inline-flex",alignItems:"center",gap:8}}><Plus size={16}/> Add Player</span></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{display:"grid",gap:10}}>
          {players.map(p=>(
            <div key={p.id} style={{display:"grid",gap:8,gridTemplateColumns:"48px 3fr 52px 45px 35px",alignItems:"center",border:"1px solid #e2e8f0",background:"#fafafa",borderRadius:16,padding:10}}>
              <Input value={p.no}   onChange={e=>updatePlayer(p.id,{no:e.target.value})}                    placeholder="#"   />
              <Input value={p.name} onChange={e=>updatePlayer(p.id,{name:e.target.value})}                  placeholder="Name"/>
              <Input value={p.pos}  onChange={e=>updatePlayer(p.id,{pos:e.target.value.toUpperCase()})}      placeholder="Pos" />
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

function PitchTab({isMobile,placedPlayers,selectedPlayerId,setSelectedPlayerId,events,players,leaderboard,logAction,undoLastEvent,resetMatch}) {
  const [sub,setSub]=useState("pitch");
  const disabled=!selectedPlayerId;

  return (
    <div style={{display:"grid",gap:16,gridTemplateColumns:isMobile?"1fr":"minmax(0,1.15fr) minmax(320px,0.85fr)"}}>
      <Card>
        <CardHeader>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div style={{fontSize:22,fontWeight:700}}>Pitch Interface</div>
            <div style={{display:"flex",gap:8}}>
              <Button variant="outline" onClick={undoLastEvent}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><RotateCcw size={15}/> Undo</span></Button>
              <Button variant="outline" onClick={resetMatch}>Clear</Button>
            </div>
          </div>
          {isMobile&&<div style={{marginTop:12}}><SubTabs tabs={[["pitch","⚽ Pitch"],["board","🏆 Board"],["log","📋 Log"]]} active={sub} setActive={setSub}/></div>}
        </CardHeader>

        <CardContent>
          {(!isMobile||sub==="pitch")&&(
            <>
              <div style={{position:"relative",margin:"0 auto",width:"100%",maxWidth:isMobile?340:420,aspectRatio:"0.72/1",overflow:"hidden",borderRadius:28,border:"4px solid #fff",background:"#047857",boxShadow:"inset 0 0 20px rgba(0,0,0,0.12)"}}>
                <div style={{position:"absolute",inset:12,borderRadius:22,border:"2px solid rgba(255,255,255,0.8)"}}/>
                <div style={{position:"absolute",left:"50%",top:"50%",width:96,height:96,transform:"translate(-50%,-50%)",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.8)"}}/>
                <div style={{position:"absolute",left:0,right:0,top:"50%",borderTop:"2px solid rgba(255,255,255,0.8)"}}/>
                <div style={{position:"absolute",left:"50%",top:12,width:160,height:64,transform:"translateX(-50%)",borderBottom:"2px solid rgba(255,255,255,0.8)",borderLeft:"2px solid rgba(255,255,255,0.8)",borderRight:"2px solid rgba(255,255,255,0.8)",borderBottomLeftRadius:16,borderBottomRightRadius:16}}/>
                <div style={{position:"absolute",left:"50%",bottom:12,width:160,height:64,transform:"translateX(-50%)",borderTop:"2px solid rgba(255,255,255,0.8)",borderLeft:"2px solid rgba(255,255,255,0.8)",borderRight:"2px solid rgba(255,255,255,0.8)",borderTopLeftRadius:16,borderTopRightRadius:16}}/>
                {placedPlayers.map(p=>{
                  const score=scorePlayer(events,p.id),sel=selectedPlayerId===p.id;
                  return (
                    <motion.button key={p.id} whileTap={{scale:0.92}} onClick={()=>setSelectedPlayerId(p.id)} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:"translate(-50%,-50%)",width:isMobile?48:56,height:isMobile?48:56,borderRadius:"50%",border:sel?"3px solid #0f172a":"2px solid #fff",background:sel?"#fcd34d":"#fff",color:"#0f172a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:sel?"0 0 0 3px rgba(252,211,77,0.4),0 8px 18px rgba(0,0,0,0.2)":"0 4px 12px rgba(0,0,0,0.18)",cursor:"pointer"}}>
                      <span style={{fontSize:isMobile?13:14,fontWeight:800,lineHeight:1}}>{p.no}</span>
                      <span style={{maxWidth:isMobile?36:44,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:8,lineHeight:1.2}}>{(p.name||"").split(" ")[0].slice(0,8)}</span>
                      {score!==0&&<span style={{fontSize:9,lineHeight:1,color:score>0?"#166534":"#991b1b",fontWeight:700}}>{score>0?`+${score}`:score}</span>}
                    </motion.button>
                  );
                })}
              </div>

              {/* Action buttons grouped by positive / negative / neutral */}
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
            <div style={{display:"grid",gap:8,maxHeight:420,overflow:"auto"}}>
              {events.length===0&&<div style={{color:"#64748b",fontSize:14}}>No events yet.</div>}
              {events.map(e=>{
                const p=players.find(x=>x.id===e.playerId),a=ACTIONS.find(x=>x.key===e.action);
                return (
                  <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#fff",borderRadius:14,padding:12}}>
                    <div><div style={{fontWeight:700,fontSize:14}}>{a?.icon} {p?.no}. {p?.name}</div><div style={{fontSize:12,color:"#64748b"}}>{a?.label} · {p?.pos}</div></div>
                    <Badge>{formatClock(e.t)}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!isMobile&&(
        <div style={{display:"grid",gap:16}}>
          <Card>
            <CardHeader><div style={{fontSize:22,fontWeight:700}}>Leaderboard</div></CardHeader>
            <CardContent>
              <div style={{display:"grid",gap:8}}>
                {leaderboard.slice(0,8).map((p,idx)=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14}}>{idx+1}</div>
                      <div><div style={{fontWeight:700}}>{p.no}. {p.name}</div><div style={{fontSize:12,color:"#64748b"}}>{p.pos}</div></div>
                    </div>
                    <Badge>{p.score}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div style={{fontSize:22,fontWeight:700}}>Live Event Log</div></CardHeader>
            <CardContent>
              <div style={{maxHeight:360,overflow:"auto",display:"grid",gap:8}}>
                {events.length===0&&<div style={{fontSize:14,color:"#64748b"}}>No events logged yet.</div>}
                {events.map(e=>{
                  const p=players.find(x=>x.id===e.playerId),a=ACTIONS.find(x=>x.key===e.action);
                  return (
                    <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#fff",borderRadius:14,padding:12}}>
                      <div><div style={{fontWeight:700}}>{a?.icon} {p?.no}. {p?.name}</div><div style={{fontSize:12,color:"#64748b"}}>{a?.label} · {p?.pos}</div></div>
                      <Badge>{formatClock(e.t)}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
                  <div><div style={{fontSize:18,fontWeight:700}}>{m.matchName||"Untitled Match"}</div><div style={{fontSize:14,color:"#64748b"}}>{m.opponent?`vs ${m.opponent}`:"No opponent"} · {new Date(m.playedAt).toLocaleString()}</div></div>
                  <Badge>{m.numPeriods}×{m.periodMins}min</Badge>
                </div>
                <div style={{marginTop:16,display:"grid",gap:8,gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))"}}>
                  {m.summary.slice(0,9).map(p=>(
                    <div key={p.playerId} style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:12}}>
                      <div style={{fontWeight:700}}>{p.no}. {p.name}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{p.pos}</div>
                      <div style={{marginTop:8,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14}}>Score</span><Badge>{p.score}</Badge></div>
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
            <Button variant="outline" onClick={()=>setTests(runParserTests())}>Run Tests</Button>
          </div>
          <div style={{display:"grid",gap:8}}>
            {tests.tests.map(t=>(
              <div key={t.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:12}}>
                <span style={{fontSize:14}}>{t.name}</span>
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

  // ── Match meta ──
  const [players,          setPlayers]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [db,               setDb]               = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [matchName,        setMatchName]        = useState("U CP-Showcase");
  const [opponent,         setOpponent]         = useState("");

  // ── Period / clock state ──
  const [numPeriods,    setNumPeriods]    = useState(2);      // 1-4
  const [periodMins,    setPeriodMins]    = useState(20);     // minutes per period
  const [currentPeriod, setCurrentPeriod]= useState(1);
  const [clock,         setClock]        = useState(20*60);  // seconds remaining
  const [timerOn,       setTimerOn]      = useState(false);
  const [matchStarted,  setMatchStarted] = useState(false);

  // periodLengthSecs derived from periodMins
  const periodLengthSecs = periodMins * 60;

  // Sync clock when periodMins changes and match hasn't started yet
  useEffect(()=>{ if (!matchStarted) setClock(periodLengthSecs); },[periodMins,matchStarted,periodLengthSecs]);

  // ── Countdown tick ──
  useEffect(()=>{
    if (!timerOn) return;
    if (clock <= 0) { setTimerOn(false); return; }
    const id=setInterval(()=>{
      setClock(c=>{
        if (c<=1){ setTimerOn(false); return 0; }
        return c-1;
      });
    },1000);
    return ()=>clearInterval(id);
  },[timerOn,clock]);

  // ── OCR / extract ──
  const [manualText,    setManualText]    = useState(DEMO_OCR_TEXT);
  const [imageUrl,      setImageUrl]      = useState("");
  const [imageDataUrl,  setImageDataUrl]  = useState("");
  const [ocrText,       setOcrText]       = useState("");
  const [ocrError,      setOcrError]      = useState("");
  const [isExtracting,  setIsExtracting]  = useState(false);

  // ── UI ──
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [activeTab,     setActiveTab]     = useState("extract");
  const [tests,         setTests]         = useState(runParserTests);
  const [isMobile,      setIsMobile]      = useState(()=>typeof window!=="undefined"?window.innerWidth<=768:false);

  // ── Persistence ──
  useEffect(()=>{
    const raw=localStorage.getItem(STORAGE_KEY);
    if (!raw){setPlayers(parseOCRText(DEMO_OCR_TEXT));return;}
    try {
      const s=JSON.parse(raw);
      setPlayers(s.players?.length?s.players:parseOCRText(DEMO_OCR_TEXT));
      setEvents(s.events||[]); setDb(s.db||[]); setMatchName(s.matchName||"U CP-Showcase");
      setOpponent(s.opponent||""); setOcrText(s.ocrText||""); setManualText(s.manualText||DEMO_OCR_TEXT); setOcrError(s.ocrError||"");
      if (s.numPeriods) setNumPeriods(s.numPeriods);
      if (s.periodMins) setPeriodMins(s.periodMins);
    } catch { setPlayers(parseOCRText(DEMO_OCR_TEXT)); }
  },[]);

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({players,events,db,matchName,opponent,ocrText,manualText,ocrError,numPeriods,periodMins}));
  },[players,events,db,matchName,opponent,ocrText,manualText,ocrError,numPeriods,periodMins]);

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);
  },[]);

  // ── Derived ──
  const placedPlayers  = useMemo(()=>getPositionSlot(players),[players]);
  const selectedPlayer = players.find(p=>p.id===selectedPlayerId)||null;
  const leaderboard    = useMemo(()=>[...players].map(p=>({...p,score:scorePlayer(events,p.id),counts:getActionCounts(events,p.id)})).sort((a,b)=>{
    if (b.score!==a.score)return b.score-a.score;
    const an=parseInt(a.no,10),bn=parseInt(b.no,10);
    if (!isNaN(an)&&!isNaN(bn))return an-bn;return String(a.name).localeCompare(String(b.name));
  }),[players,events]);

  // ── Image ──
  async function fileToDataUrl(file) {
    const orig=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=orig;});
    const scale=Math.min(1,1400/img.width),c=document.createElement("canvas");
    c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",0.72);
  }
  async function handleImageUpload(e) {
    const file=e.target.files?.[0];if(!file)return;
    try{setOcrError("");setImageUrl(URL.createObjectURL(file));setImageDataUrl(await fileToDataUrl(file));}
    catch(err){console.error(err);setOcrError("Could not prepare image");}
  }

  // ── OCR ──
  function parsePlayersJson(text) {
    try{
      const c=String(text||"").replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
      const parsed=JSON.parse(c);if(!Array.isArray(parsed.players))return[];
      return parsed.players.map((p,i)=>({id:makeId(),no:String(i+1),name:String(p.name||"").trim(),pos:String(p.pos||"").trim().toUpperCase()})).filter(p=>p.name);
    }catch{return[];}
  }
  async function runOCR() {
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
  function applyManualParse(src=manualText) {
    const jp=parsePlayersJson(src);if(jp.length){setPlayers(sortPlayersByNumber(jp));setActiveTab("players");setOcrError("");return;}
    const ep=parseOCRText(src);if(ep.length){setPlayers(sortPlayersByNumber(ep));setActiveTab("players");setOcrError("");return;}
    setOcrError("No players could be parsed.");
  }

  // ── Players ──
  const addBlankPlayer=()=>setPlayers(prev=>sortPlayersByNumber([...prev,{id:makeId(),no:String(prev.length+1),name:"New Player",pos:"Pos"}]));
  const updatePlayer=(id,patch)=>setPlayers(prev=>sortPlayersByNumber(prev.map(p=>p.id===id?{...p,...patch}:p)));
  const removePlayer=(id)=>{setPlayers(p=>p.filter(x=>x.id!==id));setEvents(e=>e.filter(x=>x.playerId!==id));if(selectedPlayerId===id)setSelectedPlayerId(null);};

  // ── Events ──
  // Events store the period + elapsed seconds for that period
  const logAction=(key)=>{
    if(!selectedPlayerId)return;
    const elapsed=periodLengthSecs-clock; // seconds into current period
    setEvents(prev=>[{id:makeId(),t:elapsed,period:currentPeriod,playerId:selectedPlayerId,action:key,ts:new Date().toISOString()},...prev]);
  };
  const undoLastEvent=()=>setEvents(prev=>prev.slice(1));
  const resetMatch=()=>{
    setEvents([]);setTimerOn(false);setMatchStarted(false);
    setCurrentPeriod(1);setClock(periodLengthSecs);setSelectedPlayerId(null);
  };
  const finishMatch=()=>{
    const summary=leaderboard.map(({id:playerId,no,name,pos,score,counts})=>({playerId,no,name,pos,score,counts}));
    setDb(prev=>[{id:makeId(),matchName,opponent,numPeriods,periodMins,playedAt:new Date().toISOString(),summary,events},...prev]);
  };

  // ── Exports ──
  function exportJSON(){const blob=new Blob([JSON.stringify({players,events,db,matchName,opponent,numPeriods,periodMins},null,2)],{type:"application/json"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`scout-${matchName.replace(/\s+/g,"-").toLowerCase()}.json`});a.click();URL.revokeObjectURL(a.href);}
  function exportCSV(){
    const rows=[["Period","Time","No","Player","Pos","Action"],...events.map(e=>{
      const p=players.find(x=>x.id===e.playerId),a=ACTIONS.find(x=>x.key===e.action);
      return[e.period||1,formatClock(e.t),p?.no||"",p?.name||"",p?.pos||"",a?.label||e.action];
    })];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`events-${matchName.replace(/\s+/g,"-").toLowerCase()}.csv`});a.click();URL.revokeObjectURL(a.href);
  }

  // ─── Render ───────────────────────────────────────────────────────────────
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
                  {!isMobile&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Badge>Photo Reference</Badge><Badge>Manual OCR</Badge><Badge>Pitch Interface</Badge><Badge>Database</Badge></div>}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Button variant="outline" onClick={exportJSON}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Download size={15}/> JSON</span></Button>
                  <Button variant="outline" onClick={exportCSV}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Download size={15}/> CSV</span></Button>
                  <Button onClick={finishMatch}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={15}/> Save</span></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{display:"grid",gap:12,gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fit,minmax(200px,1fr))"}}>
                <Input value={matchName} onChange={e=>setMatchName(e.target.value)} placeholder="Match name"/>
                <Input value={opponent}  onChange={e=>setOpponent(e.target.value)}  placeholder="Opponent"/>

                {/* ── Clock Panel — spans full width ── */}
                <ClockPanel
                  isMobile={isMobile}
                  numPeriods={numPeriods}    setNumPeriods={setNumPeriods}
                  periodMins={periodMins}    setPeriodMins={setPeriodMins}
                  currentPeriod={currentPeriod} setCurrentPeriod={setCurrentPeriod}
                  clock={clock}              setClock={setClock}
                  timerOn={timerOn}          setTimerOn={setTimerOn}
                  periodLengthSecs={periodLengthSecs}
                  matchStarted={matchStarted} setMatchStarted={setMatchStarted}
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected player — desktop only */}
          {!isMobile&&(
            <Card>
              <CardHeader><div style={{fontSize:22,fontWeight:700}}>Selected Player</div></CardHeader>
              <CardContent>
                {selectedPlayer?(
                  <div style={{display:"grid",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:52,height:52,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18}}>{selectedPlayer.no}</div>
                      <div><div style={{fontWeight:700}}>{selectedPlayer.name}</div><div style={{fontSize:14,color:"#64748b"}}>{selectedPlayer.pos||"No position set"}</div></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                      {ACTIONS.map(a=>(
                        <div key={a.key} style={{border:"1px solid #e2e8f0",borderRadius:10,background:"#f8fafc",padding:6,textAlign:"center"}}>
                          <div style={{fontSize:14}}>{a.icon}</div>
                          <div style={{fontSize:10,color:"#64748b"}}>{a.label}</div>
                          <div style={{fontWeight:700,fontSize:13}}>{events.filter(e=>e.playerId===selectedPlayer.id&&e.action===a.key).length}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ):(
                  <div style={{border:"1px dashed #cbd5e1",borderRadius:16,padding:32,textAlign:"center",color:"#64748b"}}>Tap a player on the pitch.</div>
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

        {activeTab==="extract" &&<ExtractTab  isMobile={isMobile} imageUrl={imageUrl} imageDataUrl={imageDataUrl} ocrText={ocrText} setOcrText={setOcrText} ocrError={ocrError} setOcrError={setOcrError} manualText={manualText} setManualText={setManualText} isExtracting={isExtracting} fileRef={fileRef} handleImageUpload={handleImageUpload} runOCR={runOCR} applyManualParse={applyManualParse} loadDemoText={()=>{setManualText(DEMO_OCR_TEXT);setOcrError("");}}/>}
        {activeTab==="players" &&<PlayersTab  players={players} addBlankPlayer={addBlankPlayer} updatePlayer={updatePlayer} removePlayer={removePlayer} setEditingPlayer={setEditingPlayer}/>}
        {activeTab==="pitch"   &&<PitchTab    isMobile={isMobile} placedPlayers={placedPlayers} selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId} events={events} players={players} leaderboard={leaderboard} logAction={logAction} undoLastEvent={undoLastEvent} resetMatch={resetMatch}/>}
        {activeTab==="database"&&<DatabaseTab isMobile={isMobile} db={db} tests={tests} setTests={setTests}/>}

      </div>

      {isMobile&&<MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab}/>}

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
    </div>
  );
}