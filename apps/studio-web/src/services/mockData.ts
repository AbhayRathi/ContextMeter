/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scenario, AnalyzeResponse, ReplayResponse } from '../types';

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: 'banking-policy-conflict',
    name: 'Banking Policy Conflict',
    category: 'Customer Support Agent',
    riskType: 'Stale and contradictory context',
    customerRequest: 'Am I eligible for an overdraft-fee waiver, and what is my current wire-transfer limit?',
    traceId: 'trace-8a9d2f-2026',
    modelName: 'Gemini 2.5 Flash',
    timestamp: '2026-07-19T16:11:52-07:00',
    baselineResponse: 'Unfortunately, you are not eligible for an overdraft-fee waiver. Your current wire-transfer limit is $5,000.',
    contextBlocks: [
      {
        id: 'block-1',
        title: 'Current Consumer Banking Policy',
        category: 'Policy Registry',
        source: 'Policy Registry (v2026.1)',
        effectiveDate: '2026-01-01',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 420,
        content: `• Platinum customers receive one overdraft-fee waiver every 90 days.
• Current standard wire-transfer limit is $10,000.
• Gold tier customers receive one waiver every 180 days.
• All waivers are subject to manual audit and must be in good standing.`
      },
      {
        id: 'block-2',
        title: 'Archived Consumer Banking Policy',
        category: 'Legacy Knowledge Base',
        source: 'Legacy Knowledge Base (v2024.3)',
        effectiveDate: '2024-01-01',
        supersededStatus: 'Superseded by Current Consumer Banking Policy (2026)',
        verified: true,
        priority: 'Low',
        estimatedTokens: 380,
        content: `• No overdraft-fee waivers are allowed for any account tiers.
• Standard customer wire-transfer limit is $5,000.
• Platinum tier is subject to standard routing restrictions.`
      },
      {
        id: 'block-3',
        title: 'Customer Profile: Abhay Rathi',
        category: 'Customer Record (CRM)',
        source: 'Core CRM System',
        effectiveDate: '2025-11-15',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 210,
        content: `• Customer Name: Abhay Rathi
• Customer Tier: Platinum
• Account Status: Good Standing
• Registered Email: abhay.rathi@sjsu.edu
• Primary Checking Balance: $14,250.00`
      },
      {
        id: 'block-4',
        title: 'Customer Account Fee Waiver History',
        category: 'Account History',
        source: 'Ledger Fee Database',
        effectiveDate: '2026-07-15',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 240,
        content: `• Previous overdraft-fee waiver occurred 120 days ago (March 21, 2026).
• Historical Fee Waiver Count: 3 lifetime
• Total waived fees: $105.00`
      },
      {
        id: 'block-5',
        title: 'Duplicate Conversation History',
        category: 'Session Log',
        source: 'Agent Workspace Memory',
        effectiveDate: '2026-07-19',
        verified: true,
        priority: 'Low',
        estimatedTokens: 320,
        content: `[User Request Repeated]
"Am I eligible for an overdraft-fee waiver, and what is my current wire-transfer limit?"
[System State Log]
Checking eligibility criteria for Abhay Rathi.`
      },
      {
        id: 'block-6',
        title: 'Credit Card Promotion Campaign',
        category: 'Marketing Registry',
        source: 'Campaign Manager (v2)',
        effectiveDate: '2026-06-01',
        verified: true,
        priority: 'Low',
        estimatedTokens: 280,
        content: `• Earn 50,000 bonus points with our new Infinite Cash Rewards card.
• Intro APR: 0% for the first 12 billing cycles.
• Apply within the next 30 days to qualify.`
      }
    ]
  },
  {
    id: 'mortgage-underwriting-conflict',
    name: 'Mortgage Underwriting Contradiction',
    category: 'Lending & Underwriting Copilot',
    riskType: 'Superseded regulatory guidelines',
    customerRequest: 'What is my maximum Debt-to-Income (DTI) limit, and do I qualify for the home pre-approval loan program?',
    traceId: 'trace-2d3b4e-2026',
    modelName: 'Gemini 2.5 Flash',
    timestamp: '2026-07-19T16:22:15-07:00',
    baselineResponse: 'Based on archived underwriting rules, your maximum allowed Debt-to-Income (DTI) limit is 43%, and your home pre-approval request is declined because your DTI is currently 45%.',
    contextBlocks: [
      {
        id: 'mortgage-1',
        title: 'Current Underwriting Guidelines',
        category: 'Policy Registry',
        source: 'Underwriting Board (v2026.4)',
        effectiveDate: '2026-04-10',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 450,
        content: `• Premier and Platinum tier applicants qualify for maximum Debt-to-Income (DTI) limits of 50%.
• Home pre-approval limit for the Platinum Premier bracket is capped at $750,000.
• Non-conforming jumbo mortgages are subject to localized asset reviews.`
      },
      {
        id: 'mortgage-2',
        title: 'Legacy Mortgage Handbook',
        category: 'Legacy Knowledge Base',
        source: 'Underwriting Archive (v2023.2)',
        effectiveDate: '2023-09-01',
        supersededStatus: 'Superseded by Current Underwriting Guidelines (2026)',
        verified: true,
        priority: 'Low',
        estimatedTokens: 410,
        content: `• Maximum allowed Debt-to-Income (DTI) ratio is capped strictly at 43% for all tiers.
• Mortgage pre-approval limit is restricted to a maximum of $450,000 without exception.`
      },
      {
        id: 'mortgage-3',
        title: 'Applicant Profile: Sarah Jenkins',
        category: 'Customer Record (CRM)',
        source: 'Loan Origination CRM',
        effectiveDate: '2026-02-14',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 180,
        content: `• Applicant Name: Sarah Jenkins
• Membership Bracket: Premier
• Current Back-End DTI: 45%
• Verified Annual Income: $140,000.00
• Primary Co-signer: None`
      },
      {
        id: 'mortgage-4',
        title: 'Credit Bureau Underwriting Audit',
        category: 'Account History',
        source: 'Equifax Ledger',
        effectiveDate: '2026-07-10',
        verified: true,
        priority: 'High',
        estimatedTokens: 250,
        content: `• Credit Bureau Scoring: 780 Excellent
• Delinquencies: 0 reported
• Employment verification status: Confirmed Active`
      },
      {
        id: 'mortgage-5',
        title: 'Redundant Loan Inquiry Log',
        category: 'Session Log',
        source: 'Agent Workspace Memory',
        effectiveDate: '2026-07-19',
        verified: true,
        priority: 'Low',
        estimatedTokens: 290,
        content: `[System Memory Log]
Checking home pre-approval brackets for Sarah Jenkins.
Current DTI query is active on external database endpoints.`
      },
      {
        id: 'mortgage-6',
        title: 'Promotional Auto Loan Circular',
        category: 'Marketing Registry',
        source: 'Marketing Campaign Manager',
        effectiveDate: '2026-05-15',
        verified: true,
        priority: 'Low',
        estimatedTokens: 220,
        content: `• Financing offers for summer automobile purchases.
• Interest rate starting at 2.9% APR for eligible prime borrowers.`
      }
    ]
  },
  {
    id: 'corporate-policy-conflict',
    name: 'Corporate Travel Policy Inconsistency',
    category: 'Enterprise Knowledge Assistant',
    riskType: 'Contradictory internal bylaws',
    customerRequest: 'Can I book a business class ticket for my flight to London, and what is the maximum nightly hotel allowance?',
    traceId: 'trace-4e5f6g-2026',
    modelName: 'Gemini 2.5 Flash',
    timestamp: '2026-07-19T16:34:02-07:00',
    baselineResponse: 'Business class travel is strictly prohibited for all staff. Your nightly lodging expense is capped at $150.',
    contextBlocks: [
      {
        id: 'corp-1',
        title: 'Travel Policy Handbook',
        category: 'Policy Registry',
        source: 'Corporate Operations (v2026.2)',
        effectiveDate: '2026-01-15',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 480,
        content: `• Business class travel is authorized for international flights exceeding 6 hours in total duration.
• Standard nightly hotel allowance for Tier 1 cities (including London) is $350.
• Travel approval requests must be submitted at least 14 days prior.`
      },
      {
        id: 'corp-2',
        title: 'Travel Guidelines Circular',
        category: 'Legacy Knowledge Base',
        source: 'Internal Operations (v2022.1)',
        effectiveDate: '2022-03-01',
        supersededStatus: 'Superseded by Travel Policy Handbook (2026)',
        verified: true,
        priority: 'Low',
        estimatedTokens: 390,
        content: `• Business class seating is strictly prohibited for all personnel under any circumstances.
• Maximum nightly hotel stipend is capped at $150 across all metropolitan regions.`
      },
      {
        id: 'corp-3',
        title: 'Employee Profile: Marcus Vance',
        category: 'Customer Record (CRM)',
        source: 'Workday HR Directory',
        effectiveDate: '2025-08-01',
        verified: true,
        priority: 'Critical',
        estimatedTokens: 190,
        content: `• Employee: Marcus Vance
• Title: Vice President
• Department: Business Development
• Default Travel Route: JFK to LHR (7.5 hours flight duration)
• Office Location: New York`
      },
      {
        id: 'corp-4',
        title: 'Corporate Travel Expense Ledger',
        category: 'Account History',
        source: 'Concur Expense System',
        effectiveDate: '2026-07-01',
        verified: true,
        priority: 'Medium',
        estimatedTokens: 210,
        content: `• Pre-authorized travel budget: $5,000.00
• Card Status: Active
• Lifetime approved expenses: $34,250.00`
      },
      {
        id: 'corp-5',
        title: 'Redundant Travel Conversation Slack Log',
        category: 'Session Log',
        source: 'Agent Workspace Memory',
        effectiveDate: '2026-07-19',
        verified: true,
        priority: 'Low',
        estimatedTokens: 310,
        content: `[Dialogue Log]
"Can I book business class? Let me check the old 2022 policy guide. Wait, is there a 2026 update?"
"The traveler's destination is London, flying from JFK."`
      },
      {
        id: 'corp-6',
        title: 'Office Wellness Gym Voucher',
        category: 'Marketing Registry',
        source: 'Benefits Directory (v3)',
        effectiveDate: '2026-01-01',
        verified: true,
        priority: 'Low',
        estimatedTokens: 170,
        content: `• Join the corporate health initiative.
• Get up to 50% discount on partner fitness center memberships.`
      }
    ]
  }
];

