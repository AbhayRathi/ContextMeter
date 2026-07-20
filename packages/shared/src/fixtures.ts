import type { ContextBlock, ContextConflict, Scenario } from "./types.js";

// Content transcribed from contextmeter-frontend-unpacked/src/services/mockData.ts
// and App.tsx so the real (fallback-mode) backend tells the identical story as
// the frontend's own mock data — flipping "LIVE FEED" shouldn't change the demo.

export const BANKING_CONTEXT_BLOCKS: ContextBlock[] = [
  {
    id: "block-1",
    title: "Current Consumer Banking Policy",
    category: "policy",
    source: "Policy Registry (v2026.1)",
    effectiveDate: "2026-01-01",
    verified: true,
    priority: "critical",
    estimatedTokens: 420,
    content:
      "• Platinum customers receive one overdraft-fee waiver every 90 days.\n• Current standard wire-transfer limit is $10,000.\n• Gold tier customers receive one waiver every 180 days.\n• All waivers are subject to manual audit and must be in good standing.",
    fallbackDecision: {
      action: "KEEP",
      reason:
        "Contains current active policy facts ($10,000 wire limit and 90-day waiver rule for Platinum tier). Critical for answering correctly.",
      riskIfRemoved:
        "The agent will have no access to the current 2026 policy terms and will fail to answer or will hallucinate limits.",
      risk: "LOW",
    },
  },
  {
    id: "block-2",
    title: "Archived Consumer Banking Policy",
    category: "policy",
    source: "Legacy Knowledge Base (v2024.3)",
    effectiveDate: "2024-01-01",
    supersededStatus: "Superseded by Current Consumer Banking Policy (2026)",
    verified: true,
    priority: "low",
    estimatedTokens: 380,
    content:
      "• No overdraft-fee waivers are allowed for any account tiers.\n• Standard customer wire-transfer limit is $5,000.\n• Platinum tier is subject to standard routing restrictions.",
    fallbackDecision: {
      action: "REMOVE",
      reason:
        "Outdated legacy policy (v2024) containing stale figures ($5,000 wire limit, no waivers). Contradicts the newer 2026 policy.",
      riskIfRemoved:
        "None. Removing this prevents policy conflicts and ensures the agent relies on active 2026 rules.",
      risk: "LOW",
    },
  },
  {
    id: "block-3",
    title: "Customer Profile: Abhay Rathi",
    category: "customer_profile",
    source: "Core CRM System",
    effectiveDate: "2025-11-15",
    verified: true,
    priority: "critical",
    estimatedTokens: 210,
    content:
      "• Customer Name: Abhay Rathi\n• Customer Tier: Platinum\n• Account Status: Good Standing\n• Registered Email: abhay.rathi@sjsu.edu\n• Primary Checking Balance: $14,250.00",
    fallbackDecision: {
      action: "KEEP",
      reason: "Identifies user tier as Platinum, which matches waiver entitlement under current policies.",
      riskIfRemoved:
        "The agent will not know the user is a Platinum customer, thus failing to apply the correct waiver terms.",
      risk: "LOW",
    },
  },
  {
    id: "block-4",
    title: "Customer Account Fee Waiver History",
    category: "account_history",
    source: "Ledger Fee Database",
    effectiveDate: "2026-07-15",
    verified: true,
    priority: "critical",
    estimatedTokens: 240,
    content:
      "• Previous overdraft-fee waiver occurred 120 days ago (March 21, 2026).\n• Historical Fee Waiver Count: 3 lifetime\n• Total waived fees: $105.00",
    fallbackDecision: {
      action: "KEEP",
      reason:
        "Confirms previous waiver was 120 days ago. This is essential to compare with the 90-day policy window.",
      riskIfRemoved:
        "The agent will lack transaction evidence, preventing objective duration qualification check.",
      risk: "LOW",
    },
  },
  {
    id: "block-5",
    title: "Duplicate Conversation History",
    category: "conversation",
    source: "Agent Workspace Memory",
    effectiveDate: "2026-07-19",
    verified: true,
    priority: "low",
    estimatedTokens: 320,
    content:
      '[User Request Repeated]\n"Am I eligible for an overdraft-fee waiver, and what is my current wire-transfer limit?"\n[System State Log]\nChecking eligibility criteria for Abhay Rathi.',
    fallbackDecision: {
      action: "REMOVE",
      reason: "Redundant dialogue transcript. Increases context size by 320 tokens without offering any additional facts.",
      riskIfRemoved: "None. Removing duplicate records improves agent performance and reduces input token cost.",
      risk: "LOW",
    },
  },
  {
    id: "block-6",
    title: "Credit Card Promotion Campaign",
    category: "marketing",
    source: "Campaign Manager (v2)",
    effectiveDate: "2026-06-01",
    verified: true,
    priority: "low",
    estimatedTokens: 280,
    content:
      "• Earn 50,000 bonus points with our new Infinite Cash Rewards card.\n• Intro APR: 0% for the first 12 billing cycles.\n• Apply within the next 30 days to qualify.",
    fallbackDecision: {
      action: "REMOVE",
      reason:
        "Unrelated marketing material regarding rewards credit cards. Completely irrelevant to checking waivers or wire limits.",
      riskIfRemoved:
        "None. Eliminating clutter prevents distractibility in long context and reduces unnecessary billing costs.",
      risk: "LOW",
    },
  },
];

