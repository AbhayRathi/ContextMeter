/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Calendar, ArrowRightLeft, Check, CheckCircle2 } from 'lucide-react';
import { ContextConflict } from '../types';

interface ConflictPanelProps {
  conflicts: ContextConflict[];
  isAnalyzed: boolean;
}

export const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts, isAnalyzed }) => {
  if (!isAnalyzed) {
    return (
      <div id="conflict-panel" className="rounded-xl border-2 border-dashed border-[#c5a059]/30 bg-[#fbfaf6] p-8 text-center shadow-xs">
        <ShieldAlert className="h-8 w-8 text-[#c5a059] mx-auto mb-2.5" />
        <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#0f291e]">Contradiction Audit Pending</h4>
        <p className="font-sans text-xs text-stone-500 mt-1.5 max-w-md mx-auto">
          Execute the "Audit Facts" procedure to cross-reference multiple documents and map conflicting policy thresholds.
        </p>
      </div>
    );
  }

  return (
    <div id="conflict-panel" className="rounded-xl border border-[#c5a059]/35 bg-[#fbfaf6] p-6 shadow-sm space-y-5">
      <div>
        <h4 className="font-serif text-lg font-bold text-[#0f291e] flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-[#c5a059]" />
          Resolved Fact Contradictions ({conflicts.length})
        </h4>
        <p className="font-sans text-xs text-stone-500 mt-1">
          Scanners isolated contradictory parameters in retrieve payloads. Resolved by applying chronological and temporal bylaws.
        </p>
      </div>

      <div className="space-y-5">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            id={`conflict-card-${conflict.id}`}
            className="rounded-xl border border-[#c5a059]/30 bg-white overflow-hidden shadow-2xs"
          >
            {/* Header: Title and Severity */}
            <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#c5a059]/25 flex items-center justify-between">
              <span className="font-serif text-xs font-bold text-stone-800">
                Conflict Theme: <span className="text-[#0f291e] font-serif font-extrabold italic">{conflict.title}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-red-100/80 border border-red-200 px-2.5 py-0.5 text-[9px] font-bold text-red-900 uppercase tracking-wider">
                {conflict.severity} SEVERITY
              </span>
            </div>

            {/* Comparison Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#c5a059]/20">
              
              {/* Option B: Outdated 2024 policy */}
              <div className="p-4 bg-stone-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif text-[10px] uppercase font-bold text-red-700 tracking-wider">
                    Superseded Source
                  </span>
                  <span className="font-sans text-[10px] text-stone-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Effective 2024
                  </span>
                </div>
                <div className="font-sans text-xs text-stone-500 truncate mb-1">
                  File: {conflict.blockB.source}
                </div>
                <div className="font-mono text-xs font-semibold text-red-900 line-through bg-red-50/40 p-2.5 rounded border border-red-100">
                  {conflict.blockB.value}
                </div>
                <div className="mt-2 text-[10px] text-stone-400 italic">
                  ❌ Overrides newer active parameters (discarded)
                </div>
              </div>

              {/* Option A: Current 2026 policy */}
              <div className="p-4 bg-emerald-50/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1 tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Sovereign Source Authority
                  </span>
                  <span className="font-sans text-[10px] text-stone-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Effective 2026
                  </span>
                </div>
                <div className="font-sans text-xs text-stone-500 truncate mb-1">
                  File: {conflict.blockA.source}
                </div>
                <div className="font-mono text-xs font-bold text-emerald-900 bg-[#133c2b]/10 p-2.5 rounded border border-emerald-200">
                  {conflict.blockA.value}
                </div>
                <div className="mt-2 text-[10px] text-emerald-700 font-semibold">
                  ✓ Verified active parameter in optimized context (used)
                </div>
              </div>
            </div>

            {/* Recommendation Footer */}
            <div className="bg-[#faf7f0] border-t border-[#c5a059]/20 p-3.5 flex items-start gap-2.5 text-xs text-stone-800">
              <Check className="h-4.5 w-4.5 shrink-0 text-[#c5a059] mt-0.5" />
              <div>
                <span className="font-serif font-bold text-[#0f291e]">Resolution Standard:</span> {conflict.recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ConflictPanel;