export const MOCK_ANALYSES: Record<string, AnalyzeResponse> = {
  'banking-policy-conflict': {
    decisions: [
      {
        contextBlockId: 'block-1',
        recommendedAction: 'KEEP',
        recommendationReason: 'Contains current active policy facts ($10,000 wire limit and 90-day waiver rule for Platinum tier). Critical for answering correctly.',
        riskIfRemoved: 'The agent will have no access to the current 2026 policy terms and will fail to answer or will hallucinate limits.'
      },
      {
        contextBlockId: 'block-2',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Outdated legacy policy (v2024) containing stale figures ($5,000 wire limit, no waivers). Contradicts the newer 2026 policy.',
        riskIfRemoved: 'None. Removing this prevents policy conflicts and ensures the agent relies on active 2026 rules.'
      },
      {
        contextBlockId: 'block-3',
        recommendedAction: 'KEEP',
        recommendationReason: 'Identifies user tier as Platinum, which matches waiver entitlement under current policies.',
        riskIfRemoved: 'The agent will not know the user is a Platinum customer, thus failing to apply the correct waiver terms.'
      },
      {
        contextBlockId: 'block-4',
        recommendedAction: 'KEEP',
        recommendationReason: 'Confirms previous waiver was 120 days ago. This is essential to compare with the 90-day policy window.',
        riskIfRemoved: 'The agent will lack transaction evidence, preventing objective duration qualification check.'
      },
      {
        contextBlockId: 'block-5',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Redundant dialogue transcript. Increases context size by 320 tokens without offering any additional facts.',
        riskIfRemoved: 'None. Removing duplicate records improves agent performance and reduces input token cost.'
      },
      {
        contextBlockId: 'block-6',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Unrelated marketing material regarding rewards credit cards. Completely irrelevant to checking checking waivers or wire limits.',
        riskIfRemoved: 'None. Eliminating clutter prevents distractibility in long context and reduces unnecessary billing costs.'
      }
    ],
    conflicts: [
      {
        id: 'conflict-1',
        title: 'Wire-Transfer Limit Contradiction',
        severity: 'High',
        recommendation: 'Prioritize Current Consumer Banking Policy (v2026.1). Retire Archived Policy (v2024.3).',
        blockA: {
          id: 'block-1',
          source: 'Policy Registry (v2026.1)',
          value: 'Wire-transfer limit is $10,000',
          isNewer: true,
          verified: true
        },
        blockB: {
          id: 'block-2',
          source: 'Legacy Knowledge Base (v2024.3)',
          value: 'Wire-transfer limit is $5,000',
          isNewer: false,
          verified: true
        }
      },
      {
        id: 'conflict-2',
        title: 'Overdraft-Fee Waiver Availability',
        severity: 'High',
        recommendation: 'Prioritize Current Consumer Banking Policy (v2026.1). Retire Archived Policy (v2024.3).',
        blockA: {
          id: 'block-1',
          source: 'Policy Registry (v2026.1)',
          value: 'Platinum customers receive one waiver every 90 days',
          isNewer: true,
          verified: true
        },
        blockB: {
          id: 'block-2',
          source: 'Legacy Knowledge Base (v2024.3)',
          value: 'No overdraft-fee waivers are allowed',
          isNewer: false,
          verified: true
        }
      }
    ],
    optimizedContextIds: ['block-1', 'block-3', 'block-4'],
    summary: 'The agent received two verified but conflicting policy documents. The 2024 policy was superseded by the current 2026 policy but remained active in the context. Duplicate conversation history and unrelated marketing material increased context size without contributing useful evidence.',
    baselineEstimatedTokens: 1850,
    optimizedEstimatedTokens: 870,
    mode: 'fallback'
  },
  'mortgage-underwriting-conflict': {
    decisions: [
      {
        contextBlockId: 'mortgage-1',
        recommendedAction: 'KEEP',
        recommendationReason: 'Specifies active 2026 underwriting guidelines allowing up to 50% DTI ratio for Premier bracket and $750k pre-approval limit.',
        riskIfRemoved: 'The copilot will default to outdated risk models or reject eligible credit applicants.'
      },
      {
        contextBlockId: 'mortgage-2',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Stale 2023 handbook limit (43% DTI restriction and $450k pre-approval cap). Outdated and directly superseded.',
        riskIfRemoved: 'None. Purging legacy limits prevents critical credit origination failures.'
      },
      {
        contextBlockId: 'mortgage-3',
        recommendedAction: 'KEEP',
        recommendationReason: 'Contains Sarah Jenkins credit application data including actual 45% DTI and active Premier status.',
        riskIfRemoved: 'Agent will have no verified record of applicant DTI, making calculation check impossible.'
      },
      {
        contextBlockId: 'mortgage-4',
        recommendedAction: 'KEEP',
        recommendationReason: 'Verifies top-tier 780 Equifax credit score, supporting qualification for Premier thresholds.',
        riskIfRemoved: 'Underwriting models cannot approve high-balance programs without current bureau audit verification.'
      },
      {
        contextBlockId: 'mortgage-5',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Unnecessary workspace telemetry log. Duplicates basic applicant tracking details without contributing facts.',
        riskIfRemoved: 'None. Discarding trace noise improves reasoning deterministic compliance.'
      },
      {
        contextBlockId: 'mortgage-6',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Ad flyer for auto financing. Entirely irrelevant to mortgage qualifications.',
        riskIfRemoved: 'None. Removing unrelated promotions protects context safety and model focus.'
      }
    ],
    conflicts: [
      {
        id: 'mortgage-conflict-1',
        title: 'Debt-to-Income (DTI) Limit Discrepancy',
        severity: 'High',
        recommendation: 'Prioritize Current Underwriting Guidelines (v2026.4). Retire Legacy Mortgage Handbook (v2023.2).',
        blockA: {
          id: 'mortgage-1',
          source: 'Underwriting Board (v2026.4)',
          value: 'Premier applicants qualify for up to 50% DTI',
          isNewer: true,
          verified: true
        },
        blockB: {
          id: 'mortgage-2',
          source: 'Underwriting Archive (v2023.2)',
          value: 'DTI is capped strictly at 43% for all tiers',
          isNewer: false,
          verified: true
        }
      },
      {
        id: 'mortgage-conflict-2',
        title: 'Pre-approval Balance Cap Variation',
        severity: 'Medium',
        recommendation: 'Prioritize 2026 Guideline threshold ($750k limit). Retire 2023 archived cap ($450k).',
        blockA: {
          id: 'mortgage-1',
          source: 'Underwriting Board (v2026.4)',
          value: 'Pre-approval Platinum Premier capped at $750,000',
          isNewer: true,
          verified: true
        },
        blockB: {
          id: 'mortgage-2',
          source: 'Underwriting Archive (v2023.2)',
          value: 'Pre-approval cap restricted to $450,000',
          isNewer: false,
          verified: true
        }
      }
    ],
    optimizedContextIds: ['mortgage-1', 'mortgage-3', 'mortgage-4'],
    summary: 'The underwriting system loaded outdated 2023 credit limits alongside current 2026 guidelines. This caused the model to reject a highly qualified applicant (780 score, 45% DTI) by applying the stale 43% DTI threshold. Cleaning duplicate workspace files and unrelated auto promotions minimized context clutter.',
    baselineEstimatedTokens: 1840,
    optimizedEstimatedTokens: 880,
    mode: 'fallback'
  },
  'corporate-policy-conflict': {
    decisions: [
      {
        contextBlockId: 'corp-1',
        recommendedAction: 'KEEP',
        recommendationReason: 'Contains 2026 Travel handbook terms permitting business class for international routes over 6 hours and setting a Tier 1 lodging cap of $350.',
        riskIfRemoved: 'The assistant will enforce stale wellness and travel boundaries, resulting in incorrect expense denials.'
      },
      {
        contextBlockId: 'corp-2',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Stale 2022 Operations guideline prohibiting business class travel and capping hotel budgets at $150.',
        riskIfRemoved: 'None. Removing this eliminates conflicting guidance on lodging and seating tiers.'
      },
      {
        contextBlockId: 'corp-3',
        recommendedAction: 'KEEP',
        recommendationReason: 'Identifies traveler Marcus Vance, VP, flying JFK to LHR (7.5-hour flight). Essential for duration-based policies.',
        riskIfRemoved: 'The assistant cannot verify flight duration, preventing automatic business class qualification.'
      },
      {
        contextBlockId: 'corp-4',
        recommendedAction: 'KEEP',
        recommendationReason: 'Verifies travel credit card is active with adequate pre-authorized travel budget.',
        riskIfRemoved: 'The assistant will fail to check active financial credentials before confirming travel.'
      },
      {
        contextBlockId: 'corp-5',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Redundant dialogue snippet repeating route details from slack workspace history.',
        riskIfRemoved: 'None. Purging conversational duplicate streams saves tokens.'
      },
      {
        contextBlockId: 'corp-6',
        recommendedAction: 'REMOVE',
        recommendationReason: 'Wellness gym marketing voucher. Completely unrelated to corporate flight or lodging allowance parameters.',
        riskIfRemoved: 'None. Discarding promotional noise eliminates model distraction.'
      }
    ],
    conflicts: [
      {
        id: 'corp-conflict-1',
        title: 'International Seating Eligibility Conflict',
        severity: 'High',
        recommendation: 'Prioritize Travel Policy Handbook (v2026.2). Retire Legacy Travel Guidelines (v2022.1).',
        blockA: {
          id: 'corp-1',
          source: 'Corporate Operations (v2026.2)',
          value: 'Business class authorized for flights over 6 hours',
          isNewer: true,
          verified: true
        },
        blockB: {
          id: 'corp-2',
          source: 'Internal Operations (v2022.1)',
          value: 'Business class is strictly prohibited',
          isNewer: false,
          verified: true
        }
      },
      {
        id: 'corp-conflict-2',
        title: 'Nightly Lodging Allowance Variance',
        severity: 'Medium',
        recommendation: 'Prioritize 2026 City Tier 1 Limit ($350 hotel allowance). Retire 2022 standard limit ($150).',
        blockA: {
          id: 'corp-1',
          source: 'Corporate Operations (v2026.2)',
          value: 'Lodging allowance for Tier 1 cities is $350',
          isNewer: true,
          verified: true
        },
        blockB: {
          id: 'corp-2',
          source: 'Internal Operations (v2022.1)',
          value: 'Lodging stipend is capped at $150',
          isNewer: false,
          verified: true
        }
      }
    ],
    optimizedContextIds: ['corp-1', 'corp-3', 'corp-4'],
    summary: 'The knowledge assistant loaded contradictory 2022 guidelines alongside current 2026 bylaws. This caused the model to deny a business class reservation for a VP flying an international 7.5-hour flight and apply an outdated $150 lodging rate. Discarding gym benefit ads and chat transcripts reduced context and restored absolute policy alignment.',
    baselineEstimatedTokens: 1950,
    optimizedEstimatedTokens: 880,
    mode: 'fallback'
  }
};

