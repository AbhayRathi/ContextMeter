/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import { WorkflowState } from '../types';

interface WorkflowProgressProps {
  currentState: WorkflowState;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ currentState }) => {
  // Hand-drawn premium vector symbols matching the "Old Money" registry aesthetic
  const steps = [
    {
      id: 1,
      name: 'Ingest Trace',
      desc: 'Load flawed conversation',
      states: ['TRACE_LOADING', 'TRACE_LOADED'],
      // Vector: Classic wax seal with a document silhouette
      symbol: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22a5 5 0 100-10 5 5 0 000 10z" stroke="#c5a059" fill="#FAF7F0" />
          <path d="M12 14v4M10 16h4" stroke="#0f291e" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 2H6a2 2 0 00-2 2v10a2 2 0 002 2h3" strokeLinecap="round" />
          <path d="M14 2l6 6m-6-6v6h6M20 8v4" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 2,
      name: 'Scan Conflicts',
      desc: 'Detect contradictions',
      states: ['ANALYZING', 'ANALYZED'],
      // Vector: Elegant vintage analytical scales
      symbol: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v17M6 20h12" strokeLinecap="round" />
          <path d="M6 7h12" stroke="#c5a059" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 7l-2 5h4l-2-5zm12 0l-2 5h4l-2-5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 3,
      name: 'Resolve & Clean',
      desc: 'Discard stale criteria',
      states: ['OPTIMIZATION_APPLIED'],
      // Vector: Classical botanical scissors / shears
      symbol: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6" cy="18" r="3" stroke="#c5a059" />
          <circle cx="18" cy="18" r="3" stroke="#c5a059" />
          <path d="M8.5 15.5L18 6M15.5 15.5L6 6" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 4,
      name: 'Sandbox Replay',
      desc: 'Re-evaluate with clean facts',
      states: ['REPLAYING'],
      // Vector: Classic mechanical hourglass
      symbol: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2h12M6 22h12" strokeLinecap="round" />
          <path d="M6 2v4a6 6 0 003 5.2L12 13l3-1.8A6 6 0 0018 6V2" strokeLinecap="round" />
          <path d="M6 22v-4a6 6 0 013-5.2L12 11l3 1.8A6 6 0 0118 18v4" strokeLinecap="round" />
          <path d="M12 15h.01M10 18h4" stroke="#c5a059" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 5,
      name: 'Certify Safety',
      desc: 'Verify response compliance',
      states: ['REPLAYED'],
      // Vector: Double laurel wreath around a sovereign star
      symbol: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 15.5A7.5 7.5 0 0012 21a7.5 7.5 0 007.5-5.5" strokeLinecap="round" />
          <path d="M12 14l-2-2.5 4.5-4.5" stroke="#c5a059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke="#0f291e" />
        </svg>
      )
    }
  ];

  // Helper to determine active step index (0-based)
  const getActiveStepIndex = (): number => {
    switch (currentState) {
      case 'INITIAL':
        return -1;
      case 'TRACE_LOADING':
      case 'TRACE_LOADED':
        return 0;
      case 'ANALYZING':
      case 'ANALYZED':
        return 1;
      case 'OPTIMIZATION_APPLIED':
        return 2;
      case 'REPLAYING':
        return 3;
      case 'REPLAYED':
        return 4;
      default:
        return -1;
    }
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div
      id="workflow-progress"
      className="bg-[#fbfaf6] border border-[#c5a059]/35 rounded-xl p-6 shadow-sm transition-all relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="40" strokeWidth="1" />
          <line x1="50" y1="10" x2="50" y2="90" />
          <line x1="10" y1="50" x2="90" y2="50" />
        </svg>
      </div>

      <div className="flex items-center justify-between mb-5 border-b border-[#c5a059]/20 pb-3">
        <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-[#0f291e]">
          Execution Progress & Stage Registry
        </h4>
        <span className="font-mono text-xs font-medium text-stone-500">
          Sovereign State: <span className="font-bold text-[#0f291e] bg-[#FAF7F0] border border-[#c5a059]/30 px-2 py-0.5 rounded">{currentState}</span>
        </span>
      </div>

      <div className="relative pt-2">
        {/* Progress connecting line */}
        <div className="absolute top-7 left-8 right-8 h-[2px] bg-[#e6dfcc] -z-10" aria-hidden="true">
          <div
            className="h-full bg-[#c5a059] transition-all duration-500"
            style={{
              width: `${activeIndex <= 0 ? 0 : (activeIndex / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps container */}
        <div className="grid grid-cols-5 text-center">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div key={step.id} className="flex flex-col items-center group">
                {/* Step badge/indicator */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 relative ${
                    isCompleted
                      ? 'bg-[#0f291e] border-[#c5a059] text-[#FAF7F0] shadow-sm'
                      : isActive
                      ? 'bg-white border-[#0f291e] text-[#0f291e] ring-4 ring-[#FAF7F0]/80 shadow-md'
                      : 'bg-[#FAF7F0]/60 border-[#e6dfcc] text-stone-400'
                  }`}
                >
                  {isCompleted ? (
                    <div className="flex flex-col items-center justify-center">
                      <Check className="h-4.5 w-4.5 stroke-[2.5] text-[#c5a059]" />
                      <span className="text-[8px] font-mono leading-none mt-0.5 text-[#e5dfd3] uppercase font-semibold">Done</span>
                    </div>
                  ) : (
                    <div className={isActive ? 'scale-110 transition-transform' : 'opacity-70'}>
                      {step.symbol}
                    </div>
                  )}

                  {/* Tiny step number flag */}
                  <span className={`absolute -top-1 -right-1 font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold border ${
                    isActive ? 'bg-[#0f291e] text-white border-[#c5a059]' : 'bg-[#e6dfcc] text-stone-600 border-[#cfc4b1]'
                  }`}>
                    {step.id}
                  </span>
                </div>

                {/* Step labels */}
                <div className="mt-4">
                  <p
                    className={`font-serif text-xs md:text-sm font-bold tracking-tight transition-all ${
                      isActive ? 'text-[#0f291e] underline decoration-[#c5a059]/50 decoration-2' : isCompleted ? 'text-stone-800' : 'text-stone-400 font-medium'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="font-sans text-[10px] text-stone-500 mt-1 hidden md:block max-w-[130px] mx-auto leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
