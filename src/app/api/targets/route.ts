import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Transaction {
  id: string;
  hash: string;
  fullHash: string | null;
  amt: string;
  vendor: string;
  query: string;
  rid: string;
  status: string;
  ts: string;
  model: string;
}

interface DrillData {
  signal: {
    text: string;
    anomaly: string;
    severity: number;
    confidence: string;
    signal_ids?: string[];
    signal_descriptions?: Array<{
      lineage_id: string;
      canonical_name: string;
      signal_id: string;
      l1_evidence: string | null;
    }>;
  };
  gap: {
    text: string;
    gap_identified: string;
    budget: string;
    slots: number;
    sac1: { id: string; desc: string; why: string } | null;
    sac2: { id: string; desc: string; why: string } | null;
  };
  acquire: {
    vendor: string;
    model: string | null;
    amt: string;
    chain: string;
    hash: string;
    fullHash: string | null;
    query: string;
  };
  correct: {
    old: string | null;
    new_r: string | null;
    cid: string | null;
    reasoning_diff: Array<{ value: string; added?: boolean; removed?: boolean }> | null;
    corrections_hydrated: Array<{
      id: string;
      belief: string;
      reality: string;
      root_cause: string;
      root_cause_type: string;
      lesson: string;
      trigger: string;
      lesson_type: string;
      confidence_in_lesson: string;
      status: string;
    }>;
    all_matches: Array<{
      lineage_id: string;
      canonical_name: string;
      signal_id: string;
      reasoning_diff: Array<{ value: string; added?: boolean; removed?: boolean }>;
      corrections_applied: Array<any>;
      old_reasoning: string;
      new_reasoning: string;
    }>;
  };
  outcome: {
    status: string;
    statusLabel: string;
    investigation: string;
    verdictLine: string;
    preventedLine: string;
  };
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${month} ${day} ${h12}:${minutes} ${ampm}`;
}

function truncateHash(hash: string | null): string {
  if (!hash) return '—';
  if (hash.length <= 20) return hash;
  return hash.slice(0, 12) + '..' + hash.slice(-8);
}

function deriveDeferralType(deferralType: string | null | undefined, reasoning: string | null | undefined): string {
  if (deferralType && deferralType.trim() !== '') return deferralType;
  const r = (reasoning || '').toLowerCase();
  if (r.includes('duplicate') || r.includes('same question')) return 'DUPLICATE';
  if (r.includes('0 of') || r.includes('assessable') || r.includes('insufficient')) return 'DATA_GAP';
  if (r.includes('budget') || r.includes('allowance') || r.includes('cost')) return 'BUDGET';
  if (r.includes('priority') || r.includes('lower') || r.includes('rank')) return 'PRIORITY';
  return 'DEFERRED';
}

const VENDOR_DISPLAY_MAP: Record<string, string> = {
  'chainlink_cre': 'XRPL Ledger',
  'blockrun_llm': 'BlockRun',
  'firecrawl': 'Firecrawl',
  'messari': 'Messari',
};

function mapVendor(raw: string | null | undefined): string {
  if (!raw) return '—';
  return VENDOR_DISPLAY_MAP[raw] || raw;
}

function formatAmount(tx: any): string {
  if (tx.chain === 'xrpl') {
    const amt = tx.amount || tx.cost_usd_actual || 0;
    return `${amt} RLUSD`;
  }
  if (tx.chain === 'base') {
    const amt = tx.amount || tx.cost_usd_actual || 0;
    return `$${amt} USDC`;
  }
  return '—';
}

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'agent-hub-payload.json');

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({ error: 'Payload not found. Run generate-hub-payload.js first.' }, { status: 404 });
    }

    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const txs = raw.transactions || [];
    const budgetDelib = raw.latest_budget_deliberation || null;
    const assessment = raw.latest_assessment || null;

    // ── Build bd (budget deliberation for header + triage ledger) ──
    const bd = budgetDelib ? {
      cycle_allowance_usd: budgetDelib.cycle_allowance_usd ?? 0,
      cycle_slots_available: budgetDelib.cycle_slots_available ?? 0,
      approved_count: budgetDelib.approved_count ?? 0,
      deferred_count: budgetDelib.deferred_count ?? 0,
      denied_count: budgetDelib.denied_count ?? 0,
      approved: (budgetDelib.approved || []).map((a: any, aIndex: number) => ({
        request_id: a.request_id,
        reasoning: a.reasoning || '',
        estimated_cost_usd: a.estimated_cost_usd ?? 0,
        _source: a._source || 'first_call',
        rank: aIndex + 1,
      })),
      deferred: (budgetDelib.deferred || []).map((d: any, dIndex: number) => ({
        request_id: d.request_id,
        reasoning: d.reasoning || '',
        deferral_type: deriveDeferralType(d.deferral_type, d.reasoning),
        _source: d._source || 'first_call',
        cross_cited: d.cross_cited_request_ids && d.cross_cited_request_ids.length > 0
          ? d.cross_cited_request_ids[0]
          : null,
        knowledge_gap: d.knowledge_gap_named || null,
        description: d.description || null,
        signal_ids: d.signal_ids || [],
        signal_descriptions: d.signal_descriptions || [],
        rank: dIndex + 1 + (budgetDelib.approved || []).length,
      })),
      denied: (budgetDelib.denied || []).map((n: any) => ({
        request_id: n.request_id,
        reasoning: n.reasoning || '',
        description: n.description || null,
        signal_ids: n.signal_ids || [],
        signal_descriptions: n.signal_descriptions || [],
        _source: n._source || 'first_call',
        rank: null,
      })),
      knowledge_gaps_named_during_ranking: budgetDelib.knowledge_gaps_named_during_ranking || [],
    } : null;

    // ── Split transactions by agent into rTxs / wTxs ──
    const rTxs: Transaction[] = [];
    const wTxs: Transaction[] = [];

    for (const t of txs) {
      const shaped: Transaction = {
        id: t.request_id || '',
        hash: truncateHash(t.tx_hash),
        fullHash: t.tx_hash || null,
        amt: formatAmount(t),
        vendor: mapVendor(t.vendor),
        query: t.description || '—',
        rid: t.request_id || '',
        status: t.response_status || 'confirmed',
        ts: formatTimestamp(t.executed_at),
        model: t.model || '—',
      };
      if (t.agent === 'research-agent') {
        rTxs.push(shaped);
      } else if (t.agent === 'workflow-agent') {
        wTxs.push(shaped);
      }
    }

    // ── Build telemetry per agent ──
    const buildTel = (agentTxs: Transaction[], rawTxs: any[], asset: string) => {
      const totalSpent = rawTxs.reduce((sum: number, t: any) => sum + (t.amount || t.cost_usd_actual || 0), 0);
      const lastTs = agentTxs.length > 0 ? agentTxs[0].ts : '—';
      return {
        up: '—',
        last: lastTs,
        acq: agentTxs.length,
        spent: asset === 'RLUSD' ? `${totalSpent.toFixed(3)} RLUSD` : `$${totalSpent.toFixed(2)} USDC`,
      };
    };

    const rawResearch = txs.filter((t: any) => t.agent === 'research-agent');
    const rawWorkflow = txs.filter((t: any) => t.agent === 'workflow-agent');
    const rTel = buildTel(rTxs, rawResearch, 'RLUSD');
    const wTel = buildTel(wTxs, rawWorkflow, 'USDC');

    // ── Build drill records per request_id ──
    const drill: Record<string, DrillData> = {};

    for (const t of txs) {
      const rid = t.request_id;
      if (!rid) continue;

      drill[rid] = {
        signal: {
          text: t.signal_descriptions && t.signal_descriptions.length > 0
            ? t.signal_descriptions.map((s: { canonical_name: string }) => s.canonical_name).join(' / ')
            : (t.signal_ids && t.signal_ids.length > 0
              ? `${t.signal_ids.length} signals linked to this acquisition request.`
              : 'Signal data ingested.'),
          anomaly: t.description || 'Anomaly detected',
          severity: t.expected_impact_score || 5,
          confidence: t.l3_confidence_data_exists || 'MEDIUM',
          signal_ids: t.signal_ids || [],
          signal_descriptions: t.signal_descriptions || [],
        },
        gap: {
          text: t.l3_impact_on_analysis || 'Knowledge gap identified.',
          gap_identified: t.description || 'Insufficient data.',
          budget: budgetDelib ? `$${budgetDelib.cycle_allowance_usd}` : '—',
          slots: budgetDelib ? budgetDelib.cycle_slots_available : 0,
          sac1: null,
          sac2: null,
        },
        acquire: (() => {
          const normalizedChain = t.chain === 'xrpl' ? 'XRPL Mainnet' : t.chain === 'base' ? 'Base Sepolia' : '—';
          const vendor = mapVendor(t.vendor);
          const rawModel = t.model;
          const model = (!rawModel || rawModel === '' || rawModel === '—') ? null : rawModel;
          return {
            vendor,
            model,
            amt: formatAmount(t),
            chain: normalizedChain,
            hash: truncateHash(t.tx_hash),
            fullHash: t.tx_hash || null,
            query: t.description || '—',
          };
        })(),
        correct: (() => {
          const cd = t.correct_data;
          if (cd?.has_correction && Array.isArray(cd.matches) && cd.matches.length > 0) {
            const match = cd.matches[0];
            const firstCid = match.corrections_applied?.[0]?.id ?? null;
            return {
              old: match.old_reasoning ?? null,
              new_r: match.new_reasoning ?? null,
              cid: firstCid,
              reasoning_diff: match.reasoning_diff ?? null,
              corrections_hydrated: match.corrections_applied ?? [],
              all_matches: cd.matches,
            };
          }
          return {
            old: null,
            new_r: null,
            cid: null,
            reasoning_diff: null,
            corrections_hydrated: [],
            all_matches: [],
          };
        })(),
        outcome: {
          status: t.outcome || 'PENDING',
          statusLabel: (() => {
            const s = t.outcome || 'PENDING';
            const corrected = t.correct_data?.has_correction && t.correct_data?.matches?.length > 0;
            if (s === 'SURVIVED') return 'Acquired data survived all four analytical layers — the system changed its reasoning';
            if (s === 'CONFIRMED' && corrected) return 'Acquired data verified the assessment and triggered corrections that refined the analysis';
            if (s === 'CONFIRMED') return 'Acquired data verified existing assessment — no correction needed';
            if (s === 'NO_CHANGE' && corrected) return 'Acquired data corrected the analysis — prevented a scoring error without changing the thesis direction';
            if (s === 'NO_CHANGE') return 'Acquired data did not materially change the assessment';
            return 'Awaiting pipeline integration';
          })(),
          investigation: t.l3_impact_on_analysis || t.outcome_evidence || t.description || 'No investigation context available.',
          verdictLine: `Thesis: ${t.verdict_thesis_status || '—'} · Confidence: ${(t.verdict_confidence || '—').toUpperCase()} · Action: ${(t.verdict_action_recommendation || '—').replace(/_/g, ' ')}`,
          preventedLine: (() => {
            const status = t.outcome || 'PENDING';
            if (status === 'NO_CHANGE') {
              return 'Acquisition confirmed the existing assessment. No reasoning change required.';
            }
            if (status === 'CONFIRMED' || status === 'SURVIVED') {
              const hasPrior = t.prior_thesis_status || t.prior_confidence || t.prior_action_recommendation;
              const hasCurrent = t.verdict_thesis_status || t.verdict_confidence || t.verdict_action_recommendation;
              if (!hasPrior || !hasCurrent) {
                return 'Prior cycle data unavailable for comparison.';
              }
              const thesisChanged = t.prior_thesis_status !== t.verdict_thesis_status;
              const confidenceChanged = t.prior_confidence !== t.verdict_confidence;
              const actionChanged = t.prior_action_recommendation !== t.verdict_action_recommendation;
              if (thesisChanged || confidenceChanged || actionChanged) {
                const parts: string[] = [];
                if (thesisChanged) {
                  parts.push(`Acquired data shifted the thesis from ${t.prior_thesis_status || '—'} to ${t.verdict_thesis_status || '—'}.`);
                }
                if (confidenceChanged) {
                  parts.push(`Confidence moved from ${t.prior_confidence || '—'} to ${t.verdict_confidence || '—'}.`);
                }
                if (actionChanged) {
                  parts.push(`Action changed from ${(t.prior_action_recommendation || '—').replace(/_/g, ' ')} to ${(t.verdict_action_recommendation || '—').replace(/_/g, ' ')}.`);
                }
                return parts.join(' ');
              }
              if (status === 'CONFIRMED') {
                return `Acquired data verified the current assessment. Thesis: ${t.verdict_thesis_status || '—'} at ${t.verdict_confidence || '—'} confidence. The system confirmed its position before acting.`;
              }
              return 'Acquired data challenged the assessment but the thesis survived. The system tested its own reasoning and held.';
            }
            return 'Prior cycle data unavailable for comparison.';
          })(),
        },
      };
    }

    // ── Assemble response ──
    return NextResponse.json({
      bd,
      rTxs,
      wTxs,
      rTel,
      wTel,
      drill,
      assessment,
      _generated_at: raw._generated_at,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
