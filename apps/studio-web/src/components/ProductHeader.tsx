/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, RotateCcw, ShieldCheck, ToggleLeft, ToggleRight, Landmark } from 'lucide-react';
import { ApiClient } from '../services/api';

interface ProductHeaderProps {
  isMockMode: boolean;
  onToggleMockMode: (val: boolean) => void;
  onReset: () => void;
  healthStatus: { status: string; mode: string } | null;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  isMockMode,
  onToggleMockMode,
  onReset,
  healthStatus
}) => {
  return (
    <header
      id="product-header"
      className="border-b border-[#c5a059]/40 bg-[#0d291e] px-6 py-6 shadow-md transition-colors relative"
    >
      {/* Premium accent gold line at the absolute top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b39247] via-[#e2c98d] to-[#b39247]" />

      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        
        {/* Title, Royal Seal & Description */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Elegant Royal Seal Branding Image */}
            <div className="flex items-center gap-3">
              <img
                src="/src/assets/images/contextmeter_emblem_1784503337376.jpg"
                alt="ContextMeter Heraldic Seal"
                className="h-14 w-14 rounded-full border-2 border-[#c5a059] shadow-md object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-[#f5f2eb]">
                  ContextMeter
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 items-center mt-2 sm:mt-0">
              {isMockMode ? (
                <span className="inline-flex items-center rounded-md bg-amber-950/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-800/50">
                  Simulation Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-800/50">
                  Live Registry Active
                </span>
              )}
              
              {healthStatus?.mode === 'fallback-mock' && (
                <span className="inline-flex items-center rounded-md bg-rose-950/40 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-800/40">
                  Local Offline Sandbox
                </span>
              )}
            </div>
          </div>
          
          <h2 className="font-serif text-lg font-medium text-[#e5dfd3] italic pt-1">
            Determine with absolute precision what your AI agent digests—and what must be discarded.
          </h2>
          <p className="font-sans text-xs text-stone-300 max-w-4xl leading-relaxed">
            ContextMeter operates transparently at the gate, pruning high-cost policy contradictions, auditing source authority, and confirming compliance with standard business metrics.
          </p>
        </div>

        {/* Global Controls & Premium Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-center shrink-0">
          {/* Mock Switcher */}
          <div className="flex items-center gap-2 rounded-lg border border-[#c5a059]/30 bg-[#133c2b] p-1.5 shadow-inner">
            <span className="font-serif text-xs font-medium text-[#e5dfd3] px-2 italic">
              Registry Feed:
            </span>
            <button
              id="toggle-api-mode-btn"
              onClick={() => onToggleMockMode(!isMockMode)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isMockMode
                  ? 'bg-[#c5a059] text-[#0d291e] hover:bg-[#d6b572]'
                  : 'bg-[#1e4e37] text-[#f5f2eb] hover:bg-[#256145] border border-[#c5a059]/20'
              }`}
              title="Toggle between Simulation Feed and actual relative API calls"
            >
              {isMockMode ? (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  SIMULATED
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4 text-[#c5a059]" />
                  LIVE FEED
                </>
              )}
            </button>
          </div>

          {/* Reset Button */}
          <button
            id="reset-dashboard-btn"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-[#c5a059]/40 bg-[#fbfaf6] px-4 py-2 text-xs font-bold text-[#0f291e] hover:bg-[#f4f1ea] active:bg-[#e9e4d9] transition-all cursor-pointer font-serif uppercase tracking-wider shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#c5a059]" />
            Reset Ledger
          </button>
        </div>
      </div>
    </header>
  );
};
