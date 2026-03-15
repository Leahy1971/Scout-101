import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, ScanText, Users, Plus, Trash2, Download, Save,
  RotateCcw, Goal, Zap, Brain, Shield, Target, SquarePen,
  AlertTriangle, CheckCircle2, X, Swords,
  Camera, ClipboardList, Crosshair, Database,
  Footprints, SendHorizonal, Activity, AlertOctagon,
  Ambulance, BatteryLow, HandMetal, ShieldAlert,
  ChevronRight, ArrowLeftRight, ClipboardCheck,
  Clock, TrendingUp, TrendingDown, Minus,
  MoveRight, Crosshair as CrosshairIcon, Dumbbell,
  ArrowUp, ChevronsUp, Wind, Navigation,
  RefreshCw, Layers, Star, Flame,
  ThumbsUp, ThumbsDown, Ban, Square,
  AlignJustify, Filter, BarChart2,
  CircleDot, Waypoints, ShieldCheck,
} from "lucide-react";

// ─── Formations ───────────────────────────────────────────────────────────────

const FORMATIONS = {
  "4-3-3":   [{pos:"GK",x:50,y:88},{pos:"RB",x:82,y:72},{pos:"CB",x:62,y:76},{pos:"CB",x:38,y:76},{pos:"LB",x:18,y:72},{pos:"CM",x:70,y:54},{pos:"CM",x:50,y:50},{pos:"CM",x:30,y:54},{pos:"RW",x:80,y:26},{pos:"ST",x:50,y:18},{pos:"LW",x:20,y:26}],
  "4-4-2":   [{pos:"GK",x:50,y:88},{pos:"RB",x:82,y:72},{pos:"CB",x:62,y:76},{pos:"CB",x:38,y:76},{pos:"LB",x:18,y:72},{pos:"RM",x:82,y:50},{pos:"CM",x:62,y:50},{pos:"CM",x:38,y:50},{pos:"LM",x:18,y:50},{pos:"ST",x:62,y:22},{pos:"ST",x:38,y:22}],
  "4-2-3-1": [{pos:"GK",x:50,y:88},{pos:"RB",x:82,y:72},{pos:"CB",x:62,y:76},{pos:"CB",x:38,y:76},{pos:"LB",x:18,y:72},{pos:"CDM",x:62,y:57},{pos:"CDM",x:38,y:57},{pos:"RAM",x:78,y:38},{pos:"CAM",x:50,y:36},{pos:"LAM",x:22,y:38},{pos:"ST",x:50,y:18}],
  "3-5-2":   [{pos:"GK",x:50,y:88},{pos:"CB",x:70,y:75},{pos:"CB",x:50,y:78},{pos:"CB",x:30,y:75},{pos:"RWB",x:86,y:55},{pos:"CM",x:65,y:50},{pos:"CM",x:50,y:46},{pos:"CM",x:35,y:50},{pos:"LWB",x:14,y:55},{pos:"ST",x:62,y:22},{pos:"ST",x:38,y:22}],
  "3-4-3":   [{pos:"GK",x:50,y:88},{pos:"CB",x:70,y:75},{pos:"CB",x:50,y:78},{pos:"CB",x:30,y:75},{pos:"RM",x:82,y:52},{pos:"CM",x:62,y:50},{pos:"CM",x:38,y:50},{pos:"LM",x:18,y:52},{pos:"RW",x:80,y:24},{pos:"ST",x:50,y:18},{pos:"LW",x:20,y:24}],
  "4-1-4-1": [{pos:"GK",x:50,y:88},{pos:"RB",x:82,y:72},{pos:"CB",x:62,y:76},{pos:"CB",x:38,y:76},{pos:"LB",x:18,y:72},{pos:"CDM",x:50,y:60},{pos:"RM",x:82,y:46},{pos:"CM",x:62,y:42},{pos:"CM",x:38,y:42},{pos:"LM",x:18,y:46},{pos:"ST",x:50,y:18}],
  "5-3-2":   [{pos:"GK",x:50,y:88},{pos:"RWB",x:86,y:68},{pos:"CB",x:68,y:76},{pos:"CB",x:50,y:78},{pos:"CB",x:32,y:76},{pos:"LWB",x:14,y:68},{pos:"CM",x:65,y:50},{pos:"CM",x:50,y:46},{pos:"CM",x:35,y:50},{pos:"ST",x:62,y:22},{pos:"ST",x:38,y:22}],
  "4-5-1":   [{pos:"GK",x:50,y:88},{pos:"RB",x:82,y:72},{pos:"CB",x:62,y:76},{pos:"CB",x:38,y:76},{pos:"LB",x:18,y:72},{pos:"RM",x:84,y:48},{pos:"CM",x:67,y:44},{pos:"CM",x:50,y:42},{pos:"CM",x:33,y:44},{pos:"LM",x:16,y:48},{pos:"ST",x:50,y:18}],
};
const FORMATION_NAMES = Object.keys(FORMATIONS);

// ─── Actions — full scoring matrix ────────────────────────────────────────────
// Weights: Good=+3, Bad=-2, Neutral=+1 (per matrix)
// Exceptions from matrix: Goal Good=+3 Bad=-3; Assist Good=+3 Bad=-3
//   Foul Won Good=+1 Bad=-2 Neutral=none
//   Offside Bad=-2 Neutral=-1
//   Yellow Card Neutral=-1
//   Red Card Bad=-2
//   Work Rate / Pressing Neutral=-1

const ACTIONS = [
  // ── TECHNICAL ──────────────────────────────────────────────────────────────
  { key:"passing",      label:"Passing",       icon:"➡️",  group:"tech",  good:3,  bad:-2, neutral:1  },
  { key:"pass_move",    label:"Pass & Move",   icon:"🔄",  group:"tech",  good:3,  bad:-2, neutral:1  },
  { key:"crossing",     label:"Crossing",      icon:"🌐",  group:"tech",  good:3,  bad:-2, neutral:1  },
  { key:"shooting",     label:"Shooting",      icon:"🎯",  group:"tech",  good:3,  bad:-2, neutral:1  },
  { key:"goal",         label:"Goal",          icon:"⚽",  group:"tech",  good:3,  bad:-3, neutral:1  },
  { key:"assist",       label:"Assist",        icon:"🥅",  group:"tech",  good:3,  bad:-3, neutral:1  },
  { key:"dribble",      label:"Dribble",       icon:"💨",  group:"tech",  good:3,  bad:-2, neutral:1  },
  { key:"ball_control", label:"Ball Control",  icon:"🎱",  group:"tech",  good:3,  bad:-2, neutral:1  },
  // ── PHYSICAL ───────────────────────────────────────────────────────────────
  { key:"pace",         label:"Pace",          icon:"⚡",  group:"phys",  good:3,  bad:-2, neutral:1  },
  { key:"movement",     label:"Movement",      icon:"🏃",  group:"phys",  good:3,  bad:-2, neutral:1  },
  { key:"physical",     label:"Physical",      icon:"💪",  group:"phys",  good:3,  bad:-2, neutral:1  },
  { key:"header",       label:"Header",        icon:"🪖",  group:"phys",  good:3,  bad:-2, neutral:1  },
  // ── DEFENSIVE ──────────────────────────────────────────────────────────────
  { key:"tackle",       label:"Tackle",        icon:"🛡️",  group:"def",   good:3,  bad:-2, neutral:1  },
  { key:"interception", label:"Interception",  icon:"✋",  group:"def",   good:3,  bad:-2, neutral:1  },
  { key:"cleared",      label:"Cleared/Block", icon:"🚫",  group:"def",   good:3,  bad:-2, neutral:1  },
  { key:"tracking",     label:"Tracking Back", icon:"↩️",  group:"def",   good:3,  bad:-2, neutral:1  },
  // ── MENTAL / WORK RATE ─────────────────────────────────────────────────────
  { key:"work_rate",    label:"Work Rate",     icon:"🔥",  group:"mental", good:3, bad:-2, neutral:-1 },
  { key:"pressing",     label:"Pressing",      icon:"⚔️",  group:"mental", good:3, bad:-2, neutral:-1 },
  { key:"iq",           label:"IQ",            icon:"🧠",  group:"mental", good:3, bad:-2, neutral:1  },
  { key:"foul_won",     label:"Foul Won",      icon:"🟡",  group:"mental", good:1, bad:-2, neutral:0  },
  // ── DISCIPLINE ─────────────────────────────────────────────────────────────
  { key:"offside",      label:"Offside",       icon:"🚩",  group:"disc",  good:0,  bad:-2, neutral:-1 },
  { key:"yellow_card",  label:"Yellow Card",   icon:"🟨",  group:"disc",  good:0,  bad:0,  neutral:-1 },
  { key:"red_card",     label:"Red Card",      icon:"🟥",  group:"disc",  good:0,  bad:-2, neutral:0  },
  // ── GOALKEEPER ─────────────────────────────────────────────────────────────
  { key:"gk_save",      label:"GK Save",       icon:"🧤",  group:"gk",    good:3,  bad:-2, neutral:1  },
  { key:"gk_feet",      label:"GK Feet",       icon:"🦶",  group:"gk",    good:3,  bad:-2, neutral:1  },
  { key:"gk_kicking",   label:"GK Kicking",    icon:"👟",  group:"gk",    good:3,  bad:-2, neutral:1  },
  { key:"distribution", label:"Distribution",  icon:"📤",  group:"gk",    good:3,  bad:-2, neutral:1  },
  // ── SUB REASONS (neutral only) ─────────────────────────────────────────────
  { key:"sub_reason_mins",    label:"Mins",    icon:"⏱️",  group:"sub",   good:0, bad:0, neutral:1  },
  { key:"sub_reason_poor",    label:"Poor",    icon:"👎",  group:"sub",   good:0, bad:0, neutral:-2 },
  { key:"sub_reason_good",    label:"Good",    icon:"👍",  group:"sub",   good:0, bad:0, neutral:3  },
  { key:"sub_reason_injury",  label:"Injury",  icon:"🩺",  group:"sub",   good:0, bad:0, neutral:1  },
  // ── INTERNAL ───────────────────────────────────────────────────────────────
  { key:"sub_on",   label:"Subbed On",  icon:"🟢", group:"internal", good:0, bad:0, neutral:0 },
  { key:"sub_off",  label:"Subbed Off", icon:"🔴", group:"internal", good:0, bad:0, neutral:0 },
];

