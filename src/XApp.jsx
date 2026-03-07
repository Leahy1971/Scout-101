import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  ScanText,
  Users,
  Plus,
  Trash2,
  Download,
  Save,
  RotateCcw,
  Goal,
  Zap,
  Brain,
  Shield,
  Target,
  SquarePen,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

const ACTIONS = [
  { key: "goal", label: "Goal", icon: "⚽", weight: 5 },
  { key: "assist", label: "Assist", icon: "🎯", weight: 4 },
  { key: "pace", label: "Pace", icon: "⚡", weight: 2 },
  { key: "iq", label: "Game IQ", icon: "🧠", weight: 2 },
  { key: "physical", label: "Physical", icon: "💪", weight: 2 },
  { key: "duel", label: "Duel Won", icon: "🛡️", weight: 2 },
  { key: "weak", label: "Weak", icon: "❌", weight: -2 },
];

const DEFAULT_FORMATION = {
  GK: [{ x: 50, y: 89 }],
  RB: [{ x: 82, y: 72 }],
  CB: [{ x: 58, y: 73 }, { x: 42, y: 73 }],
  LB: [{ x: 18, y: 72 }],
  CDM: [{ x: 50, y: 58 }],
  CM: [{ x: 35, y: 48 }, { x: 65, y: 48 }],
  CAM: [{ x: 50, y: 38 }],
  RW: [{ x: 80, y: 25 }],
  LW: [{ x: 20, y: 25 }],
  CF: [{ x: 50, y: 15 }],
  ST: [{ x: 50, y: 15 }],
  W: [{ x: 80, y: 25 }, { x: 20, y: 25 }],
  "LW/RW": [{ x: 80, y: 25 }, { x: 20, y: 25 }],
  "CDM/LB": [{ x: 18, y: 72 }, { x: 50, y: 58 }],
  "CB/RB": [{ x: 82, y: 72 }, { x: 58, y: 73 }, { x: 42, y: 73 }],
  "LW/LB": [{ x: 20, y: 25 }, { x: 18, y: 72 }],
};

const DEMO_OCR_TEXT = `PlayerA 
CM`;

