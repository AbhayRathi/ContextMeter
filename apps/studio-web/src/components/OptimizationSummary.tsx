/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { WorkflowState } from '../types';

interface OptimizationSummaryProps {
  currentState: WorkflowState;
}

export const OptimizationSummary: React.FC<OptimizationSummaryProps> = ({ currentState }) => {
  const isReplayed = currentState === 'REPLAYED';

  if (!isReplayed) {
    return null;
  }

  return (
    <div
      id="optimization-summary-section"
      className="rounded-xl border border-[#c5a059]/35 bg-[#FAF7F0] p-6 shadow-sm relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[#0f291e] border border-[#c5a059] px-2.5 py-0.5 text-[10px] font-bold text-[#fbfaf6] uppercase tracking-wider font-serif">
              <Sparkles className="h-3 w-3 text-[#c5a059]" />
              Optimization Audited
            </span>
            <span className="text-[10px] bg-stone-100 border border-stone-200 text-stone-700 px-2 py-0.5 rounded font-bold uppercase">
              Demonstration Ledger Result
            </span>
          </div>
          
          <h4 className="font-serif text-base font-bold text-[#0f291e] mt-1.5">
            ContextMeter pruned the prompt volume by half, preserving critical current clauses and boosting deterministic rule compliance.
          </h4>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-lg p-3 border border-[#c5a059]/25 shadow-2xs">
          <div className="text-[9px] uppercase font-bold text-stone-400">Clauses Retained</div>
          <div className="text-lg font-serif font-bold text-[#0f291e] mt-1">3 blocks</div>
          <div className="text-[9px] text-stone-400 mt-0.5">Verified authority</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-[#c5a059]/25 shadow-2xs">
          <div className="text-[9px] uppercase font-bold text-stone-400">Clauses Removed</div>
          <div className="text-lg font-serif font-bold text-red-800 mt-1">3 blocks</div>
          <div className="text-[9px] text-stone-400 mt-0.5">Clutter & legacy policy</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-[#c5a059]/25 shadow-2xs">
          <div className="text-[9px] uppercase font-bold text-stone-400">Action: Update</div>
          <div className="text-lg font-serif font-bold text-stone-600 mt-1">0 blocks</div>
          <div className="text-[9px] text-stone-400 mt-0.5">Up-to-date in registry</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-[#c5a059]/25 shadow-2xs">
          <div className="text-[9px] uppercase font-bold text-stone-400">Token Reduction</div>
          <div className="text-lg font-serif font-bold text-[#0f291e] mt-1">-55.7%</div>
          <div className="text-[9px] text-stone-400 mt-0.5">~1,030 tokens saved</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-[#c5a059]/25 shadow-2xs">
          <div className="text-[9px] uppercase font-bold text-stone-400">Inconsistencies Solved</div>
          <div className="text-lg font-serif font-bold text-[#0f291e] mt-1">2 rules</div>
          <div className="text-[9px] text-stone-400 mt-0.5">100% resolution rate</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-[#c5a059]/25 shadow-2xs">
          <div className="text-[9px] uppercase font-bold text-stone-400">Compliance Shift</div>
          <div className="text-lg font-serif font-bold text-[#0f291e] mt-1">2/6 → 6/6</div>
          <div className="text-[9px] text-stone-400 mt-0.5">+200% compliance</div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-stone-800 font-medium">
        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-[#c5a059] mt-0.5" />
        <p>
          <span className="font-serif font-bold text-[#0f291e]">Sovereign audit summary:</span> Chronological filtering successfully isolated and purged the stale 2024 bylaws. Promotional and duplicate files were cleanly discarded, decreasing payload volume. The resulting streamlined context directed the model to issue a 100% compliant overdraft fee waiver response.
        </p>
      </div>
    </div>
  );
};
export default OptimizationSummary;
