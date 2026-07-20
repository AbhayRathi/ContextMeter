/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ClipboardCheck,
  Cpu,
  RefreshCw,
  Sparkles,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { WorkflowState } from '../types';

interface WorkflowControlsProps {
  currentState: WorkflowState;
  onLoadTrace: () => void;
  onAnalyzeContext: () => void;
  onApplyOptimization: () => void;
  onReplayAgent: () => void;
  onReset: () => void;
  errorMessage: string | null;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  currentState,
  onLoadTrace,
  onAnalyzeContext,
  onApplyOptimization,
  onReplayAgent,
  onReset,
  errorMessage
}) => {
  // Determine state-based enable/disable settings
  const isTraceLoading = currentState === 'TRACE_LOADING';
  const isAnalyzing = currentState === 'ANALYZING';
  const isReplaying = currentState === 'REPLAYING';

  // State guards
  const canLoadTrace =
    currentState === 'INITIAL' ||
    currentState === 'TRACE_LOADED' ||
    currentState === 'ANALYZED' ||
    currentState === 'OPTIMIZATION_APPLIED' ||
    currentState === 'REPLAYED' ||
    currentState === 'ERROR';

  const canAnalyze = currentState === 'TRACE_LOADED';
  const canOptimize = currentState === 'ANALYZED';
  const canReplay = currentState === 'OPTIMIZATION_APPLIED';

  return (
    <div
      id="workflow-controls"
      className="rounded-xl border border-[#c5a059]/35 bg-[#fbfaf6] p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-3">
        <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-[#0f291e]">
          Sovereign Registry Control Console
        </h4>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#c5a059] animate-pulse" />
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
            Operator Ledger Panel
          </span>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Ingest Failed Trace */}
        <button
          id="btn-load-trace"
          onClick={onLoadTrace}
          disabled={!canLoadTrace || isTraceLoading}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 px-4 text-xs font-serif uppercase tracking-wider shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c5a059] ${
            isTraceLoading
              ? 'bg-[#faf7f0] text-stone-400 border border-[#e6dfcc] cursor-not-allowed'
              : canLoadTrace
              ? 'bg-[#0f291e] text-[#f5f2eb] hover:bg-[#143929] active:bg-[#0b1f16] border border-[#c5a059]/40'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
          }`}
        >
          {isTraceLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-[#c5a059]" />
              <span className="font-bold">Ingesting Trace...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-bold">
                <ClipboardCheck className="h-4 w-4 text-[#c5a059]" />
                1. Ingest Failed Trace
              </div>
              <span className="text-[9px] text-stone-400 font-sans lowercase normal-case">Load flawed LLM conversation</span>
            </>
          )}
        </button>

        {/* Step 2: Scan for Conflicts */}
        <button
          id="btn-analyze-context"
          onClick={onAnalyzeContext}
          disabled={!canAnalyze || isAnalyzing}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 px-4 text-xs font-bold font-serif uppercase tracking-wider shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c5a059] ${
            isAnalyzing
              ? 'bg-[#faf7f0] text-stone-400 border border-[#e6dfcc] cursor-not-allowed'
              : canAnalyze
              ? 'bg-[#0f291e] text-[#f5f2eb] hover:bg-[#143929] active:bg-[#0b1f16] border border-[#c5a059]/40'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-[#c5a059]" />
              <span className="font-bold">Scanning Policies...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-bold">
                <Cpu className="h-4 w-4 text-[#c5a059]" />
                2. Scan for Conflicts
              </div>
              <span className="text-[9px] text-stone-400 font-sans lowercase normal-case">Detect policy contradictions</span>
            </>
          )}
        </button>

        {/* Step 3: Resolve & Clean */}
        <button
          id="btn-apply-optimization"
          onClick={onApplyOptimization}
          disabled={!canOptimize}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 px-4 text-xs font-bold font-serif uppercase tracking-wider shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c5a059] ${
            canOptimize
              ? 'bg-[#c5a059] text-[#0f291e] hover:bg-[#d6b572] active:bg-[#b39247] border border-[#0f291e]/20'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="h-4 w-4" />
            3. Resolve & Clean
          </div>
          <span className="text-[9px] text-[#0f291e]/70 font-sans lowercase normal-case">Purge stale & duplicate facts</span>
        </button>

        {/* Step 4: Replay Agent Sandbox */}
        <button
          id="btn-replay-agent"
          onClick={onReplayAgent}
          disabled={!canReplay || isReplaying}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 px-4 text-xs font-bold font-serif uppercase tracking-wider shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c5a059] ${
            isReplaying
              ? 'bg-[#faf7f0] text-stone-400 border border-[#e6dfcc] cursor-not-allowed'
              : canReplay
              ? 'bg-[#0f291e] text-[#f5f2eb] hover:bg-[#143929] active:bg-[#0b1f16] border border-[#c5a059]/40'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
          }`}
        >
          {isReplaying ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-[#c5a059]" />
              <span className="font-bold">Replaying Agent...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-bold">
                <PlayCircle className="h-4 w-4 text-[#c5a059]" />
                4. Replay Sandbox Run
              </div>
              <span className="text-[9px] text-stone-400 font-sans lowercase normal-case">Run agent with clean context</span>
            </>
          )}
        </button>
      </div>

      {/* Error surfaced clearly inside the workspace controls container */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Pipeline Registry Error:</span> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};
