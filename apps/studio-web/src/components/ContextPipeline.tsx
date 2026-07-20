/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  MessageSquareCode,
  FolderInput,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { WorkflowState } from '../types';

interface ContextPipelineProps {
  currentState: WorkflowState;
}

export const ContextPipeline: React.FC<ContextPipelineProps> = ({ currentState }) => {
  const isLoaded = currentState !== 'INITIAL' && currentState !== 'TRACE_LOADING';
  const isAnalyzed =
    currentState === 'ANALYZED' ||
    currentState === 'OPTIMIZATION_APPLIED' ||
    currentState === 'REPLAYING' ||
    currentState === 'REPLAYED';
  const isOptimized =
    currentState === 'OPTIMIZATION_APPLIED' ||
    currentState === 'REPLAYING' ||
    currentState === 'REPLAYED';
  const isReplayed = currentState === 'REPLAYED';

  return (
    <div
      id="context-pipeline-visualization"
      className="rounded-xl border border-[#c5a059]/35 bg-[#fbfaf6] p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-5 border-b border-[#c5a059]/15 pb-2.5">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#0f291e] font-serif">
          Observed Agent Pipeline Architecture
        </h4>
        <span className="text-[10px] bg-[#FAF7F0] border border-[#c5a059]/30 text-stone-600 font-serif font-bold px-2.5 py-1 rounded-lg">
          Baseline vs. Active Optimization
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-11 lg:items-center">
        {/* Node 1: User Request */}
        <div className="lg:col-span-2 flex flex-col items-center p-4 rounded-xl border border-[#c5a059]/25 bg-white shadow-2xs">
          <MessageSquareCode className="h-5 w-5 text-stone-500 mb-1.5" />
          <div className="text-xs font-serif font-bold text-[#0f291e] text-center">User Query</div>
          <div className="text-[9px] text-stone-400 mt-0.5 text-center leading-none">Formulates Request</div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex justify-center text-[#c5a059]">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Node 2: Retrieved Context */}
        <div className={`lg:col-span-2 flex flex-col items-center p-4 rounded-xl border transition-all duration-300 shadow-2xs ${
          isLoaded ? 'border-[#c5a059] bg-[#FAF7F0] text-[#0f291e]' : 'border-stone-200 bg-white text-stone-400'
        }`}>
          <FolderInput className={`h-5 w-5 mb-1.5 ${isLoaded ? 'text-[#c5a059]' : 'text-stone-400'}`} />
          <div className="text-xs font-serif font-bold text-center">Retrieved Context</div>
          <div className="text-[9px] mt-0.5 text-center leading-none">
            {isLoaded ? '6 Blocks (Inconsistencies)' : 'Awaiting Load'}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex justify-center text-[#c5a059]">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Node 3: ContextMeter Intervention (Active Middle) */}
        <div className={`lg:col-span-3 flex flex-col items-center p-4 rounded-xl border transition-all duration-300 shadow-sm ${
          isAnalyzed
            ? 'border-[#c5a059] bg-[#0f291e] text-[#f5f2eb]'
            : 'border-stone-200 bg-white text-stone-400'
        }`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers className={`h-5 w-5 ${isAnalyzed ? 'text-[#c5a059] animate-pulse' : 'text-stone-400'}`} />
            <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${isAnalyzed ? 'bg-[#c5a059]/20 text-[#c5a059]' : 'bg-stone-100 text-stone-400'}`}>
              Audit
            </span>
          </div>
          <div className="text-xs font-serif font-bold text-center">ContextMeter Scan</div>
          <div className="text-[9px] mt-0.5 text-center leading-none opacity-90">
            {isAnalyzed ? 'Isolated Fact Clutter & Contradictions' : 'Diagnostic Pending'}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex justify-center text-[#c5a059]">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Node 4: Optimized Context */}
        <div className={`lg:col-span-2 flex flex-col items-center p-4 rounded-xl border transition-all duration-300 shadow-2xs ${
          isOptimized
            ? 'border-[#c5a059] bg-[#FAF7F0] text-[#0f291e]'
            : 'border-stone-200 bg-white text-stone-400'
        }`}>
          <Sparkles className={`h-5 w-5 mb-1.5 ${isOptimized ? 'text-[#c5a059]' : 'text-stone-400'}`} />
          <div className="text-xs font-serif font-bold text-center">Optimized Context</div>
          <div className="text-[9px] mt-0.5 text-center leading-none">
            {isOptimized ? '3 Retained (Pruned Clutter)' : 'Awaiting Filter'}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex justify-center text-[#c5a059]">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Node 5: Replayed Response */}
        <div className={`lg:col-span-2 flex flex-col items-center p-4 rounded-xl border transition-all duration-300 shadow-sm ${
          isReplayed
            ? 'border-[#c5a059] bg-[#0f291e] text-[#f5f2eb]'
            : 'border-stone-200 bg-white text-stone-400'
        }`}>
          <CheckCircle2 className={`h-5 w-5 mb-1.5 ${isReplayed ? 'text-[#c5a059]' : 'text-stone-400'}`} />
          <div className="text-xs font-serif font-bold text-center">Verified Replay</div>
          <div className="text-[9px] mt-0.5 text-center leading-none opacity-90">
            {isReplayed ? '100% Compliant Response' : 'Unexecuted'}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContextPipeline;
