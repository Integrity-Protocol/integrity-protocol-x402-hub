"use client"

import { useState, useEffect } from "react"

// ── Interfaces ─────────────────────────────────────────────────────
interface Transaction {
  id: string
  hash: string
  fullHash: string | null
  amt: string
  vendor: string
  query: string
  rid: string
  status: string
  ts: string
  model: string
}

interface DrillData {
  signal: {
    text: string
    anomaly: string
    severity: number
    confidence: string
    signal_ids?: string[]
  }
  gap: {
    text: string
    gap_identified: string
    budget: string
    slots: number
    sac1: { id: string; desc: string; why: string } | null
    sac2: { id: string; desc: string; why: string } | null
  }
  acquire: {
    vendor: string
    model: string
    amt: string
    chain: string
    hash: string
    fullHash: string | null
    query: string
  }
  correct: {
    old: string | null
    new_r: string | null
    cid: string | null
  }
  outcome: {
    status: string
    impact: string
    threat: boolean
    thesis: string
  }
}

interface BudgetDeliberation {
  cycle_allowance_usd: number
  cycle_slots_available: number
  approved_count: number
  deferred_count: number
  denied_count: number
  approved: { request_id: string; reasoning: string; estimated_cost_usd: number; _source: string }[]
  deferred: { request_id: string; reasoning: string; deferral_type: string | null; _source: string; cross_cited: string | null; knowledge_gap: string | null }[]
  denied: { request_id: string; reasoning: string; _source: string }[]
  knowledge_gaps_named_during_ranking: string[]
}

interface AgentTel {
  up: string
  last: string
  acq: number
  spent: string
}

interface HubData {
  bd: BudgetDeliberation | null
  rTxs: Transaction[]
  wTxs: Transaction[]
  rTel: AgentTel
  wTel: AgentTel
  drill: Record<string, DrillData>
  assessment: { thesis_status: string; confidence_in_status: string; action_recommendation: string; timestamp: string } | null
  _generated_at: string | null
}

// ── Tactical Color Palette ──────────────────────────────────────────
// Military-grade institutional colors - Anduril/Palantir aesthetic
const C = {
  bg: "#0a0f1a",
  wire: "rgba(255,179,71,0.12)", // amber/gold wire border
  tint: "rgba(255,179,71,0.02)", // subtle amber tint
  row: "rgba(26,39,64,0.35)", // barely visible row dividers
  section: "#1a2740",

  // Labels - legible but dim
  lbl: "#64748b",

  // Primary reading text - stark white for projector readability
  val: "#f1f5f9",
  hi: "#f1f5f9",

  // Tactical accent colors - muted, desaturated
  olive: "#7c8c6a", // dead olive for success/positive
  amber: "#c9956a", // burnt amber for warnings/budget
  slate: "#8b9fc7", // slate blue for hashes/addresses
  coral: "#c9726a", // muted coral for alerts/stripped
  lavender: "#9b8ab8", // dusty lavender for corrections/gaps

  // Status badge
  badgeOlive: "#7c8c6a",
}

// ── Node descriptions ───────────────────────────────────────────────
const nodeDesc: Record<string, string> = {
  SIGNAL: "What the system observed",
  GAP: "What it needed to know before acting",
  ACQUIRE: "What it paid for to resolve the gap",
  CORRECT: "How its reasoning changed with verified data",
  OUTCOME: "The final decision and what it prevented",
  DEFERRED: "Why the system chose not to act",
  "EMERGENT GAP": "What the system discovered it cannot resolve",
  STATUS: "Where this request stands now",
}

// ── Primitives ──────────────────────────────────────────────────────
function DataRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid ${C.row}` }}>
      <span className="text-[10px] tracking-[0.5px] font-medium" style={{ color: C.lbl }}>
        {label}
      </span>
      <span className="text-xs font-semibold" style={{ color: color || C.val }}>
        {value}
      </span>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.section}` }}>
      <div className="text-[9px] tracking-[2px] mb-1.5 font-semibold" style={{ color: C.lbl }}>
        {children}
      </div>
    </div>
  )
}

