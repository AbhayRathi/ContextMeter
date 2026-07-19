import type { ContextBlock, Scenario } from "./types.js";

export const BANKING_CONTEXT_BLOCKS: ContextBlock[] = [
  {
    id: "policy-2026",
    title: "Current Overdraft & Wire Policy (2026)",
    category: "policy",
    content:
      "Effective January 1, 2026. Platinum customers are eligible for one overdraft-fee waiver every 90 days. The current standard wire-transfer limit is $10,000 per transaction. This policy supersedes all prior policies dated before 2026.",
    source: "Policy Management System",
    effectiveDate: "2026-01-01",
    estimatedTokens: 65,
    verified: true,
    priority: "critical",
  },
  {
    id: "policy-2024",
    title: "Outdated Overdraft & Wire Policy (2024)",
    category: "policy",
    content:
      "Effective January 1, 2024. No overdraft-fee waivers are permitted under any circumstances. The standard wire-transfer limit is $5,000 per transaction.",
    source: "Policy Management System (archived)",
    effectiveDate: "2024-01-01",
    expiresAt: "2025-12-31",
    estimatedTokens: 52,
    verified: false,
    priority: "low",
  },
  {
    id: "customer-profile",
    title: "Customer Profile",
    category: "customer_profile",
    content:
      "Customer: Jane Doe. Account tier: Platinum. Account status: Good standing. Member since: 2018. No pending disputes or flags.",
    source: "Core Banking System",
    effectiveDate: "2024-06-01",
    estimatedTokens: 42,
    verified: true,
    priority: "critical",
  },
  {
    id: "account-history",
    title: "Account History — Recent Transactions",
    category: "account_history",
    content:
      "Last overdraft-fee waiver granted: 120 days ago. No overdraft waivers requested in the last 30 days. Account balance: positive. No recent wire transfers.",
    source: "Transaction History Service",
    effectiveDate: "2026-07-01",
    estimatedTokens: 48,
    verified: true,
    priority: "critical",
  },
  {
    id: "duplicate-conversation",
    title: "Prior Conversation Summary (Duplicate)",
    category: "conversation",
    content:
      "The customer previously asked about overdraft policies and wire-transfer limits. The agent confirmed the customer is a Platinum member in good standing. This information is already present in the customer profile and account history blocks.",
    source: "Conversation History Service",
    estimatedTokens: 58,
    verified: true,
    priority: "low",
  },
  {
    id: "marketing-promo",
    title: "Credit Card Promotion — Summer 2026",
    category: "marketing",
    content:
      "Earn 3x points on travel purchases with the Platinum Rewards card this summer. Apply online or in branch. Annual fee: $95. Offer expires August 31, 2026. Terms and conditions apply.",
    source: "Marketing Campaign System",
    effectiveDate: "2026-06-01",
    expiresAt: "2026-08-31",
    estimatedTokens: 52,
    verified: false,
    priority: "low",
  },
];

export const BANKING_BASELINE_RESPONSE =
  "Unfortunately, we are unable to waive your overdraft fee at this time. Your current wire-transfer limit is $5,000 per transaction. If you have further questions, please contact customer support.";

export const BANKING_EXPECTED_OPTIMIZED_FACTS = [
  "Customer is eligible for overdraft-fee waiver (last waiver was 120 days ago, policy requires 90 days)",
  "Current wire-transfer limit is $10,000 per transaction",
  "Platinum tier customers receive one waiver per 90-day period",
];

export const BANKING_SCENARIO: Scenario = {
  id: "banking-policy-conflict",
  title: "Banking Policy Conflict — Overdraft & Wire Transfer",
  customerTask:
    "Can you waive my overdraft fee, and what is my current wire-transfer limit?",
  contextBlocks: BANKING_CONTEXT_BLOCKS,
  baselineResponse: BANKING_BASELINE_RESPONSE,
  expectedOptimizedFacts: BANKING_EXPECTED_OPTIMIZED_FACTS,
};

export const ALL_SCENARIOS: Scenario[] = [BANKING_SCENARIO];
