/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, Calendar, MessageSquare, Terminal, User } from 'lucide-react';
import { Scenario } from '../types';

interface ScenarioHeaderProps {
  scenario: Scenario | null;
}

export const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({ scenario }) => {
  if (!scenario) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#c5a059]/30 bg-[#fbfaf6] p-6 text-center shadow-sm">
        <p className="text-xs font-serif font-bold uppercase tracking-wider text-stone-500">
          No active ledger case loaded. Initiate "Load Trace" to begin audit.
        </p>
      </div>
    );
  }

  return (
    <div
      id="scenario-header"
      className="rounded-xl border border-[#c5a059]/35 bg-[#fbfaf6] p-6 shadow-sm transition-all"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        
        {/* Left column: Name, details & risk category */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-[10px] font-bold tracking-widest uppercase text-[#0f291e] bg-[#FAF7F0] border border-[#c5a059]/30 px-2 py-0.5 rounded">
                Audit Case Case-Study
              </span>
              <span className="text-xs text-[#c5a059]">•</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Sovereign Record</span>
            </div>
            
            <h3 className="font-serif text-2xl font-bold text-[#0f291e] mt-1.5">
              {scenario.name}
            </h3>
          </div>

          {/* Grid of badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-md bg-[#FAF7F0] px-3 py-2 border border-[#e6dfcc]">
              <User className="h-4 w-4 text-[#c5a059] shrink-0" />
              <div>
                <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest leading-none">Target Division</div>
                <div className="text-xs font-bold text-stone-700 mt-0.5">{scenario.category}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-[#FAF7F0] px-3 py-2 border border-[#e6dfcc]">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest leading-none">Exposure Risk</div>
                <div className="text-xs font-bold text-stone-700 mt-0.5">{scenario.riskType}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-[#FAF7F0] px-3 py-2 border border-[#e6dfcc]">
              <Terminal className="h-4 w-4 text-[#0f291e] shrink-0" />
              <div>
                <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest leading-none">Registry Reference</div>
                <div className="text-xs font-mono font-semibold text-stone-700 mt-0.5">{scenario.traceId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Extra metadata when loaded */}
        <div className="flex flex-col gap-1.5 border-t border-stone-200 pt-3 lg:border-t-0 lg:pt-0 text-left lg:text-right shrink-0">
          <div className="text-xs text-stone-500 flex items-center lg:justify-end gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#c5a059]" />
            <span className="font-medium">Executed: {new Date(scenario.timestamp).toLocaleString()}</span>
          </div>
          <div className="text-xs text-stone-500">
            Assigned Core Engine: <span className="font-mono text-stone-700 font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200">{scenario.modelName}</span>
          </div>
        </div>
      </div>

      {/* Customer Request Statement Section */}
      <div className="mt-5 border-t border-[#c5a059]/20 pt-4 bg-[#FAF7F0]/85 -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
        <div className="flex items-start gap-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f291e] text-[#e5dfd3] shrink-0 border border-[#c5a059]/40 shadow-xs mt-0.5">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#c5a059]">Telemetry Query Context</div>
            <p className="font-serif text-sm md:text-base font-medium text-stone-900 italic leading-relaxed">
              &ldquo;{scenario.customerRequest}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
