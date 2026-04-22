import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Transaction {
  id: string;
  hash: string;
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
    model: string;
    amt: string;
    chain: string;
    hash: string;
    query: string;
  };
  correct: {
    old: string | null;
    new_r: string | null;
    cid: string | null;
  };
  outcome: {
    status: string;
    impact: string;
    threat: boolean;
    thesis: string;
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
      approved: (budgetDelib.approved || []).map((a: any) => ({
        request_id: a.request_id,
        reasoning: a.reasoning || '',
        estimated_cost_usd: a.estimated_cost_usd ?? 0,
        _source: a._source || 'first_call',
      })),
      deferred: (budgetDelib.deferred || []).map((d: any) => ({
        request_id: d.request_id,
        reasoning: d.reasoning || '',
        deferral_type: d.deferral_type || null,
        _source: d._source || 'first_call',
        cross_cited: d.cross_cited_request_ids && d.cross_cited_request_ids.length > 0
          ? d.cross_cited_request_ids[0]
          : null,
        knowledge_gap: d.knowledge_gap_named || null,
      })),
      denied: (budgetDelib.denied || []).map((n: any) => ({
        request_id: n.request_id,
        reasoning: n.reasoning || '',
        _source: n._source || 'first_call',
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
        amt: formatAmount(t),
        vendor: t.vendor || '—',
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
          text: t.signal_ids && t.signal_ids.length > 0
            ? `${t.signal_ids.length} signals linked to this acquisition request.`
            : 'Signal data ingested.',
          anomaly: t.description || 'Anomaly detected',
          severity: t.expected_impact_score || 5,
          confidence: t.l3_confidence_data_exists || 'MEDIUM',
          signal_ids: t.signal_ids || [],
        },
        gap: {
          text: t.l3_impact_on_analysis || 'Knowledge gap identified.',
          gap_identified: t.description || 'Insufficient data.',
          budget: budgetDelib ? `$${budgetDelib.cycle_allowance_usd}` : '—',
          slots: budgetDelib ? budgetDelib.cycle_slots_available : 0,
          sac1: null,
          sac2: null,
        },
        acquire: {
          vendor: t.vendor || '—',
          model: t.model || '—',
          amt: formatAmount(t),
          chain: t.chain === 'xrpl' ? 'XRPL Mainnet' : t.chain === 'base' ? 'Base Mainnet' : '—',
          hash: truncateHash(t.tx_hash),
          query: t.description || '—',
        },
        correct: {
          old: null,
          new_r: null,
          cid: null,
        },
        outcome: {
          status: t.outcome || 'PENDING',
          impact: t.outcome_evidence || 'Awaiting pipeline integration.',
          threat: false,
          thesis: assessment ? assessment.thesis_status : '—',
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