const STORAGE_KEY = "ray-scout-pitch-app-vite-v1";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function cleanLine(line) {
  return String(line || "")
    .replace(/[✓✔]/g, "")
    .replace(/CONFIRMED/gi, "")
    .replace(/U\d+/gi, "")
    .replace(/AW\d+/gi, "")
    .replace(/\b\d{1,2}\.\d{1,2}\b/g, "")
    .replace(/[|,:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyPosition(line) {
  return /^(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB)(\/(GK|RB|LB|CB|CM|CDM|CAM|CF|ST|RW|LW|W|RWB|LWB))*$/i.test(
    String(line || "").trim()
  );
}

function isLikelyName(line) {
  const cleaned = cleanLine(line);
  if (!cleaned) return false;
  if (isLikelyPosition(cleaned)) return false;
  if (/^(CONFIRMED|SELECTED|SQUAD)$/i.test(cleaned)) return false;
  if (/^[A-Z]{1,3}\d*$/i.test(cleaned)) return false;
  const parts = cleaned.split(" ").filter(Boolean);
  return parts.length >= 2 && parts.every((part) => /[A-Za-z'’-]/.test(part));
}

function normalisePosition(line) {
  const cleaned = cleanLine(line).toUpperCase();
  if (isLikelyPosition(cleaned)) return cleaned;
  return "";
}

function dedupePlayers(players) {
  const seen = new Set();
  const out = [];
  for (const p of players) {
    const key = `${p.name}`.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function parseOCRText(text) {
  const rawLines = String(text || "")
    .split(/\n+/)
    .map((l) => cleanLine(l))
    .filter(Boolean)
    .filter(
      (l) =>
        !/^(ant|wayne|barry|pete|jim birch|george dolby|dean bar|dean stanhop|lloyd gro)$/i.test(
          l
        )
    );

  const players = [];

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    const next = rawLines[i + 1] || "";
    const next2 = rawLines[i + 2] || "";

    if (isLikelyName(line) && isLikelyPosition(next)) {
      players.push({
        id: makeId(),
        no: String(players.length + 1),
        name: line,
        pos: normalisePosition(next),
      });
      i += 1;
      continue;
    }

    if (isLikelyName(line) && /^(CONFIRMED|SELECTED)$/i.test(next) && isLikelyPosition(next2)) {
      players.push({
        id: makeId(),
        no: String(players.length + 1),
        name: line,
        pos: normalisePosition(next2),
      });
      i += 2;
      continue;
    }

    if (isLikelyName(line)) {
      players.push({
        id: makeId(),
        no: String(players.length + 1),
        name: line,
        pos: "",
      });
    }
  }

  return dedupePlayers(players).slice(0, 25);
}

function getPositionSlot(players) {
  const grouped = players.reduce((acc, player) => {
    const posKey = (player.pos || "CM").toUpperCase().trim();
    if (!acc[posKey]) acc[posKey] = [];
    acc[posKey].push(player);
    return acc;
  }, {});

  const placed = [];

  Object.entries(grouped).forEach(([posKey, group]) => {
    const primary = posKey.split("/")[0];
    const baseSlots =
      DEFAULT_FORMATION[posKey] ||
      DEFAULT_FORMATION[primary] ||
      [{ x: 50, y: 50 }];

    if (group.length <= baseSlots.length) {
      group.forEach((player, index) => {
        const base = baseSlots[index];
        placed.push({ ...player, x: base.x, y: base.y });
      });
      return;
    }

    const playersPerBase = Math.ceil(group.length / baseSlots.length);

    group.forEach((player, index) => {
      const baseIndex = Math.min(
        Math.floor(index / playersPerBase),
        baseSlots.length - 1
      );

      const base = baseSlots[baseIndex];
      const localStart = baseIndex * playersPerBase;
      const localIndex = index - localStart;
      const remaining = group.length - localStart;
      const localCount = Math.min(playersPerBase, remaining);

      let x = base.x;
      let y = base.y;

      if (localCount > 1) {
        const columns = Math.min(localCount, 3);
        const row = Math.floor(localIndex / columns);
        const col = localIndex % columns;

        const horizontalOffset = (col - (columns - 1) / 2) * 8;
        const verticalOffset = row * 7;

        x = base.x + horizontalOffset;
        y = base.y + verticalOffset;
      }

      x = Math.max(8, Math.min(92, x));
      y = Math.max(8, Math.min(92, y));

      placed.push({ ...player, x, y });
    });
  });

  return placed;
}

function formatClock(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function scorePlayer(events, playerId) {
  return events
    .filter((e) => e.playerId === playerId)
    .reduce((sum, e) => sum + (ACTIONS.find((a) => a.key === e.action)?.weight || 0), 0);
}

function getActionCounts(events, playerId) {
  return ACTIONS.reduce((acc, action) => {
    acc[action.key] = events.filter((e) => e.playerId === playerId && e.action === action.key).length;
    return acc;
  }, {});
}

function runParserTests() {
  const tests = [
    {
      name: "parses simple name-position pairs",
      pass: (() => {
        const parsed = parseOCRText("Tom Leahy\nCF\nJack Smith\nCB");
        return parsed.length === 2 && parsed[0].name === "Tom Leahy" && parsed[0].pos === "CF";
      })(),
    },
    {
      name: "dedupes repeated players",
      pass: (() => {
        const parsed = parseOCRText("Tom Leahy\nCF\nTom Leahy\nCF");
        return parsed.length === 1;
      })(),
    },
    {
      name: "ignores status noise",
      pass: (() => {
        const parsed = parseOCRText("Tom Leahy\nCONFIRMED\nCF");
        return parsed.length === 1 && parsed[0].pos === "CF";
      })(),
    },
    {
      name: "keeps compound positions",
      pass: (() => {
        const parsed = parseOCRText("Thomas Frost Ferris\nCDM/LB");
        return parsed.length === 1 && parsed[0].pos === "CDM/LB";
      })(),
    },
  ];

  return {
    tests,
    passed: tests.filter((t) => t.pass).length,
    total: tests.length,
  };
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: {
      background: "#0f172a",
      color: "#ffffff",
      border: "1px solid #0f172a",
    },
    outline: {
      background: "#ffffff",
      color: "#0f172a",
      border: "1px solid #cbd5e1",
    },
    danger: {
      background: "#dc2626",
      color: "#ffffff",
      border: "1px solid #dc2626",
    },
  };

  return (
    <button
      {...props}
      style={{
        ...styles[variant],
        borderRadius: 14,
        padding: "10px 14px",
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.55 : 1,
      }}
      className={className}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        color: "#0f172a",
        boxSizing: "border-box",
      }}
      className={className}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        color: "#0f172a",
        boxSizing: "border-box",
        resize: "vertical",
      }}
      className={className}
    />
  );
}

function Badge({ children, variant = "default" }) {
  const style =
    variant === "danger"
      ? { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }
      : { background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1" };

  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 22,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return <div style={{ padding: 20, paddingBottom: 8 }}>{children}</div>;
}

function CardContent({ children }) {
  return <div style={{ padding: 20, paddingTop: 8 }}>{children}</div>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          borderRadius: 22,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function sortPlayersByNumber(list) {
  return [...list].sort((a, b) => {
    const aNo = parseInt(String(a.no || "").trim(), 10);
    const bNo = parseInt(String(b.no || "").trim(), 10);

    const aValid = !Number.isNaN(aNo);
    const bValid = !Number.isNaN(bNo);

    if (aValid && bValid) return aNo - bNo;
    if (aValid) return -1;
    if (bValid) return 1;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function MiniTabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: active ? "1px solid #0f172a" : "1px solid #cbd5e1",
        background: active ? "#0f172a" : "#ffffff",
        color: active ? "#ffffff" : "#0f172a",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const fileRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [db, setDb] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [matchName, setMatchName] = useState("U13 Match");
  const [opponent, setOpponent] = useState("");
  const [manualText, setManualText] = useState(DEMO_OCR_TEXT);
  const [imageUrl, setImageUrl] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [clock, setClock] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("extract");
  const [tests, setTests] = useState(runParserTests());
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [extractMobileTab, setExtractMobileTab] = useState("photo");
  const [pitchMobileTab, setPitchMobileTab] = useState("pitch");
  const [databaseMobileTab, setDatabaseMobileTab] = useState("matches");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setPlayers(parseOCRText(DEMO_OCR_TEXT));
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setPlayers(parsed.players?.length ? parsed.players : parseOCRText(DEMO_OCR_TEXT));
      setEvents(parsed.events || []);
      setDb(parsed.db || []);
      setMatchName(parsed.matchName || "U13 Match");
      setOpponent(parsed.opponent || "");
      setOcrText(parsed.ocrText || "");
      setManualText(parsed.manualText || DEMO_OCR_TEXT);
      setImageUrl(parsed.imageUrl || "");
      setOcrError(parsed.ocrError || "");
    } catch {
      setPlayers(parseOCRText(DEMO_OCR_TEXT));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ players, events, db, matchName, opponent, ocrText, manualText, imageUrl, ocrError })
    );
  }, [players, events, db, matchName, opponent, ocrText, manualText, imageUrl, ocrError]);

  useEffect(() => {
    if (!timerOn) return undefined;
    const id = window.setInterval(() => setClock((c) => c + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerOn]);

  const placedPlayers = useMemo(() => getPositionSlot(players), [players]);
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || null;

const leaderboard = useMemo(() => {
  return [...players]
    .map((p) => ({
      ...p,
      score: scorePlayer(events, p.id),
      counts: getActionCounts(events, p.id),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aNo = parseInt(a.no, 10);
      const bNo = parseInt(b.no, 10);

      if (!Number.isNaN(aNo) && !Number.isNaN(bNo)) {
        return aNo - bNo;
      }

      return String(a.name).localeCompare(String(b.name));
    });
}, [players, events]);

useEffect(() => {
  function handleResize() {
    setIsMobile(window.innerWidth <= 768);
  }

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

async function fileToDataUrl(file) {
  const originalDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = originalDataUrl;
  });

  const maxWidth = 1400;
  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.72);
}

async function handleImageUpload(e) {

  const file = e.target.files?.[0];
  if (!file) return;

  try {

    setOcrError("");

    // preview image
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);

    // real image data
    const dataUrl = await fileToDataUrl(file);
    setImageDataUrl(dataUrl);

  } catch (err) {
    console.error(err);
    setOcrError("Could not prepare image");
  }
}

function parsePlayersJson(text) {

  try {

    const cleaned = String(text || "")
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.players || !Array.isArray(parsed.players)) {
      return [];
    }

    return parsed.players.map((p, index) => ({
      id: makeId(),
      no: String(index + 1),
      name: String(p.name || "").trim(),
      pos: String(p.pos || "").trim().toUpperCase()
    }))
    .filter(p => p.name);

  } catch (err) {

    console.error("JSON parse failed:", err);
    return [];

  }
}

async function runOCR() {
  if (!imageDataUrl) {
    setOcrError("Upload image first");
    return;
  }

  try {
    setIsExtracting(true);
    setOcrError("");

    const response = await fetch("/api/extract-team-sheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageDataUrl }),
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(rawText || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.detail || data.error || "OCR failed");
    }

    if (!data.result) {
      throw new Error("No OCR result returned");
    }

    setOcrText(data.result);

    const parsedPlayers = parsePlayersJson(data.result);

    if (parsedPlayers.length > 0) {
      setPlayers(sortPlayersByNumber(parsedPlayers));
      setActiveTab("players");
    } else {
      setOcrError("OCR returned text but player JSON could not be parsed.");
    }
  } catch (err) {
    console.error(err);
    setOcrError(err.message || "OCR failed");
  } finally {
    setIsExtracting(false);
  }
}

function applyManualParse(sourceText = manualText) {

  const jsonPlayers = parsePlayersJson(sourceText);

  if (jsonPlayers.length) {
    setPlayers(sortPlayersByNumber(jsonPlayers));
    setActiveTab("players");
    setOcrError("");
    return;
  }

  const extracted = parseOCRText(sourceText);

  if (extracted.length) {
    setPlayers(sortPlayersByNumber(extracted));
    setActiveTab("players");
    setOcrError("");
    return;
  }

  setOcrError("No players could be parsed.");
}

  function loadDemoText() {
    setManualText(DEMO_OCR_TEXT);
    setOcrError("");
  }

  function addBlankPlayer() {
  setPlayers((prev) =>
    sortPlayersByNumber([
      ...prev,
      { id: makeId(), no: String(prev.length + 1), name: "New Player", pos: "CM" },
    ])
  );
}

  function updatePlayer(id, patch) {
  setPlayers((prev) =>
    sortPlayersByNumber(
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  );
}

  function removePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setEvents((prev) => prev.filter((e) => e.playerId !== id));
    if (selectedPlayerId === id) setSelectedPlayerId(null);
  }

  function logAction(actionKey) {
    if (!selectedPlayerId) return;
    setEvents((prev) => [
      {
        id: makeId(),
        t: clock,
        playerId: selectedPlayerId,
        action: actionKey,
        ts: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function undoLastEvent() {
    setEvents((prev) => prev.slice(1));
  }

  function finishMatch() {
    const summary = leaderboard.map((p) => ({
      playerId: p.id,
      no: p.no,
      name: p.name,
      pos: p.pos,
      score: p.score,
      counts: p.counts,
    }));

    const record = {
      id: makeId(),
      matchName,
      opponent,
      playedAt: new Date().toISOString(),
      durationSeconds: clock,
      summary,
      events,
    };

    setDb((prev) => [record, ...prev]);
  }

  function resetMatch() {
    setEvents([]);
    setClock(0);
    setTimerOn(false);
    setSelectedPlayerId(null);
  }

  function exportJSON() {
    const payload = { players, events, db, matchName, opponent };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scout-${matchName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows = [
      ["Time", "Player No", "Player", "Position", "Action"],
      ...events.map((e) => {
        const p = players.find((x) => x.id === e.playerId);
        const a = ACTIONS.find((x) => x.key === e.action);
        return [formatClock(e.t), p?.no || "", p?.name || "", p?.pos || "", a?.label || e.action];
      }),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${matchName.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const actionButtons = [
    { key: "goal", icon: Goal, label: "Goal" },
    { key: "assist", icon: Target, label: "Assist" },
    { key: "pace", icon: Zap, label: "Pace" },
    { key: "iq", icon: Brain, label: "IQ" },
    { key: "physical", icon: Shield, label: "Physical" },
    { key: "weak", icon: SquarePen, label: "Weak" },
  ];

  return (
    <div style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 16,
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 16 }}>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
          }}
        >
          <Card>
            <CardHeader>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Scout Match Flow</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge>Photo Reference</Badge>
                    <Badge>Manual OCR Paste</Badge>
                    <Badge>Pitch Interface</Badge>
                    <Badge>Player Database</Badge>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="outline" onClick={exportJSON}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Download size={16} /> JSON
                    </span>
                  </Button>
                  <Button variant="outline" onClick={exportCSV}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Download size={16} /> CSV
                    </span>
                  </Button>
                  <Button onClick={finishMatch}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Save size={16} /> Save Match
                    </span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <Input value={matchName} onChange={(e) => setMatchName(e.target.value)} placeholder="Match name" />
                <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Opponent" />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    background: "#f8fafc",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Match Clock</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{formatClock(clock)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="outline" onClick={() => setTimerOn((s) => !s)}>
                      {timerOn ? "Pause" : "Start"}
                    </Button>
                    <Button variant="outline" onClick={() => setClock(0)}>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Selected Player</div>
            </CardHeader>
            <CardContent>
              {selectedPlayer ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "#0f172a",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {selectedPlayer.no}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{selectedPlayer.name}</div>
                      <div style={{ fontSize: 14, color: "#64748b" }}>
                        {selectedPlayer.pos || "No position set"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {ACTIONS.map((a) => (
                      <div
                        key={a.key}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          background: "#f8fafc",
                          padding: 10,
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 18 }}>{a.icon}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{a.label}</div>
                        <div style={{ fontWeight: 700 }}>
                          {events.filter((e) => e.playerId === selectedPlayer.id && e.action === a.key).length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: 32,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Tap a player on the pitch.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "extract", label: "1. Extract" },
            { key: "players", label: "2. Players" },
            { key: "pitch", label: "3. Pitch" },
            { key: "database", label: "4. Database" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "primary" : "outline"}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "extract" && (
  <>
    {isMobile && (
      <div style={{ display: "flex", gap: 8 }}>
        <MiniTabButton
          active={extractMobileTab === "photo"}
          onClick={() => setExtractMobileTab("photo")}
        >
          Photo
        </MiniTabButton>

        <MiniTabButton
          active={extractMobileTab === "ocr"}
          onClick={() => setExtractMobileTab("ocr")}
        >
          OCR
        </MiniTabButton>

        <MiniTabButton
          active={extractMobileTab === "fix"}
          onClick={() => setExtractMobileTab("fix")}
        >
          Fix
        </MiniTabButton>
      </div>
    )}
    <Card>
              <CardHeader>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Upload Team Sheet</div>
              </CardHeader>
              <CardContent>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    marginBottom: 16,
                  }}
                >
                  <Button onClick={() => fileRef.current?.click()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Upload size={16} /> Upload Image
                    </span>
                  </Button>

                  <Button
                  variant="outline"
                  onClick={runOCR}
                  disabled={!imageDataUrl || isExtracting}
                >
  <ScanText className="mr-2 h-4 w-4" />
  {isExtracting ? "Extracting..." : "Extract Players"}
</Button>

                  <Button variant="outline" onClick={loadDemoText}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Users size={16} /> Load Demo Text
                    </span>
                  </Button>
                </div>

                {ocrError ? (
                  <div
                    style={{
                      border: "1px solid #fde68a",
                      background: "#fefce8",
                      color: "#854d0e",
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <AlertTriangle size={16} style={{ marginTop: 2 }} />
                      <span>{ocrError}</span>
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    borderRadius: 16,
                    padding: 12,
                    minHeight: 320,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Team sheet"
                      style={{
                        width: "100%",
                        maxHeight: 520,
                        objectFit: "contain",
                        borderRadius: 12,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        minHeight: 260,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px dashed #cbd5e1",
                        borderRadius: 12,
                        color: "#64748b",
                      }}
                    >
                      Team sheet preview
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

{(!isMobile || extractMobileTab === "ocr" || extractMobileTab === "fix") && (
  <Card>

    <CardHeader>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        Paste OCR Text / Manual Fix
      </div>
    </CardHeader>

    <CardContent>

      <div style={{ display: "grid", gap: 16 }}>

        {/* OCR OUTPUT */}
        {(!isMobile || extractMobileTab === "ocr") && (
          <div>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              OCR Output
            </div>

            <Textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Paste OCR output from Google Lens or another OCR tool."
              rows={6}
            />
          </div>
        )}

        {/* MANUAL FIX SECTION */}
        {(!isMobile || extractMobileTab === "fix") && (
          <>
            <div>
              <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Manual Clean-up Box
              </div>

              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Player name on one line, position on the next line."
                rows={12}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

              <Button onClick={() => applyManualParse(manualText)}>
                <Users size={16} /> Parse Manual Text
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setManualText(ocrText);
                  setOcrError("");
                }}
              >
                Use OCR Text
              </Button>

              <Button
                variant="outline"
                onClick={() => applyManualParse(ocrText || manualText)}
              >
                Parse Best Available
              </Button>

            </div>

            <div
              style={{
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                borderRadius: 16,
                padding: 14
              }}
            >
              Best workflow on your phone:  
              Photo team sheet → copy text → paste here → parse → fix names.
            </div>

          </>
        )}

      </div>

    </CardContent>

  </Card>
)}

        {activeTab === "players" && (
          <Card>
            <CardHeader>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700 }}>Player List</div>
                <Button onClick={addBlankPlayer}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Plus size={16} /> Add Player
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gap: 10 }}>
                {players.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "80px 1fr 140px 100px 80px",
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      borderRadius: 16,
                      padding: 12,
                    }}
                  >
                    <Input value={p.no} onChange={(e) => updatePlayer(p.id, { no: e.target.value })} placeholder="No" />
                    <Input value={p.name} onChange={(e) => updatePlayer(p.id, { name: e.target.value })} placeholder="Player name" />
                    <Input value={p.pos} onChange={(e) => updatePlayer(p.id, { pos: e.target.value.toUpperCase() })} placeholder="Pos" />
                    <Button variant="outline" onClick={() => setEditingPlayer(p)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => removePlayer(p.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "pitch" && (
  <div
    style={{
      display: "grid",
      gap: 16,
      gridTemplateColumns: isMobile
        ? "1fr"
        : "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
    }}
  >
            <Card>
              <CardHeader>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700 }}>Pitch Interface</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="outline" onClick={undoLastEvent}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <RotateCcw size={16} /> Undo
                      </span>
                    </Button>
                    <Button variant="outline" onClick={resetMatch}>
                      Clear Match
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  style={{
                    position: "relative",
                    margin: "0 auto",
                    width: "100%",
                    maxWidth: isMobile ? 320 : 420,
                    aspectRatio: "0.72 / 1",
                    overflow: "hidden",
                    borderRadius: 28,
                    border: "4px solid #ffffff",
                    background: "#047857",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 12,
                      borderRadius: 22,
                      border: "2px solid rgba(255,255,255,0.8)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 96,
                      height: 96,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.8)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "50%",
                      borderTop: "2px solid rgba(255,255,255,0.8)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 12,
                      width: 160,
                      height: 64,
                      transform: "translateX(-50%)",
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                      borderLeft: "2px solid rgba(255,255,255,0.8)",
                      borderRight: "2px solid rgba(255,255,255,0.8)",
                      borderBottom: "2px solid rgba(255,255,255,0.8)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 12,
                      width: 160,
                      height: 64,
                      transform: "translateX(-50%)",
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      borderLeft: "2px solid rgba(255,255,255,0.8)",
                      borderRight: "2px solid rgba(255,255,255,0.8)",
                      borderTop: "2px solid rgba(255,255,255,0.8)",
                    }}
                  />

                  {placedPlayers.map((p) => {
                    const score = scorePlayer(events, p.id);
                    return (
                      <motion.button
                        key={p.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedPlayerId(p.id)}
                        style={{
                          position: "absolute",
                          left: `${p.x}%`,
                          top: `${p.y}%`,
                          transform: "translate(-50%, -50%)",
                          width: isMobile ? 46 : 56,
                          height: isMobile ? 46 : 56,
                          borderRadius: "50%",
                          border: selectedPlayerId === p.id ? "2px solid #0f172a" : "2px solid #ffffff",
                          background: selectedPlayerId === p.id ? "#fcd34d" : "#ffffff",
                          color: "#0f172a",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, lineHeight: 1 }}>
  {p.no}
</span>
                        <span
                          style={{
                            maxWidth: isMobile ? 34 : 42,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: isMobile ? 8 : 9,
                            lineHeight: 1,
                          }}
                        >
                          {((p.name || "").split(" ")[0]).slice(0,8)}
                        </span>
                        {score !== 0 && (
                          <span style={{ fontSize: 9, lineHeight: 1 }}>{score > 0 ? `+${score}` : score}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                    gap: 8,
                  }}
                >
                  {actionButtons.map((b) => {
                    const Icon = b.icon;
                    return (
                      <Button
                        key={b.key}
                        disabled={!selectedPlayerId}
                        variant="outline"
                        onClick={() => logAction(b.key)}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Icon size={16} />
                          <span style={{ fontSize: 12 }}>{b.label}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div
  style={{
    display: "grid",
    gap: 16,
    width: "100%",
  }}
>
              <Card>
                <CardHeader>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>Leaderboard</div>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gap: 8 }}>
                    {leaderboard.slice(0, 8).map((p, idx) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          borderRadius: 14,
                          padding: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "#0f172a",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>
  {p.no}. {p.name}
</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{p.pos}</div>
                          </div>
                        </div>
                        <Badge>{p.score}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>Live Event Log</div>
                </CardHeader>
                <CardContent>
                  <div
                    style={{
                      maxHeight: 360,
                      overflow: "auto",
                      display: "grid",
                      gap: 8,
                      paddingRight: 4,
                    }}
                  >
                    {events.length === 0 && (
                      <div style={{ fontSize: 14, color: "#64748b" }}>No events logged yet.</div>
                    )}

                    {events.map((e) => {
                      const p = players.find((x) => x.id === e.playerId);
                      const a = ACTIONS.find((x) => x.key === e.action);
                      return (
                        <div
                          key={e.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            borderRadius: 14,
                            padding: 12,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {a?.icon} {p?.no}. {p?.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {a?.label} · {p?.pos}
                            </div>
                          </div>
                          <Badge>{formatClock(e.t)}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
            }}
          >
            <Card>
              <CardHeader>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Player Database / Saved Matches</div>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gap: 16 }}>
                  {db.length === 0 && (
                    <div
                      style={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: 16,
                        padding: 32,
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      Save a match and it will appear here.
                    </div>
                  )}

                  {db.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        borderRadius: 18,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>
                            {m.matchName || "Untitled Match"}
                          </div>
                          <div style={{ fontSize: 14, color: "#64748b" }}>
                            {m.opponent ? `vs ${m.opponent}` : "No opponent set"} ·{" "}
                            {new Date(m.playedAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge>{formatClock(m.durationSeconds || 0)}</Badge>
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          display: "grid",
                          gap: 8,
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        }}
                      >
                        {m.summary.slice(0, 9).map((p) => (
                          <div
                            key={p.playerId}
                            style={{
                              border: "1px solid #e2e8f0",
                              background: "#f8fafc",
                              borderRadius: 14,
                              padding: 12,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              {p.no}. {p.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{p.pos}</div>
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontSize: 14 }}>Score</span>
                              <Badge>{p.score}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Parser Self-Tests</div>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {tests.passed === tests.total ? (
                    <Badge>
                      <CheckCircle2 size={14} /> {tests.passed}/{tests.total} passed
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <AlertTriangle size={14} /> {tests.passed}/{tests.total} passed
                    </Badge>
                  )}
                  <Button variant="outline" onClick={() => setTests(runParserTests())}>
                    Run Tests
                  </Button>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {tests.tests.map((test) => (
                    <div
                      key={test.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        borderRadius: 14,
                        padding: 12,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{test.name}</span>
                      {test.pass ? <Badge>Pass</Badge> : <Badge variant="danger">Fail</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Modal open={!!editingPlayer} onClose={() => setEditingPlayer(null)} title="Edit Player">
        {editingPlayer && (
          <div style={{ display: "grid", gap: 12 }}>
            <Input
              value={editingPlayer.no}
              onChange={(e) => setEditingPlayer({ ...editingPlayer, no: e.target.value })}
              placeholder="Number"
            />
            <Input
              value={editingPlayer.name}
              onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
              placeholder="Name"
            />
            <Input
              value={editingPlayer.pos}
              onChange={(e) => setEditingPlayer({ ...editingPlayer, pos: e.target.value.toUpperCase() })}
              placeholder="Position"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updatePlayer(editingPlayer.id, editingPlayer);
                  setEditingPlayer(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}