// Helper — get the weight stored on an event (events now carry a 'variant' field)
// variant: "good" | "bad" | "neutral"
function getActionWeight(actionKey, variant) {
  const a = ACTIONS.find(x => x.key === actionKey);
  if (!a) return 0;
  if (variant === "good")    return a.good    || 0;
  if (variant === "bad")     return a.bad     || 0;
  if (variant === "neutral") return a.neutral || 0;
  // Legacy events without variant — fall back to net +/- based on good value
  return a.good > 0 ? a.good : a.bad || 0;
}

// ── Button layout — three-variant button per skill ────────────────────────────
// Each entry renders as THREE buttons: Good (+3) / Bad (-2) / Neutral (+1)
// Sub reason and internal actions are single-button (neutral only)

const SKILL_BUTTONS = [
  // Technical
  { key:"passing",      icon:SendHorizonal, label:"Passing"      },
  { key:"pass_move",    icon:MoveRight,     label:"Pass & Move"  },
  { key:"crossing",     icon:Navigation,    label:"Crossing"     },
  { key:"shooting",     icon:CrosshairIcon, label:"Shooting"     },
  { key:"goal",         icon:Goal,          label:"Goal"         },
  { key:"assist",       icon:Target,        label:"Assist"       },
  { key:"dribble",      icon:Wind,          label:"Dribble"      },
  { key:"ball_control", icon:CircleDot,     label:"Ball Ctrl"    },
  // Physical
  { key:"pace",         icon:Zap,           label:"Pace"         },
  { key:"movement",     icon:Footprints,    label:"Movement"     },
  { key:"physical",     icon:Dumbbell,      label:"Physical"     },
  { key:"header",       icon:ArrowUp,       label:"Header"       },
  // Defensive
  { key:"tackle",       icon:Shield,        label:"Tackle"       },
  { key:"interception", icon:ShieldCheck,   label:"Intercept"    },
  { key:"cleared",      icon:Ban,           label:"Cleared"      },
  { key:"tracking",     icon:RefreshCw,     label:"Tracking"     },
  // Mental
  { key:"work_rate",    icon:ChevronsUp,    label:"Work Rate"    },
  { key:"pressing",     icon:Activity,      label:"Pressing"     },
  { key:"iq",           icon:Brain,         label:"IQ"           },
  { key:"foul_won",     icon:Star,          label:"Foul Won"     },
  // Discipline
  { key:"offside",      icon:AlignJustify,  label:"Offside"      },
  { key:"yellow_card",  icon:Square,        label:"Yellow"       },
  { key:"red_card",     icon:Flame,         label:"Red Card"     },
  // GK
  { key:"gk_save",      icon:HandMetal,     label:"GK Save"      },
  { key:"gk_feet",      icon:Footprints,    label:"GK Feet"      },
  { key:"gk_kicking",   icon:Zap,           label:"GK Kick"      },
  { key:"distribution", icon:Waypoints,     label:"Distrib."     },
];

// Sub reason buttons (single tap, no Good/Bad variant)
const SUB_REASON_BUTTONS = [
  { key:"sub_reason_mins",   icon:Clock,        label:"Mins"   },
  { key:"sub_reason_poor",   icon:TrendingDown, label:"Poor"   },
  { key:"sub_reason_good",   icon:TrendingUp,   label:"Good"   },
  { key:"sub_reason_injury", icon:Ambulance,    label:"Injury" },
];

// Groups shown in the pitch action panel
const SKILL_GROUPS = [
  { id:"tech",   label:"⚽ Technical",   color:"#166534", bg:"#f0fdf4" },
  { id:"phys",   label:"💪 Physical",    color:"#1d4ed8", bg:"#eff6ff" },
  { id:"def",    label:"🛡️ Defensive",   color:"#7c3aed", bg:"#f5f3ff" },
  { id:"mental", label:"🧠 Mental",      color:"#b45309", bg:"#fffbeb" },
  { id:"disc",   label:"🟨 Discipline",  color:"#b91c1c", bg:"#fef2f2" },
  { id:"gk",     label:"🧤 Goalkeeper",  color:"#0e7490", bg:"#ecfeff" },
];

// Legacy ACTIONS weight lookup (used by scorePlayer + leaderboard)
// Now weight is per-event (stored as event.weight), but we keep a fallback
const PERIOD_LABELS = ["1st","2nd","3rd","4th"];
const DEMO_OCR_TEXT = `1
James Harper
GK
2
Ryan Mitchell
RB
3
Luca Bianchi
CB
4
Tom Edwards
CB
5
Jake Morrison
LB
6
Danny Walsh
CDM
7
Oliver Hunt
CM
8
Sam Clarke
CM
9
Marcus Webb
RW
10
Tom Leahy
ST
11
Aiden Cole
LW
12
Ben Foster
GK
14
Chris Dunn
CB
15
Tyler Nash
CM
16
Kai Lawson
ST
17
Jordan Price
LW`;
const STORAGE_KEY   = "ray-scout-pitch-app-vite-v1";
const MOBILE_TABS   = [
  { key:"extract",  label:"Extract",  Icon:Camera       },
  { key:"players",  label:"Players",  Icon:ClipboardList },
  { key:"pitch",    label:"Pitch",    Icon:Crosshair     },
  { key:"database", label:"Database", Icon:Database      },
];

// ─── Pitch time tracking ──────────────────────────────────────────────────────
// pitchTimeMap[playerId] = seconds on pitch (computed from events + live clock)
// We recompute this as a derived value every render tick when timerOn

/**
 * For each player, computes total seconds spent on pitch.
 * Uses sub_on / sub_off events (stamped with elapsed seconds in that period)
 * plus a "currently on pitch" flag + live elapsed seconds in current period.
 *
 * pitchIntervals: array of {playerId, onAt (abs secs), offAt (abs secs | null)}
 * absSeconds = (period-1)*periodLengthSecs + elapsedInPeriod
 */
function buildPitchIntervals(events, periodLengthSecs, lineupData) {
  // intervals: Map<playerId, [{on, off}]>
  const intervals = new Map();

  function getOrInit(pid) {
    if (!intervals.has(pid)) intervals.set(pid, []);
    return intervals.get(pid);
  }

  // Starters open an interval at t=0 of their first period they're in lineup
  if (lineupData) {
    lineupData.forEach(slot => {
      if (slot.playerId) {
        const arr = getOrInit(slot.playerId);
        if (arr.length === 0) arr.push({ on: 0, off: null });
      }
    });
  }

  // Process events oldest-first
  const sorted = [...events].sort((a,b) => {
    const at = ((a.period||1)-1)*periodLengthSecs + (a.t||0);
    const bt = ((b.period||1)-1)*periodLengthSecs + (b.t||0);
    return at - bt;
  });

  sorted.forEach(e => {
    const abs = ((e.period||1)-1)*periodLengthSecs + (e.t||0);
    if (e.action === "sub_off") {
      const arr = getOrInit(e.playerId);
      const last = arr[arr.length-1];
      if (last && last.off === null) last.off = abs;
    }
    if (e.action === "sub_on") {
      const arr = getOrInit(e.playerId);
      arr.push({ on: abs, off: null });
    }
  });

  return intervals;
}

