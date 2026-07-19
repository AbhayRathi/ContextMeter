import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App.js";
import * as api from "../api.js";
import { BANKING_SCENARIO } from "@context-meter/shared";

vi.mock("../api.js");

const mockScenario = BANKING_SCENARIO;

const mockAnalysis = {
  decisions: [
    { blockId: "policy-2026", action: "KEEP" as const, reason: "Current policy", risk: "LOW" as const },
    { blockId: "policy-2024", action: "REMOVE" as const, reason: "Stale", risk: "LOW" as const },
    { blockId: "customer-profile", action: "KEEP" as const, reason: "Critical", risk: "LOW" as const },
    { blockId: "account-history", action: "KEEP" as const, reason: "Critical", risk: "LOW" as const },
    { blockId: "duplicate-conversation", action: "REMOVE" as const, reason: "Duplicate", risk: "LOW" as const },
    { blockId: "marketing-promo", action: "REMOVE" as const, reason: "Irrelevant", risk: "LOW" as const },
  ],
  conflicts: [
    {
      id: "conflict-1",
      blockIds: ["policy-2024", "policy-2026"],
      description: "Policy conflict",
      resolution: "Use 2026 policy",
      severity: "HIGH" as const,
    },
  ],
  optimizedContextIds: ["policy-2026", "customer-profile", "account-history"],
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
    expect(screen.getByText(/Synthetic banking data/i)).toBeInTheDocument();
  });

  it("loads a scenario", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Load Failed Trace"));
    await waitFor(() => {
      expect(api.fetchScenario).toHaveBeenCalledWith("banking-policy-conflict");
    });
    await waitFor(() => {
      expect(screen.getByText(/Context Blocks/)).toBeInTheDocument();
    });
  });

  it("displays context cards after loading", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Load Failed Trace"));
    await waitFor(() => {
      expect(screen.getByText("Current Overdraft & Wire Policy (2026)")).toBeInTheDocument();
    });
  });

  it("runs analysis after loading", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Load Failed Trace"));
    await waitFor(() => screen.getByText(/Analyze Context/));
    fireEvent.click(screen.getByText("Analyze Context"));
    await waitFor(() => {
      expect(api.analyzeContext).toHaveBeenCalled();
    });
  });

  it("replays agent after optimization", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Load Failed Trace"));
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
    fireEvent.click(screen.getByText("Load Failed Trace"));
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
    fireEvent.click(screen.getByText("Load Failed Trace"));
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
