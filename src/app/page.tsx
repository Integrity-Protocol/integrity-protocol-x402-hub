"use client"

import { useState } from "react"

// ── Data ────────────────────────────────────────────────────────────
const bd = {
  cycle_allowance_usd: 0.218,
  cycle_slots_available: 1,
  approved_count: 1,
  deferred_count: 3,
  denied_count: 0,
  approved: [
    {
      request_id: "ACQ-001",
      reasoning:
        "RLUSD chain breakdown is the highest-impact acquisition candidate. It directly addresses two active tension points — RLUSD-regulatory divergence and RLUSD pace of decline — by resolving whether the $110M decline represents redemptions, transfers, or liquidity management. This is the single most ambiguous data point in the assessment — the RLUSD decline is verified but the cause is unknown. Resolution would directly affect the discrete threat flag trajectory assessment. Within budget ($0.218 remaining, 1 slot). Expected impact score 4 (significant). The independent auditor flagged the system for hoarding budget instead of deploying it — this is the deployment that addresses the most critical unresolved question.",
      estimated_cost_usd: 0,
      _source: "first_call",
    },
  ],
  deferred: [
    {
      request_id: "ACQ-002",
      reasoning:
        "Schwab primary source confirmation would resolve a binary question but the null hypothesis holds — this is a lower priority than RLUSD chain breakdown. The Schwab announcement does not affect the settlement thesis core; it affects the financial product thesis component. One slot remaining, allocated to ACQ-001.",
      deferral_type: null,
      _source: "first_call",
      cross_cited: "ACQ-001",
      knowledge_gap: null,
    },
    {
      request_id: "ACQ-004",
      reasoning:
        "Zero slots remain this cycle after first-call approvals. This request directly addresses competitive displacement — whether XRPL's institutional tokenization share is near-zero or merely unreported. A consequential gap. Prioritized above ACQ-003 because competitive displacement is the inverse index whose convergence directly weakens the thesis.",
      deferral_type: "budget_constraint",
      _source: "retry",
      cross_cited: "ACQ-003",
      knowledge_gap: null,
    },
    {
      request_id: "ACQ-003",
      reasoning:
        "Zero slots remain this cycle. BOJ/MOF intervention preparation intelligence would resolve timing on the compound stress chain's most proximate cascade trigger, but ranks below ACQ-004 because intervention dynamics affect the thesis indirectly through macro stress transmission, whereas competitive chain distribution data addresses falsification directly. Tiebreaker is proximity to a falsification threshold.",
      deferral_type: "budget_constraint",
      _source: "retry",
      cross_cited: "ACQ-004",
      knowledge_gap:
        "The system cannot determine whether BOJ intervention success or failure would produce a larger second-order effect on institutional settlement demand than competitive displacement acceleration. It flagged this question and refused to guess.",
    },
  ],
}

interface Transaction {
  id: string
  hash: string
  amt: string
  vendor: string
  query: string
  rid: string
  status: string
  ts: string
  model: string
}

const rTxs: Transaction[] = [
  {
    id: "r1",
    hash: "B87B0D62FE63..451E8943",
    amt: "0.003 RLUSD",
    vendor: "BlockRun LLM",
    query: "RLUSD chain breakdown — redemptions vs transfers vs liquidity mgmt",
    rid: "ACQ-001",
    status: "confirmed",
    ts: "Apr 17 02:24 PM",
    model: "nvidia/gpt-oss-120b",
  },
  {
    id: "r2",
    hash: "4B30EE2A7F19..C8D4E501",
    amt: "0.005 RLUSD",
    vendor: "BlockRun LLM",
    query: "SBI Holdings XRPL integration status — institutional custody pipeline",
    rid: "ACQ-L3-04-16",
    status: "confirmed",
    ts: "Apr 16 09:23 PM",
    model: "claude-sonnet-4-20250514",
  },
  {
    id: "r3",
    hash: "DA877C43B291..7F3A0E82",
    amt: "0.003 RLUSD",
    vendor: "BlockRun LLM",
    query: "CBDC settlement layer competitive positioning — XRPL vs Ethereum L2s",
    rid: "ACQ-L3-04-15",
    status: "confirmed",
    ts: "Apr 15 09:11 AM",
    model: "nvidia/gpt-oss-120b",
  },
]

const wTxs: Transaction[] = [
  {
    id: "w1",
    hash: "0x7a3f8e21c4b9..d82e1f06",
    amt: "$0.01 USDC",
    vendor: "Chainlink CRE",
    query: "BTC/USD price verification — oracle consensus check",
    rid: "ACQ-CRE-001",
    status: "confirmed",
    ts: "Apr 17 02:15 PM",
    model: "price-alerts",
  },
  {
    id: "w2",
    hash: "0x2b91f4a8e7c3..a04b6d19",
    amt: "$0.01 USDC",
    vendor: "Chainlink CRE",
    query: "ETH/USD verified price feed — 24h VWAP cross-check",
    rid: "ACQ-CRE-002",
    status: "confirmed",
    ts: "Apr 16 08:45 PM",
    model: "price-alerts",
  },
]