function ExpandableText({ text, max = 80 }: { text: string; max?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (!text || text.length <= max) {
    return (
      <span className="text-[11px] leading-relaxed font-medium" style={{ color: C.val }}>
        {text}
      </span>
    )
  }
  return (
    <span className="text-[11px] leading-relaxed font-medium" style={{ color: C.val }}>
      {expanded ? text : text.slice(0, max) + "..."}
      <button
        className="ml-1 text-[10px] font-medium border-0 bg-transparent cursor-pointer"
        style={{ color: C.slate }}
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
      >
        [{expanded ? "−" : "+"}]
      </button>
    </span>
  )
}

function shortId(requestId: string): string {
  if (!requestId) return "—"
  const parts = requestId.split("-")
  const seq = parts[parts.length - 1]
  const layer = parts.find(p => p === "L2" || p === "L3" || p === "L4") || ""
  return "ACQ-" + seq
}

function StatusBlock({
  borderColor,
  label,
  children,
}: {
  borderColor: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className="p-2.5 mb-1.5 rounded-[4px]"
      style={{
        background: `${borderColor}08`,
        border: `1px solid ${borderColor}30`,
      }}
    >
      <div className="text-[9px] tracking-[2px] font-bold mb-1" style={{ color: borderColor }}>
        {label}
      </div>
      {children}
    </div>
  )
}

// ── Agent Panel ─────────────────────────────────────────────────────
interface AgentProps {
  name: string
  chain: "xrpl" | "base"
  wallet: string
  bal: string
  asset: string
  txs: Transaction[]
  tel: { up: string; last: string; acq: number; spent: string }
  onTx: (tx: Transaction) => void
  sel: Transaction | null
}

function Agent({ name, chain, wallet, bal, asset, txs, tel, onTx, sel }: AgentProps) {
  return (
    <div
      className="flex-1 min-w-0 flex flex-col rounded-[4px] p-3"
      style={{
        background: C.tint,
        border: `1px solid ${C.wire}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[11px] font-bold tracking-[1.5px]" style={{ color: C.hi }}>
          {name}
        </span>
        <span
          className="text-[9px] font-bold tracking-[1px] px-2 py-0.5 rounded-[4px]"
          style={{
            color: C.badgeOlive,
            border: `1px solid ${C.badgeOlive}`,
          }}
        >
          {chain === "xrpl" ? "XRPL MAINNET" : "BASE MAINNET"}
        </span>
      </div>

      {/* Stats */}
      <DataRow label="AGENT ADDRESS" value={wallet} color={C.slate} />
      <DataRow label="BALANCE" value={`${bal} ${asset}`} color={C.olive} />
      <DataRow label="PAYMENTS SENT" value={tel.acq} />
      <DataRow label="TOTAL SPENT" value={tel.spent} color={C.olive} />

      {/* Recent Transactions */}
      <div
        className="mt-2 pt-2 flex justify-between items-center mb-1.5"
        style={{ borderTop: `1px solid ${C.section}` }}
      >
        <span className="text-[9px] tracking-[2px] font-semibold" style={{ color: C.lbl }}>
          RECENT TRANSACTIONS
        </span>
        <span className="text-[8px] tracking-[0.5px]" style={{ color: C.lbl }}>
          UPDATED {tel.last}
        </span>
      </div>

      {/* Column Headers */}
      <div
        className="grid gap-2 py-1 shrink-0"
        style={{
          gridTemplateColumns: "minmax(150px, 1fr) auto 110px",
          borderBottom: `1px solid ${C.row}`,
        }}
      >
        <span className="text-[9px] tracking-[2px] font-semibold" style={{ color: C.lbl }}>
          TX HASH
        </span>
        <span className="text-[9px] tracking-[2px] font-semibold text-right" style={{ color: C.lbl }}>
          STATUS
        </span>
        <span
          className="text-[9px] tracking-[2px] font-semibold text-right"
          style={{ color: C.lbl }}
        >
          DATE
        </span>
      </div>

      {/* Transaction Rows */}
      <div className="flex-1 min-h-0" style={{ overflowY: "auto" }}>
        {txs.map((tx) => (
          <div
            key={tx.id}
            className="grid gap-2 py-1.5 cursor-pointer transition-colors hover:bg-[rgba(139,159,199,0.03)]"
            style={{
              gridTemplateColumns: "minmax(150px, 1fr) auto 110px",
              borderBottom: `1px solid ${C.row}`,
              background: sel?.id === tx.id ? "rgba(139,159,199,0.06)" : "transparent",
            }}
            onClick={() => onTx(tx)}
          >
            <span 
              className="text-[11px] font-semibold" 
              style={{ color: C.slate }}
              title={tx.hash}
            >
              {tx.hash}
            </span>
            <span className="text-[10px] font-bold shrink-0" style={{ color: C.olive }}>
              SUCCESS
            </span>
            <span className="text-[10px] text-right shrink-0 font-medium" style={{ color: C.lbl }}>
              {tx.ts}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Modal Node ─────────────────────────────────────────────────────
interface NodeProps {
  label: string
  color?: string
  icon: React.ReactNode
  last?: boolean
  children: React.ReactNode
}

function Node({ label, color, icon, last, children }: NodeProps) {
  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center shrink-0 w-7">
        <div
          className="w-7 h-7 rounded-[4px] flex items-center justify-center text-xs shrink-0 z-10"
          style={{
            border: `1px solid ${color || C.lbl}`,
            background: C.bg,
          }}
        >
          {icon}
        </div>
        {!last && <div className="w-px flex-1 min-h-5" style={{ background: C.row }} />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${last ? "" : "pb-5"}`}>
        <div className="text-[9px] tracking-[2px] font-bold mb-0.5" style={{ color: color || C.lbl }}>
          {label}
        </div>
        {nodeDesc[label] && (
          <div className="text-[9px] tracking-[0.5px] mb-2 italic font-medium" style={{ color: C.lbl }}>
            {nodeDesc[label]}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Sacrificed Block ────────────────────────────────────────────────
function SacrificedBlock({ s }: { s: { id: string; desc: string; why: string } | null }) {
  if (!s) return null
  return (
    <StatusBlock borderColor={C.amber} label="SACRIFICED — BUDGET FORCED A CHOICE">
      <div className="text-[11px] font-semibold" style={{ color: C.val }}>
        <span style={{ color: C.lbl }}>{s.id}:</span> {s.desc}
      </div>
      <div className="text-[10px] italic mt-0.5 font-medium" style={{ color: C.lbl }}>
        {s.why}
      </div>
    </StatusBlock>
  )
}

// ── Modal ───────────────────────────────────────────────────────────
interface ModalProps {
  tx: Transaction | null
  drill: Record<string, DrillData>
  onClose: () => void
}

function Modal({ tx, drill, onClose }: ModalProps) {
  if (!tx) return null

  const d: DrillData = drill[tx.rid] || {
    signal: {
      text: "Signal data ingested.",
      anomaly: "Anomaly detected",
      severity: 5,
      confidence: "MEDIUM",
    },
    gap: {
      text: "Knowledge gap identified.",
      gap_identified: "Insufficient data.",
      budget: "$0.218",
      slots: 1,
      sac1: null,
      sac2: null,
    },
    acquire: {
      vendor: tx.vendor,
      model: tx.model || "—",
      amt: tx.amt,
      chain: tx.hash?.startsWith("0x") ? "Base Mainnet" : "XRPL Mainnet",
      hash: tx.hash,
      fullHash: tx.fullHash,
      query: tx.query,
    },
    correct: { old: null, new_r: null, cid: null },
    outcome: {
      status: "CONFIRMED",
      impact: "Acquired data integrated into next pipeline cycle.",
      threat: false,
      thesis: "MAINTAINED",
    },
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="rounded-[4px] w-[94%] max-w-[740px] max-h-[90vh] overflow-y-auto p-5"
        style={{
          background: C.bg,
          border: `1px solid ${C.wire}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex justify-between items-center mb-4 pb-3"
          style={{ borderBottom: `1px solid ${C.section}` }}
        >
          <div>
            <div className="text-[9px] tracking-[2px] mb-1 font-semibold" style={{ color: C.lbl }}>
              EXECUTION TRACE
            </div>
            <span className="text-[11px] font-bold tracking-[1.5px]" style={{ color: C.hi }}>
              Acquisition Request #{tx.rid?.replace(/\D/g, "") || "—"}
            </span>
            <div className="text-[10px] mt-0.5 font-medium" style={{ color: C.lbl }}>
              → {tx.hash}
            </div>
          </div>
          <button
            onClick={onClose}
            className="border rounded-[4px] px-3 py-1 cursor-pointer text-[10px] font-medium"
            style={{
              background: "none",
              borderColor: C.section,
              color: C.lbl,
            }}
          >
            ESC
          </button>
        </div>

        {/* SIGNAL Node */}
        <Node label="SIGNAL" color={C.lbl} icon={<span style={{ color: C.lbl }}>◇</span>}>
          <div className="text-xs leading-relaxed mb-2 font-medium" style={{ color: C.val }}>
            {d.signal.text}
          </div>
          <DataRow label="ANOMALY" value={d.signal.anomaly} color={C.amber} />
          <DataRow label="SEVERITY" value={`${d.signal.severity}/10`} />
          <DataRow label="CONFIDENCE" value={d.signal.confidence} />
          {d.signal.signal_ids && d.signal.signal_ids.length > 0 && (
            <div className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid ${C.row}` }}>
              <span className="text-[10px] tracking-[0.5px] font-medium" style={{ color: C.lbl }}>SIGNAL DOSSIER</span>
              <div className="flex gap-2">
                {d.signal.signal_ids.map((sid) => (
                  <a
                    key={sid}
                    href={`https://integrity-protocol.github.io/Overwatch-Terminal/signal-dossier.html?signal_id=${sid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold cursor-pointer"
                    style={{ color: C.slate, textDecoration: "underline", textDecorationColor: C.section }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {sid}
                  </a>
                ))}
              </div>
            </div>
          )}
        </Node>

        {/* GAP Node */}
        <Node label="GAP" color={C.slate} icon={<span style={{ color: C.slate }}>◎</span>}>
          <div className="text-xs leading-relaxed mb-2 font-medium" style={{ color: C.val }}>
            {d.gap.text}
          </div>
          <StatusBlock borderColor={C.slate} label="GAP IDENTIFIED — THE SYSTEM CANNOT PROCEED WITHOUT THIS">
            <div className="text-xs leading-relaxed font-medium" style={{ color: C.val }}>
              {d.gap.gap_identified}
            </div>
          </StatusBlock>
          <DataRow label="BUDGET REMAINING" value={d.gap.budget} color={C.amber} />
          <DataRow label="SLOTS AVAILABLE" value={d.gap.slots} color={C.amber} />
          <SacrificedBlock s={d.gap.sac1} />
          <SacrificedBlock s={d.gap.sac2} />
        </Node>

        {/* ACQUIRE Node */}
        <Node label="ACQUIRE" color={C.olive} icon={<span style={{ color: C.olive, fontWeight: 700 }}>$</span>}>
          <StatusBlock borderColor={C.olive} label="x402 PAYMENT EXECUTED">
            <DataRow label="VENDOR" value={d.acquire.vendor} />
            <DataRow label="AMOUNT" value={d.acquire.amt} color={C.olive} />
            <DataRow label="CHAIN" value={d.acquire.chain} />
            <DataRow label="MODEL" value={d.acquire.model} />
            {d.acquire.fullHash ? (
              <a
                href={d.acquire.fullHash.startsWith("0x")
                  ? `https://sepolia.basescan.org/tx/${d.acquire.fullHash}`
                  : `https://bithomp.com/explorer/${d.acquire.fullHash}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block"
              >
                <DataRow label="TX HASH" value={d.acquire.hash} color="#60a5fa" />
              </a>
            ) : (
              <DataRow label="TX HASH" value="PENDING" color={C.slate} />
            )}
            <div className="py-1.5">
              <span className="text-[10px] tracking-[0.5px] font-semibold" style={{ color: C.lbl }}>
                QUERY
              </span>
              <div className="text-xs leading-relaxed mt-0.5 font-medium" style={{ color: C.val }}>
                {d.acquire.query}
              </div>
            </div>
          </StatusBlock>
        </Node>

        {/* CORRECT Node */}
        <Node label="CORRECT" color={C.lavender} icon={<span style={{ color: C.lavender }}>✎</span>}>
          {d.correct.old ? (
            <div>
              <div
                className="text-[10px] leading-relaxed mb-2 italic font-medium"
                style={{ color: C.lbl }}
              >
                Below is the reasoning the system produced before acquiring verified data. Left unchecked,
                this reasoning would have been acted on. The Integrity Protocol prevented that.
              </div>
              <StatusBlock borderColor={C.coral} label="PRIOR REASONING — STRIPPED">
                <div
                  className="text-xs leading-relaxed font-medium"
                  style={{
                    color: "#94a3b8",
                    textDecoration: "line-through",
                    textDecorationColor: "#b45454",
                    textDecorationThickness: "1px",
                  }}
                >
                  {d.correct.old}
                </div>
              </StatusBlock>
              <StatusBlock borderColor={C.olive} label="CORRECTED — VERIFIED DATA APPLIED">
                <div className="text-xs leading-relaxed font-medium" style={{ color: C.val }}>
                  {d.correct.new_r}
                </div>
              </StatusBlock>
              {d.correct.cid && (
                <StatusBlock borderColor={C.lavender} label="CORRECTION LOGGED">
                  <a href={`https://integrity-protocol.github.io/Overwatch-Terminal/flight-recorder.html?chain_id=${d.correct.cid.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold cursor-pointer" style={{ color: C.lavender, textDecoration: "underline", textDecorationColor: C.section }} onClick={(e) => e.stopPropagation()}>
                    {d.correct.cid} →
                  </a>
                </StatusBlock>
              )}
            </div>
          ) : (
            <div className="text-[11px] italic font-medium" style={{ color: C.lbl }}>
              Awaiting pipeline integration.
            </div>
          )}
        </Node>

        {/* OUTCOME Node */}
        <Node
          label="OUTCOME"
          color={d.outcome.status === "SURVIVED" ? C.olive : C.amber}
          icon={
            <span style={{ color: d.outcome.status === "SURVIVED" ? C.olive : C.amber, fontWeight: 700 }}>
              {d.outcome.status === "SURVIVED" ? "✓" : "●"}
            </span>
          }
          last
        >
          <StatusBlock
            borderColor={d.outcome.status === "SURVIVED" ? C.olive : C.amber}
            label="FINAL VERDICT — WHAT THE SYSTEM CONCLUDED AND WHAT IT PREVENTED"
          >
            <DataRow
              label="STATUS"
              value={d.outcome.status}
              color={d.outcome.status === "SURVIVED" ? C.olive : C.amber}
            />
            <DataRow label="THESIS" value={d.outcome.thesis} />
            <div
              className="flex justify-between items-center py-1.5"
              style={{ borderBottom: `1px solid ${C.row}` }}
            >
              <span className="text-[10px] tracking-[0.5px] font-medium" style={{ color: C.lbl }}>
                THREAT FLAG
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: d.outcome.threat ? C.coral : C.olive,
                  }}
                />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: d.outcome.threat ? C.coral : C.olive }}
                >
                  {d.outcome.threat ? "TRIGGERED" : "CLEAR"}
                </span>
              </div>
            </div>
            <div className="py-1.5">
              <span className="text-[10px] tracking-[0.5px] font-semibold" style={{ color: C.lbl }}>
                IMPACT
              </span>
              <div className="text-xs leading-relaxed mt-0.5 font-medium" style={{ color: C.val }}>
                {d.outcome.impact}
              </div>
            </div>
          </StatusBlock>
        </Node>
        <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${C.section}` }}>
          <a href={`https://integrity-protocol.github.io/Overwatch-Terminal/trace.html?request_id=${tx.rid}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold tracking-[1px] cursor-pointer" style={{ color: C.slate, textDecoration: "underline", textDecorationColor: C.section }} onClick={(e) => e.stopPropagation()}>
            VIEW FULL COGNITIVE TRACE →
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main Layout ─────────────────────────────────────────────────────
export default function AgentHub() {
  const [sel, setSel] = useState<Transaction | null>(null)
  const [modal, setModal] = useState<Transaction | null>(null)
  const [deferredModal, setDeferredModal] = useState<any>(null)
  const [deniedModal, setDeniedModal] = useState<any>(null)
  const [data, setData] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/targets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load payload")
        return res.json()
      })
      .then((d: HubData) => {
        setData(d)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <span className="text-[11px] tracking-[2px] font-semibold" style={{ color: C.lbl }}>LOADING PAYLOAD...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <span className="text-[11px] tracking-[2px] font-semibold" style={{ color: C.coral }}>
          {error || "NO DATA"}
        </span>
      </div>
    )
  }

  const bd = data.bd || {
    cycle_allowance_usd: 0,
    cycle_slots_available: 0,
    approved_count: 0,
    deferred_count: 0,
    denied_count: 0,
    approved: [],
    deferred: [],
    denied: [],
    knowledge_gaps_named_during_ranking: [],
  }
  const rTxs = data.rTxs || []
  const wTxs = data.wTxs || []
  const rTel = data.rTel || { up: "—", last: "—", acq: 0, spent: "0 RLUSD" }
  const wTel = data.wTel || { up: "—", last: "—", acq: 0, spent: "$0 USDC" }
  const drill = data.drill || {}

  const handleTxClick = (tx: Transaction) => {
    setSel(tx)
    setModal(tx)
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden relative"
      style={{ background: C.bg }}
    >
      <div
        className="flex-1 flex flex-col overflow-hidden m-2 rounded-[4px]"
        style={{ border: `1px solid ${C.wire}` }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-4 py-2.5 shrink-0"
          style={{ borderBottom: `1px solid ${C.row}` }}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="text-[11px] font-bold tracking-[1.5px] underline underline-offset-4"
              style={{
                color: C.hi,
                textDecorationColor: C.wire,
              }}
            >
              x402 AGENT HUB
            </span>
            <span className="text-[9px] tracking-[2px] font-semibold" style={{ color: C.lbl }}>
              THE INTEGRITY PROTOCOL
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[10px] font-medium" style={{ color: C.lbl }}>
              ALLOWANCE{" "}
              <span className="font-semibold" style={{ color: C.hi }}>
                ${bd.cycle_allowance_usd}
              </span>
            </span>
            <span className="text-[10px] font-medium" style={{ color: C.lbl }}>
              SLOTS{" "}
              <span className="font-semibold" style={{ color: C.hi }}>
                {bd.cycle_slots_available}
              </span>
            </span>
            <span className="text-[10px] font-medium" style={{ color: C.lbl }}>
              APPROVED{" "}
              <span className="font-semibold" style={{ color: C.olive }}>
                {bd.approved_count}
              </span>
            </span>
            <span className="text-[10px] font-medium" style={{ color: C.lbl }}>
              DEFERRED{" "}
              <span className="font-semibold" style={{ color: C.amber }}>
                {bd.deferred_count}
              </span>
            </span>
            <span className="text-[10px] font-medium" style={{ color: C.lbl }}>
              DENIED{" "}
              <span className="font-semibold" style={{ color: C.coral }}>
                {bd.denied_count}
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.olive }} />
              <span className="text-[9px] font-bold tracking-[1px]" style={{ color: C.olive }}>
                NOMINAL
              </span>
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="flex gap-2 p-2 shrink-0 h-[48vh] min-h-[300px]">
          <Agent
            name="RESEARCH AGENT"
            chain="xrpl"
            wallet="rhwEHBYeXbSpK1n6HNUjqCdjzjjBAHD5dd"
            bal="7.057"
            asset="RLUSD"
            txs={rTxs}
            tel={rTel}
            onTx={handleTxClick}
            sel={sel}
          />
          <Agent
            name="WORKFLOW AGENT"
            chain="base"
            wallet="NOT DEPLOYED"
            bal="0.00"
            asset="USDC"
            txs={wTxs}
            tel={wTel}
            onTx={handleTxClick}
            sel={sel}
          />
        </div>

        {/* Triage Ledger */}
        <div
          className="flex-1 flex flex-col overflow-hidden mx-2 mb-2 rounded-[4px] px-3 py-2"
          style={{
            background: C.tint,
            border: `1px solid ${C.wire}`,
          }}
        >
          <div className="flex justify-between items-center mb-1 shrink-0">
            <span className="text-[10px] font-bold tracking-[1.5px]" style={{ color: C.hi }}>
              TRIAGE LEDGER
            </span>
            <span className="text-[9px] tracking-[1px] font-semibold" style={{ color: C.lbl }}>
              {bd.deferred.length} DEFERRED
            </span>
          </div>

          {/* Column Headers */}
          <div
            className="grid gap-1.5 py-0.5 shrink-0"
            style={{
              gridTemplateColumns: "55px 55px 75px 1fr",
              borderBottom: `1px solid ${C.row}`,
            }}
          >
            {["REQ", "RANK", "DEFERRAL", "SYSTEM REASONING"].map((h) => (
              <span key={h} className="text-[8px] tracking-[1px] font-semibold" style={{ color: C.lbl }}>
                {h}
              </span>
            ))}
          </div>

          {/* Deferred & Approved Rows */}
          <div className="flex-1 min-h-0" style={{ overflowY: "auto" }}>
            {bd.denied.map((n: any) => (
              <div
                key={n.request_id}
                className="grid gap-1.5 py-1 items-start cursor-pointer"
                style={{
                  gridTemplateColumns: "55px 55px 75px 1fr",
                  borderBottom: `1px solid ${C.row}`,
                }}
                onClick={() => setDeniedModal(n)}
              >
                <span className="text-[10px] font-bold" style={{ color: C.coral }} title={n.request_id}>
                  {shortId(n.request_id)}
                </span>
                <span className="text-[9px] font-bold" style={{ color: C.coral }}>
                  DENIED
                </span>
                <span className="text-[9px] font-medium" style={{ color: C.lbl }}>
                  {n._source ? n._source.toUpperCase() : "—"}
                </span>
                <ExpandableText text={n.reasoning} max={80} />
              </div>
            ))}
            {bd.deferred.map((d) => (
              <div
                key={d.request_id}
                className="grid gap-1.5 py-1 items-start cursor-pointer"
                style={{
                  gridTemplateColumns: "55px 55px 75px 1fr",
                  borderBottom: `1px solid ${C.row}`,
                }}
                onClick={() => setDeferredModal(d)}
              >
                <span className="text-[10px] font-semibold" style={{ color: C.val }} title={d.request_id}>
                  {shortId(d.request_id)}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: C.slate }}>
                  {d.cross_cited}
                </span>
                <span
                  className="text-[8px] font-bold tracking-[0.3px]"
                  style={{ color: d.deferral_type ? C.amber : C.lbl }}
                >
                  {d.deferral_type ? d.deferral_type.replace("_", " ").toUpperCase() : "—"}
                </span>
                <div>
                  <ExpandableText text={d.reasoning} max={80} />
                  {d.knowledge_gap && (
                    <StatusBlock borderColor={C.lavender} label="THE SYSTEM FLAGGED THIS AND REFUSED TO GUESS">
                      <div className="text-[10px] leading-snug font-medium" style={{ color: C.val }}>
                        {d.knowledge_gap}
                      </div>
                    </StatusBlock>
                  )}
                </div>
              </div>
            ))}
            {bd.approved.map((a) => (
              <div
                key={a.request_id}
                className="grid gap-1.5 py-1 items-start cursor-pointer"
                style={{
                  gridTemplateColumns: "55px 55px 75px 1fr",
                  borderBottom: `1px solid ${C.row}`,
                }}
                onClick={() => { const tx = [...rTxs, ...wTxs].find(t => t.rid === a.request_id); if (tx) { setSel(tx); setModal(tx); } }}
              >
                <span className="text-[10px] font-bold" style={{ color: C.olive }} title={a.request_id}>
                  {shortId(a.request_id)}
                </span>
                <span className="text-[9px] font-bold" style={{ color: C.olive }}>
                  APPROVED
                </span>
                <span className="text-[9px] font-medium" style={{ color: C.lbl }}>
                  {a._source ? a._source.toUpperCase() : "—"}
                </span>
                <ExpandableText text={a.reasoning} max={80} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime — bottom right */}
      <div
        className="absolute bottom-3 right-5 text-[9px] tracking-[1px] font-medium"
        style={{ color: C.lbl }}
      >
        UPTIME —
      </div>

      <Modal tx={modal} drill={drill} onClose={() => { setModal(null); setSel(null); }} />
      {deferredModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setDeferredModal(null)}
        >
          <div
            className="rounded-[4px] w-[94%] max-w-[740px] max-h-[90vh] overflow-y-auto p-5"
            style={{ background: C.bg, border: `1px solid ${C.wire}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: `1px solid ${C.section}` }}>
              <div>
                <div className="text-[9px] tracking-[2px] mb-1 font-semibold" style={{ color: C.lbl }}>DEFERRED REQUEST</div>
                <span className="text-[11px] font-bold tracking-[1.5px]" style={{ color: C.hi }}>
                  Acquisition Request #{deferredModal.request_id.replace(/\D/g, "")}
                </span>
              </div>
              <button onClick={() => setDeferredModal(null)} className="border rounded-[4px] px-3 py-1 cursor-pointer text-[10px] font-medium" style={{ background: "none", borderColor: C.section, color: C.lbl }}>ESC</button>
            </div>

            <Node label="SIGNAL" color={C.lbl} icon={<span style={{ color: C.lbl }}>◇</span>}>
              <div className="text-xs leading-relaxed mb-2 font-medium" style={{ color: C.val }}>
                Acquisition request generated from pipeline analysis.
              </div>
              <DataRow label="REQUEST" value={deferredModal.request_id} />
              <DataRow label="SOURCE" value={deferredModal._source ? deferredModal._source.toUpperCase() : "—"} />
              {deferredModal.cross_cited && <DataRow label="RANKED AGAINST" value={deferredModal.cross_cited} color={C.slate} />}
            </Node>

            <Node label="GAP" color={C.slate} icon={<span style={{ color: C.slate }}>◎</span>}>
              <div className="text-xs leading-relaxed mb-2 font-medium" style={{ color: C.val }}>
                {deferredModal.reasoning}
              </div>
              <DataRow label="BUDGET REMAINING" value={`$${bd.cycle_allowance_usd}`} color={C.amber} />
              <DataRow label="SLOTS AVAILABLE" value={bd.cycle_slots_available} color={C.amber} />
            </Node>

            <Node label="DEFERRED" color={C.amber} icon={<span style={{ color: C.amber, fontWeight: 700 }}>⏸</span>}>
              <StatusBlock borderColor={C.amber} label={deferredModal.deferral_type === "budget_constraint" ? "DEFERRED — BUDGET FORCED A CHOICE" : "DEFERRED — LOWER PRIORITY"}>
                <div className="text-xs leading-relaxed font-medium" style={{ color: C.val }}>
                  {deferredModal.reasoning}
                </div>
              </StatusBlock>
            </Node>

            {deferredModal.knowledge_gap && (
              <Node label="EMERGENT GAP" color={C.lavender} icon={<span style={{ color: C.lavender }}>?</span>}>
                <StatusBlock borderColor={C.lavender} label="THE SYSTEM FLAGGED THIS AND REFUSED TO GUESS">
                  <div className="text-xs leading-relaxed font-medium" style={{ color: C.val }}>
                    {deferredModal.knowledge_gap}
                  </div>
                </StatusBlock>
              </Node>
            )}

            <Node label="STATUS" color={C.lbl} icon={<span style={{ color: C.lbl }}>○</span>} last>
              <StatusBlock borderColor={C.lbl} label="PENDING — QUEUED FOR NEXT CYCLE">
                <DataRow label="STATUS" value="DEFERRED" color={C.amber} />
                <DataRow label="DISPOSITION" value={deferredModal.deferral_type ? deferredModal.deferral_type.replace("_", " ").toUpperCase() : "PRIORITY RANKING"} color={C.amber} />
              </StatusBlock>
            </Node>
          </div>
        </div>
      )}
        {deniedModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={() => setDeniedModal(null)}
          >
            <div
              className="rounded-[4px] w-[94%] max-w-[740px] max-h-[90vh] overflow-y-auto p-5"
              style={{ background: C.bg, border: `1px solid ${C.wire}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: `1px solid ${C.section}` }}>
                <div>
                  <div className="text-[9px] tracking-[2px] mb-1 font-semibold" style={{ color: C.coral }}>DENIED REQUEST</div>
                  <span className="text-[11px] font-bold tracking-[1.5px]" style={{ color: C.hi }}>
                    Acquisition Request #{deniedModal.request_id.replace(/\D/g, "")}
                  </span>
                </div>
                <button onClick={() => setDeniedModal(null)} className="border rounded-[4px] px-3 py-1 cursor-pointer text-[10px] font-medium" style={{ background: "none", borderColor: C.section, color: C.lbl }}>ESC</button>
              </div>

              <Node label="SIGNAL" color={C.lbl} icon={<span style={{ color: C.lbl }}>◇</span>}>
                <div className="text-xs leading-relaxed mb-2 font-medium" style={{ color: C.val }}>
                  Acquisition request generated from pipeline analysis.
                </div>
                <DataRow label="REQUEST" value={deniedModal.request_id} />
                <DataRow label="SOURCE" value={deniedModal._source ? deniedModal._source.toUpperCase() : "—"} />
              </Node>

              <Node label="DENIED" color={C.coral} icon={<span style={{ color: C.coral, fontWeight: 700 }}>✕</span>}>
                <StatusBlock borderColor={C.coral} label="DENIED — THE SYSTEM REFUSED TO SPEND">
                  <div className="text-xs leading-relaxed font-medium" style={{ color: C.val }}>
                    {deniedModal.reasoning}
                  </div>
                </StatusBlock>
              </Node>

              <Node label="STATUS" color={C.lbl} icon={<span style={{ color: C.lbl }}>○</span>} last>
                <StatusBlock borderColor={C.lbl} label="TERMINAL — NO ACQUISITION WILL BE MADE">
                  <DataRow label="STATUS" value="DENIED" color={C.coral} />
                  <DataRow label="DISPOSITION" value="REJECTED BY LAYER 4" color={C.coral} />
                </StatusBlock>
              </Node>
            </div>
          </div>
        )}
    </div>
  )
}