export const MOCK_REPLAYS: Record<string, ReplayResponse> = {
  'banking-policy-conflict': {
    response: 'Yes, you are eligible for an overdraft-fee waiver! As a Platinum tier customer, you are eligible for one waiver every 90 days. Since your last waiver was 120 days ago, you qualify for this benefit. Additionally, your current wire-transfer limit is $10,000, as defined by the Current Consumer Banking Policy.',
    estimatedInputTokens: 870,
    evaluation: {
      passed: 6,
      total: 6,
      score: 100,
      results: [
        {
          id: 'eval-1',
          label: 'Mentions $10,000 wire limit',
          passed: true,
          explanation: 'Evaluates if the replayed answer cites the current $10,000 wire limit.',
          baselineResult: 'FAILED — Claimed limit is $5,000',
          optimizedResult: 'PASSED — Stated limit is $10,000'
        },
        {
          id: 'eval-2',
          label: 'Does not treat $5,000 as limit',
          passed: true,
          explanation: 'Ensures the agent does not output or reinforce the outdated $5,000 limit.',
          baselineResult: 'FAILED — Used outdated limit ($5,000)',
          optimizedResult: 'PASSED — Stale value was omitted entirely'
        },
        {
          id: 'eval-3',
          label: 'Qualifies customer for fee waiver',
          passed: true,
          explanation: 'Verifies the final answer explicitly states that the customer qualifies for a fee waiver.',
          baselineResult: 'FAILED — Rejected waiver request',
          optimizedResult: 'PASSED — Confirmed waiver eligibility'
        },
        {
          id: 'eval-4',
          label: 'Applies 90-day waiver rule',
          passed: true,
          explanation: 'Checks if the answer bases waiver eligibility on the 90-day Platinum cycle.',
          baselineResult: 'FAILED — Cited "no waivers allowed"',
          optimizedResult: 'PASSED — Correctly cited 90-day Platinum eligibility'
        },
        {
          id: 'eval-5',
          label: 'Uses 120-day customer history',
          passed: true,
          explanation: 'Confirms checking that previous waiver was 120 days ago (meaning > 90 days, qualifying).',
          baselineResult: 'FAILED — Ignored previous transaction history',
          optimizedResult: 'PASSED — Verified 120 days since previous waiver'
        },
        {
          id: 'eval-6',
          label: 'Discards legacy 2024 policy',
          passed: true,
          explanation: 'Confirms that the response did not integrate any elements of the superseded Archived Policy.',
          baselineResult: 'FAILED — Relying on legacy policy v2024.3',
          optimizedResult: 'PASSED — Completely ignored legacy policy'
        }
      ]
    },
    mode: 'fallback'
  },
  'mortgage-underwriting-conflict': {
    response: 'Great news! You qualify for the home pre-approval loan program! Under the Current Underwriting Guidelines (v2026.4), applicant Sarah Jenkins is eligible for an expanded Debt-to-Income (DTI) ratio limit of up to 50% as a Premier tier member. Since your active back-end DTI ratio is verified at 45% (and supported by an excellent 780 Equifax credit score), your pre-approval request is officially approved for a balance of up to $750,000.',
    estimatedInputTokens: 880,
    evaluation: {
      passed: 6,
      total: 6,
      score: 100,
      results: [
        {
          id: 'mortgage-eval-1',
          label: 'Mentions 50% DTI limit',
          passed: true,
          explanation: 'Evaluates if the replayed answer cites the current 50% limit for Premier members.',
          baselineResult: 'FAILED — Claimed DTI is capped at 43%',
          optimizedResult: 'PASSED — Cited 50% Premier limit'
        },
        {
          id: 'mortgage-eval-2',
          label: 'Does not apply 43% DTI cap',
          passed: true,
          explanation: 'Ensures the agent does not output or reinforce the outdated 43% handbook rule.',
          baselineResult: 'FAILED — Applied legacy 43% limit',
          optimizedResult: 'PASSED — Stale guideline omitted entirely'
        },
        {
          id: 'mortgage-eval-3',
          label: 'Confirms pre-approval approval',
          passed: true,
          explanation: 'Verifies the final answer explicitly states that the applicant qualifies and is approved.',
          baselineResult: 'FAILED — Declined the mortgage request',
          optimizedResult: 'PASSED — Pre-approval successfully approved'
        },
        {
          id: 'mortgage-eval-4',
          label: 'Applies 2026 Premier tier waiver rules',
          passed: true,
          explanation: 'Checks if the answer bases mortgage eligibility on 2026 Premier tier brackets.',
          baselineResult: 'FAILED — Cited 2023 general rules',
          optimizedResult: 'PASSED — Applied correct 2026 tier rules'
        },
        {
          id: 'mortgage-eval-5',
          label: 'Cites applicant 45% current DTI',
          passed: true,
          explanation: 'Confirms checking that applicant current DTI is 45% (which is < 50% allowed).',
          baselineResult: 'FAILED — Ignored CRM applicant record',
          optimizedResult: 'PASSED — Confirmed 45% DTI is within 50% cap'
        },
        {
          id: 'mortgage-eval-6',
          label: 'Discards stale 2023 mortgage handbook',
          passed: true,
          explanation: 'Confirms that the response did not integrate any elements of the superseded 2023 handbook.',
          baselineResult: 'FAILED — Relying on legacy mortgage handbook',
          optimizedResult: 'PASSED — Completely ignored legacy handbook'
        }
      ]
    },
    mode: 'fallback'
  },
  'corporate-policy-conflict': {
    response: 'Yes, you are authorized to book a business class ticket for your flight from New York to London! Corporate Travel Policy (v2026.2) authorizes business class booking for international travel exceeding 6 hours, which applies to your 7.5-hour flight duration as a Vice President. Additionally, your nightly hotel stipend is verified at the updated City Tier 1 rate of $350.',
    estimatedInputTokens: 880,
    evaluation: {
      passed: 6,
      total: 6,
      score: 100,
      results: [
        {
          id: 'corp-eval-1',
          label: 'Mentions business class authorization',
          passed: true,
          explanation: 'Evaluates if the replayed answer cites business class is authorized for flights > 6 hours.',
          baselineResult: 'FAILED — Claimed business class is strictly prohibited',
          optimizedResult: 'PASSED — Cites travel authorization for flights > 6 hours'
        },
        {
          id: 'corp-eval-2',
          label: 'Discards obsolete $150 hotel cap',
          passed: true,
          explanation: 'Ensures the agent does not output or reinforce the outdated 2022 hotel allowance.',
          baselineResult: 'FAILED — Applied obsolete $150 hotel limit',
          optimizedResult: 'PASSED — Stale hotel limit was omitted entirely'
        },
        {
          id: 'corp-eval-3',
          label: 'Verifies route duration exceeds 6 hours',
          passed: true,
          explanation: 'Verifies the final answer references traveler route exceeds 6 hours (JFK to LHR 7.5 hours).',
          baselineResult: 'FAILED — Omitted flight route duration check',
          optimizedResult: 'PASSED — Verified flight exceeds 6 hours limit'
        },
        {
          id: 'corp-eval-4',
          label: 'Restores correct $350 lodging allowance',
          passed: true,
          explanation: 'Checks if the answer restores the current $350 lodging allowance rate for London.',
          baselineResult: 'FAILED — Standard $150 cap applied',
          optimizedResult: 'PASSED — Cites standard city allowance of $350'
        },
        {
          id: 'corp-eval-5',
          label: 'Cites Marcus Vance VP credentials',
          passed: true,
          explanation: 'Confirms checking that the employee is Vice President of Business Development.',
          baselineResult: 'FAILED — Ignored employee Workday folder details',
          optimizedResult: 'PASSED — Verified Marcus Vance credentials'
        },
        {
          id: 'corp-eval-6',
          label: 'Excludes deprecated travel guidelines',
          passed: true,
          explanation: 'Confirms that the response did not integrate any elements of the superseded 2022 circular.',
          baselineResult: 'FAILED — Relying on legacy 2022 guidelines',
          optimizedResult: 'PASSED — Completely ignored legacy travel circular'
        }
      ]
    },
    mode: 'fallback'
  }
};

// Legacy exports for compatibility
export const MOCK_ANALYSIS: AnalyzeResponse = MOCK_ANALYSES['banking-policy-conflict'];
export const MOCK_REPLAY: ReplayResponse = MOCK_REPLAYS['banking-policy-conflict'];