export const BANKING_BASELINE_RESPONSE =
  "Unfortunately, you are not eligible for an overdraft-fee waiver. Your current wire-transfer limit is $5,000.";

export const BANKING_EXPECTED_OPTIMIZED_FACTS = [
  "Customer is eligible for an overdraft-fee waiver (Platinum tier, last waiver 120 days ago, policy requires 90 days)",
  "Current wire-transfer limit is $10,000",
  "Legacy 2024 policy (no waivers, $5,000 limit) is superseded and must not be used",
];

export const BANKING_EXPECTED_OPTIMIZED_RESPONSE =
  "Yes, you are eligible for an overdraft-fee waiver! As a Platinum tier customer, you are eligible for one waiver every 90 days. Since your last waiver was 120 days ago, you qualify for this benefit. Additionally, your current wire-transfer limit is $10,000, as defined by the Current Consumer Banking Policy.";

export const BANKING_FALLBACK_CONFLICTS: ContextConflict[] = [
  {
    id: "conflict-1",
    title: "Wire-Transfer Limit Contradiction",
    blockIds: ["block-1", "block-2"],
    blockAValue: "Wire-transfer limit is $10,000",
    blockBValue: "Wire-transfer limit is $5,000",
    description:
      "Policy Registry (v2026.1) states the wire-transfer limit is $10,000, while Legacy Knowledge Base (v2024.3) states it is $5,000. These figures directly contradict each other.",
    resolution: "Prioritize Current Consumer Banking Policy (v2026.1). Retire Archived Policy (v2024.3).",
    severity: "HIGH",
  },
  {
    id: "conflict-2",
    title: "Overdraft-Fee Waiver Availability",
    blockIds: ["block-1", "block-2"],
    blockAValue: "Platinum customers receive one waiver every 90 days",
    blockBValue: "No overdraft-fee waivers are allowed",
    description:
      "Policy Registry (v2026.1) permits one overdraft-fee waiver every 90 days for Platinum customers, while Legacy Knowledge Base (v2024.3) states no waivers are allowed at all. These policies directly contradict each other.",
    resolution: "Prioritize Current Consumer Banking Policy (v2026.1). Retire Archived Policy (v2024.3).",
    severity: "HIGH",
  },
];

export const BANKING_SCENARIO: Scenario = {
  id: "banking-policy-conflict",
  title: "Banking Policy Conflict",
  customerTask: "Am I eligible for an overdraft-fee waiver, and what is my current wire-transfer limit?",
  contextBlocks: BANKING_CONTEXT_BLOCKS,
  baselineResponse: BANKING_BASELINE_RESPONSE,
  expectedOptimizedFacts: BANKING_EXPECTED_OPTIMIZED_FACTS,
  fallbackConflicts: BANKING_FALLBACK_CONFLICTS,
  expectedOptimizedResponse: BANKING_EXPECTED_OPTIMIZED_RESPONSE,
  category: "Customer Support Agent",
  riskType: "Stale and contradictory context",
  traceId: "trace-8a9d2f-2026",
  modelName: "Gemini 2.5 Flash",
  timestamp: "2026-07-19T16:11:52-07:00",
};

