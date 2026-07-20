import type { EvaluationResult, EvaluationSummary } from "./types.js";

export interface EvaluationTest {
  id: string;
  label: string;
  test: (response: string) => boolean;
  explanation: (passed: boolean) => string;
  /** Fixed description of what the known baseline response does on this test, e.g. "FAILED — Claimed limit is $5,000". */
  baselineResult?: string;
  /** "PASSED — .../FAILED — ..." style label for whichever response is currently being evaluated. */
  resultLabel?: (passed: boolean) => string;
}

export const BANKING_EVALUATION_TESTS: EvaluationTest[] = [
  {
    id: "eval-1",
    label: "Mentions $10,000 wire limit",
    // Accept US-formatted "$10,000" or bare "10000"; reject "$10.000" (European format)
    test: (r) => /\$10,000|\$10000|10,000\s*(?:dollars?|per)|10000\s*(?:dollars?|per)/i.test(r),
    explanation: () => "Evaluates if the replayed answer cites the current $10,000 wire limit.",
    baselineResult: "FAILED — Claimed limit is $5,000",
    resultLabel: (passed) =>
      passed ? "PASSED — Stated limit is $10,000" : "FAILED — Did not state the $10,000 limit",
  },
  {
    id: "eval-2",
    label: "Does not treat $5,000 as limit",
    test: (r) => !/\$5,000|\$5000|5,000\s*(?:dollars?|per)|5000\s*(?:dollars?|per)/i.test(r),
    explanation: () => "Ensures the agent does not output or reinforce the outdated $5,000 limit.",
    baselineResult: "FAILED — Used outdated limit ($5,000)",
    resultLabel: (passed) =>
      passed ? "PASSED — Stale value was omitted entirely" : "FAILED — Referenced the outdated $5,000 limit",
  },
  {
    id: "eval-3",
    label: "Qualifies customer for fee waiver",
    test: (r) => {
      const hasNegation = /not eligible|unable to|cannot waive|declined|rejected/i.test(r);
      const hasPositive = /(eligible|qualify|qualifies|can waive|waiver.*grant|grant.*waiver|approved|approve)/i.test(r);
      return hasPositive && !hasNegation;
    },
    explanation: () => "Verifies the final answer explicitly states that the customer qualifies for a fee waiver.",
    baselineResult: "FAILED — Rejected waiver request",
    resultLabel: (passed) =>
      passed ? "PASSED — Confirmed waiver eligibility" : "FAILED — Did not confirm waiver eligibility",
  },
  {
    id: "eval-4",
    label: "Applies 90-day waiver rule",
    test: (r) => /90[\s-]?day/i.test(r),
    explanation: () => "Checks if the answer bases waiver eligibility on the 90-day Platinum cycle.",
    baselineResult: 'FAILED — Cited "no waivers allowed"',
    resultLabel: (passed) =>
      passed ? "PASSED — Correctly cited 90-day Platinum eligibility" : "FAILED — Did not cite the 90-day policy",
  },
  {
    id: "eval-5",
    label: "Uses 120-day customer history",
    test: (r) => /120[\s-]?day/i.test(r),
    explanation: () => "Confirms checking that previous waiver was 120 days ago (meaning > 90 days, qualifying).",
    baselineResult: "FAILED — Ignored previous transaction history",
    resultLabel: (passed) =>
      passed ? "PASSED — Verified 120 days since previous waiver" : "FAILED — Did not reference the 120-day history",
  },
  {
    id: "eval-6",
    label: "Discards legacy 2024 policy",
    test: (r) => {
      const referencesYear = /2024.*policy|policy.*2024/i.test(r);
      const usesBlankBan = /no.*waiver.*permitted/i.test(r);
      const usesAbsoluteIneligibility = /not.*eligible.*waiver.*circumstance/i.test(r);
      return !(referencesYear || usesBlankBan || usesAbsoluteIneligibility);
    },
    explanation: () => "Confirms that the response did not integrate any elements of the superseded Archived Policy.",
    baselineResult: "FAILED — Relying on legacy policy v2024.3",
    resultLabel: (passed) =>
      passed ? "PASSED — Completely ignored legacy policy" : "FAILED — Relied on the superseded 2024 policy",
  },
];

