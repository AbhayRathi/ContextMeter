/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Database,
  Award,
  Sparkles,
  XCircle,
  HelpCircle,
  Flame
} from 'lucide-react';
import { ContextBlock, ContextAction, PriorityLevel } from '../types';

interface ContextInspectorProps {
  contextBlocks: ContextBlock[];
  isAnalyzed: boolean;
  isOptimizationApplied: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  contextBlocks,
  isAnalyzed,
  isOptimizationApplied,
  selectedBlockId,
  onSelectBlock
}) => {
  // Find current selected block details
  const activeBlock = contextBlocks.find((b) => b.id === selectedBlockId) || contextBlocks[0];

  // Helper to get priority color classes
  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#0f291e]/10 border border-[#0f291e]/30 px-2 py-0.5 text-[10px] font-bold text-red-950">
            <Flame className="h-3 w-3 text-[#c5a059]" />
            Critical Status
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-800">
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#FAF7F0] border border-[#c5a059]/20 px-2 py-0.5 text-[10px] font-medium text-stone-700">
            Standard Tier
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-stone-50 border border-stone-200 px-2 py-0.5 text-[10px] font-medium text-stone-600">
            Secondary Tier
          </span>
        );
    }
  };

  // Helper to get recommendation action badge
  const getActionBadge = (action?: ContextAction) => {
    if (!isAnalyzed || !action) {
      return (
        <span className="inline-flex items-center rounded-lg bg-[#FAF7F0] border border-stone-200 border-dashed px-2.5 py-1 text-[10px] font-semibold text-stone-400">
          Awaiting Scan
        </span>
      );
    }

    switch (action) {
      case 'KEEP':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            RETAIN
          </span>
        );
      case 'REMOVE':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-500/30 px-2.5 py-1 text-[10px] font-bold text-red-800">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            EXCLUDE
          </span>
        );
      case 'COMPRESS':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-stone-100 border border-[#c5a059]/30 px-2.5 py-1 text-[10px] font-bold text-[#0f291e]">
            COMPRESS
          </span>
        );
      case 'REFRESH':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-[#c5a059]/35 px-2.5 py-1 text-[10px] font-bold text-amber-900">
            UPDATE
          </span>
        );
    }
  };

  return (
    <div id="context-inspector-section" className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#c5a059]/20 pb-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#0f291e] flex items-center gap-2">
            <Database className="h-5.5 w-5.5 text-[#c5a059]" />
            Context Provenance & Clutter Ledger
          </h3>
          <p className="font-sans text-xs text-stone-500">
            Audit retrieved information blocks. Highlight outdated bylaws or contradictory clauses before prompt synthesis.
          </p>
        </div>
        {isOptimizationApplied && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f291e] border border-[#c5a059] px-3.5 py-1.5 text-[11px] font-bold text-[#f5f2eb] font-serif shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059] animate-pulse" />
            Sovereign Filter Applied
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: List of Context Blocks (7 cols) */}
        <div className="lg:col-span-7 space-y-4 max-h-[700px] overflow-y-auto pr-2">
          {contextBlocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const isRemovedByOpt = isOptimizationApplied && block.recommendedAction === 'REMOVE';

            return (
              <div
                key={block.id}
                id={`context-block-${block.id}`}
                onClick={() => onSelectBlock(block.id)}
                className={`group relative flex flex-col gap-3.5 rounded-xl border p-5 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'border-[#c5a059] bg-[#FAF7F0] ring-1 ring-[#c5a059]/30'
                    : 'border-[#c5a059]/20 bg-[#fbfaf6] hover:border-[#c5a059]/40 hover:bg-[#FAF7F0]/40'
                } ${isRemovedByOpt ? 'opacity-40 hover:opacity-80 border-dashed' : ''}`}
              >
                {/* Header row: title, token, source */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-serif text-sm font-bold tracking-tight ${
                        isSelected ? 'text-[#0f291e]' : 'text-stone-850'
                      } ${isRemovedByOpt ? 'line-through text-stone-400' : ''}`}>
                        {block.title}
                      </h4>
                      {block.verified ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-700" title="Sovereign Authority Verified" />
                      ) : (
                        <HelpCircle className="h-4 w-4 text-stone-400" title="Unverified Source" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-500 font-sans">
                      <span>Source: <strong className="font-semibold text-stone-700">{block.source}</strong></span>
                      <span>•</span>
                      <span>Effective: {block.effectiveDate}</span>
                    </div>
                  </div>

                  {/* Token badge */}
                  <span className="font-mono text-[10px] font-bold text-[#0f291e] bg-[#FAF7F0] border border-[#c5a059]/25 px-2 py-0.5 rounded-md shrink-0">
                    {block.estimatedTokens} tokens
                  </span>
                </div>

                {/* Body Preview snippet */}
                <p className="font-sans text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {block.content}
                </p>

                {/* Footer row: Priority and recommended action decision */}
                <div className="flex items-center justify-between border-t border-[#c5a059]/15 pt-3 mt-0.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(block.priority)}
                    {block.supersededStatus && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-900 font-serif font-bold rounded-md bg-red-100/65 px-2 py-0.5 border border-red-200">
                        Superseded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getActionBadge(block.recommendedAction)}
                    <ChevronRight className="h-4 w-4 text-[#c5a059] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Visual strike line if optimization removes it */}
                {isRemovedByOpt && (
                  <div className="absolute top-2 left-2 rounded bg-red-800 border border-red-950 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#f5f2eb]">
                    EXCLUDED FROM PIPELINE
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Active Selected Detail Panel (5 cols) */}
        <div id="context-detail-panel" className="lg:col-span-5">
          {activeBlock ? (
            <div className="rounded-xl border border-[#c5a059]/35 bg-[#FAF7F0] p-5 shadow-2xs sticky top-4 flex flex-col h-full max-h-[700px] overflow-y-auto">
              
              {/* Header block metadata */}
              <div className="border-b border-[#c5a059]/20 pb-4 mb-4">
                <span className="font-serif text-[10px] font-extrabold uppercase tracking-widest text-[#0f291e] italic">
                  Detail Registry Audit
                </span>
                <h4 className="font-serif text-base font-bold text-[#0f291e] mt-1.5">
                  {activeBlock.title}
                </h4>
                
                <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2.5 border border-[#c5a059]/20">
                    <div className="text-[9px] uppercase font-bold text-stone-400">Provenance Registry</div>
                    <div className="font-serif font-bold text-[#0f291e] truncate mt-0.5">{activeBlock.source}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-[#c5a059]/20">
                    <div className="text-[9px] uppercase font-bold text-stone-400">Tokens Contribution</div>
                    <div className="font-mono font-bold text-[#0f291e] mt-0.5">{activeBlock.estimatedTokens} (Est.)</div>
                  </div>
                </div>
              </div>

              {/* Action recommendation callout */}
              {isAnalyzed ? (
                <div className={`rounded-xl p-4 mb-4 border ${
                  activeBlock.recommendedAction === 'KEEP'
                    ? 'bg-emerald-50/80 border-emerald-500/30 text-emerald-950'
                    : 'bg-red-50/80 border-red-500/30 text-red-950'
                }`}>
                  <div className="flex items-center gap-1.5 font-serif font-extrabold text-xs uppercase tracking-wider">
                    {activeBlock.recommendedAction === 'KEEP' ? (
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-700" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-red-700" />
                    )}
                    ContextMeter Audit: {activeBlock.recommendedAction}
                  </div>
                  <div className="mt-2.5 text-xs leading-relaxed">
                    <span className="font-serif font-bold text-[#0f291e]">Reasoning:</span> {activeBlock.recommendationReason || 'N/A'}
                  </div>
                  {activeBlock.riskIfRemoved && (
                    <div className="mt-2.5 pt-2.5 border-t border-dashed border-stone-300 text-xs leading-relaxed">
                      <span className="font-serif font-bold text-[#0f291e]">Conflict Assessment:</span> {activeBlock.riskIfRemoved}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-white p-4 mb-4 border border-[#c5a059]/20 text-stone-600 text-xs text-center font-serif italic">
                  Run the "Audit Facts" procedure to evaluate recommendation reasoning, safety risks, and temporal resolution bylaws.
                </div>
              )}

              {/* Live file content */}
              <div className="flex-1 flex flex-col min-h-[180px]">
                <label className="text-[9px] uppercase font-bold tracking-widest text-[#0f291e] block mb-1.5 font-serif">
                  Raw Clause Payload
                </label>
                <div className="bg-white rounded-lg p-3.5 border border-[#c5a059]/20 font-mono text-xs text-stone-850 whitespace-pre-wrap flex-1 overflow-y-auto leading-relaxed max-h-[250px]">
                  {activeBlock.content}
                </div>
              </div>

              {/* Status footer inside detail card */}
              <div className="mt-4 pt-4 border-t border-[#c5a059]/20 space-y-2 text-xs">
                <div className="flex justify-between items-center text-stone-500">
                  <span>Priority Ranking:</span>
                  <span className="font-serif font-bold text-[#0f291e]">{activeBlock.priority}</span>
                </div>
                <div className="flex justify-between items-center text-stone-500">
                  <span>Effective Date:</span>
                  <span className="font-serif font-bold text-[#0f291e]">{activeBlock.effectiveDate}</span>
                </div>
                {activeBlock.supersededStatus && (
                  <div className="bg-red-50 rounded-lg p-2.5 text-[11px] text-red-950 border border-red-200 font-medium">
                    ⚠️ <span className="font-serif font-bold">Stale Warning:</span> {activeBlock.supersededStatus}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[#c5a059]/25 bg-[#FAF7F0] p-8 text-center text-stone-400 font-serif italic">
              <ShieldAlert className="h-8 w-8 mx-auto text-[#c5a059] mb-2.5" />
              Select any context block to inspect detailed metrics, risk profiles, and provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ContextInspector;
