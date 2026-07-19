import type { EvaluationResult, EvaluationSummary } from "./types.js";

export interface EvaluationTest {
  id: string;
  label: string;
  test: (response: string) => boolean;
  explanation: (passed: boolean) => string;
}

export const BANKING_EVALUATION_TESTS: EvaluationTest[] = [
  {
    id: "mentions-10000-limit",
    label: "Mentions current wire-transfer limit of $10,000",
    // Accept US-formatted "$10,000" or bare "10000"; reject "$10.000" (European format)
    test: (r) => /\$10,000|\$10000|10,000\s*(?:dollars?|per)|10000\s*(?:dollars?|per)/i.test(r),
    explanation: (passed) =>
      passed
        ? "Response correctly states the current wire-transfer limit of $10,000."
        : "Response does not mention the current wire-transfer limit of $10,000.",
  },
  {
    id: "does-not-claim-5000",
    label: "Does not claim the wire-transfer limit is $5,000",
    // Reject US-formatted "$5,000" or bare "5000" when used as a limit value
    test: (r) => !/\$5,000|\$5000|5,000\s*(?:dollars?|per)|5000\s*(?:dollars?|per)/i.test(r),
    explanation: (passed) =>
      passed
        ? "Response does not reference the outdated $5,000 limit."
        : "Response incorrectly claims the wire-transfer limit is $5,000 (outdated 2024 policy).",
  },
  {
    id: "eligible-for-waiver",
    label: "States that the customer qualifies for an overdraft-fee waiver",
    test: (r) =>
      /(eligible|qualify|qualifies|can waive|waiver.*grant|grant.*waiver|approved|approve)/i.test(r),
    explanation: (passed) =>
      passed
        ? "Response correctly states the customer is eligible for an overdraft-fee waiver."
        : "Response does not state that the customer qualifies for a waiver.",
  },
  {
    id: "uses-90-day-policy",
    label: "References the 90-day waiver policy",
    test: (r) => /90[\s-]?day/i.test(r),
    explanation: (passed) =>
      passed
        ? "Response correctly references the 90-day waiver eligibility window."
        : "Response does not reference the 90-day waiver policy.",
  },
  {
    id: "uses-120-day-history",
    label: "Acknowledges that the last waiver was 120 days ago",
    test: (r) => /120[\s-]?day/i.test(r),
    explanation: (passed) =>
      passed
        ? "Response correctly acknowledges that the last waiver was 120 days ago."
        : "Response does not reference the 120-day history.",
  },
  {
    id: "does-not-use-2024-policy",
    label: "Does not rely on the outdated 2024 policy",
    test: (r) => {
      // Check for each characteristic phrase of the superseded 2024 policy separately
      // for clarity and easier future maintenance.
      const referencesYear = /2024.*policy|policy.*2024/i.test(r);
      const usesBlankBan = /no.*waiver.*permitted/i.test(r);
      const usesAbsoluteIneligibility =
        /not.*eligible.*waiver.*circumstance/i.test(r);
      return !(referencesYear || usesBlankBan || usesAbsoluteIneligibility);
    },
    explanation: (passed) =>
      passed
        ? "Response does not rely on the superseded 2024 policy."
        : "Response appears to rely on the outdated 2024 policy.",
  },
];

export function evaluateResponse(
  response: string,
  tests: EvaluationTest[] = BANKING_EVALUATION_TESTS
): EvaluationSummary {
  const results: EvaluationResult[] = tests.map((t) => {
    const passed = t.test(response);
    return {
      id: t.id,
      label: t.label,
      passed,
      explanation: t.explanation(passed),
    };
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const score = total > 0 ? passed / total : 0;

  return { passed, total, score, results };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function sumTokens(blocks: Array<{ estimatedTokens: number }>): number {
  return blocks.reduce((sum, b) => sum + b.estimatedTokens, 0);
}