export const MORTGAGE_CONTEXT_BLOCKS: ContextBlock[] = [
  {
    id: "mortgage-1",
    title: "Current Underwriting Guidelines",
    category: "policy",
    source: "Underwriting Board (v2026.4)",
    effectiveDate: "2026-04-10",
    verified: true,
    priority: "critical",
    estimatedTokens: 450,
    content:
      "• Premier and Platinum tier applicants qualify for maximum Debt-to-Income (DTI) limits of 50%.\n• Home pre-approval limit for the Platinum Premier bracket is capped at $750,000.\n• Non-conforming jumbo mortgages are subject to localized asset reviews.",
    fallbackDecision: {
      action: "KEEP",
      reason:
        "Specifies active 2026 underwriting guidelines allowing up to 50% DTI ratio for Premier bracket and $750k pre-approval limit.",
      riskIfRemoved: "The copilot will default to outdated risk models or reject eligible credit applicants.",
      risk: "LOW",
    },
  },
  {
    id: "mortgage-2",
    title: "Legacy Mortgage Handbook",
    category: "policy",
    source: "Underwriting Archive (v2023.2)",
    effectiveDate: "2023-09-01",
    supersededStatus: "Superseded by Current Underwriting Guidelines (2026)",
    verified: true,
    priority: "low",
    estimatedTokens: 410,
    content:
      "• Maximum allowed Debt-to-Income (DTI) ratio is capped strictly at 43% for all tiers.\n• Mortgage pre-approval limit is restricted to a maximum of $450,000 without exception.",
    fallbackDecision: {
      action: "REMOVE",
      reason:
        "Stale 2023 handbook limit (43% DTI restriction and $450k pre-approval cap). Outdated and directly superseded.",
      riskIfRemoved: "None. Purging legacy limits prevents critical credit origination failures.",
      risk: "LOW",
    },
  },
  {
    id: "mortgage-3",
    title: "Applicant Profile: Sarah Jenkins",
    category: "customer_profile",
    source: "Loan Origination CRM",
    effectiveDate: "2026-02-14",
    verified: true,
    priority: "critical",
    estimatedTokens: 180,
    content:
      "• Applicant Name: Sarah Jenkins\n• Membership Bracket: Premier\n• Current Back-End DTI: 45%\n• Verified Annual Income: $140,000.00\n• Primary Co-signer: None",
    fallbackDecision: {
      action: "KEEP",
      reason: "Contains Sarah Jenkins credit application data including actual 45% DTI and active Premier status.",
      riskIfRemoved: "Agent will have no verified record of applicant DTI, making calculation check impossible.",
      risk: "LOW",
    },
  },
  {
    id: "mortgage-4",
    title: "Credit Bureau Underwriting Audit",
    category: "account_history",
    source: "Equifax Ledger",
    effectiveDate: "2026-07-10",
    verified: true,
    priority: "high",
    estimatedTokens: 250,
    content: "• Credit Bureau Scoring: 780 Excellent\n• Delinquencies: 0 reported\n• Employment verification status: Confirmed Active",
    fallbackDecision: {
      action: "KEEP",
      reason: "Verifies top-tier 780 Equifax credit score, supporting qualification for Premier thresholds.",
      riskIfRemoved:
        "Underwriting models cannot approve high-balance programs without current bureau audit verification.",
      risk: "LOW",
    },
  },
  {
    id: "mortgage-5",
    title: "Redundant Loan Inquiry Log",
    category: "conversation",
    source: "Agent Workspace Memory",
    effectiveDate: "2026-07-19",
    verified: true,
    priority: "low",
    estimatedTokens: 290,
    content:
      "[System Memory Log]\nChecking home pre-approval brackets for Sarah Jenkins.\nCurrent DTI query is active on external database endpoints.",
    fallbackDecision: {
      action: "REMOVE",
      reason: "Unnecessary workspace telemetry log. Duplicates basic applicant tracking details without contributing facts.",
      riskIfRemoved: "None. Discarding trace noise improves reasoning deterministic compliance.",
      risk: "LOW",
    },
  },
  {
    id: "mortgage-6",
    title: "Promotional Auto Loan Circular",
    category: "marketing",
    source: "Marketing Campaign Manager",
    effectiveDate: "2026-05-15",
    verified: true,
    priority: "low",
    estimatedTokens: 220,
    content: "• Financing offers for summer automobile purchases.\n• Interest rate starting at 2.9% APR for eligible prime borrowers.",
    fallbackDecision: {
      action: "REMOVE",
      reason: "Ad flyer for auto financing. Entirely irrelevant to mortgage qualifications.",
      riskIfRemoved: "None. Removing unrelated promotions protects context safety and model focus.",
      risk: "LOW",
    },
  },
];

