/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Lock,
  MinusCircle,
  PlusCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { WorkflowState } from '../types';

interface ResponseComparisonProps {
  currentState: WorkflowState;
  baselineResponse: string;
  optimizedResponse?: string;
  activeScenarioId?: string;
}

type TabType = 'baseline' | 'optimized' | 'difference';

const scenarioContent: Record<string, {
  baselineText: string;
  baselineComment: string;
  optimizedText: string;
  optimizedComment: string;
  diffRows: Array<{ title: string; baseline: string; optimized: string }>;
}> = {
  'banking-policy-conflict': {
    baselineText: "Unfortunately, you are not eligible for an overdraft-fee waiver. Your current wire-transfer limit is $5,000.",
    baselineComment: "The agent formulation utilized outdated v2024 policy data instead of checking active Platinum tier criteria or verifying the latest 2026 registry limit.",
    optimizedText: "Yes, you are eligible for an overdraft-fee waiver! As a Platinum tier customer, you are eligible for one waiver every 90 days. Since your last waiver was 120 days ago, you qualify for this benefit. Additionally, your current wire-transfer limit is $10,000, as defined by the Current Consumer Banking Policy.",
    optimizedComment: "The agent has formulated a compliant, 100% correct response using exclusively verified current policy guidelines, completely stripping the unverified clutter.",
    diffRows: [
      {
        title: "Fee Waiver Eligibility",
        baseline: "Rejected eligibility (claimed \"no waivers allowed\")",
        optimized: "Confirmed eligibility (qualified under 90-day cycle)"
      },
      {
        title: "Wire-Transfer Limit",
        baseline: "Stated limit is $5,000 (Legacy 2024 criteria)",
        optimized: "Stated limit is $10,000 (Current 2026 criteria)"
      },
      {
        title: "Policy Document Dependency",
        baseline: "Archived Policy Registry (v2024.3)",
        optimized: "Current Consumer Policy Registry (v2026.1)"
      }
    ]
  },
  'mortgage-underwriting-conflict': {
    baselineText: "Based on archived underwriting rules, your maximum allowed Debt-to-Income (DTI) limit is 43%, and your home pre-approval request is declined because your DTI is currently 45%.",
    baselineComment: "The underwriting bot relied on legacy credit metrics and discarded active premier rate guidelines, leading to an incorrect rejection of a high-value client.",
    optimizedText: "Great news! You qualify for the home pre-approval loan program! Under the Current Underwriting Guidelines (v2026.4), applicant Sarah Jenkins is eligible for an expanded Debt-to-Income (DTI) ratio limit of up to 50% as a Premier tier member. Since your active back-end DTI ratio is verified at 45% (and supported by an excellent 780 credit score), your pre-approval request is officially approved for a balance of up to $750,000.",
    optimizedComment: "The agent has formulated a compliant, 100% correct response using exclusively verified current underwriting guidelines, completely stripping the unverified clutter.",
    diffRows: [
      {
        title: "Debt-to-Income (DTI) Cap",
        baseline: "Stated limit is 43% (Legacy 2023 guidelines)",
        optimized: "Expanded limit is 50% (Current 2026 guidelines)"
      },
      {
        title: "Home Pre-Approval State",
        baseline: "Declined based on outdated ratio limits",
        optimized: "Approved for $750,000 under Premier guidelines"
      },
      {
        title: "Policy Document Dependency",
        baseline: "Archived Underwriting Handbook (v2023.2)",
        optimized: "Current Underwriting Guidelines (v2026.4)"
      }
    ]
  },
  'corporate-policy-conflict': {
    baselineText: "Business class travel is strictly prohibited for all staff. Your nightly lodging expense is capped at $150.",
    baselineComment: "The bot misapplied general non-management constraints to an international executive itinerary, failing to refer to updated tiered city stipends.",
    optimizedText: "Yes, you are authorized to book a business class ticket for your flight from New York to London! Corporate Travel Policy (v2026.2) authorizes business class booking for international travel exceeding 6 hours, which applies to your 7.5-hour flight duration as a Vice President. Additionally, your nightly hotel stipend is verified at the updated City Tier 1 rate of $350.",
    optimizedComment: "The agent has formulated a compliant, 100% correct response using exclusively verified current travel guidelines, completely stripping the unverified clutter.",
    diffRows: [
      {
        title: "Flight Seating Tier",
        baseline: "Strictly prohibited (Standard Coach Class only)",
        optimized: "Business class authorized (VP international flight > 6 hrs)"
      },
      {
        title: "Nightly Hotel Stipend",
        baseline: "Capped at $150 (Outdated uniform cap)",
        optimized: "Verified at $350 (Updated City Tier 1 allowance)"
      },
      {
        title: "Policy Document Dependency",
        baseline: "Legacy Travel & Hotel Bylaws (v2022.1)",
        optimized: "Current Travel & Lodging Handbook (v2026.2)"
      }
    ]
  }
};

