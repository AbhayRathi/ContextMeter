/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Blocks,
  Coins,
  ShieldAlert,
  Award,
  ArrowDownRight,
  ArrowUpRight,
  Minus
} from 'lucide-react';
import { WorkflowState } from '../types';

interface MetricCardsProps {
  currentState: WorkflowState;
  baselineTokens?: number;
  optimizedTokens?: number;
  baselineBlocks?: number;
  optimizedBlocks?: number;
  baselineConflicts?: number;
  optimizedConflicts?: number;
  baselineEvalPassed?: number;
  optimizedEvalPassed?: number;
  totalEvalTests?: number;
}

export const MetricComparisonGrid: React.FC<MetricCardsProps> = ({
  currentState,
  baselineTokens = 1850,
  optimizedTokens = 820,
  baselineBlocks = 6,
  optimizedBlocks = 3,
  baselineConflicts = 2,
  optimizedConflicts = 0,
  baselineEvalPassed = 2,
  optimizedEvalPassed = 6,
  totalEvalTests = 6
}) => {
  const isLoaded = currentState !== 'INITIAL' && currentState !== 'TRACE_LOADING';
  const isOptimized =
    currentState === 'OPTIMIZATION_APPLIED' ||
    currentState === 'REPLAYING' ||
    currentState === 'REPLAYED';
  const isReplayed = currentState === 'REPLAYED';

  // Calculations
  const tokenSavings = isLoaded && isOptimized
    ? Math.round(((baselineTokens - optimizedTokens) / baselineTokens) * 100)
    : 0;

  const blockSavings = isLoaded && isOptimized
    ? Math.round(((baselineBlocks - optimizedBlocks) / baselineBlocks) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Editorial Ledgerview - Minimal boxes, clean horizontal columns with light-stone dividers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Context Size */}
        <div id="metric-context-size" className="bg-[#fbfaf6] border border-[#c5a059]/30 rounded-xl p-5 shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#c5a059]/15 pb-2">
            <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#0f291e]">Context Blocks</span>
            <Blocks className="h-4.5 w-4.5 text-[#c5a059] shrink-0" />
          </div>
          
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-stone-800">
              {isLoaded ? baselineBlocks : '—'}
            </span>
            {isLoaded && isOptimized && (
              <>
                <span className="text-[#c5a059] font-serif font-bold">→</span>
                <span className="font-mono text-3xl font-bold text-emerald-800">
                  {optimizedBlocks}
                </span>
                <span className="text-[10px] font-serif text-stone-500 italic">blocks</span>
              </>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-dashed border-[#c5a059]/10">
            <span>Audit Volume</span>
            {isLoaded && isOptimized ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                -{blockSavings}% Size
              </span>
            ) : (
              <span className="text-stone-400">Baseline</span>
            )}
          </div>
        </div>

        {/* Metric 2: Estimated Input Tokens */}
        <div id="metric-input-tokens" className="bg-[#fbfaf6] border border-[#c5a059]/30 rounded-xl p-5 shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#c5a059]/15 pb-2">
            <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#0f291e]">Token Weight</span>
            <Coins className="h-4.5 w-4.5 text-[#c5a059] shrink-0" />
          </div>
          
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-stone-800">
              {isLoaded ? baselineTokens.toLocaleString() : '—'}
            </span>
            {isLoaded && isOptimized && (
              <>
                <span className="text-[#c5a059] font-serif font-bold">→</span>
                <span className="font-mono text-3xl font-bold text-emerald-800">
                  {optimizedTokens.toLocaleString()}
                </span>
              </>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-dashed border-[#c5a059]/10">
            <span>Sovereign Cost</span>
            {isLoaded && isOptimized ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                -{tokenSavings}% Saved
              </span>
            ) : (
              <span className="text-stone-400">Unoptimized</span>
            )}
          </div>
        </div>

        {/* Metric 3: Context Conflicts */}
        <div id="metric-conflicts" className="bg-[#fbfaf6] border border-[#c5a059]/30 rounded-xl p-5 shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#c5a059]/15 pb-2">
            <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#0f291e]">Contradictions</span>
            <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0" />
          </div>
          
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-bold ${isLoaded && baselineConflicts > 0 ? 'text-amber-700 animate-pulse' : 'text-stone-800'}`}>
              {isLoaded ? baselineConflicts : '—'}
            </span>
            {isLoaded && isOptimized && (
              <>
                <span className="text-[#c5a059] font-serif font-bold">→</span>
                <span className="font-mono text-3xl font-bold text-emerald-800">
                  {optimizedConflicts}
                </span>
              </>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-dashed border-[#c5a059]/10">
            <span>Conflict Registry</span>
            {isLoaded && isOptimized && baselineConflicts > 0 ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                Resolved 100%
              </span>
            ) : (
              <span className="text-stone-400 font-semibold">
                {isLoaded ? '2 Flagged' : 'No trace'}
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Evaluation Quality */}
        <div id="metric-eval-quality" className="bg-[#fbfaf6] border border-[#c5a059]/30 rounded-xl p-5 shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#c5a059]/15 pb-2">
            <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#0f291e]">Registry Safety</span>
            <Award className="h-4.5 w-4.5 text-[#c5a059] shrink-0" />
          </div>
          
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-bold ${isLoaded ? 'text-red-700' : 'text-stone-800'}`}>
              {isLoaded ? `${baselineEvalPassed}/${totalEvalTests}` : '—'}
            </span>
            {isLoaded && isReplayed && (
              <>
                <span className="text-[#c5a059] font-serif font-bold">→</span>
                <span className="font-mono text-3xl font-bold text-emerald-800">
                  {optimizedEvalPassed}/{totalEvalTests}
                </span>
              </>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-dashed border-[#c5a059]/10">
            <span>Deterministic Rules</span>
            {isLoaded && isReplayed ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                100% Pass
              </span>
            ) : (
              <span className="text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                {isLoaded ? '33% Passed' : 'Pending'}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Disclaimers & Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-stone-400 italic">
        <span>* Token metrics calculated through exact byte offsets of registry data payloads.</span>
        <span>* Sovereign Certifications verify that $10,000 threshold and 90-day transactions conform to bank bylaws.</span>
      </div>
    </div>
  );
};
export default MetricComparisonGrid;