export const MORTGAGE_BASELINE_RESPONSE =
  "Based on archived underwriting rules, your maximum allowed Debt-to-Income (DTI) limit is 43%, and your home pre-approval request is declined because your DTI is currently 45%.";

export const MORTGAGE_EXPECTED_OPTIMIZED_FACTS = [
  "Applicant qualifies for up to 50% DTI as a Premier tier member (current DTI is 45%)",
  "Pre-approval balance is available up to $750,000 under 2026 guidelines",
  "Legacy 2023 handbook (43% cap, $450,000 limit) is superseded and must not be used",
];

export const MORTGAGE_EXPECTED_OPTIMIZED_RESPONSE =
  "Great news! You qualify for the home pre-approval loan program! Under the Current Underwriting Guidelines (v2026.4), applicant Sarah Jenkins is eligible for an expanded Debt-to-Income (DTI) ratio limit of up to 50% as a Premier tier member. Since your active back-end DTI ratio is verified at 45% (and supported by an excellent 780 Equifax credit score), your pre-approval request is officially approved for a balance of up to $750,000.";

export const MORTGAGE_FALLBACK_CONFLICTS: ContextConflict[] = [
  {
    id: "mortgage-conflict-1",
    title: "Debt-to-Income (DTI) Limit Discrepancy",
    blockIds: ["mortgage-1", "mortgage-2"],
    blockAValue: "Premier applicants qualify for up to 50% DTI",
    blockBValue: "DTI is capped strictly at 43% for all tiers",
    description:
      "Underwriting Board (v2026.4) allows Premier applicants up to 50% DTI, while Underwriting Archive (v2023.2) caps DTI strictly at 43% for all tiers. These limits directly contradict each other.",
    resolution: "Prioritize Current Underwriting Guidelines (v2026.4). Retire Legacy Mortgage Handbook (v2023.2).",
    severity: "HIGH",
  },
  {
    id: "mortgage-conflict-2",
    title: "Pre-approval Balance Cap Variation",
    blockIds: ["mortgage-1", "mortgage-2"],
    blockAValue: "Pre-approval Platinum Premier capped at $750,000",
    blockBValue: "Pre-approval cap restricted to $450,000",
    description:
      "Underwriting Board (v2026.4) sets the Platinum Premier pre-approval cap at $750,000, while Underwriting Archive (v2023.2) restricts pre-approval to $450,000. These figures directly contradict each other.",
    resolution: "Prioritize 2026 Guideline threshold ($750k limit). Retire 2023 archived cap ($450k).",
    severity: "MEDIUM",
  },
];

export const MORTGAGE_SCENARIO: Scenario = {
  id: "mortgage-underwriting-conflict",
  title: "Mortgage Underwriting Contradiction",
  customerTask: "What is my maximum Debt-to-Income (DTI) limit, and do I qualify for the home pre-approval loan program?",
  contextBlocks: MORTGAGE_CONTEXT_BLOCKS,
  baselineResponse: MORTGAGE_BASELINE_RESPONSE,
  expectedOptimizedFacts: MORTGAGE_EXPECTED_OPTIMIZED_FACTS,
  fallbackConflicts: MORTGAGE_FALLBACK_CONFLICTS,
  expectedOptimizedResponse: MORTGAGE_EXPECTED_OPTIMIZED_RESPONSE,
  category: "Lending & Underwriting Copilot",
  riskType: "Superseded regulatory guidelines",
  traceId: "trace-2d3b4e-2026",
  modelName: "Gemini 2.5 Flash",
  timestamp: "2026-07-19T16:22:15-07:00",
};