interface DrillData {
  signal: {
    text: string
    anomaly: string
    severity: number
    confidence: string
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

const drill: Record<string, DrillData> = {
  "ACQ-001": {
    signal: {
      text: "14 signals ingested. 3 new. RLUSD market cap decline of $110M flagged as high-priority anomaly. DXY at 99.74, JPN 10Y at 2.274%.",
      anomaly: "RLUSD market cap: $110M decline in 72 hours",
      severity: 7,
      confidence: "LOW (0.35)",
    },
    gap: {
      text: "RLUSD decline cross-referenced against 4 historical patterns. No precedent for decline of this magnitude without corresponding redemption activity.",
      gap_identified: "Cause of $110M RLUSD decline unknown — redemptions, transfers, or liquidity management?",
      budget: "$0.218",
      slots: 1,
      sac1: { id: "ACQ-002", desc: "Schwab primary source confirmation", why: "Does not affect settlement thesis core." },
      sac2: { id: "ACQ-004", desc: "Competitive displacement quantification", why: "Zero slots remain. Deferred to next cycle." },
    },
    acquire: {
      vendor: "BlockRun LLM",
      model: "nvidia/gpt-oss-120b",
      amt: "0.003 RLUSD",
      chain: "XRPL Mainnet",
      hash: "B87B0D62FE63..451E8943",
      query: "RLUSD chain breakdown — redemptions vs transfers vs liquidity management",
    },
    correct: {
      old: "The $110M RLUSD market cap decline likely represents institutional redemptions signaling loss of confidence in the stablecoin product, directly threatening the settlement thesis via reduced on-chain liquidity.",
      new_r: "The $110M RLUSD decline is attributable to inter-wallet treasury rebalancing by a single institutional holder, not redemption activity. On-chain liquidity pools remain stable. No confidence signal detected.",
      cid: "Correction #67 logged",
    },
    outcome: {
      status: "SURVIVED",
      impact: "Prevented false threat escalation on two active tension points. Prior reasoning would have triggered a severity upgrade to CRITICAL based on incorrect redemption assumption. Verified data de-escalated both tensions.",
      threat: false,
      thesis: "MAINTAINED",
    },
  },
}

const rTel = { up: "48h 12m", last: "Apr 17 02:24 PM", acq: 13, spent: "0.041 RLUSD" }
const wTel = { up: "48h 12m", last: "Apr 17 02:15 PM", acq: 8, spent: "$0.08 USDC" }

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
  onClose: () => void
}

function Modal({ tx, onClose }: ModalProps) {
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
            <DataRow label="TX HASH" value={d.acquire.hash} color={C.slate} />
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
                  <span className="text-[11px] font-semibold" style={{ color: C.lavender }}>
                    {d.correct.cid}
                  </span>
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
      </div>
    </div>
  )
}

// ── Main Layout ─────────────────────────────────────────────────────
export default function AgentHub() {
  const [sel, setSel] = useState<Transaction | null>(null)
  const [modal, setModal] = useState<Transaction | null>(null)

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
            wallet="rPiok45Qs88..Cr9PnX5M"
            bal="14.9868"
            asset="RLUSD"
            txs={rTxs}
            tel={rTel}
            onTx={handleTxClick}
            sel={sel}
          />
          <Agent
            name="WORKFLOW AGENT"
            chain="base"
            wallet="0x7a3f..d82e1f06"
            bal="4.97"
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
            {bd.deferred.map((d) => (
              <div
                key={d.request_id}
                className="grid gap-1.5 py-1 items-start"
                style={{
                  gridTemplateColumns: "55px 55px 75px 1fr",
                  borderBottom: `1px solid ${C.row}`,
                }}
              >
                <span className="text-[10px] font-semibold" style={{ color: C.val }}>
                  {d.request_id}
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
                    <StatusBlock borderColor={C.lavender} label="KNOWLEDGE GAP">
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
                className="grid gap-1.5 py-1 items-start"
                style={{
                  gridTemplateColumns: "55px 55px 75px 1fr",
                  borderBottom: `1px solid ${C.row}`,
                }}
              >
                <span className="text-[10px] font-bold" style={{ color: C.olive }}>
                  {a.request_id}
                </span>
                <span className="text-[9px] font-bold" style={{ color: C.olive }}>
                  APPROVED
                </span>
                <span className="text-[9px] font-medium" style={{ color: C.lbl }}>
                  {a._source.toUpperCase()}
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
        UPTIME 48h 12m
      </div>

      <Modal tx={modal} onClose={() => { setModal(null); setSel(null); }} />
    </div>
  )
}