function calcPitchSeconds(intervals, nowAbs) {
  // intervals: [{on, off}]
  return intervals.reduce((sum, seg) => {
    const end = seg.off !== null ? seg.off : nowAbs;
    return sum + Math.max(0, end - seg.on);
  }, 0);
}

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
  return /^(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB|RAM|LAM|RM|LM)(\/(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB|RAM|LAM|RM|LM))*$/i.test(String(l||"").trim());
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
  return players.filter(p=>{const k=String(p.name||"").trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true;});
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
  return events.filter(e=>e.playerId===id).reduce((sum,e)=>{
    // New events carry e.weight directly; legacy events fall back to getActionWeight
    if (typeof e.weight === "number") return sum + e.weight;
    return sum + getActionWeight(e.action, e.variant);
  },0);
}
function getActionCounts(events,id) {
  return ACTIONS.reduce((acc,a)=>{acc[a.key]=events.filter(e=>e.playerId===id&&e.action===a.key).length;return acc;},{});
}
function sortPlayersByNumber(list) {
  return [...list].sort((a,b)=>{
    const an=parseInt(a.no,10),bn=parseInt(b.no,10),av=!isNaN(an),bv=!isNaN(bn);
    if(av&&bv)return an-bn;if(av)return-1;if(bv)return 1;
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
  return{tests,passed:tests.filter(t=>t.pass).length,total:tests.length};
}

// Sub-off count → colour
function subOffColour(count) {
  if (count === 0) return null;
  if (count === 1) return "#16a34a"; // green
  if (count === 2) return "#d97706"; // amber
  return "#dc2626";                  // red
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
      {weight!==0&&<span style={{fontSize:8,opacity:0.75,lineHeight:1}}>{weight>0?`+${weight}`:weight}</span>}
    </button>
  );
}

function Input(props){return <input {...props} style={{width:"100%",padding:"10px 14px",borderRadius:14,border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",boxSizing:"border-box",fontSize:14,...props.style}}/>;}
function Textarea(props){return <textarea {...props} style={{width:"100%",padding:"12px 14px",borderRadius:14,border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",boxSizing:"border-box",resize:"vertical"}}/>;}

function Badge({children,variant="default"}) {
  const s=variant==="danger"?{background:"#fee2e2",color:"#991b1b",border:"1px solid #fecaca"}:variant==="success"?{background:"#dcfce7",color:"#166534",border:"1px solid #bbf7d0"}:variant==="warning"?{background:"#fef3c7",color:"#92400e",border:"1px solid #fde68a"}:{background:"#e2e8f0",color:"#0f172a",border:"1px solid #cbd5e1"};
  return <span style={{...s,display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:999,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>;
}
function Card({children,style={}}){return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:22,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",...style}}>{children}</div>;}
function CardHeader({children}){return <div style={{padding:20,paddingBottom:8}}>{children}</div>;}
function CardContent({children}){return <div style={{padding:20,paddingTop:8}}>{children}</div>;}

function Modal({open,onClose,title,children,maxWidth=520,fullscreen=false}) {
  if(!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:fullscreen?"flex-start":"center",justifyContent:"center",padding:fullscreen?0:16,zIndex:2000,overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:fullscreen?"100%":maxWidth,background:"#fff",borderRadius:fullscreen?0:22,border:fullscreen?"none":"1px solid #e2e8f0",boxShadow:"0 20px 40px rgba(0,0,0,0.18)",minHeight:fullscreen?"100vh":"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#fff",zIndex:1,flexShrink:0}}>
          <div style={{fontSize:18,fontWeight:700}}>{title||""}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",padding:4}}><X size={22}/></button>
        </div>
        <div style={{padding:fullscreen?14:20,flex:1,overflowY:"auto"}}>{children}</div>
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
        <button key={k} onClick={()=>setActive(k)} style={{flex:"1 1 auto",padding:"8px 6px",borderRadius:12,border:"none",cursor:"pointer",background:active===k?"#0f172a":"#e2e8f0",color:active===k?"#fff":"#64748b",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{l}</button>
      ))}
    </div>
  );
}

// ─── Clock Panel ──────────────────────────────────────────────────────────────

function ClockPanel({isMobile,numPeriods,setNumPeriods,periodMins,setPeriodMins,currentPeriod,setCurrentPeriod,clock,setClock,timerOn,setTimerOn,periodLengthSecs,matchStarted,setMatchStarted,timerDeadline}) {
  const remaining=clock;
  const isLastPeriod=currentPeriod>=numPeriods;
  const periodLabel=PERIOD_LABELS[currentPeriod-1]||`P${currentPeriod}`;
  const clockColour=remaining<=60&&matchStarted?"#dc2626":"#0f172a";
  function handleStart(){
    if(!matchStarted){setClock(periodLengthSecs);setMatchStarted(true);}
    // On resume, clear old deadline so it recalculates from current clock
    if(timerDeadline) timerDeadline.current = null;
    setTimerOn(s=>!s);
  }
  function handleNextPeriod(){
    if(isLastPeriod)return;
    if(timerDeadline) timerDeadline.current = null;
    setCurrentPeriod(p=>p+1);setClock(periodLengthSecs);setTimerOn(false);
  }
  function handleReset(){
    if(timerDeadline) timerDeadline.current = null;
    setTimerOn(false);setMatchStarted(false);setCurrentPeriod(1);setClock(periodLengthSecs);
  }
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
            {[1,2,3,4].map(n=><button key={n} disabled={matchStarted} onClick={()=>setNumPeriods(n)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"1px solid",borderColor:numPeriods===n?"#0f172a":"#cbd5e1",background:numPeriods===n?"#0f172a":"#fff",color:numPeriods===n?"#fff":"#64748b",fontWeight:700,fontSize:13,cursor:matchStarted?"not-allowed":"pointer",opacity:matchStarted?0.6:1}}>{n}</button>)}
          </div>
        </div>
        <div style={{flex:"2 1 200px"}}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Mins per period</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[10,15,20,25,30,45].map(m=><button key={m} disabled={matchStarted} onClick={()=>setPeriodMins(m)} style={{flex:"1 0 auto",padding:"6px 4px",borderRadius:8,border:"1px solid",borderColor:periodMins===m?"#0f172a":"#cbd5e1",background:periodMins===m?"#0f172a":"#fff",color:periodMins===m?"#fff":"#64748b",fontWeight:700,fontSize:11,cursor:matchStarted?"not-allowed":"pointer",opacity:matchStarted?0.6:1}}>{m}</button>)}
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

// ─── Pre-Match Setup ──────────────────────────────────────────────────────────

function PreMatchSetup({players,onConfirm,isMobile}) {
  const [formation,setFormation]=useState("4-3-3");
  const slots=FORMATIONS[formation];
  const [lineup,setLineup]=useState(()=>Array(slots.length).fill(null));
  useEffect(()=>setLineup(Array(FORMATIONS[formation].length).fill(null)),[formation]);
  const assignedIds=lineup.filter(Boolean);
  const benchPlayers=players.filter(p=>!assignedIds.includes(p.id));
  function assignPlayer(slotIdx,playerId){setLineup(prev=>{const next=[...prev];const ex=next.findIndex(id=>id===playerId);if(ex!==-1)next[ex]=null;next[slotIdx]=playerId||null;return next;});}
  function autoFill(){const sorted=sortPlayersByNumber(players);setLineup(Array(slots.length).fill(null).map((_,i)=>sorted[i]?.id||null));}
  function clearAll(){setLineup(Array(slots.length).fill(null));}
  function handleConfirm(){
    const lineupData=lineup.map((playerId,idx)=>({playerId:playerId||null,slotIndex:idx,pos:slots[idx].pos,x:slots[idx].x,y:slots[idx].y}));
    onConfirm({formation,lineupData});
  }
  const filledCount=lineup.filter(Boolean).length;

  // Pitch element — shared between mobile and desktop
  const pitchEl = (
    <div style={{position:"relative",width:"100%",maxWidth:isMobile?320:380,aspectRatio:"0.72/1",background:"#047857",borderRadius:20,border:"3px solid #fff",boxShadow:"0 4px 24px rgba(0,0,0,0.15)",overflow:"hidden",margin:"0 auto"}}>
      <div style={{position:"absolute",inset:10,borderRadius:14,border:"2px solid rgba(255,255,255,0.5)"}}/>
      <div style={{position:"absolute",left:0,right:0,top:"50%",borderTop:"2px solid rgba(255,255,255,0.5)"}}/>
      <div style={{position:"absolute",left:"50%",top:"50%",width:70,height:70,transform:"translate(-50%,-50%)",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.5)"}}/>
      <div style={{position:"absolute",left:"50%",top:10,width:130,height:48,transform:"translateX(-50%)",border:"2px solid rgba(255,255,255,0.5)",borderTop:"none",borderRadius:"0 0 10px 10px"}}/>
      <div style={{position:"absolute",left:"50%",bottom:10,width:130,height:48,transform:"translateX(-50%)",border:"2px solid rgba(255,255,255,0.5)",borderBottom:"none",borderRadius:"10px 10px 0 0"}}/>
      {slots.map((slot,idx)=>{
        const pid=lineup[idx];const player=pid?players.find(p=>p.id===pid):null;
        const tokenSize=isMobile?50:44;
        return (
          <div key={idx} style={{position:"absolute",left:`${slot.x}%`,top:`${slot.y}%`,transform:"translate(-50%,-50%)",zIndex:2}}>
            <select value={pid||""} onChange={e=>assignPlayer(idx,e.target.value||null)} style={{opacity:0,position:"absolute",inset:0,width:"100%",height:"100%",cursor:"pointer",zIndex:3,fontSize:16}}>
              <option value="">— empty —</option>
              {player&&<option key={player.id} value={player.id}>{player.no}. {player.name}</option>}
              {benchPlayers.map(p=><option key={p.id} value={p.id}>{p.no}. {p.name} ({p.pos||"?"})</option>)}
            </select>
            <div style={{width:tokenSize,height:tokenSize,borderRadius:"50%",background:player?"#fff":"rgba(255,255,255,0.18)",border:player?"2px solid #0f172a":"2px dashed rgba(255,255,255,0.7)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",pointerEvents:"none"}}>
              {player?(
                <>
                  <span style={{fontSize:isMobile?13:11,fontWeight:800,lineHeight:1,color:"#0f172a"}}>{player.no}</span>
                  <span style={{fontSize:isMobile?8:7,lineHeight:1.2,color:"#64748b",maxWidth:tokenSize-8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.name.split(" ")[0]}</span>
                </>
              ):(
                <span style={{fontSize:isMobile?9:8,color:"rgba(255,255,255,0.9)",fontWeight:700,textAlign:"center",lineHeight:1.2,padding:"0 3px"}}>{slot.pos}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Starting XI slot list
  const startingXIEl = (
    <div style={{display:"grid",gap:4}}>
      {slots.map((slot,idx)=>{
        const pid=lineup[idx];const player=pid?players.find(p=>p.id===pid):null;
        return (
          <div key={idx} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",border:"1px solid",borderColor:player?"#bbf7d0":"#e2e8f0",borderRadius:10,background:player?"#f0fdf4":"#fafafa"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#64748b",width:36,flexShrink:0}}>{slot.pos}</span>
            {player?(
              <>
                <span style={{flex:1,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.no}. {player.name}</span>
                <button onClick={()=>assignPlayer(idx,null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:2,flexShrink:0}}><X size={12}/></button>
              </>
            ):(
              <span style={{flex:1,fontSize:12,color:"#94a3b8"}}>— tap slot on pitch —</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Bench list
  const benchEl = (
    <div style={{display:"grid",gap:5}}>
      {benchPlayers.length===0&&<div style={{fontSize:12,color:"#94a3b8",padding:10,textAlign:"center",border:"1px dashed #e2e8f0",borderRadius:10}}>All players assigned ✓</div>}
      {benchPlayers.map(p=>(
        <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:10,background:"#f8fafc"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0}}>{p.no}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{p.pos||"—"}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{display:"grid",gap:16}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:isMobile?20:22,fontWeight:800}}>Pre-Match Setup</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{filledCount}/{slots.length} players assigned</div>
        </div>
        <Button onClick={handleConfirm}><ClipboardCheck size={16}/> Start Match</Button>
      </div>

      {/* Formation picker */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Formation</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {FORMATION_NAMES.map(f=>(
            <button key={f} onClick={()=>setFormation(f)} style={{padding:"7px 12px",borderRadius:12,border:"1px solid",borderColor:formation===f?"#0f172a":"#cbd5e1",background:formation===f?"#0f172a":"#fff",color:formation===f?"#fff":"#64748b",fontWeight:700,fontSize:isMobile?12:13,cursor:"pointer"}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        /* ── MOBILE: single column stack ── */
        <>
          {/* Pitch — full width, big tokens */}
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>
              Tap a slot to assign a player
            </div>
            {pitchEl}
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"center"}}>
              <Button variant="outline" size="sm" onClick={autoFill}>Auto-fill</Button>
              <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
            </div>
          </div>

          {/* Starting XI */}
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Starting XI</div>
            {startingXIEl}
          </div>

          {/* Bench */}
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Bench ({benchPlayers.length})</div>
            {benchEl}
          </div>
        </>
      ) : (
        /* ── DESKTOP: two columns ── */
        <div style={{display:"grid",gap:16,gridTemplateColumns:"minmax(0,1fr) 260px"}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Assign — {filledCount}/{slots.length}</div>
            {pitchEl}
            <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"center"}}>
              <Button variant="outline" size="sm" onClick={autoFill}>Auto-fill</Button>
              <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
            </div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Bench ({benchPlayers.length})</div>
            <div style={{marginBottom:12,maxHeight:200,overflow:"auto"}}>{benchEl}</div>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Starting XI</div>
            <div style={{maxHeight:300,overflow:"auto"}}>{startingXIEl}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub Modal ────────────────────────────────────────────────────────────────
// Shows bench + previously-subbed-off players (who can come back on)

function SubModal({open,onClose,playerOnPitch,allPlayers,benchIds,events,onSub}) {
  if(!open||!playerOnPitch) return null;
  const player=allPlayers.find(p=>p.id===playerOnPitch);

  // Available = bench players (including those who were subbed off before)
  const available=allPlayers.filter(p=>benchIds.includes(p.id));

  // Sub-off count per bench player for colour coding
  function subOffCount(pid){return events.filter(e=>e.playerId===pid&&e.action==="sub_off").length;}
  function subOnCount(pid){return events.filter(e=>e.playerId===pid&&e.action==="sub_on").length;}

  return (
    <Modal open={open} onClose={onClose} title="Make Substitution" maxWidth={400}>
      <div style={{marginBottom:16,padding:12,border:"1px solid #fecaca",background:"#fef2f2",borderRadius:14}}>
        <div style={{fontSize:11,color:"#991b1b",fontWeight:700,marginBottom:3}}>🔴 Subbing off</div>
        <div style={{fontWeight:700,fontSize:15}}>{player?.no}. {player?.name}</div>
        <div style={{fontSize:12,color:"#64748b"}}>{player?.pos}</div>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8}}>🟢 Select replacement</div>
      {available.length===0&&<div style={{fontSize:13,color:"#94a3b8",textAlign:"center",padding:16}}>No available players</div>}
      <div style={{display:"grid",gap:7,maxHeight:360,overflow:"auto"}}>
        {available.map(p=>{
          const offs=subOffCount(p.id);
          const wasOn=subOnCount(p.id)>0;
          const dotColor=subOffColour(offs);
          return (
            <button key={p.id} onClick={()=>onSub(playerOnPitch,p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:14,background:"#f8fafc",cursor:"pointer",textAlign:"left",width:"100%"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{p.no}</div>
                {dotColor&&<div style={{position:"absolute",top:-3,right:-3,width:12,height:12,borderRadius:"50%",background:dotColor,border:"2px solid #fff"}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{p.pos||"—"}{wasOn?" · Was on pitch":""}</div>
              </div>
              {offs>0&&<Badge variant={offs===1?"success":offs===2?"warning":"danger"}>{offs}× off</Badge>}
              <ArrowLeftRight size={14} style={{color:"#64748b",flexShrink:0}}/>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ─── Extract Tab ──────────────────────────────────────────────────────────────

function ExtractTab({isMobile,imageUrl,imageDataUrl,ocrText,setOcrText,ocrError,setOcrError,manualText,setManualText,isExtracting,fileRef,handleImageUpload,runOCR,applyManualParse,loadDemoText,clearImage}) {
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
              {imageUrl&&<Button variant="danger" onClick={clearImage}><X size={16}/> Remove</Button>}
            </div>
            {ocrError&&<div style={{border:"1px solid #fde68a",background:"#fefce8",color:"#854d0e",borderRadius:16,padding:14,marginBottom:16,display:"flex",gap:8}}><AlertTriangle size={16} style={{marginTop:2,flexShrink:0}}/><span>{ocrError}</span></div>}
            <div style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:16,padding:12,minHeight:260,position:"relative"}}>
              {imageUrl?(
                <>
                  <img src={imageUrl} alt="Team sheet" style={{width:"100%",maxHeight:480,objectFit:"contain",borderRadius:12}}/>
                  <button onClick={clearImage} style={{position:"absolute",top:16,right:16,background:"rgba(15,23,42,0.7)",border:"none",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                    <X size={16}/>
                  </button>
                </>
              ):(
                <div style={{minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",border:"1px dashed #cbd5e1",borderRadius:12,color:"#64748b",flexDirection:"column",gap:8}}>
                  <Upload size={28} style={{opacity:0.3}}/>
                  <span>Upload a team sheet image to get started</span>
                </div>
              )}
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

// ─── Event Log List ───────────────────────────────────────────────────────────

function EventLogList({events,players}) {
  if(events.length===0) return <div style={{fontSize:13,color:"#64748b",padding:8}}>No events yet.</div>;
  return (
    <div style={{display:"grid",gap:5}}>
      {events.map(e=>{
        const p=players.find(x=>x.id===e.playerId);
        const a=ACTIONS.find(x=>x.key===e.action);
        const isSub=e.action==="sub_on"||e.action==="sub_off"||e.action?.startsWith("sub_reason");
        const w = typeof e.weight==="number" ? e.weight : getActionWeight(e.action, e.variant);
        const variantColor = e.variant==="good"?"#166534":e.variant==="bad"?"#991b1b":"#475569";
        const variantBg    = e.variant==="good"?"#dcfce7":e.variant==="bad"?"#fee2e2":"#f1f5f9";
        return (
          <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,border:"1px solid",borderColor:isSub?"#bfdbfe":"#e2e8f0",background:isSub?"#eff6ff":"#fff",borderRadius:11,padding:"7px 11px"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a?.icon} {p?.no}. {p?.name}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{a?.label} · P{e.period||1} · {formatClock(e.t)}</div>
            </div>
            {!isSub&&w!==0&&(
              <span style={{fontSize:10,fontWeight:800,color:variantColor,background:variantBg,border:`1px solid ${variantBg}`,borderRadius:6,padding:"2px 6px",flexShrink:0}}>
                {w>0?`+${w}`:w}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Bench Panel ─────────────────────────────────────────────────────────────

function BenchPanel({players,benchIds,events}) {
  const bench=players.filter(p=>benchIds.includes(p.id));
  return (
    <Card>
      <CardHeader><div style={{fontSize:17,fontWeight:700}}>Bench ({bench.length})</div></CardHeader>
      <CardContent>
        {bench.length===0&&<div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:10}}>Bench is empty</div>}
        <div style={{display:"grid",gap:5}}>
          {bench.map(p=>{
            const offs=events.filter(e=>e.playerId===p.id&&e.action==="sub_off").length;
            const ons=events.filter(e=>e.playerId===p.id&&e.action==="sub_on").length;
            const score=scorePlayer(events,p.id);
            const dotColor=subOffColour(offs);
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",border:"1px solid",borderColor:ons>0?"#bbf7d0":"#e2e8f0",borderRadius:11,background:ons>0?"#f0fdf4":"#f8fafc"}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:dotColor||"#cbd5e1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11}}>{p.no}</div>
                  {offs>0&&<div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:dotColor,border:"2px solid #fff"}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#64748b"}}>{p.pos||"—"}{offs>0?` · ${offs}× off`:""}{ons>0?" · Played":""}</div>
                </div>
                {score!==0&&<Badge variant={score>0?"success":"danger"}>{score>0?`+${score}`:score}</Badge>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Leaderboard with live pitch time ────────────────────────────────────────

function LeaderboardPanel({leaderboard,events,periodLengthSecs,currentPeriod,clock,timerOn,lineupData}) {
  // Live tick so pitch time updates every second
  const [tick,setTick]=useState(0);
  useEffect(()=>{
    if(!timerOn) return;
    const id=setInterval(()=>setTick(t=>t+1),1000);
    return ()=>clearInterval(id);
  },[timerOn]);

  // nowAbs = total seconds elapsed across all periods so far
  const elapsedInPeriod = periodLengthSecs - clock;
  const nowAbs = (currentPeriod-1)*periodLengthSecs + elapsedInPeriod;
  const intervals = useMemo(()=>buildPitchIntervals(events,periodLengthSecs,lineupData),[events,periodLengthSecs,lineupData,tick]);

  return (
    <Card>
      <CardHeader><div style={{fontSize:17,fontWeight:700}}>Leaderboard</div></CardHeader>
      <CardContent>
        <div style={{display:"grid",gap:6}}>
          {leaderboard.slice(0,10).map((p,idx)=>{
            const playerIntervals=intervals.get(p.id)||[];
            const pitchSecs=calcPitchSeconds(playerIntervals,nowAbs);
            const isOnPitch=playerIntervals.some(seg=>seg.off===null);
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:13,padding:"9px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{idx+1}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{p.no}. {p.name}</div>
                    <div style={{fontSize:10,color:"#64748b",display:"flex",alignItems:"center",gap:4}}>
                      <span>{p.pos}</span>
                      <span>·</span>
                      <span style={{color:isOnPitch?"#16a34a":"#64748b",fontWeight:isOnPitch?700:400}}>
                        {isOnPitch?"▶ ":""}{formatClock(pitchSecs)}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={p.score>0?"success":p.score<0?"danger":"default"}>{p.score>0?`+${p.score}`:p.score}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pitch Tab ────────────────────────────────────────────────────────────────

function PitchTab({
  isMobile,players,events,leaderboard,
  selectedPlayerId,setSelectedPlayerId,
  logAction,undoLastEvent,resetMatch,
  formation,lineupData,benchIds,
  onMakeSub,
  currentPeriod,periodLengthSecs,clock,timerOn,
}) {
  const [sub,setSub]=useState("pitch");
  const [subTarget,setSubTarget]=useState(null);
  const disabled=!selectedPlayerId;

  const pitchPlayers=useMemo(()=>{
    if(!lineupData) return [];
    return lineupData.filter(s=>s.playerId).map(s=>{
      const p=players.find(pl=>pl.id===s.playerId);
      if(!p) return null;
      return{...p,x:s.x,y:s.y,slotPos:s.pos};
    }).filter(Boolean);
  },[lineupData,players]);

  return (
    <>
      <div style={{display:"grid",gap:16,gridTemplateColumns:isMobile?"1fr":"minmax(0,1.15fr) minmax(300px,0.85fr)"}}>
        <Card>
          <CardHeader>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:20,fontWeight:700}}>Pitch</div>
                {formation&&<Badge>{formation}</Badge>}
              </div>
              <div style={{display:"flex",gap:7}}>
                <Button variant="outline" size="sm" onClick={undoLastEvent}><RotateCcw size={13}/> Undo</Button>
                <Button variant="outline" size="sm" onClick={resetMatch}>Clear</Button>
              </div>
            </div>
            {isMobile&&<div style={{marginTop:10}}><SubTabs tabs={[["pitch","⚽ Pitch"],["bench","🔄 Bench"],["board","🏆 Board"],["log","📋 Log"]]} active={sub} setActive={setSub}/></div>}
          </CardHeader>

          <CardContent>
            {(!isMobile||sub==="pitch")&&(
              <>
                {/* Pitch */}
                <div style={{position:"relative",margin:"0 auto",width:"100%",maxWidth:isMobile?340:420,aspectRatio:"0.72/1",overflow:"hidden",borderRadius:28,border:"4px solid #fff",background:"#047857",boxShadow:"inset 0 0 20px rgba(0,0,0,0.12)"}}>
                  <div style={{position:"absolute",inset:12,borderRadius:22,border:"2px solid rgba(255,255,255,0.8)"}}/>
                  <div style={{position:"absolute",left:"50%",top:"50%",width:96,height:96,transform:"translate(-50%,-50%)",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.8)"}}/>
                  <div style={{position:"absolute",left:0,right:0,top:"50%",borderTop:"2px solid rgba(255,255,255,0.8)"}}/>
                  <div style={{position:"absolute",left:"50%",top:12,width:160,height:64,transform:"translateX(-50%)",borderBottom:"2px solid rgba(255,255,255,0.8)",borderLeft:"2px solid rgba(255,255,255,0.8)",borderRight:"2px solid rgba(255,255,255,0.8)",borderBottomLeftRadius:16,borderBottomRightRadius:16}}/>
                  <div style={{position:"absolute",left:"50%",bottom:12,width:160,height:64,transform:"translateX(-50%)",borderTop:"2px solid rgba(255,255,255,0.8)",borderLeft:"2px solid rgba(255,255,255,0.8)",borderRight:"2px solid rgba(255,255,255,0.8)",borderTopLeftRadius:16,borderTopRightRadius:16}}/>

                  {pitchPlayers.map(p=>{
                    const score=scorePlayer(events,p.id);
                    const sel=selectedPlayerId===p.id;
                    const subOffs=events.filter(e=>e.playerId===p.id&&e.action==="sub_off").length;
                    const subOns=events.filter(e=>e.playerId===p.id&&e.action==="sub_on").length;
                    const dotColor=subOffColour(subOffs);
                    const tokenSize=isMobile?46:54;
                    return (
                      // Outer div handles position only — no transform conflict with Framer
                      <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:"translate(-50%,-50%)",zIndex:sel?10:5}}>
                        <motion.div whileTap={{scale:0.92}} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                          <div onClick={()=>setSelectedPlayerId(p.id)}
                            style={{width:tokenSize,height:tokenSize,borderRadius:"50%",border:sel?"3px solid #fcd34d":"2px solid #fff",background:sel?"#fcd34d":"#fff",color:"#0f172a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:sel?"0 0 0 3px rgba(252,211,77,0.4),0 8px 18px rgba(0,0,0,0.2)":"0 4px 12px rgba(0,0,0,0.18)",cursor:"pointer",position:"relative"}}>
                            {dotColor&&<div style={{position:"absolute",top:-4,right:-4,width:13,height:13,borderRadius:"50%",background:dotColor,border:"2px solid #fff"}}/>}
                            {subOns>0&&<div style={{position:"absolute",top:-4,left:-4,width:13,height:13,borderRadius:"50%",background:"#16a34a",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:7,color:"#fff",fontWeight:700}}>{subOns}</span></div>}
                            <span style={{fontSize:isMobile?11:13,fontWeight:800,lineHeight:1}}>{p.no}</span>
                            <span style={{maxWidth:isMobile?34:42,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:7,lineHeight:1.2,color:"#475569"}}>{p.name.split(" ")[0].slice(0,8)}</span>
                            <span style={{fontSize:7,lineHeight:1,color:"#94a3b8"}}>{p.slotPos}</span>
                            {score!==0&&<span style={{fontSize:7,lineHeight:1,color:score>0?"#166534":"#991b1b",fontWeight:700}}>{score>0?`+${score}`:score}</span>}
                          </div>
                          {sel&&<button onClick={e=>{e.stopPropagation();setSubTarget(p.id);}} style={{marginTop:4,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"2px 7px",fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>↓ Sub</button>}
                        </motion.div>
                      </div>
                    );
                  })}
                  {pitchPlayers.length===0&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.8)",fontSize:12,fontWeight:600,textAlign:"center",padding:20}}>No lineup set — click Setup</div>}
                </div>

                {/* ── Action buttons — grouped, 3-variant per skill ── */}
                <div style={{marginTop:12}}>
                  {!selectedPlayerId&&(
                    <div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:"#94a3b8",marginBottom:8}}>Tap a player to enable actions</div>
                  )}

                  {/* Column headers */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 40px 40px 40px",gap:3,marginBottom:4,paddingLeft:2}}>
                    <div/>
                    <div style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#166534"}}>G</div>
                    <div style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#991b1b"}}>B</div>
                    <div style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#475569"}}>N</div>
                  </div>

                  {SKILL_GROUPS.map(group=>{
                    const skills=SKILL_BUTTONS.filter(b=>ACTIONS.find(a=>a.key===b.key)?.group===group.id);
                    if(!skills.length) return null;
                    return (
                      <div key={group.id} style={{marginBottom:10}}>
                        <div style={{fontSize:10,fontWeight:700,color:group.color,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5,paddingLeft:2}}>{group.label}</div>
                        {skills.map(skill=>{
                          const action=ACTIONS.find(a=>a.key===skill.key);
                          const Icon=skill.icon;
                          const hasGood   = action?.good    !== 0;
                          const hasBad    = action?.bad     !== 0;
                          const hasNeutral= action?.neutral !== 0;
                          return (
                            <div key={skill.key} style={{display:"grid",gridTemplateColumns:"1fr 40px 40px 40px",gap:3,marginBottom:3,alignItems:"center"}}>
                              {/* Skill label */}
                              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,color:"#0f172a",paddingLeft:2}}>
                                <Icon size={12} strokeWidth={2} style={{color:group.color,flexShrink:0}}/>
                                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{skill.label}</span>
                              </div>
                              {/* Good button */}
                              <button
                                disabled={!selectedPlayerId||!hasGood}
                                onClick={()=>logAction(skill.key,"good")}
                                style={{height:32,borderRadius:8,border:"1px solid",borderColor:selectedPlayerId&&hasGood?"#bbf7d0":"#e2e8f0",background:selectedPlayerId&&hasGood?"#f0fdf4":"#f8fafc",color:selectedPlayerId&&hasGood?"#166534":"#cbd5e1",fontWeight:700,fontSize:10,cursor:selectedPlayerId&&hasGood?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:2}}
                              >
                                {hasGood?<>+{action.good}</>:<Minus size={10}/>}
                              </button>
                              {/* Bad button */}
                              <button
                                disabled={!selectedPlayerId||!hasBad}
                                onClick={()=>logAction(skill.key,"bad")}
                                style={{height:32,borderRadius:8,border:"1px solid",borderColor:selectedPlayerId&&hasBad?"#fecaca":"#e2e8f0",background:selectedPlayerId&&hasBad?"#fef2f2":"#f8fafc",color:selectedPlayerId&&hasBad?"#991b1b":"#cbd5e1",fontWeight:700,fontSize:10,cursor:selectedPlayerId&&hasBad?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:2}}
                              >
                                {hasBad?<>{action.bad}</>:<Minus size={10}/>}
                              </button>
                              {/* Neutral button */}
                              <button
                                disabled={!selectedPlayerId||!hasNeutral}
                                onClick={()=>logAction(skill.key,"neutral")}
                                style={{height:32,borderRadius:8,border:"1px solid",borderColor:selectedPlayerId&&hasNeutral?"#e2e8f0":"#e2e8f0",background:selectedPlayerId&&hasNeutral?"#f8fafc":"#f8fafc",color:selectedPlayerId&&hasNeutral?(action.neutral>0?"#475569":action.neutral<0?"#991b1b":"#475569"):"#cbd5e1",fontWeight:700,fontSize:10,cursor:selectedPlayerId&&hasNeutral?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:2}}
                              >
                                {hasNeutral?<>{action.neutral>0?"+":""}{action.neutral}</>:<Minus size={10}/>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Sub reason row */}
                  <div style={{marginTop:6}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>🔄 Sub Reason</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                      {SUB_REASON_BUTTONS.map(b=>{
                        const action=ACTIONS.find(a=>a.key===b.key);
                        const Icon=b.icon;
                        return (
                          <button key={b.key} disabled={!selectedPlayerId} onClick={()=>logAction(b.key,"neutral")}
                            style={{padding:"6px 2px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:selectedPlayerId?"#475569":"#cbd5e1",cursor:selectedPlayerId?"pointer":"not-allowed",display:"flex",flexDirection:"column",alignItems:"center",gap:2,opacity:selectedPlayerId?1:0.5}}>
                            <Icon size={13} strokeWidth={2}/>
                            <span style={{fontSize:9,fontWeight:600}}>{b.label}</span>
                            <span style={{fontSize:8,color:"#94a3b8"}}>{action?.neutral>0?`+${action.neutral}`:action?.neutral}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {isMobile&&sub==="bench"&&<BenchPanel players={players} benchIds={benchIds} events={events}/>}
            {isMobile&&sub==="board"&&(
              <LeaderboardPanel
                leaderboard={leaderboard} events={events}
                periodLengthSecs={periodLengthSecs} currentPeriod={currentPeriod}
                clock={clock} timerOn={timerOn} lineupData={lineupData}
              />
            )}
            {isMobile&&sub==="log"&&<EventLogList events={events} players={players}/>}
          </CardContent>
        </Card>

        {/* Desktop right column */}
        {!isMobile&&(
          <div style={{display:"grid",gap:14,alignContent:"start"}}>
            <BenchPanel players={players} benchIds={benchIds} events={events}/>
            <LeaderboardPanel
              leaderboard={leaderboard} events={events}
              periodLengthSecs={periodLengthSecs} currentPeriod={currentPeriod}
              clock={clock} timerOn={timerOn} lineupData={lineupData}
            />
            <Card>
              <CardHeader><div style={{fontSize:17,fontWeight:700}}>Event Log</div></CardHeader>
              <CardContent><div style={{maxHeight:280,overflow:"auto"}}><EventLogList events={events} players={players}/></div></CardContent>
            </Card>
          </div>
        )}
      </div>

      <SubModal
        open={!!subTarget}
        onClose={()=>setSubTarget(null)}
        playerOnPitch={subTarget}
        allPlayers={players}
        benchIds={benchIds}
        events={events}
        onSub={(offId,onId)=>{onMakeSub(offId,onId);setSubTarget(null);setSelectedPlayerId(onId);}}
      />
    </>
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
            {db.length===0&&<div style={{border:"1px dashed #cbd5e1",borderRadius:16,padding:32,textAlign:"center",color:"#64748b"}}>Save a match to see it here.</div>}
            {db.map(m=>(
              <div key={m.id} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:18,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:17,fontWeight:700}}>{m.matchName||"Untitled"}</div>
                    <div style={{fontSize:13,color:"#64748b"}}>{m.opponent?`vs ${m.opponent}`:"No opponent"} · {new Date(m.playedAt).toLocaleString()}</div>
                    {m.formation&&<div style={{marginTop:4}}><Badge>{m.formation}</Badge></div>}
                  </div>
                  <Badge>{m.numPeriods}×{m.periodMins}min</Badge>
                </div>
                <div style={{marginTop:14,display:"grid",gap:8,gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))"}}>
                  {m.summary.slice(0,9).map(p=>(
                    <div key={p.playerId} style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:14,padding:10}}>
                      <div style={{fontWeight:700,fontSize:12}}>{p.no}. {p.name}</div>
                      <div style={{fontSize:10,color:"#64748b"}}>{p.pos}</div>
                      <div style={{marginTop:5,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12}}>Score</span><Badge>{p.score}</Badge></div>
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
            {tests.passed===tests.total?<Badge variant="success"><CheckCircle2 size={12}/> {tests.passed}/{tests.total} passed</Badge>:<Badge variant="danger"><AlertTriangle size={12}/> {tests.passed}/{tests.total} passed</Badge>}
            <Button variant="outline" size="sm" onClick={()=>setTests(runParserTests())}>Run Tests</Button>
          </div>
          <div style={{display:"grid",gap:7}}>
            {tests.tests.map(t=>(
              <div key={t.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:13,padding:11}}>
                <span style={{fontSize:12}}>{t.name}</span>
                {t.pass?<Badge variant="success">Pass</Badge>:<Badge variant="danger">Fail</Badge>}
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
  const fileRef=useRef(null);

  const [players,          setPlayers]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [db,               setDb]               = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [matchName,        setMatchName]        = useState("U CP-Showcase");
  const [opponent,         setOpponent]         = useState("");

  const [numPeriods,    setNumPeriods]    = useState(2);
  const [periodMins,    setPeriodMins]    = useState(20);
  const [currentPeriod, setCurrentPeriod]= useState(1);
  const [clock,         setClock]        = useState(20*60);
  const [timerOn,       setTimerOn]      = useState(false);
  const [matchStarted,  setMatchStarted] = useState(false);
  const periodLengthSecs=periodMins*60;

  const [formation,  setFormation]  = useState("4-3-3");
  const [lineupData, setLineupData] = useState(null);
  const [benchIds,   setBenchIds]   = useState([]);
  const [showSetup,  setShowSetup]  = useState(false);

  const [manualText,   setManualText]   = useState(DEMO_OCR_TEXT);
  const [imageUrl,     setImageUrl]     = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [ocrText,      setOcrText]      = useState("");
  const [ocrError,     setOcrError]     = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [activeTab,     setActiveTab]     = useState("extract");
  const [tests,         setTests]         = useState(runParserTests);
  const [isMobile,      setIsMobile]      = useState(()=>typeof window!=="undefined"?window.innerWidth<=768:false);

  useEffect(()=>{if(!matchStarted)setClock(periodLengthSecs);},[periodMins,matchStarted,periodLengthSecs]);

  // Wall-clock timer — survives mobile screen sleep.
  // timerDeadline = the Date.now() ms when the clock should hit 0.
  const timerDeadline = useRef(null);

  useEffect(()=>{
    if(!timerOn){
      timerDeadline.current = null;
      return;
    }
    if(clock<=0){setTimerOn(false);return;}

    // On first start / resume: set deadline from current remaining seconds
    if(timerDeadline.current === null){
      timerDeadline.current = Date.now() + clock * 1000;
    }

    const tick = ()=>{
      const remaining = Math.round((timerDeadline.current - Date.now()) / 1000);
      if(remaining <= 0){
        setClock(0);
        setTimerOn(false);
        timerDeadline.current = null;
      } else {
        setClock(remaining);
      }
    };

    // Also recalculate immediately when screen wakes (visibilitychange)
    const onVisible = ()=>{ if(!document.hidden && timerOn) tick(); };
    document.addEventListener("visibilitychange", onVisible);

    const id = setInterval(tick, 500); // 500ms so we never miss a second
    return()=>{
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  },[timerOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // When pausing, clear deadline so resume recalculates from current clock
  const prevTimerOn = useRef(timerOn);
  useEffect(()=>{
    if(prevTimerOn.current && !timerOn){
      timerDeadline.current = null; // paused — deadline reset, clock value preserved
    }
    prevTimerOn.current = timerOn;
  },[timerOn]);

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

  const selectedPlayer=players.find(p=>p.id===selectedPlayerId)||null;
  const leaderboard=useMemo(()=>[...players].map(p=>({...p,score:scorePlayer(events,p.id),counts:getActionCounts(events,p.id)})).sort((a,b)=>{
    if(b.score!==a.score)return b.score-a.score;
    const an=parseInt(a.no,10),bn=parseInt(b.no,10);
    if(!isNaN(an)&&!isNaN(bn))return an-bn;return String(a.name).localeCompare(String(b.name));
  }),[players,events]);

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
  function clearImage(){
    setImageUrl("");setImageDataUrl("");setOcrText("");setOcrError("");
    if(fileRef.current) fileRef.current.value="";
  }
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
    }catch(err){
      console.error(err);
      const msg=err.message||"OCR failed";
      setOcrError(`${msg} — Tip: copy the text from Google Lens into the Manual Clean-up box below and click Parse Text.`);
    }
    finally{setIsExtracting(false);}
  }
  function applyManualParse(src=manualText){
    const jp=parsePlayersJson(src);if(jp.length){setPlayers(sortPlayersByNumber(jp));setActiveTab("players");setOcrError("");return;}
    const ep=parseOCRText(src);if(ep.length){setPlayers(sortPlayersByNumber(ep));setActiveTab("players");setOcrError("");return;}
    setOcrError("No players could be parsed.");
  }

  const addBlankPlayer=()=>setPlayers(prev=>sortPlayersByNumber([...prev,{id:makeId(),no:String(prev.length+1),name:"New Player",pos:"Pos"}]));
  const updatePlayer=(id,patch)=>setPlayers(prev=>sortPlayersByNumber(prev.map(p=>p.id===id?{...p,...patch}:p)));
  const removePlayer=(id)=>{setPlayers(p=>p.filter(x=>x.id!==id));setEvents(e=>e.filter(x=>x.playerId!==id));if(selectedPlayerId===id)setSelectedPlayerId(null);};

  function handleLineupConfirm({formation:f,lineupData:ld}){
    setFormation(f);setLineupData(ld);
    const startIds=new Set(ld.map(s=>s.playerId).filter(Boolean));
    setBenchIds(players.filter(p=>!startIds.has(p.id)).map(p=>p.id));
    setShowSetup(false);setActiveTab("pitch");
  }

  function handleMakeSub(offId,onId){
    const elapsed=periodLengthSecs-clock;
    setEvents(prev=>[
      {id:makeId(),t:elapsed,period:currentPeriod,playerId:offId,action:"sub_off",ts:new Date().toISOString()},
      {id:makeId(),t:elapsed,period:currentPeriod,playerId:onId, action:"sub_on", ts:new Date().toISOString()},
      ...prev,
    ]);
    // Swap slot: replace offId with onId in lineupData
    setLineupData(prev=>prev.map(slot=>slot.playerId===offId?{...slot,playerId:onId}:slot));
    // Bench: remove onId (coming on), add offId (going off) — both directions
    setBenchIds(prev=>[...prev.filter(id=>id!==onId),offId]);
  }

  const logAction=(key, variant="good")=>{
    if(!selectedPlayerId)return;
    const elapsed=periodLengthSecs-clock;
    const weight=getActionWeight(key, variant);
    setEvents(prev=>[{id:makeId(),t:elapsed,period:currentPeriod,playerId:selectedPlayerId,action:key,variant,weight,ts:new Date().toISOString()},...prev]);
  };
  const undoLastEvent=()=>setEvents(prev=>prev.slice(1));
  const resetMatch=()=>{
    setEvents([]);setTimerOn(false);setMatchStarted(false);
    setCurrentPeriod(1);setClock(periodLengthSecs);setSelectedPlayerId(null);
    if(lineupData){const startIds=new Set(lineupData.map(s=>s.playerId).filter(Boolean));setBenchIds(players.filter(p=>!startIds.has(p.id)).map(p=>p.id));}
  };
  const finishMatch=()=>{
    const summary=leaderboard.map(({id:playerId,no,name,pos,score,counts})=>({playerId,no,name,pos,score,counts}));
    setDb(prev=>[{id:makeId(),matchName,opponent,numPeriods,periodMins,formation,playedAt:new Date().toISOString(),summary,events},...prev]);
  };

  function exportJSON(){const blob=new Blob([JSON.stringify({players,events,db,matchName,opponent,numPeriods,periodMins,formation,lineupData},null,2)],{type:"application/json"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`scout-${matchName.replace(/\s+/g,"-").toLowerCase()}.json`});a.click();URL.revokeObjectURL(a.href);}
  function exportCSV(){
    const rows=[["Period","Time","No","Player","Pos","Action","Variant","Score"],...events.map(e=>{
      const p=players.find(x=>x.id===e.playerId),a=ACTIONS.find(x=>x.key===e.action);
      const w=typeof e.weight==="number"?e.weight:getActionWeight(e.action,e.variant);
      return[e.period||1,formatClock(e.t),p?.no||"",p?.name||"",p?.pos||"",a?.label||e.action,e.variant||"",w];
    })];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`events-${matchName.replace(/\s+/g,"-").toLowerCase()}.csv`});a.click();URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",paddingTop:16,paddingLeft:16,paddingRight:16,paddingBottom:isMobile?80:16,color:"#0f172a",fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:1320,margin:"0 auto",display:"grid",gap:16}}>

        {/* Header */}
        <div style={{display:"grid",gap:16,gridTemplateColumns:isMobile?"1fr":"minmax(0,1.15fr) minmax(320px,0.85fr)"}}>
          <Card>
            <CardHeader>
              <div style={{display:"flex",gap:12,justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:isMobile?22:32,fontWeight:800,marginBottom:4}}>Scout Match Flow</div>
                  {!isMobile&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                    {formation&&lineupData?<Badge variant="success">▶ {formation}</Badge>:<Badge variant="danger">No lineup set</Badge>}
                  </div>}
                </div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  <Button variant="outline" size="sm" onClick={()=>setShowSetup(true)}><ClipboardCheck size={13}/> {lineupData?"Edit Lineup":"Setup"}</Button>
                  <Button variant="outline" size="sm" onClick={exportJSON}><Download size={13}/> JSON</Button>
                  <Button variant="outline" size="sm" onClick={exportCSV}><Download size={13}/> CSV</Button>
                  <Button size="sm" onClick={finishMatch}><Save size={13}/> Save</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{display:"grid",gap:12,gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fit,minmax(200px,1fr))"}}>
                <Input value={matchName} onChange={e=>setMatchName(e.target.value)} placeholder="Match name"/>
                <Input value={opponent}  onChange={e=>setOpponent(e.target.value)}  placeholder="Opponent"/>
                <ClockPanel isMobile={isMobile} numPeriods={numPeriods} setNumPeriods={setNumPeriods} periodMins={periodMins} setPeriodMins={setPeriodMins} currentPeriod={currentPeriod} setCurrentPeriod={setCurrentPeriod} clock={clock} setClock={setClock} timerOn={timerOn} setTimerOn={setTimerOn} periodLengthSecs={periodLengthSecs} matchStarted={matchStarted} setMatchStarted={setMatchStarted} timerDeadline={timerDeadline}/>
              </div>
            </CardContent>
          </Card>

          {!isMobile&&(
            <Card>
              <CardHeader><div style={{fontSize:20,fontWeight:700}}>Selected Player</div></CardHeader>
              <CardContent>
                {selectedPlayer?(
                  <div style={{display:"grid",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:46,height:46,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,flexShrink:0}}>{selectedPlayer.no}</div>
                      <div><div style={{fontWeight:700}}>{selectedPlayer.name}</div><div style={{fontSize:13,color:"#64748b"}}>{selectedPlayer.pos||"—"}</div></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
                      {ACTIONS.filter(a=>!["sub_on","sub_off"].includes(a.key)).map(a=>(
                        <div key={a.key} style={{border:"1px solid #e2e8f0",borderRadius:9,background:"#f8fafc",padding:4,textAlign:"center"}}>
                          <div style={{fontSize:12}}>{a.icon}</div>
                          <div style={{fontSize:9,color:"#64748b",lineHeight:1.2}}>{a.label}</div>
                          <div style={{fontWeight:700,fontSize:11}}>{events.filter(e=>e.playerId===selectedPlayer.id&&e.action===a.key).length}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ):(
                  <div style={{border:"1px dashed #cbd5e1",borderRadius:16,padding:28,textAlign:"center",color:"#64748b",fontSize:13}}>Tap a player on the pitch.</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop tabs */}
        {!isMobile&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[{key:"extract",label:"1. Extract"},{key:"players",label:"2. Players"},{key:"pitch",label:"3. Pitch"},{key:"database",label:"4. Database"}].map(t=>(
              <Button key={t.key} variant={activeTab===t.key?"primary":"outline"} onClick={()=>setActiveTab(t.key)}>{t.label}</Button>
            ))}
          </div>
        )}

        {activeTab==="extract" &&<ExtractTab isMobile={isMobile} imageUrl={imageUrl} imageDataUrl={imageDataUrl} ocrText={ocrText} setOcrText={setOcrText} ocrError={ocrError} setOcrError={setOcrError} manualText={manualText} setManualText={setManualText} isExtracting={isExtracting} fileRef={fileRef} handleImageUpload={handleImageUpload} runOCR={runOCR} applyManualParse={applyManualParse} loadDemoText={()=>{setManualText(DEMO_OCR_TEXT);setOcrError("");applyManualParse(DEMO_OCR_TEXT);}} clearImage={clearImage}/>}
        {activeTab==="players" &&<PlayersTab players={players} addBlankPlayer={addBlankPlayer} updatePlayer={updatePlayer} removePlayer={removePlayer} setEditingPlayer={setEditingPlayer}/>}
        {activeTab==="pitch"   &&<PitchTab isMobile={isMobile} players={players} events={events} leaderboard={leaderboard} selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId} logAction={logAction} undoLastEvent={undoLastEvent} resetMatch={resetMatch} formation={formation} lineupData={lineupData} benchIds={benchIds} onMakeSub={handleMakeSub} currentPeriod={currentPeriod} periodLengthSecs={periodLengthSecs} clock={clock} timerOn={timerOn}/>}
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

      <Modal open={showSetup} onClose={()=>setShowSetup(false)} title="" maxWidth={isMobile?9999:900} fullscreen={isMobile}>
        <PreMatchSetup players={players} onConfirm={handleLineupConfirm} isMobile={isMobile}/>
      </Modal>
    </div>
  );
}