export const CORPORATE_CONTEXT_BLOCKS: ContextBlock[] = [
  {
    id: "corp-1",
    title: "Travel Policy Handbook",
    category: "policy",
    source: "Corporate Operations (v2026.2)",
    effectiveDate: "2026-01-15",
    verified: true,
    priority: "critical",
    estimatedTokens: 480,
    content:
      "• Business class travel is authorized for international flights exceeding 6 hours in total duration.\n• Standard nightly hotel allowance for Tier 1 cities (including London) is $350.\n• Travel approval requests must be submitted at least 14 days prior.",
    fallbackDecision: {
      action: "KEEP",
      reason:
        "Contains 2026 Travel handbook terms permitting business class for international routes over 6 hours and setting a Tier 1 lodging cap of $350.",
      riskIfRemoved: "The assistant will enforce stale wellness and travel boundaries, resulting in incorrect expense denials.",
      risk: "LOW",
    },
  },
  {
    id: "corp-2",
    title: "Travel Guidelines Circular",
    category: "policy",
    source: "Internal Operations (v2022.1)",
    effectiveDate: "2022-03-01",
    supersededStatus: "Superseded by Travel Policy Handbook (2026)",
    verified: true,
    priority: "low",
    estimatedTokens: 390,
    content:
      "• Business class seating is strictly prohibited for all personnel under any circumstances.\n• Maximum nightly hotel stipend is capped at $150 across all metropolitan regions.",
    fallbackDecision: {
      action: "REMOVE",
      reason: "Stale 2022 Operations guideline prohibiting business class travel and capping hotel budgets at $150.",
      riskIfRemoved: "None. Removing this eliminates conflicting guidance on lodging and seating tiers.",
      risk: "LOW",
    },
  },
  {
    id: "corp-3",
    title: "Employee Profile: Marcus Vance",
    category: "customer_profile",
    source: "Workday HR Directory",
    effectiveDate: "2025-08-01",
    verified: true,
    priority: "critical",
    estimatedTokens: 190,
    content:
      "• Employee: Marcus Vance\n• Title: Vice President\n• Department: Business Development\n• Default Travel Route: JFK to LHR (7.5 hours flight duration)\n• Office Location: New York",
    fallbackDecision: {
      action: "KEEP",
      reason: "Identifies traveler Marcus Vance, VP, flying JFK to LHR (7.5-hour flight). Essential for duration-based policies.",
      riskIfRemoved: "The assistant cannot verify flight duration, preventing automatic business class qualification.",
      risk: "LOW",
    },
  },
  {
    id: "corp-4",
    title: "Corporate Travel Expense Ledger",
    category: "account_history",
    source: "Concur Expense System",
    effectiveDate: "2026-07-01",
    verified: true,
    priority: "medium",
    estimatedTokens: 210,
    content: "• Pre-authorized travel budget: $5,000.00\n• Card Status: Active\n• Lifetime approved expenses: $34,250.00",
    fallbackDecision: {
      action: "KEEP",
      reason: "Verifies travel credit card is active with adequate pre-authorized travel budget.",
      riskIfRemoved: "The assistant will fail to check active financial credentials before confirming travel.",
      risk: "LOW",
    },
  },
  {
    id: "corp-5",
    title: "Redundant Travel Conversation Slack Log",
    category: "conversation",
    source: "Agent Workspace Memory",
    effectiveDate: "2026-07-19",
    verified: true,
    priority: "low",
    estimatedTokens: 310,
    content:
      '[Dialogue Log]\n"Can I book business class? Let me check the old 2022 policy guide. Wait, is there a 2026 update?"\n"The traveler\'s destination is London, flying from JFK."',
    fallbackDecision: {
      action: "REMOVE",
      reason: "Redundant dialogue snippet repeating route details from slack workspace history.",
      riskIfRemoved: "None. Purging conversational duplicate streams saves tokens.",
      risk: "LOW",
    },
  },
  {
    id: "corp-6",
    title: "Office Wellness Gym Voucher",
    category: "marketing",
    source: "Benefits Directory (v3)",
    effectiveDate: "2026-01-01",
    verified: true,
    priority: "low",
    estimatedTokens: 170,
    content: "• Join the corporate health initiative.\n• Get up to 50% discount on partner fitness center memberships.",
    fallbackDecision: {
      action: "REMOVE",
      reason: "Wellness gym marketing voucher. Completely unrelated to corporate flight or lodging allowance parameters.",
      riskIfRemoved: "None. Discarding promotional noise eliminates model distraction.",
      risk: "LOW",
    },
  },
];

