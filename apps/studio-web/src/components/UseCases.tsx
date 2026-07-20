/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  Briefcase,
  Layers3,
  Code,
  BrainCircuit,
  Boxes
} from 'lucide-react';

export const UseCaseCards: React.FC = () => {
  const cases = [
    {
      title: 'Customer-Support Agents',
      desc: 'Detect outdated policies, conflicting support articles, and irrelevant or redundant conversation history logs.',
      icon: Users,
      badge: 'Support'
    },
    {
      title: 'Lending & Underwriting Copilots',
      desc: 'Identify superseded borrower documents, conflicting financial sheets, and stale property rating records.',
      icon: Briefcase,
      badge: 'Finance'
    },
    {
      title: 'Enterprise Knowledge Assistants',
      desc: 'Pinpoint old company policy documents, duplicate corporate files, and low-authority intranet sources.',
      icon: Layers3,
      badge: 'HR / Internal'
    },
    {
      title: 'Coding Agents',
      desc: 'Measure whether irrelevant repository files, deprecated API document packages, or excessive build log files degrade output quality.',
      icon: Code,
      badge: 'DevOps'
    },
    {
      title: 'Long-Running Memory Agents',
      desc: 'Scrub stale user preferences, contradictory behavioral memories, and uncontrolled recursive prompt-chain growth.',
      icon: BrainCircuit,
      badge: 'Personalization'
    }
  ];

  return (
    <div id="broader-use-cases" className="space-y-4">
      <div className="border-b border-[#c5a059]/15 pb-2">
        <h4 className="font-serif text-lg font-bold text-[#0f291e] flex items-center gap-2">
          <Boxes className="h-5 w-5 text-[#c5a059]" />
          Engineered for Context-Heavy Workflows
        </h4>
        <p className="font-sans text-xs text-stone-500 mt-1">
          ContextMeter handles complex prompt structures. Explore core operational models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cases.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              id={`usecase-card-${idx}`}
              className="rounded-xl border border-[#c5a059]/25 bg-[#fbfaf6] p-5 shadow-2xs hover:border-[#c5a059]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f291e]/10 text-[#0f291e]">
                    <Icon className="h-4.5 w-4.5 text-[#0f291e]" />
                  </div>
                  <span className="font-serif text-[9px] font-bold text-[#0f291e] bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#c5a059]/30 uppercase tracking-wider">
                    {item.badge}
                  </span>
                </div>
                <h5 className="font-serif text-sm font-bold text-[#0f291e] leading-snug">
                  {item.title}
                </h5>
                <p className="font-sans text-[11px] text-stone-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 pt-2 border-t border-[#c5a059]/15 text-[9px] text-[#0f291e]/60 font-serif font-extrabold uppercase tracking-widest">
                Protocol Ready
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default UseCaseCards;
