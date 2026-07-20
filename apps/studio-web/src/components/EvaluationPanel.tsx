/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import { EvaluationResult, WorkflowState } from '../types';

interface EvaluationPanelProps {
  currentState: WorkflowState;
  results: EvaluationResult[];
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ currentState, results }) => {
  const isLoaded = currentState !== 'INITIAL' && currentState !== 'TRACE_LOADING';
  const isReplayed = currentState === 'REPLAYED';

  return (
    <div
      id="deterministic-evaluation-panel"
      className="rounded-xl border border-[#c5a059]/35 bg-[#fbfaf6] p-6 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#c5a059]/15 pb-3">
        <div>
          <h4 className="font-serif text-lg font-bold text-[#0f291e] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#c5a059]" />
            Sovereign Assertion Suite
          </h4>
          <p className="font-sans text-xs text-stone-500 mt-1">
            Pre-defined bylaws executed directly on replayed outputs. Ensures adherence to banking compliance guidelines.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#FAF7F0] border border-[#c5a059]/40 rounded-lg px-3 py-1.5 text-[10px] font-bold text-[#0f291e] uppercase tracking-wider self-start sm:self-center">
          <ShieldCheck className="h-3.5 w-3.5 text-[#c5a059]" />
          Verifiable Bylaws
        </div>
      </div>

      {!isLoaded ? (
        <div className="rounded-xl border-2 border-dashed border-[#c5a059]/25 p-8 text-center text-stone-400 text-xs font-serif italic">
          Load a failed trace to initiate evaluation assertions.
        </div>
      ) : (
        <div className="space-y-4">
          {/* List of deterministic tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((test, index) => {
              const showReplayResult = isReplayed;
              const hasPassed = test.passed;

              return (
                <div
                  key={test.id || index}
                  id={`eval-row-${test.id}`}
                  className={`rounded-xl border p-4 space-y-3 transition-all duration-300 ${
                    showReplayResult && hasPassed
                      ? 'border-emerald-600/30 bg-emerald-50/15'
                      : 'border-[#c5a059]/25 bg-white'
                  }`}
                >
                  {/* Title and Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        Bylaw Assert {index + 1}
                      </span>
                      <h5 className="font-serif text-sm font-bold text-[#0f291e] leading-tight">
                        {test.label}
                      </h5>
                    </div>

                    {showReplayResult ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#133c2b]/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        PASSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800">
                        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        FAILED
                      </span>
                    )}
                  </div>

                  {/* Assertion Explanation */}
                  <p className="font-sans text-[11px] text-stone-600 leading-relaxed">
                    {test.explanation}
                  </p>

                  {/* Comparison line */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-medium pt-3 border-t border-stone-100">
                    <div>
                      <div className="text-stone-400 font-bold uppercase tracking-wider text-[8px]">Baseline Run</div>
                      <div className="text-red-700 font-bold truncate mt-0.5" title={test.baselineResult}>
                        {test.baselineResult}
                      </div>
                    </div>
                    <div>
                      <div className="text-stone-400 font-bold uppercase tracking-wider text-[8px]">Optimized Replay</div>
                      <div className={`font-bold truncate mt-0.5 ${showReplayResult ? 'text-emerald-800' : 'text-stone-400 italic'}`}>
                        {showReplayResult ? test.optimizedResult : 'Awaiting replay...'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Caption */}
          <div className="rounded-xl bg-[#FAF7F0] border border-[#c5a059]/25 p-4 text-xs text-stone-600 leading-relaxed">
            <span className="font-serif font-bold text-[#0f291e]">Deterministic Evaluation Standard:</span> Assessment is based on exact code parsing scans matching generated answer variables directly against verifiable bylaws (such as the $10,000 threshold and the 90-day transaction bounds) to eliminate model self-scoring hallucinations.
          </div>
        </div>
      )}
    </div>
  );
};
export default EvaluationPanel;