export const CORPORATE_BASELINE_RESPONSE =
  "Business class travel is strictly prohibited for all staff. Your nightly lodging expense is capped at $150.";

export const CORPORATE_EXPECTED_OPTIMIZED_FACTS = [
  "Business class is authorized for international flights exceeding 6 hours (Marcus Vance's JFK–LHR flight is 7.5 hours)",
  "Nightly hotel allowance for Tier 1 cities like London is $350",
  "Legacy 2022 circular (no business class, $150 cap) is superseded and must not be used",
];

export const CORPORATE_EXPECTED_OPTIMIZED_RESPONSE =
  "Yes, you are authorized to book a business class ticket for your flight from New York to London! Corporate Travel Policy (v2026.2) authorizes business class booking for international travel exceeding 6 hours, which applies to your 7.5-hour flight duration as a Vice President. Additionally, your nightly hotel stipend is verified at the updated City Tier 1 rate of $350.";

export const CORPORATE_FALLBACK_CONFLICTS: ContextConflict[] = [
  {
    id: "corp-conflict-1",
    title: "International Seating Eligibility Conflict",
    blockIds: ["corp-1", "corp-2"],
    blockAValue: "Business class authorized for flights over 6 hours",
    blockBValue: "Business class is strictly prohibited",
    description:
      "Corporate Operations (v2026.2) authorizes business class for international flights over 6 hours, while Internal Operations (v2022.1) prohibits business class strictly for all personnel. These policies directly contradict each other.",
    resolution: "Prioritize Travel Policy Handbook (v2026.2). Retire Legacy Travel Guidelines (v2022.1).",
    severity: "HIGH",
  },
  {
    id: "corp-conflict-2",
    title: "Nightly Lodging Allowance Variance",
    blockIds: ["corp-1", "corp-2"],
    blockAValue: "Lodging allowance for Tier 1 cities is $350",
    blockBValue: "Lodging stipend is capped at $150",
    description:
      "Corporate Operations (v2026.2) sets the Tier 1 city lodging allowance at $350, while Internal Operations (v2022.1) caps the stipend at $150 across all regions. These figures directly contradict each other.",
    resolution: "Prioritize 2026 City Tier 1 Limit ($350 hotel allowance). Retire 2022 standard limit ($150).",
    severity: "MEDIUM",
  },
];

export const CORPORATE_SCENARIO: Scenario = {
  id: "corporate-policy-conflict",
  title: "Corporate Travel Policy Inconsistency",
  customerTask: "Can I book a business class ticket for my flight to London, and what is the maximum nightly hotel allowance?",
  contextBlocks: CORPORATE_CONTEXT_BLOCKS,
  baselineResponse: CORPORATE_BASELINE_RESPONSE,
  expectedOptimizedFacts: CORPORATE_EXPECTED_OPTIMIZED_FACTS,
  fallbackConflicts: CORPORATE_FALLBACK_CONFLICTS,
  expectedOptimizedResponse: CORPORATE_EXPECTED_OPTIMIZED_RESPONSE,
  category: "Enterprise Knowledge Assistant",
  riskType: "Contradictory internal bylaws",
  traceId: "trace-4e5f6g-2026",
  modelName: "Gemini 2.5 Flash",
  timestamp: "2026-07-19T16:34:02-07:00",
};

export const ALL_SCENARIOS: Scenario[] = [BANKING_SCENARIO, MORTGAGE_SCENARIO, CORPORATE_SCENARIO];

/**
 * Identifies which shipped scenario a set of context blocks belongs to, by
 * overlap of block IDs. Used when a caller (e.g. the studio-web frontend)
 * doesn't send a scenarioId at all — it only ever round-trips whichever
 * blocks it got from GET /api/scenarios/:id, so ID overlap is a reliable signal.
 */
export function inferScenarioId(blocks: ContextBlock[]): string | undefined {
  const submittedIds = new Set(blocks.map((b) => b.id));
  let best: { id: string; overlap: number } | undefined;

  for (const scenario of ALL_SCENARIOS) {
    const overlap = scenario.contextBlocks.filter((b) => submittedIds.has(b.id)).length;
    if (overlap > 0 && (!best || overlap > best.overlap)) {
      best = { id: scenario.id, overlap };
    }
  }

  return best?.id;
}
