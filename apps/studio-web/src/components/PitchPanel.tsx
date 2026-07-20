/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, HelpCircle, Layers, Award } from 'lucide-react';

export const PitchPanel: React.FC = () => {
  return (
    <div
      id="pitch-insight-panel"
      className="rounded-xl border border-[#c5a059]/40 bg-[#fbfaf6] p-6 shadow-sm space-y-5 relative overflow-hidden"
    >
      {/* Decorative old-money watermark circle */}
      <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full border-2 border-[#c5a059]/10 pointer-events-none flex items-center justify-center">
        <div className="h-20 w-20 rounded-full border border-[#c5a059]/10" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f291e] text-[#e5dfd3] border border-[#c5a059]/50 shadow-sm">
          <Award className="h-4.5 w-4.5" />
        </div>
        <div>
          <h4 className="font-serif text-sm font-bold uppercase tracking-widest text-[#0f291e]">
            Sovereign Value & Philosophy
          </h4>
          <p className="font-sans text-[10px] uppercase tracking-wider text-[#c5a059] font-semibold">
            ContextMeter Registry Standards
          </p>
        </div>
      </div>

      {/* Simplified, elegant layout with fewer separate boxes and more editorial prose */}
      <div className="space-y-4 divide-y divide-[#c5a059]/20 pt-1 text-stone-800">
        
        {/* The Observability Problem */}
        <div className="space-y-1.5 pt-0">
          <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[#0f291e] italic">
            <span className="h-1.5 w-1.5 rounded-full bg-red-700" />
            The Observability Problem
          </div>
          <p className="font-sans text-[11px] text-stone-600 leading-relaxed pl-3">
            Traditional pipelines inspect final agent outputs, yet fail to isolate the exact, high-cost context block that triggered the error, legacy citation, or financial hallucination.
          </p>
        </div>

        {/* The Sovereign Intervention */}
        <div className="space-y-1.5 pt-3">
          <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[#0f291e] italic">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
            The Sovereign Intervention
          </div>
          <p className="font-sans text-[11px] text-stone-600 leading-relaxed pl-3">
            ContextMeter maps raw inputs, discards stale 2024 policy clutter, resolves overlapping contradictions, and performs a counterfactual simulation to verify complete pipeline safety.
          </p>
        </div>

        {/* Absolute Distinction */}
        <div className="space-y-1.5 pt-3">
          <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[#0f291e] italic">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
            Absolute Distinction
          </div>
          <p className="font-sans text-[11px] text-stone-900 font-semibold leading-relaxed pl-3">
            Generic platforms record <span className="underline decoration-[#c5a059]/40">what occurred</span>. ContextMeter models <span className="text-[#0f291e] font-bold bg-[#FAF7F0] border border-[#c5a059]/25 px-1.5 py-0.5 rounded">what would have occurred</span> had the context been pristine.
          </p>
        </div>

      </div>
    </div>
  );
};
export default PitchPanel;
