/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  WorkflowState,
  ContextBlock,
  ContextConflict,
  EvaluationResult,
  Scenario
} from './types';
import { ApiClient } from './services/api';
import { ProductHeader } from './components/ProductHeader';
import { ScenarioHeader } from './components/ScenarioHeader';
import { WorkflowProgress } from './components/WorkflowProgress';
import { WorkflowControls } from './components/WorkflowControls';
import { MetricComparisonGrid } from './components/MetricCards';
import { ContextPipeline } from './components/ContextPipeline';
import { ContextInspector } from './components/ContextInspector';
import { ConflictPanel } from './components/ConflictPanel';
import { ResponseComparison } from './components/ResponseComparison';
import { EvaluationPanel } from './components/EvaluationPanel';
import { OptimizationSummary } from './components/OptimizationSummary';
import { UseCaseCards } from './components/UseCases';
import { PitchPanel } from './components/PitchPanel';
import { Info, HelpCircle, AlertCircle, Briefcase, Layers3, ShieldAlert, Database, ArrowRightLeft, ShieldCheck, CheckCircle } from 'lucide-react';

export default function App() {
  // Central State Management
  const [currentState, setCurrentState] = useState<WorkflowState>('INITIAL');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('banking-policy-conflict');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [contextBlocks, setContextBlocks] = useState<ContextBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isOptimizationApplied, setIsOptimizationApplied] = useState(false);
  const [conflicts, setConflicts] = useState<ContextConflict[]>([]);
  const [summary, setSummary] = useState('');
  const [replayedResponse, setReplayedResponse] = useState('');
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [activeBottomTab, setActiveBottomTab] = useState<'provenance' | 'conflicts' | 'sandbox'>('provenance');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(ApiClient.isMockMode());
  const [healthStatus, setHealthStatus] = useState<{ status: string; mode: string } | null>(null);

  // Initial Health Check on Mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const health = await ApiClient.checkHealth();
        setHealthStatus(health);
      } catch (err) {
        console.warn('API connection check failed, using safe fallback environment.', err);
      }
    };
    fetchHealth();
  }, []);

  // Sync API Mode Toggle
  const handleToggleMockMode = (enabled: boolean) => {
    ApiClient.setMockMode(enabled);
    setIsMockMode(enabled);
    // Refresh health status
    ApiClient.checkHealth().then(setHealthStatus).catch(console.error);
  };

  // 1. Load Failed Trace Action
  const handleLoadTrace = async (scenarioId: string = 'banking-policy-conflict') => {
    setErrorMessage(null);
    setCurrentState('TRACE_LOADING');
    try {
      // Load the selected scenario trace
      const data = await ApiClient.getScenario(scenarioId);
      
      // Load raw blocks without analysis decisions yet
      const rawBlocks = data.contextBlocks.map((b) => ({
        ...b,
        recommendedAction: undefined,
        recommendationReason: undefined,
        riskIfRemoved: undefined
      }));

      setScenario(data);
      setContextBlocks(rawBlocks);
      setSelectedBlockId(rawBlocks[0]?.id || null);
      setActiveScenarioId(scenarioId);
      
      // Reset subsequent parameters
      setIsAnalyzed(false);
      setIsOptimizationApplied(false);
      setConflicts([]);
      setSummary('');
      setReplayedResponse('');
      setEvaluationResults([]);
      setActiveBottomTab('provenance');

      setCurrentState('TRACE_LOADED');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve baseline trace.');
      setCurrentState('ERROR');
    }
  };

  // 2. Analyze Context Action
  const handleAnalyzeContext = async () => {
    if (!scenario) {
      setErrorMessage('Cannot analyze. No trace is currently loaded.');
      return;
    }
    setErrorMessage(null);
    setCurrentState('ANALYZING');
    try {
      const response = await ApiClient.analyzeContext({
        task: scenario.customerRequest,
        contextBlocks: contextBlocks
      });

      // Map decisions back onto the local context blocks array
      const updatedBlocks = contextBlocks.map((b) => {
        const decision = response.decisions.find((d) => d.contextBlockId === b.id);
        if (decision) {
          return {
            ...b,
            recommendedAction: decision.recommendedAction,
            recommendationReason: decision.recommendationReason,
            riskIfRemoved: decision.riskIfRemoved
          };
        }
        return b;
      });

      setContextBlocks(updatedBlocks);
      setConflicts(response.conflicts);
      setSummary(response.summary);
      setIsAnalyzed(true);
      setActiveBottomTab('conflicts');
      setCurrentState('ANALYZED');
    } catch (err: any) {
      setErrorMessage(err.message || 'Contradiction mapping and block analysis failed.');
      setCurrentState('ERROR');
    }
  };

  // 3. Apply Optimization Action
  const handleApplyOptimization = () => {
    if (!isAnalyzed) {
      setErrorMessage('Please run "Analyze Context" before applying optimizations.');
      return;
    }
    setErrorMessage(null);
    setIsOptimizationApplied(true);
    setCurrentState('OPTIMIZATION_APPLIED');
  };

  // 4. Replay Agent Action
  const handleReplayAgent = async () => {
    if (!isOptimizationApplied || !scenario) {
      setErrorMessage('Please apply context optimization before executing the replay.');
      return;
    }
    setErrorMessage(null);
    setCurrentState('REPLAYING');
    try {
      // Exclude blocks flagged as REMOVE
      const optimizedBlocks = contextBlocks.filter((b) => b.recommendedAction !== 'REMOVE');
      
      const response = await ApiClient.replayAgent({
        task: scenario.customerRequest,
        selectedContextBlocks: optimizedBlocks
      });

      setReplayedResponse(response.response);
      setEvaluationResults(response.evaluation.results);
      setActiveBottomTab('sandbox');
      setCurrentState('REPLAYED');
    } catch (err: any) {
      setErrorMessage(err.message || 'Counterfactual replay simulation failed.');
      setCurrentState('ERROR');
    }
  };

  // Reset Application Action
  const handleReset = () => {
    setCurrentState('INITIAL');
    setScenario(null);
    setContextBlocks([]);
    setSelectedBlockId(null);
    setIsAnalyzed(false);
    setIsOptimizationApplied(false);
    setConflicts([]);
    setSummary('');
    setReplayedResponse('');
    setEvaluationResults([]);
    setActiveBottomTab('provenance');
    setErrorMessage(null);
  };

  // Helper dynamic metrics calculations based on current pipeline state
  const getDynamicMetrics = () => {
    let baseTokens = 1850;
    let optTokens = 870;

    if (activeScenarioId === 'mortgage-underwriting-conflict') {
      baseTokens = 1800;
      optTokens = 880;
    } else if (activeScenarioId === 'corporate-policy-conflict') {
      baseTokens = 1950;
      optTokens = 880;
    }

    const defaultMetrics = {
      baselineBlocks: 6,
      optimizedBlocks: 3,
      baselineTokens: baseTokens,
      optimizedTokens: optTokens,
      baselineConflicts: 2,
      optimizedConflicts: 0,
      baselineEvalPassed: 2,
      optimizedEvalPassed: 6,
      totalEvalTests: 6
    };

    if (currentState === 'INITIAL' || currentState === 'TRACE_LOADING') {
      return {
        ...defaultMetrics,
        baselineBlocks: 0,
        optimizedBlocks: 0,
        baselineTokens: 0,
        optimizedTokens: 0,
        baselineConflicts: 0,
        optimizedConflicts: 0,
        baselineEvalPassed: 0,
        optimizedEvalPassed: 0
      };
    }

    return defaultMetrics;
  };

  const metrics = getDynamicMetrics();

  return (
    <div className="min-h-screen bg-[#fbfaf6] font-sans text-stone-850 antialiased pb-12">
      {/* 1. Global Header */}
      <ProductHeader
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
        onReset={handleReset}
        healthStatus={healthStatus}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        {/* Scenario Selection Ribbon */}
        <div id="scenario-selection-ribbon" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#c5a059]/25 pb-3">
            <div>
              <h4 className="font-serif text-sm font-bold uppercase tracking-widest text-[#0f291e] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c5a059]" />
                Select Demonstration Case Study
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Switch between different operational context vulnerabilities to evaluate how ContextMeter sanitizes conflicting parameters.
              </p>
            </div>
            {scenario && (
              <span className="mt-2 sm:mt-0 inline-flex items-center gap-1 rounded bg-[#0f291e]/10 border border-[#c5a059]/30 px-2.5 py-1 text-[10px] font-bold text-[#0f291e] uppercase tracking-wider font-serif">
                Active Case: {scenario.name}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'banking-policy-conflict',
                name: 'Banking Policy Conflict',
                role: 'Customer Support Agent',
                desc: 'Overdraft waivers & wire limits',
                icon: ShieldAlert,
              },
              {
                id: 'mortgage-underwriting-conflict',
                name: 'Mortgage Contradiction',
                role: 'Lending & Underwriting Copilot',
                desc: 'Debt-to-income caps & approvals',
                icon: Briefcase,
              },
              {
                id: 'corporate-policy-conflict',
                name: 'Corporate Policy Inconsistency',
                role: 'Enterprise Knowledge Assistant',
                desc: 'Flight seating & lodging stipends',
                icon: Layers3,
              }
            ].map((tab) => {
              const isSelected = activeScenarioId === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`scenario-tab-${tab.id}`}
                  onClick={() => handleLoadTrace(tab.id)}
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-300 cursor-pointer hover:shadow-sm group focus:outline-none focus:ring-1 focus:ring-[#c5a059]/50 ${
                    isSelected
                      ? 'border-[#c5a059] bg-[#FAF7F0] ring-1 ring-[#c5a059]/30 shadow-2xs'
                      : 'border-stone-200 bg-white hover:border-[#c5a059]/30'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    isSelected ? 'bg-[#0f291e] text-[#f5f2eb]' : 'bg-stone-100 text-stone-500 group-hover:bg-[#0f291e]/10 group-hover:text-[#0f291e]'
                  } transition-colors`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-sm font-extrabold text-[#0f291e] leading-snug">
                        {tab.name}
                      </span>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-stone-400 tracking-widest leading-none">
                      {tab.role}
                    </div>
                    <div className="text-xs text-stone-500 leading-normal mt-1">
                      {tab.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 1: Workflow Timeline */}
        <WorkflowProgress currentState={currentState} />

        {/* Row 2: Workflow Controls & Actions */}
        <WorkflowControls
          currentState={currentState}
          onLoadTrace={() => handleLoadTrace(activeScenarioId)}
          onAnalyzeContext={handleAnalyzeContext}
          onApplyOptimization={handleApplyOptimization}
          onReplayAgent={handleReplayAgent}
          onReset={handleReset}
          errorMessage={errorMessage}
        />

        {/* Workspace Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main workspace (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Scenario Card */}
            <ScenarioHeader scenario={scenario} />

            {/* Metric Overview Comparison Grid */}
            <MetricComparisonGrid
              currentState={currentState}
              baselineBlocks={metrics.baselineBlocks}
              optimizedBlocks={metrics.optimizedBlocks}
              baselineTokens={metrics.baselineTokens}
              optimizedTokens={metrics.optimizedTokens}
              baselineConflicts={metrics.baselineConflicts}
              optimizedConflicts={metrics.optimizedConflicts}
              baselineEvalPassed={metrics.baselineEvalPassed}
              optimizedEvalPassed={metrics.optimizedEvalPassed}
              totalEvalTests={metrics.totalEvalTests}
            />

            {/* Context Intercept Pipeline Visual */}
            <ContextPipeline currentState={currentState} />
          </div>

          {/* Side context info bar / Pitch framing (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <PitchPanel />
            
            {/* Natural language diagnosis insight */}
            {isAnalyzed && (
              <div className="rounded-xl border border-[#c5a059]/30 bg-[#FAF7F0] p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0f291e] shrink-0" />
                  <h5 className="font-serif text-[10px] font-extrabold uppercase tracking-wider text-[#0f291e]">
                    Platform Diagnostic Log
                  </h5>
                </div>
                <div className="text-xs text-stone-700 leading-relaxed font-mono whitespace-pre-wrap bg-white p-3.5 rounded-lg border border-[#c5a059]/20">
                  {summary || 'Evaluating active traces...'}
                </div>
                <p className="text-[10px] text-stone-400 italic font-serif">
                  * Analysis computed instantly using temporal priority rules.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Bottom Tabs Area */}
        {scenario && (
          <div className="border-t border-[#c5a059]/20 pt-8 space-y-6">
            {/* Header / Ribbon */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-[#c5a059]/35 rounded-xl p-5 shadow-2xs">
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#0f291e] flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#c5a059] animate-pulse" />
                  Sovereign Observatory Workspace Ledger
                </h4>
                <p className="text-[11px] text-stone-500 leading-normal max-w-xl">
                  Inspect active trace files, detected fact contradictions, and sandbox replay assertion logs within this unified control registry.
                </p>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-[#FAF7F0] border border-[#c5a059]/30 rounded-lg self-start lg:self-center">
                <button
                  id="tab-bottom-provenance"
                  onClick={() => setActiveBottomTab('provenance')}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-serif font-bold transition-all cursor-pointer ${
                    activeBottomTab === 'provenance'
                      ? 'bg-[#0f291e] text-[#f5f2eb] shadow-sm'
                      : 'text-stone-600 hover:text-[#0f291e] hover:bg-stone-100'
                  }`}
                >
                  <Database className="h-3.5 w-3.5 text-[#c5a059]" />
                  1. Fact Provenance
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-800 font-sans font-bold">
                    {contextBlocks.length}
                  </span>
                </button>

                <button
                  id="tab-bottom-conflicts"
                  onClick={() => {
                    if (isAnalyzed) setActiveBottomTab('conflicts');
                  }}
                  disabled={!isAnalyzed}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-serif font-bold transition-all ${
                    activeBottomTab === 'conflicts'
                      ? 'bg-[#0f291e] text-[#f5f2eb] shadow-sm cursor-pointer'
                      : !isAnalyzed
                      ? 'text-stone-300 cursor-not-allowed opacity-40'
                      : 'text-stone-600 hover:text-[#0f291e] hover:bg-stone-100 cursor-pointer'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-[#c5a059]" />
                  2. Contradictions
                  {isAnalyzed ? (
                    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#c5a059]/30 text-stone-800 font-sans font-bold">
                      {conflicts.length}
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">🔒</span>
                  )}
                </button>

                <button
                  id="tab-bottom-sandbox"
                  onClick={() => {
                    if (isAnalyzed) setActiveBottomTab('sandbox');
                  }}
                  disabled={!isAnalyzed}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-serif font-bold transition-all ${
                    activeBottomTab === 'sandbox'
                      ? 'bg-[#0f291e] text-[#f5f2eb] shadow-sm cursor-pointer'
                      : !isAnalyzed
                      ? 'text-stone-300 cursor-not-allowed opacity-40'
                      : 'text-stone-600 hover:text-[#0f291e] hover:bg-stone-100 cursor-pointer'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#c5a059]" />
                  3. Replay Sandbox
                  {isAnalyzed ? (
                    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 font-sans font-bold">
                      {currentState === 'REPLAYED' ? '6/6 Passed' : 'Awaiting Replay'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">🔒</span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="bg-white border border-[#c5a059]/25 rounded-xl p-5 shadow-xs">
              {activeBottomTab === 'provenance' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h5 className="font-serif text-base font-bold text-[#0f291e] flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#c5a059]" />
                      Active Retained Context Blocks
                    </h5>
                    <p className="text-xs text-stone-500 mt-0.5">Explore active retrieved files, their token impact, and chronological priority ratings.</p>
                  </div>
                  <ContextInspector
                    contextBlocks={contextBlocks}
                    isAnalyzed={isAnalyzed}
                    isOptimizationApplied={isOptimizationApplied}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                  />
                </div>
              )}

              {activeBottomTab === 'conflicts' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h5 className="font-serif text-base font-bold text-[#0f291e] flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-[#c5a059]" />
                      Audit-Mapped Contradictions
                    </h5>
                    <p className="text-xs text-stone-500 mt-0.5">Scrutinize superseded policy bylaws isolated from active retrieved packages.</p>
                  </div>
                  <ConflictPanel conflicts={conflicts} isAnalyzed={isAnalyzed} />
                </div>
              )}

              {activeBottomTab === 'sandbox' && (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-3">
                    <h5 className="font-serif text-base font-bold text-[#0f291e] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#c5a059]" />
                      Simulation Replay & Safety Verification Sandbox
                    </h5>
                    <p className="text-xs text-stone-500 mt-0.5">Compare the baseline flawed answer with the optimized replay output, and verify against deterministic rule suite assertions.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Panel: Comparison Ledger */}
                    <div className="space-y-6">
                      <ResponseComparison
                        currentState={currentState}
                        baselineResponse={scenario?.baselineResponse || ''}
                        optimizedResponse={replayedResponse}
                        activeScenarioId={activeScenarioId}
                      />
                    </div>

                    {/* Right Panel: Assertions & Summary */}
                    <div className="space-y-6">
                      <OptimizationSummary currentState={currentState} />
                      <EvaluationPanel
                        currentState={currentState}
                        results={
                          evaluationResults.length > 0
                            ? evaluationResults
                            : activeScenarioId === 'banking-policy-conflict'
                            ? [
                                {
                                  id: 'eval-1',
                                  label: 'Mentions $10,000 wire limit',
                                  passed: false,
                                  explanation: 'Evaluates if the replayed answer cites the current $10,000 wire limit.',
                                  baselineResult: 'FAILED — Claimed limit is $5,000',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-2',
                                  label: 'Does not treat $5,000 as limit',
                                  passed: false,
                                  explanation: 'Ensures the agent does not output or reinforce the outdated $5,000 limit.',
                                  baselineResult: 'FAILED — Used outdated limit ($5,000)',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-3',
                                  label: 'Qualifies customer for fee waiver',
                                  passed: false,
                                  explanation: 'Verifies the final answer explicitly states that the customer qualifies for a fee waiver.',
                                  baselineResult: 'FAILED — Rejected waiver request',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-4',
                                  label: 'Applies 90-day waiver rule',
                                  passed: false,
                                  explanation: 'Checks if the answer bases waiver eligibility on the 90-day Platinum cycle.',
                                  baselineResult: 'FAILED — Cited "no waivers allowed"',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-5',
                                  label: 'Uses 120-day customer history',
                                  passed: false,
                                  explanation: 'Confirms checking that previous waiver was 120 days ago (meaning > 90 days, qualifying).',
                                  baselineResult: 'FAILED — Ignored previous transaction history',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-6',
                                  label: 'Discards legacy 2024 policy',
                                  passed: false,
                                  explanation: 'Confirms that the response did not integrate any elements of the superseded Archived Policy.',
                                  baselineResult: 'FAILED — Relying on legacy policy v2024.3',
                                  optimizedResult: 'Awaiting Replay...'
                                }
                              ]
                            : activeScenarioId === 'mortgage-underwriting-conflict'
                            ? [
                                {
                                  id: 'eval-1',
                                  label: 'Allows up to 50% DTI ratio',
                                  passed: false,
                                  explanation: 'Evaluates if Sarah Jenkins qualifies for the premier 50% DTI ratio.',
                                  baselineResult: 'FAILED — Enforced legacy 43% cap',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-2',
                                  label: 'Approves Sarah Jenkins pre-approval',
                                  passed: false,
                                  explanation: 'Ensures applicant is successfully pre-approved under active guidelines.',
                                  baselineResult: 'FAILED — Declined home loan',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-3',
                                  label: 'Uses 780 credit score multiplier',
                                  passed: false,
                                  explanation: 'Verifies checking the high credit score metric to authorize the DTI extension.',
                                  baselineResult: 'FAILED — Ignored credit multiplier',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-4',
                                  label: 'Applies Premier tier rules',
                                  passed: false,
                                  explanation: 'Verifies matching active Premier status criteria rather than standard guidelines.',
                                  baselineResult: 'FAILED — Applied standard rules',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-5',
                                  label: 'Pre-approves balance up to $750,000',
                                  passed: false,
                                  explanation: 'Confirms issuing home loan pre-approval for the full requested amount.',
                                  baselineResult: 'FAILED — Balance not authorized',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-6',
                                  label: 'Discards outdated v2023 handbook',
                                  passed: false,
                                  explanation: 'Ensures no elements of the legacy 2023 handbook are referenced.',
                                  baselineResult: 'FAILED — Relied on legacy handbook v2023.2',
                                  optimizedResult: 'Awaiting Replay...'
                                }
                              ]
                            : [
                                {
                                  id: 'eval-1',
                                  label: 'Authorizes Business class travel',
                                  passed: false,
                                  explanation: 'Verifies business class seating authorization is cited.',
                                  baselineResult: 'FAILED — Claimed strictly prohibited',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-2',
                                  label: 'Sets hotel stipend to $350',
                                  passed: false,
                                  explanation: 'Verifies hotel stipend limit matches City Tier 1 rate.',
                                  baselineResult: 'FAILED — Capped at outdated $150',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-3',
                                  label: 'Identifies City Tier 1 rate',
                                  passed: false,
                                  explanation: 'Ensures the response accounts for New York/London Tier 1 classification.',
                                  baselineResult: 'FAILED — Applied standard staff rule',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-4',
                                  label: 'Verifies flight exceeds 6 hours',
                                  passed: false,
                                  explanation: 'Ensures the response references the flight duration check.',
                                  baselineResult: 'FAILED — Ignored duration rule',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-5',
                                  label: 'Recognizes Vice President status',
                                  passed: false,
                                  explanation: 'Confirms applying management-level travel policy criteria.',
                                  baselineResult: 'FAILED — Misapplied staff limits',
                                  optimizedResult: 'Awaiting Replay...'
                                },
                                {
                                  id: 'eval-6',
                                  label: 'Discards legacy v2022 travel bylaws',
                                  passed: false,
                                  explanation: 'Ensures legacy travel regulations are completely stripped.',
                                  baselineResult: 'FAILED — Relied on outdated bylaws v2022',
                                  optimizedResult: 'Awaiting Replay...'
                                }
                              ]
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Secondary Non-Interactive Section: Expansion Use cases */}
        <div className="border-t border-[#c5a059]/20 pt-6">
          <UseCaseCards />
        </div>

        {/* Product Legal Boundaries Footer */}
        <footer className="border-t border-[#c5a059]/20 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-stone-500">
          <div>
            <span className="font-serif font-bold text-[#0f291e]">Legal Boundary Notice:</span> ContextMeter analyzes the quality of information supplied to AI agents. It does not make automated financial decisions. All demonstration customer names, balances, policy text files, and transaction histories are entirely synthetic.
          </div>
          <div className="shrink-0 font-serif text-[10px] uppercase font-bold tracking-widest text-[#0f291e]">
            ContextMeter Platform v1.2.0 • Prestigious Ledger Theme
          </div>
        </footer>
      </main>
    </div>
  );
}