export const MORTGAGE_EVALUATION_TESTS: EvaluationTest[] = [
  {
    id: "mortgage-eval-1",
    label: "Mentions 50% DTI limit",
    test: (r) => /50%/i.test(r),
    explanation: () => "Evaluates if the replayed answer cites the current 50% limit for Premier members.",
    baselineResult: "FAILED — Claimed DTI is capped at 43%",
    resultLabel: (passed) =>
      passed ? "PASSED — Cited 50% Premier limit" : "FAILED — Did not cite the 50% Premier limit",
  },
  {
    id: "mortgage-eval-2",
    label: "Does not apply 43% DTI cap",
    test: (r) => !/43%/i.test(r),
    explanation: () => "Ensures the agent does not output or reinforce the outdated 43% handbook rule.",
    baselineResult: "FAILED — Applied legacy 43% limit",
    resultLabel: (passed) =>
      passed ? "PASSED — Stale guideline omitted entirely" : "FAILED — Referenced the outdated 43% cap",
  },
  {
    id: "mortgage-eval-3",
    label: "Confirms pre-approval approval",
    test: (r) => /(approved|qualify|qualifies|granted)/i.test(r),
    explanation: () => "Verifies the final answer explicitly states that the applicant qualifies and is approved.",
    baselineResult: "FAILED — Declined the mortgage request",
    resultLabel: (passed) =>
      passed ? "PASSED — Pre-approval successfully approved" : "FAILED — Did not confirm pre-approval",
  },
  {
    id: "mortgage-eval-4",
    label: "Applies 2026 Premier tier waiver rules",
    test: (r) => /premier/i.test(r),
    explanation: () => "Checks if the answer bases mortgage eligibility on 2026 Premier tier brackets.",
    baselineResult: "FAILED — Cited 2023 general rules",
    resultLabel: (passed) =>
      passed ? "PASSED — Applied correct 2026 tier rules" : "FAILED — Did not apply Premier tier rules",
  },
  {
    id: "mortgage-eval-5",
    label: "Cites applicant 45% current DTI",
    test: (r) => /45%/i.test(r),
    explanation: () => "Confirms checking that applicant current DTI is 45% (which is < 50% allowed).",
    baselineResult: "FAILED — Ignored CRM applicant record",
    resultLabel: (passed) =>
      passed ? "PASSED — Confirmed 45% DTI is within 50% cap" : "FAILED — Did not cite the applicant's 45% DTI",
  },
  {
    id: "mortgage-eval-6",
    label: "Discards stale 2023 mortgage handbook",
    test: (r) => !(/43%/i.test(r) || /2023/i.test(r) || /declined/i.test(r)),
    explanation: () => "Confirms that the response did not integrate any elements of the superseded 2023 handbook.",
    baselineResult: "FAILED — Relying on legacy mortgage handbook",
    resultLabel: (passed) =>
      passed ? "PASSED — Completely ignored legacy handbook" : "FAILED — Relied on the superseded 2023 handbook",
  },
];

export const CORPORATE_EVALUATION_TESTS: EvaluationTest[] = [
  {
    id: "corp-eval-1",
    label: "Mentions business class authorization",
    test: (r) => /business class/i.test(r) && /authoriz/i.test(r),
    explanation: () => "Evaluates if the replayed answer cites business class is authorized for flights > 6 hours.",
    baselineResult: "FAILED — Claimed business class is strictly prohibited",
    resultLabel: (passed) =>
      passed ? "PASSED — Cites travel authorization for flights > 6 hours" : "FAILED — Did not cite business class authorization",
  },
  {
    id: "corp-eval-2",
    label: "Discards obsolete $150 hotel cap",
    test: (r) => !/\$150/i.test(r),
    explanation: () => "Ensures the agent does not output or reinforce the outdated 2022 hotel allowance.",
    baselineResult: "FAILED — Applied obsolete $150 hotel limit",
    resultLabel: (passed) =>
      passed ? "PASSED — Stale hotel limit was omitted entirely" : "FAILED — Referenced the outdated $150 hotel cap",
  },
  {
    id: "corp-eval-3",
    label: "Verifies route duration exceeds 6 hours",
    test: (r) => /6[\s-]?hour/i.test(r),
    explanation: () => "Verifies the final answer references traveler route exceeds 6 hours (JFK to LHR 7.5 hours).",
    baselineResult: "FAILED — Omitted flight route duration check",
    resultLabel: (passed) =>
      passed ? "PASSED — Verified flight exceeds 6 hours limit" : "FAILED — Did not verify the 6-hour flight duration rule",
  },
  {
    id: "corp-eval-4",
    label: "Restores correct $350 lodging allowance",
    test: (r) => /\$350/i.test(r),
    explanation: () => "Checks if the answer restores the current $350 lodging allowance rate for London.",
    baselineResult: "FAILED — Standard $150 cap applied",
    resultLabel: (passed) =>
      passed ? "PASSED — Cites standard city allowance of $350" : "FAILED — Did not cite the $350 lodging allowance",
  },
  {
    id: "corp-eval-5",
    label: "Cites Marcus Vance VP credentials",
    test: (r) => /vice president|\bVP\b/i.test(r),
    explanation: () => "Confirms checking that the employee is Vice President of Business Development.",
    baselineResult: "FAILED — Ignored employee Workday folder details",
    resultLabel: (passed) =>
      passed ? "PASSED — Verified Marcus Vance credentials" : "FAILED — Did not verify VP credentials",
  },
  {
    id: "corp-eval-6",
    label: "Excludes deprecated travel guidelines",
    test: (r) => !(/\$150/i.test(r) || /2022/i.test(r) || /strictly prohibited/i.test(r)),
    explanation: () => "Confirms that the response did not integrate any elements of the superseded 2022 circular.",
    baselineResult: "FAILED — Relying on legacy 2022 guidelines",
    resultLabel: (passed) =>
      passed ? "PASSED — Completely ignored legacy travel circular" : "FAILED — Relied on the superseded 2022 circular",
  },
];

export const EVALUATION_TESTS_BY_SCENARIO: Record<string, EvaluationTest[]> = {
  "banking-policy-conflict": BANKING_EVALUATION_TESTS,
  "mortgage-underwriting-conflict": MORTGAGE_EVALUATION_TESTS,
  "corporate-policy-conflict": CORPORATE_EVALUATION_TESTS,
};

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
