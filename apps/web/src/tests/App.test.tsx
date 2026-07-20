import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App.js";
import * as api from "../api.js";
import { BANKING_SCENARIO } from "@context-meter/shared";

vi.mock("../api.js");

const mockScenario = BANKING_SCENARIO;
const mockScenarioList = [{ id: BANKING_SCENARIO.id, title: BANKING_SCENARIO.title }];

const mockAnalysis = {
  decisions: [
    { blockId: "block-1", action: "KEEP" as const, reason: "Current policy", risk: "LOW" as const },
    { blockId: "block-2", action: "REMOVE" as const, reason: "Stale", risk: "LOW" as const },
    { blockId: "block-3", action: "KEEP" as const, reason: "Critical", risk: "LOW" as const },
    { blockId: "block-4", action: "KEEP" as const, reason: "Critical", risk: "LOW" as const },
    { blockId: "block-5", action: "REMOVE" as const, reason: "Duplicate", risk: "LOW" as const },
    { blockId: "block-6", action: "REMOVE" as const, reason: "Irrelevant", risk: "LOW" as const },
  ],
  conflicts: [
    {
      id: "conflict-1",
      blockIds: ["block-2", "block-1"],
      description: "Policy conflict",
      resolution: "Use 2026 policy",
      severity: "HIGH" as const,
      title: "Wire-Transfer Limit Contradiction",
      blockAValue: "Wire-transfer limit is $10,000",
      blockBValue: "Wire-transfer limit is $5,000",
    },
  ],
  optimizedContextIds: ["block-1", "block-3", "block-4"],
  summary: "Removed 3 blocks",
  baselineEstimatedTokens: 317,
  optimizedEstimatedTokens: 155,
  mode: "fallback" as const,
};

const mockReplay = {
  response:
    "You are eligible for an overdraft-fee waiver. Your last waiver was 120 days ago and the 90-day policy applies. Your wire-transfer limit is $10,000.",
  estimatedInputTokens: 155,
  evaluation: {
    passed: 6,
    total: 6,
    score: 1,
    results: [
      { id: "test-1", label: "Test 1", passed: true, explanation: "OK" },
    ],
  },
  mode: "fallback" as const,
};

describe("App workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchScenarios).mockResolvedValue(mockScenarioList);
    vi.mocked(api.fetchScenario).mockResolvedValue(mockScenario);
    vi.mocked(api.analyzeContext).mockResolvedValue(mockAnalysis);
    vi.mocked(api.replayAgent).mockResolvedValue(mockReplay);
  });

  it("renders header", () => {
    render(<App />);
    expect(screen.getByText("ContextMeter")).toBeInTheDocument();
    expect(
      screen.getByText(/Know what your AI agent knows/)
    ).toBeInTheDocument();
  });

  it("shows synthetic data notice", () => {
    render(<App />);
    expect(screen.getByText(/Synthetic demo data/i)).toBeInTheDocument();
  });

  it("lists scenarios to choose from", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(BANKING_SCENARIO.title)).toBeInTheDocument();
    });
  });

  it("loads a scenario", async () => {
    render(<App />);
    await waitFor(() => screen.getByText(BANKING_SCENARIO.title));
    fireEvent.click(screen.getByText(BANKING_SCENARIO.title));
    await waitFor(() => {
      expect(api.fetchScenario).toHaveBeenCalledWith("banking-policy-conflict");
    });
    await waitFor(() => {
      expect(screen.getByText(/Context Blocks/)).toBeInTheDocument();
    });
  });

  it("displays context cards after loading", async () => {
    render(<App />);
    await waitFor(() => screen.getByText(BANKING_SCENARIO.title));
    fireEvent.click(screen.getByText(BANKING_SCENARIO.title));
    await waitFor(() => {
      expect(screen.getByText("Current Consumer Banking Policy")).toBeInTheDocument();
    });
  });

  it("runs analysis after loading", async () => {
    render(<App />);
    await waitFor(() => screen.getByText(BANKING_SCENARIO.title));
    fireEvent.click(screen.getByText(BANKING_SCENARIO.title));
    await waitFor(() => screen.getByText(/Analyze Context/));
    fireEvent.click(screen.getByText("Analyze Context"));
    await waitFor(() => {
      expect(api.analyzeContext).toHaveBeenCalledWith(
        "banking-policy-conflict",
        mockScenario.customerTask,
        mockScenario.contextBlocks
      );
    });
  });

  it("replays agent after optimization", async () => {
    render(<App />);
    await waitFor(() => screen.getByText(BANKING_SCENARIO.title));
    fireEvent.click(screen.getByText(BANKING_SCENARIO.title));
    await waitFor(() => screen.getByText("Analyze Context"));
    fireEvent.click(screen.getByText("Analyze Context"));
    await waitFor(() => screen.getByText("Apply Optimization"));
    fireEvent.click(screen.getByText("Apply Optimization"));
    fireEvent.click(screen.getByText("Replay Agent"));
    await waitFor(() => {
      expect(api.replayAgent).toHaveBeenCalled();
    });
  });

  it("displays evaluation results after replay", async () => {
    render(<App />);
    await waitFor(() => screen.getByText(BANKING_SCENARIO.title));
    fireEvent.click(screen.getByText(BANKING_SCENARIO.title));
    await waitFor(() => screen.getByText("Analyze Context"));
    fireEvent.click(screen.getByText("Analyze Context"));
    await waitFor(() => screen.getByText("Apply Optimization"));
    fireEvent.click(screen.getByText("Apply Optimization"));
    fireEvent.click(screen.getByText("Replay Agent"));
    await waitFor(() => {
      expect(screen.getByText(/Evaluation Results/)).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    vi.mocked(api.fetchScenario).mockRejectedValue(new Error("Network error"));
    render(<App />);
    await waitFor(() => screen.getByText(BANKING_SCENARIO.title));
    fireEvent.click(screen.getByText(BANKING_SCENARIO.title));
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