export const ResponseComparison: React.FC<ResponseComparisonProps> = ({
  currentState,
  baselineResponse,
  optimizedResponse = '',
  activeScenarioId = 'banking-policy-conflict'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('baseline');

  const isLoaded = currentState !== 'INITIAL' && currentState !== 'TRACE_LOADING';
  const isReplayed = currentState === 'REPLAYED';

  // Force active tab to baseline if not replayed yet
  const effectiveTab = isReplayed ? activeTab : 'baseline';

  const content = scenarioContent[activeScenarioId] || scenarioContent['banking-policy-conflict'];

  return (
    <div
      id="response-comparison-panel"
      className="rounded-xl border border-[#c5a059]/35 bg-[#fbfaf6] p-6 shadow-sm space-y-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#c5a059]/15 pb-3">
        <div>
          <h4 className="font-serif text-lg font-bold text-[#0f291e] flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#c5a059]" />
            Agent Response Comparison Ledger
          </h4>
          <p className="font-sans text-xs text-stone-500 mt-1">
            Compare the baseline incorrect response with the audited simulation output.
          </p>
        </div>

        {/* Tab Switcher - styled in gold and deep forest green */}
        <div className="flex rounded-lg bg-[#FAF7F0] border border-[#c5a059]/30 p-1 self-start lg:self-center">
          <button
            id="tab-baseline"
            onClick={() => setActiveTab('baseline')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer font-serif ${
              effectiveTab === 'baseline'
                ? 'bg-[#0f291e] text-[#f5f2eb] shadow-sm'
                : 'text-stone-500 hover:text-[#0f291e]'
            }`}
          >
            Baseline Run
          </button>
          
          <button
            id="tab-optimized"
            onClick={() => {
              if (isReplayed) setActiveTab('optimized');
            }}
            disabled={!isReplayed}
            className={`relative rounded-md px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer font-serif ${
              effectiveTab === 'optimized'
                ? 'bg-[#0f291e] text-[#f5f2eb] shadow-sm'
                : !isReplayed
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-stone-500 hover:text-[#0f291e]'
            }`}
          >
            {!isReplayed && <Lock className="h-3 w-3 text-stone-300" />}
            Optimized Replay
          </button>

          <button
            id="tab-difference"
            onClick={() => {
              if (isReplayed) setActiveTab('difference');
            }}
            disabled={!isReplayed}
            className={`relative rounded-md px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer font-serif ${
              effectiveTab === 'difference'
                ? 'bg-[#0f291e] text-[#f5f2eb] shadow-sm'
                : !isReplayed
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-stone-500 hover:text-[#0f291e]'
            }`}
          >
            {!isReplayed && <Lock className="h-3 w-3 text-stone-300" />}
            Bylaw Variance
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="min-h-[160px]">
        {effectiveTab === 'baseline' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-950 font-bold">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Stored Baseline Trace Output (Contradictory / Legacy Criteria Applied)
            </div>
            
            {isLoaded ? (
              <div className="rounded-xl bg-white border border-[#c5a059]/25 p-5 font-mono text-xs md:text-sm leading-relaxed text-stone-800 space-y-3 shadow-2xs">
                <p className="italic">
                  &ldquo;<span className="bg-red-100/50 text-red-950 font-medium px-1 py-0.5 rounded border border-red-200">{content.baselineText}</span>&rdquo;
                </p>
                <div className="pt-3 border-t border-stone-200 mt-4 text-[11px] text-stone-400 font-sans flex items-start gap-2">
                  <XCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                  <span>{content.baselineComment}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[#c5a059]/25 p-8 text-center text-stone-400 text-xs font-serif italic">
                Awaiting trace load. Click "Load Trace" to view baseline answer.
              </div>
            )}
          </div>
        )}

        {effectiveTab === 'optimized' && isReplayed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Replayed Agent Output (Correct Policy Applied via Optimized Context)
            </div>
            
            <div className="rounded-xl bg-white border border-[#c5a059]/25 p-5 font-mono text-xs md:text-sm leading-relaxed text-stone-800 space-y-3 shadow-2xs">
              <p className="italic">
                &ldquo;<span className="bg-emerald-50 text-emerald-950 font-medium px-1 py-0.5 rounded border border-emerald-200">{content.optimizedText}</span>&rdquo;
              </p>
              <div className="pt-3 border-t border-stone-200 mt-4 text-[11px] text-[#0f291e] font-sans flex items-start gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{content.optimizedComment}</span>
              </div>
            </div>
          </div>
        )}

        {effectiveTab === 'difference' && isReplayed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-[#FAF7F0] border border-[#c5a059]/30 p-3 text-xs text-stone-800 font-bold">
              Factual & Statement Deviations Found during Simulation
            </div>

            <div className="border border-[#c5a059]/25 rounded-xl overflow-hidden divide-y divide-[#c5a059]/20 text-xs shadow-2xs">
              {content.diffRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 p-4 gap-2 bg-white">
                  <div className="lg:col-span-3 font-serif font-bold text-[#0f291e]">{row.title}</div>
                  <div className="lg:col-span-4 flex items-center gap-1.5 text-red-800 font-medium">
                    <MinusCircle className="h-4 w-4 shrink-0 text-red-600" />
                    {row.baseline}
                  </div>
                  <div className="lg:col-span-5 flex items-center gap-1.5 text-emerald-800 font-bold">
                    <PlusCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                    {row.optimized}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResponseComparison;
